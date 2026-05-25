# AI Changelog

## 2026-05-24 — Configuração do Programa de Pontos no padrão de Usuário
- Arquivos alterados: `public/js/modules/marketing.js`, `js/modules/marketing.js`, `public/admin.html`, `admin.html`, `AI_CHANGELOG.md`.
- A tela `Programa de Pontos > Configuração` foi reorganizada no padrão visual usado em `Configurações > Usuário`, com card principal mais limpo, campos off-white, bordas suaves, sombra leve e rodapé de salvamento mais alinhado.
- Os blocos `Identidade do programa`, `Ganho de pontos`, `Resgate` e `Validade e aplicação` ficaram mais compactos, com campos curtos ocupando apenas o espaço necessário e melhor hierarquia entre labels, ajuda e prévia.
- A prévia do programa foi mantida dentro da configuração, mas com visual mais leve e menos técnico, preservando os mesmos IDs e atualização em tempo real.
- Ajuste posterior: a primeira versão ficou visualmente pesada; a tela foi simplificada para ficar mais fiel à aba `Usuário`, com um único painel interno, menos elementos gráficos, labels mais leves e rodapé usando `bf-actions-row`.
- Ajuste posterior: removidos os chips totalizadores do topo do `Programa de Pontos` (`clientes com pontos`, `pontos em circulação` e `elegíveis`) para deixar o cabeçalho mais limpo.
- Ajuste posterior: o card interno `Programa de pontos` ficou mais compacto, com menos padding/espaçamento e o campo `Pontos por €1 gasto` passou a exibir `€1` como referência visual de moeda, mantendo o valor salvo como pontos.
- A aba `Clientes e movimentos` passou a seguir melhor o padrão de listagem: filtros compactos, campos off-white, botão `Limpar filtros` condicional e listagem de clientes como visão principal.
- A lista separada de `Movimentos recentes` foi removida da aba; os movimentos agora ficam concentrados no modal `Detalhe do cliente`, aberto pela ação `Ver` na lista de clientes.
- O modal `Detalhe do cliente` foi refinado no padrão documentado de modais do Admin, com cards mais leves, hierarquia melhor e histórico/pedidos relacionados dentro do detalhe do cliente.
- Ajuste posterior: dentro do modal `Detalhe do cliente`, `Histórico recente` e `Pedidos relacionados` passaram a aparecer como abas internas, reduzindo a altura do modal e agrupando melhor as informações.
- O template público da loja passou a exibir no modal de pontos também as regras de mínimo para resgate, limite de desconto por pedido e validade dos pontos, usando o idioma configurado da loja.
- Impacto esperado: a configuração do programa fica mais premium e consistente com o padrão BocaFood sem alterar Firebase, rotas, permissões, estrutura de dados ou lógica de salvamento.

## 2026-05-24 — Refinamento do modal de Upsell em Ações de vendas
- Arquivos alterados: `public/js/modules/marketing.js`, `js/modules/marketing.js`, `public/index.html`, `public/admin.html`, `admin.html`, `AI_CHANGELOG.md`.
- O modal de criação, edição e visualização de regras de upsell foi refinado no padrão visual de modais do Admin, com shell mais premium, fundo off-white, cabeçalho com hierarquia melhor, cards internos com degradê sutil e campos off-white.
- A nomenclatura visível do modal deixou de usar `sugestão` e passou a usar `upsell` em títulos, benefícios, mensagens de validação, duplicação, exclusão e textos de apoio do modal.
- Após conferência pela captura, a listagem da aba também passou a exibir `Upsells`/`Novo upsell`/`Total de upsells` nos textos visíveis, preservando a estrutura e os cards KPI.
- A listagem da aba `Upsell` foi alinhada ao padrão documentado de páginas de listagem do Admin: topo em 22px, KPIs preservados, card de filtros com fundo off-white, selects com seta padrão, botão `Limpar filtros` apenas quando necessário, tabela mais limpa e paginação no rodapé.
- Os tipos de upsell ficaram visualmente mais limpos, sem siglas grandes, e a seleção passou a manter estado visual coerente ao trocar o tipo.
- Refinamento posterior: o modal de upsell passou a seguir o padrão documentado de modais do Admin de forma mais literal, com cards em degradê suave, ícones discretos, textos de apoio curtos, campos proporcionais ao conteúdo, selects com seta do padrão e agrupamento mais compacto em desktop.
- A visualização/detalhes do upsell também recebeu o mesmo padrão visual: topo com resumo, chips leves, tiles proporcionais, blocos de período/local, preço/benefício/impacto/margem e mensagem ao cliente em card off-white.
- Correção visual posterior: o elemento gráfico do card `Resumo de vendas` foi contido em tamanho fixo, com overflow protegido e ícone mais estável, evitando que saia do card.
- A relação entre `Locais de exibição` e `Momento da exibição` foi protegida: quando o upsell não aparece no carrinho, o momento fica travado em `Ao acionar o gatilho`; quando inclui carrinho, a usuária pode escolher entre gatilho e clique no WhatsApp.
- O template público passou a respeitar o momento configurado para upsells de carrinho: regras de gatilho aparecem durante o fluxo do carrinho e regras configuradas para WhatsApp aparecem antes do envio do pedido.
- O campo `Valor do desconto` do benefício `Desconto em €` passou a aparecer como campo de moeda, com prefixo `€`, preservando o mesmo ID e salvamento.
- Em `Configurações da regra`, `Locais de exibição` passou a aparecer antes de `Momento da exibição`; as datas receberam regras visuais e validação para impedir início antes de hoje e fim anterior ao início.
- A ajuda do campo de momento foi simplificada e o card recebeu um botão discreto `Como preencher?` com explicação colapsável sobre produto gatilho, locais, momento e datas.
- A opção `Popup do produto` foi removida da seleção de locais de exibição por duplicar o conceito de `Modal do produto`; regras antigas com `popup` continuam sendo interpretadas como modal do produto no Admin e no template público.
- `Locais de exibição` passou de múltipla seleção para lista com escolha única por upsell; regras antigas com mais de um local são normalizadas para um local ao salvar novamente.
- A label visível do local `detail` foi ajustada para `Popup do produto`, mantendo o valor interno e a compatibilidade com o template público.
- O campo `Locais de exibição` foi removido do modal de edição; agora o `Momento da exibição` define o comportamento: gatilho salva como popup do produto e WhatsApp salva como oferta antes do envio do pedido.
- Correção no template público: upsells configurados para WhatsApp deixam de disparar ao adicionar produto ao carrinho; o momento `Ao acionar o gatilho` fica restrito ao popup do produto e o momento `Ao clicar em enviar pelo WhatsApp` fica restrito ao envio do pedido.
- Validação das inteligências de análise: a performance do upsell passou a usar os pedidos salvos como fallback quando não houver eventos em `upsellEvents`, contando conversões, itens e receita extra por `upsellRuleId`/`upsellBenefits`.
- Corrigido o acumulador interno de receita da análise de upsell, evitando KPIs de faturamento/variação inconsistentes quando a base vem de eventos ou pedidos.
- Validação posterior da aba `Desempenho`: a inteligência agora combina eventos parciais com pedidos finalizados, sem descartar pedidos quando já existem eventos de exibição/clique, e evita duplicar conversões quando houver evento convertido com referência ao pedido.
- Os alertas dos cards de desempenho também foram ajustados para reconhecer vendas registradas via pedidos mesmo quando os eventos de exibição ainda não estão completos.
- O script do Admin teve o versionamento atualizado novamente e a cópia legada do módulo foi sincronizada para evitar carregamento antigo em ambiente local/cache.
- Impacto esperado: a configuração e a listagem de upsell ficam mais alinhadas ao padrão BocaFood e menos confusas para a usuária, sem alterar lógica, Firebase, rotas, permissões, estrutura de dados ou cards KPI.

## 2026-05-24 — Validação da aba Desempenho do Programa de Pontos
- Arquivos alterados: `public/js/modules/marketing.js`, `js/modules/marketing.js`, `AI_CHANGELOG.md`.
- Foi validada a inteligência da aba `Programa de Pontos > Desempenho`, que carrega `config/pontos_program`, `store_customers`, `orders` e `points_movements`, usando os movimentos para medir pontos gerados, pontos usados, clientes movimentados e elegibilidade.
- A leitura de datas dos movimentos ficou mais defensiva, aceitando timestamps com `toDate()`, número em milissegundos e objetos no formato `{ seconds, nanoseconds }`.
- O período personalizado passou a lidar corretamente com datas invertidas, evitando tela zerada quando a data final for menor que a inicial.
- O seletor de período da aba de desempenho passou a usar o mesmo padrão visual de select do Admin, com seta alinhada.
- Impacto esperado: os cards de desempenho do programa de pontos ficam mais confiáveis para movimentos reais e mais estáveis ao filtrar períodos, sem alterar Firebase, rotas, permissões ou estrutura de dados.

## 2026-05-24 — Correções de lógica em promoções, cupons e pedidos
- Arquivos alterados: `public/js/modules/marketing.js`, `js/modules/marketing.js`, `public/index.html`, `public/js/modules/pedidos.js`, `js/modules/pedidos.js`, `public/admin.html`, `admin.html`, `AI_CHANGELOG.md`.
- A listagem de `Ações de vendas > Promoções` passou a seguir o padrão visual de páginas de listagem do Admin: KPIs preservados, filtros em card com campos proporcionais, selects com seta alinhada, botão `Limpar filtros` apenas quando necessário, tabela mais limpa e paginação preservada.
- O versionamento do `marketing.js` no Admin foi atualizado para evitar cache antigo nessa listagem.
- Ajuste posterior: os cards de filtros de `Promoções` e `Cupons` foram alinhados de forma mais literal ao padrão documentado, sem cabeçalho interno no filtro, com campos off-white e botão `Limpar filtros` abaixo dos campos. A listagem de promoções também voltou ao card de tabela com borda `#EADFD8`, raio de 18px e título simples, sem contador competindo com a tabela.
- O modal de criação/edição de promoções foi reorganizado no padrão de cadastro do Admin, com formulário à esquerda, status/prévia/impacto à direita, campos com largura proporcional ao conteúdo e cards mais leves. Também foi removida a duplicidade visual do campo de valor mínimo no tipo `Frete grátis`, mantendo o mesmo campo salvo.
- Refinados os campos do modal de promoções: `Pedido mínimo` e `Valor do desconto` passaram a usar indicação visual de moeda, o ícone de frete grátis deixou de ser emoji, os sufixos `%` e `€` ficaram sem fundo/borda e a ajuda do `Leve X, pague Y` ficou mais discreta.
- Corrigido o travamento ao digitar em `Percentual de desconto` e `Valor do desconto`: o preview continua atualizando em tempo real, mas os campos não são mais recriados a cada tecla.
- O salvamento/ativação de promoções agora exige início e fim válidos, impede período anterior ao dia atual, bloqueia data final anterior à inicial e evita que o mesmo produto participe de duas promoções de produto no mesmo período.
- O modal de visualização de promoção foi refinado novamente para uma leitura mais leve: resumo compacto no topo, detalhes em tiles proporcionais, alertas discretos e impacto por produto sem layout em duas colunas.
- Corrigido o cálculo de impacto da promoção `Leve mais` no Admin para usar a mesma regra da loja pública: `leve` precisa ser maior que `pague`.
- A data final das promoções no Admin passou a considerar o dia inteiro, evitando que uma promoção expire visualmente no começo do último dia configurado.
- O frete grátis no template público agora respeita o pedido mínimo configurado na promoção antes de zerar a taxa de entrega.
- Os pedidos da loja pública passaram a salvar os metadados do frete grátis aplicado: `originalDeliveryFee`, `freeShippingApplied`, `freeShippingPromotionId`, `freeShippingPromotionName` e resumo da promoção. O detalhe do pedido no Admin agora mostra quando o frete foi zerado por promoção.
- Os cupons na loja pública passaram a respeitar limite máximo de uso e incrementam `usesCount` após o pedido ser salvo com desconto aplicado.
- O link público com cupom automático passou a aplicar o cupom pendente antes do cálculo do carrinho, e a leitura do código também aceita parâmetros no hash da URL além de `?cupom=`.
- O pedido manual no Admin passou a carregar promoções também da coleção legada `promocoes`, além de `promotions`, e reconhece promoção de preço fixo.
- Validada a conexão da aba `Cupons`: o Admin salva em `coupons`, a loja pública carrega essa coleção no checkout, aplica o cupom no carrinho, salva `couponDiscountTotal`/`coupon` no pedido e incrementa `usesCount`. Corrigido o cálculo para cupons percentuais salvos como `type: "pct"` usarem `value` como percentual, não como valor fixo.
- Os cupons agora exibem no Admin um link público da loja com o código aplicado automaticamente (`?cupom=CODIGO`), com botão para copiar. O template público lê `cupom`, `coupon`, `cupon`, `cupón` ou `desconto` da URL e aplica o cupom ao carrinho quando ele está válido.
- O modal de cadastro/edição de cupons foi alinhado ao padrão de modais do Admin, com cards em degradê suave, campos off-white proporcionais, select com seta interna, `Pedido mínimo` em moeda e `Valor` alternando entre `%` e `€` conforme o tipo do cupom.
- Ajuste posterior: os modais de cupons foram conferidos contra o padrão documentado no `AGENTS.md`; os cards secundários passaram a usar grids responsivos, o bloco de link adotou borda/degradê/campo off-white do padrão e os campos curtos ficaram mais proporcionais.
- O modal de detalhes do cupom foi compactado no mesmo padrão usado nos detalhes de promoção: largura menor, topo com desconto destacado, condições e uso em cards proporcionais, link automático mais leve e ações compactas no rodapé.
- A listagem de `Ações de vendas > Cupons` passou a seguir o padrão visual de páginas de listagem do Admin: KPIs preservados, cabeçalho compacto em 22px, filtros em card com labels, selects com seta alinhada, botão `Limpar filtros` apenas quando necessário, tabela mais leve, paginação no rodapé e remoção do checkbox desativado que não tinha ação.
- O modal de criação/edição e visualização de promoções foi conferido contra o padrão documentado de modais do Admin: cards com degradê sutil, campos off-white, grids responsivos, datas compactas, produtos com seleção mais leve e prévia/impacto preservados na lateral.
- O modal de detalhes da promoção recebeu refinamento específico: título ajustado para `Detalhes da promoção`, topo com benefício em destaque, seções com ícones discretos, cards internos proporcionais e impacto por produto mais fácil de ler.
- Correção visual posterior: os grids e campos dos modais de promoção foram compactados para evitar que datas, produtos selecionados, tiles de impacto ou campos curtos ultrapassem a largura do modal em telas menores.
- Refinamento visual posterior: os modais de promoção ficaram mais compactos, com menos padding, gaps menores, cards internos mais baixos, lista de produtos reduzida e campos dinâmicos de oferta ocupando menos altura.
- Ajuste com base na prévia: o modal de detalhes da promoção teve largura máxima reduzida, rodapé com botões compactos alinhados à direita e layout interno mais curto, com detalhes e alertas lado a lado quando houver espaço.
- Correção visual posterior: o elemento gráfico de `Impacto por produto` foi trocado por um ícone mais estável e passou a conter overflow, evitando que saia do bloco visual.
- Validação posterior: o campo `Pedido mínimo` das promoções de produto também passou a ser respeitado no carrinho da loja pública e no pedido manual do Admin. Se o subtotal original do pedido ainda não atingiu o mínimo, o desconto do item não entra no total nem no pedido salvo.
- Correção adicional: promoções por quantidade (`2 por 1` e `Leve/Pague`) agora calculam o desconto pela quantidade real do item no carrinho/pedido. Uma unidade isolada não recebe desconto indevido, e quantidades quebradas fora do pacote pagam o valor cheio da sobra.
- A vitrine e o modal de produto deixaram de exibir preço unitário reduzido em promoções por quantidade antes da quantidade necessária ser escolhida; o benefício continua aparecendo como chamada promocional, mas o valor riscado só aparece quando há desconto real no total.
- Unificado o cadastro de promoções por quantidade em um único tipo `Leve X, pague Y`; promoções antigas salvas como `2x1`, `2por1` ou equivalentes continuam funcionando como `Leve 2, pague 1`, mas não aparecem mais como tipo separado para novas promoções.
- Atualizado o versionamento dos scripts no Admin para evitar cache antigo dessas regras.
- Impacto esperado: promoções, cupons, frete grátis e pedidos manuais ficam mais consistentes entre Admin e loja pública sem alterar rotas, Firebase Rules ou estrutura de dados.

## 2026-05-24 — Padrão de cadastro em Loja Online > Avaliações
- Arquivos alterados: `public/js/modules/pedidos.js`, `js/modules/pedidos.js`, `public/js/modules/marketing.js`, `js/modules/marketing.js`, `public/admin.html`, `admin.html`, `AI_CHANGELOG.md`.
- A tela real usada por `Loja Online > Avaliações`, renderizada por `Modules.Pedidos._renderCatalogoAvaliacoes`, foi ajustada ao padrão visual de cadastro do Admin, com cabeçalho mais claro, cards em degradê sutil, bordas suaves, sombra leve e campos off-white.
- Os filtros de busca, status, período e nota receberam hierarquia mais limpa, selects com seta alinhada e copy mais prática para a usuária.
- Os cards de avaliações e o modal aberto ao clicar no card foram refinados visualmente, preservando aprovação, rejeição, filtros, Firebase, rotas e estrutura de dados.
- O ajuste feito no módulo `Marketing` foi removido porque `Loja Online > Avaliações` não usa esse renderer nesta tela.
- O carregamento de `pedidos.js` no Admin recebeu versionamento para evitar cache antigo ao abrir a aba.
- As cópias legadas da raiz (`admin.html` e `js/modules/pedidos.js`) foram sincronizadas com `public/` para evitar que testes locais abram a tela antiga por engano.
- Removidas as rotas antigas de avaliações que não são a entrada atual da navegação (`pedidos/avaliacoes`, `marketing/avaliacoes` e `catalogo/avaliacoes`), mantendo apenas `Loja Online > Avaliações`.
- O cache-buster foi reforçado também em `catalogo.js` e `loja_online.js`, além de `pedidos.js`, porque a rota atual passa pelos três módulos.
- O modal de detalhe da avaliação foi compactado: largura máxima reduzida, cards internos com menos padding, dados de produto/data/origem proporcionais e ações menores alinhadas à direita.
- Ajuste posterior: o modal foi reduzido novamente e simplificado para um bloco principal compacto com dados em linhas, removendo os cards internos grandes que deixavam a tela pesada.
- Corrigida a pílula vazia ao lado do status: ela representa a origem da avaliação e agora só aparece quando existir origem real no documento.
- A origem técnica `public-review`/`review-public` passou a aparecer como `Cardápio` na interface.
- As ações de moderação agora respeitam o status atual: avaliação aprovada mostra apenas a opção de rejeitar, avaliação rejeitada mostra apenas a opção de aprovar e avaliação pendente mostra as duas ações.
- A mesma regra foi aplicada no renderer legado de avaliações em `Marketing`, com versionamento do script, para evitar que uma rota/cache antigo continue exibindo as duas ações sempre.
- A listagem de `Loja Online > Avaliações` passou a seguir o padrão de páginas de listagem do Admin: KPIs preservados, card de filtros sem chips repetidos, botão `Limpar filtros` apenas quando houver filtro ativo e cards de avaliação mais próximos de linhas limpas com hover suave.
- O modal de detalhes da avaliação passou a seguir o padrão compacto dos modais do Admin, com cards em degradê suave, tiles proporcionais para produto/data/origem, comentário em bloco leve e ações de moderação menores no rodapé.
- A listagem de `Loja Online > Avaliações` foi alinhada novamente ao padrão documentado: card de filtros com título e texto de apoio, campos off-white proporcionais, botão `Limpar filtros` discreto à esquerda, contador de itens exibidos e paginação no rodapé da lista.
- Ajuste posterior: o card de filtros de `Loja Online > Avaliações` também foi simplificado para seguir o padrão de listagens, removendo o cabeçalho interno do filtro e mantendo apenas campos, datas personalizadas e limpeza condicional.
- Impacto esperado: a moderação de avaliações fica mais consistente com o padrão BocaFood sem alterar a lógica de funcionamento.

## 2026-05-24 — Conexão do SEO da loja ao template público
- Arquivos alterados: `public/index.html`, `AI_CHANGELOG.md`.
- O template público da loja passou a carregar `config/seo` junto das demais configurações do tenant.
- Os campos da aba `Loja Online > SEO da loja` agora alimentam `document.title`, `meta description`, `keywords`, Open Graph, Twitter Card e `canonical`.
- A imagem de compartilhamento configurada no Admin passa a ser usada como `og:image` e `twitter:image`, com fallback para capa/banner/logo quando não houver imagem própria.
- O tracking GA4 passa a receber o título final já ajustado pelo SEO da loja.
- Impacto esperado: os dados configurados na aba SEO deixam de ficar apenas na prévia do Admin e passam a ser usados pela loja publicada e por compartilhamentos.

## 2026-05-24 — Padrão visual em Loja Online > SEO da loja
- Arquivos alterados: `public/js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- A aba `Loja Online > SEO da loja` passou a usar o padrão visual aprovado do Template da loja, com cabeçalho compacto, chips de estado, cards `tpl-config-panel`, campos off-white e botão `Salvar alterações` consistente.
- Os campos de Google, SEO local e compartilhamento foram reorganizados em colunas proporcionais ao conteúdo esperado, sem alterar IDs, salvamento, rotas, Firebase, permissões ou estrutura de dados.
- Os previews de Google e compartilhamento foram preservados e integrados à nova hierarquia visual.
- Os fallbacks de SEO local foram corrigidos para herdar cidade da localização atendida e regiões/área a partir das zonas de entrega, evitando exibir objetos técnicos no campo de bairros/regiões.
- Foram aplicados limites de caracteres aos campos de título, descrição, palavra-chave, região, área e textos de compartilhamento.
- O card `Compartilhamento` foi refinado para seguir o padrão visual do Template da loja, com upload/remover imagem em card próprio, switch discreto para texto personalizado e preview preservado.
- Os campos duplicados `Bairros/regiões atendidas` e `Área de entrega` foram simplificados em um único campo `Região atendida`, mantendo salvamento compatível em `neighborhoods` e `deliveryArea`.
- O campo herdado de região deixou de receber limite de caracteres, e os chips abaixo do título passaram a atualizar em tempo real conforme título, descrição e imagem mudam.
- A copy do subtítulo foi reforçada para explicar que estes dados ajudam a loja a aparecer melhor no Google e em links compartilhados.
- Impacto esperado: a configuração de SEO fica mais alinhada ao restante do módulo Loja Online e mais fácil de preencher.

## 2026-05-24 — Ajustes no modal de produtos do Cardápio
- Arquivos alterados: `public/js/modules/catalogo.js`, `public/index.html`, `AI_CHANGELOG.md`.
- O modal de cadastro/edição de produto passou a atualizar a prévia da imagem imediatamente ao selecionar ou remover arquivo, sem depender de clicar em `Salvar produto` ou recarregar a tela.
- Corrigido o botão `Remover imagem` no modal de produto para limpar o estado visual do campo e da prévia do produto.
- A opção de destaque foi ajustada para `Mostrar selo de destaque`, deixando claro que ela apenas exibe um selo visual no cardápio e não coloca o produto automaticamente em uma vitrine separada.
- O template público deixou de usar produtos marcados apenas com selo de destaque como fallback automático do card `Destaque da casa`; o selo permanece visual no produto.
- No modal de produto, o card `Mostrar no cardápio` foi movido para o final do formulário, como ação de visibilidade do item.
- Os campos `Preço` e `Categoria` foram compactados para ocupar apenas a largura necessária ao conteúdo esperado, seguindo o padrão documentado de modais e cadastros.
- No bloco de upsell, o campo `Desconto aplicado ao item adicional` foi simplificado para `Desconto` e passou a usar entrada em formato de moeda.
- Removido o texto explicativo abaixo de `Mostrar selo de destaque`, deixando o controle mais limpo.
- A ação de duplicar produto foi ajustada para criar um rascunho independente: copia os dados editáveis do produto original para economizar preenchimento, mas gera novo `id`, novo `slug`, novas datas e remove imagem/URLs/caminhos de Storage e IDs fiscais externos. A cópia nasce sem imagem para evitar vínculo com o arquivo do produto original.
- O versionamento do `catalogo.js` no Admin foi atualizado para evitar que o navegador carregue a rotina antiga de duplicação pelo cache.
- Corrigida a abertura do modal após duplicar: a cópia agora entra na lista local antes do modal abrir, evitando que o formulário apareça em branco enquanto o reload assíncrono de produtos ainda não terminou.
- O desconto configurado no upsell agora é aplicado no template público: aparece no item sugerido do modal, entra no total do modal/carrinho e é salvo no pedido em `addAlsoDiscount`, preservando `originalPrice`, `promoDiscountTotal` e o vínculo com o produto principal.
- A `Observação interna` do produto passou a ser copiada para os itens dos pedidos feitos pela loja pública e pelos pedidos manuais do Admin, ficando disponível no detalhe do pedido/cozinha sem aparecer na mensagem enviada ao cliente.
- Verificado o pedido manual do Admin: ele herda nome, categoria, preço base, preço promocional quando o canal é `cardapio`, promoção aplicada, origem do preço, fiscal snapshot e agora também a observação interna do produto.
- Diagnóstico de valores: o template público e o pedido manual tinham conversores numéricos que não aceitavam valores formatados com moeda, como `€12,00`, fazendo alguns produtos aparecerem como `€0,00`.
- Correção: o parser de valores do template público e do Admin/Pedidos agora aceita símbolo de moeda, vírgula decimal e separador de milhar; o cálculo do upsell também passou a comparar o desconto contra o preço original correto do item adicional.
- Correção visual do modal público: produtos do tipo combo/menu que iniciam com quantidade `0` agora mostram o preço unitário/promocional de referência em vez de `€0,00`, mantendo o botão bloqueado até a cliente escolher a quantidade e as opções obrigatórias.
- Correção do upsell: quando o bloco `Aumentar valor do pedido` tem desconto próprio, o template deixa de empilhar esse desconto com uma promoção ativa do produto sugerido; o valor exibido e o valor salvo no carrinho passam a aplicar somente o desconto configurado no upsell.
- Refinamento visual do upsell no modal público: o bloco ganhou tratamento mais vendedor, com fundo quente, detalhe verde/dourado, selo discreto de boa escolha e destaque de economia, sem depender da cor da marca e sem alterar cálculo, seleção ou carrinho.
- Ajuste visual posterior do upsell: removidos a faixa lateral verde/amarela e o elemento gráfico antes do título, mantendo o destaque comercial de forma mais limpa e elegante.
- Pente fino do upsell no template público: a loja publicada passou a carregar `upsellRules`, aplicar regras ativas no modal do produto quando não houver upsell direto no cadastro do produto, respeitar produto gatilho/categoria, datas, status, local de exibição e prioridade, além de salvar no pedido `upsellRuleId`, `upsellRuleName` e `upsellBenefitType` quando a sugestão for adicionada.
- Correção de segurança no cálculo de upsell público: o modal do produto passou a aplicar apenas benefícios compatíveis com sugestão de produto (`sem benefício`, `%`, `€` e `preço especial`). Benefícios de carrinho, frete grátis, brinde, combo fechado e leve/pague continuam preservados no Admin, mas não são aplicados no modal do produto para evitar desconto ou promessa incorreta enquanto não houver fluxo público específico para esses casos.

## 2026-05-24 — Diagnóstico e correção do status automático da loja
- Arquivos alterados: `public/admin.html`, `public/index.html`, `public/js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Diagnóstico: o botão superior `Loja ligada/desligada` carregava apenas `config/template` e `config/operacao`, mas a grade editada na aba `Operação` também é salva em `config/horarios`; isso podia fazer o topo calcular aberto/fechado com horário antigo ou incompleto.
- Diagnóstico adicional: a aba `Operação` e o topo do Admin usavam cálculos separados para o modo automático, e alguns campos booleanos de horário podiam vir como texto, causando leitura incorreta de dias fechados, dias ativos e segundo período.
- Correção: o topo do Admin agora inclui `config/horarios` no cálculo do modo automático e prioriza a grade semanal salva ali.
- Correção: a renderização, prévia e salvamento da aba `Operação` passaram a interpretar `closed`, `enabled` e `enabled2` com a mesma normalização defensiva, evitando que strings como `false` sejam tratadas como verdadeiro.
- Correção: o template público também passou a calcular o status automático pela grade semanal carregada, em vez de depender apenas do último `isOpen` salvo.
- Correção adicional: `operacao.isOpen` deixou de forçar o modo manual quando já existe grade semanal; isso evita que o modo automático use um estado antigo e ignore os horários configurados.
- Correção adicional: ao ligar/desligar a loja pelo botão superior, a tela aberta do Template é sincronizada para `Manual` com o estado correto, impedindo que `Salvar alterações` grave novamente um valor manual antigo.
- Correção adicional: o salvamento em modo manual passou a usar diretamente o campo sincronizado na tela (`tpl-manual-closed`), evitando que `_storeConfig` antigo feche a loja novamente ao clicar em `Salvar alterações`.
- Correção adicional: o cálculo automático passou a aceitar aliases de horários (`open/close`, `start/end`, `abre/fecha`, `openingTime/closingTime`) antes de decidir se a loja está dentro do período configurado.
- Correção adicional: quando existe grade semanal salva, o modo automático passa a ter prioridade sobre flags legadas como `manualOpen`, `manualClosed` e `isOpen` caso não haja `statusMode` manual explícito.
- Correção adicional: se houver erro ao recalcular o status automático, o topo não cai mais em “aberto” por padrão; ele registra o erro no console e mostra fechado.
- Correção adicional: após salvar o Template da Loja, o topo é atualizado diretamente com o cálculo feito a partir dos campos recém-salvos na tela, evitando que uma leitura atrasada do Firestore reabra/feche com estado antigo.
- Ajuste visual seguro: em modo automático, a linha do dia atual passa a indicar visualmente quando a loja está fechada agora pelo horário, sem alterar o valor real do checkbox `Fechada` nem salvar o dia inteiro como fechado.
- Ajuste de sincronização: ao alterar horários na tela, o indicador superior do Admin é atualizado ao vivo usando o mesmo cálculo da prévia.
- Correção de cache: o carregamento de `public/js/modules/catalogo.js` no Admin recebeu novo versionamento na URL para evitar que o navegador continue usando a lógica antiga da aba `Operação`.
- Ajuste de UX do automático: o checkbox `Fechada` do dia atual passa a aparecer marcado automaticamente quando a loja está fora do horário, mas esse estado recebe marca interna e não é salvo como fechamento do dia na agenda.
- Correção do segundo período: o cálculo automático agora considera `Abre 2` e `Fecha 2` como período válido sempre que ambos estiverem preenchidos, desde que o segundo período não esteja explicitamente desativado.
- Correção adicional do segundo período: `Abre 2` e `Fecha 2` passaram a ser tratados como uma segunda janela independente do mesmo dia, sem depender do toggle `2º período` para o cálculo de aberto/fechado.
- Ajuste de interface da grade semanal: o segundo período agora aparece como uma segunda linha do mesmo dia, repetindo o nome do dia e mantendo `Abre 2`/`Fecha 2` sempre visíveis como configuração independente.
- Correção da grade semanal: o toggle visual `2º período` foi removido da dependência da tela; quando `Abre 2` e `Fecha 2` estão preenchidos, o sistema marca internamente o segundo período como ativo.
- Impacto esperado: quando o status estiver em `Automático pelos horários`, o indicador superior deve mostrar aberto/fechado conforme o dia e horário configurados na grade semanal, sem depender do checkbox manual.

## 2026-05-24 — Reforço do padrão de campos em modais
- Arquivos alterados: `AGENTS.md`, `AI_CHANGELOG.md`.
- Registrada de forma explícita a regra de que campos de preenchimento em modais/cadastros devem ocupar somente a largura necessária para o conteúdo esperado.
- Reforçado que cards devem usar colunas proporcionais, alinhamento consistente e hierarquia clara entre campos principais e complementares.
- Registrado que subcards ou blocos internos não precisam ter ícone/elemento gráfico quando isso deixar a tela pesada ou repetitiva.

## 2026-05-24 — Padrão de modais na Operação do Template da loja
- Arquivos alterados: `public/js/modules/catalogo.js`, `public/admin.html`, `AI_CHANGELOG.md`.
- Aplicado o padrão visual de modais/cadastros do Admin nos cards da aba `Loja Online > Template da loja > Operação`, com cards brancos em degradê sutil, bordas suaves, sombra leve, campos off-white e selects com seta alinhada.
- Reorganizados visualmente os blocos de modos de atendimento, prazos/capacidade, entrega, localização atendida, zonas de entrega, status público e grade semanal sem alterar IDs, rotas, Firebase, permissões ou estrutura de dados.
- Mantida a lógica atual de salvamento e prévia; os ajustes foram restritos a HTML/CSS/JS de apresentação da aba.
- Ajuste posterior: removidos os elementos gráficos/ícones dos subcards da aba `Operação`, mantendo títulos, textos curtos e campos alinhados conforme o padrão documentado.
- Ajuste posterior adicional: os campos de `Entrega e retirada` e `Localização atendida` passaram a usar larguras proporcionais ao conteúdo esperado, evitando campos curtos esticados e melhorando alinhamento entre as colunas.
- Ajuste posterior adicional: os três subcards de `Entrega e retirada` passaram a ficar lado a lado quando houver espaço, e os checkboxes de `Retirada` e `Entrega` ficaram limpos, sem fundo nem borda de mini-card.
- Ajuste posterior adicional: em `Cidade base da entrega`, o campo `Código postal base` foi movido para a linha debaixo por ser preenchido separadamente.
- Ajuste posterior adicional: o bloco `Modos de atendimento` ficou sem fundo e sem borda de card, mantendo apenas a hierarquia textual e os checkboxes limpos.
- Ajuste posterior adicional: o campo `Código postal base` em `Localização atendida` passou a herdar o código postal do endereço de atendimento da loja e fica bloqueado para edição direta nessa aba.
- Ajuste posterior adicional: o card `Prazos e capacidade` foi compactado para reduzir espaço em branco e manter os campos proporcionais ao conteúdo.
- Ajuste posterior adicional: a microcopy abaixo de `Código postal base` foi ajustada para indicar que o valor é o CEP de atendimento da loja.
- Correção: ao salvar o Template da Loja, o indicador superior `Loja ligada/desligada` passa a ser recalculado imediatamente; em modo automático ele volta a usar a grade de horários para definir aberto ou fechado.
- Correção posterior: o cálculo do botão superior em modo automático passou a interpretar `closed`, `enabled` e `enabled2` de forma defensiva mesmo quando vierem como texto, além de ignorar períodos sem horário válido.
- Correção posterior adicional: a grade semanal usada pelo botão superior passou a ser normalizada pelo nome do dia, evitando que arrays antigos ou fora de ordem façam o modo automático comparar o horário atual com o dia errado.
- Correção posterior adicional: ao salvar a aba `Operação`, o módulo também atualiza `config/operacao` com `statusMode`, `isOpen` calculado pela grade atual e a mesma lista de horários, evitando que o botão superior use um estado antigo.

## 2026-05-24 — Ajustes de Vitrine e Operação no Template da loja
- Arquivos alterados: `public/js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Removido da aba `Vitrine` o card visível `Destaque comercial do topo`, mantendo os campos ocultos com os valores atuais para não zerar a configuração salva ao clicar em `Salvar alterações`.
- Removido da aba `Operação` o card explicativo de `Retirada`; o checkbox de retirada continua disponível em `Modos de atendimento` e segue controlando o carrinho público.
- Os campos monetários de `Pedido mínimo` e `Valor da entrega` das zonas passaram a usar máscara de moeda em euro, mantendo a leitura numérica usada pelo template público.
- Removido o controle visível `Loja fechada` e sua explicação da aba `Operação`, preservando o campo oculto para manter compatibilidade com o salvamento atual.

## 2026-05-24 — Correção de imagens no Template da loja
- Arquivos alterados: `public/js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Corrigido o botão `Remover imagem` em `Loja Online > Template da loja > Identidade`, expondo a ação no módulo e limpando também os campos salvos em `config/template`, `config/geral` e `config/aparencia`.
- O upload de logo, favicon e imagens do template passou a atualizar imediatamente o estado local e todas as prévias da tela, sem depender de atualizar a página.
- A remoção de imagem também atualiza a prévia visual, placeholders e ícone de aba no caso do favicon.

## 2026-05-24 — Auditoria dos campos do checkout no Admin/Pedidos
- Arquivos alterados: `public/js/modules/pedidos.js`, `AI_CHANGELOG.md`.
- Revisada a conexão entre o checkout da loja pública e o modal de detalhes do pedido no Admin.
- O detalhe do pedido passou a mostrar de forma explícita código público/origem, telefone, e-mail, UID do cliente, partes estruturadas do endereço, zona, localidade, país, Place ID, subtotal, frete, cupom, promoções e pontos quando esses dados existem no pedido.
- Corrigida a leitura de data e horário de pedidos de retirada: o Admin agora usa `pickupDate/pickupTime` antes de cair em `scheduleDate/scheduleTime`.
- Corrigido o salvamento da edição de dia/horário no detalhe: pedidos de retirada atualizam `pickupDate/pickupTime`, enquanto pedidos de entrega atualizam `deliveryDate/deliveryTime`, preservando também `scheduleDate/scheduleTime`.
- A montagem do endereço no detalhe passou a considerar os campos estruturados salvos pelo checkout (`streetAddress`, `addressNumber`, `deliveryAddress`, `postalCode`, `deliveryZoneName`), evitando que partes do endereço fiquem escondidas no Admin.
- As escolhas/variações dos itens salvas em `choices` pelo checkout agora aparecem no detalhe do pedido do Admin junto com as observações do item.
- O pedido criado pelo checkout público passou a salvar tanto `channel` quanto `source` como `cardapio`, mantendo `originSource/originChannel` para rastrear que a origem técnica foi a loja pública/template.

## 2026-05-23 — Resgate opcional de pontos no carrinho público
- Arquivos alterados: `public/index.html`, `AI_CHANGELOG.md`.
- Ponto de retorno salvo antes da implantação: `/private/tmp/bocafood-before-points-redemption-20260523-222725.patch`.
- Adicionado bloco isolado no carrinho para a cliente escolher se quer usar pontos neste pedido, sem aplicar desconto automaticamente.
- O desconto por pontos só entra no total quando a cliente está logada, possui saldo suficiente e marca o checkbox `Usar puntos en este pedido`.
- O cálculo respeita saldo disponível, taxa de conversão, mínimo de pontos para uso, limite percentual configurado e nunca deixa o total negativo.
- O resumo do carrinho e a mensagem enviada por WhatsApp passaram a exibir a linha `Puntos` somente quando houver resgate ativo.
- O pedido salvo em `orders` passou a registrar `pointsDiscountTotal` e `pointsRedemption` com pontos usados, desconto, saldo anterior e saldo posterior.
- Após o pedido ser salvo, o template registra movimento em `points_movements` e atualiza `pointsBalance/points` do cliente em `store_customers` via transação, evitando descontar pontos sem pedido salvo.
- Correção posterior: o ajuste de estabilidade dos modais ficou restrito ao mobile e o carrinho desktop voltou a ser exibido como sidebar/sticky, sem overlay nem blur sobre a loja.
- Correção posterior adicional: removida a participação do `.cart-sheet` nas regras globais de modal `100vw/100dvh` e `::before` com blur; essas regras agora existem para o carrinho somente dentro do breakpoint mobile.
- Ajuste posterior de desktop: recuperada a experiência responsiva da loja pública em telas maiores, com grid mais fluido, carrinho lateral sticky sem overlay, vitrine com cards proporcionais e modal de produto com imagem no topo.
- Ajuste posterior: recuperada a apresentação promocional mais conversora no modal de promoções, mantendo o badge de benefício e adicionando preço antigo riscado/benefício nos produtos da promoção sem alterar o cálculo.

## 2026-05-23 — Ajustes finais de copy do carrinho público
- Arquivos alterados: `public/index.html`, `AI_CHANGELOG.md`.
- Reaplicadas apenas as melhorias pequenas de orientação do carrinho após a correção de carregamento dos produtos, sem reintroduzir a camada de resgate de pontos no checkout.
- A lista de endereços salvos deixou de aparecer como `Direcciones guardadas` e passou a orientar a cliente com a pergunta `¿En qué dirección quieres recibir el pedido?`.
- Incluído texto discreto antes do código postal explicando que a cliente pode preencher um endereço novo quando ainda não tiver endereço salvo.
- As áreas de retirada e entrega passaram a exibir a pergunta `¿Cuándo quieres recibir tu pedido?` antes da seleção de data e horário.
- O endereço de retirada ganhou título próprio e os novos textos foram conectados à camada de idioma da loja pública.
- Ajuste posterior: a área de endereços salvos voltou ao fluxo com pergunta `¿En qué dirección quieres recibir el pedido?` e botão `Elegir dirección guardada`, abrindo um mini modal interno com a lista `Direcciones guardadas`.

## 2026-05-23 — Status da loja no topo do Admin
- Arquivos alterados: `public/admin.html`, `public/index.html`, `public/js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- O botão do topo do Admin passou a ler se o status da loja está em modo automático ou manual antes de exibir `Loja ligada` ou `Loja desligada`.
- Em modo automático, o indicador calcula aberto/fechado usando a grade semanal de horários já salva; em modo manual, continua respeitando `manualOpen`, `manualClosed` e `operacao.isOpen`.
- O rótulo e o título do controle agora indicam o modo (`Automático` ou `Manual`) para evitar confundir horário automático com fechamento manual.
- O card principal da loja pública passou a respeitar também `operacao.isOpen` quando o status está em modo manual, mantendo `Aberto/Fechado` alinhado ao botão do topo do Admin.
- O `Horário resumido` do card principal passou a mostrar a semana agrupada por horários iguais, como `Seg-Sex: 12:00-15:00 / 18:00-22:00 · Sáb-Dom: 12:00-16:00`, com o template público recalculando os dias no idioma da loja.
- Corrigida a interpretação do prazo de antecedência no carrinho: `2` agora permite escolher hoje, amanhã e depois de amanhã, em vez de começar a agenda apenas dois dias depois; o Admin deixou de salvar esse campo como antecedência mínima.
- A leitura da grade semanal no template público passou a preservar sempre as 7 posições da semana ao carregar horários por objeto ou por array, evitando que dias configurados fiquem deslocados ou indisponíveis no calendário do carrinho; horários que terminam à meia-noite também deixam de ser descartados.
- O calendário de retirada/entrega do carrinho deixou de bloquear datas com base apenas nos horários já gerados; agora a data segue o intervalo de antecedência permitido, e a disponibilidade fica concentrada na lista de horários do dia escolhido.
- O carrinho deixou de ler qualquer campo de antecedência mínima para iniciar a agenda: o calendário sempre começa em hoje, e o campo `Antecedência` funciona apenas como limite máximo de dias para pedidos futuros.
- O layout do card principal da loja pública passou a permitir quebra de linha nos chips de status/horário, evitando que o horário resumido semanal ultrapasse a área do card.
- O efeito visual sobre a imagem do card promocional/destaque foi suavizado e passou a usar a cor da marca em vez de um degradê branco pesado.
- O horário resumido do card principal passou a ocupar uma linha própria dentro dos chips, permitindo exibir todos os grupos de horários da semana sem ultrapassar a largura do card.
- O título do card promocional/destaque foi levemente reduzido no mobile e no desktop para melhorar proporção e leitura.
- O placeholder da barra de busca de produtos no template público deixou de usar peso alto, ficando com leitura mais leve.
- O botão `Mais informações` da loja pública agora abre um modal premium com `Sobre a loja`, `Aviso importante`, `Política de entrega` e `Política de cancelamento`, usando os textos configurados no Admin.
- O rodapé da loja pública passou a usar a logo real no lugar das iniciais, exibir horários e endereço completo de atendimento, respeitar os toggles de contatos/redes sociais e remover o texto padrão `Gracias por visitarnos.` quando não houver texto próprio configurado.
- Incluído o WhatsApp flutuante no template público com tooltip/mensagem configurados em `Template da loja > Atendimento`, abrindo o WhatsApp com a mensagem inicial salva.
- O botão flutuante do WhatsApp passou a ser uma bolinha independente e os textos do rodapé ficaram sem negrito, mantendo leitura mais leve.
- A apresentação curta do card principal da loja pública passou a usar preto para ganhar mais leitura.
- O ícone do WhatsApp flutuante foi afinado para não parecer em negrito.
- Registrada no `AGENTS.md` a preferência visual de evitar excesso de negrito, mantendo a interface mais leve, elegante e premium.
- O WhatsApp flutuante ganhou ícone maior e tooltip mais elegante, exibido apenas ao passar o mouse ou focar no botão.
- O rodapé passou a ocultar telefone quando só houver DDI/código sem número real, e o WhatsApp flutuante deixou de usar número fallback quando a loja não configurou WhatsApp.
- O botão flutuante recebeu um ícone preenchido do WhatsApp mais limpo, sem borda branca na bolinha.
- O degradê do card promocional/destaque foi suavizado para ficar mais leve e elegante, e o botão `Ver pedido` passou a mostrar apenas o valor, sem o texto `Subtotal`.
- O card principal da loja pública recebeu uma borda fina e elegante na cor da marca.
- O card principal deixou de usar tom gelo e recebeu fundo off-white quente com degradê de marca mais perceptível; no botão `Ver pedido`, a linha `Subtotal + valor` voltou a aparecer em branco.
- No carrinho, textos secundários que estavam cinza passaram para preto, e a mensagem de ausência de horários perdeu fundo e borda.
- Removido o subtítulo explicativo do modal `Mais informações`, deixando o card mais limpo.
- Correção: o autocomplete da `Localização principal` em `Template da loja` passou a preencher também o campo `Bairro / Localidade`, reconhecendo variações de bairro retornadas pelo Google Places.
- Ajuste visual: no template público, o modal `Mais informações` passou a usar bordas/linhas brancas, o card principal recebeu contorno na cor da marca também no desktop/mobile e os totalizadores de produtos das categorias ficaram sem negrito.
- Ajuste visual posterior: o contorno do card principal e do botão `Ver promoções` no template público passou a usar linha branca para ficar mais leve sobre o hero.
- Avaliações: a página pública de avaliação passou a funcionar pelo slug da loja (`/slug/review`), resolvendo o tenant via `public_stores`, impedindo envio sem loja identificada e usando o nome real da loja no título, logo e mensagem de WhatsApp.
- O link de avaliações gerado no Admin agora segue o padrão `bocafood.app/slug/review`, e o template público oculta a seção/título de avaliações quando ainda não há avaliações aprovadas.
- Ajuste posterior: a página pública de avaliações ganhou layout alinhado ao template atual, herdando cor da marca, logo, favicon e idioma principal configurados no Admin; o template público agora mostra um CTA para deixar avaliação mesmo quando ainda não há avaliações publicadas.
- Ajuste posterior: quando não há avaliações aprovadas, o template público oculta o cabeçalho `Reseñas / Ver todas` e mantém apenas o CTA para deixar avaliação.
- Ajuste posterior: no estado sem resenhas, a área de avaliações remove o card externo e deixa visível somente o card com degradê e CTA.
- Ajuste posterior: adicionado respiro vertical entre o card de resenha/CTA e a lista de produtos no template público.
- Ajuste posterior: a página de avaliação enviada trocou emojis por elementos gráficos no padrão visual e o botão `Ver menú` passou a usar a URL pública resolvida da loja, evitando abrir uma rota sem loja identificada.
- Ajuste posterior: aumentado o respiro do cabeçalho `Reseñas / Ver todas` em relação aos produtos no template público.
- Ajuste posterior: removido o bloqueio local de avaliação já enviada, permitindo que o cliente abra a página novamente e envie outra avaliação para a loja.
- Ajuste posterior: o CTA para nova opinião fica fora do card da resenha, resenhas vinculadas a produto exibem imagem/nome do produto, e o link `Ver todas` abre um modal premium com todas as resenhas aprovadas.
- Ajuste posterior: após enviar uma avaliação, a página mantém a tela de confirmação aberta, sem retornar automaticamente ao formulário.
- Ajuste posterior: centralizado o botão `Cuéntanos también cómo fue tu experiencia` abaixo do card de resenha.

## 2026-05-22 — Carrinho público herdado do template de referência
- Arquivos alterados: `public/index.html`, `AI_CHANGELOG.md`.
- O carrinho do template público passou a herdar elementos do `template para ver.html`: alerta de pedido mínimo, validação visual de zona/CEP antes de endereço, opções de pagamento em botões, linha de economia e modal para escolher entre login/criação de acesso ou continuar como convidado.
- A validação do checkout foi conectada aos campos já existentes, exigindo horário, pagamento, mínimo de entrega, zona atendida e endereço quando aplicável, sem alterar rotas, Firestore, tenant ou estrutura de pedidos.
- A interface mantém o salvamento atual em `orders` e o envio por WhatsApp, apenas organizando o fluxo para ficar mais próximo da referência e com textos traduzidos por idioma.
- Ajuste visual posterior: o carrinho manteve o comportamento fixo/lateral no desktop, mas herdou o layout interno das imagens de referência, com bloco inicial de recebimento, pedido em card próprio, cupom dentro do pedido, resumo limpo e barra de ação com total, limpar pedido e envio por WhatsApp.
- Ajuste posterior: o card `Tu pedido` fica oculto quando o carrinho está vazio, evitando exibir um bloco visual sem itens.
- Ajuste posterior: removidos os símbolos gráficos improvisados dos cards de retirada e entrega, mantendo apenas texto e hierarquia visual.
- Ajuste posterior: removidos do carrinho os campos visíveis de nome/WhatsApp; o pedido agora segue o fluxo de login/criação de acesso ou convidado, com aviso de que convidado não acumula pontos.
- Ajuste posterior: removida a repetição `Recepción obligatorio`, corrigido o título do bloco de pagamento após remover Cliente, eliminada a repetição visual `Entrega / Entrega` e simplificada a barra final para não parecer um segundo carrinho.
- Ajuste visual posterior: reduzidos tamanhos, pesos e espaçamentos dos cards internos do carrinho para deixar recebimento, pagamento, itens, cupom e resumo mais elegantes e menos pesados.
- Ajuste visual posterior: o carrinho mobile foi compactado novamente com cards menores, menos sombra, bordas mais discretas e barra de ações oculta quando não há itens no pedido.
- Ajuste posterior: o checkout recebeu rótulos discretos para código postal, endereço, horários e observação, aproximando a hierarquia do modelo de referência sem reintroduzir campos de cliente.
- Correção posterior: a validação de código postal da entrega agora aceita código exato, prefixo, wildcard, faixas como `31000-31999`, faixas vindas como objeto e zonas padrão sem código explícito; a mensagem de indisponibilidade foi ajustada para o idioma da loja pública.
- Ajuste visual posterior: o carrinho foi reorganizado no padrão dos modais, separando recebimento, pedido/resumo e finalização em blocos premium, com campos off-white, bordas suaves, hierarquia mais clara, menos peso visual e pagamento/observação ocultos quando não há itens.
- Ajuste posterior: o carrinho ganhou um botão fixo de fechar no topo do bloco de recebimento, mantendo a ação visível mesmo quando o card do pedido está vazio ou oculto.
- Ajuste posterior: o campo `Dirección de entrega` do carrinho passou a usar Google Places quando a chave global está configurada, preenchendo número, localidade, província, país, código postal e metadados do endereço sem alterar o fluxo de checkout.
- Ajuste visual posterior: reduzi o peso do negrito em labels, opções de recebimento, pagamento, preço de linha e botões secundários do carrinho, mantendo destaque apenas nos pontos principais.
- Ajuste posterior: a busca do Google no carrinho passou a partir também do campo `Código postal`, usando autocomplete/geocoding para preencher localidade, província, país, endereço formatado e metadados antes da confirmação do pedido.
- Ajuste posterior: o carrinho deixou de preencher o campo de rua com a área retornada pelo código postal; a rua só é preenchida quando o Google retorna `route`, e o campo de endereço ganhou uma ajuda discreta para a cliente buscar ou digitar rua e número.
- Ajuste posterior: o campo `Dirección de entrega` ganhou uma lista própria de sugestões por Google Geocoder, usando código postal, cidade e país como contexto, para encontrar ruas mesmo quando o autocomplete nativo não abre no drawer do carrinho.
- Ajuste visual posterior: o carrinho passou a seguir o padrão do modal `Compras → Produtos / Insumos`, com cards em degradê branco/off-white, borda `#EADFD8`, raio menor, sombra leve, campos off-white com foco vermelho suave e selects com seta no padrão aprovado.
- Ajuste posterior: `Horario de recogida` e `Horario de entrega` foram separados em calendário de data e seleção de horário, usando os dias/horários disponíveis da configuração da loja e mantendo o `slotKey` interno compatível com WhatsApp, pedidos e contagem de vagas.
- Correção posterior: o calendário de retirada/entrega agora inicia na primeira data disponível para exibir os horários imediatamente, e o card de entrega voltou a mostrar `desde` com o menor valor configurado nas zonas quando ainda não há CEP selecionado.
- Correção visual posterior: o carrinho voltou à ordem correta após adicionar produto (`Recebimento`, `Tu pedido`, `Pagamento e observações`, ações finais) e o botão `×` duplicado no card do pedido foi ocultado, mantendo apenas o fechar principal do carrinho.
- Ajuste visual posterior: criada uma camada final nova de layout para o carrinho público, inspirada nas referências `carrinho`, com cards brancos amplos, recebimento no topo, lista do pedido mais limpa, cupom/resumo integrados, barra de ações fixa e rolagem própria no mobile, sem alterar cálculo, envio, Firestore ou validações.
- Refinamento posterior: o carrinho público foi convertido visualmente para um checkout único e compacto, removendo a pilha pesada de cards, reduzindo alturas, corrigindo corte no topo mobile e mantendo a sequência recebimento, pedido, pagamento, resumo e ações no mesmo fluxo.
- Ajuste posterior: removidos textos redundantes do carrinho, o endereço de retirada passou a exibir número, bairro/zona e referência quando configurados, os campos de data/horário ficaram mais compactos e os cards de retirada/entrega ganharam ícones na cor da marca.
- Ajuste visual posterior: refinado o topo do carrinho com botão de fechar menor e mais premium, degradê sutil na cor da marca, aviso de pedido mínimo mais compacto e fallback ampliado para exibir bairro/zona no endereço de retirada.
- Ajuste posterior: quando o carrinho está vazio, o painel público deixa de exibir recebimento, pagamento e ações finais, mostrando apenas a mensagem de que ainda não há itens no pedido.
- Ajuste posterior: a área de pagamento do carrinho passou a usar a pergunta `¿Cómo vas a pagar?` e opções em lista vertical, enquanto o estado vazio ganhou visual mais leve com degradê sutil e menos negrito.
- Ajuste posterior: os itens do carrinho passaram a seguir a referência `carrinho2`, com nome e badges promocionais na mesma linha, benefício em verde, escolhas/variações recuadas com barra lateral, preço antigo riscado e preço final alinhado à direita.
- Ajuste posterior: o estado vazio do carrinho voltou a exibir o botão de fechar, o select de pagamento deixou de mostrar o placeholder `Forma de pago` como opção visível e a zona/preço de entrega passou a aparecer como texto limpo, sem fundo ou borda.
- Ajuste posterior: o resumo do carrinho ganhou hierarquia visual para descontos e economia, com promoções/cupons em verde e linha `Ahorras` em box suave para destacar o benefício.
- Ajuste posterior: o campo de cupom foi movido para próximo da forma de pagamento no checkout público, mantendo os mesmos IDs e vínculo com a lógica de cupons do Admin; a pílula de pedido mínimo ficou mais compacta e aproximou `Pedido mínimo` de `Añade más`.
- Correção posterior: o botão de envio por WhatsApp agora usa `disabled` real conforme carrinho, recebimento, horário, pagamento, mínimo, zona e endereço estiverem prontos; a mensagem enviada foi reorganizada no modelo `#pedido_1234`, com itens, códigos, escolhas, subtotal, entrega, total, endereço, hora e pagamento.
- Ajuste visual posterior: a ajuda abaixo do endereço de entrega deixou de usar fundo, borda e negrito, ficando como texto discreto dentro do carrinho.
- Ajuste visual posterior: o select de forma de pagamento ficou proporcional ao conteúdo no desktop e o botão de envio por WhatsApp recebeu verde próprio mais elegante, com hover e sombra suave.
- Ajuste posterior: removida a linha de retorno da zona/preço logo abaixo do código postal quando o CEP é válido; a validação continua ativa e o aviso aparece apenas quando a loja não atende o código informado.
- Ajuste visual posterior: os campos do endereço do carrinho foram realinhados com altura consistente e larguras proporcionais ao conteúdo, reduzindo o espaço de `País` e compactando a pílula de pedido mínimo.
- Ajuste posterior: o endereço de entrega ganhou o campo `Piso / puerta` como complemento universal, salvando o dado no pedido e incluindo-o na linha de endereço; a divisória antes do chip de pedido mínimo foi removida.
- Ajuste visual posterior: o bloco de forma de pagamento e observações foi reorganizado para deixar o select proporcional ao conteúdo, com a observação permanecendo maior abaixo.
- Correção posterior: o campo de cupom de desconto no carrinho voltou a ficar visível junto ao checkout quando há cupons carregados ou a configuração não está explicitamente desativada, mantendo a lógica de validação existente.
- Ajuste visual posterior: as variações no modal do produto receberam fundo levemente tingido pela cor da marca e espaçamento vertical mais compacto.
- Ajuste posterior: a página/modal de promoções perdeu as bordas em volta dos cards, mantendo sombra e fundo; ao abrir um produto a partir de promoções, fechar o modal do produto retorna para o modal de promoções.
- Ajuste visual posterior: os nomes do menu de categorias passaram a aparecer em preto, inclusive no estado ativo, e o botão `Añadir producto` do modal ficou verde, centralizado e largo o suficiente para exibir o texto inteiro.
- Correção posterior: o botão `Limpiar pedido` agora também limpa zona selecionada, código postal, endereço e metadados da entrega, removendo o valor de frete do carrinho.
- Ajuste visual posterior: a apresentação curta do card principal deixou de usar negrito e as informações rápidas/status foram realinhadas com espaçamento mais consistente.
- Ajuste posterior: o card principal da loja passou a organizar melhor as informações rápidas, exibindo horário junto de aberto/fechado, usando `Pedido mín.`, rotulando tempos como preparação/entrega com `min` quando necessário e mostrando o menor valor real em `Entrega desde`.
- Ajuste visual posterior: o endereço de retirada no carrinho passou a aparecer em preto, com ícone discreto de localização na cor da marca.
- Correção posterior: o status automático da loja pública passou a ignorar flags manuais antigas quando `statusMode` está em automático, calculando aberto/fechado pela grade real de horários; o card principal agora mostra o horário vigente quando aberto ou o próximo horário disponível quando o período do dia já passou.
- Ajuste posterior: o próximo horário no card principal foi simplificado para exibir apenas a faixa de horário, sem texto adicional nem data.
- Correção posterior: em modo automático, a loja pública deixou de usar horários padrão de fallback quando existe grade configurada sem período válido para o dia, evitando mostrar `Aberto` fora do horário de atendimento.
- Ajuste posterior: o campo `Status da loja` no Admin foi simplificado para duas opções, `Automático pelos horários` e `Manual`, com um controle de aberta/fechada exibido apenas no modo manual.
- Correção posterior: a prévia do Admin deixou de forçar `Aberto` em modo automático e passou a calcular aberto/fechado pela grade semanal atual; no modo manual, o template público lê `manualClosed` e `manualOpen`.
- Ajuste visual posterior: o logo do card principal da loja pública voltou a exibir uma moldura branca.
- Ajuste visual posterior: o card principal recebeu um degradê suave com a cor da marca, reduziu espaçamentos internos e padronizou o tamanho dos textos informativos.

## 2026-05-20 — Template da loja alinhado ao padrão de Configurações
- Arquivos alterados: `public/js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Admin Loja Online: a tela `Template da loja` passou a seguir o padrão visual definido em `Compras → Configurações` e `Produção → Configurações`.
- Layout: topo, chips de status, abas internas e painéis receberam hierarquia mais compacta, degradê off-white, bordas suaves, sombra leve e botão primário no padrão BocaFood.
- Campos: inputs, selects, textareas, toggles e blocos internos do template ganharam acabamento mais consistente com o padrão administrativo aprovado, sem alterar IDs, salvamento ou lógica de publicação.
- Ajuste posterior: o Template da loja recebeu mais elementos do padrão da aba `Usuário`, com subcards mais leves, menos sombra, campos off-white com foco vermelho discreto, toggles compactos e divisórias internas para reduzir poluição visual.
- Ajuste posterior: os liga/desliga do Template da loja passaram a aparecer como checkboxes delicados e os títulos dos cards receberam ícones ao lado, seguindo a linguagem visual usada nas telas de Configurações.
- Ajuste posterior: a aba `Identidade` foi reorganizada com hierarquia mais clara, subcards com ícones no título e remoção do controle visível `Selo verificado`, preservando o valor existente de forma oculta para compatibilidade.
- Ajuste posterior: a aba `Identidade` foi simplificada visualmente para reduzir peso e poluição, removendo aparência de card dentro de card, usando divisórias sutis, ícones mais limpos e checkboxes sem caixa pesada.
- Ajuste posterior: removidos os subtítulos dos cards da aba `Identidade`, mantendo apenas títulos, ícones e campos para deixar a tela mais direta.
- Ajuste posterior: os campos de cor deixaram de mostrar uma segunda amostra visual redundante, mantendo apenas o seletor nativo de cor e o valor hexadecimal.
- Ajuste posterior: removidos os títulos internos `Dados públicos`, `Cor da marca` e `Arquivos da marca` da aba `Identidade`, deixando os campos mais diretos.
- Ajuste posterior: o card `Identidade visual` foi reorganizado em duas áreas simples, com campos principais à esquerda e arquivos da marca à direita, removendo subcards internos e excesso de bordas.
- Ajuste posterior: o card `Identidade visual` passou a ocultar o campo técnico de URL das imagens, removeu o campo editável `Nome público da loja`, renomeou `Slogan/frase curta` para `Apresentação curta`, renomeou `Cor principal` para `Cor da marca` e adicionou uma prévia visual simples da marca.
- Ajuste posterior: em `Identidade visual`, `Apresentação curta` passou a ocupar uma linha própria em textarea de três linhas, enquanto `Idioma principal da loja` e `Cor da marca` ficaram alinhados na mesma linha.
- Ajuste posterior: o campo `Cor da marca` passou a exibir a amostra da cor antes do código hexadecimal, mantendo a seleção visual integrada ao próprio campo.
- Ajuste posterior: os elementos gráficos dos cards de `Template da loja` passaram a usar tons neutros, mantendo o vermelho BocaFood mais concentrado em ações, seleções e destaques reais.
- Ajuste posterior: a lista `Idioma principal da loja` passou a exibir apenas o nome do idioma, sem o traço e o código técnico ao lado.
- Ajuste posterior: os blocos `Logo da loja` e `Favicon` passaram a usar uma única borda visual, removendo a borda duplicada da prévia interna.
- Ajuste posterior: o select `Idioma principal da loja` recebeu a seta interna no padrão visual definido, com ícone neutro e afastado da extremidade do campo.
- Ajuste posterior: a seta do select `Idioma principal da loja` foi corrigida com SVG codificado para garantir exibição no navegador.
- Ajuste posterior: o select `Idioma principal da loja` passou a usar exatamente o mesmo padrão de seta SVG dos selects aprovados em Compras, aplicado também no estilo inline do campo.
- Ajuste posterior: os blocos `Logo da loja` e `Favicon` ficaram sem borda externa, deixando apenas a hierarquia visual interna do conteúdo.
- Ajuste posterior: a seta do select `Idioma principal da loja` deixou de depender de background SVG e passou a ser um ícone visual posicionado dentro do campo, garantindo exibição consistente.
- Ajuste posterior: os controles do card `Card principal da loja` foram conectados ao template público publicado em `public/index.html`, respeitando exibição de logo, nome, apresentação, botão de informações, localização, status, canais, preparo, entrega, pedido mínimo e antecedência.
- Ajuste posterior: o preview do Admin em `Template da loja` passou a responder aos mesmos controles do `Card principal da loja`, evitando divergência entre configuração e prévia.
- Ajuste posterior: o template público passou a aplicar `faviconUrl` nos links de favicon/apple-touch-icon e `language`/`mainLanguage`/`storeLanguage` no atributo `lang` do HTML.
- Ajuste posterior: no card `Card principal da loja`, removidos os títulos internos `Identidade no card`, `Localização e status` e `Entrega e retirada`, deixando os controles mais diretos e limpos.
- Ajuste posterior: removidas as bordas internas do `Card principal da loja`, preservando apenas a divisória do título principal para uma leitura mais limpa.
- Ajuste posterior: removidas também as linhas internas geradas entre os checkboxes do `Card principal da loja`, deixando apenas a linha abaixo do título principal.
- Ajuste posterior: o `Card principal da loja` foi reorganizado em duas colunas, com controles de seleção à esquerda e uma prévia visual do card principal do template à direita, usando os dados atuais da loja.
- Ajuste posterior: o antigo card `Topo da loja` foi renomeado para `Banner promocional` e os títulos internos duplicados `Banner promocional` e `Banner promocional visual` foram removidos.
- Ajuste posterior: a prévia do `Card principal da loja` foi refinada para espelhar com mais fidelidade o card real do template público, incluindo hero com capa, navegação superior, card sobreposto, logo circular, linha de informações, chips de status/atendimento e link de mais informações no mesmo padrão visual.
- Ajuste posterior: o controle `Mostrar banner` foi renomeado para `Mostrar Faixa no Topo`, deixando a nomenclatura mais clara para a usuária.
- Ajuste posterior: na aba `Identidade`, `Logo da loja` e `Favicon` foram movidos para baixo de `Idioma principal da loja` e `Cor da marca`; a prévia do card principal passou a ficar fixa na coluna direita durante a edição dos cards da aba, atualizando em tempo real.
- Ajuste posterior: removidos da interface os controles finais `Elementos visíveis no topo`, `Mostrar cidade/região`, `Mostrar botão “Mais informações”` e `Mostrar chips de entrega/retirada`, preservando os valores internamente para compatibilidade; também removido o texto `Prévia do card principal`.
- Ajuste posterior: os cards `Logo da loja` e `Favicon` foram compactados, alinhados na mesma altura, sem borda externa e com notas de tamanho/formato recomendado.
- Ajuste posterior: os controles do `Card principal da loja` foram reorganizados em três colunas lógicas (`Identidade`, `Atendimento` e `Pedido`) para melhorar hierarquia e leitura.
- Ajuste posterior: os controles `Logo`, `Nome da loja`, `Slogan/frase curta` e `Botão “Mais informação”` passaram a formar a primeira fileira do `Card principal da loja`, deixando o restante organizado nas fileiras temáticas.
- Ajuste posterior: o card `Banner promocional` recebeu os switches premium `Mostrar Faixa no Topo` e `Mostrar no desktop`, com o switch principal alinhado à esquerda; o template público respeita a nova flag desktop sem alterar a exibição mobile.
- Ajuste posterior: o controle `Mostrar no mobile` passou a usar o mesmo switch premium de `Mostrar no desktop`, mantendo o mesmo campo e a mesma lógica de salvamento.
- Ajuste posterior: a prévia do card principal passou a acompanhar tanto o scroll do painel quanto o scroll da janela, alternando entre posição relativa, fixa e ancorada no fim para reproduzir o comportamento lateral do carrinho desktop no contexto rolável do Admin.
- Ajuste posterior: removida a linha vertical que separava os cards de configuração da prévia do template na aba `Identidade`.
- Ajuste posterior: a prévia da imagem no card `Logo da loja` ficou maior, dando mais presença visual ao arquivo enviado sem alterar upload ou salvamento.
- Ajuste posterior: os cards `Logo da loja` e `Favicon` foram realinhados na mesma linha, mantendo a logo maior e centralizando o favicon dentro da mesma altura visual.
- Ajuste posterior: o card `Favicon` deixou de mostrar a amostra grande da imagem e passou a manter apenas a prévia de como o ícone aparece na aba do navegador.
- Ajuste posterior: a listagem de controles do `Card principal da loja` foi reorganizada em quatro colunas: `Identidade`, `Localização`, `Atendimento` e `Pedido`.
- Ajuste posterior: a prévia em formato de aba do `Favicon` foi subida e alinhada com o card `Logo da loja`, mantendo a visualização compacta.
- Ajuste posterior: adicionada a opção `Nota de avaliação` no `Card principal da loja`; a prévia responde ao controle e o template público passa a mostrar a média real apenas quando houver avaliações aprovadas carregadas da aba `Avaliações`.
- Ajuste posterior: o favicon da usuária passou a ser carregado também a partir de `config/aparencia` no template público principal, e a página pública de avaliações passou a usar o favicon salvo em `template`/`aparencia`/`geral` com `apple-touch-icon`.
- Ajuste posterior: no card `Banner promocional`, a opção `Mostrar no desktop` foi movida para um card próprio no mesmo padrão visual do bloco `Mostrar no mobile`, separando melhor faixa, desktop e mobile.
- Ajuste posterior: no card `Banner promocional`, o bloco `Mostrar no mobile` passou a aparecer antes do bloco `Mostrar no desktop`.
- Ajuste posterior: o template público passou a respeitar o controle `Mostrar Faixa no Topo`, usando também o texto, cores e CTA configurados no card `Banner promocional`.
- Ajuste posterior: a orientação do campo `Favicon` foi ajustada para `Favicon recomendado: 32 × 32 px`, evitando sugerir 512 × 512 px como tamanho principal.
- Ajuste posterior: a prévia lateral do `Card principal da loja` agora mostra a faixa do topo quando `Mostrar Faixa no Topo` está ativo, respeitando texto e cores configurados.
- Ajuste posterior: no template público, `Mostrar Faixa no Topo` foi separado do card promocional com CTA; agora renderiza uma faixa simples no topo da loja, enquanto o card visual de promoções permanece independente.
- Ajuste posterior: a faixa do topo recebeu acabamento mais premium no desktop, com degradê, brilho sutil, sombra difusa e aparência mais flutuante.
- Ajuste posterior: a faixa do topo ficou mais larga no desktop e passou a respeitar `Permitir fechar banner`, exibindo um botão discreto de fechar quando a opção estiver ativa.
- Ajuste posterior: a prévia lateral do template passou a mostrar a `Imagem do banner promocional mobile` dentro do mockup do celular, conectada aos campos de imagem, selo, título, texto e botão da versão mobile.
- Ajuste posterior: a cor da faixa do topo no template público passou a ser normalizada antes de aplicar o degradê, evitando fallback visual branco quando a cor configurada é vermelha.
- Ajuste posterior: criada a página `public/preview-mobile.html` para visualizar a loja em moldura de celular diretamente no computador, aceitando `?tenant=`, `?slug=` ou `?src=`.
- Ajuste posterior: o banner promocional mobile recebeu seleção de promoção ativa e destino do clique, permitindo abrir o produto da promoção, a seção da promoção selecionada ou a seção com todas as promoções.
- Ajuste posterior: no desktop, a faixa do topo ficou mais próxima do banner principal da loja para reduzir o espaço visual entre os dois elementos.
- Ajuste posterior: a versão mobile do template público recebeu ajustes responsivos para telas menores, com navegação, card principal, banner promocional, filtros e produtos mais compactos.
- Ajuste posterior: `preview-mobile.html` passou a se adaptar melhor em telas menores de computador, reduzindo moldura, altura e espaçamentos.
- Ajuste posterior: no desktop, a capa do hero público foi ajustada sem margem externa e com altura mais estreita, mantendo a imagem em faixa cheia e o carrinho sobreposto.
- Ajuste posterior: o carrinho desktop deixou de ter rolagem interna; agora cresce conforme o conteúdo e a rolagem fica na página.
- Ajuste posterior: o carrinho desktop ganhou distância do topo e perdeu a aparência de sheet/janela mobile, sem alça interna nem fundo quadrado no cabeçalho.
- Ajuste posterior: no desktop, os botões de busca e sacola foram alinhados dentro do hero na coluna do carrinho, na mesma linha visual do botão de entrada.
- Ajuste posterior: o carrinho desktop recebeu margem à direita para respirar melhor dentro do hero.
- Ajuste posterior: o conteúdo da loja a partir do menu ganhou margem esquerda no desktop, mantendo o hero em faixa cheia sem recuo.
- Ajuste posterior: o card de destaque passou a aparecer antes da barra de menu/categorias no desktop e no mobile.
- Ajuste posterior: no mobile, o card principal da loja ficou mais compacto abaixo do link `Mais informações`, reduzindo o respiro inferior.
- Ajuste posterior: no mobile, o espaço entre o card principal da loja e `Destaque da casa` foi reduzido para aproximar o início do conteúdo.
- Ajuste posterior: o card `Destaque da casa` ganhou um pouco mais de respiro inferior no conteúdo.
- Ajuste posterior: `Cor da sobreposição da capa` passou a ser aplicada também na prévia lateral do Admin e no hero real do template público, usando cor e opacidade configuradas.
- Ajuste posterior: o card `Destaque da casa` recebeu margem inferior para separar melhor o destaque da barra de menu.
- Ajuste posterior: o link `Mais informações` deixou de ser sobrescrito pela cor neutra no template público e voltou a usar a cor da marca; os estados `Aberto` e `Fechado` permanecem verde e vermelho.
- Ajuste posterior: o avatar do botão `Entrar` passou a usar a cor da marca na prévia do Admin e no template público, exibindo ícone de pessoa quando não há usuário logado.
- Ajuste posterior: o avatar do botão `Entrar` no template público deixou de usar degradê e passou a usar cor sólida da marca.
- Ajuste posterior: o template público ganhou uma camada real de copy por idioma (`pt-BR`, `pt-PT`, `es-ES`, `en`, `fr`) para navegação, carrinho, checkout por WhatsApp, horários, avaliações, modal de produto, mensagens vazias e estados de loja indisponível, usando o idioma configurado na loja como fonte.
- Ajuste posterior: o card principal do topo mobile foi refinado com composição mais leve sobre a capa, efeito translúcido, logo menor e mais presente, informações rápidas em pílulas discretas, chips de status/atendimento mais organizados e link `Mais informações` mais compacto.
- Ajuste posterior: as pílulas das informações rápidas do card principal foram removidas; avaliação, tempo, mínimo, status, entrega e retirada agora aparecem como linhas limpas com pequenos elementos gráficos ao lado e começam abaixo do logo para reforçar a hierarquia visual mobile.
- Ajuste posterior: os elementos gráficos das informações rápidas do topo mobile deixaram de ter fundo/borda e foram trocados por ícones lineares mais coerentes com avaliação, tempo, pedido mínimo, status, entrega e retirada; as informações também perderam excesso de negrito.
- Ajuste posterior: os ícones das informações rápidas foram substituídos por um traço discreto na cor do texto e o link `Mais informações` deixou de ter aparência de pílula.
- Ajuste posterior: a primeira linha de informações do card principal mobile deixou de mostrar o traço, ganhou espaçamento menor entre itens e passou a alinhar pelo mesmo eixo do nome da marca, não pelo logo.
- Ajuste posterior: a segunda linha de status/atendimento também deixou de mostrar traço no primeiro item e passou a separar os itens com uma bolinha discreta na cor do texto.
- Ajuste posterior: a primeira linha de informações rápidas também passou a usar a mesma bolinha discreta de separação entre itens.
- Ajuste posterior: o espaçamento vertical interno do card principal mobile foi reduzido para deixar marca, informações rápidas, status e link de informações mais próximos.
- Ajuste posterior: as linhas de informações do card principal mobile agora quebram para a linha de baixo quando o texto não cabe inteiro, evitando corte ou rolagem horizontal.
- Ajuste posterior: quando as informações rápidas quebram de linha, o primeiro item visual de cada linha deixa de exibir a bolinha separadora.
- Ajuste posterior: o cálculo da bolinha separadora do topo mobile passou a rodar após o layout renderizar, no carregamento e no resize, garantindo bolinha apenas antes de itens que continuam na mesma linha.
- Ajuste posterior: o respiro inferior do card principal mobile foi reduzido entre o link `Mais informações` e a borda do card.
- Ajuste posterior: o texto do botão de acesso foi alinhado verticalmente e, em espanhol, passou a aparecer como `Iniciar sesión`.
- Ajuste posterior: o texto do botão de acesso recebeu ajuste fino de centralização dentro da pílula.
- Ajuste posterior: a estrutura do card principal em desktop foi restaurada, mantendo informações rápidas, status e `Mais informações` dentro do bloco do nome da marca como antes dos ajustes mobile.
- Ajuste posterior: a borda branca ao redor do logo no card principal da loja pública foi removida.
- Ajuste posterior: o card principal da loja pública recebeu um degradê muito leve com a cor da marca, preservando o fundo claro e a leitura premium.
- Ajuste posterior: a apresentação curta do card principal ganhou uma linha inferior discreta para separar melhor o texto das informações rápidas.
- Ajuste posterior: removido o botão circular de voltar com seta que ficava ao lado do botão de acesso no topo da loja pública.
- Ajuste posterior: no mobile, foi aumentado o respiro entre a linha inferior da apresentação curta e as informações rápidas abaixo.
- Escopo: mantidos os mesmos dados, rotas, Firebase, handlers, campos e funcionamento do template público.

## 2026-05-20 — Padrão visual em Produção → Configurações
- Arquivos alterados: `public/js/modules/receitas.js`, `AI_CHANGELOG.md`.
- Admin Produção: a tela `Configurações` passou a seguir o padrão visual de `Compras → Configurações`, com topo compacto, card de busca, chips de subárea, card principal e botão de adicionar no cabeçalho do card.
- UX: listas de etapas, categorias, tipos de insumos, categorias de insumos e unidades agora usam linhas com borda suave, fundo branco, hover leve e ações alinhadas.
- Copy: `Componentes da receita` passou a aparecer como `Etapas da receita`, alinhando a nomenclatura usada no modal de Receitas.
- Busca: adicionada busca visual por nome/descrição/símbolo dentro da área de configurações atual.
- Ajuste posterior: o cadastro de receita deixou de mostrar etapas e categorias padrão que não existem em `Produção → Configurações`; a tela de configurações passa a ser a fonte visível para essas listas.
- Ajuste posterior: a aba visual `Tipos de insumos` foi removida de `Produção → Configurações`, mantendo a lógica/coleção existente para compatibilidade com Compras.
- Ajuste posterior: removido o texto repetitivo `Disponível para insumos usados na produção.` das linhas de categorias de insumos.
- Ajuste posterior: adicionada pílula visual `Ativo`/`Inativo` nas linhas de categorias de insumos em `Produção → Configurações`, alinhada às ações da linha.
- Escopo: mantidas as coleções, rotas, permissões, modais e lógica de salvamento existentes.

## 2026-05-20 — Classe visível em Insumo/Produto Pronto
- Arquivos alterados: `public/js/modules/compras.js`, `AI_CHANGELOG.md`.
- Admin Compras: o modal `Novo/Editar Insumo/Produto Pronto` deixou de esconder o campo `Classe do item`.
- UX: o espaço vazio no card `Dados do item` foi removido e a usuária volta a ver a classe selecionada, mantendo o padrão visual do modal.
- Ajuste posterior: quando o modal é aberto pelo fluxo de `Insumos`/Produção, o campo `Classe do item` fica visível e bloqueado em `Insumo`; na aba geral `Produtos / Insumos`, segue editável.
- Escopo: mantido o valor padrão `insumo` ao abrir pelo fluxo de insumos, sem alterar salvamento, filtros ou estrutura de dados.

## 2026-05-19 — Modal de Receitas alinhado ao padrão de Produtos/Insumos
- Arquivos alterados: `public/js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Admin Produção: o modal de `Nova Receita`/`Editar Receita` passou a usar o mesmo padrão visual do modal de `Produtos / Insumos`.
- Layout: cards internos receberam degradê off-white, borda suave, sombra leve, cabeçalhos com ícones discretos e grid proporcional.
- Campos: inputs, selects, textarea e upload agora usam o wrapper `supplier-field-control`, com fundo off-white, foco vermelho discreto e seta interna nos selects.
- UX: o rodapé do modal passou a ter botões `Cancelar`, `Adicionar receita`/`Atualizar receita` e `Excluir` no mesmo padrão de ação usado nos cadastros de compras.
- Ajuste posterior: o card `Custos` foi reorganizado em `Composição do custo` e `Resultado da receita`, destacando o custo total e agrupando os valores relacionados para leitura mais clara.
- Ajuste posterior: o card `Produção` foi reorganizado em `Preparo` e `Conservação e validade`, com campos curtos mais compactos, textos alinhados e textarea principal ocupando o espaço adequado.
- Ajuste posterior: o cabeçalho `Produção` foi fixado no topo do card, antes dos subcards, para deixar claro que o texto orienta toda a seção.
- Ajuste posterior: no subcard `Conservação e validade`, o campo `Conservação` passou a ocupar a largura inteira e `Validade`/`Unidade` foram alinhados abaixo, evitando estouro visual e campos pequenos demais.
- Ajuste posterior: o cabeçalho `Produção` deixou de usar o ícone inexistente `skillet` e passou a usar `restaurant_menu`, mantendo o mesmo padrão visual dos outros cards.
- Ajuste posterior: a copy do modal foi revisada para linguagem mais clara para a usuária, removendo termos técnicos como `ficha técnica`, `componente` e `custos indiretos estimados` da interface principal.
- Ajuste posterior: o card `Rendimento` recebeu uma ajuda colapsável `Como preencher?`, explicando rendimento real, tipo de rendimento, peso por unidade e exemplos de preenchimento.
- Ajuste posterior: o card `Ingredientes` recebeu uma ajuda colapsável `Como preencher?`, orientando o uso de partes da receita e a quantidade realmente usada na produção.
- Ajuste posterior: a nomenclatura visual de `Parte da receita` foi trocada para `Etapa da receita` no card de ingredientes e no texto de ajuda.
- Ajuste posterior: a primeira frase da ajuda de `Ingredientes` foi simplificada para `Informe aqui o que entra em cada etapa da receita.`.
- Ajuste posterior: a primeira frase da ajuda de `Rendimento` foi ajustada para `Aqui você dirá quanto essa receita depois de pronta.`.
- Escopo: mantidos os mesmos IDs, handlers, cálculos, salvamento e estrutura de dados das fichas técnicas.

## 2026-05-19 — Fornecedor com endereço fiscal unificado
- Arquivos alterados: `public/js/modules/compras.js`, `AGENTS.md`, `AI_CHANGELOG.md`.
- Admin Compras: o cadastro de fornecedor deixou de exibir campos duplicados de endereço dentro da seção `Dados fiscais`.
- UX: o bloco `Endereço` passou a explicar que o endereço principal é usado em compras e também nos dados fiscais do fornecedor.
- Fiscal: `fiscal.fiscalAddress` continua sendo salvo a partir do endereço principal do fornecedor, preservando a estrutura fiscal futura sem duplicar preenchimento para a usuária.
- Ajuste posterior: o bloco `Dados fiscais` foi movido para o topo do modal de fornecedor e substituiu o antigo card `Dados do fornecedor`, concentrando identificação fiscal sem repetir os mesmos campos.
- Ajuste posterior: o campo `Regime fiscal` do fornecedor virou lista controlada, mantendo o salvamento em `fiscal.taxRegime` e evitando texto livre inconsistente.
- Ajuste posterior: a hierarquia visual do modal de fornecedor foi refinada no padrão da aba `Usuário`, com cards de borda suave, sombra menor, cabeçalhos com ícone discreto, espaçamento mais compacto e grupos de campos mais alinhados.
- Ajuste posterior: a copy do card `Dados fiscais` deixou de dizer que o cadastro é opcional e deixou de explicar bastidores técnicos; agora orienta que os dados identificam o fornecedor em compras, pagamentos e documentos.
- Ajuste posterior: os campos `WhatsApp` e `Telefone` do fornecedor passaram a usar o mesmo padrão visual da aba `Usuário`, com DDI e número dentro de um bloco único off-white, borda suave e foco vermelho discreto.
- Ajuste posterior: o modal de fornecedor recebeu uma grade mais proporcional, reduzindo padding e fazendo campos curtos como tipo de documento, país, número, código postal e prazo ocuparem menos largura, enquanto campos longos continuam com mais espaço.
- Ajuste posterior: todos os cards do modal de fornecedor foram reorganizados com classes próprias, hierarquia mais consistente, cards inferiores em duas colunas no desktop e quebra responsiva em telas menores.
- Ajuste posterior: removida a frase de ajuda `NIF, NIE ou CIF espanhol.` abaixo do campo de documento fiscal do fornecedor.
- Ajuste posterior: os campos de lista mantêm a seta visível, agora posicionada com mais respiro para dentro do campo quando a lista está fechada.
- Ajuste posterior: os cards de endereço, contato, compras/pagamento e observações passaram a usar o mesmo fundo suave do card `Dados fiscais`.
- Ajuste posterior: os inputs, selects e textarea do modal de fornecedor passaram a usar o mesmo padrão visual dos campos de telefone, com bloco off-white, borda suave e foco vermelho discreto.
- Ajuste posterior: o campo `País` do endereço do fornecedor deixou de ser uma lista fechada e passou a aceitar texto livre com sugestões, permitindo que o autocomplete preencha países fora da lista.
- Ajuste posterior: a copy da página `Compras → Fornecedores` foi ajustada para linguagem mais simples, trocando textos técnicos por orientações sobre contatos, documentos, pagamentos e cadastro de fornecedores.
- Ajuste posterior: a lista de fornecedores passou a exibir paginação no mesmo padrão de produtos, o seletor de quantidade ganhou seta com o mesmo respiro do modal e o card de filtros adotou o padrão off-white dos campos do modal.
- Documentação: registrado em `AGENTS.md` o padrão do modal de fornecedores como referência para próximos modais/cadastros do Admin, incluindo cards, campos, selects, grids, copy, estados vazios e paginação.
- Documentação: registrado em `AGENTS.md` o padrão de páginas de listagem do Admin, incluindo topo, badges, filtros, busca, tabela, colunas, status, ações, estado vazio, paginação e tom de copy.
- Documentação: `AGENTS.md` recebeu regra para copy de fornecedores ser clara, profissional, sem termos técnicos internos e sem tom apelativo.

## 2026-05-19 — Padrão de listagem em Produtos/Insumos
- Arquivos alterados: `public/js/modules/compras.js`, `AI_CHANGELOG.md`.
- Admin Compras: a listagem `Produtos / Insumos` recebeu o mesmo padrão visual definido em fornecedores para o card de filtros.
- UX: busca e filtros agora usam controles off-white, borda suave, foco vermelho discreto e selects com seta posicionada para dentro do campo.
- Paginação: o seletor de itens por página passou a usar a mesma seta alinhada do padrão de fornecedores/produtos.
- Copy: placeholder da busca ficou mais orientado ao uso real, permitindo buscar por nome, classe, tipo ou categoria.
- Ajuste posterior: os filtros ganharam mais espaçamento e quebra responsiva mais confortável, e a paginação recebeu borda superior e fundo suave para ficar visualmente mais clara no rodapé da tabela.
- Ajuste posterior: o botão `Limpar filtros` foi movido para uma segunda linha dentro do card, deixando os campos principais menos amontoados.
- Ajuste posterior: o modal de `Produtos / Insumos` passou a seguir o padrão visual do modal de fornecedores, com cards em degradê suave, campos off-white, selects com seta interna, grids proporcionais, métricas discretas e blocos de uso em receitas/revenda mais alinhados.
- Ajuste posterior: as proporções do modal foram refinadas para campos curtos não ocuparem espaço excessivo, mantendo unidade, tipo, categoria, embalagem, quantidade e métricas em larguras mais compactas.
- Documentação: o padrão de modais em `AGENTS.md` foi reforçado para evitar campos desalinhados ou esticados além do necessário.
- Ajuste posterior: o campo `Embalagem de compra padrão` foi compactado e o checkbox `Usar em receitas` perdeu o fundo/borda de card, ficando mais leve dentro do bloco.
- Ajuste posterior: a copy do modal foi simplificada para falar com a usuária sobre compras, produção e venda direta, removendo frases técnicas sobre cálculo, estoque e integração com outros módulos.
- Ajuste posterior: o título do modal de insumos passou para `Novo Insumo/Produto Pronto` e `Editar Insumo/Produto Pronto`.

## 2026-05-19 — Auditoria da base fiscal mínima
- Arquivos alterados: `AI_CHANGELOG.md`.
- Auditoria visual/funcional realizada nos módulos fiscais já alterados: produtos, clientes, fornecedores, pedidos, loja pública e configuração fiscal do tenant.
- Verificado que as seções `Dados fiscais` de produtos, clientes e fornecedores estão discretas, colapsadas e opcionais, sem transformar os cadastros em tela de ERP.
- Verificado que pedidos da loja pública, pedidos manuais e venda presencial montam `fiscal` com defaults e snapshots básicos sem emissão fiscal ou chamada externa.
- Verificado que a tela `Fiscal → Configurações` usa `tenants/{tenantId}/config/fiscal`, mantém compatibilidade com `ivaPadrao`/`defaultIvaRate` e não solicita credenciais de FacturaDirecta.
- Validação: `node --check` executado nos módulos JS envolvidos e `git diff --check` executado sem erros.
- Pendências mapeadas: teste manual no navegador com criação/edição real, futura trava transacional de numeração fiscal e integração externa ainda não implementada.

## 2026-05-19 — Configuração fiscal por tenant
- Arquivos alterados: `public/js/modules/fiscal.js`, `AI_CHANGELOG.md`.
- Admin Fiscal: a aba `Configurações` passou a editar a base fiscal salva em `tenants/{tenantId}/config/fiscal`.
- Estrutura: adicionados defaults para país, moeda, provedor fiscal, modo de emissão, tipo de fatura padrão, IVA padrão, preços com IVA, série, próximo número, FacturaDirecta e dados fiscais do negócio.
- UX: a tela foi reorganizada como preparação de faturação fiscal futura, com copy simples e aviso de que nenhuma fatura é emitida nesta etapa.
- Compatibilidade: mantidos `ivaPadrao`, `irpfPadrao`, `trimestreAtual` e `usarCalculoFiscal` para preservar as estimativas atuais de IVA/IRPF.
- Escopo: sem integração FacturaDirecta, sem VeriFactu, sem QR/XML/hash, sem emissão fiscal, sem alterações em pedidos existentes, Firebase Rules ou deploy.

## 2026-05-19 — Estrutura fiscal mínima em pedidos
- Arquivos alterados: `public/index.html`, `public/js/modules/pedidos.js`, `AI_CHANGELOG.md`.
- Loja pública: novos pedidos salvos em `tenants/{tenantId}/orders` passaram a incluir o objeto `fiscal` com defaults para futura faturação, sem emitir fatura nem chamar API externa.
- Admin Pedidos: pedidos manuais e de venda presencial passam a salvar `fiscal` com `invoiceType: simplified`, `fiscalStatus: not_issued` e `issueMode: automatic`.
- Compatibilidade: pedidos antigos sem `fiscal` recebem fallback em memória ao carregar no Admin e passam a gravar a estrutura ao serem salvos por fluxos de criação/atualização relacionados.
- Snapshots: adicionados `customerSnapshot`, `itemsSnapshot` e `totalsSnapshot` com dados básicos de cliente, itens, totais e fiscal de produto quando disponível, usando defaults seguros quando não houver dados fiscais.
- Escopo: preparação para futura FacturaDirecta/VeriFactu sem emissão fiscal, sem QR/XML/hash, sem alteração de cálculo de pedido, sem Firebase Rules e sem deploy.

## 2026-05-19 — Estrutura fiscal mínima nos cadastros
- Arquivos alterados: `public/js/modules/catalogo.js`, `public/js/modules/clientes.js`, `public/js/modules/compras.js`, `AI_CHANGELOG.md`.
- Produtos: adicionado suporte ao objeto `fiscal` com defaults para SKU, nome fiscal, IVA, categoria fiscal, unidade fiscal e IDs externos futuros, preservando preço atual com IVA incluído.
- Produtos: o modal ganhou uma seção discreta `Dados fiscais`, sem tornar os campos obrigatórios nem remover campos antigos.
- Clientes: adicionado suporte ao objeto `fiscal` com tipo de cliente, nome fiscal, documento, país ISO, e-mail de faturação, endereço fiscal e IDs externos futuros.
- Clientes: a seção `Dados fiscais` foi adicionada como área opcional, usando campos antigos como fallback visual e mantendo `nifCif`, `fiscalId`, e-mail e endereço antigos por compatibilidade.
- Fornecedores: adicionado suporte ao objeto `fiscal` com nome fiscal, documento, país ISO, e-mail de faturação, regime fiscal, dedutibilidade padrão, endereço fiscal e IDs externos futuros.
- Fornecedores: dados antigos como `nif`, `email`, endereço, cidade, estado/província, código postal e país passam a alimentar o objeto fiscal por fallback no salvamento.
- Escopo: base preparada para futura integração fiscal/facturación/VeriFactu via API externa, sem integrar provedor, sem emissão fiscal, sem mexer em pedidos, regras Firebase ou rotas.

## 2026-05-19 — Guia de uso de Configurações → Geral
- Arquivos alterados: `public/js/modules/suporte.js`, `AI_CHANGELOG.md`.
- Admin: a Central de Ajuda ganhou um card `Configurações` com guia detalhado para a aba `Geral`.
- Conteúdo: adicionadas explicações práticas para Perfil do negócio, logo, nome comercial, nome fiscal, apresentação curta, contatos da loja e dados fiscais do negócio.
- Organização: removida a categoria separada `Conta e acesso`; o guia passou a ser `Configurações → Usuário`, dentro do grupo `Configurações`.
- Navegação: os cards principais agora abrem uma lista de guias do módulo; cada guia abre as instruções do submódulo com botões para voltar aos guias, voltar aos módulos e abrir a tela correspondente.
- Navegação: os cards dos módulos ficam visíveis apenas na tela inicial; ao abrir um módulo ou guia, a lista de módulos é ocultada até a usuária voltar.
- Comunicação: linguagem orientada à usuária, sem termos técnicos internos e sem expor lógica de bastidores.

## 2026-05-19 — Contatos da loja na aba Negócio do Master
- Arquivos alterados: `master.html`, `AI_CHANGELOG.md`.
- Master: adicionados os campos `Telefone da loja` e `WhatsApp da loja` na aba `Negócio` do modal de conta.
- Leitura: os campos exibem dados de `system_tenants/{uid}.store.phoneFull/phone` e `store.whatsappFull/whatsapp`, sincronizados pelo Admin em `Configurações → Geral`.
- Escopo: alteração pontual no Master liberada para esta demanda; demais áreas do Master permanecem congeladas.

## 2026-05-19 — Limpeza de rótulos no Perfil da loja
- Arquivos alterados: `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- Admin: removidos os textos superiores `Perfil da loja`, subtítulo, `Prévia da loja` e a pílula de país no topo da primeira dobra de `Configurações → Geral`.
- Admin: o formulário principal agora usa `Perfil do negócio` com subtítulo focado em como a marca aparece no BocaFood.
- Admin: removidos os mini cards de resumo `Nome comercial`, `Documento` e `País fiscal` da prévia esquerda.
- Admin: refinado o alinhamento dos campos do card `Perfil do negócio`, com upload de logo mais limpo e campos principais em grade equilibrada.
- Admin: removido o campo visual `Idioma do painel` da aba Geral, mantendo o valor interno em campo oculto para preservar compatibilidade de salvamento.
- Verificação: `Moeda` segue visível, mas hoje aparece como configuração salva em `geral.currency/defaultCurrency`; os módulos financeiros encontrados ainda usam EUR fixo para formatação.
- Admin: removido o campo visual `Moeda` da aba Geral; o valor segue preservado em campo oculto para manter compatibilidade com o salvamento existente.
- Admin: separados os campos `Telefone da loja` e `WhatsApp da loja` na aba Geral, salvando `phone` e `whatsapp` de forma independente.
- Sincronização: o WhatsApp da aba Geral deixou de sobrescrever os campos de WhatsApp do usuário responsável; os contatos da loja passam a ser sincronizados dentro de `store`.
- Admin: refinado o bloco `Contato e preferências`, com campos em grade mais compacta, espaçamento menor e foco off-white sutil ao preencher.
- Admin: os campos de telefone e WhatsApp da loja ganharam composição própria, com DDI e número no mesmo bloco visual para melhorar alinhamento e leitura.
- Admin: aplicado o mesmo padrão sutil de campos off-white e foco rosado ao card `Perfil do negócio`.
- Admin: aplicado o mesmo padrão visual na aba `Usuário`, incluindo campos off-white, foco rosado e WhatsApp em bloco unificado com DDI.
- Admin: compactado e alinhado o layout da aba `Usuário`, reduzindo espaçamentos e mantendo campos em grade no desktop.
- Admin: a aba `Usuário` passou a seguir a mesma estrutura visual de `Contato e preferências`, com um bloco único de campos e menos divisões internas.
- Admin: aplicado o mesmo padrão visual no bloco `Dados fiscais do negócio`, com campos off-white, foco rosado e readonly mais suave.
- Admin: `Dados fiscais do negócio` passou a seguir a mesma estrutura visual de `Contato e preferências`, com um bloco único de campos e dica integrada ao cabeçalho interno.
- Admin: `Perfil do negócio` passou a seguir a mesma estrutura visual de `Contato e preferências`, com um bloco único de campos e upload integrado.
- Admin: removida a frase auxiliar da prévia esquerda da loja para reduzir peso visual.
- Admin: compactada a grade de `Informações fiscais`, deixando campos curtos em colunas menores e campos longos com largura proporcional.
- Escopo: ajuste apenas visual/copy; campos, upload e salvamento permanecem inalterados.

## 2026-05-19 — Perfil da loja em Configurações
- Arquivos alterados: `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- Admin: a primeira dobra de `Configurações → Geral` foi refeita como `Perfil da loja`.
- UX: a coluna esquerda virou uma prévia visual da loja, com logo, nome comercial, apresentação curta e badges de país/documento.
- Copy: o formulário principal passou a usar `Dados principais`, `Logo da marca`, `Nome comercial` e `Apresentação curta`, removendo termos corporativos ou técnicos dessa dobra.
- Escopo: alteração apenas de layout/copy; upload, IDs de campos, salvamento, Firestore, tenant e lógica fiscal permanecem inalterados.

## 2026-05-19 — Remoção do cabeçalho em Dados da loja
- Arquivos alterados: `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- Admin: removido o cabeçalho visual com `Dados da loja` e o subtítulo da rota `Configurações → Geral`.
- Escopo: ajuste apenas visual; cards, campos, salvamento e lógica permanecem inalterados.

## 2026-05-19 — Segunda dobra de Dados da loja
- Arquivos alterados: `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- Admin: ajustada a segunda dobra de `Configurações → Geral`, com `Contato e preferências`, `Preferências do painel` e `Dados fiscais do negócio`.
- Copy: adicionados textos de apoio para atendimento, e-mails, idioma, moeda, documento fiscal, endereço fiscal, país e país fiscal.
- UX: removidas mensagens técnicas visíveis sobre Master, Google Places, BocaPlaces e módulos fiscais, mantendo orientações simples para a usuária.
- Escopo: ajuste apenas visual/copy; permissões, rotas, Firestore, multi-tenant, integração de endereço e lógica fiscal permanecem inalterados.

## 2026-05-19 — Primeira dobra de Dados da loja
- Arquivos alterados: `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- Admin: a primeira dobra de `Configurações → Geral` foi renomeada visualmente para `Dados da loja`.
- Copy: ajustados título, subtítulo, card `Identidade da loja`, labels e textos de apoio para logo, nome comercial/marca, nome fiscal, documento fiscal e descrição curta da marca.
- UX: o campo técnico da URL do avatar foi ocultado da usuária, mantendo o valor no mesmo campo interno para preservar o salvamento.
- Escopo: ajuste apenas visual/copy; rotas, permissões, Firestore, tenant e lógica fiscal permanecem inalterados.

## 2026-05-18 — Remoção do Responsável legal em Geral
- Arquivos alterados: `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- Admin: removido o campo visual `Responsável legal` da aba `Configurações → Geral`.
- Dados: o salvamento da aba Geral deixou de escrever `legalRepresentative` e `responsavelLegal`.
- Sincronização: a aba Geral deixou de atualizar `ownerName` e `responsibleName`, evitando misturar dados do negócio com dados do usuário.
- Compatibilidade: dados antigos não são apagados automaticamente.

## 2026-05-18 — Remoção do Nome comercial em Geral
- Arquivos alterados: `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- Admin: removido o campo visual `Nome comercial` da aba `Configurações → Geral`.
- Dados: o salvamento da aba Geral deixou de escrever `tradeName` e `commercialName`; o campo `Nome do negócio` passa a ser a origem usada para loja, slug sugerido e sincronização com `system_tenants.store.name`.
- Compatibilidade: valores antigos de `tradeName/commercialName` ainda podem preencher `Nome do negócio` quando não houver `businessName`, sem apagar dados existentes.

## 2026-05-18 — Copy neutra na Central de Ajuda
- Arquivos alterados: `public/js/modules/suporte.js`, `AI_CHANGELOG.md`.
- Admin: ajustados textos da Central de Ajuda para ficarem detalhados, porém mais neutros e profissionais.
- Copy: removidas frases que revelavam intenção interna de comunicação ou soavam excessivamente explicativas.
- Escopo: ajuste apenas de texto; layout, chamados, rotas e salvamento permanecem iguais.

## 2026-05-18 — Textos detalhados na Central de Ajuda
- Arquivos alterados: `public/js/modules/suporte.js`, `AI_CHANGELOG.md`.
- Admin: os textos da Central de Ajuda foram enriquecidos com explicações mais humanas e detalhadas para usuárias com dificuldade.
- Guias: os cards e conteúdos de `Primeiros passos` e `Conta e acesso` agora explicam com mais contexto o que preencher, por que preencher e o que fazer em caso de dúvida.
- Escopo: alteração apenas de copy/ajuda; chamados, rotas, Master e salvamento não foram alterados.

## 2026-05-18 — Central de Ajuda em formato de biblioteca
- Arquivos alterados: `public/js/modules/suporte.js`, `AI_CHANGELOG.md`.
- Admin: a rota `/suporte/guias` foi redesenhada como home de Central de Ajuda, com hero, busca, botões rápidos e cards por categoria.
- Guias: a página principal agora mostra categorias como Primeiros passos, Conta e acesso, Loja Online, Cardápio, Pedidos, Financeiro, Ações de vendas e Suporte.
- UX: o conteúdo detalhado de `Conta e acesso` só aparece ao clicar no card, evitando que a home pareça uma tabela/lista administrativa.
- Visual: mantido o padrão BocaFood com fundo claro, cards brancos, sombra suave, cantos arredondados e vermelho apenas como destaque.

## 2026-05-18 — Guia de Configurações → Usuário
- Arquivos alterados: `public/js/modules/suporte.js`, `AI_CHANGELOG.md`.
- Admin: a Central de Ajuda agora inclui um guia disponível para `Configurações → Usuário`.
- Conteúdo: adicionadas explicações para nome completo, nome curto, e-mail de acesso, redefinição de senha, WhatsApp de contato e botão de salvar.
- Escopo: ajuste apenas em guias de ajuda; chamados, Master, rotas e salvamento não foram alterados.

## 2026-05-18 — Reset de senha na tela Usuário
- Arquivos alterados: `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- Admin: adicionada a ação `Enviar link para redefinir senha` ao lado do e-mail de acesso na tela `Configurações → Usuário`.
- Integração: a ação reutiliza a Function publicada `requestPasswordResetEmail`, a mesma do fluxo `Esqueci minha senha`.
- Escopo: ajuste localizado no Admin; não altera autenticação, backend, Master, rotas ou estrutura de dados.

## 2026-05-18 — Conta / Usuária renomeada para Usuário
- Arquivos alterados: `public/js/modules/configuracoes.js`, `public/admin.html`, `AI_CHANGELOG.md`.
- Admin: a seção visual `Dados da responsável` passou a se chamar `Usuário`.
- Menu lateral: o item `Conta / Usuária` em Configurações foi renomeado para `Usuário`, mantendo a mesma rota interna.
- Escopo: ajuste apenas de nomenclatura; rotas, dados e salvamento permanecem iguais.

## 2026-05-18 — Remoção de linhas restantes na conta
- Arquivos alterados: `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- Admin: removidas as linhas divisórias restantes da tela de conta para deixar o card mais limpo.
- Escopo: ajuste apenas visual; campos e salvamento permanecem iguais.

## 2026-05-18 — Preferências da conta ocultas no Admin
- Arquivos alterados: `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- Admin: removido temporariamente o bloco visual `Preferências da conta` da tela da conta.
- Admin: o idioma salvo por essa tela fica fixo em `pt-BR`, focando o painel em português nesta fase.
- Escopo: ajuste localizado em `Conta / Usuária`; demais telas, rotas e autenticação permanecem iguais.

## 2026-05-18 — Remoção do cabeçalho de Minha conta
- Arquivos alterados: `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- Admin: removido o cabeçalho `Minha conta no BocaFood` e o subtítulo `Dados de quem administra a loja e recebe informações importantes da conta`.
- Escopo: ajuste apenas visual/copy; campos e salvamento permanecem iguais.

## 2026-05-18 — Nome completo sem fallback de negócio
- Arquivos alterados: `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- Admin: o campo `Seu nome completo` em `Minha conta no BocaFood` deixou de herdar `legalRepresentative` e `tradeName`.
- Dados: o campo agora usa apenas dados da usuária (`ownerName`) vindos do tenant/configuração da conta.
- Escopo: ajuste localizado de origem visual do campo; salvamento e demais campos permanecem iguais.

## 2026-05-18 — Remoção de Função na loja
- Arquivos alterados: `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- Admin: removido o campo visual `Função na loja` da tela `Minha conta no BocaFood`.
- Escopo: ajuste apenas de interface; dados de papel/acesso continuam controlados pelo sistema/Master.

## 2026-05-18 — Remoção do título Dados pessoais
- Arquivos alterados: `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- Admin: removidos o título `Dados pessoais` e a descrição `Dados básicos da pessoa responsável pela conta` da tela `Minha conta no BocaFood`.
- Escopo: ajuste apenas de copy/layout; campos e salvamento permanecem iguais.

## 2026-05-18 — Minha conta no BocaFood
- Arquivos alterados: `public/js/modules/configuracoes.js`, `public/admin.html`, `AI_CHANGELOG.md`.
- Admin: a tela `Configurações → Conta / Usuária` foi renomeada visualmente para `Minha conta no BocaFood`, com copy mais clara para dados da responsável.
- Layout: campos reorganizados em três blocos dentro do card principal: Dados pessoais, Acesso e contato, e Preferências da conta.
- Admin: o botão final passou a ser `Salvar alterações` dentro do card, alinhado no rodapé à direita.
- Admin: removidos textos técnicos da visão da usuária e ajustada a função `Dono da loja` para `Responsável pela loja`.
- Menu lateral: o card `Precisa de ajuda?` recebeu copy curta e CTA `Abrir ajuda`.

## 2026-05-18 — Card de avatar sem rótulo
- Arquivos alterados: `public/admin.html`, `AI_CHANGELOG.md`.
- Admin: removido o rótulo `Conta BocaFood` do card lateral do avatar, mantendo apenas nome da conta e plano.
- Escopo: ajuste apenas visual no menu lateral; não altera identidade, tenant, autenticação ou lógica.

## 2026-05-18 — Botão simples em Conta / Usuária
- Arquivos alterados: `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- Admin: removido o card que envolvia a ação final da tela `Conta / Usuária`, deixando apenas o botão `Salvar Conta / Usuária`.
- Escopo: ajuste apenas visual; salvamento e campos permanecem iguais.

## 2026-05-18 — Remoção de microcopy técnica em Conta / Usuária
- Arquivos alterados: `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- Admin: removido o texto técnico `Esses dados são sincronizados para o Master em system_tenants/{uid}` da tela `Configurações → Conta / Usuária`.
- Escopo: ajuste apenas de texto; salvamento, campos e sincronização permanecem iguais.

## 2026-05-18 — Nome social na Conta / Usuária
- Arquivos alterados: `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- Admin: adicionada a entrada `Nome social / nome curto` em `Configurações → Conta / Usuária`.
- Dados: o campo salva em `system_tenants/{uid}.preferredName` e `system_tenants/{uid}.socialName`, mantendo compatibilidade com a leitura do Master.
- Escopo: ajuste localizado no Admin; Master, autenticação, rotas e demais campos permanecem iguais.

## 2026-05-18 — Conta / Usuária sem abas superiores
- Arquivos alterados: `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- Admin: removidas as abas superiores internas da tela `Configurações → Conta / Usuária`, mantendo apenas o conteúdo da própria aba.
- Escopo: ajuste visual localizado; menu lateral, rotas, salvamento e demais telas de Configurações permanecem iguais.

## 2026-05-18 — Ajuste do card de conta no Admin
- Arquivos alterados: `public/admin.html`, `AI_CHANGELOG.md`.
- Admin: o card lateral da conta deixou de exibir o rótulo fixo `Carregando` depois do perfil carregado.
- Admin: corrigida a duplicidade `Plano Plano Essencial`; agora o card mostra apenas o nome do plano.
- Escopo: ajuste apenas visual/textual no menu lateral; não altera autenticação, tenant, Master ou regras do sistema.

## 2026-05-18 — Card de ajuda sem borda no Admin
- Arquivos alterados: `public/admin.html`, `AI_CHANGELOG.md`.
- Admin: removida a linha/borda do card lateral `Precisa de ajuda?`, mantendo sombra suave e hover.
- Escopo: ajuste apenas visual no menu lateral; não altera rotas, chamados, Master ou lógica do sistema.

## 2026-05-18 — Favicon BocaFood sincronizado com novo arquivo
- Arquivos alterados: `public/assets/boca-food-favicon.png`, `assets/boca-food-favicon.png`, `AI_CHANGELOG.md`.
- Identidade: o arquivo atualizado `public/favicon BocaFood.png` foi aplicado novamente aos favicons padrão do BocaFood.
- Escopo: ajuste apenas de asset visual; não altera templates públicos das lojas nem lógica do sistema.

## 2026-05-18 — Favicon BocaFood trocado novamente
- Arquivos alterados: `public/assets/boca-food-favicon.png`, `assets/boca-food-favicon.png`, `AI_CHANGELOG.md`.
- Identidade: o arquivo `public/favicon BocaFood.png` foi sincronizado novamente para os favicons padrão usados pelas páginas BocaFood.
- Escopo: ajuste apenas de asset visual; templates públicos das lojas continuam usando o favicon configurado pela usuária.

## 2026-05-18 — Copy do card de ajuda no Admin
- Arquivos alterados: `public/admin.html`, `AI_CHANGELOG.md`.
- Admin: o card lateral de ajuda passou a exibir `Precisa de ajuda?` e `Acesse a ajuda ou fale com o suporte.`
- Escopo: ajuste apenas de texto; não altera rotas, suporte, chamados, Master ou lógica do sistema.

## 2026-05-18 — Central de Ajuda / Chamados no Master
- Arquivos alterados: `master.html`, `server.rb`, `AI_CHANGELOG.md`.
- Master: criada a aba `Central de Ajuda / Chamados` para a equipe BocaFood visualizar os chamados abertos no Admin/Centro de Controle.
- Backend local: criado endpoint `GET /api/master/support/tickets`, agregando os documentos salvos em `tenants/{tenantUid}/support_tickets` e conectando campos como assunto, mensagem, tipo, prioridade, status, contato, conta e datas.
- Escopo: mudança pontual autorizada no Master; não altera telas prontas, fluxos de e-mail, Hotmart, pedidos, clientes finais, template público ou regras de cobrança.

## 2026-05-18 — Clareza na etapa Você do cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: a etapa `Você` foi ajustada para `Dados do responsável pela conta`, com copy mais clara sobre identificação, suporte, segurança e comunicações importantes.
- Layout: adicionada separação sutil entre dados do responsável e preferência da conta, além de aviso discreto informando que os dados podem ser alterados depois em Configurações.
- Escopo: alteração apenas visual/copy; campos, validação, Firebase, Firestore, Hotmart, rotas e salvamento permanecem iguais.

## 2026-05-18 — Favicon BocaFood sincronizado novamente
- Arquivos alterados: `public/assets/boca-food-favicon.png`, `assets/boca-food-favicon.png`, `AI_CHANGELOG.md`.
- Identidade: o novo `public/favicon BocaFood.png` foi sincronizado novamente para os assets padrão do sistema.
- Escopo: alteração visual de asset; não altera favicon dinâmico das lojas públicas nem lógica do sistema.

## 2026-05-18 — Remoção do texto Primeiro acesso
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: removido o texto visual `Primeiro acesso` do topo da tela para deixar o início mais limpo.
- Escopo: ajuste apenas visual; fluxo, autenticação, Firebase e Hotmart não foram alterados.

## 2026-05-18 — Clareza no primeiro acesso
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: a etapa inicial passou a explicar melhor que o acesso deve usar o mesmo e-mail da compra, com aviso discreto antes das opções de Google ou senha.
- Copy: atualizados título, subtítulo, separador, label e placeholder do e-mail; removida a frase duplicada abaixo dos campos.
- UX: o botão `Continuar` fica desativado na etapa inicial enquanto e-mail, senha e confirmação não estiverem válidos, sem alterar o fluxo de autenticação.

## 2026-05-18 — Favicon BocaFood atualizado
- Arquivos alterados: `public/assets/boca-food-favicon.png`, `assets/boca-food-favicon.png`, `AI_CHANGELOG.md`.
- Identidade: o novo arquivo `public/favicon BocaFood.png` foi sincronizado para os assets padrão usados por Admin, cadastro, login, Master publicado, páginas do sistema e páginas internas BocaFood.
- Escopo: não altera favicon dinâmico dos templates públicos das lojas, que continuam usando a configuração da usuária quando existir.

## 2026-05-18 — Logo maior no cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: a logo BocaFood no topo da tela foi aumentada no desktop e no mobile para ganhar mais presença visual.
- Escopo: ajuste somente visual; fluxo de cadastro, Firebase, Hotmart, salvamento e autenticação não foram alterados.

## 2026-05-18 — Logo atualizada nos e-mails
- Arquivos alterados: `functions/index.js`, `server.rb`, `master.html`, `AI_CHANGELOG.md`.
- E-mails: a URL padrão da logo BocaFood usada nos layouts transacionais recebeu versão/cache-busting para evitar que clientes de e-mail continuem exibindo a imagem antiga em cache.
- Master/local: a prévia dos templates e o envio local passam a usar a mesma URL versionada da logo atual.
- Escopo: ajuste de asset visual; SMTP, gatilhos, templates e credenciais não foram alterados.

## 2026-05-18 — CTA robusto nos e-mails transacionais
- Arquivos alterados: `functions/index.js`, `server.rb`, `master.html`, `AI_CHANGELOG.md`.
- E-mails: o botão CTA agora abre em nova aba e inclui um link textual de fallback com a mesma URL, útil quando o cliente de e-mail bloqueia o clique no botão estilizado.
- Template Hotmart: confirmado que `welcome_hotmart` resolve `{{signupUrl}}` para `https://bocafood.app/cadastro`; a prévia passa a mostrar também o fallback.
- Escopo: ajuste de renderização do e-mail e prévia; SMTP, Hotmart, gatilhos e dados salvos não foram alterados.

## 2026-05-18 — Prévia e CTA do template Hotmart
- Arquivos alterados: `master.html`, `functions/index.js`, `server.rb`, `AI_CHANGELOG.md`.
- Master: a prévia do template `Boas-vindas após compra Hotmart` deixou de usar uma amostra fixa e passou a renderizar o assunto, preheader, corpo e CTA realmente editados no template.
- E-mails: defaults de prévia/teste/local foram alinhados para `https://bocafood.app`, garantindo que `{{signupUrl}}` aponte para `https://bocafood.app/cadastro`.
- Escopo: ajuste de prévia e URLs padrão; SMTP, gatilhos Hotmart, mapeamento de planos e dados salvos não foram alterados.

## 2026-05-18 — Link de privacidade no cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: a Política de Privacidade agora fica clicável também dentro da frase do aceite final, junto dos Termos de Uso.
- Link: a URL padrão de privacidade do cadastro passou a usar `https://bocafood.app/privacidade`, rota pública mapeada para a página institucional publicada.
- Escopo: ajuste de link/copy; criação de conta, aceite, Firebase, Hotmart e salvamento não foram alterados.

## 2026-05-18 — Rodapé padronizado na prévia de e-mails
- Arquivos alterados: `master.html`, `AI_CHANGELOG.md`.
- Master: a prévia dos templates transacionais agora usa o mesmo padrão de rodapé do envio real, com Segurança, suporte, motivo do e-mail, marca, Termos de uso e Política de privacidade.
- Escopo: ajuste visual/consistência da prévia; SMTP, gatilhos, Functions, endpoints e templates salvos não foram alterados.

## 2026-05-18 — Scroll no cadastro mobile
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: ao trocar de etapa no onboarding, a página agora retorna ao topo da tela para evitar que o celular abra a próxima etapa na parte final do card.
- Escopo: ajuste apenas de usabilidade/rolagem; fluxo de cadastro, autenticação, Hotmart, Firebase e salvamento não foram alterados.

## 2026-05-17 — Respostas do cadastro no Master
- Arquivos alterados: `master.html`, `AI_CHANGELOG.md`.
- Master: criada aba `Cadastro` no modal de conta para visualizar as respostas do onboarding salvas em `system_tenants/{uid}.businessProfile`.
- Visualização: respostas agrupadas em Loja, Vendas, Estrutura e Momento, com campos somente leitura e estado vazio quando não houver cadastro inicial.
- Escopo: alteração de interface/leitura; não altera dados, permissões, Firebase, Hotmart, e-mails ou salvamento.

## 2026-05-17 — E-mail de cadastro concluído
- Arquivos alterados: `functions/index.js`, `master.html`, `AI_CHANGELOG.md`.
- E-mails: criado o template padrão `welcome_access_created` para cadastro concluído com compra Hotmart ativa vinculada.
- Onboarding: após `signup_completed`, a Function envia o template por SMTP usando as configurações salvas no Master e registra o resultado em `email_logs`.
- Segurança: o envio não expõe credenciais e não bloqueia a criação da conta se o SMTP/template falhar.

## 2026-05-17 — E-mail de suporte no cadastro sem compra
- Arquivos alterados: `public/cadastro.html`, `functions/index.js`, `AI_CHANGELOG.md`.
- Cadastro: a mensagem de compra não localizada agora informa o suporte `teajudo@bocafood.app`.
- Backend: o retorno `NO_ACTIVE_PURCHASE` da Function também usa a mesma mensagem.
- Escopo: alteração apenas de copy; fluxo de cadastro, autenticação e vínculo Hotmart não foram alterados.

## 2026-05-17 — Pílulas uniformes na tela 3
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: a etapa `Dados da loja` passou a usar o mesmo alinhamento central, altura uniforme e fonte ajustada das telas seguintes.
- Escopo: alteração apenas visual; campos, seleções e salvamento não foram alterados.

## 2026-05-17 — Pílulas uniformes na tela 4
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: a etapa `Como sua loja vende hoje` passou a usar o mesmo alinhamento central, altura uniforme e fonte ajustada das telas 5 e 6.
- Escopo: alteração apenas visual; exclusividade de canais, fluxo e salvamento não foram alterados.

## 2026-05-17 — Pílulas uniformes na tela 5
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: a etapa `Estrutura e capacidade` passou a usar o mesmo alinhamento central, altura uniforme e fonte ajustada das pílulas da tela 6.
- Escopo: alteração apenas visual; fluxo, seleção e salvamento não foram alterados.

## 2026-05-17 — Pílulas uniformes na tela 6
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: as pílulas da etapa `Momento do negócio` agora têm texto centralizado, altura uniforme e fonte ajustada para caber melhor.
- Escopo: alteração apenas visual na etapa 6; fluxo e salvamento não foram alterados.

## 2026-05-17 — Alinhamento das pílulas da tela 6
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: os textos das pílulas da etapa `Momento do negócio` foram alinhados verticalmente dentro das opções.
- Escopo: alteração apenas visual; fluxo, seleção e salvamento não foram alterados.

## 2026-05-17 — Finalização premium no cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: a etapa `Finalização` recebeu bloco visual alinhado aos subcards das etapas anteriores, com borda vermelha suave, ícone discreto e lista de confirmação.
- Escopo: alteração apenas visual/copy; redirecionamento, lógica, Firebase e Hotmart não foram alterados.

## 2026-05-17 — Subcards em Momento do negócio
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: a etapa `Momento do negócio` passou a usar o mesmo layout das etapas anteriores, com subcards para desafio, objetivo, fase e tempo disponível.
- Campos: mantidos os mesmos dados salvos (`mainChallenge`, `mainGoal`, `businessStage`, `weeklyTimeAvailable`).
- Escopo: alteração apenas visual/copy; fluxo e salvamento não foram alterados.

## 2026-05-17 — Subcards em Estrutura e capacidade
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: a etapa `Estrutura e capacidade` passou a usar o mesmo layout das etapas anteriores, com subcards de borda vermelha suave, títulos fortes e textos auxiliares.
- Campos: mantidos os mesmos dados salvos (`productionPlace`, `dailyCapacity`, `teamStructure`, `costKnowledge`).
- Escopo: alteração apenas visual/copy; fluxo e salvamento não foram alterados.

## 2026-05-17 — Subcards também em Dados da loja
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: a etapa `Dados da loja` passou a usar o mesmo design da etapa `Como sua loja vende hoje`, com subcards de borda vermelha suave, fundo leve e títulos mais fortes.
- CSS: criado padrão compartilhado `boxed-step` para reutilizar o layout visual entre etapas sem alterar lógica ou dados.
- Escopo: alteração apenas visual; fluxo, seleções e salvamento não foram alterados.

## 2026-05-17 — Borda vermelha nos subcards de vendas
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: os subcards da etapa `Como sua loja vende hoje` receberam borda vermelha suave e títulos com peso maior.
- Escopo: alteração apenas visual; lógica, seleções e dados salvos não foram alterados.

## 2026-05-17 — Sub-blocos visuais na etapa de vendas
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: a etapa `Como sua loja vende hoje` recebeu sub-blocos sutis para Ritmo de vendas, Canais de pedido, Cardápio e Controle de pedidos.
- Visual: cada pergunta agora tem borda suave, fundo levemente rosado, padding próprio e maior separação entre título, ajuda e opções.
- Escopo: alteração apenas visual; fluxo, seleções, Firebase, preview, Hotmart e estrutura de dados não foram alterados.

## 2026-05-17 — Clareza da etapa Como vende hoje
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: a etapa passou a se chamar `Como sua loja vende hoje`, com subtítulo e textos auxiliares mais claros.
- Opções: removido `Boca a boca` dos canais, simplificados textos de cardápio e controle de pedidos, mantendo compatibilidade com os campos existentes.
- Usabilidade: `Ainda não recebo pedidos` agora é opção exclusiva nos canais de pedido, desmarcando outros canais e sendo desmarcada quando outro canal é escolhido.
- Escopo: alteração visual/copy e regra local da etapa; fluxo, Firebase, autenticação, Hotmart e rotas não foram alterados.

## 2026-05-17 — Padrão visual aplicado à etapa Vendas
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: a etapa `Como você vende hoje` passou a usar o mesmo padrão visual da etapa `Dados da loja`, com seções, textos auxiliares e cards compactos selecionáveis.
- Layout: removido o visual pesado de grade genérica na etapa 4, mantendo seleção por check discreto e compatibilidade com os campos existentes.
- Escopo: alteração apenas visual/copy; fluxo, autenticação, Firebase, Hotmart e rotas não foram alterados.

## 2026-05-17 — Nome da loja herdado no Admin
- Arquivos alterados: `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- Admin: o campo `Nome do negócio` em Configurações → Geral agora usa `system_tenants/{uid}.store.name` como fallback quando `config/geral.businessName` ainda não foi preenchido.
- Cadastro: o `Nome da loja` salvo no onboarding passa a aparecer no respectivo campo do Admin sem exigir preenchimento manual prévio.
- Escopo: ajuste de leitura/fallback; lógica de cadastro, autenticação, Hotmart e rotas não foram alteradas.

## 2026-05-17 — Etapa Dados da loja no cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: a etapa `Sobre o negócio` foi renomeada para `Dados da loja`, com copy voltada à configuração inicial da loja BocaFood.
- Layout: criada seção `Identificação da loja` com nome da loja e cidade principal de atendimento na mesma linha no desktop.
- Opções: produtos vendidos e canais de atendimento passaram a usar cards compactos de múltipla escolha, com check discreto e sem mini toggle visível.
- Compatibilidade: os campos continuam usando `storeName`, `storeCity`, `businessType` e `salesMode`; escolhas múltiplas são enviadas como texto agrupado para manter a Function atual compatível.

## 2026-05-17 — Papel Admin no onboarding
- Arquivos alterados: `functions/index.js`, `AI_CHANGELOG.md`.
- Cadastro: o onboarding agora grava `role: "admin"` em `system_tenants/{uid}` para preencher o campo Papel no Master como Admin/ADM.
- Escopo: ajuste restrito ao valor salvo pelo cadastro; fluxo, autenticação, Hotmart e rotas não foram alterados.

## 2026-05-17 — Etapa usuário responsável no cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: a etapa 2 passou a tratar explicitamente os dados como perfil do usuário responsável pelo Centro de Controle.
- Copy: atualizados título, subtítulo, labels de nome, WhatsApp e idioma, além da microcopy do WhatsApp.
- Layout: WhatsApp recebeu mais largura que o idioma na segunda linha do desktop, preservando o layout mobile.
- Escopo: alteração apenas visual/copy; fluxo, autenticação, preview, Hotmart e Firebase não foram alterados.

## 2026-05-17 — Ajuste de idioma e botão no cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: opções de idioma simplificadas para `🇧🇷 Português` e `🇪🇸 Espanhol`, sem repetir Brasil/Espanha no texto.
- Visual: botões passaram a centralizar o texto com alinhamento flexível, corrigindo o botão `Voltar`.
- Escopo: alteração apenas visual/copy; lógica de cadastro e autenticação não foram alteradas.

## 2026-05-17 — Idioma e WhatsApp na etapa responsável
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: o select de idioma da etapa `Dados da responsável` foi limitado a Português Brasil e Espanhol Espanha, com bandeiras nas opções.
- Layout: WhatsApp de contato e idioma do Centro de Controle passaram a ficar na mesma linha no desktop, mantendo empilhamento no mobile.
- Escopo: alteração apenas visual/copy; lógica de cadastro, autenticação e fluxo não foram alterados.

## 2026-05-17 — Copy da etapa Você no cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: a etapa `Você` foi renomeada para `Dados da responsável`, com textos e labels mais claros para responsável, WhatsApp de contato e idioma do Centro de Controle.
- Visual: suavizada a linha superior do card, reduzido o destaque do aviso de modo prévia e compactado levemente o rodapé do card.
- Escopo: alteração apenas visual/copy; lógica de cadastro, preview, autenticação, Hotmart e fluxo não foram alterados.

## 2026-05-17 — Ajuste de posição do Primeiro acesso
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: o texto `Primeiro acesso` voltou ao alinhamento anterior e o espaço vertical entre logo e texto foi reduzido.
- Escopo: alteração apenas visual; lógica de cadastro, autenticação e fluxo não foram alterados.

## 2026-05-17 — Destaque do Primeiro acesso no cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: aumentado o texto `Primeiro acesso` e aproximado da logo BocaFood no topo da tela.
- Escopo: alteração apenas visual; lógica de cadastro, autenticação e fluxo não foram alterados.

## 2026-05-17 — Remoção do título do topo do cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: removido o título `Vamos preparar seu Centro de Controle` do topo, mantendo apenas a identificação de primeiro acesso.
- Escopo: alteração apenas de copy; lógica de cadastro, autenticação e fluxo não foram alterados.

## 2026-05-17 — Remoção do subtítulo do topo do cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: removida a frase explicativa abaixo do título principal para evitar repetição com a copy do card de acesso.
- Escopo: alteração apenas de copy; lógica de cadastro, autenticação e fluxo não foram alterados.

## 2026-05-17 — Copy do acesso no cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: ajustado o texto da etapa de acesso para deixar claro que Google ou senha devem usar o mesmo e-mail da compra.
- Formulário: o campo de e-mail agora aparece como `E-mail da compra`, mantendo o placeholder e adicionando microcopy discreta sobre liberação do acesso.
- Escopo: alteração apenas de copy; lógica de cadastro, autenticação, Google login e fluxo de etapas não foram alterados.

## 2026-05-17 — Cards do cadastro alinhados ao Admin
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: os cards de progresso e etapa receberam o mesmo padrão visual usado no Admin/Maturidade do Negócio, com degradê branco/off-white, borda suave, sombra leve e faixa superior em vermelho/dourado.
- Escopo: alteração apenas visual; lógica de cadastro, autenticação, Google login e salvamento não foram alterados.

## 2026-05-17 — Barra de progresso sem brilho excessivo
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: removido o brilho radial em volta da barra de progresso, mantendo apenas sombra sutil e preenchimento vermelho discreto.
- Escopo: alteração apenas visual; lógica de cadastro, autenticação e salvamento não foram alterados.

## 2026-05-17 — Brilho sofisticado na barra de progresso
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: a barra de progresso recebeu brilho externo suave e radial, com sombra mais premium ao redor do card.
- Escopo: alteração apenas visual; lógica de cadastro e autenticação não foram alteradas.

## 2026-05-17 — Barra de progresso premium no cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: a barra de progresso foi alinhada ao mesmo recuo dos textos do topo e do conteúdo do card.
- Visual: aplicado fundo branco com leve gradiente, sombra suave, relevo interno e preenchimento vermelho com brilho discreto.
- Escopo: alteração apenas visual; lógica de cadastro, autenticação, Google login e salvamento não foram alterados.

## 2026-05-17 — Espaço entre logo e texto reduzido
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: reduzido o espaçamento vertical entre a logo BocaFood e o texto `Primeiro acesso`.
- Escopo: alteração apenas visual; fluxo de cadastro não foi alterado.

## 2026-05-17 — Alinhamento da coluna do cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: topo, progresso e card principal passaram a usar a mesma largura interna.
- Alinhamento: os textos do topo usam o mesmo recuo do conteúdo interno do card, deixando títulos e cards começando no mesmo eixo visual.
- Escopo: alteração apenas visual; lógica de cadastro, autenticação, Google login e salvamento não foram alterados.

## 2026-05-17 — Logo do cadastro mais presente
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: a logo BocaFood no topo foi aumentada, centralizada e aproximada do título.
- Escopo: alteração apenas visual; fluxo de cadastro, autenticação, Google login e salvamento não foram alterados.

## 2026-05-17 — Copy premium do primeiro acesso
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: a tela de primeiro acesso recebeu copy mais clara e menos repetida, com título `Vamos preparar seu Centro de Controle`.
- Hierarquia: removidas as duplicidades visuais de `Etapa 1` e `Etapa 1 de 7` dentro do card, mantendo o andamento apenas na barra de progresso.
- Formulário: placeholders e microcopy foram ajustados para `seu@email.com`, `Crie uma senha`, `Repita a senha` e `Já tem acesso? Entrar no Centro de Controle`.
- Visual: card e rodapé ficaram mais compactos, com progresso em formato `1 de 7 · Acesso` e `14% concluído`.
- Escopo: ajuste apenas visual/copy; autenticação, Google login, rotas, Firebase, validações, etapas e salvamento não foram alterados.

## 2026-05-17 — Logo Google no cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: o botão `Continuar com Google` deixou de usar a letra `G` genérica e passou a exibir o logotipo Google em SVG inline.
- Escopo: alteração apenas visual; o fluxo de Google login e a lógica de cadastro não foram alterados.

## 2026-05-17 — Hierarquia premium do cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: topo, progresso e card principal foram alinhados no mesmo container de largura máxima.
- Hierarquia: o título `Cadastro BocaFood` voltou como ponto de entrada visual, com subtítulo menor e controlado.
- Visual: card principal recebeu borda, sombra, raio e espaçamentos mais refinados; o progresso ficou mais integrado e discreto.
- Escopo: alteração apenas de layout, alinhamento, hierarquia visual e copy; lógica de cadastro, Firebase Auth, Google login, Hotmart, Firestore, logs, `businessProfile` e salvamento não foram alterados.

## 2026-05-17 — Frase auxiliar removida do cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: removida a frase `Depois, fazemos algumas perguntas rápidas para preparar seu Centro de Controle.` da etapa 1.
- Escopo: alteração apenas de copy; lógica de cadastro, Firebase, Google login, Hotmart e salvamento não foram alterados.

## 2026-05-16 — Ajuste fino visual do cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: reduzido o espaço vertical do topo, do progresso, do card principal e do rodapé para deixar `/cadastro.html` mais compacta.
- Copy: o texto inicial passou para `Crie seu acesso e conte um pouco sobre o seu negócio...`; a etapa 1 agora usa `Use o mesmo e-mail da compra para o sistema encontrar seu plano.`
- Visual: o botão Google, separador e espaçamentos entre título, texto e campos ficaram mais leves.
- Escopo: alteração apenas de layout, espaçamento e copy; lógica de cadastro, Firebase Auth, Google login, Hotmart, Firestore, logs, `businessProfile` e salvamento não foram alterados.

## 2026-05-16 — Modo prévia do cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: adicionada a opção local `?preview=1` para navegar pelas etapas do onboarding sem criar conta, salvar dados, inicializar Firebase ou consultar Hotmart.
- Prévia: o modo preenche dados fictícios leves, oculta o botão Google e permite revisar os campos até a finalização.
- Segurança: o fluxo real sem `preview=1` continua usando Firebase Auth, Google login, Hotmart e salvamento como antes.

## 2026-05-16 — Destaque do primeiro acesso no cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: o marcador `Primeiro acesso` recebeu mais destaque visual com texto maior e negrito leve, sem pílula, fundo ou borda.
- Escopo: alteração apenas visual; lógica de cadastro, Google login, Firebase, Hotmart e salvamento não foram alterados.

## 2026-05-16 — Logo BocaFood correta no cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: a tela `/cadastro.html` passou a usar a mesma logo BocaFood do Admin: `assets/boca-food-logo.png`.
- Favicon: o favicon também passou a usar o mesmo asset do Admin: `assets/boca-food-favicon.png`.
- Correção: removido o uso de `logo.png`, que correspondia à marca antiga BocadoBrasil.
- Escopo: alteração apenas visual/head; lógica de cadastro e autenticação não foram alteradas.

## 2026-05-16 — Fonte do Admin no cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: removido o título `Cadastro BocaFood` da área principal da tela `/cadastro.html`.
- Fonte: a tela passou a usar o mesmo padrão do Admin, com `Manrope` como fonte principal e `Inter` como fallback.
- Escopo: alteração apenas visual; lógica de cadastro e autenticação não foram alteradas.

## 2026-05-16 — Logo centralizada e favicon no cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: a logo no topo de `/cadastro.html` foi centralizada.
- Favicon: adicionados `rel="icon"` e `apple-touch-icon` apontando para `/logo.png`, asset disponível dentro de `public/`.
- Fonte: a tela continua usando `Inter` como fonte principal da interface.
- Escopo: alteração apenas visual/head; lógica de cadastro e autenticação não foram alteradas.

## 2026-05-16 — Topo do cadastro com logo limpa
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: removido o texto ao lado da logo no topo da tela `/cadastro.html`.
- Visual: a logo BocaFood ficou maior e sem fundo, borda ou padding para usar aparência transparente.
- Escopo: alteração apenas visual; lógica de cadastro e autenticação não foram alteradas.

## 2026-05-16 — Progresso do cadastro simplificado
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: removida a linha de textos das etapas abaixo da barra de progresso em `/cadastro.html`.
- Visual: o progresso agora fica apenas com texto compacto `Etapa X de 7 · Nome`, porcentagem e barra fina.
- Escopo: alteração apenas visual; lógica de cadastro, Google login, Firebase, Hotmart, salvamento, `businessProfile` e logs não foram alterados.

## 2026-05-16 — Cadastro mais compacto e guiado
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: a tela `/cadastro.html` foi simplificada visualmente sem alterar lógica de cadastro, Google login, Firebase, Hotmart, Firestore, logs, `businessProfile` ou salvamento.
- Layout: o container geral foi reduzido para largura máxima menor, com menos espaçamento vertical e card principal mais compacto.
- Progresso: os chips grandes foram trocados por barra fina com texto `Etapa X de 7 · Nome`, mantendo as etapas em texto pequeno.
- Card: removido o bloco lateral `Depois disso`; a orientação virou uma frase curta abaixo do texto principal.
- Etapa 1: copy ajustada para `Crie seu acesso`, texto sobre liberar o plano pelo e-mail da compra e microcopy `Já tem conta? Entre pelo Centro de Controle.`
- Visual: botão Google, separador e rodapé do card ficaram mais leves, com menos peso visual e menos espaço vazio.

## 2026-05-16 — Cadastro alinhado ao visual do Admin
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: a tela `/cadastro.html` foi ajustada apenas em layout, identidade visual e copy, sem alterar Firebase Auth, Hotmart, Firestore, logs, `businessProfile` ou salvamento.
- Referências: o visual foi aproximado do padrão das telas internas `Maturidade do Negócio` e `Programa de Pontos`, com fundo off-white rosado, cards brancos, borda suave, sombra leve e vermelho usado com controle.
- Progresso: as etapas foram redesenhadas como pills/tabs compactas de sistema, com etapa ativa em vermelho e etapas futuras neutras.
- Card principal: a etapa passou a ter estrutura mais parecida com o Admin, com badge interno, título menor, texto direto, coluna de apoio discreta e rodapé de ações definido.
- Copy: a etapa inicial agora usa `Crie seu acesso`, texto sobre usar o mesmo e-mail da compra e microcopy `Já tem conta? Entre pelo Centro de Controle.`

## 2026-05-16 — Botão Google no padrão do onboarding
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: o botão `Continuar com Google` foi ajustado visualmente para combinar com o padrão atual do card de onboarding.
- Visual: removida a aparência de botão externo pesado, com borda suave, hover discreto, tipografia alinhada e marca compacta em vermelho BocaFood.
- Escopo: alteração apenas visual; autenticação Google e fluxo de onboarding não foram alterados.

## 2026-05-16 — Cadastro com Google
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: adicionada a opção `Continuar com Google` na etapa 1 do onboarding público.
- Fluxo: após autenticar com Google, a tela usa o e-mail autenticado para chamar `completeSignupOnboarding` e seguir para a etapa `Sobre você`, preservando o vínculo Hotmart por e-mail.
- Compatibilidade: o cadastro por e-mail e senha continua disponível; salvamento, billing, logs e demais etapas não foram alterados.

## 2026-05-16 — Onboarding sem card lateral introdutório
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: removido o card lateral `Comece pelo essencial` com checklist e lista vertical de etapas.
- Layout: a tela passa a usar um card principal centralizado, com progresso compacto acima do card.
- Escopo: ajuste apenas visual; lógica de etapas, validação, salvamento, Hotmart e logs não foram alterados.

## 2026-05-16 — Visual premium do onboarding público
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Cadastro: a tela `/cadastro.html` foi ajustada visualmente sem alterar a lógica de etapas, validação, salvamento, vínculo Hotmart ou logs.
- Layout: removido o aspecto de landing page e adotado um padrão mais próximo de Maturidade do Negócio/Plano de voo, com topo simples, logo real BocaFood, card lateral de progresso e card principal de pergunta.
- Progresso: os chips grandes foram substituídos por lista/barra discreta de etapas com ativo em vermelho, concluídas com check e futuras em cinza.
- Copy: a etapa inicial agora usa tom mais direto e guiado, com título `Vamos criar seu acesso`, apoio sobre e-mail da compra e link discreto para quem já tem conta.
- Visual: tipografia reduzida, menos bold, sombra mais leve, fundo rosado suave, campos e selects com borda/foco no padrão BocaFood e botões arredondados.

## 2026-05-16 — Onboarding com diagnóstico inicial do negócio
- Arquivos alterados: `public/cadastro.html`, `functions/index.js`, `AGENTS.md`, `AI_CHANGELOG.md`.
- Cadastro: a tela existente foi adaptada sem recriação para o fluxo final em 7 etapas: criar acesso, sobre você, sobre o negócio, como vende hoje, estrutura/capacidade, momento do negócio e finalização.
- Perguntas finais: adicionadas perguntas de tipo do negócio, modo de venda, frequência de vendas, canais, cardápio, controle de pedidos, produção, capacidade diária, equipe, conhecimento de custos, desafio, objetivo, fase e tempo disponível.
- Estrutura Firestore: o diagnóstico inicial passa a ser salvo em `system_tenants/{uid}.businessProfile` com `source: "signup_onboarding"` e `updatedAt`, preservando `store.name`, `store.city` e `store.status: "draft"`.
- Compatibilidade: campos antigos do onboarding, como `storeKind`, continuam aceitos como fallback para `businessType`; a gravação usa merge e não apaga dados antigos nem billing Hotmart.
- Hotmart: o vínculo com `pending_hotmart_access` e a cópia de billing foram preservados.
- Logs: adicionado `signup_business_profile_saved`, além dos logs já existentes de criação, vínculo, conclusão e cadastro sem compra ativa.
- AGENTS: documentado que diagnóstico inicial do onboarding deve ser salvo em `businessProfile`.

## 2026-05-16 — Tela pública de cadastro/onboarding
- Arquivos alterados: `public/cadastro.html`, `functions/index.js`, `public/js/core/auth.js`, `firebase.json`, `server.rb`, `AGENTS.md`, `AI_CHANGELOG.md`.
- Tela criada: `public/cadastro.html`, acessível por `/cadastro.html` e `/cadastro`, com experiência guiada em 5 etapas: criar acesso, sobre a usuária, sobre o negócio, dados fiscais básicos e finalização.
- Visual: layout em duas colunas no desktop, fluxo em card branco com sombra suave, fundo claro/rosado, pills de etapa, botões vermelhos arredondados e responsividade mobile.
- Criação de conta: a etapa inicial cria Firebase Auth com e-mail e senha, valida e-mail/senha e mostra mensagem clara quando o e-mail já existe.
- Vínculo Hotmart: adicionada Function autenticada `completeSignupOnboarding`, que busca `pending_hotmart_access` pelo e-mail autenticado, cria/atualiza `system_tenants/{uid}`, copia billing da pendência ativa e marca a pendência como vinculada sem expor dados Hotmart no frontend.
- Campos salvos: e-mail, nome, WhatsApp, idioma, documento, endereço fiscal básico, dados iniciais da loja, tipo do negócio, status draft, auth.uid, role owner, origem e timestamps.
- Segurança: o frontend não lê `pending_hotmart_access` diretamente; a Function exige usuário autenticado e usa o e-mail do Auth para localizar compra ativa.
- Logs: a Function registra `signup_started`, `signup_account_created`, `signup_hotmart_linked`, `signup_completed` e `signup_without_purchase` em `system_access_logs` sem senha ou dados sensíveis.
- Integração Admin: `Auth.normalizeRole` passa a tratar `role: owner` como `store_owner` para liberar o Centro de Controle quando a conta estiver ativa.
- Roteamento: `firebase.json` e `server.rb` direcionam `/cadastro` para `cadastro.html`.
- Pendências: a Function precisa ser publicada em um deploy futuro para o onboarding funcionar em produção.

## 2026-05-16 — Descrição das variáveis de e-mail
- Arquivos alterados: `master.html`, `AI_CHANGELOG.md`.
- Master: em `E-mails automáticos → Templates`, a área `Variáveis disponíveis` agora mostra cada variável junto de uma descrição curta.
- Variáveis: adicionadas descrições para nome, e-mail, links, suporte, plano, produto, marca, trial, loja, cobrança e códigos Hotmart.
- Escopo: alteração apenas visual/informativa; o salvamento e o envio dos templates não foram alterados.

## 2026-05-16 — Templates novos permanecem visíveis no Master
- Arquivos alterados: `master.html`, `server.rb`, `AI_CHANGELOG.md`.
- Correção: a lista de templates em `E-mails automáticos` agora mescla templates salvos no Firestore com os templates padrão do sistema.
- Backend local: `/api/master/email/templates` retorna os defaults quando um template novo ainda não existe como documento, preservando os valores salvos quando existem.
- Frontend Master: a tela também mescla os defaults localmente para evitar que templates novos sumam quando a API retorna uma lista incompleta.
- Impacto esperado: templates como `trial_ending`, `trial_ends_today`, `trial_expired` e `store_not_published` continuam visíveis na aba Templates.

## 2026-05-16 — SMTP não volta para defaults quando gatilhos falham
- Arquivos alterados: `master.html`, `AI_CHANGELOG.md`.
- Master: o carregamento de `E-mails automáticos` deixou de usar falha única para configurações, templates e gatilhos.
- Correção: se templates ou gatilhos falharem, a configuração SMTP carregada de `/api/master/email/settings` não é substituída por defaults visuais.
- Impacto esperado: os campos de `Configuração SMTP` continuam exibindo os dados salvos em `system_email_settings/default`, mesmo quando outra parte da tela não carregar.
- Feedback: a tela mostra aviso discreto indicando qual bloco não foi carregado.

## 2026-05-16 — Gatilhos padrão para templates sem vínculo
- Arquivos alterados: `functions/index.js`, `server.rb`, `master.html`, `AI_CHANGELOG.md`.
- E-mails automáticos: adicionados gatilhos padrão para templates que ainda não tinham entrada em `system_email_triggers`.
- Novos gatilhos: `welcome_hotmart_email`, `trial_ends_today_email` e `subscription_active_email`.
- Segurança: `welcome_hotmart_email` e `subscription_active_email` começam inativos para evitar reenvios recorrentes de e-mails transacionais sem ativação manual no Master.
- Trial: `trial_ends_today_email` começa ativo e usa a etiqueta `trial_ends_today`, com deduplicação de 30 dias.
- Interface: os defaults do Master foram atualizados para que os templates passem a exibir `Com gatilho ativo` ou `Gatilho inativo`, em vez de `Sem gatilho`, quando houver vínculo configurado.

## 2026-05-16 — Status de gatilho real nos templates
- Arquivos alterados: `master.html`, `AI_CHANGELOG.md`.
- Master: a lista de templates em `E-mails automáticos` deixou de usar uma lista fixa para indicar se um template tem gatilho.
- Gatilhos: o status agora consulta os gatilhos carregados de `system_email_triggers` e mostra `Com gatilho ativo`, `Gatilho inativo` ou `Sem gatilho` conforme o `templateKey`.
- Compatibilidade: `test_email` continua como `Manual`, e `password_reset`/`verify_email` continuam como `Preparado, não conectado`.
- Interface: ao salvar ou recarregar gatilhos, a lista de templates é redesenhada para refletir o vínculo atual.

## 2026-05-16 — Integração Hotmart com billing do tenant
- Arquivos alterados: `functions/index.js`, `server.rb`, `AI_CHANGELOG.md`.
- Hotmart webhook: eventos aprovados/ativos atualizam tenants existentes com `billing.provider`, `billing.status`, `planSlug`, `billingCycle`, `activatedAt`, códigos Hotmart, `purchaseStatus` e `subscriptionStatus`, além dos espelhos `plan`, `billingStatus`, `billingCycle` e `activatedAt`.
- Trial: quando o evento/oferta enviar `trialDays`, calcula e grava `billing.trialEndsAt` e `trialEndsAt`; sem trial configurado, mantém vazio sem erro.
- Status: eventos de cancelamento, reembolso, chargeback, pagamento pendente e atraso mapeiam `billing.status`, `billingStatus` e `canceledAt` quando aplicável, sem apagar tenant, loja ou dados existentes.
- Pendências: `pending_hotmart_access` passa a guardar `planSlug`, `billingCycle`, `trialDays`, `trialEndsAt`, `purchaseStatus`, `subscriptionStatus`, `eventType`, status interno e motivo, sem salvar payload bruto fora de `hotmart_events`.
- Backend local: criação/vínculo manual a partir de pendência Hotmart consome os novos campos e preserva compatibilidade com registros antigos.
- Logs: adicionados eventos seguros em `system_access_logs` para ativação, cancelamento, pagamento pendente/atrasado, reembolso, chargeback e vínculo Hotmart com tenant.

## 2026-05-16 — Plano e acesso separado de dados Firebase
- Arquivos alterados: `master.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Master `Usuários → Editar usuário → Plano e acesso`.
- Organização: a aba foi separada em `Plano e cobrança` e `Acesso técnico / Firebase`.
- Plano e cobrança: mantém `Plano`, `Ciclo`, `Provider cobrança`, `Status assinatura`, `Fim do trial`, `Ativado em` e `Cancelado em`.
- Acesso técnico: concentra `Auth UID`, `E-mail verificado`, `Último acesso`, `Criado em`, `Atualizado em` e `Papel`.
- Escopo: mudança visual/organizacional; sem alteração de Hotmart, cobrança, endpoints ou salvamento.

## 2026-05-16 — Correção do ciclo de cobrança em Plano e acesso
- Arquivos alterados: `public/js/core/auth.js`, `public/js/modules/configuracoes.js`, `public/admin.html`, `master.html`, `server.rb`, `AI_CHANGELOG.md`.
- Admin: `Auth.getAdminProfile()` e a tela `Configurações → Plano` passam a aceitar `profile.billingCycle`, `billing.billingCycle` e `billing.cycle`, nessa ordem.
- Master: a aba `Plano e acesso` lê o ciclo de `billing.billingCycle`, `billingCycle` ou `billing.cycle`; ao salvar, mantém `billing.billingCycle` e o espelho `billingCycle`.
- Backend: `system_tenants/{uid}` passa a manter espelhos `plan`, `billingStatus`, `billingCycle`, `trialEndsAt`, `activatedAt` e `canceledAt` junto da estrutura `billing`.
- Hotmart: criação/vínculo a partir de `pending_hotmart_access` preenche `billing.billingCycle` e `billingCycle`; quando não houver ciclo, usa `monthly` com warning seguro em `system_access_logs`.
- Logs: alterações manuais de plano, ciclo, provider e status de assinatura ficam registradas sem dados sensíveis.
- Cache: `public/admin.html` recebeu cache-buster para carregar `auth.js` e `configuracoes.js` atualizados.

## 2026-05-16 — Papel vinculado aos dados da usuária
- Arquivos alterados: `master.html`, `public/js/modules/configuracoes.js`, `public/admin.html`, `AI_CHANGELOG.md`.
- Master: o campo `Papel` saiu da aba `Plano e acesso` e passou para o modal da usuária, junto dos dados do respectivo acesso.
- Admin: `Configurações → Conta / Usuária → Dados da usuária / responsável` agora mostra `Papel` como campo somente leitura definido pelo Master.
- Cache: `public/admin.html` recebeu novo cache-buster para carregar o módulo atualizado.
- Escopo: não houve alteração de permissões, endpoints, cobrança, Hotmart ou regras de acesso.

## 2026-05-16 — Campos da usuária reduzidos no Master
- Arquivos alterados: `master.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Master `Usuários → Editar usuário → Usuárias`.
- Ajuste: a modal de dados da usuária passa a exibir somente `Nome completo`, `Nome social / nome curto`, `E-mail de acesso`, `WhatsApp da usuária` e `Idioma da conta`.
- Compatibilidade: os campos antigos de telefone/e-mails administrativos ficam preservados internamente para não apagar dados existentes, mas não aparecem como campos da usuária.
- Salvamento: `Nome social / nome curto` passa a ser enviado como `preferredName` e `socialName`, mantendo compatibilidade com os dados atuais.

## 2026-05-16 — Ajuste da separação entre negócio e usuária
- Arquivos alterados: `master.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Master `Usuários → Editar usuário`.
- Correção: a aba `Usuárias` passa a conter apenas campos pessoais da usuária/responsável, como nome, e-mail, contato e idioma.
- Negócio: tenant, status da conta, origem, documento, endereço fiscal, país fiscal e observações internas ficam na aba `Negócio`, pois pertencem ao cadastro do negócio/empresa.
- Escopo: reorganização visual; sem alteração de salvamento, endpoints, permissões, Admin ou dados Firestore.

## 2026-05-16 — Master separa negócio e usuárias no cadastro
- Arquivos alterados: `master.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Master `Usuários → Editar usuário`.
- Organização: a edição passa a abrir na aba `Negócio`, com campos da loja, publicação, localização e redes sociais.
- Usuárias: os dados da usuária principal foram separados em uma aba `Usuárias`, exibidos primeiro como lista e abertos em modal interno para detalhes.
- Preparação futura: a nova lista deixa a interface pronta para múltiplas usuárias/acessos por tenant, sem alterar permissões, endpoints ou estrutura de gravação nesta etapa.
- Escopo: salvamento existente preservado; não houve alteração em Admin, Hotmart, SMTP, pedidos ou template público.

## 2026-05-16 — Idioma da conta com Português e Espanhol
- Arquivos alterados: `public/js/modules/configuracoes.js`, `public/admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Admin `Configurações → Conta / Usuária`.
- Ajuste: o select `Idioma da conta` agora mostra apenas `🇧🇷 Português` e `🇪🇸 Espanhol`.
- Salvamento: os valores internos continuam padronizados como `pt-BR` e `es-ES`.
- Cache: `public/admin.html` recebeu novo cache-buster para carregar a versão atualizada.

## 2026-05-16 — Idioma da conta limitado a português e espanhol
- Arquivos alterados: `public/js/modules/configuracoes.js`, `public/admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Admin `Configurações → Conta / Usuária`.
- Ajuste: o select `Idioma da conta` agora mostra apenas Português Brasil, Português Portugal e Espanhol Espanha.
- Cache: `public/admin.html` recebeu novo cache-buster para carregar a versão atualizada do módulo de configurações.
- Escopo: não houve alteração no caminho Firestore, no salvamento, no Master ou em outros módulos.

## 2026-05-16 — Visual das Configurações Conta / Usuária
- Arquivos alterados: `public/js/modules/configuracoes.js`, `public/admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Admin `Configurações → Conta / Usuária`.
- Abas: padronizadas como abas horizontais limpas, com texto cinza, ativo em vermelho e underline vermelho, sem aparência de botão HTML cru.
- Selects: `Idioma da conta` e demais selects renderizados por `bf-select` recebem altura, borda, raio, fundo branco e seta discreta alinhados ao padrão BocaFood.
- Telefone/WhatsApp: os selects de código telefônico usam layout compacto com bandeira + código ao lado do número, preservando responsividade.
- Escopo: alteração apenas visual/usabilidade; nomes dos campos, salvamento, Firestore e sincronização com Master não foram alterados.

## 2026-05-16 — WhatsApp da usuária visível no Master
- Arquivos alterados: `master.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Master `Usuários`.
- Ajuste: o campo da aba Conta foi renomeado para `WhatsApp da usuária` e indica origem `Admin → Configurações → Conta / Usuária`.
- Listagem: o card/linha da usuária passa a mostrar `WhatsApp usuária` junto do e-mail quando o dado existir.
- Preparação futura: o campo continua usando `system_tenants/{uid}.whatsapp*`, separado do WhatsApp público/operacional da loja, para suportar contatos individuais de usuários no futuro sem liberar multiusuário agora.

## 2026-05-16 — Conta / Usuária sem responsável e telefone duplicados
- Arquivos alterados: `public/js/modules/configuracoes.js`, `public/admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Admin `Configurações → Conta / Usuária`.
- Ajuste visual: removidos da aba os campos `Responsável legal` e `Telefone principal`, evitando duplicidade com dados fiscais/gerais.
- WhatsApp: o campo agora é `WhatsApp da usuária` e carrega apenas `tenant.whatsapp*` ou `config/conta_usuario.whatsapp*`, sem herdar WhatsApp/telefone da aba `Geral`.
- Salvamento: a aba deixa de escrever `responsibleName`, `phoneCountryCode`, `phoneNumber`, `phoneFull` e `phone`, preservando valores antigos por merge sem apagar dados existentes.
- Cache: `public/admin.html` recebeu cache-buster novo para `configuracoes.js`.

## 2026-05-16 — Data de cadastro do Firebase Auth na listagem
- Arquivos alterados: `server.rb`, `master.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Master `Usuários`.
- Backend: a listagem de tenants anexa metadados do Firebase Auth por UID/e-mail em `auth.createdAt`, `auth.lastLoginAt`, `auth.emailVerified` e `auth.uid`, sem sobrescrever `createdAt` do tenant.
- Visual: quando a data confiável do tenant não existe ou veio de importação automática, o card mostra `Criado no Firebase Auth` usando `auth.createdAt`.
- Impacto esperado: usuárias criadas originalmente pelo Firebase Auth, como `pcruz.digital@gmail.com`, passam a mostrar a data de cadastro do Auth quando disponível.

## 2026-05-16 — Último acesso vindo dos logs reais
- Arquivos alterados: `server.rb`, `master.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Master `Usuários` e histórico `system_access_logs`.
- Correção: a listagem de usuários passa a calcular `lastAccessAt` a partir dos eventos `admin_login` em `system_access_logs`, usando UID e e-mail como fallback para casos de documentos duplicados.
- Visual: o badge de último acesso usa `lastAccessAt` antes de `auth.lastLoginAt`; a data de criação foi renomeada para `Conta criada em` e evita exibir uma data enganosa quando o registro veio de importação automática do Firebase Auth.
- Impacto esperado: usuárias que acessam o Admin, como `pcruz.digital@gmail.com`, passam a aparecer com o último acesso real após o login ser registrado.

## 2026-05-16 — Último acesso visível na listagem de usuários
- Arquivos alterados: `master.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Master `Usuários`.
- Ajuste visual: a listagem de usuários passa a exibir o `Último acesso` como badge visível dentro do card/linha da usuária.
- Estado vazio: quando não houver `auth.lastLoginAt` ou `lastLoginAt`, a listagem mostra `Último acesso: sem registro`.
- Atualização: a assinatura de renderização da lista passou a considerar `auth.lastLoginAt`/`lastLoginAt`, permitindo atualizar o card quando o valor mudar.

## 2026-05-16 — Padrão leve de logs de atividade
- Arquivos alterados: `AGENTS.md`, `public/js/core/auth.js`, `public/js/modules/configuracoes.js`, `public/admin.html`, `firestore.rules`, `server.rb`, `master.html`, `AI_CHANGELOG.md`.
- Regra global: documentado que o BocaFood registra somente ações relevantes para suporte, auditoria, cobrança e segurança, sem logar cliques, navegação simples, scroll, digitação, foco em campo ou visualizações comuns.
- Estrutura: logs em `system_access_logs` passam a usar campos leves `tenantUid`, `email`, `action`, `module`, `entityType`, `entityId`, `summary`, `source`, `severity`, `createdAt` e `metadata`, sem senhas, tokens, payload completo, HTML, imagens ou dados de clientes finais.
- Helper Admin: criado `Auth.recordSystemAccessLog`, com actions permitidas, limpeza de metadata, limite de tamanho e falha silenciosa para não quebrar a ação principal.
- Actions iniciais: `admin_login`, `store_published`, `store_unpublished`, `store_publication_failed`, `store_slug_updated`, `account_settings_updated`, `store_settings_updated`, `master_tenant_updated`, `master_account_blocked` e `master_account_activated`.
- Master: o modal `Histórico de acessos` agora mostra data/hora, ação traduzida, origem, módulo, resumo, severidade e detalhes, com filtros `Todos`, `Login`, `Loja`, `Publicação`, `Conta`, `Master` e `Erros`.
- Custo/retenção: leituras do Master limitadas aos 50 registros mais recentes; retenção automática fica pendente para etapa futura, com diretriz de 90 dias para logs comuns e 1 ano para cobrança, Hotmart, acesso e publicação.

## 2026-05-16 — Histórico de acessos do usuário no Master
- Arquivos alterados: `public/js/core/auth.js`, `public/admin.html`, `firestore.rules`, `server.rb`, `master.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Admin/Centro de Controle, Master `Usuários` e coleção `system_access_logs`.
- Registro: ao liberar acesso no Admin, o client registra um evento `admin_login` em `system_access_logs` com `tenantUid`, `uid`, `createdAt`, `source: "admin"` e detalhes seguros como e-mail, papel e `masterTenantId`.
- Segurança: as regras do Firestore permitem criação client-side apenas de eventos `admin_login` e eventos de publicação já previstos, sem permitir edição/leitura por tenant comum.
- Master: o botão `Logs` agora abre uma tela/modal de `Histórico de acessos`, filtrando por UID e e-mail para cobrir casos com documentos duplicados do mesmo usuário.
- Backend: `/api/master/access/logs` aceita filtro por `uid`, `email` e `action`, retorna até 100 registros recentes e continua restrito ao Master local.

## 2026-05-16 — País fiscal espelhado por e-mail
- Arquivos alterados: `server.rb`, `AI_CHANGELOG.md`.
- Módulo afetado: Master `Usuários`, deduplicação de `system_tenants` e Admin fiscal.
- Correção: ao salvar um usuário no Master, o backend agora atualiza o `fiscalCountry` em todos os documentos `system_tenants` com o mesmo e-mail, evitando que outro documento mais completo volte a aparecer com o país fiscal antigo.
- Escopo: o espelho altera somente campos fiscais/de controle (`fiscalCountry`, `accountAddress.fiscalCountry`, `store.fiscalCountry`, `masterTenantId`, `role`, `accountStatus`, `updatedAt`) e não copia dados operacionais da loja.
- Ajuste adicional: a sincronização recebe o UID real retornado pelo Firebase Auth para também atualizar o documento usado no login do Admin.

## 2026-05-16 — País fiscal canônico no Master
- Arquivos alterados: `master.html`, `server.rb`, `AI_CHANGELOG.md`.
- Módulo afetado: Master `Usuários → Editar usuário` e sincronização `system_tenants`.
- Correção: o Master passa a exibir primeiro o valor canônico `fiscalCountry` top-level, em vez de priorizar valores antigos em `accountAddress.fiscalCountry` ou `store.fiscalCountry`.
- Backend: ao salvar, `fiscalCountry` top-level é a fonte principal e é espelhado para `accountAddress.fiscalCountry` e `store.fiscalCountry`, evitando Master mostrar Espanha enquanto o Admin lê Portugal.
- Impacto esperado: após salvar novamente no Master, Admin e Master usam o mesmo país fiscal para liberar/ocultar o módulo Fiscal.

## 2026-05-16 — Espelho fiscal para UID autenticado
- Arquivos alterados: `server.rb`, `AI_CHANGELOG.md`.
- Módulo afetado: Master `Usuários` e sincronização `system_tenants`.
- Correção: quando o Master salva um tenant cujo documento principal não é o mesmo UID usado no Firebase Auth, o backend também espelha apenas os campos de controle fiscal em `system_tenants/{authUid}`.
- Campos espelhados: `fiscalCountry`, `accountAddress.fiscalCountry`, `store.fiscalCountry`, `masterTenantId`, `email`, `role`, `accountStatus` e `updatedAt`.
- Impacto esperado: o Admin autenticado pelo UID passa a receber o mesmo `País fiscal` definido no Master, sem copiar dados operacionais da loja nem permitir edição pelo Admin.

## 2026-05-16 — País fiscal do Admin atualizado a partir do Master
- Arquivos alterados: `public/js/core/auth.js`, `public/js/modules/configuracoes.js`, `public/admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Centro de Controle `Configurações → Geral → Dados fiscais da empresa`.
- Correção: o Admin agora recarrega o tenant de controle do Master (`masterTenantId`) antes de renderizar o campo `País fiscal`, evitando manter valor antigo do perfil carregado no login.
- Regra preservada: `tenantId` operacional do Admin continua sendo o UID autenticado; a leitura adicional usa somente metadados de controle do Master, como `fiscalCountry`.
- UI: o campo `País fiscal` prioriza o valor atual de `system_tenants/{masterTenantId}` e só usa o perfil local como fallback.
- Cache: `public/admin.html` recebeu cache-buster novo para `configuracoes.js`.

## 2026-05-16 — Bootstrap fiscal alinhado por e-mail do tenant
- Arquivos alterados: `public/js/core/auth.js`, `public/admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: autenticação do Centro de Controle e visibilidade dos módulos fiscais.
- Correção: usuários bootstrap como `pcruz.digital@gmail.com` agora procuram também tenants em `system_tenants` pelo e-mail e escolhem o tenant mais completo, evitando divergência quando existe mais de um documento para o mesmo e-mail.
- Critério: a escolha do tenant segue a mesma prioridade do Master por loja/slug/URL/billing/status e inclui fallback case-insensitive para e-mails gravados com caixa diferente.
- Fiscal: o Admin passa a aplicar o `fiscalCountry` do tenant preferido pelo Master; `ES` mantém o módulo Fiscal visível e `PT` oculta o módulo Fiscal.
- Segurança operacional: o `tenantId` usado pelo Admin continua sendo o UID autenticado, para não misturar dados operacionais entre lojas; apenas os metadados de controle do Master são usados para país fiscal/role.
- Debug: adicionados logs seguros com UID, tenant preferido, país fiscal e quantidade de matches por e-mail, sem expor dados sensíveis.
- Cache: `public/admin.html` recebeu cache-buster novo para carregar a versão atualizada de `auth.js`.

## 2026-05-16 — País no Master copiado dos dados fiscais
- Arquivos alterados: `master.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Master `Usuários → Editar usuário → Conta`.
- Ajuste: o campo `País` passou a ser somente leitura e apenas copia `accountAddress.country`, vindo de `Dados fiscais da empresa → País` no Admin.
- Separação: `País` não edita nem substitui `País fiscal`; `País fiscal` continua separado, controlado pelo Master e usado para liberar/ocultar módulos fiscais.
- Salvamento: o Master preserva o país cadastrado nos dados fiscais e não usa mais o valor visual do campo como edição comum.

## 2026-05-16 — País herdado dos dados fiscais da empresa
- Arquivos alterados: `public/js/modules/configuracoes.js`, `public/js/core/db.js`, `public/admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Centro de Controle `Configurações → Geral → Dados fiscais da empresa`.
- Ajuste: o campo `País` passa a ser somente leitura e preenchido automaticamente pelo Google Places a partir do endereço fiscal.
- Autocomplete: quando o endereço fiscal preencher país, o campo `País` recebe o código/nome retornado pelo Places.
- Sincronização: `country` e `accountAddress.country` herdam esse país cadastrado em `Dados fiscais da empresa`; `País fiscal` continua somente leitura e controlado pelo Master.
- Correção: removido fallback indevido para `fiscalCountry` ao atualizar `store.country` a partir das configurações gerais.

## 2026-05-16 — País fiscal do bootstrap alinhado ao Master
- Arquivos alterados: `public/js/core/auth.js`, `public/admin.html`, `AI_CHANGELOG.md`.
- Correção: usuários em bootstrap, incluindo `pcruz.digital@gmail.com`, agora também carregam `system_tenants/{uid}` antes de liberar o Admin, para usar o mesmo `fiscalCountry` definido no Master.
- Comportamento: `Auth.getFiscalCountry()` normaliza o valor para `ES` ou `PT`; `ES` mantém o módulo Fiscal visível e `PT` oculta o módulo Fiscal.
- Cache: `public/admin.html` recebeu cache-buster novo para `auth.js`.
- Impacto esperado: Admin e Master deixam de divergir em país fiscal e na visibilidade do módulo Fiscal.

## 2026-05-16 — País fiscal controlado somente pelo Master
- Arquivos alterados: `AGENTS.md`, `public/js/core/auth.js`, `public/js/modules/configuracoes.js`, `public/admin.html`, `firestore.rules`, `AI_CHANGELOG.md`.
- Regra global: `País fiscal` passa a ser definido/alterado somente no Master; no Admin a usuária apenas visualiza o valor aplicado à conta.
- Admin: o campo `País fiscal` em `Configurações → Geral → Dados fiscais da empresa` ficou somente leitura e não é mais enviado no salvamento de configurações.
- Sincronização: o Admin não grava mais `fiscalCountry` nem `accountAddress.fiscalCountry` em `system_tenants/{uid}`; esses campos permanecem sob controle do Master.
- Segurança: `firestore.rules` deixou de permitir que o tenant escreva `fiscalCountry` top-level ou dentro de `accountAddress`.
- Comportamento fiscal: Espanha (`ES`) exibe o módulo Fiscal; Portugal (`PT`) não exibe o módulo Fiscal, conforme `FiscalConfig`.

## 2026-05-16 — País fiscal restrito a regras implementadas
- Arquivos alterados: `AGENTS.md`, `public/js/core/auth.js`, `public/js/modules/configuracoes.js`, `public/admin.html`, `master.html`, `AI_CHANGELOG.md`.
- Regra global: documentado que `País fiscal` não é país do endereço; ele controla `Auth.getFiscalCountry()`, `FiscalConfig`, regras fiscais e módulos liberados.
- Opções fiscais: nesta fase, apenas Espanha (`ES`) e Portugal (`PT`) aparecem como opções de `País fiscal`, porque são os únicos países com configuração fiscal específica implementada.
- Segurança funcional: países sem configuração fiscal específica passam a cair no padrão `País fiscal em desenvolvimento`, sem liberar módulo fiscal nem impostos de produto/compra.
- Admin: o campo `País fiscal` em `Configurações → Geral → Dados fiscais da empresa` usa apenas `ES/PT` como valores válidos.
- Master: o campo `País fiscal` no modal de Usuários também foi limitado e normalizado para `ES/PT`, mantendo correção apenas em modo suporte.

## 2026-05-16 — País e país fiscal nos dados fiscais da empresa
- Arquivos alterados: `public/js/modules/configuracoes.js`, `public/js/core/db.js`, `public/admin.html`, `firestore.rules`, `AI_CHANGELOG.md`.
- Módulo afetado: Centro de Controle `Configurações → Geral`, card `Dados fiscais da empresa`, e sincronização para `system_tenants/{uid}`.
- Ajuste: adicionado o campo `País` como dado gerado pelo endereço fiscal/autocomplete, separado do campo `País fiscal`.
- País fiscal: campo separado do país de endereço e usado para definir regras fiscais e módulos liberados para a usuária.
- Sincronização: `accountAddress.country` recebe o país do endereço; `fiscalCountry` fica sob controle do Master.
- Cache: `public/admin.html` recebeu cache-buster para carregar as versões novas de `db.js` e `configuracoes.js`.
- Regras: o tenant não pode atualizar `fiscalCountry`; alteração deve passar pelo Master.

## 2026-05-16 — Remoção do card fiscal da aba Conta / Usuária
- Arquivos alterados: `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Centro de Controle `Configurações → Conta / Usuária`.
- Ajuste visual: removido o card `Dados fiscais da empresa` dessa aba; ela agora mantém apenas dados da usuária/responsável, e-mail da conta, telefone, WhatsApp e idioma.
- Salvamento: o botão da aba não sobrescreve mais `document` nem `accountAddress`, preservando dados fiscais já existentes em `system_tenants/{uid}` e em `config/conta_usuario`.

## 2026-05-16 — Reorganização fiscal da aba Conta / Usuária
- Arquivos alterados: `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Centro de Controle `Configurações → Conta / Usuária`.
- Ajuste visual: o card `Dados da usuária / responsável` agora fica restrito aos dados administrativos da dona da conta, sem endereço nem documento fiscal.
- Dados fiscais: documento, endereço fiscal e país fiscal ficam concentrados no card `Dados fiscais da empresa`, mantendo a mesma estrutura salva em `system_tenants/{uid}`.
- Impacto esperado: a tela deixa claro que endereço e país fiscal pertencem aos dados fiscais da empresa, não ao bloco de dados pessoais/responsável.

## 2026-05-16 — Exibição da aba Conta / Usuária no menu do Admin
- Arquivos alterados: `public/admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Centro de Controle `Configurações`.
- Correção: o menu lateral de Configurações agora inclui a rota `configuracoes/conta_usuario`, permitindo acessar a aba `Conta / Usuária` que já existia no módulo `public/js/modules/configuracoes.js`.
- Impacto esperado: ao abrir `http://127.0.0.1:3000/admin.html`, a opção `Conta / Usuária` aparece dentro de Configurações e carrega a tela de dados da dona da conta.

## 2026-05-16 — Origem operacional da cidade/estado/país da loja no Master
- Arquivos alterados: `public/js/modules/catalogo.js`, `public/js/modules/configuracoes.js`, `public/admin.html`, `master.html`, `server.rb`, `firestore.rules`, `AI_CHANGELOG.md`.
- Módulo afetado: Admin `Loja Online → Template da loja`, Admin `Configurações → Endereço`, sincronização `system_tenants/{uid}.store` e Master `Usuários → Editar usuário → Loja`.
- Correção: ao salvar o Template da loja, a localização atendida passa a ser a prioridade para `store.city`, `store.region`, `store.country` e `store.postalCode`; se ela não existir, o endereço público da loja é salvo em `store.address` e usado como fallback. O mesmo fallback foi aplicado ao salvamento de `Configurações → Endereço`.
- Firestore: `store.address`, `store.region` e `store.locationSource` foram incluídos no contrato permitido para atualização pelo Admin, preservando os demais dados do tenant por merge.
- Master: Cidade, Província/Estado e País leem `store.city`, `store.region`/`province`, `store.country` e fallback de `store.address`, sem placeholders como Madrid/Outro; quando não houver dado real, fica `Não preenchido`.
- Origem visual: o Master indica `Centro de Controle → Loja Online → Template da loja` para localização atendida e `Centro de Controle → Atendimento → Endereço` quando o fallback vier do endereço público.
- Cache: `public/admin.html` recebeu novo cache-buster para carregar a versão atualizada de `catalogo.js`.

## 2026-05-16 — Sincronização de redes sociais da loja para o Master
- Arquivos alterados: `public/js/modules/catalogo.js`, `master.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Centro de Controle `Loja Online → Template da loja`, `system_tenants/{uid}.store.social` e Master `Usuários → Editar usuário → Loja`.
- Correção: ao salvar o Template da loja, `instagram`, `facebook` e `tiktok` continuam sendo gravados em `config/template` e também passam a sincronizar por merge para `system_tenants/{uid}.store.social`.
- Debug seguro: a sincronização registra `tenantUid`, caminho salvo e quais campos sociais foram preenchidos, sem dados sensíveis.
- Master: os campos de redes sociais permanecem somente leitura, com origem visual `Centro de Controle → Loja Online → Template da loja`, e usam fallback legado quando `store.social` ainda estiver vazio.

## 2026-05-16 — Aba Conta / Usuária no Admin
- Arquivos alterados: `public/js/modules/configuracoes.js`, `public/admin.html`, `master.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Centro de Controle `Configurações` e Master `Usuários → Editar usuário → Conta`.
- Admin: criada a aba `Conta / Usuária` para a dona da conta preencher nome completo, responsável legal, documento, telefone principal, WhatsApp, idioma da conta e endereço fiscal/contato.
- Componentes: país, país fiscal e idioma usam listas padronizadas; telefone e WhatsApp usam seletor de código por país conforme o padrão global do `AGENTS.md`.
- Firestore: a aba salva por merge em `system_tenants/{uid}` os campos `ownerName`, `responsibleName`, `document`, `phoneCountryCode`, `phoneNumber`, `phoneFull`, `whatsappCountryCode`, `whatsappNumber`, `whatsappFull`, `language`, `accountAddress` e `updatedAt`, sem apagar `billing`, `auth`, `store`, `seo` ou Hotmart.
- Compatibilidade: dados antigos de `Configurações → Geral` e `config/conta_usuario` são usados como fallback e a nova aba também grava `config/conta_usuario` para leitura futura.
- Master: removido o campo visível `País da usuária`; a aba Conta passa a focar em país/endereço fiscal e mantém os dados bloqueados por padrão, editáveis só em modo suporte.

## 2026-05-16 — Localização atendida no Template da loja real
- Arquivos alterados: `public/js/modules/catalogo.js`, `public/js/core/db.js`, `public/admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Admin `Loja Online → Template da loja`, aba `Operação`, e sincronização para `system_tenants/{uid}.store`.
- Correção: os campos `Cidade atendida`, `Província / estado`, `País atendido` e `Código postal base` agora aparecem na tela real usada pela usuária antes das `Zonas de entrega`.
- Zonas: o botão `+ Adicionar zona` preserva a aba `Operação` depois do re-render, evitando voltar visualmente para `Card principal da loja`.
- Re-render: os painéis internos do Template agora nascem com a aba ativa correta no HTML gerado, não apenas por ajuste posterior via JavaScript.
- Bloqueio: o cadastro e salvamento de zonas de entrega só é liberado depois de preencher `Cidade atendida`, `Província / estado`, `País atendido` e `Código postal base`.
- Google/BocaPlaces: a busca de cidade também preenche província/estado, país e código postal nos novos campos do Template da loja.
- Master: ao salvar o template, a localização atendida é sincronizada por merge para `system_tenants/{uid}.store.city`, `province`, `country`, `postalCode` e `deliveryArea`, sem apagar outros campos do tenant.
- Cache: `public/admin.html` recebeu cache-buster para carregar a versão nova de `catalogo.js` e `db.js`.

## 2026-05-16 — Localização atendida antes das zonas de entrega
- Arquivos alterados: `AGENTS.md`, `public/js/core/db.js`, `public/js/modules/configuracoes.js`, `public/admin.html`, `master.html`, `server.rb`, `firestore.rules`, `AI_CHANGELOG.md`.
- Módulo afetado: Admin `Configurações → Template da loja`, Master `Usuários → Editar usuário → Loja` e `system_tenants/{uid}.store`.
- Admin: antes de `deliveryZones`, foram adicionados os campos `Cidade atendida`, `Província / estado`, `País atendido` e `Código postal base`.
- Google/BocaPlaces: o campo `Cidade atendida` usa `BocaPlaces`; ao selecionar local, tenta preencher automaticamente província/estado, país e código postal.
- Sincronização: os campos passam a alimentar `store.city`, `store.province`, `store.country`, `store.postalCode` e `store.deliveryArea`.
- Master: a aba `Loja` agora mostra também `Província / estado da loja`, herdado da localização atendida configurada no Admin.
- Compatibilidade: a Zona 1 de `deliveryZones` continua como fallback quando os novos campos ainda não estiverem preenchidos.

## 2026-05-16 — E-mails de contato e redes sociais no Master
- Arquivos alterados: `public/js/modules/configuracoes.js`, `public/admin.html`, `master.html`, `server.rb`, `firestore.rules`, `AI_CHANGELOG.md`.
- Módulos afetados: Centro de Controle `Configurações`, Master `Usuários` → `Editar usuário` e `system_tenants/{uid}`.
- Conta: o Admin sincroniza `contactEmail`, `adminEmail`, `fiscalEmail` e `billingEmail` a partir de `Configurações → Geral`; o Master exibe `E-mail de contato` e `E-mail administrativo` como campos somente leitura na aba `Conta`.
- Loja: o Admin passa a aceitar Instagram, Facebook e TikTok também em `Configurações → Template da loja` e sincroniza esses dados para `system_tenants/{uid}.store.social`.
- Compatibilidade: a sincronização também lê redes sociais já cadastradas em `Configurações → Integrações`, preservando valores existentes quando o Template ainda não tiver redes preenchidas.
- Segurança: o Master apenas visualiza esses campos; o salvamento preserva `store.social` para não apagar dados vindos do Admin.
- Regras: `firestore.rules` permite ao tenant atualizar somente os novos campos públicos de contato e redes sociais dentro do escopo já autorizado.

## 2026-05-16 — Cidade e país da loja herdados da Zona 1
- Arquivos alterados: `public/js/modules/configuracoes.js`, `public/admin.html`, `firestore.rules`, `AI_CHANGELOG.md`.
- Módulo afetado: Centro de Controle `Configurações` e sincronização para `system_tenants/{uid}.store`.
- Correção: `store.city` e `store.country`, exibidos no Master como `Cidade da loja` e `País da loja`, passam a usar a Zona 1 de `deliveryZones` como fonte preferencial quando disponível.
- Origem: a sincronização lê `deliveryZones[0]` em `Configurações → Template da loja`, usando `city/cidade/locality/name` para cidade e `country/pais/countryCode` ou inferência pelo código postal para país.
- Compatibilidade: se a Zona 1 não tiver dados suficientes, mantém valores existentes e só então usa os campos legados de endereço.
- Regras: `firestore.rules` agora permite `store.postalCode` para registrar o código postal usado na sincronização.
- Cache: atualizei o cache-buster de `configuracoes.js` para carregar a herança por Zona 1 no Admin local.

## 2026-05-16 — Correção do salvar Configurações no Admin
- Arquivos alterados: `public/js/modules/configuracoes.js`, `public/admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Centro de Controle `Configurações` → botão `Salvar configurações`.
- Correção: o payload enviado ao Firestore agora remove campos `undefined` antes de chamar `DB.setDocRoot`, evitando erro em campos opcionais como `custosIndiretosModo`.
- Cache: atualizei o cache-buster de `configuracoes.js` em `public/admin.html` para o navegador carregar a versão corrigida.
- Impacto esperado: o botão volta a salvar as configurações e a sincronização posterior para `system_tenants/{uid}` continua funcionando.

## 2026-05-16 — Sincronização de dados do Admin para o Master
- Arquivos alterados: `AGENTS.md`, `public/js/modules/configuracoes.js`, `master.html`, `server.rb`, `firestore.rules`, `AI_CHANGELOG.md`.
- Módulos afetados: Centro de Controle `Configurações`, Master interno `Usuários` e documento `system_tenants/{uid}`.
- Padronização: dados de cadastro, telefone/WhatsApp, país, idioma, documento, endereço fiscal/contato e dados da loja salvos no Admin passam a ser sincronizados por merge para `system_tenants/{uid}`.
- Caminhos Firestore: o Admin mantém compatibilidade com `tenants/{uid}/config/*`, mas também grava os campos principais em `system_tenants/{uid}` para leitura pelo Master.
- Master: o modal de edição deixou de inventar valores como país/idioma padrão, nome de loja legado ou endereço placeholder; campos ausentes aparecem como `Não preenchido` ou `Aguardando configuração no Centro de Controle`.
- Listagem: a API `/api/master/users` deixa de retornar importações automáticas do Firebase Auth sem loja nem billing configurados na lista principal de tenants BocaFood.
- Domínio/URL: o Master não gera slug automaticamente a partir do nome e aceita tenant sem slug até a usuária configurar em `Configurações → Domínio / URL`.
- Logs/segurança: foram adicionados logs seguros de campos encontrados no Master e log `tenant_support_update` quando houver correção em modo suporte, sem expor documentos, senhas ou tokens.
- Regras: `firestore.rules` permite ao próprio tenant sincronizar somente campos autorizados de perfil/endereço/loja em `system_tenants/{uid}`, preservando a restrição de suspensão da loja.
- Impacto esperado: dados atualizados no Admin aparecem no Master ao recarregar, sem depender de `localStorage`, placeholders ou caminhos antigos como fonte principal.

## 2026-05-16 — Atualização visual da lista de usuários no Master
- Arquivos alterados: `master.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Master interno, aba `Usuários`.
- Correção: a assinatura usada para decidir se a lista precisa redesenhar agora inclui `store.name`, `store.slug`, `store.publicUrl`, `store.status`, plano e status de billing.
- Cache: chamadas GET do helper `api()` agora usam `cache: no-store` para evitar resposta antiga ao recarregar dados do Master local.
- Impacto esperado: alterações feitas no Admin em `system_tenants/{uid}.store` aparecem no Master ao recarregar a lista, sem manter a tabela visualmente congelada.

## 2026-05-16 — Deduplicação de tenants no Master
- Arquivos alterados: `server.rb`, `master.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Master interno, listagem e modal `Usuários`.
- Correção: a API `/api/master/users` agora agrupa tenants por e-mail e prefere o registro com loja/slug/URL/billing configurados, evitando que um registro antigo vazio apareça no lugar do tenant usado pelo Admin.
- URL no Master: a API e o modal passam a exibir a URL BocaFood calculada pelo slug (`https://bocafood.app/loja/{slug}`), mesmo quando `store.publicUrl` antigo ainda contém domínio legado.
- Diagnóstico: havia dois documentos `system_tenants` para `pcruz.digital@gmail.com`, um sem loja e outro com `Banana Rosa`; a lista podia mostrar/abrir o registro vazio.
- Impacto esperado: dados salvos no Admin para o tenant correto aparecem no Master sem apagar documentos antigos.

## 2026-05-16 — Cache-buster do módulo Configurações no Admin
- Arquivos alterados: `public/admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Centro de Controle da usuária, carregamento de `public/js/modules/configuracoes.js`.
- Correção: atualizei a query string do script `configuracoes.js` para forçar o navegador a buscar a versão nova que sincroniza `system_tenants/{uid}.store.slug` e `store.publicUrl`.
- Diagnóstico: `http://127.0.0.1:3000/admin.html` já estava servindo `public/admin.html`, mas o cache-buster antigo podia manter o JavaScript anterior no navegador.
- Impacto esperado: ao recarregar o Admin, a tela `Configurações → Domínio / URL` passa a usar a lógica nova sem depender de hard refresh manual.

## 2026-05-16 — Estrutura Master/Admin/Public e sincronização de slug
- Arquivos alterados: `AGENTS.md`, `server.rb`, `public/js/modules/configuracoes.js`, `master.html`, `AI_CHANGELOG.md`.
- Estrutura documentada: `master.html` permanece fora de `public/`, `public/admin.html` é o Centro de Controle, e `public/index.html`/assets/módulos são a loja pública publicada pelo Firebase Hosting.
- Teste local: documentei que o Admin não deve ser aberto via `file://`; deve ser acessado por `http://127.0.0.1:3000/admin.html`.
- Servidor local: `server.rb` passa a servir arquivos estáticos a partir de `public/`, mantendo `/master.html` servido explicitamente da raiz interna.
- Sincronização de slug: `Configurações → Domínio / URL` agora salva o slug e a URL pública também em `system_tenants/{uid}.store.slug` e `system_tenants/{uid}.store.publicUrl`, além do documento de configuração do tenant.
- Master: a lista/edição lê `system_tenants/{uid}` e registra logs seguros no console com `tenantUid`, caminho lido e slug/URL pública usados.
- Debug seguro: Admin registra no console o `tenantUid`, caminho Firestore salvo e valores não sensíveis (`slug`, `publicUrl`) ao salvar Domínio/URL.
- Impacto esperado: mudanças de slug feitas no Centro de Controle passam a aparecer no Master para o mesmo `tenantUid`, evitando divergência entre `tenants/{uid}/config/dominio` e `system_tenants/{uid}.store`.

## 2026-05-16 — URL pública BocaFood no modal de Usuários
- Arquivos alterados: `AGENTS.md`, `master.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Master interno, modal `Usuários` → `Editar usuário` → aba `Loja`.
- Regra global: documentei que, nesta fase, lojas não terão domínio próprio por cliente e a URL padrão é `https://bocafood.app/loja/{slug}`.
- Modal Master: removi o campo `Domínio`, mantive `Slug público` apenas como leitura com origem `Centro de Controle` e deixei `URL pública calculada` sempre bloqueada com origem `Sistema`.
- Cálculo de URL: a tela agora exibe `https://bocafood.app/loja/{slug}` quando houver slug e `Aguardando slug da loja` quando o slug ainda não existir.
- Salvamento: o Master não edita nem gera slug, não escreve domínio fake e preserva `store.domain` antigo sem exibir nem sobrescrever esse dado nesta etapa.
- Impacto esperado: a aba Loja deixa de sugerir domínio próprio por tenant e passa a refletir a configuração feita pela usuária no Centro de Controle.

## 2026-05-16 — Publicação da loja pelo Centro de Controle
- Arquivos alterados: `public/js/modules/configuracoes.js`, `master.html`, `server.rb`, `firestore.rules`, `AI_CHANGELOG.md`.
- Módulo afetado: Centro de Controle `Configurações` → `Domínio / URL`, Master `Usuários` → `Editar usuário` → `Loja` e estrutura `system_tenants/{uid}.store`.
- Campos criados/alterados: `store.status`, `store.publishedAt`, `store.lastPublishedAt`, `store.unpublishedAt`, `store.lastPublicationError` e `store.publicUrl`.
- Regras de publicação: a usuária pode publicar/despublicar a própria loja; publicação define `store.status = published`, grava datas e URL pública; despublicação define `store.status = unpublished` sem apagar dados.
- Validações: antes de publicar, o Admin exige nome da loja, slug público, idioma, país, WhatsApp/canal de pedido, pelo menos 1 categoria ativa e pelo menos 1 produto ativo.
- Suspensão: quando `store.status = suspended`, o Centro de Controle bloqueia a publicação e orienta contato com suporte BocaFood; o Master vê o status como origem `Sistema/Publicação` e só corrige em modo suporte.
- Logs: ações `store_published`, `store_unpublished`, `store_publication_failed` e `store_suspended` passam a ser registradas em `system_access_logs` com `tenantUid`, `source` e detalhes.
- Segurança: `firestore.rules` permite ao próprio tenant atualizar apenas campos controlados de publicação em `system_tenants/{uid}.store` e criar logs próprios de publicação; tenants não podem remover suspensão.
- Pendências: este fluxo atualiza o estado de publicação e URL no Firestore; não executa deploy manual nem altera geração real de arquivos públicos.

## 2026-05-16 — País fiscal e endereço fiscal no modal de Usuários
- Arquivos alterados: `AGENTS.md`, `master.html`, `server.rb`, `AI_CHANGELOG.md`.
- Módulo afetado: Master interno, modal `Usuários` → `Editar usuário` e salvamento em `system_tenants/{uid}`.
- Regra global: documentei que país fiscal vem do cadastro/setup inicial da usuária, deve ser select/lista e só pode ser corrigido pelo Master em modo suporte com log.
- Modal: movi o país fiscal para a área de conta/endereço, deixei bloqueado por padrão e adicionei o bloco `Endereço fiscal / contato` com rua, número, complemento, bairro/zona, cidade, província/estado, código postal, país e país fiscal.
- Origem dos campos: endereço e país fiscal aparecem como dados de `Cadastro/setup da usuária`, ou `Hotmart` quando o endereço inicial vier da compra; todos ficam editáveis apenas em modo suporte.
- Salvamento: `system_tenants/{uid}` passa a suportar `accountAddress` sem misturar com endereço da loja, preservando endereço e país fiscal quando o modo suporte estiver desligado.
- Logs: alterações manuais em país fiscal, país/cidade/código postal do endereço, documento e e-mail são registradas em `system_access_logs`.
- Impacto esperado: o Master diferencia endereço fiscal/contato da usuária e dados operacionais da loja, evitando correções indevidas fora do modo suporte.

## 2026-05-16 — Bloqueio por origem e modo suporte no modal de Usuários
- Arquivos alterados: `AGENTS.md`, `master.html`, `server.rb`, `AI_CHANGELOG.md`.
- Módulo afetado: regras globais do Master e modal `Usuários` → `Editar usuário`.
- Regra de origem: documentei no `AGENTS.md` que dados operacionais preenchidos pela usuária no Admin ficam somente leitura no Master por padrão, e que dados automáticos de Hotmart, Firebase Auth e sistema não devem ser editados livremente.
- Modal: adicionei `Modo suporte: permitir correções manuais`, aviso de risco e rótulos discretos `Origem: ...` por campo.
- Bloqueios: dados de Admin/usuária, Hotmart, Auth e sistema ficam bloqueados por padrão; campos controlados pelo Master seguem editáveis, como status da conta, plano, ciclo, trial, papel, slug, país fiscal, status da loja e observações.
- Salvamento: com Modo suporte desligado, o payload preserva valores originais dos campos bloqueados e o backend também evita sobrescrever dados de Admin/usuária, Auth e Hotmart.
- Logs: mudanças em e-mail, telefone, WhatsApp, domínio, país fiscal, status da conta, plano, status de assinatura e status da loja são registradas em `system_access_logs`.
- Impacto esperado: o Master passa a separar claramente leitura operacional, correções de suporte e controle administrativo, reduzindo alterações acidentais em dados externos ou automáticos.

## 2026-05-16 — Padrão global de país, idioma e telefone
- Arquivos alterados: `AGENTS.md`, `master.html`, `server.rb`, `AI_CHANGELOG.md`.
- Módulo afetado: regras globais de formulário e modal Master `Usuários` → `Conta`.
- Resumo do ajuste: documentei no `AGENTS.md` que campos de país e idioma devem usar listas padronizadas, e que telefone/WhatsApp devem usar seletor de país com bandeira e código automático.
- Modal Master: troquei `País da usuária` e `Idioma da conta` por selects, e substituí `Telefone`/`WhatsApp` por seletor de código internacional mais número, com migração visual de valores antigos como `+34`, `+351`, `+55`, `+33`, `+39`, `+49`, `+44` e `+1`.
- Salvamento: `system_tenants/{uid}` passa a receber `phoneCountryCode`, `phoneNumber`, `phoneFull`, `whatsappCountryCode`, `whatsappNumber` e `whatsappFull`, mantendo `phone`, `whatsapp`, `country` e `language` para compatibilidade.
- Impacto esperado: o Master passa a seguir o padrão global e reduz dados livres/inconsistentes sem alterar Hotmart, SMTP, pedidos, clientes finais ou template público.

## 2026-05-16 — Salvamento limpo de `system_tenants` pelo modal de Usuários
- Arquivos alterados: `master.html`, `server.rb`, `AI_CHANGELOG.md`.
- Módulo afetado: Master interno, modal `Usuários` e gravação em `system_tenants/{uid}`.
- Resumo do ajuste: alinhei o payload do modal e o `sync_system_tenant!` para gravar a estrutura limpa com blocos `store`, `billing`, `auth` e `seo`, incluindo `store.publicUrl`, status Hotmart e campos avançados de SEO.
- Campos legados: o salvamento em `system_tenants` deixou de escrever `githubRepo`, `githubBranch`, `githubToken`, `publicFile`, `seedFile`, `adminUrl`, duplicidades antigas de plano/status/domínio/SEO e caminhos internos de publicação.
- Compatibilidade: a leitura continua aceitando dados antigos, e campos desconhecidos já existentes não são apagados nesta etapa.
- Logs: alterações em e-mail, status da conta, plano e status de assinatura registram eventos em `system_access_logs`.
- Impacto esperado: o documento `system_tenants/{uid}` passa a refletir o modelo atual do BocaFood sem quebrar a leitura de tenants antigos.

## 2026-05-16 — Readonly e origem dos campos no modal de Usuários
- Arquivos alterados: `master.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Master interno, modal `Usuários` → `Editar usuário`.
- Resumo do ajuste: marquei campos automáticos de Hotmart, Firebase Auth e cálculo do sistema como somente leitura, mantendo editáveis apenas os campos operacionais do Master e campos de suporte.
- Microcopy: adicionei notas discretas para `Dados automáticos da Hotmart`, `Dados do Firebase Auth`, `Dados editáveis pelo Master` e `Dados normalmente preenchidos pela usuária`.
- Segurança operacional: alteração de e-mail agora exibe aviso visual e pede confirmação antes de salvar, porque pode quebrar vínculo com Hotmart e Firebase Auth.
- Impacto esperado: o Master reduz edições acidentais em campos automáticos sem alterar endpoints, regras de dados, Hotmart, SMTP, e-mails, Admin das lojas, pedidos ou template público.

## 2026-05-16 — Abas internas no modal de edição de Usuários
- Arquivos alterados: `master.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Master interno, modal `Usuários` → `Editar usuário`.
- Resumo do ajuste: reorganizei o modal em abas internas `Conta`, `Loja`, `Plano e acesso`, `Hotmart` e `SEO avançado`, mantendo o formulário no mesmo contrato de dados.
- Visual: adicionei abas horizontais claras e rodapé fixo no modal com `Salvar usuário` e `Cancelar` sempre visíveis.
- Campos readonly: deixei `Tenant ID`, `URL pública calculada`, `Auth UID`, datas de acesso/criação/atualização, dados Hotmart e `Última publicação SEO` como leitura no modal.
- Impacto esperado: a edição de tenants fica mais organizada sem alterar regras de dados, endpoints, Hotmart, SMTP, e-mails, Admin das lojas, pedidos ou template público.

## 2026-05-16 — Limpeza do modal de edição de Usuários no Master
- Arquivos alterados: `master.html`, `server.rb`, `AI_CHANGELOG.md`.
- Módulo afetado: Master interno, modal `Usuários` → `Editar usuário`.
- Resumo do ajuste: removi do modal os campos legados de publicação GitHub por tenant, `Painel administrativo`, `Arquivo seed / importação` e duplicidades do SEO técnico.
- SEO técnico: mantive apenas controles avançados sem repetir `Slug público`, `Domínio`, `País fiscal`, `Idioma da loja` e `Status da loja`; a URL canônica passa a ser calculada a partir de domínio/slug ao salvar.
- Backend: preservei `adminUrl`, `seedFile`, `githubRepo`, `githubBranch`, `githubToken` e `publicFile` quando esses campos não vierem mais no formulário, evitando apagar metadados internos/legados ao salvar o usuário.
- Impacto esperado: o modal fica alinhado ao modelo atual de publicação centralizada, sem campos GitHub por cliente e sem duplicidades para a operação do Master.

## 2026-05-16 — Correção dos botões da listagem de Usuários BocaFood
- Arquivos alterados: `master.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Master interno, aba `Usuários`.
- Resumo do ajuste: expus no `window` os handlers usados pelos botões renderizados dinamicamente na listagem e nas pendências de acesso, e corrigi a montagem dos argumentos inline para não quebrar o HTML com `onclick="funcao("uid")"`.
- Impacto esperado: botões `Ver`, `Editar`, `Liberar acesso`, `Bloquear`, `Trocar plano`, `Vincular Hotmart`, `Logs`, `Arquivar` e ações das pendências Hotmart deixam de falhar por função indefinida ou `Unexpected end of input`.

## 2026-05-16 — Filtro estrito de tenants BocaFood no Master
- Arquivos alterados: `master.html`, `server.rb`, `AI_CHANGELOG.md`.
- Módulo afetado: Master interno, aba `Usuários`.
- Resumo do ajuste: a lista principal `Usuários BocaFood` agora filtra `system_tenants` para exibir somente tenants com sinais reais de SaaS, como role administrativa, loja, billing, status de conta ou origem válida.
- Regra anti-cliente-final: registros com origem `firebase_auth*` sem loja e sem billing deixam de aparecer como usuários BocaFood; a tela não consulta `Firebase Auth`, `customers`, `store_customers`, pedidos ou clientes finais para montar a lista principal.
- Botões: `Liberar acesso`, `Bloquear`, `Trocar plano`, `Vincular Hotmart`, `Logs` e `Arquivar` passam a operar sobre endpoints locais conectados a `system_tenants`/logs, sem exclusão definitiva automática.
- Visual/UX: removi a coluna de sincronização da lista principal, troquei `Excluir` por `Arquivar` e atualizei mensagens para `Listando apenas tenants BocaFood com acesso ao Centro de Controle.`
- Endpoints corrigidos/usados: `GET /api/master/users`, `POST /api/master/tenants/action`, `POST /api/master/hotmart/pending/action` e `GET /api/master/access/logs`.
- Pendências: ainda pode existir rota legada de sincronização Firebase para diagnóstico/manual, mas ela não alimenta mais a lista principal de Usuários BocaFood.

## 2026-05-16 — Reorganização de Usuários BocaFood e pendências de acesso
- Arquivos alterados: `master.html`, `server.rb`, `AI_CHANGELOG.md`.
- Módulo afetado: Master interno, aba `Usuários`, usuários SaaS BocaFood e exceções Hotmart.
- Resumo do ajuste: renomeei a lista principal para `Usuários BocaFood`, deixando claro que ela representa clientes do SaaS com acesso ao Centro de Controle da própria loja, não clientes finais das lojas.
- Carregamento: a lista principal passa a chamar `GET /api/master/users`, que lê somente `system_tenants`; a tela deixou de acionar sincronização automática que consultava clientes finais em `tenants/{tenantId}/customers` ou `store_customers`.
- Mensagens: substituí o erro legado de sincronização Firebase por uma mensagem específica de carregamento de `Usuários BocaFood` via Master local.
- Hotmart: removi `Compras Hotmart pendentes` como card principal e transformei em bloco secundário `Pendências de acesso`, exibindo apenas exceções que exigem ação manual.
- Endpoint: corrigi/criei `GET /api/master/hotmart/pending` para retornar apenas pendências reais de `pending_hotmart_access`, com `pendingReason`, buyer, status, subscriber, transação e datas.
- Regra de produto documentada na tela: compra com mesmo e-mail vincula automaticamente; compra sem tenant fica pendente; cadastro posterior com mesmo e-mail deve consumir a pendência; e-mail diferente exige vínculo manual no Master.
- Segurança: `pending_hotmart_access` segue restrito ao Master pelas rules já existentes; nada foi exposto no frontend público.
- Impacto esperado: a tela de Usuários fica focada em tenants/usuárias BocaFood e Hotmart aparece apenas como acompanhamento de exceções, sem misturar clientes finais, pedidos ou dados de lojas.

## 2026-05-15 — Gestão avançada de usuários, billing e Hotmart no Master
- Arquivos alterados: `master.html`, `server.rb`, `firestore.rules`, `AI_CHANGELOG.md`.
- Módulo afetado: Master interno, aba `Usuários`, cadastro de tenants, acesso, billing e vínculo Hotmart.
- Resumo do ajuste: ampliei a listagem de usuários para exibir usuária, e-mail, loja, plano, status da conta, status de assinatura, origem, criação, último acesso e ações de ver/editar/bloquear/liberar/trocar plano/vincular Hotmart/ver logs.
- Formulário: reorganizei o cadastro em seções de dados da usuária, dados da loja, plano/cobrança e Firebase Auth/acesso, incluindo `fullName`, `whatsapp`, `country`, `language`, `accountStatus`, `origin`, `store.*`, `billing.*`, `auth.*`, datas e campos Hotmart.
- Coleções usadas/criadas: `system_tenants/{uid}`, `pending_hotmart_access`, `system_access_logs`, além do cadastro local do Master usado por `server.rb`.
- Estrutura de dados: `system_tenants/{uid}` passa a receber os blocos `store`, `billing` e `auth`, mantendo campos legados como `plan`, `status`, `billingStatus`, `fiscalCountry`, `domain` e `storeUrl` para compatibilidade.
- Hotmart: adicionei área de pendências com ações para vincular a usuário existente, criar tenant a partir da compra e arquivar; vínculo automático/manual respeita o e-mail da compra, e vínculo com e-mail diferente registra log manual.
- Logs: `system_access_logs` registra criação/atualização manual, liberação, bloqueio, troca de plano, vínculo Hotmart, vínculo manual e arquivamento de pendências.
- Segurança: `firestore.rules` mantém dados internos editáveis apenas por Master e bloqueia escrita client-side em `pending_hotmart_access` e `system_access_logs`; tenants comuns não editam billing/status/origem/plano/vínculos.
- Pendências: os botões trabalham sobre o Master local e service account; fluxos completos de cobrança recorrente/cancelamento automático da Hotmart ainda dependem do webhook manter `pending_hotmart_access`/billing atualizado.
- Impacto esperado: o Master passa a controlar usuárias, lojas, acesso, plano, assinatura e compras Hotmart pendentes sem alterar Admin das lojas, template público, pedidos, commit, push ou deploy.

## 2026-05-15 — Warning no fechamento SMTP após envio teste
- Arquivos alterados: `server.rb`, `AI_CHANGELOG.md`.
- Módulo afetado: Master interno, rota `POST /api/master/email/send-test`.
- Resumo do ajuste: se `Net::SMTP` aceitar o envio da mensagem e ocorrer erro apenas no fechamento/quit da conexão, como `SSL_read: Connection reset by peer` ou `EOFError`, a rota passa a retornar sucesso em vez de falha total.
- Logs: `email_logs` agora registra `success` quando enviado, `warning` quando enviado com erro tardio de fechamento e `error` quando a falha acontece antes ou durante autenticação/DATA.
- Segurança: não houve alteração de host, porta, segurança, usuário, senha, layout ou configuração SMTP; credenciais continuam sem log e sem retorno ao frontend.
- Impacto esperado: quando o e-mail realmente chegar ao destinatário, o Master mostra `E-mail de teste enviado com sucesso.` mesmo que o provedor encerre a conexão logo após o envio.

## 2026-05-15 — Carregamento de e-mails pelo backend do Master
- Arquivos alterados: `master.html`, `server.rb`, `AI_CHANGELOG.md`.
- Módulo afetado: Master interno, tela `E-mails automáticos`.
- Resumo do ajuste: removi do carregamento da tela as leituras diretas via Firebase client SDK para `system_email_settings`, `system_email_templates` e `email_logs`, passando a usar endpoints locais do Master.
- Backend: adicionei/completei `GET /api/master/email/settings`, `GET/POST /api/master/email/templates` e `GET /api/master/email/logs`, todos usando o backend Ruby/service account e sem expor `system_private_email_secrets/default`.
- Segurança: `system_private_email_secrets/default` continua sem retorno ao frontend; o Master recebe apenas `smtpPasswordConfigured: true/false` para mostrar `Senha configurada`.
- UX: quando a credencial Firebase do Master não estiver carregada, a tela passa a mostrar `Credencial Firebase do Master não configurada. Inicie pelo start-bocafood-local.sh.` em vez de `Missing or insufficient permissions`.
- Impacto esperado: a tela de e-mails volta a carregar configurações, templates e logs sem depender das permissões Firestore do usuário autenticado no navegador, sem alterar teste SMTP, salvamento SMTP, commit, push ou deploy.

## 2026-05-15 — Envio de e-mail teste pelo Master local
- Arquivos alterados: `master.html`, `server.rb`, `AI_CHANGELOG.md`.
- Módulo afetado: Master interno, tela `E-mails automáticos` e backend local Ruby.
- Resumo do ajuste: alterei o botão `Enviar teste` para chamar `POST /api/master/email/send-test` no Master local e criei a rota correspondente no `server.rb`.
- Backend: a rota valida destinatário, carrega `system_email_settings/default`, `system_private_email_secrets/default` e `system_email_templates/test_email`, cria o template padrão se ele não existir, aplica o layout base e envia o HTML via SMTP com `Net::SMTP`.
- Segurança: a senha SMTP é lida apenas de `system_private_email_secrets/default`, não é logada, não volta no JSON e não é usada no navegador.
- Diagnóstico: adicionei logs seguros `[EMAIL TEST]` com rota chamada, destinatário, template, presença de settings/secret e erro técnico sanitizado.
- Impacto esperado: o teste de e-mail passa a rodar no backend local usando os mesmos dados SMTP já salvos e validados, registrando resultado em `email_logs`, sem alterar o teste de conexão, o salvamento SMTP, commit, push ou deploy.

## 2026-05-15 — Salvamento SMTP pelo Master local
- Arquivos alterados: `master.html`, `server.rb`, `AI_CHANGELOG.md`.
- Módulo afetado: Master interno, tela `E-mails automáticos -> Configuração SMTP` e backend local Ruby.
- Resumo do ajuste: troquei o botão `Salvar configuração` para chamar `POST /api/master/email/settings` no Master local e criei a rota correspondente em `server.rb`.
- Backend: a rota salva as configurações públicas em `system_email_settings/default` com `provider: "smtp"` e salva/atualiza a senha somente em `system_private_email_secrets/default` quando o campo senha vem preenchido.
- Diagnóstico: adicionei logs temporários e seguros no terminal para a rota `/api/master/email/settings`, incluindo chamada da rota, campos recebidos sem senha, sucesso de gravação das coleções e erro técnico sanitizado.
- Segurança: a senha SMTP não é retornada ao frontend, não é gravada em `system_email_settings/default`, não é logada e senha vazia preserva a senha privada já existente.
- UX: falhas de fetch agora mostram mensagem clara sobre servidor local/rota, erros retornam `debug` sem dados sensíveis quando existir, e sucesso retorna `Configuração SMTP salva com sucesso.`
- Impacto esperado: após reiniciar o Master local, a tela deixa de depender da Cloud Function para salvar SMTP e passa a persistir a configuração pelo backend local autorizado, sem commit, push ou deploy.

## 2026-05-14 — Rota local de teste SMTP do Master
- Arquivos alterados: `server.rb`, `master.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Master interno, tela `E-mails automáticos -> Configuração SMTP` e backend local Ruby.
- Resumo do ajuste: reforcei a rota local `POST /api/master/email/test-smtp`, montando também a variante com barra final, e alinhei o payload do frontend para enviar `fromEmail`, `replyTo`, `smtpHost`, `smtpPort`, `smtpSecure`, `smtpUser` e `smtpPassword`.
- Backend: o teste SMTP usa `Net::SMTP` com `OpenSSL`, valida host, porta, usuário e senha, bloqueia SSL direto na porta 587, usa STARTTLS para `TLS` e mantém o endpoint restrito ao Master local.
- Retornos: o endpoint agora responde com `ok`, `code` e `message`, usando `OK`, `AUTH_FAILED`, `CONNECTION_FAILED`, `INVALID_CONFIG` e `ENDPOINT_ERROR`.
- Segurança: o endpoint não salva senha, não devolve senha e não loga senha; registra apenas booleanos de presença para diagnóstico.
- Validação: `ruby -c server.rb` e `node --check functions/index.js` passaram. Um `curl` local retornou conexão recusada porque não havia processo escutando em `127.0.0.1:3000` durante a validação.
- Impacto esperado: após reiniciar o Master local, a rota deixa de ser inexistente e o botão passa a retornar mensagens claras de configuração/conexão SMTP, sem commit, push ou deploy.

## 2026-05-14 — Correção do teste SMTP no Master local
- Arquivos alterados: `master.html`, `server.rb`, `AI_CHANGELOG.md`.
- Módulo afetado: Master interno, tela `E-mails automáticos -> Configuração SMTP` e endpoint local de teste SMTP.
- Resumo do ajuste: corrigi o botão `Testar conexão` para chamar `POST /api/master/email/test-smtp` no Master local em vez de depender da Cloud Function via navegador. O frontend envia somente host, porta, segurança, usuário e senha digitada no formulário para o backend local.
- Backend: criei o endpoint local `/api/master/email/test-smtp` em `server.rb`, usando `Net::SMTP` da biblioteca padrão Ruby para testar conexão TLS, SSL ou sem segurança, com autenticação quando usuário e senha forem informados.
- Erros tratados: endpoint/método incorreto, host/porta inválidos, credenciais inválidas, autenticação SMTP recusada/desativada, SMTP bloqueado/timeout e conexão bem-sucedida.
- Segurança: a senha SMTP não é logada; o backend registra apenas presença de usuário/senha como booleano para diagnóstico. O frontend público não foi alterado.
- Mensagem no Master: falha de rede/rota agora mostra `Não foi possível chamar o servidor de teste SMTP. Verifique se o Master local está rodando e se a rota /api/master/email/test-smtp existe.`
- Pendência: a Cloud Function existente pode ser reaproveitada futuramente para produção, mas o teste local agora não depende dela.
- Impacto esperado: o teste SMTP deixa de exibir `Failed to fetch` sem contexto e passa a validar a conexão pelo servidor local com mensagens acionáveis, sem commit, push ou deploy.

## 2026-05-14 — E-mail de suporte BocaFood
- Arquivos alterados: `master.html`, `functions/index.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Master interno de e-mails automáticos e defaults de e-mails transacionais.
- Resumo do ajuste: alterei o e-mail de suporte padrão para `teajudo@bocafood.app` nos placeholders, defaults da tela, dados fictícios da prévia e Functions.
- Migração: se `system_email_settings/default.replyTo` ou `supportEmail` ainda estiverem com o valor default antigo `suporte@bocafood.com`, o Master/Functions atualizam para `teajudo@bocafood.app`.
- Impacto esperado: novos envios, prévias e configurações default passam a usar o e-mail correto de suporte, sem alterar Admin das lojas, rotas públicas, commit, push ou deploy.

## 2026-05-14 — E-mails automáticos em português com visual Maturidade
- Arquivos alterados: `master.html`, `functions/index.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Master interno de e-mails automáticos e layout base de e-mails transacionais.
- Resumo do ajuste: atualizei os templates padrão e a prévia para português, removendo textos em espanhol dos e-mails. Também refinei o layout base para se aproximar do visual aprovado da tela `Maturidade do Negócio`, com fundo claro rosado, card branco com sombra suave, linha/acento BocaFood, bloco interno em tom quente e botão vermelho.
- Migração: adicionei atualização automática dos templates padrão antigos em espanhol quando ainda estiverem com os textos default, preservando `createdAt`.
- Logo: o layout passa a renderizar a logo do SaaS BocaFood no topo usando `https://bocafood.app/assets/boca-food-logo.png`, com fallback pelo campo `brandLogoUrl`.
- Impacto esperado: novos templates e e-mails enfileirados pelas Functions passam a sair em português e com identidade visual mais próxima do Admin/Maturidade, sem alterar Admin das lojas, rotas públicas, regras globais fora do escopo, commit, push ou deploy.

## 2026-05-14 — Master de e-mails automáticos
- Arquivos alterados/criados: `master.html`, `functions/index.js`, `firestore.rules`, `AI_CHANGELOG.md`.
- Módulo afetado: Master interno, e-mails transacionais, Cloud Functions e segurança Firestore.
- Resumo do ajuste: criei a área `Configurações -> E-mails automáticos` no Master com abas `Configuração SMTP`, `Templates`, `Prévia` e `Logs`; adicionei edição de remetente/SMTP sem exibir senha salva, templates globais, editor com variáveis, prévia responsiva desktop/mobile e logs recentes.
- Coleções criadas/preparadas: `system_email_settings/default`, `system_email_templates/{templateKey}`, `email_logs`, `mail`, `pending_hotmart_access` e `system_private_email_secrets/default` para senha SMTP bloqueada por rules.
- Templates criados: `welcome_hotmart`, `password_reset`, `verify_email`, `subscription_active`, `payment_pending`, `subscription_canceled` e `test_email`.
- Functions criadas/alteradas: `saveEmailSettings`, `testSmtpConnection`, `sendTestEmail` e `hotmartWebhook`; o helper interno carrega template, substitui variáveis `{{variable}}`, aplica layout base responsivo, cria documento compatível com a extensão Firebase Trigger Email from Firestore e registra `email_logs`.
- Segurança: tenants/clientes não podem editar `system_email_settings`/`system_email_templates`, não podem escrever em `mail`, não leem `system_private_email_secrets`, e as funções HTTP exigem token Firebase de Master.
- Hotmart: compra aprovada/assinatura ativa salva `pending_hotmart_access` e enfileira `welcome_hotmart`; eventos duplicados, pendentes ou com sistema/template desativado não disparam envio.
- Pendências: não substituí o fluxo atual de reset de senha; o template `password_reset` ficou preparado para futura geração segura de link via Firebase Admin. Em produção, migrar a senha SMTP para Firebase Secrets/Secret Manager.
- Instruções SMTP/GoDaddy: no Master, informe host SMTP do domínio GoDaddy, porta `587` com `TLS` ou `465` com `SSL`, usuário como e-mail completo, senha da caixa/app password quando aplicável, remetente igual ao domínio autorizado e depois use `Testar conexão` antes de ativar os envios.
- Impacto esperado: o BocaFood passa a ter uma base central de e-mails automáticos controlada pelo Master, sem alterar layout do Admin das lojas, rotas públicas, módulos publicados, commit, push ou deploy.

## 2026-05-13 — Documento técnico de Maturidade do Negócio
- Arquivos alterados: `MATURIDADE_NEGOCIO_FUNCIONAMENTO_MAPEAMENTO.md`, `AI_CHANGELOG.md`.
- Módulo afetado: documentação técnica de Maturidade do Negócio / Sistema de Pedras.
- Resumo do ajuste: criei um documento detalhado explicando a lógica atual de Maturidade, incluindo Pedras, coleções, campos, índices, score, progresso, checklist automático, blockers, upgrade, snapshots, histórico, relação com Temporadas e Plano de Voo, limitações e recomendações.
- Motivo: registrar o funcionamento real da camada de maturidade para orientar validação, produto e próximas etapas técnicas.
- Impacto esperado: o time passa a ter uma referência separada de Temporadas para entender o Sistema de Pedras em detalhe. Não houve alteração de código, layout, Firebase, dados, permissões, commit, push ou deploy.

## 2026-05-13 — Documento técnico de Temporadas
- Arquivos alterados: `TEMPORADAS_FUNCIONAMENTO_MAPEAMENTO.md`, `AI_CHANGELOG.md`.
- Módulo afetado: documentação técnica de Temporadas / Missões Operacionais.
- Resumo do ajuste: criei um documento explicando como Temporadas funciona hoje, incluindo fluxo, rotas, coleções, campos da coleção `seasons`, campos de snapshots, opções do wizard, cálculos, resultados possíveis, integração com Maturidade do Negócio e pendências.
- Motivo: registrar o funcionamento real do módulo para orientar validação, lançamento e próximas etapas.
- Impacto esperado: o time passa a ter uma referência única para entender Temporadas, seus dados, resultados e lacunas atuais. Não houve alteração de código, layout, Firebase, dados, permissões, commit, push ou deploy.

## 2026-05-13 — Remocao do cabecalho da Maturidade
- Arquivos alterados: `public/js/modules/temporadas.js`, `public/admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: tela `Maturidade do Negócio` publicada em `public/`.
- Resumo do ajuste: removi o cabeçalho textual da tela de Maturidade (`Sistema de Pedras`, `Maturidade do Negócio` e o texto explicativo), mantendo o cabeçalho normal apenas em `Temporadas`.
- Motivo: fazer a tela de maturidade começar direto pelo bloco visual das Pedras, sem repetição textual no topo.
- Impacto esperado: ao abrir `crescimento/maturidade`, a usuária vê primeiro a experiência visual de maturidade; `crescimento/temporadas` continua com título, descrição e botão `Nova Temporada`. Não houve alteração de cálculo, Firebase, dados, permissões, commit, push ou deploy.

## 2026-05-13 — Maturidade separada de Temporadas
- Arquivos alterados: `public/admin.html`, `public/js/modules/temporadas.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Admin publicado em `public/`, navegação de Crescimento, Temporadas e Sistema de Pedras.
- Resumo do ajuste: separei `Maturidade do Negócio` em uma rota própria (`crescimento/maturidade`) no topo do menu, sem abas internas. A rota `crescimento/temporadas` voltou a exibir apenas as abas de Temporadas: `Ativa`, `Programadas` e `Histórico`.
- Motivo: deixar claro que Maturidade é uma área permanente do negócio, enquanto Temporadas continua sendo o módulo de campanhas operacionais.
- Impacto esperado: ao clicar em `Maturidade do Negócio`, a usuária vê somente a tela das Pedras; ao clicar em `Temporadas`, vê somente as abas de Temporadas. Não houve alteração de cálculo, Firebase, dados, permissões, estrutura global, commit, push ou deploy.

## 2026-05-13 — Maturidade no topo do Admin
- Arquivos alterados: `public/admin.html`, `public/js/modules/temporadas.js`, `public/css/modules/temporadas.css`, `AI_CHANGELOG.md`.
- Módulo afetado: Admin publicado em `public/`, menu lateral e aba `Maturidade do Negócio` do Sistema de Pedras.
- Resumo do ajuste: adicionei o atalho `Maturidade do Negócio` no topo do menu antes de `Início`, usando a rota existente `crescimento/temporadas`. Também ajustei o hero da página para comunicar `Maturidade do Negócio` em vez de `Temporadas` e refinei o card principal com uma composição mais premium, sem coluna vazia no topo.
- Motivo: deixar a Maturidade como entrada visual principal do Admin e melhorar a leitura da página conforme o padrão esperado.
- Impacto esperado: a usuária encontra a Maturidade imediatamente no menu e vê uma tela mais coerente com o Sistema de Pedras. Não houve alteração de cálculo, Firebase, dados, permissões, estrutura global, commit, push ou deploy.

## 2026-05-13 — Caminhada das Pedras em linha inteira
- Arquivos alterados: `public/css/modules/temporadas.css`, `public/admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Temporadas, aba `Maturidade do Negócio` e Sistema de Pedras publicado em `public/`.
- Resumo do ajuste: movi visualmente o gráfico `Caminhada das Pedras` para ocupar uma linha inteira abaixo do bloco principal e refinei os símbolos das Pedras com uma forma facetada em CSS, brilho e profundidade mais premium.
- Motivo: deixar a jornada mais legível e dar mais presença visual às Pedras, sem usar iniciais ou aparência simples demais.
- Impacto esperado: a usuária vê a trilha completa com mais respiro, destaque claro na Pedra atual e símbolos mais alinhados à estética premium. Atualizei o cache-busting dos assets de Temporadas, sem alterar cálculo, Firebase, dados, rotas, permissões, commit, push ou deploy.

## 2026-05-13 — Design premium da Maturidade do Negócio
- Arquivos alterados: `public/js/modules/temporadas.js`, `public/css/modules/temporadas.css`, `public/admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Temporadas, aba `Maturidade do Negócio` e Sistema de Pedras publicado em `public/`.
- Resumo do ajuste: refinei o layout da tela de maturidade seguindo o padrão visual do Programa de Pontos, com hierarquia mais clara, chips informativos, card premium alinhado à Pedra atual e elementos gráficos em CSS representando as Pedras no lugar de iniciais.
- Motivo: tornar a tela mais elegante, comunicativa e coerente com o nível atual da usuária, sem parecer gamificação infantil.
- Impacto esperado: a usuária passa a ver uma experiência visual mais premium, com cor, progresso e caminhada das Pedras comunicando maturidade do negócio. Atualizei o cache-busting dos assets de Temporadas, sem alterar cálculo, Firebase, dados, rotas, permissões, commit, push ou deploy.

## 2026-05-13 — Caminhada completa das Pedras
- Arquivos alterados: `public/js/modules/temporadas.js`, `public/css/modules/temporadas.css`, `public/admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Temporadas e Sistema de Pedras publicado em `public/`.
- Resumo do ajuste: substituí o painel visual de `Próxima Pedra` por uma jornada com todas as Pedras, marcando as já percorridas, destacando a Pedra atual e deixando as próximas discretas como caminho a percorrer.
- Motivo: deixar claro onde a loja está na evolução completa e quais Pedras ainda faltam, sem depender apenas de uma barra para a próxima etapa.
- Impacto esperado: a usuária passa a entender a trilha completa de maturidade no bloco principal das Pedras. Também atualizei o cache-busting dos assets de Temporadas, sem alterar cálculo, Firebase, dados, rotas, permissões, commit, push ou deploy.

## 2026-05-13 — Fase 6 das Pedras com snapshots de maturidade
- Arquivos alterados: `public/js/modules/temporadas.js`, `public/css/modules/temporadas.css`, `public/admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Temporadas e Sistema de Pedras publicado em `public/`.
- Resumo do ajuste: implementei snapshots históricos em `business_maturity_snapshots`, com geração mensal única, snapshot ao finalizar temporada e snapshot ao ocorrer upgrade de Pedra. Cada snapshot salva Pedra atual, próxima Pedra, progresso, score, índices, checklist, blockers, pontos fortes/fracos, confiança dos dados, fonte e vínculos de temporada/upgrade quando existirem.
- Motivo: criar uma base auditável de maturidade e reduzir dependência de recálculo histórico completo.
- Impacto esperado: o Sistema de Pedras passa a manter histórico recente de maturidade no modal `Histórico de evolução`, limitado aos snapshots mais recentes, sem IA estratégica, rankings, notificações externas, gráficos avançados, comparação entre lojas, commit, push ou deploy.

## 2026-05-13 — Maturidade como primeira aba de Temporadas
- Arquivos alterados: `public/js/modules/temporadas.js`, `public/css/modules/temporadas.css`, `public/admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Temporadas e Sistema de Pedras publicado em `public/`.
- Resumo do ajuste: transformei `Maturidade do Negócio` na primeira aba principal do módulo Temporadas, removendo o card fixo acima das abas e renderizando o Sistema de Pedras dentro do shell principal. Também atualizei o cache-busting do JS/CSS de Temporadas no `public/admin.html`.
- Motivo: deixar a tela de maturidade como entrada principal do módulo, sem parecer uma área aninhada dentro de outra aba.
- Impacto esperado: ao abrir Temporadas pelo Admin publicado, a primeira tela visível passa a ser Maturidade do Negócio, com as abas `Ativa`, `Programadas` e `Histórico` ao lado, sem alteração de cálculo, Firebase, dados, rotas, permissões, commit, push ou deploy.

## 2026-05-13 — Cache-busting das atualizações de Pedras
- Arquivos alterados: `public/admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Admin publicado e carregamento do módulo Temporadas.
- Resumo do ajuste: atualizei a versão dos assets `public/js/modules/temporadas.js` e `public/css/modules/temporadas.css` carregados pelo `public/admin.html` para `20260513-stones-fase5`.
- Motivo: garantir que o navegador carregue as alterações recentes do Sistema de Pedras em vez de manter o JS/CSS antigo em cache.
- Impacto esperado: ao abrir o Admin a partir de `public/`, as fases recentes das Pedras passam a aparecer sem depender de limpeza manual agressiva de cache. Não houve alteração de lógica, Firebase, rotas, permissões, dados, commit, push ou deploy.

## 2026-05-13 — Fase 5 das Pedras com comemoração e histórico
- Arquivos alterados: `public/js/modules/temporadas.js`, `public/css/modules/temporadas.css`, `AI_CHANGELOG.md`.
- Módulo afetado: Temporadas e Sistema de Pedras publicado em `public/`.
- Resumo do ajuste: adicionei comemoração visual elegante quando ocorre subida de Pedra, card `Evolução recente` no bloco das Pedras e modal `Histórico de evolução` lendo `stone_upgrade_events`. Eventos de upgrade passam a nascer com `celebrationPending` e são marcados com `celebrationShownAt` depois da exibição para evitar repetição indevida.
- Motivo: tornar a evolução de Pedra visível, memorável e auditável, sem estética gamer infantil e sem depender de notificações externas.
- Impacto esperado: a usuária vê claramente a transição Pedra anterior → Nova Pedra, os motivos principais e os indicadores do histórico, mantendo multi-tenant via wrapper `DB` e sem alterar scoring, cálculo de upgrade, Temporadas, snapshots mensais, IA estratégica, rankings ou comparação entre lojas.

## 2026-05-13 — Fase 4 das Pedras com upgrade automático
- Arquivos alterados: `public/js/modules/temporadas.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Temporadas e Sistema de Pedras publicado em `public/`.
- Resumo do ajuste: implementei a subida automática de Pedra quando `stoneProgressPercent` chega a 100% sem bloqueios graves. O sistema sobe no máximo uma Pedra por cálculo, reinicia o progresso da nova Pedra, salva dados de auditoria em `business_maturity/current` e registra o evento em `stone_upgrade_events`.
- Motivo: permitir evolução automática da maturidade acumulada quando os dados indicam progresso suficiente, sem depender de ação manual da usuária.
- Impacto esperado: lojas com maturidade suficiente avançam para a próxima Pedra com rastreabilidade de motivo, indicadores usados e assinatura de cálculo, evitando repetição do mesmo upgrade ao reabrir a tela. Não foram implementados snapshots mensais, IA estratégica, rankings, notificações externas ou múltiplas subidas em sequência.

## 2026-05-13 — Fase 3 das Pedras com Caminho automático
- Arquivos alterados: `public/js/modules/temporadas.js`, `public/css/modules/temporadas.css`, `AI_CHANGELOG.md`.
- Módulo afetado: Temporadas e Sistema de Pedras publicado em `public/`.
- Resumo do ajuste: implementei o checklist automático `Caminho da Pedra` em `business_maturity/current`, com itens por transição de Pedra, status `completed`, `pending` e `limited`, categoria, fonte e evidência. O bloco visual das Pedras agora exibe até cinco marcos reais do negócio, como consistência de vendas, conclusão de temporada, redução de risco, crescimento saudável, recorrência e execução.
- Motivo: mostrar evolução real da operação sem transformar o Sistema de Pedras em tarefas manuais, cliques ou gamificação artificial.
- Impacto esperado: a usuária passa a ver o caminho para a próxima Pedra com marcos detectados automaticamente a partir de Temporadas, pedidos, clientes, Plano de Voo e sinais básicos de performance, sem upgrade automático, snapshots mensais, IA estratégica, rankings, notificações ou edição manual de checklist.

## 2026-05-13 — Fase 2 das Pedras integrada às Temporadas
- Arquivos alterados: `public/js/modules/temporadas.js`, `public/css/modules/temporadas.css`, `AI_CHANGELOG.md`.
- Módulo afetado: Temporadas e Sistema de Pedras publicado em `public/`.
- Resumo do ajuste: refinei o cálculo de maturidade para considerar temporadas `finished` e `abandoned`, com impacto por Vitória Total, Vitória Parcial, Temporada Instável, Falha Operacional, abandono, score final, risco e dificuldade. O Resultado Final da Temporada agora mostra o bloco `Impacto na sua Pedra` com Pedra Atual, Próxima Pedra, progresso antes/depois, contribuição e motivo do avanço ou limitação.
- Motivo: fazer temporadas finalizadas influenciarem claramente a evolução da Pedra, sem implementar checklist completo, upgrade automático, snapshots mensais, IA estratégica, rankings ou notificações.
- Impacto esperado: a usuária passa a entender como cada ciclo operacional contribuiu para a maturidade do negócio. A mudança atualiza `business_maturity/current` de forma leve e multi-tenant, sem alterar regras existentes de Temporadas, Plano de Voo, Performance, rotas, Firebase/Auth/DB config ou estrutura global de dados.

## 2026-05-13 — Fase 1 do Sistema de Pedras
- Arquivos alterados: `public/js/modules/temporadas.js`, `public/css/modules/temporadas.css`, `AI_CHANGELOG.md`.
- Módulo afetado: Temporadas e maturidade do negócio publicada em `public/`.
- Resumo do ajuste: implementei a base funcional inicial das Pedras com coleção `business_maturity/current`, ordem oficial das Pedras, estado inicial em Pedra Bruta, cálculo conservador de índices, progresso para próxima Pedra, pontos fortes/fracos e bloco visual premium no módulo Temporadas.
- Motivo: iniciar o Sistema de Pedras sem checklist completo, snapshots avançados, IA estratégica, rankings, notificações ou upgrade automático.
- Impacto esperado: tenants passam a ter uma leitura inicial de maturidade baseada em Temporadas, pedidos, recorrência básica e contexto do Plano de Voo, respeitando multi-tenant via `Auth.getTenantId()`/`DB` e sem alterar a lógica existente de Temporadas, Plano de Voo ou Performance.

## 2026-05-13 — Refinamento do checklist automatico das Pedras
- Arquivos alterados: `STONES_SCORING_SYSTEM.md`, `STONES_EVOLUTION_SYSTEM.md`, `STONES_UI_FLOW.md`, `AI_CHANGELOG.md`.
- Módulo afetado: documentação conceitual do Sistema de Pedras, UX do checklist automatico e maturidade do negócio.
- Resumo do ajuste: redefini o checklist das Pedras como marcos reais de evolução do negócio, não tarefas mecânicas de uso do software. Incluí exemplos por transição de Pedra, linguagem recomendada, itens a evitar e diretrizes de UX.
- Motivo: evitar gamificação artificial e garantir que a usuária perceba evolução empresarial real, baseada em pedidos, Temporadas, Plano de Voo, Performance, financeiro, clientes, recorrência, score e risco.
- Impacto esperado: base conceitual mais clara para uma futura UX premium do Sistema de Pedras, sem implementação de código, sem alteração funcional, sem commit, push ou deploy.

## 2026-05-13 — Reconciliacao seletiva para public
- Arquivos alterados: `public/admin.html`, `public/css/admin.css`, `public/js/core/ui.js`, `public/js/modules/clientes.js`, `public/js/modules/pedidos.js`, `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Admin publicado, camada visual global, Clientes, Pedido Manual e Configuracoes.
- Resumo do ajuste: sincronizei seletivamente para `public/` as mudancas importantes que estavam apenas na raiz, incluindo `css/admin.css`, UI global, Clientes, correcao de Pedido Manual e melhorias visuais seguras de Configuracoes. `public/admin.html` passou a carregar `css/admin.css` sem ser sobrescrito por completo.
- Motivo: alinhar a fonte de verdade publicada com as mudancas ja validadas na raiz, agora que `public/` foi definido como fonte de verdade do Firebase Hosting.
- Impacto esperado: deploy futuro passa a incluir a camada visual global, o visual atualizado de Clientes, a correcao de cliente no Pedido Manual e a migracao visual de Configuracoes. `public/index.html` e `public/js/core/auth.js` foram preservados; nao houve alteracao funcional nova, commit, push ou deploy.

## 2026-05-13 — Definicao de public como fonte de verdade
- Arquivos alterados: `AGENTS.md`, `PUBLIC_SOURCE_OF_TRUTH.md`, `AI_CHANGELOG.md`.
- Módulo afetado: regras de trabalho, organizacao de arquivos publicados e fluxo futuro de deploy.
- Resumo do ajuste: defini `public/` como fonte de verdade para arquivos publicados pelo Firebase Hosting, documentando que duplicatas da raiz devem ser tratadas como legado ate futura reconciliacao.
- Motivo: reduzir confusao entre ambiente local pela raiz e deploy, ja que o Firebase publica somente `public/`.
- Impacto esperado: proximas alteracoes visuais, funcionais e de modulos publicados devem ser feitas em `public/`, sem alteracao funcional, sem sincronizacao de arquivos, sem Firebase/Auth/DB e sem deploy.

## 2026-05-13 — Auditoria de duplicidade raiz/public
- Arquivos alterados: `AI_CHANGELOG.md`.
- Módulo afetado: organização de arquivos do Admin, `public/` e fluxo futuro de publicação.
- Resumo do ajuste: auditei os pares duplicados entre raiz e `public/` para Admin, JS core, módulos, CSS e HTMLs relevantes. Confirmei que o ambiente local atual usa os arquivos da raiz, enquanto Firebase Hosting publica `public/` conforme `firebase.json`.
- Motivo: identificar risco de deploy com arquivos publicados desatualizados, sem apagar, mover, sincronizar, refatorar ou alterar lógica/layout.
- Impacto esperado: diagnóstico claro para uma próxima etapa segura de sincronização entre raiz e `public/`, sem alteração em Firebase/Auth/DB, rotas, permissões, dados, commit, push ou deploy.

## 2026-05-13 — Clientes alinhado ao padrão Catálogo > Produtos
- Arquivos alterados: `js/modules/clientes.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Pedidos > Clientes (`pedidos/clientes`).
- Resumo do ajuste: reajustei a composição visual da tela para seguir o padrão real de Catálogo > Produtos: cabeçalho simples sem card pesado, chips de resumo, KPIs compactos com ícones, card de filtros no mesmo estilo, lista em tabela dentro de card com cabeçalho discreto, linhas com hover suave e ações neutras.
- Motivo: a melhoria anterior ainda não estava visualmente alinhada ao design aprovado de Produtos.
- Impacto esperado: tela de Clientes mais consistente com Catálogo > Produtos, sem alteração de lógica, dados, filtros funcionais, fluxo de salvar, rotas, Firebase, Auth, DB, permissões ou estrutura de dados.

## 2026-05-13 — Remoção de marcadores e melhoria visual real em Pedidos > Clientes
- Arquivos alterados: `js/modules/clientes.js`, `public/js/modules/clientes.js`, `css/admin.css`, `AI_CHANGELOG.md`.
- Módulo afetado: Pedidos > Clientes (`pedidos/clientes`).
- Resumo do ajuste: removi os marcadores temporários `DEBUG CLIENTES ATIVO - RAIZ` e `DEBUG CLIENTES ATIVO - PUBLIC`. Também refinei visualmente a tela controlada por `js/modules/clientes.js`, com topo em card branco, hierarquia de título/subtítulo, KPIs mais leves, filtros em card próprio com labels, lista em bloco tipo tabela, estado vazio mais profissional e ajuste mobile para evitar overflow horizontal.
- Motivo: concluir o diagnóstico de arquivo ativo e tornar a melhoria visual perceptível no navegador sem alterar lógica de Clientes ou Pedidos.
- Impacto esperado: tela `pedidos/clientes` mais próxima do padrão visual de Compras/Financeiro, sem alteração de dados, filtros funcionais, fluxo de salvar, rotas, Firebase, Auth, DB, permissões ou estrutura de dados.

## 2026-05-13 — Marcadores temporários de diagnóstico em Clientes
- Arquivos alterados: `js/modules/clientes.js`, `public/js/modules/clientes.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Pedidos > Clientes.
- Resumo do ajuste: confirmei que existem cópias duplicadas de `admin.html` e `clientes.js` na raiz e em `public/`. Adicionei marcadores temporários diferentes no topo da listagem de Clientes para identificar qual arquivo o navegador está carregando: `DEBUG CLIENTES ATIVO - RAIZ` na cópia da raiz e `DEBUG CLIENTES ATIVO - PUBLIC` na cópia publicada.
- Motivo: diagnosticar por que alterações visuais feitas em `js/modules/clientes.js` podem não aparecer quando o navegador está usando a cópia em `public/js/modules/clientes.js`.
- Impacto esperado: prova visual imediata da origem do JavaScript ativo, sem alterar lógica, dados, rotas, Firebase/Auth/DB, permissões, pedido manual ou layout permanente.

## 2026-05-13 — Vínculo de cliente no Pedido Manual
- Arquivos alterados: `js/modules/pedidos.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Pedidos, Pedido Manual e base de Clientes.
- Resumo do ajuste: corrigi o fluxo de pedido manual para garantir que clientes digitados manualmente sejam vinculados a `store_customers` antes de salvar o pedido. A nova função `_ensureManualOrderCustomer()` busca cliente existente por telefone normalizado, usa e-mail quando não há telefone, cria/atualiza o cadastro quando há dados mínimos e retorna o `customerId` para gravar também em `customerId/clientId` no pedido.
- Motivo: evitar que clientes digitados no Pedido Manual não apareçam depois em `Pedidos > Clientes`, cuja fonte de dados é `store_customers`.
- Impacto esperado: pedidos manuais com cliente novo passam a alimentar a base de Clientes sem alteração visual, sem mudança de rotas, Firebase/Auth/DB config, permissões, estrutura global de dados ou consolidação entre módulos.

## 2026-05-13 — Auditoria de duplicidade de Clientes
- Arquivos alterados: `AI_CHANGELOG.md`.
- Módulo afetado: Pedidos > Clientes, `js/modules/clientes.js` e pontos de cliente em `js/modules/pedidos.js`.
- Resumo do ajuste: auditei a duplicidade de responsabilidades de Clientes entre `Modules.Clientes` e `Modules.Pedidos`, confirmando que a rota visível `pedidos/clientes` usa `Modules.Clientes`, enquanto `pedidos.js` mantém render interno legado de clientes, perfil/histórico próprios, vínculo de cliente ao pedido e seleção de cliente no pedido manual.
- Motivo: identificar riscos antes do lançamento sem alterar lógica, visual, dados, rotas, Firebase, Auth, DB, permissões ou estrutura de dados.
- Impacto esperado: documentação clara dos fluxos ativos e dos riscos de inconsistência, especialmente pedidos manuais com cliente digitado que não geram cadastro em `store_customers` e por isso podem não aparecer na tela `pedidos/clientes`.

## 2026-05-13 — Refinamento visual de Pedidos > Clientes
- Arquivos alterados: `js/modules/clientes.js`, `css/admin.css`, `AI_CHANGELOG.md`.
- Módulo afetado: Pedidos > Clientes (`pedidos/clientes`).
- Resumo do ajuste: melhorei visualmente a tela principal renderizada por `Modules.Clientes`, reorganizando a área de filtros dentro de um card com header, contador de resultados, largura máxima consistente, lista com cards mais limpos, hover sutil, avatar sem dependência de fonte não carregada, métricas internas mais alinhadas e adaptação mobile sem overflow horizontal.
- Motivo: tornar a melhoria visual perceptível para validação manual, indo além da troca técnica de classes.
- Impacto esperado: tela `pedidos/clientes` mais limpa, legível e responsiva, sem alteração de lógica, dados, filtros, histórico, perfil, segmentação, modais, rotas, Firebase, Auth, DB, permissões ou estrutura de dados.

## 2026-05-13 — Refinamento visual de Configurações > Geral
- Arquivos alterados: `js/modules/configuracoes.js`, `css/admin.css`, `AI_CHANGELOG.md`.
- Módulo afetado: Configurações > Geral.
- Resumo do ajuste: melhorei visualmente apenas a função `_renderGeral()` em `js/modules/configuracoes.js`, reorganizando a tela em cards mais claros, seções com headers consistentes, grids responsivos, campos mais limpos, bloco de avatar mais leve, cards internos neutros e barra de ação final mais alinhada ao padrão global. Também adicionei classes genéricas reutilizáveis em `css/admin.css` para seções, grids, linhas de ação e layout split responsivo.
- Motivo: tornar a melhoria visual perceptível para validação manual, indo além da troca técnica de classes sem alterar comportamento.
- Impacto esperado: tela `configuracoes/geral` mais limpa, espaçada e responsiva, sem alteração de lógica, dados, rotas, Firebase, Auth, DB, permissões, estrutura de dados, campos existentes ou fluxo de salvar.

## 2026-05-13 — Migração visual inicial de Configurações
- Arquivos alterados: `js/modules/configuracoes.js`, `css/admin.css`, `AI_CHANGELOG.md`.
- Módulo afetado: Configurações do Admin.
- Resumo do ajuste: confirmei que as rotas visíveis `configuracoes`, `configuracoes/geral`, `configuracoes/tpv`, `configuracoes/dominio`, `configuracoes/integracoes` e `configuracoes/plano` são controladas por `Modules.Configuracoes` via fallback da rota base `configuracoes`. Migrei visualmente campos, botões, cards, tabelas simples, chips, canais de venda e modais de fornecedor/unidade para classes globais (`bf-btn`, `bf-card`, `bf-panel`, `bf-table`, `bf-field`, `bf-input`, `bf-select`, `bf-textarea` e `bf-badge`), mantendo estilos inline nos layouts específicos.
- Motivo: avançar a padronização visual segura do Admin em um módulo de menor risco, sem refatorar lógica nem alterar contratos.
- Impacto esperado: Configurações mais alinhado à camada visual global, sem alteração funcional, sem mudança de Firebase, Auth, DB, rotas, permissões, estrutura de dados, integrações, tenant ou fluxos de formulário.

## 2026-05-13 — Migração visual inicial de Clientes
- Arquivos alterados: `js/modules/clientes.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Pedidos > Clientes (`pedidos/clientes`) e documentação de alterações.
- Resumo do ajuste: confirmei que a rota visível `pedidos/clientes` é controlada por `Modules.Clientes` em `js/modules/clientes.js`. Apliquei uma migração visual pequena usando classes globais já existentes (`bf-btn`, `bf-btn-primary`, `bf-btn-secondary`, `bf-card`, `bf-input`, `bf-select`, `bf-field` e `bf-textarea`) em botões, filtros, cards e campos do módulo, mantendo estilos inline nos trechos sensíveis.
- Motivo: iniciar a padronização visual segura de Clientes sem alterar lógica, dados, busca, filtros, histórico, perfil, segmentação, modais, rotas, Firebase, Auth, DB, permissões ou estrutura de dados.
- Impacto esperado: tela de Clientes mais alinhada à camada visual global do Admin, com `js/modules/pedidos.js` preservado para uma etapa própria por ainda conter uma implementação interna/duplicada de clientes.

## 2026-05-13 — Arquitetura técnica do Sistema de Pedras
- Arquivos alterados: `STONES_ARCHITECTURE.md`, `AI_CHANGELOG.md`.
- Módulo afetado: Documentação técnica do Sistema de Pedras, Temporadas, Plano de Voo, Performance e maturidade do negócio.
- Resumo do ajuste: criei a arquitetura técnica do Sistema de Pedras, definindo coleções sugeridas, snapshots, eventos de upgrade, ordem oficial das Pedras, fontes de dados, índices calculados, checklist automático, blockers, gatilhos de recálculo, data confidence, auditabilidade, regras multi-tenant, performance e itens fora do escopo da V1.
- Motivo: preparar a futura implementação das Pedras com persistência, cálculo e auditoria claros antes de alterar qualquer lógica do sistema.
- Impacto esperado: base técnica para uma V1 auditável e segura, sem alterar código, telas, rotas, Firebase, Auth, DB, permissões ou estrutura de dados.

## 2026-05-13 — Validação da camada visual global do Admin
- Arquivos alterados: `css/admin.css`, `AI_CHANGELOG.md`.
- Módulo afetado: Admin e UI core.
- Resumo do ajuste: validei a integração da camada visual global do Admin, mantendo a ordem atual de CSS e os fallbacks inline. Adicionei aliases dos tokens legados (`--red`, `--line`, `--muted` etc.) dentro de `css/admin.css` para a camada global continuar compatível com o shell antigo sem depender apenas do `<style>` inline.
- Motivo: garantir compatibilidade entre os novos tokens `--bf-*` e os tokens antigos usados pelo Admin antes de iniciar migração visual de módulos menores.
- Impacto esperado: camada visual global mais segura para uso gradual, sem alterar módulos de negócio, rotas, Firebase, Auth, DB, permissões, dados ou fluxos.

## 2026-05-13 — Sistema de cálculo das Pedras
- Arquivos alterados: `STONES_SCORING_SYSTEM.md`, `AI_CHANGELOG.md`.
- Módulo afetado: Documentação técnica do Sistema de Pedras, Temporadas, Plano de Voo, Performance e maturidade do negócio.
- Resumo do ajuste: criei a especificação conceitual do cálculo das Pedras, definindo índices oficiais, pesos sugeridos, progresso de 0 a 100%, checklist automático, regras por Pedra, influência dos cenários do Plano de Voo, desacelerações, proteções e dados permitidos para V1.
- Motivo: estabelecer uma lógica adulta de maturidade acumulada, evitando XP artificial e evitando premiar faturamento bruto, volume de pedidos ou crescimento caótico.
- Impacto esperado: base documental para uma futura implementação segura do Sistema de Pedras, com evolução gradual, auditável e justa para lojas pequenas e grandes.

## 2026-05-13 — Primeira camada visual global do Admin
- Arquivos alterados: `admin.html`, `css/admin.css`, `js/core/ui.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Admin, UI core e documentação técnica.
- Resumo do ajuste: criei `css/admin.css` com tokens globais e classes reutilizáveis para botões, cards, campos, tabelas, badges, modais, confirmação, toast e loading. O Admin agora carrega esse CSS após as fontes, mantendo o `<style>` inline existente. Também adicionei classes compatíveis aos elementos criados por `UI.modal`, `UI.confirm`, `toast` e `loading`, preservando os estilos inline como fallback.
- Motivo: iniciar uma padronização visual segura do Admin sem refatorar módulos grandes, lógica, rotas, Firebase, Auth, DB, permissões, tenants ou estrutura de dados.
- Impacto esperado: base visual reutilizável para próximas etapas de padronização, com baixo risco funcional e sem alterar fluxos dos módulos de negócio.

## 2026-05-13 — Especificação do Sistema de Pedras com Pedra Bruta
- Arquivos alterados: `STONES_EVOLUTION_SYSTEM.md`, `BUSINESS_MATURITY_DATA_MAP.md`, `AI_CHANGELOG.md`.
- Módulo afetado: Documentação técnica do Sistema de Pedras, Plano de Voo, Performance e Temporadas.
- Resumo do ajuste: criei a especificação conceitual do Sistema de Pedras com a nova ordem oficial incluindo Pedra Bruta, relação correta com os cenários `survival`, `equilibrium`, `growth` e `expansion`, e critérios de evolução por estágio real do negócio.
- Motivo: evitar que a progressão premie apenas crescimento agressivo ou penalize lojas pequenas/em sobrevivência; reconhecer sobrevivência, consistência, execução e risco controlado como evolução válida.
- Impacto esperado: base conceitual mais segura para uma V1 futura das Pedras, com crescimento saudável como componente e não como critério único.

## 2026-05-13 — Auditoria técnica e visual do Admin
- Arquivos alterados: `ADMIN_AUDIT.md`, `AI_CHANGELOG.md`.
- Módulo afetado: Documentação técnica do Admin.
- Resumo do ajuste: criei uma auditoria objetiva do Admin atual, mapeando módulos carregados e não carregados, rotas registradas e visíveis no menu, possíveis rotas legadas, famílias de modais/overlays, padrões visuais e inconsistências de design system.
- Motivo: preparar uma padronização visual segura sem refatorar lógica, rotas, Firebase, Auth, DB, permissões, estrutura de dados ou workflows.
- Impacto esperado: base técnica para planejar uma primeira etapa de padronização por tokens/classes globais, reduzindo risco de regressão nos módulos grandes.

## 2026-05-13 — Mapa de dados para Sistema de Pedras
- Arquivos alterados: `BUSINESS_MATURITY_DATA_MAP.md`, `AI_CHANGELOG.md`.
- Módulo afetado: Documentação técnica, Temporadas, Plano de Voo, Performance, Financeiro, Pedidos, Clientes, Compras, Cardápio, Marketing e Programa de Pontos.
- Resumo do ajuste: criei um relatório técnico mapeando dados reais disponíveis para um futuro Sistema de Pedras/Maturidade do Negócio, diferenciando Temporadas de evolução acumulada e classificando métricas por fonte, confiabilidade e uso recomendado.
- Motivo: orientar a decisão de produto e arquitetura para uma progressão baseada em crescimento saudável, consistência, margem, caixa, execução e risco controlado, sem premiar apenas faturamento bruto.
- Impacto esperado: base documental para desenhar uma V1 segura do Sistema de Pedras e identificar dados que precisam de padronização antes de virarem score permanente.

## 2026-05-13 — Redução de riscos de FOUC em HTML/CSS
- Arquivos alterados: `admin.html`, `public/admin.html`, `review.html`, `public/review.html`, `track.html`, `public/track.html`, `master.html`, `index.html`, `public/index.html`, `template-mobile-premium-fiel.html`, `index-template-publico-anterior.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Admin, Master local, loja pública, review, tracking e templates públicos.
- Resumo do ajuste: reposicionei scripts bloqueantes do cabeçalho para depois dos blocos de CSS crítico nos HTMLs afetados, mantendo a ordem de carregamento entre os scripts. Também adicionei `display=block` às fontes externas de ícones do Google e movi os snippets de Analytics/Pixel do template público anterior para o fim do `body`.
- Motivo: reduzir flash de conteúdo sem estilo causado por scripts antes do CSS crítico e por fontes de ícones sem estratégia explícita de exibição.
- Impacto esperado: render inicial mais estável, com menor chance de FOUC/FOUT em páginas públicas e painéis, sem alterar rotas, permissões, Firebase, workflows ou estrutura de dados.

## 2026-05-12 — Upload de imagens do Admin no Firebase Storage
- Arquivos alterados: `public/js/core/image-tools.js`, `public/js/modules/catalogo.js`, `public/js/modules/configuracoes.js`, `js/core/image-tools.js`, `js/modules/catalogo.js`, `js/modules/configuracoes.js`, `storage.rules`, `AI_CHANGELOG.md`.
- Módulo afetado: Admin, Catálogo, Configurações e Firebase Storage.
- Resumo do ajuste: o helper central `ImageTools` passou a validar JPG/PNG/WebP até 8 MB, otimizar as imagens em WebP e enviar para paths multi-tenant no Firebase Storage. Produtos, categorias, banners, logos/avatar, favicon e imagens de destaque passam pelo mesmo fluxo, mantendo preview, timeout de upload e bloqueio de salvamento quando há upload de produto pendente.
- Padrão de paths: `tenants/{tenantId}/products/{productId}/{filename}`, `tenants/{tenantId}/categories/{categoryId}/{filename}`, `tenants/{tenantId}/banners/{bannerId}/{filename}`, `tenants/{tenantId}/logos/{filename}` e `tenants/{tenantId}/featured/{id}/{filename}`.
- Compatibilidade: leituras antigas por `imageUrl`, `imageCardUrl`, `imageThumbUrl`, `logoUrl`, `bannerUrl` e storage paths legados foram mantidas; produtos antigos sem imagem continuam usando fallback visual. As regras de Storage aceitam o tenant do próprio `uid` ou o `tenantId` ativo mapeado em `system_tenants/{uid}`.

## 2026-05-12 — Migração para Google Places Autocomplete novo
- Arquivos alterados: `public/js/core/db.js`, `public/js/modules/compras.js`, `public/js/modules/configuracoes.js`, `public/js/modules/clientes.js`, `public/js/modules/catalogo.js`, `js/core/db.js`, `js/modules/compras.js`, `js/modules/configuracoes.js`, `js/modules/clientes.js`, `js/modules/catalogo.js`, `js/modules/operacao.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Configurações, Compras, Clientes, Catálogo/Template e Operação local.
- Resumo do ajuste: substituí o uso legado de `google.maps.places.Autocomplete` pelo `google.maps.places.PlaceAutocompleteElement`, mantendo fallback manual quando a chave/API não estiver disponível. Também ajustei o carregamento do Maps JS com `loading=async` e padronizei os cadastros de endereço no mesmo modelo do modal de fornecedor.
- Impacto esperado: campos de endereço seguem editáveis como texto normal e, quando a API nova carrega, selecionam endereço com dados estruturados como rua, número, bairro/localidade, cidade, província, país, código postal, coordenadas e `placeId` quando disponíveis. O campo de referência/complemento permanece manual e em branco após a seleção automática.

## 2026-05-12 — Carregamento seguro da identidade no Admin
- Arquivos alterados: `public/admin.html`, `public/js/core/auth.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Centro de Control.
- Resumo do ajuste: o cartão de nome/avatar da loja agora inicia em estado neutro, só aplica dados depois da sessão atual e do tenant carregarem, e ignora respostas antigas de autenticação/configuração.
- Impacto esperado: ao atualizar ou trocar login, o Admin não exibe nome/avatar antigo de outro usuário ou tenant antes dos dados atuais carregarem.

## 2026-05-12 — Redirecionamento do cc para Admin
- Arquivos alterados: `public/index.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Centro de Control publicado.
- Resumo do ajuste: adicionei redirecionamento mínimo para que `https://cc.bocafood.app/` abra automaticamente `/admin.html`.
- Impacto esperado: o domínio `cc.bocafood.app` abre o Admin na raiz sem alterar `bocafood.app`, `/loja/{slug}`, rotas públicas, Firebase Hosting, regras Firebase ou Master local.

## 2026-05-12 — URLs públicas por slug de loja
- Arquivos alterados: `master.html`, `server.rb`, `public/index.html`, `firebase.json`, `firestore.rules`, `AI_CHANGELOG.md`.
- Módulo afetado: Master local, loja pública e Firebase Hosting.
- Resumo do ajuste: adicionei slug público obrigatório no cadastro de loja do Master, geração automática a partir do nome, URL `https://bocafood.app/loja/{slug}` e gravação do mapeamento seguro em `public_stores/{slug}`. A loja pública agora resolve `/loja/{slug}` por esse mapeamento e carrega o tenant correspondente.
- Motivo: permitir endereço interno automático por loja sem DNS, subdomínio ou domínio próprio.
- Impacto esperado: Firebase Hosting mantém publicação em `public/`, reescreve apenas `/loja/**` para `index.html`, preserva rotas existentes e permite leitura pública apenas por `get` de um slug específico.

## 2026-05-12 — Estrutura pública do Firebase Hosting
- Arquivos alterados/criados: `firebase.json`, `public/`, `AI_CHANGELOG.md`.
- Módulo afetado: Publicação Firebase Hosting.
- Resumo do ajuste: criei a pasta `public/` com cópias dos arquivos necessários para a loja pública e o Admin funcionarem online, incluindo HTMLs públicos/admin, `assets/`, `css/`, `js/`, `produtos/`, `produtos.json`, `robots.txt`, `sitemap.xml` e `logo.png`. Ajustei o Hosting em `firebase.json` para publicar `public/`.
- Motivo: impedir que arquivos internos da raiz sejam publicados no Hosting.
- Impacto esperado: `master.html`, `server.rb`, ferramentas internas, documentação, credenciais e caches deixam de fazer parte do diretório publicado, sem alterar visual, rotas internas, Auth, Firestore ou regras de negócio.

## 2026-05-11 — Remoção da pílula Loja online no Início
- Arquivos alterados: `js/modules/dashboard.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Início.
- Resumo do ajuste: removi a pílula `Loja online aberta/fechada` do cabeçalho do módulo Início.

## 2026-05-11 — Refinamento premium dos cards e balões dos gráficos
- Arquivos alterados: `js/modules/temporadas.js`, `css/modules/temporadas.css`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Temporadas.
- Resumo do ajuste: removi a repetição do nome do gráfico dentro dos balões dos gráficos e refinei os cards superiores com borda mais sofisticada, fundo sutil, ícones em cápsula, sombra mais premium e hover mais elegante.
- Motivo: reduzir redundância nos balões e melhorar a percepção visual dos indicadores principais do painel.
- Impacto esperado: cards superiores mais sofisticados e balões de gráficos mais diretos, sem alterar cálculos ou dados.

## 2026-05-11 — Consistência como leitura inicial no começo da temporada
- Arquivos alterados: `js/modules/temporadas.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Temporadas.
- Resumo do ajuste: ajustei o gráfico e o balão de `Consistência` para não classificar o primeiro dia como regularidade boa. Quando a temporada ainda tem poucos dias, poucos pedidos ou apenas um dia ativo, o balão mostra `Leitura inicial`.
- Motivo: evitar interpretação incorreta de 100% de consistência no começo da temporada, quando ainda não há base suficiente para avaliar regularidade.
- Impacto esperado: leitura mais honesta e compreensível da consistência sem alterar cálculos salvos ou regras de score.

## 2026-05-11 — Balões dos gráficos sobre a barra
- Arquivos alterados: `css/modules/temporadas.css`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Temporadas.
- Resumo do ajuste: reposicionei os balões dos gráficos para aparecerem sobre a própria área da barra quando selecionados, com camada acima do gráfico e sem seta deslocada.
- Motivo: garantir que o balão sobreponha a imagem/área visual do gráfico em vez de abrir abaixo dela.
- Impacto esperado: ao clicar em um gráfico, a explicação aparece diretamente sobre ele, sem alterar cálculos ou dados.

## 2026-05-11 — Correção de estado dos balões dos gráficos
- Arquivos alterados: `js/modules/temporadas.js`, `css/modules/temporadas.css`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Temporadas.
- Resumo do ajuste: os balões dos cards e gráficos agora nascem com `hidden` e o clique controla explicitamente a abertura/fechamento, além da classe visual `open`.
- Motivo: impedir que balões fiquem visíveis de forma fixa quando nenhum card ou gráfico está selecionado.
- Impacto esperado: balões aparecem somente ao selecionar o card/gráfico correspondente e voltam a ocultar ao fechar ou abrir outro.

## 2026-05-11 — Ajustes de gráficos e remoção do Tenant atual em Temporadas
- Arquivos alterados: `js/modules/temporadas.js`, `css/modules/temporadas.css`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Temporadas.
- Resumo do ajuste: removi os campos visuais `Tenant atual:` dos estados de erro, vazio e temporada ativa; também deixei os valores dos gráficos visíveis apenas nos balões ao selecionar o gráfico, removi o balão da barra `Chance de falha` e ampliei as explicações dos balões de progresso, ritmo, consistência e fidelização.
- Motivo: limpar a interface e tornar a explicação dos gráficos mais útil sem expor informação técnica de tenant na tela.
- Impacto esperado: painel mais limpo, gráficos com valores mais discretos e explicações mais claras, sem alterar cálculos, dados, tenantId interno ou regras.

## 2026-05-11 — Balões contextuais nos gráficos da temporada
- Arquivos alterados: `js/modules/temporadas.js`, `css/modules/temporadas.css`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Temporadas.
- Resumo do ajuste: adicionei balões clicáveis na barra principal de progresso e nas barras de status (`Ritmo operacional`, `Consistência`, `Fidelização` e `Chance de falha`), seguindo a mesma lógica contextual dos cards.
- Motivo: permitir que a usuária clique nos gráficos e entenda o resultado atual e o motivo da leitura exibida.
- Impacto esperado: gráficos passam a explicar seus próprios resultados sem alterar cálculos, snapshots, dados ou regras.

## 2026-05-11 — Balões sobrepostos aos gráficos da temporada
- Arquivos alterados: `js/modules/temporadas.js`, `css/modules/temporadas.css`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Temporadas.
- Resumo do ajuste: reverti o layout dos valores das barras para o formato anterior e ajustei os balões dos cards para ficarem acima da área de gráficos, com `z-index` maior e containers permitindo overflow.
- Motivo: o pedido era para o balão dos cards sobrepor os gráficos quando aberto, não reposicionar os valores das barras.
- Impacto esperado: os gráficos voltam ao visual anterior e os balões de `Progresso`, `Score`, `Ritmo Atual` e `Chance de Falha` aparecem por cima da área abaixo sem serem cortados.

## 2026-05-11 — Valores acima dos gráficos da temporada
- Arquivos alterados: `js/modules/temporadas.js`, `css/modules/temporadas.css`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Temporadas.
- Resumo do ajuste: reposicionei os valores percentuais das barras de status para aparecerem acima dos gráficos, com o número em destaque antes do rótulo; também ajustei a barra principal de progresso para destacar o valor acima da barra.
- Motivo: deixar a leitura dos gráficos mais direta, com o valor visível antes da barra.
- Impacto esperado: gráficos do painel ficam mais claros sem alterar os cálculos ou dados.

## 2026-05-11 — Balões contextuais por resultado da temporada
- Arquivos alterados: `js/modules/temporadas.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Temporadas.
- Resumo do ajuste: tornei os balões de `Progresso`, `Score`, `Ritmo Atual` e `Chance de Falha` contextuais ao resultado exibido, usando valores atuais, meta, progresso esperado, risco inicial, ritmo e dias restantes.
- Motivo: explicar por que a temporada está com determinado resultado, como chance de falha alta ou muito alta, em vez de mostrar uma descrição genérica do indicador.
- Impacto esperado: usuária entende a causa do status atual diretamente no card, sem alterar cálculos, dados, snapshots ou regras.

## 2026-05-11 — Balões de resultado nos cards principais da temporada
- Arquivos alterados: `js/modules/temporadas.js`, `css/modules/temporadas.css`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Temporadas.
- Resumo do ajuste: adicionei balões clicáveis nos cards `Progresso`, `Score`, `Ritmo Atual` e `Chance de Falha`, exibindo o resultado atual e uma explicação curta do indicador.
- Motivo: permitir que a usuária entenda rapidamente o resultado atual desses indicadores sem abrir o modal completo de ajuda.
- Impacto esperado: leitura mais clara no Painel da Temporada, sem alterar cálculos, dados, snapshots ou regras.

## 2026-05-11 — Sombra vermelha evidente nos cards prioritários
- Arquivos alterados: `css/modules/temporadas.css`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Temporadas.
- Resumo do ajuste: aumentei a intensidade visual dos cards prioritários com borda vermelha mais forte, halo vermelho e sombra vermelha mais evidente no estado normal e no hover.
- Motivo: o destaque anterior estava sutil demais e não ficava perceptível na tela da temporada.
- Impacto esperado: cards de maior peso ficam claramente visíveis sem adicionar texto ou alterar cálculos.

## 2026-05-11 — Sombra reforçada nos cards prioritários de Temporadas
- Arquivos alterados: `css/modules/temporadas.css`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Temporadas.
- Resumo do ajuste: reforcei a sombra, borda e hover dos cards marcados como prioritários pela temporada ativa, mantendo o destaque puramente visual e sem texto adicional.
- Motivo: destacar melhor os cards correspondentes aos campos de maior peso sem poluir a interface.
- Impacto esperado: a usuária identifica rapidamente os cards mais importantes da temporada atual sem qualquer mudança em cálculo, dados ou regras.

## 2026-05-11 — Destaque visual sem selo nos campos prioritários de Temporadas
- Arquivos alterados: `js/modules/temporadas.js`, `css/modules/temporadas.css`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Temporadas.
- Resumo do ajuste: removi o texto `Mais peso` dos cards e barras destacadas, mantendo apenas borda, sombra e hover; também tornei os labels dos cards principais contextuais conforme o objetivo, como `Ticket atual`, `Meta de ticket`, `Faturamento atual` ou `Dias ativos`.
- Motivo: destacar os campos importantes sem poluir visualmente a tela e deixar os indicadores acompanharem a temporada ativa.
- Impacto esperado: tela da temporada mais limpa, com destaque visual claro e nomes de campos mais coerentes com o objetivo escolhido, sem alterar cálculos ou dados.

## 2026-05-11 — Destaque visual dos campos com mais peso na tela da temporada
- Arquivos alterados: `js/modules/temporadas.js`, `css/modules/temporadas.css`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Temporadas.
- Resumo do ajuste: apliquei destaque visual nos cards principais da Visão Geral que representam os campos de maior peso da temporada, com selo `Mais peso`, sombra, borda destacada e hover; também destaquei barras relevantes como Ritmo operacional, Consistência ou Fidelização conforme o objetivo.
- Motivo: deixar mais evidente, na própria tela da temporada, quais indicadores merecem mais atenção de acordo com a configuração ativa.
- Impacto esperado: leitura mais rápida dos campos prioritários sem alterar score, metas, snapshots, IA, dados ou regras de cálculo.

## 2026-05-11 — Destaque dos campos com maior peso na ajuda da temporada
- Arquivos alterados: `js/modules/temporadas.js`, `css/modules/temporadas.css`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Temporadas.
- Resumo do ajuste: adicionei no modal `Como ler esta temporada` o bloco `Campos com mais peso nesta temporada`, mostrando os pesos principais do objetivo ativo, como ticket médio, faturamento, recompra ou consistência.
- Motivo: deixar claro quais indicadores têm mais influência na leitura do score de acordo com a temporada configurada.
- Impacto esperado: a usuária identifica rapidamente onde prestar mais atenção, sem alteração nos cálculos, dados ou regras do módulo.

## 2026-05-11 — Explicação do resumo em Como ler esta temporada
- Arquivos alterados: `js/modules/temporadas.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Temporadas.
- Resumo do ajuste: adicionei a seção `O que significa este resumo` no modal `Como ler esta temporada`, explicando Objetivo, Estratégia, Dificuldade e Duração com base na temporada ativa.
- Motivo: deixar claro o significado dos cards do topo, como `Objetivo: Aumentar Ticket`, `Estratégia: Volume` e `Dificuldade: Equilibrado`.
- Impacto esperado: a usuária entende a configuração da temporada antes de interpretar progresso, score e gráficos, sem alterar cálculos ou dados.

## 2026-05-11 — Troca de Build por Estratégia em Temporadas
- Arquivos alterados: `js/modules/temporadas.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Temporadas.
- Resumo do ajuste: troquei os textos visíveis `Build` e `build operacional` por `Estratégia` e `estratégia operacional` no painel, ajuda, resumo de criação, detalhes de programadas e resultado final.
- Motivo: alinhar a linguagem do módulo à nomenclatura desejada pela interface.
- Impacto esperado: a usuária vê `Estratégia` sem alterar o campo interno `build`, dados existentes, cálculos, snapshots ou regras.

## 2026-05-11 — Reorganização da explicação dos gráficos da temporada
- Arquivos alterados: `js/modules/temporadas.js`, `css/modules/temporadas.css`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Temporadas.
- Resumo do ajuste: movi a explicação geral `Barras de status` para ficar logo abaixo de `Como ler os gráficos`, antes dos itens específicos de cada barra.
- Motivo: deixar claro que esse texto explica o conjunto dos gráficos, não um indicador separado.
- Impacto esperado: modal de ajuda mais organizado e fácil de entender, sem alterar cálculos ou regras do painel.

## 2026-05-11 — Ajuste da ajuda e textos do Painel da Temporada
- Arquivos alterados: `js/modules/temporadas.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Temporadas.
- Resumo do ajuste: incluí a seção `Como ler os gráficos` no modal de ajuda da temporada e removi os textos auxiliares dos cards `Ritmo Atual` e `Chance de Falha` no painel.
- Motivo: deixar a leitura do painel mais limpa e concentrar explicações detalhadas dentro do modal de ajuda.
- Impacto esperado: usuária entende as barras e gráficos pelo botão de ajuda, sem poluir os cards principais.

## 2026-05-11 — Remoção da pílula Ativa no Painel da Temporada
- Arquivos alterados: `js/modules/temporadas.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Temporadas.
- Resumo do ajuste: removi a pílula visual de status `Ativa` do cabeçalho do Painel da Temporada, mantendo os botões de ajuda e finalização.
- Motivo: reduzir ruído visual no painel ativo, já que a aba e o contexto da tela deixam claro que a temporada está em andamento.
- Impacto esperado: painel mais limpo sem alterar status interno, cálculos, Firestore, histórico ou regras de temporada.

## 2026-05-11 — Ajuda contextual no Painel da Temporada
- Arquivos alterados: `js/modules/temporadas.js`, `css/modules/temporadas.css`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Temporadas.
- Resumo do ajuste: adicionei o botão `? Como ler` no cabeçalho do Painel da Temporada ativa, abrindo um modal contextual com resumo da temporada e explicação de Progresso, Score, Ritmo Atual, Chance de Falha, Atual e Meta.
- Contexto: os textos mudam conforme objetivo, build, dificuldade e duração da temporada ativa, mantendo linguagem simples e sem alterar cálculos, snapshots, IA, criação de temporada ou estrutura Firestore.
- Impacto esperado: permitir que a usuária entenda os indicadores diretamente no painel, sem sair da tela e sem depender de preenchimento manual.

## 2026-05-11 — Temporadas Fase 4 baseline e meta automática
- Arquivos alterados: `js/modules/temporadas.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Temporadas.
- Resumo do ajuste: implementei cálculo de baseline real no fluxo `Nova Temporada` usando pedidos do tenant, excluindo cancelados, normalizando datas, valores, cliente e telefone, e calculando faturamento, pedidos, ticket médio, dias ativos, clientes recorrentes e taxa de recompra para os últimos 30 ou 90 dias.
- Metas: adicionei cálculo de meta automática por objetivo e dificuldade, cálculo de risco inicial para meta fixa, exibição de baseline, meta calculada/fixa, risco inicial e confiabilidade no resumo final, e salvamento dos campos de baseline e `calculatedTargetValue` no documento `seasons`.
- Escopo: não implementei score completo, snapshots, painel avançado, resultado final, IA, gráficos complexos ou alertas inteligentes.
- Impacto esperado: permitir iniciar temporadas com ponto de partida real e meta calculada de forma auditável, mantendo isolamento por tenant e sem inventar dados.

## 2026-05-11 — Temporadas Fase 3 fluxo Nova Temporada
- Arquivos alterados: `js/modules/temporadas.js`, `css/modules/temporadas.css`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Temporadas.
- Resumo do ajuste: implementei o fluxo `Nova Temporada` em modal mobile-friendly com etapas para objetivo, duração, tipo de meta, dificuldade, build operacional e resumo final, salvando a temporada como `active` em `tenants/{tenantId}/seasons` via wrapper `DB`.
- Regras implementadas: bloqueio de criação quando já existe temporada ativa, exigência de valor para meta fixa, cálculo de `startDate` e `endDate` conforme duração, salvamento de `targetMode`, `targetValue`, `targetMetric`, `currentScore: 0`, `currentStatus: pending`, `riskLevel: unknown`, `progressPercent: 0` e `startedAt`.
- Escopo: não implementei cálculo automático real de meta, baseline, score real, snapshots, dashboard avançado, resultado final, IA, gráficos complexos ou alertas inteligentes.
- Impacto esperado: permitir que a usuária configure e inicie uma temporada real com dados mínimos, mantendo isolamento por tenant e preparando a Fase 4.

## 2026-05-11 — Temporadas Fase 2 coleção seasons
- Arquivos alterados: `js/modules/temporadas.js`, `css/modules/temporadas.css`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Temporadas.
- Resumo do ajuste: implementei a base funcional da coleção `seasons` no módulo Temporadas, com carregamento por tenant via `DB.getAll('seasons')`, identificação de temporada ativa, listagem de histórico `finished`/`abandoned`, funções base para criar, listar, carregar ativa e atualizar temporadas, além das travas para impedir múltiplas `active` e bloquear edição de temporadas `active`, `finished` ou `abandoned`.
- Interface: a tela agora mostra card real da temporada ativa quando existir, estado vazio quando não existir e histórico de temporadas finalizadas/abandonadas sem criar dados fake.
- Escopo: não implementei fluxo completo de criação em etapas, cálculo automático de meta, score real, snapshots, resultado final, IA, gráficos ou alertas inteligentes.
- Impacto esperado: preparar a base real de dados da V1 mantendo isolamento por tenant e sem alterar módulos existentes.

## 2026-05-11 — Temporadas Fase 1 base do módulo
- Arquivos alterados: `admin.html`, `js/modules/temporadas.js`, `css/modules/temporadas.css`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Temporadas.
- Resumo do ajuste: implementei a base real da Fase 1 do módulo Temporadas, adicionando o item no menu de Crescimento, registrando a rota `crescimento/temporadas`, carregando o tenant atual via `Auth.getTenantId()` e renderizando uma tela inicial vazia com título, subtítulo, botão `Nova Temporada`, card de nenhuma temporada ativa e espaço para histórico futuro.
- Escopo: não implementei criação de temporada, coleção `seasons`, score, metas, snapshots, resultado final, IA, gráficos complexos ou lógica fake de dados.
- Impacto esperado: permitir acessar uma tela funcional e leve de Temporadas, pronta para a Fase 2 sem quebrar Plano de Voo, Performance ou o menu Crescimento.

## 2026-05-11 — Plano de implementação V1 de Temporadas
- Arquivos alterados: `IMPLEMENTATION_PLAN_SEASONS_V1.md`, `AI_CHANGELOG.md`.
- Módulo afetado: Temporadas / Missões Operacionais.
- Resumo do ajuste: criei o plano técnico incremental para implementação da V1 do módulo Temporadas, organizando escopo, estrutura sugerida, fases de implementação, dados permitidos, estratégia de performance, regras multi-tenant, fora de escopo e critérios de sucesso.
- Referências usadas: `DATA_MAP_FOR_SEASONS.md`, `SEASONS_SPEC.md`, `SEASON_SCORING_SYSTEM.md`, `SEASONS_ARCHITECTURE.md` e `SEASONS_UI_FLOW.md`.
- Escopo: documentação apenas; não foram implementadas telas, backend, CSS, rotas reais, coleções reais ou alterações em código funcional.
- Impacto esperado: orientar uma implementação futura segura e incremental, reduzindo risco de quebrar módulos existentes ou usar métricas pouco confiáveis na V1.

## 2026-05-11 — UX e fluxo visual de Temporadas
- Arquivos alterados: `SEASONS_UI_FLOW.md`, `AI_CHANGELOG.md`.
- Módulo afetado: Temporadas / Missões Operacionais.
- Resumo do ajuste: criei o documento de UX, fluxo e estrutura visual do módulo Temporadas, definindo posicionamento no menu, telas principais, fluxo de criação, Central de Temporadas, Painel da Temporada, Resultado Final, linguagem, direção visual, responsividade e fora de escopo da V1.
- Referências usadas: `DATA_MAP_FOR_SEASONS.md`, `SEASONS_SPEC.md`, `SEASON_SCORING_SYSTEM.md` e `SEASONS_ARCHITECTURE.md`.
- Escopo: documentação apenas; não foram criados HTML, CSS, interface, backend, rotas ou alterações em código funcional.
- Impacto esperado: orientar a futura implementação visual do módulo com experiência tática, adulta e baseada em dados reais, sem gamificação infantil.

## 2026-05-11 — Arquitetura técnica de Temporadas
- Arquivos alterados: `SEASONS_ARCHITECTURE.md`, `AI_CHANGELOG.md`.
- Módulo afetado: Temporadas / Missões Operacionais.
- Resumo do ajuste: criei o documento técnico de arquitetura do módulo Temporadas, definindo coleções Firestore sugeridas, fontes de dados, normalização, baseline, tipos de atualização, score geral, alertas, lifecycle, performance, multi-tenant, fora de escopo da V1 e preparação futura.
- Referências usadas: `DATA_MAP_FOR_SEASONS.md`, `SEASONS_SPEC.md` e `SEASON_SCORING_SYSTEM.md`.
- Escopo: documentação apenas; não foram alterados código funcional, interface, backend, rotas, coleções reais ou regras de banco.
- Impacto esperado: estabelecer a fundação técnica para implementar Temporadas de forma segura, performática e compatível com os dados reais do BocaFood.

## 2026-05-11 — Sistema de scoring das Temporadas
- Arquivos alterados: `SEASON_SCORING_SYSTEM.md`, `AI_CHANGELOG.md`.
- Módulo afetado: Temporadas / Missões Operacionais.
- Resumo do ajuste: criei o documento técnico do sistema de pontuação e cálculo das Temporadas, definindo tipos de meta, matriz de métricas por objetivo, pesos, regras de progresso, risco, evolução positiva, vitória, builds operacionais, status, resultado final e atualização das análises.
- Referências usadas: `DATA_MAP_FOR_SEASONS.md` e `SEASONS_SPEC.md`.
- Escopo: documentação apenas; não foram alterados código, interface, backend, rotas, coleções ou regras funcionais.
- Impacto esperado: orientar a implementação futura do cérebro lógico das Temporadas com regras claras, auditáveis e compatíveis com os dados reais disponíveis no BocaFood.

## 2026-05-11 — Especificação inicial de Temporadas
- Arquivos alterados: `SEASONS_SPEC.md`, `AI_CHANGELOG.md`.
- Módulo afetado: Temporadas / Missões Operacionais.
- Resumo do ajuste: criei a especificação técnica inicial do módulo de Temporadas antes de qualquer implementação, usando `DATA_MAP_FOR_SEASONS.md` como base para separar métricas por confiança, fontes de dados, regras de criação, duração, dificuldade, builds operacionais, snapshots e resultado final.
- Escopo: documentação apenas; não foram criadas telas, coleções, regras de banco, rotas ou alterações em código funcional.
- Impacto esperado: orientar a implementação futura do módulo com limites claros para a V1 e reduzir risco de usar métricas ainda pouco confiáveis, como estoque real, desperdício real, capacidade real de produção e custo exato por venda.

## 2026-05-10 — Preview novo do template premium da Loja Online
- Arquivos alterados: `preview-template-premium.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Loja Online, Avaliações, Programa de Pontos, Promoções e Upsell.
- Resumo do ajuste: criei um preview visual novo e separado do template público atual, com composição mobile premium, capa forte, card de identidade sobreposto, chips operacionais, programa de pontos, busca, categorias em pills, banner promocional, produto destaque, lista de produtos, avaliações e carrinho fixo inferior.
- Refinamento visual: corrigi a primeira dobra para manter apenas a logo sobreposta ao banner, deixando nome/slogan/informações dentro do card branco; elevei o card do Programa de Pontos com visual mais premium, regras resumidas e maior hierarquia; removi o bloco "Combine com" da home e deixei Upsell reservado para detalhe do produto/checkout.
- Refinamento de leveza: simplifiquei o card do Programa de Pontos para um bloco claro/off-white com detalhe gráfico discreto e hover suave; removi elementos gráficos do menu de categorias, deixando apenas pills de texto.
- Refinamento premium: substituí o ícone circular do Programa de Pontos por um elemento gráfico de recompensa/progresso, reduzi pesos tipográficos do hero e redesenhei as pílulas da primeira dobra em três blocos compactos com ícones discretos para caberem organizadas na primeira tela.
- Refinamento de conversão: transformei o card do Programa de Pontos em uma CTA para cadastro, com copy focada em benefício e botão "Quero ganhar pontos", removendo a aparência técnica de regras/pontos como foco principal.
- Refinamento da CTA de fidelidade: removi saldo de pontos do card para o estado de usuário sem cadastro e substituí o elemento gráfico anterior por um ticket discreto de desconto, mantendo a chamada focada em cadastro gratuito e vantagem futura.
- Refinamento mobile-first: compactei a primeira dobra do preview, reduzindo capa, logo, espaçamentos e pesos visuais; inseri ações rápidas (`Promoções`, `Clube`, `Mais pedidos`), antecipei busca/categorias, transformei o clube em mini banner e reduzi altura de promoção/destaque para aproximar o cliente dos produtos mais cedo.
- Refinamento de conversão mobile: removi as ações rápidas e a busca duplicada abaixo do card principal; mantive intacta a área superior até `Mais informações`; reorganizei a sequência para chips, categorias, programa de pontos, promoção, destaque e lista de produtos, com chips/categorias mais leves e imagens de comida mais apetitosas nos blocos promocionais.
- Ajuste de hierarquia: movi o menu horizontal de categorias para ficar imediatamente antes da seção `Todos os produtos`, deixando a navegação de categorias ligada à lista principal.
- Ajuste dos chips da primeira dobra: removi os símbolos das pílulas de status/serviço e deixei o chip de status preparado para cor semântica, com aberto em verde e fechado em vermelho.
- Ajuste de sequência mobile: reposicionei o banner promocional para aparecer logo abaixo das pílulas da primeira dobra e antes do mini banner de Programa de Pontos.
- Refinamento das pílulas: apliquei acabamento premium com gradiente leve, blur, sombra interna/discreta e hover com elevação suave, preservando aberto em verde e fechado em vermelho.
- Ajuste fino: reforcei o degradê escuro apenas na lateral esquerda/base do banner promocional para melhorar leitura sem escurecer toda a comida; suavizei o destaque do chip `Aberto` para ficar mais elegante.
- Refinamento do card de pontos: substituí o ticket por estrelas decorativas discretas e melhorei o acabamento do mini banner com fundo mais suave, borda quente e CTA mais integrado.
- Ajuste de status: substituí as pílulas `Aberto / Entrega / Retirada` por uma linha textual mais leve, separada por traços delicados, mantendo aberto em verde e fechado em vermelho.
- Ajuste de alinhamento: movi a linha `Aberto · Entrega · Retirada` para dentro do bloco de texto da loja, acima de `Mais informações`, e troquei os separadores para pontos no mesmo padrão da linha de nota/tempo/mínimo.
- Rodapé do preview: inseri um rodapé mobile no fim da loja com marca, texto institucional curto, links de horários/endereço/contato e assinatura discreta do BocaFood.
- Listagem por categoria: alterei o preview para exibir todos os produtos na mesma página, agrupados por categoria; o menu horizontal agora rola até a respectiva categoria em vez de filtrar/esconder produtos.
- Divisor do topo: adicionei uma linha/sombra sutil abaixo de `Mais informações`, alinhada ao bloco de texto da loja, para indicar o fim da área principal.
- Acesso do cliente: inseri no topo do preview um botão `Entrar / Cadastre-se` com avatar compacto, integrado aos botões flutuantes.
- Banner promocional: adicionei CTA `Ver promoções` dentro do banner de promoção.
- Ajuste de posição: subi levemente o banner promocional reduzindo o espaçamento entre o topo da loja e o conteúdo.
- Redes sociais no rodapé: adicionei ícones com links para Instagram, Facebook, TikTok e WhatsApp no rodapé do preview.
- Compatibilidade: o arquivo é um preview estático para validação visual no computador; não altera `index.html`, Firebase, carrinho atual, pedidos, WhatsApp ou lógica de produção.
- Campos considerados no desenho: identidade e mídia do `config/template`, categorias/produtos, `config/pontos_program`, promoções ativas, regras de upsell e avaliações aprovadas.

## 2026-05-10 — Template público mobile alinhado ao mockup BocaFood
- Arquivos alterados: `index.html`, `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Loja Online > Template da loja e template público mobile.
- Resumo do ajuste: atualizei a experiência mobile usando o mockup `template_mobilebocafood.png` como referência direta, com hero de capa, ações flutuantes, logo sobreposto, resumo compacto, chips alinhados, bloco de fidelidade, categorias horizontais com ícones, destaque único, lista de produtos em cards e carrinho fixo inferior.
- Refinamento adicional: aproximei o mobile do mockup com card principal em composição horizontal, logo grande à esquerda, hierarquia mais premium, sombras mais suaves, banner promocional visual opcional e categorias com elemento gráfico por imagem.
- Refinamento de leveza: reduzi sombras/pesos visuais, ajustei o produto destaque para card único horizontal no mobile e conectei o card de fidelidade ao `config/pontos_program` para aparecer quando o programa de pontos estiver ativo.
- Primeira dobra revisada: aumentei a presença da capa, reposicionei o card branco, a logo sobreposta, os botões flutuantes e os chips para seguir mais de perto a composição do mockup mobile.
- Correção estrutural mobile: recalibrei proporções da primeira dobra para o mockup, reduzi categorias para pills leves com scroll, transformei chips da loja em linha rolável e deixei a busca discreta. A lista de produtos voltou ao visual anterior aprovado.
- Ajuste isolado da primeira dobra: aumentei a altura real da capa, reposicionei o card branco sobreposto, ampliei a logo com borda/sombra, refinei a hierarquia do nome/metadados e corrigi os três chips para uma única linha horizontal rolável sem quebra.
- Primeira dobra recomposta como mockup: a capa, o card branco e a logo agora formam uma composição única sobreposta; os chips foram mantidos como pills horizontais sem grid/empilhamento.
- Ajuste fino: logo da primeira dobra deslocada para a direita para ficar mais próxima do bloco de nome da loja.
- Campos novos salvos em `config/template`: `verifiedBadgeEnabled/storeVerified`, `loyaltyEnabled/pointsProgramEnabled`, `loyaltyProgramName/pointsProgramName`, `loyaltyShortText/loyaltyText`, `loyaltyButtonText`, `cartButtonText` e `mainButtonText` exposto no formulário.
- Campos novos/expandidos também salvos em `config/template`: `mobilePromoBannerEnabled/promotionalBannerEnabled`, `mobilePromoBannerImageUrl/promoBannerImageUrl/promotionalBannerImageUrl`, `mobilePromoBannerBadge/promoBannerBadge`, `mobilePromoBannerTitle/promoBannerTitle`, `mobilePromoBannerText/promoBannerSubtitle` e `mobilePromoBannerButtonText/promoBannerButtonText`.
- Campos novos nas categorias, editáveis também em Loja Online > Template da loja > Vitrine > Menu de categorias: `icon/emoji/symbol`, `graphicUrl/imageUrl/iconUrl/categoryGraphicUrl` e metadados do upload quando houver imagem otimizada.
- Textos/traduções adicionados nos 5 idiomas: `openNow`, `deliveryFrom`, `loyaltyClub`, `loyaltyDefaultText`, `viewMyPoints`, `allCategories`, `mostOrdered`, `combos`, `viewDetailsCta`, `allProducts`, `sortLabel`, `viewOrder`, `timeLabel`, `paymentMethodLabel`, `customerData`, `localPickup`, `finishOrder`, `pointsShort` e placeholder plural de busca (`searchProduct`).
- Compatibilidade: mantive as funções atuais de carrinho, produto, variações/adicionais, cupom, entrega/retirada, totalização e envio final para WhatsApp; os novos blocos têm fallback seguro e somem quando não há dado.
- Validação realizada: `node --check js/modules/catalogo.js`, `node --check js/modules/loja_online.js` e compilação dos scripts inline do `index.html` com `vm.Script`.

## 2026-05-10 — Avaliações movidas para Loja Online
- Arquivos alterados: `admin.html`, `js/modules/loja_online.js`, `js/modules/catalogo.js`, `js/modules/pedidos.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Loja Online > Avaliações e Cardápio.
- Resumo do ajuste: movi a navegação de `Avaliações` de Cardápio para Loja Online e habilitei a rota `loja-online/avaliacoes`.
- Compatibilidade: a tela continua reaproveitando a implementação existente de avaliações, sem alterar dados, Firebase, moderação ou lógica; a rota antiga `catalogo/avaliacoes` segue registrada como fallback.
- Validação realizada: `node --check js/modules/loja_online.js`, `node --check js/modules/catalogo.js` e `node --check js/modules/pedidos.js`.

## 2026-05-10 — Template da loja dividido em subtabs
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Loja Online > Template da loja.
- Resumo do ajuste: criei subtabs internas para agrupar cards relacionados em `Identidade`, `Vitrine`, `Operação`, `Atendimento`, `Checkout` e `Textos`.
- Compatibilidade: mantive todos os cards, campos, IDs, uploads, toggles, handlers, preview e salvamento existentes; a mudança é apenas de organização visual.
- Validação realizada: `node --check js/modules/catalogo.js`.

## 2026-05-10 — Módulo Loja Online criado
- Arquivos alterados: `admin.html`, `js/modules/loja_online.js`, `js/modules/catalogo.js`, `js/modules/dashboard.js`, `js/modules/operacao.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Loja Online, Cardápio, Dashboard e Operação.
- Resumo do ajuste: criei o módulo separado `Loja Online`, movendo a navegação de `Template da loja` e `SEO da loja` para esse novo grupo no menu lateral e removendo essas opções da lista interna de abas do Cardápio.
- Compatibilidade: as telas continuam reaproveitando a implementação existente de `Modules.Catalogo`, preservando campos, IDs, Firebase, salvamento, upload, SEO e preview; as rotas antigas `catalogo/template` e `catalogo/seo` seguem registradas como fallback.
- Validação realizada: `node --check js/modules/loja_online.js`, `node --check js/modules/catalogo.js`, `node --check js/modules/dashboard.js` e `node --check js/modules/operacao.js`.

## 2026-05-10 — Resumos removidos do Template da loja
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Cardápio > Template da loja.
- Resumo do ajuste: removi visualmente os cards laterais de resumo inseridos nos cards do Template e deixei os blocos de configuração ocuparem a largura principal.
- Compatibilidade: mantive todos os campos, IDs, toggles, seletores, preview e salvamento existentes; o botão de adicionar zona foi preservado na área principal.
- Validação realizada: `node --check js/modules/catalogo.js`.

## 2026-05-10 — WhatsApp e Mais informações refinados
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Cardápio > Template da loja > WhatsApp da loja e Mais informações.
- Resumo do ajuste: reorganizei os dois cards com resumo lateral, chips de preenchimento e blocos internos para botão flutuante, apresentação da loja e políticas.
- Compatibilidade: mantive os mesmos IDs `tpl-whatsapp-tooltip`, `tpl-whatsapp-message`, `tpl-about`, `tpl-important`, `tpl-delivery-policy`, `tpl-cancel-policy` e `tpl-footer`.
- Validação realizada: `node --check js/modules/catalogo.js`.

## 2026-05-10 — Finalização do pedido refinado
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Cardápio > Template da loja > Finalização do pedido.
- Resumo do ajuste: reorganizei o card com resumo lateral, chips de estado e bloco de opções do checkout.
- Compatibilidade: mantive os mesmos toggles `tpl-allow-note` e `tpl-allow-coupon` e o salvamento do checkout.
- Validação realizada: `node --check js/modules/catalogo.js`.

## 2026-05-10 — Pagamentos exibidos na loja refinado
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Cardápio > Template da loja > Pagamentos exibidos na loja.
- Resumo do ajuste: reorganizei o card com resumo lateral, chips de formas cadastradas/ativas, bloco de formas disponíveis e bloco de observação geral.
- Compatibilidade: mantive os métodos vindos do Financeiro, os atributos de coleta, toggles por método, instruções adicionais e `tpl-payment-note`.
- Validação realizada: `node --check js/modules/catalogo.js`.

## 2026-05-10 — Endereço refinado
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Cardápio > Template da loja > Endereço.
- Resumo do ajuste: reorganizei o card com resumo lateral, chips de cidade/código postal/país e blocos separados para localização principal e cidade/região.
- Compatibilidade: mantive os mesmos IDs e o salvamento do endereço público da loja.
- Validação realizada: `node --check js/modules/catalogo.js`.

## 2026-05-10 — Contato refinado
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Cardápio > Template da loja > Contato.
- Resumo do ajuste: reorganizei o card com resumo lateral, chips de canais, blocos para atendimento, redes sociais e exibição no rodapé.
- Compatibilidade: mantive os mesmos IDs de telefone, WhatsApp, e-mail, redes sociais e toggles do rodapé.
- Validação realizada: `node --check js/modules/catalogo.js`.

## 2026-05-10 — Horários e status refinado
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Cardápio > Template da loja > Horários e status.
- Resumo do ajuste: reorganizei o card com resumo lateral, chips de modo/aviso, bloco de status público, grade semanal e aviso de horário especial.
- Compatibilidade: mantive os mesmos IDs dos horários por dia, segundo período, status manual/automático e salvamento.
- Validação realizada: `node --check js/modules/catalogo.js`.

## 2026-05-10 — Zonas de entrega refinado
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Cardápio > Template da loja > Zonas de entrega.
- Resumo do ajuste: reorganizei o card com resumo lateral, chips de zonas ativas/CEPs, botão principal de adicionar zona e cabeçalho mais informativo em cada zona.
- Compatibilidade: mantive os mesmos IDs, coleta de dados, validação de CEP duplicado, ativação, exclusão e salvamento.
- Validação realizada: `node --check js/modules/catalogo.js`.

## 2026-05-10 — Entrega e retirada refinado
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Cardápio > Template da loja > Entrega e retirada.
- Resumo do ajuste: reorganizei o card com resumo operacional lateral, chips de status, modos de atendimento, capacidade/prazos e blocos paralelos para entrega e retirada.
- Compatibilidade: mantive os mesmos IDs, campos, textos, regras de exibição e salvamento do template público.
- Validação realizada: `node --check js/modules/catalogo.js`.

## 2026-05-10 — Destaques da vitrine refinado
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Cardápio > Template da loja > Destaques da vitrine.
- Resumo do ajuste: reorganizei o card com resumo lateral, chips de estado e seleção de produtos por posição, deixando mais claro quando a vitrine usa produtos marcados no cadastro ou escolha manual.
- Compatibilidade: mantive os mesmos IDs dos seletores, o toggle existente e o salvamento de `featuredProductIds`/`highlightProductIds`/`showcaseProductIds`.
- Validação realizada: `node --check js/modules/catalogo.js`.

## 2026-05-10 — Destaque comercial do topo refinado
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Cardápio > Template da loja > Destaque comercial do topo.
- Resumo do ajuste: reorganizei o card com resumo lateral, chips de estado e configuração principal agrupada para tipo de destaque, vínculos e textos do CTA.
- Compatibilidade: mantive os mesmos IDs, pickers, vínculos com produtos/cupons/promoções e fluxo de salvamento.
- Validação realizada: `node --check js/modules/catalogo.js`.

## 2026-05-10 — Topo da loja refinado
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Cardápio > Template da loja > Topo da loja.
- Resumo do ajuste: reorganizei o card com resumo lateral, chips de estado e grupos claros para banner promocional, imagem de capa e elementos visíveis.
- Compatibilidade: mantive os IDs e corrigi o comportamento visual para o card de capa continuar acessível mesmo quando a capa estiver desativada.
- Validação realizada: `node --check js/modules/catalogo.js`.

## 2026-05-10 — Card principal da loja refinado
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Cardápio > Template da loja > Card principal da loja.
- Resumo do ajuste: reorganizei o card com resumo lateral, chips de estado e grupos de controles para identidade, localização/status e entrega/retirada.
- Compatibilidade: mantive os mesmos toggles, IDs e fluxo de salvamento do template público.
- Validação realizada: `node --check js/modules/catalogo.js`.

## 2026-05-10 — Template da loja sem KPIs
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Cardápio > Template da loja.
- Resumo do ajuste: removi a linha de cards/KPIs do topo do Template da loja, mantendo cabeçalho, chips, campos e salvamento intactos.
- Validação realizada: `node --check js/modules/catalogo.js`.

## 2026-05-10 — Identidade visual do Template refinada
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Cardápio > Template da loja > Identidade visual.
- Resumo do ajuste: dividi o card em blocos menores para `Dados públicos`, `Cor da marca` e `Arquivos da marca`, mantendo os mesmos campos e IDs de salvamento.
- Visual: reduzi a altura da prévia da logo, melhorei hierarquia, espaçamento e responsividade do card no padrão de `Cardápio > Produtos`.
- Validação realizada: `node --check js/modules/catalogo.js`.

## 2026-05-10 — Template da loja no padrão Catálogo Produtos
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Cardápio > Template da loja.
- Resumo do ajuste: reorganizei a tela para seguir a estrutura visual de `Cardápio > Produtos`, com cabeçalho compacto, chips de resumo, KPIs com hover e botão primário no mesmo padrão.
- Organização: os campos foram agrupados em blocos lógicos de identidade, card principal, topo, destaques, entrega/retirada, zonas, horários, contato, endereço, pagamentos, finalização e textos informativos.
- Visual: refinei cards internos, bordas, sombras, radius, botões, toggles, checkboxes, pesos de fonte e removi bloco vazio no checkout sem alterar IDs, Firebase ou regras de salvamento.
- Validação realizada: `node --check js/modules/catalogo.js`.

## 2026-05-10 — Pedidos Clientes com modais no padrão Produtos
- Arquivos alterados: `js/modules/pedidos.js`, `js/modules/clientes.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Pedidos > Clientes.
- Resumo do ajuste: completei a padronização da aba Clientes usando `Cardápio > Produtos` como referência direta, com ação principal no cabeçalho, filtros no mesmo grid, chips de resumo e indicação de página.
- Modais: atualizei o modal compartilhado de criar/editar cliente para usar cards brancos, sombra premium, campos, labels, botões, rodapé e largura no mesmo padrão visual de Produtos.
- Compatibilidade: mantive busca, filtros, paginação, perfil, histórico, criação, edição e exclusão sem alterar Firebase, coleções ou regras de negócio.
- Validação realizada: `node --check js/modules/pedidos.js` e `node --check js/modules/clientes.js`.

## 2026-05-10 — Pedidos ativos da Cozinha em tabela
- Arquivos alterados: `js/modules/pedidos.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Pedidos > Cozinha.
- Resumo do ajuste: apliquei na lista `Pedidos ativos` o mesmo padrão usado na `Lista de pedidos`, convertendo os cards para tabela no padrão de `Cardápio > Produtos`.
- Listagem: sem foto/ícone grande e sem listagem de produtos na linha; mantém cliente, identificador/data, canal, status, tipo, horário/endereço, total, ações e paginação.
- Validação realizada: `node --check js/modules/pedidos.js`.

## 2026-05-10 — Lista de Pedidos sem foto e sem produtos
- Arquivos alterados: `js/modules/pedidos.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Pedidos > Pedidos.
- Resumo do ajuste: removi o bloco visual tipo foto/thumbnail e a listagem de produtos da célula principal da tabela de pedidos.
- Listagem: a coluna Pedido agora mostra cliente e identificador/data do pedido, mantendo status, canal, tipo, total, avaliação, ações e paginação.
- Validação realizada: `node --check js/modules/pedidos.js`.

## 2026-05-10 — Lista de Pedidos fiel ao Catálogo Produtos
- Arquivos alterados: `js/modules/pedidos.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Pedidos > Pedidos.
- Resumo do ajuste: converti a `Lista de pedidos` de cards para tabela no padrão real de `Cardápio > Produtos`.
- Listagem: cabeçalho branco uppercase, checkbox inicial, célula principal com ícone 48px, chips com borda, linhas com hover `#FBF8F2`, ações iconográficas 30px e paginação dentro do mesmo card da tabela.
- Compatibilidade: mantive busca, filtros, paginação, abertura de detalhe, WhatsApp, vínculos com cliente e avaliações.
- Validação realizada: `node --check js/modules/pedidos.js`.

## 2026-05-10 — Pedidos Clientes fiel ao Catálogo Produtos
- Arquivos alterados: `js/modules/pedidos.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Pedidos > Clientes.
- Resumo do ajuste: refinei a aba Clientes para copiar com mais fidelidade a estrutura visual de `Catálogo > Produtos`, principalmente a tabela/listagem principal.
- Listagem: cabeçalho branco, `border-collapse: separate`, checkbox inicial, avatar 48px no padrão de célula de produto, chips com borda, linhas com hover `#FBF8F2`, ações iconográficas 30px e paginação no mesmo padrão.
- Compatibilidade: mantive busca, filtros, paginação, perfil, histórico e edição de cliente sem alterar dados ou coleções.
- Validação realizada: `node --check js/modules/pedidos.js`.

## 2026-05-10 — Modo Cozinha com fundo branco
- Arquivos alterados: `js/modules/pedidos.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Pedidos > Cozinha > Modo cozinha.
- Resumo do ajuste: alterei o fundo da tela do modo cozinha e do modal/drawer de detalhe para branco, preservando as cores dos cards por status.
- Compatibilidade: mantive kanban, cards, detalhe, WhatsApp, checklist e atualização de status sem alterar lógica.
- Validação realizada: `node --check js/modules/pedidos.js`.

## 2026-05-10 — Paginação de Pedidos no padrão Catálogo Produtos
- Arquivos alterados: `js/modules/pedidos.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Pedidos > Cozinha, Pedidos > Pedidos e Pedidos > Clientes.
- Resumo do ajuste: apliquei a paginação copiada do padrão real de `Cardápio > Produtos`, com texto `Mostrando X a Y de Z`, seletor `N / pág.`, botões `Anterior`/`Próxima` e indicador com barra vermelha.
- Compatibilidade: mantive busca, filtros, ações, abertura de detalhes, histórico, edição e fluxo de status; a página volta para 1 ao alterar filtros.
- Validação realizada: `node --check js/modules/pedidos.js`.

## 2026-05-10 — Aba Clientes de Pedidos no padrão premium
- Arquivos alterados: `js/modules/pedidos.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Pedidos > Clientes.
- Resumo do ajuste: alinhei a aba Clientes ao padrão visual aplicado em Cardápio > Produtos e nas telas recentes de Pedidos, com menor padding externo, KPIs mais equilibrados, filtros em card e listagem principal em tabela premium.
- Listagem: substitui os cards soltos por tabela com cabeçalho uppercase, avatar/iniciais, chips de segmento, dados de contato, total, último pedido, ações discretas e paginação conectada.
- Modais: refinei o perfil do cliente e criei histórico no padrão visual atual, preservando vínculos com pedidos, avaliações, WhatsApp e filtros.
- Validação realizada: `node --check js/modules/pedidos.js`.

## 2026-05-10 — Modal do Modo Cozinha refinado
- Arquivos alterados: `js/modules/pedidos.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Pedidos > Cozinha > Modo cozinha.
- Resumo do ajuste: refinei o detalhe aberto dentro do modo cozinha como drawer/modal lateral premium, com fundo de foco, cabeçalho por status e cards internos mais organizados.
- Visual: adicionei backdrop, radius, sombra mais sofisticada, chips de status/tipo, progresso do checklist e melhor hierarquia para dados do pedido.
- Compatibilidade: mantive salvar status, checklist, WhatsApp, fechamento do detalhe e atualização do kanban sem alterar lógica ou dados.
- Validação realizada: `node --check js/modules/pedidos.js`.

## 2026-05-10 — Modo Cozinha com cards por status
- Arquivos alterados: `js/modules/pedidos.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Pedidos > Cozinha > Modo cozinha.
- Resumo do ajuste: melhorei o modo cozinha em tela cheia com resumo operacional no topo, colunas mais largas e leitura mais clara por etapa.
- Cards: cada card agora recebe fundo suave, faixa lateral e destaque de status com cor correspondente ao dado/status apresentado, além de progresso do checklist.
- Compatibilidade: mantive arrastar e soltar, abertura de detalhes, WhatsApp, cancelamento, checklist e atualização de status sem alterar lógica ou coleções.
- Validação realizada: `node --check js/modules/pedidos.js`.

## 2026-05-10 — Modais da aba Pedidos refinados
- Arquivos alterados: `js/modules/pedidos.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Pedidos > Pedidos.
- Resumo do ajuste: removi o cabeçalho antigo `Pedidos` com o texto descritivo do módulo e refinei os modais/ações da aba para seguir o padrão visual premium aplicado nas telas recentes.
- Modais: atualizei detalhe/WhatsApp, vínculo/cadastro de cliente e criação de pedido manual com bordas, sombras, radius, botões e hierarquia visual alinhados ao padrão de Cardápio > Produtos.
- Compatibilidade: mantive criação, edição/vínculo de cliente, WhatsApp, status, totais e cálculo do pedido sem alteração de lógica ou coleções.
- Validação realizada: `node --check js/modules/pedidos.js`.

## 2026-05-10 — Modais da Cozinha refinados
- Arquivos alterados: `js/modules/pedidos.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Pedidos > Cozinha.
- Resumo do ajuste: refinei o modo cozinha em tela cheia, o painel lateral de detalhe, o prompt de WhatsApp e o modal normal de detalhes para seguir o padrão visual premium aplicado no sistema.
- Visual: atualizei cabeçalhos, fundos, bordas, sombras, botões, cards internos, checklist e cards do kanban.
- Compatibilidade: mantive ações de status, WhatsApp, checklist, salvar, cancelar, arrastar pedidos e modo cozinha.
- Validação realizada: `node --check js/modules/pedidos.js`.

## 2026-05-10 — Pedidos Clientes no padrão Cardápio Produtos
- Arquivos alterados: `js/modules/pedidos.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Pedidos > Clientes.
- Resumo do ajuste: apliquei o mesmo padrão visual usado em Cardápio > Produtos, Pedidos > Cozinha e Pedidos > Pedidos, com cabeçalho leve, KPIs com hover, card de filtros, chips de resumo e listagem premium.
- Filtros: mantive busca, status, segmento e canal conectados à lógica existente e adicionei limpeza rápida dos filtros.
- Compatibilidade: preservei perfil completo, histórico, segmentação, edição, vínculo com pedidos e avaliações.
- Validação realizada: `node --check js/modules/pedidos.js`.

## 2026-05-10 — Pedidos Lista no padrão Cardápio Produtos
- Arquivos alterados: `js/modules/pedidos.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Pedidos > Pedidos.
- Resumo do ajuste: apliquei o mesmo padrão visual usado em Cardápio > Produtos e Pedidos > Cozinha, com cabeçalho leve, KPIs com hover, card de filtros, chips de resumo e listagem com sombra, borda e ações discretas.
- Filtros: mantive busca, status e canal conectados à lógica existente e adicionei limpeza rápida dos filtros.
- Compatibilidade: preservei abertura de detalhe, WhatsApp, vínculo de cliente, avaliações e filtros existentes.
- Validação realizada: `node --check js/modules/pedidos.js`.

## 2026-05-10 — Pedidos Cozinha no padrão Cardápio Produtos
- Arquivos alterados: `js/modules/pedidos.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Pedidos > Cozinha.
- Resumo do ajuste: atualizei a tela de cozinha para seguir o padrão visual de Cardápio > Produtos, com cabeçalho leve, KPIs com hover, card de filtros, chips de resumo e lista de pedidos com sombra, borda e ações mais discretas.
- Filtros: conectei busca, status e canal da cozinha aos filtros existentes, preservando a lista de pedidos ativos do cardápio.
- Compatibilidade: mantive ações de alarme, modo cozinha, novo pedido, detalhe e mudança rápida de status.
- Validação realizada: `node --check js/modules/pedidos.js`.

## 2026-05-10 — Correção do cenário no Dashboard
- Arquivos alterados: `js/modules/dashboard.js`, `AI_CHANGELOG.md`.
- Área afetada: Dashboard principal / Início.
- Resumo do ajuste: alinhei a leitura do cenário do Plano de Voo com a Performance, carregando todos os documentos de `flight_plan_month_scenarios` e resolvendo o cenário por mês, snapshot vinculado ou previsão salva do mês.
- Correção: o card `Plano de Voo e Performance` deixa de mostrar `Sem cenário do mês definido` quando já existe cenário/previsão vinculada.
- Validação realizada: `node --check js/modules/dashboard.js`.

## 2026-05-10 — Remoção do card Loja online do Início
- Arquivos alterados: `js/modules/dashboard.js`, `AI_CHANGELOG.md`.
- Área afetada: Dashboard principal / Início.
- Resumo do ajuste: removi o card lateral `Loja online` da tela Início, mantendo o status no cabeçalho/chips e o controle de ligar/desligar no topo do Admin.
- Validação realizada: `node --check js/modules/dashboard.js`.

## 2026-05-10 — Refinamento visual da tela Início
- Arquivos alterados: `js/modules/dashboard.js`, `AI_CHANGELOG.md`.
- Área afetada: Dashboard principal / Início.
- Resumo do ajuste: refinei design e layout para ficar mais alinhado às telas atuais do sistema, removendo o hero pesado e usando cabeçalho leve, KPIs no padrão de Cardápio/Performance e cards com densidade mais consistente.
- Onboarding: deixei o bloco mais compacto, com progresso visual e etapas menores para não dominar a tela.
- Responsividade: ajustei grids para evitar overflow e manter leitura em desktop e mobile.
- Validação realizada: `node --check js/modules/dashboard.js`.

## 2026-05-10 — Tela principal do sistema
- Arquivos alterados: `js/modules/dashboard.js`, `js/core/router.js`, `admin.html`, `AI_CHANGELOG.md`.
- Área afetada: tela inicial do Admin.
- Resumo do ajuste: criei a tela `Início` como dashboard principal do sistema, com saudação por horário, resumo de pedidos, vendas, financeiro, loja online, Plano de Voo e Performance.
- Plano de Voo/Performance: o dashboard usa o cenário do mês em `flight_plan_month_scenarios` e, quando necessário, resolve o resumo pela previsão salva em `flight_plans`.
- Onboarding: adicionei primeiros passos baseados em dados reais; o bloco desaparece automaticamente quando dados gerais, template, produtos, Plano de Voo e primeiro pedido estiverem concluídos.
- Navegação: adicionei `Início` como primeiro item do menu e alterei o fallback do router para `dashboard`.
- Validação realizada: `node --check js/modules/dashboard.js`, `node --check js/core/router.js` e parse dos scripts inline de `admin.html`.

## 2026-05-10 — Status da loja sem borda
- Arquivos alterados: `admin.html`, `AI_CHANGELOG.md`.
- Área afetada: cabeçalho do Admin.
- Resumo do ajuste: removi a borda da pílula de texto do status da loja online, mantendo a sombra e o clique no ícone de energia.
- Validação realizada: parse dos scripts inline de `admin.html`.

## 2026-05-10 — Controle da loja online mais compacto
- Arquivos alterados: `admin.html`, `AI_CHANGELOG.md`.
- Área afetada: cabeçalho do Admin.
- Resumo do ajuste: reduzi o tamanho do indicador e da pílula de status da loja online para deixar o topo mais elegante.
- Comportamento: a ação de ligar/desligar agora fica no botão com ícone de energia; a pílula ao lado funciona como status visual.
- Validação realizada: parse dos scripts inline de `admin.html`.

## 2026-05-10 — Botão de loja online com sinal externo
- Arquivos alterados: `admin.html`, `AI_CHANGELOG.md`.
- Área afetada: cabeçalho do Admin.
- Resumo do ajuste: separei o sinal de ligar/desligar da pílula do botão, criando um indicador externo com ícone de energia e ponto de status.
- Botão: a pílula agora exibe apenas `Loja ligada`, `Loja desligada` ou `Salvando...`, mantendo a ação de abrir/fechar a loja.
- Validação realizada: parse dos scripts inline de `admin.html`.

## 2026-05-10 — Configurações Geral mais refinada
- Arquivos alterados: `js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Configurações > Geral.
- Resumo do ajuste: refinei a hierarquia visual da aba, deixando a ficha do negócio mais premium com avatar integrado, resumo fiscal no próprio card e campos editáveis melhor organizados.
- Organização: agrupei `Contato` e `Padrões do sistema` em uma seção única, removi o card redundante de país fiscal e incorporei essa informação ao bloco fiscal.
- Compatibilidade: mantive os mesmos IDs, campos salvos e integração com avatar, telefone, padrões, documento fiscal e endereço fiscal.
- Validação realizada: `node --check js/modules/configuracoes.js`.

## 2026-05-10 — Topo sem botão extra de logout
- Arquivos alterados: `admin.html`, `AI_CHANGELOG.md`.
- Área afetada: cabeçalho do Admin.
- Resumo do ajuste: removi o botão de logout que ficava ao lado do chip de status da loja, deixando o topo mais limpo.
- Validação realizada: parse dos scripts inline de `admin.html`.

## 2026-05-10 — Topo sem avatar e botão da loja refinado
- Arquivos alterados: `admin.html`, `AI_CHANGELOG.md`.
- Área afetada: cabeçalho do Admin.
- Resumo do ajuste: removi o card de avatar/nome da loja do topo e mantive a identidade da loja apenas na lateral.
- Botão da loja: refinei o controle de ligar/desligar com visual em pill, indicador de status, hover premium e labels `Loja ligada` / `Loja desligada`.
- Compatibilidade: mantive o botão `Ver loja` e adicionei um botão discreto de sair para preservar a ação de logout.
- Validação realizada: parse dos scripts inline de `admin.html`.

## 2026-05-10 — Refinamento visual do campo Avatar
- Arquivos alterados: `js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Configurações > Geral.
- Resumo do ajuste: simplifiquei o campo `Avatar da conta`, reduzindo o peso visual do bloco, diminuindo a prévia e deixando upload/URL mais discretos.
- Validação realizada: `node --check js/modules/configuracoes.js`.

## 2026-05-10 — Avatar configurável em Geral
- Arquivos alterados: `js/modules/configuracoes.js`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Configurações > Geral; lateral do Admin.
- Resumo do ajuste: adicionei o campo `Avatar da conta` em `Identidade e cadastro`, com upload e URL editável.
- Tamanho recomendado: imagem quadrada de `500 x 500 px`; o sistema aceita JPG, PNG ou WebP e otimiza para WebP transparente até 150 KB.
- Integração: o avatar lateral e o avatar do topo agora priorizam `config/geral.avatarUrl`, com fallback para logo do template e demais fontes existentes.
- Validação realizada: `node --check js/modules/configuracoes.js` e parse dos scripts inline de `admin.html`.

## 2026-05-10 — Avatar lateral usando logo do Template
- Arquivos alterados: `admin.html`, `AI_CHANGELOG.md`.
- Área afetada: menu lateral e identidade do topo.
- Resumo do ajuste: conectei o avatar da loja ao `logoUrl` salvo em `config/template`, com fallback para `config/geral` e depois perfil do Master.
- Compatibilidade: quando não houver logo salvo, o avatar continua exibindo iniciais da loja.
- Validação realizada: parse dos scripts inline de `admin.html`.

## 2026-05-10 — Lateral mais premium
- Arquivos alterados: `admin.html`, `AI_CHANGELOG.md`.
- Área afetada: menu lateral do Admin.
- Resumo do ajuste: refinei o card de identidade da loja com mais presença visual, borda lateral vermelha, avatar maior, sombra premium e hierarquia tipográfica mais clara.
- Suporte: deixei o bloco `Precisa de ajuda?` mais discreto e sofisticado, com ícone em cápsula e contraste melhor.
- Validação realizada: parse dos scripts inline de `admin.html`.

## 2026-05-10 — Refinamento da lateral com identidade da loja
- Arquivos alterados: `admin.html`, `AI_CHANGELOG.md`.
- Área afetada: menu lateral do Admin.
- Resumo do ajuste: adicionei um card compacto com avatar/logo, nome da loja e plano acima do bloco de suporte.
- Suporte: refinei o card `Precisa de ajuda?` com iconografia do sistema e texto mais claro, mantendo a função informativa.
- Compatibilidade: usa dados já disponíveis no perfil sincronizado (`businessName/name`, `logoUrl/avatarUrl`, `plan`) e cai para iniciais quando não houver logo.
- Validação realizada: parse dos scripts inline de `admin.html`.

## 2026-05-10 — Refinamento do primeiro card de Configurações Geral
- Arquivos alterados: `js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Configurações > Geral.
- Resumo do ajuste: redesenhei o primeiro card como `Ficha do negócio`, com resumo visual à esquerda e campos editáveis organizados à direita.
- Compatibilidade: mantive os mesmos campos e IDs usados no salvamento, sem cortar dados que alimentam loja, fiscal, comunicação ou módulos internos.
- Validação realizada: `node --check js/modules/configuracoes.js`.

## 2026-05-10 — Remoção da aba Aparência
- Arquivos alterados: `js/modules/configuracoes.js`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Configurações.
- Resumo do ajuste: removi a aba `Aparência` do menu lateral e da navegação interna do módulo Configurações.
- Compatibilidade: não apaguei dados existentes de `config/aparencia`; apenas removi o acesso visual à tela.
- Validação realizada: `node --check js/modules/configuracoes.js` e parse dos scripts inline de `admin.html`.

## 2026-05-10 — Configurações Plano no lugar de Usuários
- Arquivos alterados: `js/modules/configuracoes.js`, `admin.html`, `server.rb`, `AI_CHANGELOG.md`.
- Módulo afetado: Configurações.
- Resumo do ajuste: removi a aba `Usuários / permissões` do menu e do módulo Configurações e criei a tela `Plano`.
- Tela nova: exibe plano atual, status da conta, ciclo, renovação, papel de acesso, país fiscal, status de cobrança, fim do teste, recursos e limites quando esses dados vierem do Master.
- Preparação Master: deixei `system_tenants` pronto para receber `billingStatus`, `billingCycle`, `renewalDate`, `nextBillingAt`, `trialEndsAt`, `features`, `planFeatures` e `planLimits`.
- Compatibilidade: não apaguei dados existentes de `config/usuarios`; apenas removi a tela/rota do Admin.
- Validação realizada: `node --check js/modules/configuracoes.js`, parse dos scripts inline de `admin.html` e `ruby -c server.rb`.

## 2026-05-10 — Remoção do aviso Não editar aqui
- Arquivos alterados: `js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Configurações > Usuários / permissões.
- Resumo do ajuste: removi o bloco `Não editar aqui` e deixei a tela focada nos cards de acesso e na listagem de perfis internos.
- Validação realizada: `node --check js/modules/configuracoes.js`.

## 2026-05-10 — Remoção do card Campos conectados ao Master
- Arquivos alterados: `js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Configurações > Usuários / permissões.
- Resumo do ajuste: removi o card lateral `Campos conectados ao Master` e mantive apenas o aviso compacto de itens que continuam exclusivos do Master.
- Compatibilidade: não alterei a leitura do perfil sincronizado nem os perfis internos salvos em `config/usuarios`.
- Validação realizada: `node --check js/modules/configuracoes.js`.

## 2026-05-10 — Configurações Usuários conectado ao Master
- Arquivos alterados: `js/modules/configuracoes.js`, `server.rb`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Configurações > Usuários / permissões.
- Resumo do ajuste: redesenhei a tela no padrão visual atual e separei acesso principal do Master dos perfis internos do tenant.
- Campos conectados ao Master: `tenantId/uid`, `email`, `name/businessName`, `ownerName`, `phone`, `document`, `fiscalCountry`, `plan`, `role`, `status`, `domain/storeUrl`, `adminUrl` e `source/origin`.
- Backend: ampliei o documento `system_tenants` gerado pelo Master com dados cadastrais seguros para leitura no Admin, sem expor GitHub token, seed ou campos de publicação sensíveis.
- Compatibilidade: mantive a lista local `config/usuarios` para perfis internos e permissões operacionais, sem alterar Firebase Auth nem a regra de login.
- Validação realizada: `node --check js/modules/configuracoes.js`, parse dos scripts inline de `admin.html` e `ruby -c server.rb`.

## 2026-05-10 — Configurações Integrações redesenhada e conectada
- Arquivos alterados: `js/modules/configuracoes.js`, `index.html`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Configurações > Integrações.
- Resumo do ajuste: redesenhei a tela no padrão visual atual, com cards de status, blocos para medição/pixels, canais públicos e explicação de onde cada campo é usado.
- Campos expostos: mantive `gaId`/`ga4Id`, `gtmId`, `pixelId`/`metaPixelId` e `whatsapp`; adicionei edição direta de `instagram`, `facebook` e `tiktok`, que já são lidos pela loja pública.
- Integração: preservei aliases existentes e conectei a loja pública para inicializar GA4, GTM e Meta Pixel a partir de `config/integracoes` quando o tenant possuir IDs próprios.
- Validação realizada: `node --check js/modules/configuracoes.js` e parse dos scripts inline de `admin.html`/`index.html`.

## 2026-05-10 — Refinamento de Configurações Domínio
- Arquivos alterados: `js/modules/configuracoes.js`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Configurações > Domínio / URL.
- Resumo do ajuste: refinei a hierarquia da tela com destaque para o link principal, status do subdomínio, status do domínio principal e cards de links mais claros.
- Ajuste visual: o link da loja pública virou destaque, os links úteis ficaram mais organizados e a mensagem de domínio principal agora explica quando é apenas prévia.
- Escopo: mantive a regra de a usuária configurar apenas o subdomínio; não reintroduzi domínio próprio, domínio principal, login ou painel administrativo na interface.
- Validação realizada: `node --check js/modules/configuracoes.js`.

## 2026-05-10 — Configurações Domínio com link de avaliações
- Arquivos alterados: `js/modules/configuracoes.js`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Configurações > Domínio / URL.
- Resumo do ajuste: removi os cards `API / integrações` e `Login da loja` da lista de links gerados.
- Link adicionado: incluí o card `Avaliações`, gerando `reviewUrl` a partir do subdomínio da loja.
- Compatibilidade: mantive `loginUrl` e `apiUrl` no objeto salvo para uso interno/futuro, mas eles não aparecem mais na interface da usuária.
- Validação realizada: `node --check js/modules/configuracoes.js`.

## 2026-05-10 — Painel administrativo movido para Master
- Arquivos alterados: `js/modules/configuracoes.js`, `master.html`, `server.rb`, `admin.html`, `AI_CHANGELOG.md`.
- Módulos afetados: Configurações > Domínio / URL; Painel Master > Cadastro de usuário.
- Resumo do ajuste: removi o card `Painel administrativo` da tela de domínio do tenant e parei de salvar `adminUrl` em `config/dominio`.
- Master: renomeei o campo do cadastro de usuário para `Painel administrativo` e deixei claro que a usuária não configura essa URL na tela de domínio.
- Backend: incluí `adminUrl` na sincronização de `system_tenants`, mantendo fallback para `admin.html`.
- Validação realizada: `node --check js/modules/configuracoes.js`, parse dos scripts inline de `admin.html`/`master.html` e `ruby -c server.rb`.

## 2026-05-10 — Configurações Domínio apenas com subdomínio da loja
- Arquivos alterados: `js/modules/configuracoes.js`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Configurações > Domínio / URL.
- Resumo do ajuste: removi da interface os campos de `Domínio principal do sistema` e `Domínio próprio da loja`.
- Fluxo: a usuária define apenas o nome da loja/subdomínio; domínio principal e domínio próprio ficam como dados internos/futuros, sem edição pela usuária.
- Compatibilidade: preservei valores existentes de `rootDomain`, `mainDomain`, `platformDomain` e `customDomain` ao gerar e salvar URLs.
- Validação realizada: `node --check js/modules/configuracoes.js`.

## 2026-05-10 — Configurações Domínio no padrão atual
- Arquivos alterados: `js/modules/configuracoes.js`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Configurações > Domínio / URL.
- Resumo do ajuste: redesenhei a tela no padrão das últimas telas, com configuração de subdomínio da loja, domínio principal futuro, domínio próprio opcional e cards de URLs geradas.
- URLs preparadas: loja pública, login da loja, pedidos, rastreio, painel administrativo e base de API/integrações.
- Compatibilidade: mantive `publicUrl`, `siteUrl`, `orderUrl` e `trackUrl`, adicionando `storeSlug`, `slug`, `subdomain`, `rootDomain`, `mainDomain`, `platformDomain`, `customDomain`, `loginUrl`, `adminUrl` e `apiUrl`.
- Validação realizada: `node --check js/modules/configuracoes.js`.

## 2026-05-10 — Configurações Geral com campos administrativos
- Arquivos alterados: `js/modules/configuracoes.js`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Configurações > Geral.
- Resumo do ajuste: adicionei `Nome comercial`, `Razão social`, `Responsável legal` e `E-mail fiscal / administrativo`.
- Escopo: não adicionei regime fiscal; mantive o fluxo atual focado em Espanha/autónomo e Portugal sem apuração fiscal por enquanto.
- Compatibilidade: os novos campos são salvos em aliases úteis para documentos e integrações futuras (`tradeName`, `commercialName`, `legalName`, `companyLegalName`, `legalRepresentative`, `adminEmail`, `fiscalEmail`, `billingEmail`).
- Validação realizada: `node --check js/modules/configuracoes.js`.

## 2026-05-10 — Configurações Geral sem card de localização
- Arquivos alterados: `js/modules/configuracoes.js`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Configurações > Geral.
- Resumo do ajuste: removi o card `Localização`, já que o endereço operacional será tratado no Template.
- Compatibilidade: preservei os valores existentes de `country` e `city` no salvamento para não apagar dados já usados por outras áreas.
- Validação realizada: `node --check js/modules/configuracoes.js`.

## 2026-05-10 — Configurações Geral com telefone e dados fiscais da empresa
- Arquivos alterados: `js/modules/configuracoes.js`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Configurações > Geral.
- Resumo do ajuste: adicionei seletor de país/código no telefone e um bloco separado para dados fiscais da empresa.
- Dados fiscais: o documento fiscal usa labels, placeholders, dica e validação de acordo com o país fiscal do usuário; o endereço fiscal da empresa é separado do endereço de retirada/template.
- Google Maps: o campo de endereço fiscal da empresa já chama `BocaPlaces.init('cfg-company-address')`, ficando preparado para autocomplete quando a chave do Google Maps estiver instalada.
- Compatibilidade: mantive `whatsapp` e `phone`, adicionando `phoneCountryCode`, `whatsappCountryCode`, `phoneFull`, `whatsappFull`, `companyFiscalId`, `fiscalDocument`, `companyAddress` e `businessAddress`.
- Validação realizada: `node --check js/modules/configuracoes.js`.

## 2026-05-10 — Configurações Geral sem prévia dos dados
- Arquivos alterados: `js/modules/configuracoes.js`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Configurações > Geral.
- Resumo do ajuste: removi o bloco de `Prévia dos dados` do card `Identidade do negócio`.
- Escopo: mantive todos os campos, IDs e salvamento de `config/geral` sem alteração.
- Validação realizada: `node --check js/modules/configuracoes.js`.

## 2026-05-10 — Configurações Geral com listas de padrões
- Arquivos alterados: `js/modules/configuracoes.js`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Configurações > Geral.
- Resumo do ajuste: troquei os campos de `Idioma padrão` e `Moeda` por listas de seleção no bloco `Padrões do sistema`.
- Compatibilidade: mantive os mesmos IDs (`cfg-language`, `cfg-currency`) e o mesmo salvamento em `language`, `defaultLanguage`, `currency` e `defaultCurrency`.
- Validação realizada: `node --check js/modules/configuracoes.js`.

## 2026-05-10 — Configurações Geral no padrão visual atual
- Arquivos alterados: `js/modules/configuracoes.js`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Configurações > Geral.
- Resumo do ajuste: reorganizei a tela Geral no padrão das últimas telas, com cabeçalho próprio, chips, cards premium, prévia dos dados, blocos de contato, localização, padrões do sistema, país fiscal e rodapé de salvamento.
- Navegação: removi o cabeçalho genérico e o seletor interno de abas do módulo Configurações, mantendo a navegação pelo menu lateral.
- Dados preservados: mantive os mesmos IDs de campos e o mesmo objeto salvo em `config/geral`, incluindo campos duplicados usados por outras áreas (`phone`, `defaultLanguage`, `defaultCurrency`, visual, cores, banner e custos indiretos).
- Escopo: não alterei Firebase, coleções, integrações, regras fiscais nem consumo desses dados em outros módulos.
- Validação realizada: `node --check js/modules/configuracoes.js`.

## 2026-05-10 — Plano de Voo carregando a versão atual
- Arquivos alterados: `admin.html`, `js/modules/plano_voo.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Plano de Voo.
- Resumo do ajuste: removi o carregamento do módulo antigo `crescimento.js` do HTML e adicionei cache bust em `plano_voo.js` para evitar abertura da tela antiga por cache do navegador.
- Carregamento: removi uma função de pintura antiga e redundante que podia manter a área em `Carregando...`, mantendo a renderização pelo fluxo atual de `_paintActive`.
- Escopo: não alterei cálculos, dados, Firebase, cenários, previsões ou layout funcional do Plano de Voo.
- Validação realizada: `node --check js/modules/plano_voo.js` e parse dos scripts inline de `admin.html`.

## 2026-05-10 — Correção da navegação de Crescimento
- Arquivos alterados: `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Plano de Voo.
- Resumo do ajuste: corrigi o clique no grupo `Crescimento` para sempre abrir `Plano de Voo`, mesmo quando o usuário já está dentro de `Crescimento > Performance`.
- Rotas: registrei explicitamente as subrotas `crescimento/plano-de-voo/simulacao`, `crescimento/plano-de-voo/comparacao` e `crescimento/plano-de-voo/snapshots` para evitar fallback ambíguo nos links internos.
- Escopo: não alterei cálculos, dados, Firebase nem layout do Plano de Voo ou Performance.
- Validação realizada: `node --check js/modules/plano_voo.js`, `node --check js/modules/performance.js` e parse dos scripts inline de `admin.html`.

## 2026-05-10 — Fiscal sem seletor interno e menu reordenado
- Arquivos alterados: `js/modules/fiscal.js`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Fiscal.
- Resumo do ajuste: removi o seletor de abas interno das páginas fiscais e deixei a navegação centralizada no menu lateral.
- Menu lateral: reordenei para `Resumo trimestral`, `IVA`, `IRPF` e `Configurações fiscais`; o clique no grupo Fiscal agora abre `Resumo trimestral`.
- Escopo: não alterei Firebase, cálculos fiscais, coleções, filtros, paginações ou regras de dedutibilidade.
- Validação realizada: `node --check js/modules/fiscal.js`.

## 2026-05-10 — Remoção visual de Fiscal Compras dedutíveis
- Arquivos alterados: `js/modules/fiscal.js`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Fiscal.
- Resumo do ajuste: removi a aba `Compras dedutíveis` das subtabs internas do Fiscal e também do menu lateral, deixando o fluxo fiscal focado em `Configurações fiscais`, `IVA`, `IRPF` e `Resumo trimestral`.
- Compatibilidade: acessos antigos para `fiscal/compras` são redirecionados para `fiscal/resumo`.
- Escopo: não apaguei campos, coleções, cálculos, marcações fiscais das compras nem lógica de dedutibilidade.
- Validação realizada: `node --check js/modules/fiscal.js`.

## 2026-05-10 — Fiscal Resumo trimestral em layout analítico
- Arquivos alterados: `js/modules/fiscal.js`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Fiscal > Resumo trimestral.
- Resumo do ajuste: reorganizei a tela como visão analítica no padrão das telas de desempenho/performance, sem criar listagem artificial.
- Layout: adicionei cabeçalho com chips, KPIs com hover, composição do resultado fiscal, blocos de IVA e IRPF com barras comparativas e leitura rápida do trimestre.
- Escopo: mantive cálculos fiscais, Firebase, coleções, trimestre ativo e regras de dedutibilidade sem alteração de regra de negócio.
- Validação realizada: `node --check js/modules/fiscal.js`.

## 2026-05-10 — Fiscal Compras dedutíveis no padrão Catálogo Produtos
- Arquivos alterados: `js/modules/fiscal.js`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Fiscal > Compras dedutíveis.
- Resumo do ajuste: levei a aba de compras dedutíveis para o mesmo padrão visual aplicado em `Catálogo > Produtos`, IVA e IRPF, com cabeçalho, chips, KPIs com hover, filtros em card branco e tabela premium.
- Lista/filtros: adicionei busca conectada, filtro por dedutibilidade, filtro por categoria fiscal, paginação, seletor de itens por página, estado vazio e ação para visualizar detalhes da compra.
- Edição: mantive os controles de IVA, IRPF e categoria fiscal diretamente na tabela, preservando o salvamento existente por compra.
- Escopo: mantive Firebase, coleções, campos fiscais, cálculo de IVA/IRPF e regras de dedutibilidade sem alteração de regra de negócio.
- Validação realizada: `node --check js/modules/fiscal.js`.

## 2026-05-10 — Fiscal IRPF no padrão Catálogo Produtos
- Arquivos alterados: `js/modules/fiscal.js`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Fiscal > IRPF.
- Resumo do ajuste: levei a tela de IRPF para o mesmo padrão visual aplicado em `Catálogo > Produtos` e na tela de IVA, com cabeçalho próprio, chips de resumo, KPIs com hover, card de aviso, filtros e tabela premium.
- Lista/filtros: adicionei busca conectada, filtro por tipo, filtro por impacto fiscal, paginação, seletor de itens por página e ação para abrir detalhes do movimento.
- Detalhe: incluí modal de visualização com base sem IVA, valor bruto, percentual removido e efeito na base do IRPF.
- Escopo: mantive cálculos de IRPF, Firebase, coleções, marcações dedutíveis e regras fiscais sem alteração de regra de negócio.
- Validação realizada: `node --check js/modules/fiscal.js`.

## 2026-05-10 — Fiscal IVA com filtros, paginação e detalhe
- Arquivos alterados: `js/modules/fiscal.js`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Fiscal > IVA.
- Resumo do ajuste: completei a listagem da tela de IVA com busca, filtros por tipo/impacto, paginação no padrão de `Catálogo > Produtos` e ação para visualizar detalhes.
- Conexões: busca, filtros, page size e navegação de páginas estão conectados ao estado da tela e reprocessam a lista sem alterar os cálculos fiscais.
- Detalhe: adicionei modal de detalhe do movimento com referência, data, base, percentual aplicado, IVA e impacto.
- Escopo: mantive cálculos, Firebase, coleções e marcações de compras dedutíveis sem alteração de regra de negócio.
- Validação realizada: `node --check js/modules/fiscal.js`.

## 2026-05-10 — Fiscal IVA no padrão Catálogo Produtos
- Arquivos alterados: `js/modules/fiscal.js`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Fiscal > IVA.
- Resumo do ajuste: levei a tela de IVA para o padrão visual de `Catálogo > Produtos`, com cabeçalho próprio, chips de resumo, KPIs com hover, aviso premium e listagem principal.
- Lista adicionada: incluí a seção `Movimentos considerados no IVA`, mostrando vendas e compras dedutíveis usadas na estimativa, com tabela branca, cabeçalho uppercase, chips e estado vazio.
- Escopo: mantive cálculos de IVA, `config/fiscal`, marcações de compras dedutíveis, Firebase e coleções sem alteração de regra de negócio.
- Validação realizada: `node --check js/modules/fiscal.js`.

## 2026-05-10 — Fiscal Configurações no padrão atual
- Arquivos alterados: `js/modules/fiscal.js`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Fiscal > Configurações fiscais.
- Resumo do ajuste: levei a tela de configurações fiscais para o padrão visual aplicado nas telas recentes, com cabeçalho próprio, chips de resumo, subtabs discretas, card branco premium e campos alinhados.
- Ajuste visual: removi o cabeçalho global antigo do módulo Fiscal, refinei as abas internas, inputs, labels, aviso fiscal e botão principal com bordas, sombras, radius e densidade do padrão atual.
- Escopo: mantive `config/fiscal`, campos, handlers, salvamento, cálculos de IVA/IRPF e compras dedutíveis sem alteração de regra de negócio.
- Validação realizada: `node --check js/modules/fiscal.js`.

## 2026-05-10 — Financeiro Configurações no padrão atual
- Arquivos alterados: `js/modules/financeiro.js`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Financeiro > Configurações.
- Resumo do ajuste: levei a aba Configurações do Financeiro para o mesmo padrão visual aplicado em Entradas e Saídas, com cabeçalho próprio, chips de resumo, subtabs discretas, cards brancos, listas refinadas e estados vazios mais elegantes.
- Ajuste visual: categorias, formas de pagamento, contas bancárias e custos indiretos agora usam bordas, sombras, radius, espaçamentos, botões, chips e ações por ícone no padrão atual.
- Modais: refinei os modais de categoria, conta bancária e forma de pagamento com cards internos, introdução, campos alinhados e rodapé com cancelar/salvar.
- Escopo: mantive Firebase, coleções, campos, handlers, validações, salvamento, edição e exclusão sem alteração de regra de negócio.
- Validação realizada: `node --check js/modules/financeiro.js`.

## 2026-05-10 — Refinamento dos modais de Financeiro Entradas
- Arquivos alterados: `js/modules/financeiro.js`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Financeiro > Entradas.
- Resumo do ajuste: apliquei nos modais de Entradas o mesmo refinamento visual feito em Saídas, com resumo executivo, formulário mais didático e modais auxiliares no padrão premium.
- Ajuste visual: o modal de resumo ganhou topo com valor/status e cards compactos; o modal de criar/editar ganhou bloco introdutório, identificação, status/datas, recorrência/parcelamento e comprovante/observações; exclusão, confirmação de recebimento, recebimento parcial e nova previsão foram refinados.
- Escopo: mantive IDs de campos, handlers, validações, Firebase, coleções, criação, edição, confirmação de recebimento, parcialidade e exclusão sem alteração de regra de negócio.
- Validação realizada: `node --check js/modules/financeiro.js`.

## 2026-05-10 — Refinamento dos modais de Financeiro Saídas
- Arquivos alterados: `js/modules/financeiro.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Financeiro > Saídas.
- Resumo do ajuste: refinei os modais de visualizar, criar/editar, confirmar e excluir saída para reduzir aparência de formulário técnico e aproximar a experiência do padrão premium usado em `Catálogo > Produtos`.
- Ajuste visual: o resumo ganhou topo executivo com valor/status, dados em cards compactos, o formulário ganhou bloco introdutório, agrupamento de identificação, status/datas e recorrência/parcelamento, e a exclusão passou a usar modal próprio em vez de confirmação nativa.
- Escopo: mantive IDs dos campos, handlers, validações, Firebase, coleções, criação, edição, baixa e exclusão sem alteração de regra de negócio.
- Validação realizada: `node --check js/modules/financeiro.js`.

## 2026-05-10 — Financeiro Saídas alinhada ao padrão Produtos
- Arquivos alterados: `js/modules/financeiro.js`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Financeiro > Saídas.
- Resumo do ajuste: levei a aba Saídas para o padrão visual de `Catálogo > Produtos`, com cabeçalho próprio, botão primário, KPIs com hover, filtros em card branco, chips de resumo, tabela premium, ações por ícone e estado vazio elegante.
- Paginação: adicionei paginação no rodapé da listagem, com seletor de itens por página, contador, botões `Anterior`/`Próxima` e indicador de página no padrão já usado nas listas recentes.
- Modais: refinei visualizar saída, criar/editar saída e confirmar saída para acompanhar cards, campos, labels, rodapé e botões do padrão atual.
- Escopo: mantive contas a pagar, movimentações, Firebase, coleções, filtros, busca, ordenação, criação, edição, exclusão e confirmação de pagamento sem alteração de regra de negócio.
- Validação realizada: `node --check js/modules/financeiro.js`.

## 2026-05-10 — Modais de Entradas no padrão visual atual
- Arquivos alterados: `js/modules/financeiro.js`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Financeiro > Entradas.
- Resumo do ajuste: refinei os modais de criar/editar entrada, visualizar resumo e confirmar recebimento para acompanhar o padrão visual usado em `Catálogo > Produtos`.
- Ajuste visual: campos e labels ficaram com borda, radius, sombra interna, fonte e densidade do padrão atual; blocos internos passaram a usar cards brancos sem borda e com sombra premium; rodapés receberam botão principal, botão cancelar e espaçamento consistente.
- Escopo: mantive IDs de campos, handlers, validações, salvamento, confirmação de recebimento, Firebase e coleções sem alteração de lógica.
- Validação realizada: `node --check js/modules/financeiro.js`; parse dos scripts inline de `admin.html` com Node.

## 2026-05-10 — Refinamento do Financeiro e card de listagem de Entradas
- Arquivos alterados: `js/modules/financeiro.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Financeiro > Entradas.
- Resumo do ajuste: removi o cabeçalho geral `Financeiro` com o subtítulo do shell do módulo.
- Ajuste visual: refinei o card da listagem de Entradas para ficar mais fiel à estrutura de `Catálogo > Produtos`, mantendo wrapper branco, borda `#EAE4DA`, radius `16px`, sombra premium, overflow interno e tabela com separação visual mais limpa.
- Escopo: alteração visual apenas; não alterei dados, Firebase, filtros, paginação ou ações.
- Validação realizada: `node --check js/modules/financeiro.js`; parse dos scripts inline de `admin.html` com Node.

## 2026-05-10 — Padronização visual do Financeiro > Entradas
- Arquivos alterados: `js/modules/financeiro.js`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Financeiro > Entradas.
- Resumo do ajuste: levei a tela de entradas para o padrão visual de `Catálogo > Produtos`, com cabeçalho refinado, botão primário, KPIs com hover, filtros em card, chips de resumo, tabela premium e estado vazio elegante.
- Paginação: adicionei paginação no rodapé da lista de entradas, com seletor de itens por página e navegação anterior/próxima no mesmo padrão aplicado em Produtos e Fluxo de Caixa.
- Escopo: mantive criação, edição, exclusão, seleção em massa, confirmação de recebimento, filtros, busca, ordenação, Firebase e coleções sem alteração de lógica.
- Validação realizada: `node --check js/modules/financeiro.js`; parse dos scripts inline de `admin.html` com Node.

## 2026-05-10 — Linha vertical e paginação no Fluxo de Caixa
- Arquivos alterados: `js/modules/financeiro.js`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Financeiro > Fluxo de Caixa.
- Resumo do ajuste: substituí a listagem tabular longa por uma linha vertical de eventos por data, mantendo entradas, saídas, status e saldo acumulado em cada item.
- Paginação: adicionei paginação no rodapé no mesmo padrão de `Catálogo > Produtos`, com seletor de itens por página, botões anterior/próxima e contador de página.
- Ajuste visual: mantive KPIs, filtros, chips, hover, radius, sombra e densidade no padrão já aplicado; a linha vertical usa rolagem horizontal controlada em telas menores para evitar quebra visual.
- Escopo: não alterei Firebase, coleções, filtros, cálculos, ordenação ou regras de negócio.
- Validação realizada: `node --check js/modules/financeiro.js`; parse dos scripts inline de `admin.html` com Node.

## 2026-05-10 — Padronização visual do Financeiro > Fluxo de Caixa
- Arquivos alterados: `js/modules/financeiro.js`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Financeiro > Fluxo de Caixa.
- Resumo do ajuste: levei a tela de fluxo de caixa para o padrão visual de `Catálogo > Produtos`, com filtros em card, chips de resumo, KPIs com hover, tabela refinada, cabeçalhos uppercase, ícones coloridos por tipo de evento e estado vazio premium.
- Ajuste de interação: a busca agora recalcula também os cards/KPIs do recorte filtrado, mantendo a tabela e os resumos sincronizados.
- Escopo: mantive as mesmas fontes de dados, filtros, status, período, conta bancária, ordenação e cálculo de saldo acumulado; não alterei Firebase, coleções ou regras de negócio.
- Validação realizada: `node --check js/modules/financeiro.js`; parse dos scripts inline de `admin.html` com Node.

## 2026-05-10 — Correção de atualização do Financeiro > Visão Geral
- Arquivos alterados: `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Financeiro > Visão Geral.
- Resumo do ajuste: adicionei versionamento no carregamento de `js/modules/financeiro.js` para evitar que o navegador mantenha uma versão antiga em cache.
- Contexto: a tela já estava registrada na rota `financeiro/visao-geral` e o arquivo contém o layout atualizado; o ajuste força o painel a buscar o JS novo.
- Validação realizada: `node --check js/modules/financeiro.js`; parse dos scripts inline de `admin.html` com Node.

## 2026-05-10 — Correção de atualização da tela Performance
- Arquivos alterados: `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Performance.
- Resumo do ajuste: adicionei versionamento no carregamento de `js/modules/performance.js` para evitar que o navegador mantenha uma versão antiga em cache.
- Escopo: não alterei layout, cálculos, Firebase, rotas ou regras de negócio; apenas forcei o painel a buscar o arquivo atualizado da tela Performance.
- Validação realizada: parse dos scripts inline de `admin.html` com Node.

## 2026-05-10 — Controle direto para abrir e fechar a loja online
- Arquivos alterados: `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: navegação superior do painel.
- Resumo do ajuste: removi a entrada visual do módulo `Operação` do menu lateral e substituí a necessidade dessa aba por um botão direto ao lado de `Ver loja`.
- Novo comportamento: o botão alterna entre `Abrir loja online` e `Fechar loja online`, atualiza o status no topo e salva o estado em `config/template` (`manual_open`/`manual_closed`) com espelho em `config/operacao.isOpen`.
- Compatibilidade: mantive os mesmos campos que a loja pública já consulta, sem criar coleções novas e sem alterar Firebase Rules, pedidos ou lógica de catálogo.
- Validação realizada: parse dos scripts inline de `admin.html` com Node.

## 2026-05-10 — Reestruturação do módulo Operação conectado ao Template
- Arquivos alterados: `js/modules/operacao.js`, `admin.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Operação.
- Resumo do ajuste: substituí as abas antigas desconectadas por telas operacionais baseadas nos campos usados em `Catálogo > Template da loja`.
- Novas abas: `Status e horários`, `Entrega e retirada`, `Zonas de entrega`, `Pagamentos` e `Endereço e contato`.
- Sincronização: as telas de Operação agora leem e salvam os mesmos documentos usados pelo Template (`config/template`, `config/horarios`, `config/zonas`, `config/pagamentos`, `config/endereco`, `config/geral` quando aplicável), então alterações feitas em Operação aparecem no Template e alterações feitas no Template aparecem em Operação.
- Ajuste visual: apliquei o padrão recente de layout, cards, chips, botões, inputs, radius, sombras, densidade e hierarquia usado nas demais páginas.
- Escopo: não criei coleções novas, não alterei Firebase Rules e não criei dados paralelos.
- Validação realizada: `node --check js/modules/operacao.js`.

## 2026-05-10 — Padronização visual do Financeiro > Visão Geral
- Arquivos alterados: `js/modules/financeiro.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Financeiro > Visão Geral.
- Resumo do ajuste: levei a visão geral financeira para o mesmo padrão visual aplicado em Programa de Pontos, Plano de Voo e Performance, com header compacto, filtros em card, chips de resumo, KPIs com hover, cards de apoio e blocos refinados de movimentações e contas bancárias.
- Ajuste solicitado: removi o seletor de abas interno da página, mantendo a navegação pelo menu lateral.
- Escopo: alteração visual e estrutural da apresentação; filtros, cálculos, Firebase, coleções, contas, entradas, saídas e ações existentes foram preservados.
- Validação realizada: `node --check js/modules/financeiro.js`.

## 2026-05-10 — Correção da navegação lateral do Plano de Voo
- Arquivos alterados: `admin.html`, `js/core/router.js`, `js/modules/plano_voo.js`, `js/modules/performance.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Plano de Voo.
- Resumo do ajuste: separei a rota do item `Plano de Voo` da rota do grupo pai `Crescimento`, para o clique no menu lateral ter o mesmo comportamento visual dos outros botões com subitens.
- Ajuste de navegação: o grupo `Crescimento` agora abre/navega para `crescimento/plano-de-voo`, as subtabs internas mantêm essa base de rota e o roteador destaca o item pai correto mesmo em rotas internas como `crescimento/plano-de-voo/snapshots`.
- Escopo: alteração restrita a navegação/estado visual do menu; não alterei Firebase, cálculos ou dados do Plano de Voo.
- Validação realizada: `node --check js/core/router.js`; `node --check js/modules/plano_voo.js`; `node --check js/modules/performance.js`.

## 2026-05-10 — Padronização visual da tela Performance
- Arquivos alterados: `js/modules/performance.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Performance.
- Resumo do ajuste: levei a tela Performance para o mesmo padrão visual aplicado em Plano de Voo e Programa de Pontos, com cabeçalho compacto, cards premium, KPIs com hover, filtros em card, chips de resumo, tabelas refinadas e listas com barras mais consistentes.
- Ajuste visual: removi padrões antigos de sombra, radius, tipografia local e cards soltos, mantendo a hierarquia de análise com cenário do mês, filtros, KPIs, leitura mensal, linha diária, canais, caixa e categorias.
- Escopo: alteração de apresentação apenas; mantive Firebase, cálculos, filtros, dados e regras de performance sem alteração.
- Validação realizada: `node --check js/modules/performance.js`.

## 2026-05-10 — Remoção do botão superior Salvar previsão
- Arquivos alterados: `js/modules/plano_voo.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Plano de Voo.
- Resumo do ajuste: removi o botão `Salvar previsão` do topo, ao lado do seletor de subtabs.
- Escopo: mantive os botões de salvar previsão dentro do fluxo da tela e não alterei snapshots, Firebase ou lógica.
- Validação realizada: `node --check js/modules/plano_voo.js`.

## 2026-05-10 — Refinamento de Previsões Salvas no Plano de Voo
- Arquivos alterados: `js/modules/plano_voo.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Plano de Voo > Previsões salvas.
- Resumo do ajuste: reorganizei a tela de previsões salvas para melhorar hierarquia, leitura dos cenários e uso das ações.
- Ajuste visual: criei um banner mais claro para o cenário do mês, com chips de mês, cenário e lucro, além de ação direta para comparar.
- Ajuste de organização: adicionei resumo da biblioteca com total de previsões, receita média e melhor lucro.
- Ajuste dos cards: os cards agora destacam lucro projetado como métrica principal, mostram receita/custos como apoio e separam ações de comparação e definição do cenário do mês.
- Escopo: alteração de apresentação apenas; mantive snapshots, cenário do mês, comparação, Firebase e cálculos sem alteração.
- Validação realizada: `node --check js/modules/plano_voo.js`.

## 2026-05-10 — Refinamento do Previsto vs Real no Plano de Voo
- Arquivos alterados: `js/modules/plano_voo.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Plano de Voo > Previsto vs Real.
- Resumo do ajuste: reorganizei a comparação para reduzir cards apertados e melhorar a leitura do desempenho real contra a previsão.
- Ajuste visual: destaquei os indicadores principais (`Atingimento`, `Saldo vs previsto`, `Lucro real`) em cards maiores.
- Ajuste de organização: receita, custos e caixa final ficaram em cards de apoio com real, previsto, percentual e variação.
- Ajuste de tabela: aumentei a largura mínima da tabela comparativa e mantive valores financeiros sem quebra para evitar números espremidos.
- Escopo: alteração de apresentação apenas; mantive comparação, cálculos, snapshots, Firebase e dados reais sem alteração.
- Validação realizada: `node --check js/modules/plano_voo.js`.

## 2026-05-10 — Refinamento da Simulação do Plano de Voo
- Arquivos alterados: `js/modules/plano_voo.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Plano de Voo > Simulação.
- Resumo do ajuste: reorganizei os dados da aba de simulação para reduzir cards apertados e melhorar a leitura financeira.
- Ajuste visual: separei os indicadores em cards principais (`Receita projetada`, `Lucro projetado`, `Caixa final`) e cards de apoio (`Custos variáveis`, `Despesas fixas`, `Caixa atual`).
- Ajuste de organização: o card `Resultado` agora destaca o resultado final e mostra a composição em blocos menores, evitando repetir todos os KPIs grandes.
- Ajuste de responsividade: linhas de canais, custos variáveis e despesas fixas ganharam largura mínima com rolagem interna para não espremer valores, botões e chips.
- Escopo: alteração de apresentação apenas; mantive simulação, cálculos, Firebase, snapshots e regras existentes sem alteração.
- Validação realizada: `node --check js/modules/plano_voo.js`.

## 2026-05-10 — Ícones dos KPIs de Promoções no padrão Produtos
- Arquivos alterados: `js/modules/marketing.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Ações de Vendas > Promoções.
- Resumo do ajuste: alinhei os ícones dos cards de KPI ao padrão real de `Catálogo > Produtos`.
- Ajuste visual: removi fundo, borda e sombra interna do bloco do ícone, mantendo apenas o ícone colorido conforme o dado apresentado.
- Escopo: alteração visual no helper de KPI usado no módulo de marketing; não alterei filtros, dados, Firebase, listagens ou ações.
- Validação realizada: `node --check js/modules/marketing.js`.

## 2026-05-10 — Performance dentro de Crescimento
- Arquivos alterados: `admin.html`, `AI_CHANGELOG.md`.
- Módulos afetados: Navegação > Crescimento e Performance.
- Resumo do ajuste: removi `Performance` do nível principal do menu e incluí como subitem dentro de `Crescimento`, logo abaixo de `Plano de Voo`.
- Ajuste de rota: adicionei `crescimento/performance` apontando para `Modules.Performance`, mantendo a rota antiga `performance` registrada por compatibilidade.
- Escopo: alteração de navegação apenas; não alterei o módulo Performance, dados, Firebase ou regras de cálculo.
- Validação realizada: conferência das rotas no `admin.html` e ausência de item principal solto `data-route="performance"`.

## 2026-05-10 — Cores nos elementos gráficos de Promoções e Cupons
- Arquivos alterados: `js/modules/marketing.js`, `AI_CHANGELOG.md`.
- Módulos afetados: Ações de Vendas > Promoções e Ações de Vendas > Cupons.
- Resumo do ajuste: refinei os elementos gráficos dos cards de KPI para terem fundo, borda e ícone coloridos conforme o dado apresentado.
- Cores aplicadas: ativos/sucesso em verde, expirados/perigo em vermelho, agendados/usos em azul, produtos/total em tom produto e neutros em bege.
- Escopo: alteração visual apenas nos cards; mantive filtros, listagens, modais, ações e dados sem alteração de lógica.
- Validação realizada: `node --check js/modules/marketing.js`.

## 2026-05-10 — Plano de Voo alinhado ao Programa de Pontos
- Arquivos alterados: `js/modules/plano_voo.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Crescimento > Plano de Voo.
- Resumo do ajuste: levei a tela `Plano de Voo` para o padrão visual aplicado em `Marketing > Programa de Pontos`.
- Ajuste visual: cabeçalho compacto com chips, subtabs internas em pills, botão primário vermelho com hover, cards brancos com radius 16px, sombra premium, campos `#EAE4DA`, labels compactas, KPIs com ícones e hover.
- Ajuste de conteúdo: padronizei os blocos de simulação, insights, vendas por canal, custos variáveis, despesas fixas, resultado, comparação e previsões salvas sem alterar os cálculos.
- Ajuste de tabelas/listas: refinei tabelas comparativas, resumo anual, cards de previsões salvas, banner de cenário do mês, estados vazios e modal de salvar previsão.
- Escopo: mantive Firebase, coleções, snapshots, cenário do mês, comparação previsto vs real, simulação, transformação em conta a pagar e regras de cálculo sem alteração de lógica.
- Validação realizada: `node --check js/modules/plano_voo.js`.

## 2026-05-10 — Promoções alinhada ao padrão de Produtos
- Arquivos alterados: `js/modules/marketing.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Ações de Vendas > Promoções.
- Resumo do ajuste: levei a tela de `Promoções` para o mesmo padrão visual aplicado em `Catálogo > Produtos` e nas telas recentes.
- Ajuste visual: cabeçalho compacto, chips de resumo, KPIs com hover premium, filtros em card branco, botão primário com hover, tabela com título/subtítulo, sombra, borda `#EAE4DA`, radius 16px e densidade igual ao padrão.
- Ajuste de listagem: adicionei paginação no mesmo padrão de Produtos, com seletor de itens por página, contador, botões `Anterior`/`Próxima` e indicador de página vermelho.
- Ajuste de filtros: mantive busca/status/tipo/período, adicionei limpeza de filtros e preservação de foco na busca.
- Escopo: mantive coleções, criação, edição, duplicação, pausa/ativação, exclusão, cálculo de impacto e dados existentes sem alteração de regra de negócio.
- Validação realizada: `node --check js/modules/marketing.js`.

## 2026-05-10 — Filtros na Lista de Preço
- Arquivos alterados: `js/modules/dinheiro.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Preços e Margem > Lista de Preço.
- Resumo do ajuste: incluí filtros relevantes no card de filtros da visão de lista de preços, mantendo o padrão visual aplicado no módulo.
- Filtros adicionados: busca por produto, filtro de preço (`Com preço`/`Sem preço`) e filtro de margem/status (`Em risco`, `Saudáveis`, `Sem dados`), além da limpeza de filtros.
- Ajuste funcional: cards, chips de resumo, estado vazio e impressão passam a respeitar a lista filtrada; a busca preserva o foco durante a digitação.
- Escopo: mantive seleção de canal, cálculo de preço por canal, dados e regras existentes sem alteração de lógica de negócio.
- Validação realizada: `node --check js/modules/dinheiro.js`.

## 2026-05-10 — Regras de Preço alinhada ao Radar
- Arquivos alterados: `js/modules/dinheiro.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Preços e Margem > Regras de preço.
- Resumo do ajuste: levei a tela `Regras de preço` para o mesmo padrão visual aplicado no Radar.
- Ajuste visual: cabeçalho compacto com título/subtítulo e chips, botões no padrão, cards de regras com inputs `#EAE4DA`, grid responsivo e linhas de canais com radius 16px, sombra premium e hover.
- Escopo: mantive IDs dos campos, salvamento das regras, canais, canal Cardápio fixo e navegação para Configurações sem alteração de lógica.
- Validação realizada: `node --check js/modules/dinheiro.js`.

## 2026-05-10 — Simulador alinhado ao Radar
- Arquivos alterados: `js/modules/dinheiro.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Preços e Margem > Simulador.
- Resumo do ajuste: levei a tela `Simulador` para o mesmo padrão visual aplicado no Radar.
- Ajuste visual: cabeçalho compacto com título/subtítulo e chips, botões no padrão, card de parâmetros com inputs `#EAE4DA`, radius 10px, sombra premium e grid responsivo; resultados continuam usando os KPIs do Radar.
- Escopo: mantive simulação, IDs dos campos, eventos, aplicação de canal, cálculo de comissão, impostos, lucro, margem e markup sem alteração de lógica.
- Validação realizada: `node --check js/modules/dinheiro.js`.

## 2026-05-10 — Lista de Preço alinhada ao Radar
- Arquivos alterados: `js/modules/dinheiro.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Preços e Margem > Lista de Preço.
- Resumo do ajuste: levei a tela `Lista de Preço` para o mesmo padrão visual aplicado no Radar.
- Ajuste visual: cabeçalho compacto com título/subtítulo e chips, botões no padrão, filtro de canal em card branco, seção imprimível com hierarquia refinada e cards de produto com borda `#EAE4DA`, radius 16px, sombra premium e hover.
- Escopo: mantive seleção de canal, cálculo de preço por canal, impressão e dados sem alteração de lógica.
- Validação realizada: `node --check js/modules/dinheiro.js`.

## 2026-05-10 — Remoção do seletor de abas do Radar
- Arquivos alterados: `js/modules/dinheiro.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Preços e Margem > Radar.
- Resumo do ajuste: removi o seletor de abas em pills do cabeçalho do Radar.
- Escopo: alteração somente visual; mantive KPIs, cards analíticos, cálculos, margens, custos, canais e navegação existente sem alteração de lógica.
- Validação realizada: `node --check js/modules/dinheiro.js`.

## 2026-05-10 — Paginação na Composição do Preço
- Arquivos alterados: `js/modules/dinheiro.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Preços e Margem > Composição do Preço.
- Resumo do ajuste: adicionei paginação à listagem de produtos no mesmo padrão visual de Catálogo > Produtos.
- Ajuste visual: contador `Mostrando X a Y de Z`, seletor de itens por página, botões `Anterior`/`Próxima`, indicador de página com barra vermelha, bordas `#EAE4DA`, radius e densidade iguais à listagem de Produtos.
- Escopo: mantive cálculos, filtros vindos do Radar, busca visual da tabela e abertura de detalhe sem alterar regras de preço ou dados.
- Validação realizada: `node --check js/modules/dinheiro.js`.

## 2026-05-10 — Composição do Preço alinhada a Produção Receitas
- Arquivos alterados: `js/modules/dinheiro.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Preços e Margem > Composição do Preço.
- Resumo do ajuste: levei a tela `Composição do Preço` para o mesmo padrão visual de `Produção > Receitas de produção`.
- Ajuste visual: cabeçalho compacto com título/subtítulo e chips, filtros em card branco, botão `Limpar filtros`, seção `Produtos analisados`, estado vazio em card e tabela com borda `#EAE4DA`, sombra, radius e hover suave.
- Escopo: mantive cálculos de custo, margem, lucro, preço mínimo, preço sugerido, busca, filtros vindos do Radar e abertura do detalhe sem alteração de lógica.
- Validação realizada: `node --check js/modules/dinheiro.js`.

## 2026-05-10 — Preços e Margem Radar com padrão de Programa de Pontos
- Arquivos alterados: `js/modules/dinheiro.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Preços e Margem > Radar.
- Resumo do ajuste: levei o Radar para o padrão visual das abas de Marketing > Programa de Pontos.
- Ajuste visual: cabeçalho compacto com título/subtítulo e chips, seletor de abas em pills no topo direito, KPIs compactos com Material Icons, hover premium, radius, sombra e densidade iguais ao Programa de Pontos.
- Cards analíticos: refinei prioridades financeiras e produtos em atenção com hover, sombra e bordas no mesmo padrão, mantendo destaque de cor nos ícones/dados conforme risco, alerta ou saúde da margem.
- Escopo: mantive cálculos, filtros de navegação, produtos, canais, margens, custos e regras sem alteração de lógica.
- Validação realizada: `node --check js/modules/dinheiro.js`.

## 2026-05-10 — Compras Fornecedores alinhada ao Registro
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Compras > Fornecedores.
- Resumo do ajuste: atualizei a aba `Fornecedores` para copiar o layout e design de `Compras > Registro de compras`.
- Ajuste visual: cabeçalho com título/subtítulo e chips, botão primário no padrão, filtros em card branco com busca grande, status e limpar, chips de resumo abaixo e seção `Fornecedores cadastrados`.
- Listagem: mantive tabela, estado vazio, paginação, hover, bordas `#EAE4DA`, sombras, radius e ações discretas no mesmo padrão visual do Registro de compras.
- Escopo: mantive Firebase, busca, filtros, paginação, criação, edição, exclusão e validações do cadastro sem alteração de lógica.
- Validação realizada: `node --check js/modules/compras.js`.

## 2026-05-10 — Compras Produtos/Insumos alinhada ao Registro
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Compras > Produtos / Insumos.
- Resumo do ajuste: atualizei a tela `Produtos / Insumos` para copiar o layout e design de `Compras > Registro de compras`, mantendo a tela sem cards de KPI.
- Ajuste visual: cabeçalho com título/subtítulo e chips, botão primário no padrão, filtros em card branco com busca grande, classe, tipo, categoria, status e limpar, chips de resumo abaixo e seção `Produtos / Insumos cadastrados`.
- Listagem: mantive tabela, estado vazio, paginação, hover, bordas `#EAE4DA`, sombras, radius e ações discretas no mesmo padrão visual do Registro de compras.
- Escopo: mantive Firebase, coleções, busca, filtros, paginação, criação, edição e exclusão sem alteração de lógica.
- Validação realizada: `node --check js/modules/compras.js`.

## 2026-05-10 — Catálogo Avaliações fiel ao layout de Produtos
- Arquivos alterados: `js/modules/pedidos.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Catálogo > Avaliações.
- Resumo do ajuste: refinei a tela de Avaliações para copiar com mais fidelidade o layout e design de Catálogo > Produtos.
- Ajuste visual: página e cabeçalho usam as mesmas classes/estrutura, filtros mantêm card branco e densidade de Produtos, KPIs agora copiam altura, tipografia, ícones, cores, radius, sombra e hover dos cards de Produtos.
- Cards: os cards da listagem de avaliações receberam overflow, borda `#EAE4DA`, sombra premium e hover com elevação igual ao padrão; o estado vazio também virou card branco no mesmo estilo.
- Escopo: mantive Firebase, filtros, período, busca, aprovação, rejeição, abertura do detalhe e dados das avaliações sem alteração de lógica.
- Validação realizada: `node --check js/modules/pedidos.js`.

## 2026-05-10 — Compras Registro alinhado ao Catálogo Produtos
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Compras > Registro de compras.
- Resumo do ajuste: atualizei a tela de Registro de compras para copiar o padrão visual refinado de Catálogo > Produtos.
- Ajuste visual: cabeçalho com título/subtítulo e chips, botão primário no padrão, KPIs compactos com Material Icons e hover premium, filtros em card branco, seção `Compras registradas` e tabela com largura mínima, borda `#EAE4DA`, sombra e hover suave.
- Cards: os KPIs agora usam o mesmo layout, densidade, radius, sombra, ícone e comportamento visual dos cards de Catálogo > Produtos.
- Escopo: mantive Firebase, busca, filtros, período, ordenação, paginação, criação, edição, exclusão e vínculo financeiro sem alteração de lógica.
- Validação realizada: `node --check js/modules/compras.js`.

## 2026-05-10 — Produção Insumos alinhada ao Catálogo Produtos
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Produção > Insumos.
- Resumo do ajuste: atualizei a tela de Insumos para seguir o padrão visual refinado de Catálogo > Produtos, mantendo a implementação existente usada por `Compras._renderInsumos()`.
- Ajuste visual: cabeçalho com título/subtítulo e chips, KPIs compactos com hover premium, filtros em card branco, chips menores, seção `Insumos cadastrados` e tabela com borda `#EAE4DA`, hover suave, paginação e ações discretas.
- Escopo: mantive Firebase, coleções, filtros, paginação, criação, edição e exclusão sem alteração de lógica.
- Validação realizada: `node --check js/modules/compras.js`.

## 2026-05-10 — Produção Receitas alinhada ao novo padrão
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Produção > Receitas.
- Resumo do ajuste: atualizei a tela `Receitas de produção` para seguir o padrão visual aprovado em Programa de Pontos e Catálogo > Produtos, sem adicionar cards de KPI.
- Ajuste visual: cabeçalho com título/subtítulo e chips, filtros em card branco, seção `Receitas cadastradas`, tabela com borda `#EAE4DA`, hover suave, ações discretas e estado vazio refinado.
- Escopo: mantive Firebase, cálculo de ficha técnica, busca, paginação, criação, edição, visualização e exclusão sem alteração de lógica.
- Validação realizada: `node --check js/modules/catalogo.js`.

## 2026-05-10 — Catálogo Avaliações alinhada ao Programa de Pontos
- Arquivos alterados: `js/modules/pedidos.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Catálogo > Avaliações.
- Resumo do ajuste: atualizei a tela de Avaliações para seguir o mesmo padrão visual aprovado em Programa de Pontos e refinado em Catálogo > Produtos.
- Ajuste visual: cabeçalho com título/subtítulo e chips de resumo, KPIs compactos com Material Icons e hover com elevação/troca de fundo, filtros em card branco com chips abaixo e seção `Avaliações dos clientes`.
- Cards: os cards de avaliação agora têm borda suave `#EAE4DA`, hover premium, blocos internos em `#FAF8F4` e chips/status alinhados ao novo padrão.
- Escopo: mantive Firebase, filtros, moderação, aprovação, rejeição, abertura de detalhe e dados de avaliações sem alteração de lógica.
- Validação realizada: `node --check js/modules/pedidos.js`.

## 2026-05-10 — Refinamento fiel de Catálogo Produtos
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Catálogo > Produtos.
- Resumo do ajuste: refinei detalhes visuais para aproximar a tela de Produtos do padrão aprovado em Programa de Pontos.
- KPIs: troquei os ícones para Material Icons, igual ao padrão usado em Programa de Pontos, e adicionei hover com elevação, sombra e troca suave de fundo para dar o mesmo efeito visual ao passar o mouse.
- Listagem/cards: alinhei bordas dos chips para `#EAE4DA`, mantive hover suave nas linhas e adicionei hover real nos cards em grade.
- Escopo: alteração somente visual; sem mudanças em Firebase, dados, filtros, paginação ou ações de produto.
- Validação realizada: `node --check js/modules/catalogo.js`.

## 2026-05-10 — Catálogo Produtos alinhado ao Programa de Pontos
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Catálogo > Produtos.
- Resumo do ajuste: atualizei a hierarquia visual da tela de Produtos seguindo o padrão aprovado em Marketing > Programa de Pontos.
- Ajuste visual: cabeçalho com título/subtítulo e chips de resumo, KPIs mais compactos com hover premium, filtros em card branco, chips de contexto e seção `Produtos do cardápio` com subtítulo antes da listagem.
- Listagem: mantive a tabela/cards e ações existentes, refinando o encaixe visual, espaçamentos, sombras, bordas e densidade para aproximar do novo padrão.
- Escopo: mantive Firebase, coleções, busca, filtros, paginação, ordenação, criação, edição, duplicação, exclusão e lógica de produtos.
- Validação realizada: `node --check js/modules/catalogo.js`.

## 2026-05-10 — Remoção da lista Movimentos recentes
- Arquivos alterados: `js/modules/marketing.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Marketing > Programa de Pontos > Clientes e movimentos.
- Resumo do ajuste: removi o bloco visual `Movimentos recentes` e o texto `Acompanhe entradas, usos e expirações de pontos.` da subtab.
- Escopo: alteração somente visual; histórico e dados de movimentos seguem disponíveis no detalhe do cliente e sem alteração de Firebase, filtros ou regras.
- Validação realizada: `node --check js/modules/marketing.js`.

## 2026-05-10 — Clientes e movimentos do Programa de Pontos refinados
- Arquivos alterados: `js/modules/marketing.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Marketing > Programa de Pontos > Clientes e movimentos.
- Resumo do ajuste: refinei filtros, chips de resumo, tabela de clientes e tabela de movimentos recentes usando o padrão visual da listagem de Cardápio > Produtos.
- Clientes: adicionei avatar com iniciais, nome/e-mail com hierarquia, chip suave para pontos, ação `Ver` mais discreta e modal de detalhe com saldo, desconto estimado, histórico de movimentos e pedidos relacionados.
- Movimentos: transformei a lista em tabela refinada com chips por tipo, pontos positivos em verde, usos em vermelho suave e truncamento de pedidos longos com tooltip.
- Escopo: mantive Firebase, cálculos, histórico, regras, dados dos clientes e filtros existentes; alteração focada em layout, hierarquia e apresentação.
- Validação realizada: `node --check js/modules/marketing.js`.

## 2026-05-10 — Configuração do Programa de Pontos refinada
- Arquivos alterados: `js/modules/marketing.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Marketing > Programa de Pontos > Configuração.
- Resumo do ajuste: reorganizei a configuração em cards menores: `Identidade do programa`, `Como o cliente ganha pontos`, `Como o cliente usa os pontos` e `Validade e aplicação`.
- Ajuste visual: adicionei preview lateral `Prévia na loja`, rodapé interno de salvamento, estado visual para alterações pendentes e campos/copy no padrão de Catálogo > Produtos.
- Validade: adicionei o campo `Prazo para expirar` quando `Validade dos pontos` estiver como `Expiram`, com validação obrigatória e salvamento do prazo nas configurações.
- Regras de pontos: novos movimentos de ganho passam a salvar prazo/expiração quando configurado; o saldo disponível considera pontos expirados somente quando há prazo válido salvo, mantendo fallback seguro para configurações antigas sem prazo.
- Validação realizada: `node --check js/modules/marketing.js`.

## 2026-05-10 — Desempenho do Programa de Pontos alinhado ao Upsell
- Arquivos alterados: `js/modules/marketing.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Marketing > Programa de Pontos > Desempenho.
- Resumo do ajuste: levei a subtab `Desempenho` para o mesmo layout analítico usado em Marketing > Upsell, com filtro de período, KPIs compactos, card largo de evolução, cards de resumo e bloco de oportunidades.
- Ajuste visual: apliquei a mesma densidade, cards, sombras, bordas, radius, ícones, hover e hierarquia visual já usados no desempenho de Upsell.
- Escopo: mantive Firebase, coleções, dados existentes, cálculos de pontos e regras do programa; a alteração foi de apresentação da análise.
- Validação realizada: `node --check js/modules/marketing.js`.

## 2026-05-10 — Remoção do botão Configurar programa
- Arquivos alterados: `js/modules/marketing.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Marketing > Programa de Pontos.
- Resumo do ajuste: removi o botão `Configurar programa` do cabeçalho, mantendo o acesso à configuração pela subtab interna `Configuração`.
- Escopo: alteração somente visual, sem mudanças em Firebase, dados, cálculos ou regras do programa de pontos.
- Validação realizada: `node --check js/modules/marketing.js`.

## 2026-05-10 — Programa de Pontos com subtabs internas
- Arquivos alterados: `js/modules/marketing.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Marketing > Programa de Pontos.
- Resumo do ajuste: reorganizei a tela em subtabs internas `Desempenho`, `Configuração` e `Clientes e movimentos`, seguindo o padrão aplicado em Marketing > Upsell e a linguagem visual de Catálogo > Produtos.
- Desempenho: concentra KPIs principais, card `Resumo do programa` e card `Oportunidades`, sem deixar cards soltos ou blocos vazios.
- Configuração: reúne status, nome, texto da loja, regras de ganho/resgate, mínimos, limite, expiração, aplicação e botão `Salvar configuração` em cards/campos no padrão visual do sistema.
- Clientes e movimentos: adiciona busca, filtros de saldo/elegibilidade/movimentos, tabela de clientes e tabela de movimentos recentes com a mesma densidade, bordas, chips e hierarquia usadas nas telas padronizadas.
- Escopo: mantive coleções, dados existentes, cálculos, regras de pontos e comportamento de Firebase; o ajuste foi de interface, apresentação, filtros e organização visual.
- Validação realizada: `node --check js/modules/marketing.js`.

## 2026-05-10 — Sugestões de Upsell alinhada a Catálogo > Produtos
- Arquivos alterados: `js/modules/marketing.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Marketing/Ações de Vendas > Upsell > Sugestões.
- Resumo do ajuste: alinhei a subaba `Sugestões` ao layout visual de `Catálogo > Produtos`.
- Ajuste visual: adicionei cabeçalho interno, KPIs no padrão do Catálogo, filtro compacto sem labels pesados, tabela com borda suave, sombra e hover `#FBF8F2`.
- Escopo: mantive filtros, listagem, ações, modais e regras de upsell sem alteração de lógica ou dados.
- Validação realizada: `node --check js/modules/marketing.js`.

## 2026-05-10 — Subtab ativa de Upsell em vermelho
- Arquivos alterados: `js/modules/marketing.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Marketing/Ações de Vendas > Upsell.
- Resumo do ajuste: alterei a cor da subtab ativa `Desempenho/Sugestões` para vermelho no padrão do Catálogo, removendo o fundo escuro.
- Escopo: alteração somente visual no seletor interno de abas.
- Validação realizada: `node --check js/modules/marketing.js`.

## 2026-05-10 — Upsell com cores alinhadas ao Catálogo
- Arquivos alterados: `js/modules/marketing.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Marketing/Ações de Vendas > Upsell.
- Resumo do ajuste: ajustei as cores dos cards de desempenho para seguir a paleta visual de `Catálogo > Produtos`.
- Ajuste visual: KPIs usam os acentos de produto/categoria/visível/pedidos do Catálogo; cards auxiliares voltaram para base branca com borda suave e ícones em `#FAF8F4`.
- Escopo: alteração somente visual, sem mudanças em dados, métricas, Firebase ou lógica de upsell.
- Validação realizada: `node --check js/modules/marketing.js`.

## 2026-05-10 — Upsell separada em subtabs internas
- Arquivos alterados: `js/modules/marketing.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Marketing/Ações de Vendas > Upsell.
- Resumo do ajuste: separei a tela de Upsell em subtabs internas `Desempenho` e `Sugestões`, preservando a estrutura de dados e as funcionalidades existentes.
- Desempenho: mantém KPIs, funil, melhores resultados, alertas/oportunidades e filtro de período.
- Sugestões: concentra botão `Nova sugestão`, filtros, tabela/listagem e ações de visualizar, editar, pausar, duplicar e excluir.
- Ajuste visual: subtabs em pills discretas no padrão premium do sistema e chips de resumo no cabeçalho.
- Escopo: mantive Firebase, eventos, cálculos, tracking, criação, edição, exclusão e regras de upsell.
- Validação realizada: `node --check js/modules/marketing.js`.

## 2026-05-10 — Upsell refinada visualmente
- Arquivos alterados: `js/modules/marketing.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Marketing/Ações de Vendas > Upsell.
- Resumo do ajuste: refinei a percepção visual dos blocos já aprovados de Upsell sem reorganizar a tela.
- Ajustes: corrigi fallback do card `Melhor upsell`, redesenhei o funil com linha contínua, steps e taxas de passagem, reduzi a dominância do KPI de receita e aumentei a densidade dos cards.
- Insights: o bloco `Alertas e oportunidades` agora mostra mensagem estratégica conforme volume e comportamento das métricas disponíveis.
- Escopo: mantive Firebase, eventos, cálculos, métricas, tracking, filtros, listagem e regras existentes.
- Validação realizada: `node --check js/modules/marketing.js`.

## 2026-05-10 — Upsell reorganizada em blocos analíticos
- Arquivos alterados: `js/modules/marketing.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Marketing/Ações de Vendas > Upsell.
- Resumo do ajuste: reorganizei a tela de Upsell para reduzir excesso visual e melhorar a leitura, mantendo o padrão de `Cardápio > Produtos`.
- Layout: o cabeçalho agora usa título, subtítulo e botão `Nova sugestão`; a área analítica passou a ter 4 KPIs principais, card largo de funil, seção de melhores resultados e card único de alertas/oportunidades.
- Ajuste visual: removi a repetição de cards pequenos e textos auxiliares poluídos, evitando que nomes e labels quebrem de forma feia.
- Escopo: mantive métricas, cálculos, Firebase, filtros, listagem, modais e ações existentes.
- Validação realizada: `node --check js/modules/marketing.js`.

## 2026-05-10 — Upsell alinhada a Cardápio > Produtos
- Arquivos alterados: `js/modules/marketing.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Ações de Vendas > Upsell.
- Resumo do ajuste: apliquei o padrão visual de `Cardápio > Produtos`, com cabeçalho próprio, chips de resumo, KPIs, filtros em card branco, estado vazio e listagem principal em tabela compacta.
- Ajuste visual: os KPIs e cards analíticos usam radius, sombra, densidade, tipografia e cores semânticas alinhadas ao Catálogo; a listagem usa cabeçalho de tabela, chips de tipo/benefício/status e ações por ícones.
- Modais: atualizei a estrutura visual do modal de Upsell para largura `1120px`, cabeçalho, corpo, seções, labels, campos e rodapé no padrão usado nas abas já padronizadas.
- Escopo: mantive coleção `upsellRules`, eventos, cálculos de desempenho, filtros, busca, criação, edição, duplicação, ativação/pausa e exclusão.
- Validação realizada: `node --check js/modules/marketing.js`.

## 2026-05-10 — Cupons alinhada a Cardápio > Produtos
- Arquivos alterados: `js/modules/marketing.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Ações de Vendas > Cupons.
- Resumo do ajuste: apliquei o padrão visual real de `Cardápio > Produtos`, com cabeçalho próprio, KPIs, filtros em card branco, chips de resumo, estado vazio e listagem principal em tabela compacta.
- Ajuste visual: a tabela de cupons agora usa cabeçalhos, linhas clicáveis, ações por ícones, chips de tipo/status, bordas `#EAE4DA`, radius, sombras e densidade alinhados ao Catálogo.
- Modais: criei visualização e atualizei criação/edição para o padrão do modal de produto, com largura `1120px`, seções brancas com sombra, labels uppercase, campos padronizados e footer com botões consistentes.
- Escopo: mantive a coleção `coupons`, campos existentes, criação, edição, exclusão, contagem de usos e regras de validade/limite apenas como apresentação visual.
- Validação realizada: `node --check js/modules/marketing.js`.

## 2026-05-10 — Promoções alinhada a Cardápio > Produtos
- Arquivos alterados: `js/modules/marketing.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Ações de Vendas > Promoções.
- Resumo do ajuste: removi o cabeçalho/abas globais do módulo nessa entrada e apliquei o padrão visual usado em `Cardápio > Produtos`, com cabeçalho próprio, chips de resumo, KPIs, filtros em card branco, estado vazio e listagem principal em tabela.
- Ajuste visual: a listagem passou para a mesma estrutura de tabela compacta de Produtos, com cabeçalhos, linhas clicáveis, ícones de ação, chips/status, bordas, radius, sombras, densidade e hierarquia alinhados ao Catálogo.
- KPIs: os elementos gráficos dos cards agora usam cor de acordo com a informação exibida, com verde para ativas, tom de produto para itens em promoção, azul para agendadas e vermelho para expiradas.
- Modais: atualizei criar, editar e visualizar promoção para o padrão do modal de produto, com largura `1120px`, seções brancas com sombra, labels uppercase, campos com borda `#EAE4DA`, footer e botões no mesmo padrão.
- Escopo: mantive busca, filtros, carregamento, CRUD, duplicação, ativação/pausa, cálculos, preview, impacto e coleções existentes de promoções.
- Validação realizada: `node --check js/modules/marketing.js`.

## 2026-05-10 — Canais de venda movidos para Configurações
- Arquivos alterados: `js/modules/configuracoes.js`, `js/modules/dinheiro.js`, `AI_CHANGELOG.md`.
- Módulos afetados: Configurações > Canais de venda; Preços e Margem > Regras de preço.
- Resumo do ajuste: criei/ativei a aba `Canais de venda` em Configurações para cadastrar canais adicionais ao Cardápio. O canal `Cardápio` permanece automático e fixo do sistema.
- Regras de preço: removi o cadastro visual de canais nessa tela; agora ela apenas lista os canais vindos de Configurações e permite definir comissão, taxa fixa e imposto por canal. Os nomes ficam somente leitura.
- Dados: mantive o documento `config/canais_venda`, preservando taxas já existentes por nome de canal quando os canais são editados em Configurações.
- Validações realizadas: `node --check js/modules/configuracoes.js`; `node --check js/modules/dinheiro.js`.

## 2026-05-10 — Regras de preço alinhada às abas de Preços e Margem
- Arquivos alterados: `js/modules/dinheiro.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Preços e Margem > Regras de preço.
- Resumo do ajuste: apliquei o mesmo padrão visual usado nas abas Radar, Composição, Lista e Simulador, com cabeçalho próprio, cards brancos para regras gerais e canais, botões compactos e campos com bordas/radius/sombra consistentes.
- Escopo: mantive o salvamento em `config/dinheiro` e `config/canais_venda`, o canal fixo Cardápio e as ações de adicionar/remover canais.
- Validação realizada: `node --check js/modules/dinheiro.js`.

## 2026-05-10 — Simulador com cards fiscais em segunda linha
- Arquivos alterados: `js/modules/dinheiro.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Preços e Margem > Simulador.
- Resumo do ajuste: movi os cards de IVA e Imposto de renda para uma segunda linha de resultados e aumentei a largura mínima dos cards.
- Ajuste visual: reduzi levemente a fonte dos valores dos KPIs e permiti quebra controlada para evitar números cortados.
- Validação realizada: `node --check js/modules/dinheiro.js`.

## 2026-05-10 — Simulador alinhado a Cardápio > Produtos
- Arquivos alterados: `js/modules/dinheiro.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Preços e Margem > Simulador.
- Resumo do ajuste: apliquei o padrão visual de `Cardápio > Produtos`, com cabeçalho próprio, card de parâmetros, card de resultado, inputs e botões alinhados ao restante de Preços e Margem.
- Destaques analíticos: os resultados usam tons por gravidade para taxas, impostos, lucro negativo, margem abaixo da mínima e margem saudável.
- Escopo: mantive os cálculos de preço líquido, comissões, IVA, imposto de renda, lucro, margem e markup.
- Validação realizada: `node --check js/modules/dinheiro.js`.

## 2026-05-10 — Lista de Preço alinhada a Cardápio > Produtos
- Arquivos alterados: `js/modules/dinheiro.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Preços e Margem > Lista de Preço.
- Resumo do ajuste: apliquei o padrão visual de `Cardápio > Produtos`, com cabeçalho próprio, card de seleção de canal, chips de resumo, card principal branco e cards de produto com bordas, sombras, radius e tipografia consistentes.
- Escopo: mantive seleção de canal, preços calculados por canal e fluxo de impressão.
- Validação realizada: `node --check js/modules/dinheiro.js`.

## 2026-05-10 — Composição do Preço alinhada a Cardápio > Produtos
- Arquivos alterados: `js/modules/dinheiro.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Preços e Margem > Composição do Preço.
- Resumo do ajuste: apliquei o mesmo padrão visual usado em `Cardápio > Produtos`, com cabeçalho próprio, card de busca/resumo, tabela branca com bordas suaves, hover, tipografia e chips/status consistentes.
- Destaques analíticos: margem, lucro e status mantêm cores por gravidade para facilitar leitura de prejuízo, margem baixa, atenção e saúde.
- Escopo: mantive cálculos, filtros vindos do Radar, busca, abertura do modal e salvamento de preço.
- Validação realizada: `node --check js/modules/dinheiro.js`.

## 2026-05-10 — Radar de Preços e Margem alinhado a Cardápio > Produtos
- Arquivos alterados: `js/modules/dinheiro.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Preços e Margem > Radar.
- Resumo do ajuste: levei o Radar para o mesmo padrão estrutural e visual de `Cardápio > Produtos`, com contêiner sem cabeçalho global, cabeçalho próprio da tela, KPIs com sombra/radius/densidade equivalentes, seções em cards brancos e ações no padrão de botões existente.
- Destaques analíticos: os cards do Radar agora usam tons por gravidade do dado apresentado, diferenciando risco crítico, alerta, saúde de margem e estados neutros.
- Escopo: mantive os cálculos, dados, canais, prioridades e navegação existentes; alterei apenas apresentação visual.
- Validação realizada: `node --check js/modules/dinheiro.js`.

## 2026-05-10 — Compras com estrutura principal igual ao Catálogo
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Compras.
- Resumo do ajuste: removi o cabeçalho global com os textos `Compras` e `Registre compras, organize fornecedores e acompanhe contas geradas para o Financeiro.`, além da barra de abas interna do módulo, deixando o contêiner principal no mesmo padrão estrutural de `Cardápio/Catálogo`.
- Escopo: mantive rotas, subtelas, filtros, paginação e ações existentes.
- Validação realizada: `node --check js/modules/compras.js`.

## 2026-05-10 — Compras sem cards e imagens nas listagens solicitadas
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Compras > Fornecedores e Compras > Produtos / Insumos.
- Resumo do ajuste: removi os cards de KPI da aba Fornecedores e retirei os blocos visuais com ícones/imagens das linhas das listagens de Fornecedores e Produtos/Insumos.
- Escopo: mantive filtros, resumo textual, paginação e ações existentes.
- Validação realizada: `node --check js/modules/compras.js`.

## 2026-05-10 — Compras > Configurações alinhada a Cardápio > Configurações
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`.
- Módulo afetado: Compras > Configurações.
- Resumo do ajuste: reestruturei a aba de configurações de Compras para seguir o padrão visual real de `Cardápio > Configurações`, com cabeçalho, subtabs, filtros, lista em cards, chips, botões, paginação e modal no mesmo estilo.
- Escopo: mantive as coleções `compras_tipos` e `compras_categorias`, a busca, filtros, paginação e ações de criar, editar e excluir.
- Validação realizada: `node --check js/modules/compras.js`.

## 2026-05-10 — Destaques automáticos conectados ao template público
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Cardápio > Template da loja.
- Resumo do ajuste: corrigi a conexão do toggle `Usar produtos marcados para destaque` no template público, carregando `showFeaturedProducts` da configuração salva em `config/template`.
- Impacto esperado: ao ativar o campo no Template da loja, produtos marcados como destaque no cadastro passam a aparecer na vitrine pública de destaques, respeitando a lógica já existente de até 3 itens.
- Validação realizada: script inline de `index.html` validado com Node.

## 2026-05-10 — Idiomas do Template da loja alinhados ao público
- Arquivos alterados: `js/modules/catalogo.js`, `index.html`, `AI_CHANGELOG.md`.
- Módulo afetado: Cardápio > Template da loja.
- Resumo do ajuste: alinhei o campo `Idioma principal da loja` aos idiomas suportados diretamente pelo template público (`pt-BR`, `pt-PT`, `es-ES`, `en`, `fr`) e removi da seleção administrativa opções que não existiam como idioma direto no público.
- Conexão com o template público: o salvamento agora normaliza o idioma antes de gravar em `language`, `defaultLanguage`, `mainLanguage` e `storeLanguage`, enquanto o template público também normaliza aliases antigos (`en-US` para `en`, `ca-ES` para `es-ES`) antes de aplicar desktop/mobile.
- Impacto esperado: lojas novas e existentes passam a usar a mesma lista de idiomas no admin e no template público, evitando idioma salvo sem tradução direta e mantendo compatibilidade com valores antigos.
- Validações realizadas: `AGENTS.md` lido; alterações restritas aos arquivos necessários; `node --check js/modules/catalogo.js`; validação do script inline de `index.html` com Node; busca confirmou a lista pública canônica e a normalização de aliases.

## 2026-05-09 — Tipografia de Configurações alinhada às outras abas de Produção
- Arquivos alterados: `js/modules/receitas.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: alinhei o cabeçalho de `Produção > Configurações` à mesma escala tipográfica das abas `Receitas` e `Insumos`, usando `h1` no título principal.
- Escopo: alterei apenas a tag e a consistência tipográfica do cabeçalho; mantive o layout e a lógica intactos.

## 2026-05-09 — Cabeçalho de Configurações da produção padronizado
- Arquivos alterados: `js/modules/receitas.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: alinhei o cabeçalho de `Produção > Configurações` ao padrão das telas de `Receitas` e `Insumos`, com CTA dinâmico conforme a subtaba ativa.
- Escopo: mantive a estrutura das abas, listas e ações; alterei apenas a copy do topo e o texto do botão principal.

## 2026-05-09 — Cabeçalho de Insumos padronizado com Produção > Receitas
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: alinhei o cabeçalho de `Produção > Insumos` ao mesmo formato visual e textual de `Produção > Receitas`, com label `Produção`, título `Insumos`, subtítulo focado em insumos e botão `+ Novo insumo`.
- Escopo: mantive filtros, tabela, paginação e ações da listagem; alterei apenas o cabeçalho da tela.

## 2026-05-09 — Cabeçalho de Receitas de produção ajustado
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: atualizei o cabeçalho da tela de receitas para `Produção` / `Receitas de produção`, com o subtítulo focado em fichas técnicas, rendimento, ingredientes e custo real.
- Escopo: mantive a estrutura da tela, a tabela, os filtros, a paginação e as ações; alterei apenas a copy do cabeçalho.

## 2026-05-09 — Cabeçalho textual removido da tela principal de Produção
- Arquivos alterados: `js/modules/receitas.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: removi completamente o cabeçalho textual da tela principal de `Produção`, incluindo label, título e subtítulo.
- Escopo: mantive a navegação e o conteúdo interno do módulo; alterei apenas o topo da página.

## 2026-05-09 — Produção e Insumos sem duplicidade visual
- Arquivos alterados: `js/modules/receitas.js`, `js/modules/compras.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: corrigi o topo do módulo para mostrar apenas `Produção` e alinhei a tela `Insumos` para remover o cabeçalho vazio e o espaço morto no topo.
- Escopo: mantive a lógica das telas; alterei apenas os textos e o alinhamento visual do cabeçalho.

## 2026-05-09 — Cabeçalho textual removido da tela Insumos
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: removi o texto visível do cabeçalho da tela `Insumos` no módulo de Compras, mantendo apenas a ação de adicionar.
- Escopo: mantive a listagem e a lógica da tela; alterei apenas a copy superior.

## 2026-05-09 — Produção com título Receitas e subtítulo ajustado
- Arquivos alterados: `js/modules/receitas.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: deixei o topo do módulo com rótulo `Produção`, título `Receitas` e o subtítulo `Fichas técnicas, insumos, componentes e unidades usadas na produção.`
- Escopo: alterei apenas o cabeçalho principal para refletir a hierarquia correta pedida pelo usuário.

## 2026-05-09 — Produção com cabeçalho restaurado e contexto de Configurações
- Arquivos alterados: `js/modules/receitas.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: restabeleci o cabeçalho principal do módulo como `Produção` com a hierarquia visual de `Produtos` e reintroduzi o rótulo `Configurações` no bloco das configurações.
- Escopo: mantive a navegação e as listas internas; alterei apenas o topo e o contexto textual da área de configuração.

## 2026-05-09 — Cabeçalho textual removido da tela principal de Produção
- Arquivos alterados: `js/modules/receitas.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: removi o bloco textual superior da tela principal de `Produção`, eliminando label, título e subtítulo visíveis no topo.
- Escopo: mantive a navegação e o conteúdo interno do módulo; alterei apenas o cabeçalho visual da página.

## 2026-05-09 — Produção com hierarquia tipográfica alinhada a Produtos
- Arquivos alterados: `js/modules/receitas.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: alinhei a hierarquia tipográfica do topo de `Produção` ao padrão de `Produtos`, mantendo label, título e subtítulo no mesmo ritmo visual.
- Escopo: alterei apenas a copy do subtítulo e preservei a estrutura atual da tela.

## 2026-05-09 — Produção sem abas e título atualizado
- Arquivos alterados: `js/modules/receitas.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: removi a visão em abas do módulo de Produção e atualizei o título visível do módulo para `Produção`.
- Escopo: mantive as telas internas e a navegação por rota para compatibilidade; alterei apenas a apresentação principal do módulo.

## 2026-05-09 — Produção > Configurações alinhada ao padrão de Cardápio
- Arquivos alterados: `js/modules/receitas.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: removi o card extra de cabeçalho da área de `Configurações` em Produção e alinhei os botões de ação à esquerda, seguindo o mesmo padrão visual usado em `Cardápio > Configurações`.
- Escopo: mantive a navegação, as listas e os modais; alterei apenas a estrutura visual dos blocos de configuração.

## 2026-05-09 — Botão de Tags alinhado à esquerda em Configurações
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reposicionei o botão `+ Adicionar tag` para o lado esquerdo da tela, no mesmo alinhamento visual usado em `Variantes`.
- Escopo: mantive a lógica do modal e a listagem; alterei apenas o alinhamento da ação no topo da aba.

## 2026-05-09 — Emojis removidos dos estados vazios de Configurações
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: removi os emojis dos estados vazios das abas `Categorias`, `Variantes` e `Tags` em `Cardápio > Configurações`.
- Escopo: mantive as mensagens de vazio e a estrutura das abas; alterei apenas a apresentação visual do empty state.

## 2026-05-09 — Botão de Tags alinhado ao padrão de Configurações
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: alinhei o botão de `Tags` ao mesmo padrão usado em `Categorias` e `Variantes`, com botão textual `+ Adicionar tag` no mesmo tamanho e linguagem visual.
- Escopo: mantive a lógica de abertura do modal e a listagem das tags; alterei apenas a ação visível do topo.

## 2026-05-09 — Cabeçalho de Tags removido em Cardápio > Configurações
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: removi o cabeçalho textual da tela de `Tags` em `Cardápio > Configurações` e converti a ação de nova tag para um botão compacto com ícone.
- Escopo: mantive a lista, os botões de editar/excluir e a lógica de cadastro; alterei apenas a copy visível do topo.

## 2026-05-09 — Cabeçalho de Grupos de Variantes removido em Cardápio > Configurações
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: removi o texto de cabeçalho da tela de `Grupos de Variantes` dentro de `Cardápio > Configurações`.
- Escopo: mantive a estrutura, a lista e as ações da tela; alterei apenas a copy visível do topo.

## 2026-05-09 — Cabeçalho de Categorias removido em Cardápio > Configurações
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: removi os textos `Configurações`, `Categorias` e a descrição do bloco de cabeçalho na tela de `Categorias` dentro de `Cardápio > Configurações`.
- Escopo: a estrutura e as ações da tela foram mantidas; alterei apenas a copy visível do cabeçalho.

## 2026-05-09 — Receitas com filtros e paginação no padrão de Insumos
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: alinhei a aba `Receitas` ao mesmo padrão aplicado em `Insumos`, com campos do filtro mais compactos, paginação dentro do card e listagem com borda externa.
- Leitura visual: a tela ficou mais consistente com o padrão das demais tabelas premium do módulo, sem mexer na lógica de receitas.

## 2026-05-09 — Insumos com filtros e paginação no padrão de Receitas
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: compacteis os campos do filtro de `Insumos` para caberem em uma linha, movi a paginação para dentro do card de filtros e deixei a listagem com borda completa.
- Leitura visual: a área de `Insumos` agora fica mais próxima da composição usada em `Receitas`, sem duplicar controles de paginação.

## 2026-05-09 — Insumos sem imagem e filtro no padrão de Receitas
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: removi a imagem da listagem de `Insumos` e reacomodei o card de filtros para seguir mais de perto o padrão visual da aba `Receitas`.
- Leitura visual: a listagem ficou mais limpa e o filtro perdeu aparência de formulário pesado, sem alterar a lógica de busca ou paginação.

## 2026-05-09 — Insumos igualados ao padrão de Receitas
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: alinhei o filtro e a listagem de `Insumos` ao mesmo padrão visual de `Receitas`, removendo rótulos visíveis no card de filtro e trocando o cabeçalho da tabela para o estilo branco com títulos em maiúsculas.
- Leitura visual: a tela ficou mais limpa, mais próxima da composição usada em `Receitas`, sem alterar a lógica de cadastro ou filtragem.

## 2026-05-09 — Insumos alinhados ao padrão visual de Produtos
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reestruturei a aba `Insumos` para seguir o mesmo padrão visual da aba `Produtos`, com cabeçalho limpo, barra de filtros premium e tabela em cards brancos com hover suave.
- Modais: o modal de `Editar Insumo` e os cadastros de `Produto/Insumo` ficaram com cards brancos, sombra leve e organização mais próxima do padrão de produto.

## 2026-05-09 — Modal Editar Receita alinhado ao padrão de Editar Produto
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reestruturei o modal `Editar Receita` para seguir o mesmo padrão visual do modal de `Editar Produto`, com cards brancos, títulos simples, sombras suaves e largura maior.
- Organização: removi a numeração das seções e deixei a hierarquia visual mais próxima da usada em `Produtos`.

## 2026-05-09 — Receitas sem KPIs e com listagem mais fiel a Produtos
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: removi os cards de KPI da aba `Receitas` e simplifiquei a superfície da página para seguir o padrão da tela `Produtos`.
- Listagem: a tabela de receitas foi aproximada da linguagem visual de `Produtos`, com cabeçalho em maiúsculas, linha separadora fina, ações discretas e busca em card branco.

## 2026-05-09 — Receitas alinhadas ao padrão visual de Produtos
- Arquivos alterados: `js/modules/catalogo.js`, `js/modules/receitas.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: levei a aba `Receitas` para o mesmo padrão visual da aba `Produtos`, com listagem em tabela premium, métricas no topo, busca em card limpo e ações mais discretas.
- Modais: o resumo e a edição da receita foram refeitos com cards brancos, sombra suave e hierarquia tipográfica mais consistente.

## 2026-05-09 — Avaliações: modal e listagem no padrão de Produtos
- Arquivos alterados: `js/modules/pedidos.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: alinhei o modal `Resumo da Avaliação` ao mesmo padrão visual do modal de editar produto, com cards brancos, sombra suave, campos em coluna e ações de moderação mais claras.
- Listagem: reorganizei os cards de avaliações para leitura vertical, com títulos, campos em coluna, chips discretos e botões `Aprovar` e `Rejeitar` com cores específicas.

## 2026-05-09 — Produtos em destaque conectados ao template público
- Arquivos alterados: `js/modules/catalogo.js`, `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: adicionei o campo `Selecionar para destaque` no cadastro de produto, gravei o flag `featured` no produto e conectei a listagem ao mesmo estado de destaque.
- Template público: a seção de destaques da vitrine agora pode usar automaticamente os produtos marcados no cadastro quando o toggle `Usar produtos marcados para destaque` estiver ativo.

## 2026-05-09 — Aba Template da loja atualizada
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: atualizei a aba `Template da loja` para seguir o novo padrão visual do painel, com cards brancos, bordas suaves, sombras premium leves, tipografia mais contida e preview da loja alinhado ao restante do sistema.

## 2026-05-09 — Listagem de produtos alinhada ao padrão do painel
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: refinei a listagem de `Produtos` para ficar mais alinhada ao padrão visual atual do painel, com linhas mais suaves, hover discreto, chips e textos secundários mais consistentes e cards de grade com acabamento mais premium.

## 2026-05-09 — Modal de produto sem preview do cliente
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: removi a coluna de `Preview do cliente` do modal de edição de produto, deixando o formulário ocupar a largura completa sem alterar a lógica de edição.

## 2026-05-09 — KPI de Avaliações igualado ao KPI de Produtos
- Arquivos alterados: `js/modules/pedidos.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: alinhei o KPI da aba `Avaliações` ao mesmo molde visual do KPI de `Produtos`, com a mesma caixa, ícone, tipografia, peso e proporção.

## 2026-05-09 — Cardápio > Avaliações alinhado ao padrão exato de Produtos
- Arquivos alterados: `js/modules/pedidos.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: refinei novamente a aba `Avaliações` para seguir com mais fidelidade o padrão visual da tela `Produtos`, ajustando KPI, filtros, chips, cards e modal com as mesmas superfícies, pesos e bordas usadas no módulo `Cardápio`.
- Compatibilidade: mantive a lógica de moderação e carregamento das avaliações intacta; o trabalho foi apenas de refinamento visual.

## 2026-05-09 — Cardápio > Avaliações no novo design system
- Arquivos alterados: `js/modules/pedidos.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: atualizei a aba `Avaliações` do `Cardápio` para seguir o novo BocaFood Design System, com tipografia Manrope, superfícies brancas, bordas suaves, sombras premium leves e chips/botões discretos.
- Escopo visual: refinei o carregamento, o cabeçalho, os KPIs, os filtros, as cards de avaliação e o modal de detalhe sem mexer na lógica de moderação.

## 2026-05-09 — SEO separado em comercial e técnico
- Arquivos alterados: `js/modules/catalogo.js`, `master.html`, `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reorganizei `Cardápio > SEO da loja` para exibir apenas campos comerciais para a usuária, com cards de `Aparência no Google`, `SEO local`, `Compartilhamento` e `Status técnico` somente leitura.
- Master: movi o bloco `SEO técnico da loja` para o modal de cada tenant, mantendo slug, canonical, robots, sitemap, schema e status de publicação dentro do cadastro do tenant.
- Publicação: a loja pública agora carrega `config/seoTechnical` além de `config/seo`, mantendo compatibilidade com os dados antigos e preparando o fluxo técnico separado.

## 2026-05-09 — Card principal mobile: logo com fundo branco
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: no mobile, o logo do card principal voltou ao visual anterior com fundo branco circular e borda/sombra, mantendo a versão desktop sem moldura.

## 2026-05-09 — Card WhatsApp da loja em coluna uniforme
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reorganizei o card `WhatsApp da loja` para exibir `Texto ao passar o mouse` e `Mensagem do botão flutuante do WhatsApp` um abaixo do outro, com a mesma largura visual.

## 2026-05-09 — Card Mais informações em coluna uniforme
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reorganizei o card `Mais informações` no Template da loja para exibir os campos um abaixo do outro, todos com a mesma largura e limite visual consistente.

## 2026-05-09 — Logo do card principal sem moldura
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: removi fundo, borda, padding, raio e sombra do logo do card principal da loja pública nas variações desktop/mobile, preservando transparência de PNG/WebP/SVG quando houver.

## 2026-05-09 — Logo do menu superior sem moldura
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: removi fundo, borda, padding e recorte do logo inserido no menu superior da loja pública, preservando transparência de PNG/WebP/SVG quando houver.

## 2026-05-09 — Loja pública: favicon do Template e logo no menu superior
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: a loja pública agora prioriza `config/template.faviconUrl` e `config/template.logoUrl` ao carregar o tenant, garantindo que as imagens subidas no Template sejam usadas antes dos valores antigos de `geral`.
- Menu superior: inseri o logo no início da navegação superior, à esquerda dos textos do menu, usando fallback visual se a imagem falhar.

## 2026-05-09 — Template da loja: card Mais informações
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: renomeei o card `Textos institucionais` para `Mais informações`, atualizei o subtítulo e reorganizei os campos em duas linhas: `Sobre a loja` maior com `Aviso importante` menor, depois `Política de entrega` e `Política de cancelamento`.
- Compatibilidade: removi o campo visível `Texto de rodapé` do card, mantendo o valor em campo oculto para preservar a lógica de salvamento existente e não apagar dados já salvos.

## 2026-05-09 — WhatsApp flutuante: texto do hover editável
- Arquivos alterados: `js/modules/catalogo.js`, `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: adicionei no card `WhatsApp da loja` o campo `Texto ao passar o mouse`, persistido como `whatsappTooltip`/`whatsappFloatingLabel`. A loja pública aplica esse texto no balão e no `title` do botão flutuante, com fallback seguro quando vazio.

## 2026-05-09 — Template da loja: Finalização do pedido e WhatsApp separados
- Arquivos alterados: `js/modules/catalogo.js`, `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: separei o antigo card `Finalização do pedido` em dois cards: checkout/carrinho e `WhatsApp da loja`, movendo a mensagem do botão flutuante para o novo card.
- Integração: a loja pública agora usa `whatsappMessage` exatamente no botão flutuante do WhatsApp, com mensagem padrão segura quando vazio. Também aplica `mainButtonText`, `checkoutWarning`, `allowCustomerNote` e `allowCoupon` no carrinho/checkout.

## 2026-05-09 — Pagamentos exibidos na loja integrados ao Financeiro
- Arquivos alterados: `js/modules/catalogo.js`, `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: o card `Pagamentos exibidos na loja` agora lista as formas cadastradas em `Configurações > Financeiro`, com toggle por forma para definir disponibilidade na loja e campo opcional de instruções adicionais por opção.
- Integração: a loja pública usa apenas os métodos ativos, exibe as instruções da opção selecionada no checkout e grava pedidos com `paymentMethod` e `paymentInstructions`, além de manter `payment` para compatibilidade.

## 2026-05-09 — Rodapé público: contatos com dados clicáveis
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: os contatos do rodapé agora exibem o rótulo traduzido e o dado real cadastrado no Template da loja dentro do link, em vez de mostrar apenas o nome do canal. WhatsApp, telefone e e-mail usam `wa.me`, `tel:` e `mailto:`; Instagram, Facebook e TikTok exibem usuário/link normalizado e abrem a rede correspondente.

## 2026-05-09 — Template público: texto de retirada/entrega traduzível
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: no bloco abaixo do carrinho, troquei `Recogida en La Rochapea o entrega` por `Recogida o entrega` e converti o texto para `data-i18n`, com traduções para pt-BR, pt-PT, es-ES, en e fr conforme o idioma do template.

## 2026-05-09 — Card principal mobile e endereço de retirada
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: as pílulas `Entrega` e `Recogida/Retirada` do card principal deixam de usar texto compacto no mobile e passam a renderizar o mesmo conteúdo usado no desktop.
- Retirada: o endereço exibido no carrinho para `Recogida` agora prioriza o endereço cadastrado no `Template da loja > Endereço`, usando bairro/cidade do mesmo card para a linha complementar.

## 2026-05-09 — Retirada: capacidade aplicada ao selecionar e envio sem chave técnica
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: após selecionar `Retirada`, o select de horários agora reaplica imediatamente o filtro de capacidade baseado em pedidos reais, evitando que `fillSlot()` mostre horários já lotados. A mesma reaplicação foi adicionada após validar CEP na entrega.
- Compatibilidade: a contagem de capacidade também lê pedidos legados/manuais com `slot` ou `slotLabel` quando houver data no texto, além dos campos explícitos de data/hora. A mensagem de horário lotado no envio foi trocada por texto público em espanhol.

## 2026-05-09 — Carrinho: agenda completa e capacidade baseada em pedidos
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: removi os limites artificiais que encerravam a lista de horários após poucos slots, permitindo exibir todos os dias/horários dentro de `maxAdvanceDays`/`advanceDaysLimit`.
- Capacidade: a disponibilidade de horários agora conta pedidos reais da coleção `orders`, usando `slotKey` ou os campos `deliveryDate`/`deliveryTime`, `pickupDate`/`pickupTime`, `scheduleDate`/`scheduleTime` e `fulfillmentDate`/`fulfillmentTime`, considerando todos os canais e ignorando pedidos cancelados. `orderSlots` permanece apenas como fallback enquanto a leitura de pedidos ainda não carregou.
- Registro do pedido: pedidos feitos pela loja pública agora gravam `deliveryDate`, `deliveryTime`, `deliveryDateISO`, `scheduleDate`, `scheduleTime`, `fulfillmentDate`, `fulfillmentTime` e, em retirada, também `pickupDate`/`pickupTime`.

## 2026-05-09 — Capacidade e prazos: texto e agendamento com preparo/capacidade
- Arquivos alterados: `js/modules/catalogo.js`, `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: atualizei o texto de ajuda de `Dias mínimos de antecedência` no card `Capacidade e prazos`. Também ajustei a geração de horários da loja pública para aplicar o tempo de preparo a partir da abertura de cada faixa, impedindo agendamento exatamente no horário de abertura quando há preparo configurado.
- Capacidade: corrigi `slotToKey()` para aceitar tanto valores do select (`0_10:45`) quanto chaves já normalizadas (`2026-05-09_10:45`), garantindo que o limite de `Pedidos por hora` seja checado e incrementado na mesma chave após a entrada do pedido.

## 2026-05-09 — Template da loja: correção do card Zonas de entrega
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: corrigi o rascunho interno das zonas para que `+ Adicionar zona` renderize uma nova zona vazia imediatamente, `Excluir` peça confirmação e persista a remoção, e o salvamento valide nome, CEPs, valor decimal e duplicidade de CEP apenas entre zonas ativas.
- Integração preservada: as zonas continuam sendo salvas em `config/template.deliveryZones` e `config/zonas`, com `active` booleano e `deliveryFee` numérico, mantendo a leitura atual da loja pública/carrinho para chips de entrega e cálculo por CEP.
- Layout: alinhei os campos do card, reduzi o botão `Excluir` e deixei o toggle `Ativa` mais compacto no padrão visual existente.

## 2026-05-08 — Horários e status: uma linha por dia no desktop
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reorganizei a seção `Horários e status` para que cada dia fique em uma linha horizontal mais compacta no desktop, com `Fechada`, `Abre`, `Fecha`, `2º período`, `Abre 2` e `Fecha 2` no mesmo bloco. O segundo período continua ocultável quando desativado e a lógica/persistência dos horários foi mantida.
- Escopo preservado: não alterei regras públicas, rotas nem outros cards do template.

## 2026-05-08 — Horários e status: blocos compactos e segundo período mais claro
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reorganizei a seção `Horários e status` para ficar mais compacta, com linha principal por dia, toggle `Fechada`, toggle `2º período` e segunda linha só quando necessário para `Abre 2` e `Fecha 2`. O estado fechado agora oculta os campos dependentes e os toggles seguem o padrão visual do BocaFood.
- Escopo preservado: mantive a persistência e a lógica atual dos horários, sem alterar regras públicas nem outros cards.

## 2026-05-08 — Template da loja: card principal com toggles no lugar de checkboxes
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: troquei os controles marcados/desmarcados do card `Card principal da loja` por toggles switch no padrão visual do BocaFood. A mudança é só visual; a persistência e a lógica de exibição continuam iguais.
- Escopo preservado: não alterei regras do template, dados antigos, nem outros checkboxes do formulário.

## 2026-05-08 — Template da loja: segunda faixa de horário e resumo operacional no topo
- Arquivos alterados: `js/modules/catalogo.js`, `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: adicionei uma segunda faixa de horário editável no card `Horários e status`, salvei `open2/close2/enabled2` na configuração e passei o template público a ler essa estrutura. Também corrigi o resumo de horários do topo para mostrar horários reais e não repetir o status, além de manter o comportamento no card principal desktop/mobile.
- Escopo preservado: não alterei rotas, regras de pedido, carrinho nem a estrutura geral do template.

## 2026-05-08 — Template da loja: novo card principal configurável
- Arquivos alterados: `js/modules/catalogo.js`, `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: criei o card `Card principal da loja` no `Template da loja` para controlar a visibilidade de logo, nome, slogan, botão de informações, localização, status, horário resumido e chips de entrega/retirada. O template público passou a respeitar essas flags no card principal, com fallback seguro para lojas antigas.
- Escopo preservado: não alterei persistência antiga nem a estrutura geral do template fora do topo principal.

## 2026-05-08 — Template da loja: card de entrega e retirada reorganizado
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reestruturei o card `Entrega e retirada` em blocos internos para modos de atendimento, capacidade e prazos, configurações da entrega e configurações da retirada. Também renomeei `Dias de antecedência` para `Dias mínimos de antecedência` e adicionei ajuda contextual aos campos.
- Escopo preservado: mantive a persistência atual, sem refatorar outros módulos nem alterar a lógica de publicação.

## 2026-05-08 — Template da loja: correção do `cfg` indefinido no salvar
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: removi as referências a `cfg` que quebravam `_saveTemplateLoja()` e o preview do favicon no módulo de admin. O salvamento agora usa apenas estado local do template e configs carregadas do próprio admin, eliminando o `ReferenceError` no botão salvar.
- Escopo preservado: não alterei rotas, persistência, dados antigos nem a estrutura geral do formulário.

## 2026-05-08 — Template da loja: salvar reforçado por delegação no root
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: adicionei delegação de clique no `catalogo-root` para os botões de salvar do `Template da loja` e do `SEO`, reduzindo a dependência de listeners atrelados ao conteúdo re-renderizado.
- Escopo preservado: não alterei persistência, rotas, dados nem o conteúdo do formulário.

## 2026-05-08 — Template da loja: salvar reativado com listener explícito
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: removi a dependência do `onclick` inline dos botões de salvar do `Template da loja` e do `SEO`, substituindo por listeners explícitos após o render. Isso reativa o clique mesmo quando o conteúdo é re-renderizado dinamicamente.
- Escopo preservado: não alterei persistência, rotas, dados nem a lógica de salvamento.

## 2026-05-08 — Entrega e retirada: limite de antecedência para pedidos
- Arquivos alterados: `index.html`, `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: adicionei `Dias de antecedência` em `Entrega e retirada` e passei a considerar esse limite na geração dos horários, na validação do carrinho e no envio final do pedido. Os slots agora respeitam a antecedência máxima configurada.
- Escopo preservado: mantive o restante da lógica de entrega, retirada, capacidade por hora e pedido mínimo sem refatoração fora do escopo.

## 2026-05-08 — Template da loja: botão salvar blindado contra submit acidental
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: converti os botões de salvar do `Template da loja` e do `SEO` para `type="button"` e passei o clique a retornar `false`, evitando submit acidental ou comportamento de formulário implícito.
- Escopo preservado: não alterei persistência, rotas, dados nem a lógica de salvamento em si.

## 2026-05-08 — Entrega e retirada: horários agora consideram preparo, entrega e capacidade por hora
- Arquivos alterados: `index.html`, `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: adicionei `Pedidos por hora` na seção `Entrega e retirada`, centralizei a leitura do pedido mínimo e passei a calcular os horários disponíveis com base no tempo médio de preparo e no tempo médio de entrega. A ocupação dos slots agora é controlada por hora.
- Escopo preservado: não alterei rotas, persistência global, outros módulos nem a lógica do carrinho fora da regra de disponibilidade de horários.

## 2026-05-08 — Carrinho: mínimo do pedido centralizado nas regras de entrega
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: centralizei a leitura do valor de pedido mínimo com fallback entre `minimumDeliveryOrder` e `minDeliveryOrder`, apliquei essa regra no carrinho, no aviso visual e na validação de envio do pedido.
- Escopo preservado: mantive pickup sem bloqueio por mínimo, sem alterar persistência, rotas ou outros módulos.

## 2026-05-08 — Entrega e mobile: taxa removida, tempos em select e chips ajustados
- Arquivos alterados: `js/modules/catalogo.js`, `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: removi `Taxa de entrega padrão` da seção `Entrega e retirada`, transformei `Tempo médio de preparo` e `Tempo médio de entrega` em listas selecionáveis e reativei no mobile o chip de `Pedido mínimo` junto com o chip de preparo no card principal.
- Escopo preservado: mantive compatibilidade com dados antigos e não alterei outros módulos nem a lógica geral da loja.

## 2026-05-08 — Template da loja: Identidade visual antes do topo
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reordenei a seção do `Template da loja` para exibir `Identidade visual` como primeiro card, antes de `Topo da loja`, sem alterar os campos ou a persistência.
- Escopo preservado: mantive intactos os demais blocos do formulário e a lógica de salvamento.

## 2026-05-08 — Identidade visual: descrição da loja removida da seção
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: removi o campo `Descrição da loja` da seção `Identidade visual` para manter o bloco focado apenas nos dados visuais e públicos realmente usados no template.
- Escopo preservado: mantive a persistência compatível, sem alterar regras globais, módulos não relacionados ou o restante do template público.

## 2026-05-08 — Público: hover do botão Mais informações em vermelho claro
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: ajustei o hover do botão `Más información`/`Mais informações` nas duas versões para um vermelho claro suave, mantendo o estado normal neutro.
- Escopo preservado: não alterei lógica, dados, desktop/mobile além do estilo do botão, nem outros componentes do template.

## 2026-05-08 — Público mobile: card principal mais branco e título mais próximo da logo
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: deixei o card principal mobile mais branco, reduzi a presença do degradê e aproximei um pouco mais o título da logo para reforçar a hierarquia visual.
- Escopo preservado: não alterei desktop, lógica, dados, tenant, carrinho, pedidos, WhatsApp, idioma nem a estrutura geral do template.

## 2026-05-08 — Público mobile: card principal branco com degradê leve
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: deixei o card principal mobile mais branco com degradê suave, subi um pouco o bloco, aproximei o título da logo e aumentei a presença visual da logo.
- Escopo preservado: não alterei desktop, lógica, dados, tenant, carrinho, pedidos, WhatsApp, idioma nem a estrutura geral do template.

## 2026-05-08 — Público mobile: nome público e frase curta no card principal
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reexibi no card principal mobile o nome público da loja e a frase curta abaixo da logo, com o nome recebendo mais destaque para ficar mais próximo da hierarquia usada no desktop.
- Escopo preservado: não alterei a lógica de dados, persistência, desktop, Admin, carrinho, pedidos, WhatsApp nem a composição dos demais blocos do template.

## 2026-05-08 — Identidade visual: logo e favicon com previews ajustados
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reorganizei os cards de imagem da seção `Identidade visual` para que a logo tenha preview maior em `contain`, sem corte, e o favicon fique menor e mais técnico.
- Preview contextual: acrescentei uma mini aba do navegador no card de favicon para mostrar onde o ícone aparece, mantendo a imagem inteira no preview.
- Escopo preservado: não alterei regras globais, outros módulos nem a persistência além do necessário para manter logo e favicon conectados ao template público.

## 2026-05-08 — Identidade visual: idioma e favicon no template da loja
- Arquivos alterados: `js/modules/catalogo.js`, `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: limpei a seção `Identidade visual` removendo campos que não pertencem ao template público, inclusive cores, troquei o idioma principal por select com opções `pt-BR`, `es-ES`, `en-US` e `ca-ES`, adicionei favicon com upload/URL e conectei logo e favicon ao template público.
- Orientação de mídia: incluí notas de tamanho recomendado para logo e favicon, sem bloquear o usuário por dimensões exatas.
- Escopo preservado: mantive compatibilidade com dados antigos, sem alterar regras globais de tenant, rotas, Firebase ou módulos não relacionados.

## 2026-05-08 — Template da loja: vitrine com busca nos 3 destaques
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: substituí os três selects simples de `Produto destacado 1/2/3` por comboboxes pesquisáveis, mantendo o salvamento dos mesmos IDs e ordenando a lista de produtos em ordem alfabética.
- Escopo preservado: não alterei rotas, permissões, persistência global nem o restante do layout da seção.

## 2026-05-08 — Mobile público: nome dos destaques menos bold
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reduzi o peso do nome dos produtos no carrossel de `Destacados` no mobile para deixá-lo mais leve e coerente com a hierarquia da primeira dobra.
- Escopo preservado: não alterei desktop, lógica, dados, carrinho, traduções nem estrutura do template.

## 2026-05-08 — Mobile público: primeira dobra com Inter e hierarquia ajustada
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: alinhei a primeira dobra do template público mobile com a família `Inter`, reduzi o peso das infos pequenas, deixei o card principal mais quente e elegante e preservei o CTA vermelho como foco principal.
- Escopo preservado: não alterei desktop, lógica, persistência, traduções ou estrutura geral do template.

## 2026-05-08 — Destaque comercial: promoção com mais presença
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: aumentei a presença tipográfica do contexto e do benefício no card `Promoção ativa` para reforçar a leitura comercial sem ampliar excessivamente a altura do card.
- Escopo preservado: mantive a lógica funcional, a persistência, as traduções, a seleção da promoção e o restante do destaque comercial intactos.

## 2026-05-08 — Destaque comercial: contexto da promoção alinhado ao ícone
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: aumentei o texto de contexto do card `Promoção ativa` e o alinhei visualmente com o ícone do card para que ambos ocupem a mesma faixa de altura.
- Escopo preservado: mantive a lógica funcional, a persistência, as traduções, a seleção da promoção e o restante da composição do topo.

## 2026-05-08 — Destaque comercial: contexto da promoção maior e em preto
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: aumentei o texto de contexto do card `Promoção ativa` e o coloquei em preto para dar mais presença sem competir com o benefício principal.
- Escopo preservado: mantive a lógica funcional, a persistência, as traduções, a seleção da promoção e o restante do destaque comercial intactos.

## 2026-05-08 — Destaque comercial: informação secundária da promoção em preto
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: deixei a informação secundária do card `Promoção ativa` em preto/neutro para reduzir ruído cromático e reforçar a hierarquia visual.
- Escopo preservado: mantive a lógica funcional, a persistência, as traduções, a seleção da promoção e o restante do destaque comercial intactos.

## 2026-05-08 — Destaque comercial: promoção com vermelho concentrado no CTA
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reduzi o vermelho no card `Promoção ativa`, deixando a cor forte concentrada no CTA e suavizando ícone, texto de contexto e benefício para um visual mais leve e sofisticado.
- Escopo preservado: não alterei a lógica funcional, persistência, traduções, seleção da promoção, card principal nem os tipos `Cupom ativo`, `Produto destaque` ou `Produto mais pedido`.

## 2026-05-08 — Destaque comercial: promoção com hierarquia corrigida
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reordenei o card `Promoção ativa` para priorizar o benefício principal, reduzir o peso do texto de contexto e ocultar o nome da promoção quando ele é genérico ou redundante.
- Escopo preservado: mantive a lógica funcional, a persistência, as traduções, a seleção da promoção e os demais tipos do destaque comercial.

## 2026-05-08 — Destaque comercial: promoção compactada e isolada
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reduzi a altura e o peso visual do card `Promoção ativa`, mantive a hierarquia comercial e separei estruturalmente o card lateral do card principal para evitar interferência no topo.
- Escopo preservado: não alterei a lógica de promoção, tradução, persistência, cupom, produto destaque ou produto mais pedido.

## 2026-05-08 — Destaque comercial: cupom e promoção sem título duplicado
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: removi a repetição do título de conversão no card `Cupom ativo` e apliquei a mesma regra ao card `Promoção ativa`, exibindo o nome complementar só quando ele realmente agrega informação.
- Escopo preservado: mantive a lógica de aplicação do cupom e da promoção, sem alterar tradução, persistência, rotas, Firebase ou os tipos `Produto destaque` e `Produto mais pedido`.

## 2026-05-08 — Destaque comercial lateral e topo ajustados
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: refinei a composição superior do template público para aproximar o card principal do destaque lateral, reduzir o vazio entre os blocos e deixar os cards de `Produto destaque` e `Produto mais pedido` com imagem à esquerda e conteúdo à direita, em formato mais compacto e comercial.
- Escopo preservado: mantive os demais tipos do destaque comercial, sem alterar Firebase, rotas, carrinho, dados ou regras de publicação.

## 2026-05-08 — Destaque comercial: promoção ativa refinada
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: complementei o card do destaque comercial para o tipo `Promoção ativa`, com título de conversão por idioma, resumo curto da promoção, benefício principal em destaque e informação compacta sobre produtos participantes.
- Escopo preservado: mantive o comportamento dos tipos `Produto destaque` e `Produto mais pedido`, sem mexer em rotas, Firebase, carrinho, regras de promoção ou publicação.

## 2026-05-08 — Destaque comercial: título e card de produto refinados
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: adicionei fallback de título por idioma para os tipos `Produto destaque` e `Produto mais pedido`, ampliei o suporte de tradução do campo de título do card e renderei o card público de produto com imagem, nome, descrição curta e preço com foco em conversão.
- Escopo preservado: mantive a estrutura de dados existente, sem alterar rotas, Firebase, carrinho ou regras dos outros tipos do destaque comercial.

## 2026-05-08 — Desktop público: hierarquia tipográfica refinada
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: suavizei a hierarquia tipográfica do desktop, reduzindo bold excessivo em títulos, badges, preços, CTAs e textos auxiliares para deixar o template mais leve e sofisticado.
- Escopo preservado: não alterei mobile, lógica, dados, tenant, carrinho, pedidos, WhatsApp nem idioma.

## 2026-05-08 — Mobile público: hierarquia tipográfica refinada
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: suavizei a hierarquia tipográfica do mobile, reduzindo bold excessivo em títulos, chips, preços, CTAs e textos auxiliares para deixar o template mais leve e sofisticado.
- Escopo preservado: não alterei desktop, lógica, dados, tenant, carrinho, pedidos, WhatsApp nem idioma.

## 2026-05-08 — Mobile público: card principal com mais profundidade
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: adicionei mais profundidade visual ao card principal mobile da loja com sombra mais sofisticada, camada interna sutil, brilho quase imperceptível e acento cálido no topo.
- Chips e hierarquia: ajustei a organização dos chips e a integração do botão `Más información` para reforçar o bloco principal da loja sem poluir o layout.
- Observação: Refinamento visual do card principal mobile da loja.
- Escopo preservado: não alterei desktop, lógica, dados, tenant, carrinho, pedidos, WhatsApp nem idioma.

## 2026-05-08 — Mobile público: card principal da loja refinado
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: refinei somente o card principal mobile da loja com logo maior, fundo off-white com degradê sutil, borda fina, sombra leve e chips mais organizados.
- Destaque visual: o chip de status `Cerrado temporalmente` ganhou fundo vermelho suave e texto em vermelho mais escuro, mantendo a estética premium.
- Observação: Refinamento visual do card principal mobile da loja.
- Escopo preservado: não alterei desktop, lógica, dados, tenant, carrinho, pedidos, WhatsApp, idioma nem outras áreas da página além do necessário para esse card.

## 2026-05-08 — Mobile público: preços realmente em preto
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: sobrescrevi no bloco mobile os preços que ainda podiam herdar o vermelho base, deixando-os em preto/quase preto com peso mais contido.
- Áreas afetadas: preço dos cards de produtos, preço dos destaques, preço da oferta e total grandioso do carrinho/resumo.
- Escopo preservado: não alterei desktop, Admin, Firebase, rotas, estrutura de dados nem comportamento de compra.

## 2026-05-08 — Mobile público: preços em preto
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: sobrescrevi os preços do mobile para preto/quase preto, com peso mais contido e leitura mais sofisticada.
- Áreas afetadas: preço dos cards de produtos, preço dos destaques, preço da oferta e total grandioso do carrinho/resumo.
- Escopo preservado: não alterei desktop, Admin, Firebase, rotas, estrutura de dados nem comportamento de compra.

## 2026-05-08 — Mobile público: preços em preto e mais elegantes
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: apliquei no mobile o mesmo tratamento visual dos preços já usado no desktop, com preto/quase preto, leve aumento de tamanho e peso mais contido.
- Áreas afetadas: preço dos cards de produtos, preço dos destaques, preço da oferta e total grandioso do carrinho/resumo.
- Escopo preservado: não alterei desktop, Admin, Firebase, rotas, estrutura de dados nem comportamento de compra.

## 2026-05-08 — Desktop público: preços em preto e mais elegantes
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: ajustei os preços visíveis do desktop para preto/quase preto, com leve aumento de tamanho e peso mais contido, buscando uma leitura mais sofisticada.
- Áreas afetadas: preço dos cards de produtos, preço dos destaques, preço da oferta e total grandioso do carrinho/resumo.
- Escopo preservado: não alterei mobile, Admin, Firebase, rotas, estrutura de dados nem comportamento de compra.

## 2026-05-08 — Desktop público: visual neutro quente e premium
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: refinei somente a versão desktop do template público com base off-white/bege claro, cards brancos, bordas neutras, sombras suaves, tipografia menos pesada e mais respiro visual.
- Áreas ajustadas: header, banner/hero, card da loja, destaque comercial, barra de categorias/busca, cards de produtos/destaques, card do pedido e WhatsApp flutuante.
- Observação: Ajuste visual desktop do template público; vermelho mantido apenas como cor de ação.
- Escopo preservado: não alterei mobile, Admin, Firebase, rotas, estrutura de dados, pedidos, carrinho, WhatsApp, tenant nem regras de negócio.

## 2026-05-08 — Público mobile: links em carrosséis voltam a abrir
- Módulo afetado: Cardápio > Template da loja > template público mobile.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: removi a captura de ponteiro dos carrosséis mobile e adicionei fallback delegado com `data-*` para cards de `Destacados`, barra de categorias e abas do modal `Más información`.
- Comportamento esperado: toque em card de destaque abre o produto, toque em categoria navega para a seção e toque nas abas do modal troca o conteúdo; o arraste horizontal continua disponível.
- Escopo preservado: não alterei desktop, Admin, Firebase, rotas, estrutura de dados nem a lógica de carrinho/produtos.

## 2026-05-08 — Público: promoção fecha modal antes de navegar
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: no modal `Promociones activas`, o botão da promoção agora fecha explicitamente o painel antes de renderizar e rolar para a listagem de produtos vinculados.
- Comportamento esperado: em desktop e mobile, o modal deixa de permanecer aberto após o clique e o cliente é levado para a seção filtrada da promoção.
- Escopo preservado: não alterei Admin, Firebase, rotas, estrutura de dados nem a lógica de promoções/produtos.

## 2026-05-08 — Público mobile: taps preservados em áreas arrastáveis
- Módulo afetado: Cardápio > Template da loja > template público mobile.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: corrigi a sensibilidade dos handlers de arraste mobile para não bloquear taps nos cards de `Destacados`, nas abas do modal `Más información` e na barra de categorias.
- Comportamento esperado: toque simples abre o produto, troca abas do modal e navega por categoria; arraste horizontal continua funcionando quando há deslocamento real.
- Escopo preservado: não alterei desktop, Admin, Firebase, rotas, estrutura de dados nem a lógica de produto/carrinho.

## 2026-05-08 — Público mobile: refinamento visual do topo e produtos
- Módulo afetado: Cardápio > Template da loja > template público mobile.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: refinei somente a versão mobile do card principal da loja e dos cards da listagem de produtos, mantendo a estrutura geral e a lógica existentes.
- Card principal: mantive a logo redonda centralizada, preservei o botão de informações abaixo dela, deixei o subtítulo fora do layout mobile e organizei os chips em linhas mais leves com localização/status, retirada/entrega e tempo de preparação.
- Cards de produtos: suavizei pesos tipográficos, sombras, tags promocionais e botões de quantidade/adicionar, mantendo a composição com imagem e a hierarquia entre título, descrição, preço e CTA.
- Escopo preservado: não alterei desktop, Admin, Firebase, rotas, estrutura de dados nem handlers de produto/carrinho.

## 2026-05-08 — Público mobile: arraste do carrossel Destacados
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: adicionei handler de arraste por ponteiro na vitrine mobile `Destacados`, permitindo arrastar horizontalmente sobre os cards e imagens.
- Comportamento preservado: o clique no card continua abrindo o produto e o clique nos botões de quantidade continua funcionando; o clique só é suprimido quando houve arraste real.
- Escopo preservado: não alterei desktop, Admin, Firebase, rotas, estrutura de dados nem a lógica de renderização dos produtos.

## 2026-05-08 — Público mobile: vitrine Destacados mais legível
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: refinei somente a versão mobile da seção `Destacados`, substituindo os mini cards apertados por uma vitrine horizontal com cards maiores, scroll suave sem barra visível e indicação visual de continuidade.
- Card mobile: imagem maior, nome limitado a duas linhas, descrição removida do card mobile, preço atual com mais destaque, preço anterior mais discreto e CTA de quantidade/adicionar com melhor respiro no canto inferior direito.
- Tags promocionais: reduzi peso visual, tamanho e impacto das tags sobre a imagem para manter leitura mais limpa.
- Escopo preservado: não alterei desktop, Admin, Firebase, rotas, estrutura de dados nem os handlers de clique existentes dos cards.

## 2026-05-08 — Público: cliques do destaque comercial
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: corrigi os CTAs do card `Destaque comercial do topo` para usar handler delegado, dados explícitos no botão (`data-featured-*`) e ação reconstruída após cada render.
- Comportamento esperado: produto destaque e produto mais pedido abrem a ficha do produto; promoção ativa abre a listagem de produtos vinculados; cupom ativo aplica o cupom e mostra feedback; texto personalizado executa apenas alvo válido.
- Ajuste complementar: o botão `Ver todos los productos` da listagem filtrada por promoção passou a usar o mesmo padrão delegado, sem duplicar eventos.
- Escopo preservado: não alterei Admin, Firebase, rotas, estrutura de dados, carrinho, categorias, modal de produto nem modal `Más información`.

## 2026-05-08 — Público mobile: resumo principal da loja mais limpo
- Módulo afetado: Cardápio > Template da loja > template público mobile.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reorganizei somente o card principal/resumo da loja no mobile, com logo redonda centralizada no topo, botão `Más información` abaixo da logo e informações distribuídas em três linhas visuais.
- Conteúdo mobile: o título e subtítulo da loja foram removidos apenas do layout visual mobile; a linha de localização/status, os chips de retirada/entrega e o tempo de preparação continuam usando os textos do idioma ativo do template.
- Escopo preservado: não alterei Admin, desktop, outros cards, Firebase, rotas nem estrutura de dados.

## 2026-05-08 — Admin: amostras únicas de cor no Topo da loja
- Módulo afetado: Admin > Cardápio > Template da loja.
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: removi as amostras duplicadas dos campos de cor do Topo da loja, mantendo uma única amostra ao lado de cada input.
- Prévia mantida: a faixa do banner promocional continua exibindo a combinação final de cor de fundo e cor da letra.
- Escopo preservado: não alterei loja pública, Firebase, rotas, estrutura de dados nem outros blocos do template.

## 2026-05-08 — Admin: buscas do destaque comercial sem datalist nativo
- Módulo afetado: Admin > Cardápio > Template da loja.
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: substituí as listas nativas (`datalist`) dos campos de busca do card `Destaque comercial do topo` por um combobox próprio do Admin, com dropdown branco, borda suave, cantos arredondados e sombra discreta.
- Campos afetados: cupom ativo, promoção ativa, produto destaque e produto mais pedido no modo manual.
- Comportamento mantido: filtros por tenant, cupons/promoções ativos, seleção do item, fechamento ao selecionar ou clicar fora e mensagem simples quando não há resultados.
- Escopo preservado: não alterei loja pública, Firebase, rotas, estrutura de dados nem a lógica dos tipos.

## 2026-05-08 — Admin/Público: produto mais pedido com modo automático/manual
- Módulo afetado: Admin > Cardápio > Template da loja e conexão do destaque no template público.
- Arquivos alterados: `js/modules/catalogo.js`, `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: no tipo `Produto mais pedido`, adicionei o modo de origem com `Automático pelo histórico de vendas` e `Seleção manual/personalizada`.
- Modo automático: calcula o produto mais pedido a partir de pedidos reais do tenant e oculta o card no público quando não há histórico válido.
- Modo manual: usa um único campo `Selecionar produto` com busca por nome na própria lista, mostrando apenas produtos do tenant atual.
- Card público: usa os dados comerciais do produto definido e mantém CTA automático para abrir a ficha/modal do produto.
- Escopo preservado: não alterei Firebase, rotas, estrutura de dados nem os demais tipos do destaque.

## 2026-05-08 — Admin/Público: produto destaque com busca na seleção
- Módulo afetado: Admin > Cardápio > Template da loja e conexão do destaque no template público.
- Arquivos alterados: `js/modules/catalogo.js`, `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: no tipo `Produto destaque`, removi o campo separado `Buscar produto vinculado` e mantive apenas `Selecionar produto` com lista pesquisável por nome.
- Card público: o destaque de produto passa a usar dados comerciais do produto selecionado, como nome, copy curta, preço atual/anterior e badge quando houver.
- Ação do CTA: mantida automática pelo tipo, abrindo a ficha/modal do produto selecionado com o fluxo público já existente.
- Escopo preservado: não alterei Firebase, rotas, estrutura de dados nem os demais tipos do destaque.

## 2026-05-08 — Admin/Público: promoção do destaque com busca na seleção
- Módulo afetado: Admin > Cardápio > Template da loja e conexão do destaque no template público.
- Arquivos alterados: `js/modules/catalogo.js`, `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: no tipo `Promoção ativa`, removi o campo separado `Buscar promoção ativa` e mantive apenas `Selecionar promoção ativa` com lista pesquisável por nome, tipo, descrição e benefício.
- Card público: a promoção selecionada usa título e benefício comercial traduzidos, sem expor texto técnico ou `produtos vinculados`.
- Ação do CTA: mantida a abertura da listagem filtrada com todos os produtos da promoção selecionada, sem abrir produto único.
- Escopo preservado: não alterei Firebase, rotas, estrutura de dados nem os demais tipos do destaque.

## 2026-05-08 — Admin: cupom do destaque com busca na seleção
- Módulo afetado: Admin > Cardápio > Template da loja.
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: no tipo `Cupom ativo`, removi o campo separado `Buscar cupom ativo` e mantive apenas `Selecionar cupom` com lista pesquisável por código, nome ou título.
- Fallback: quando não há cupom ativo do tenant, o próprio campo mostra uma mensagem simples de indisponibilidade.
- Escopo preservado: não alterei loja pública, Firebase, rotas, estrutura de dados nem os demais tipos do destaque.

## 2026-05-08 — Admin/Público: destaque comercial por tipo
- Módulo afetado: Admin > Cardápio > Template da loja e conexão do template público.
- Arquivos alterados: `js/modules/catalogo.js`, `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: a lista `Tipo de conteúdo do card` agora controla os campos exibidos para nenhum, cupom, promoção, produto destaque, produto mais pedido e texto personalizado.
- Ação automática: cupom aplica o código selecionado no carrinho, promoção abre o item/promoção relacionada e produtos abrem o produto escolhido, sem depender de destino manual.
- Conexão pública revisada: o template público recebe os IDs de cupom/promoção selecionados e o CTA de promoção abre a listagem filtrada com todos os produtos da promoção.
- Idioma e fallback: os CTAs públicos usam o idioma ativo do template, com fallback seguro quando cupom, promoção ou produto selecionado não existir.
- Escopo preservado: não alterei Firebase, rotas, coleções ou estrutura global de dados.

## 2026-05-08 — Admin: card de destaque comercial reorganizado
- Módulo afetado: Admin > Cardápio > Template da loja.
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reestruturei o card de destaque comercial com toggle visual, bloco interno mais limpo e campos condicionais quando o destaque está ativo.
- Busca de produto: adicionei busca por nome no campo de produto vinculado, filtrando apenas produtos do tenant atual e preservando o valor selecionado.
- Conexão pública: o destaque continua ligado ao template da loja pública e some quando desativado ou sem conteúdo válido.

## 2026-05-08 — Admin: banner promocional com prévia única
- Módulo afetado: Admin > Cardápio > Template da loja.
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: substituí as prévias separadas de cor do banner promocional por uma única faixa de prévia visual com texto de exemplo, mostrando a combinação real entre cor de fundo e cor da letra.
- Escopo preservado: não alterei Firebase, rotas, estrutura de dados nem a loja pública.

## 2026-05-08 — Admin: prévias de cor e opacidade do template refinadas
- Módulo afetado: Admin > Cardápio > Template da loja.
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: simplifiquei as prévias de cor para um formato mais compacto, com amostra visual real ao lado do campo e rótulos claros para banner, texto do banner e sobreposição da capa.
- Ajuste de opacidade: a transparência da sobreposição passou a usar slider com valor visível em %, sincronizado com o campo numérico.
- Escopo preservado: não alterei Firebase, rotas, estrutura de dados nem a loja pública.

## 2026-05-08 — Público mobile: card-resumo compacto reorganizado
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reestruturei o card principal da loja no mobile para uma composição mais compacta e horizontal, com logo menor à esquerda, texto ao lado e chips distribuídos abaixo.
- Escopo preservado: não alterei desktop, banner, menu superior, categorias, vitrine, carrinho, modais, rodapé, Firebase, rotas ou estrutura de dados.

## 2026-05-08 — Público mobile: card-resumo do topo reorganizado
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reorganizei o card principal da loja no mobile para ficar mais leve, com logo centralizada, título e subtítulo melhor distribuídos e chips do topo mais bem acomodados.
- Escopo preservado: não alterei desktop, banner, categorias, vitrine, carrinho, modais, rodapé, Firebase, rotas ou estrutura de dados.

## 2026-05-08 — Público mobile: status da loja com cores corretas
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: corrigi o mobile para o chip de status da loja usar as cores corretas de aberto, fechado e fechado temporariamente, sem ser sobrescrito pelo estilo genérico dos chips do hero.
- Escopo preservado: não alterei desktop, banner, hero, cards, carrinho, modais, rodapé, Firebase, rotas ou estrutura de dados.

## 2026-05-08 — Público mobile: status da loja reativado no resumo
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reativei no mobile o chip de status do resumo da loja para mostrar corretamente estados como aberta, fechada e fechada temporariamente.
- Escopo preservado: não alterei desktop, banner, hero, cards, carrinho, modais, rodapé, Firebase, rotas ou estrutura de dados.

## 2026-05-08 — Público mobile: chips do topo reativados no card-resumo
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reativei no mobile a exibição dos chips do topo dentro do card-resumo, para que `Mostrar cidade/região` e `Mostrar chips de entrega/retirada` voltem a aparecer quando estiverem habilitadas no Admin.
- Escopo preservado: não alterei desktop, banner, hero, cards, carrinho, modais, rodapé, Firebase, rotas ou estrutura de dados.

## 2026-05-08 — Admin: primeiro card do Topo da loja reorganizado
- Módulo afetado: Admin > Cardápio > Template da loja.
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reorganizei o card `Topo da loja` em blocos separados para banner promocional, imagem de capa e elementos visíveis no topo.
- Ajustes visuais: troquei os checkboxes por toggles visuais, removi labels genéricos de prévia, padronizei os previews de cor e limpei o upload/URL da capa com preview e ação de remover.
- Escopo preservado: não alterei Firebase, rotas, estrutura de dados nem a loja pública, exceto o vínculo já existente dos campos.

## 2026-05-08 — Público: faixa promocional fixa no topo sem faixa branca
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: tornei a faixa promocional fixa no topo quando ativa, para ela aparecer sobre o banner sem criar uma faixa branca ou espaço vazio acima.
- Escopo preservado: não alterei banner, hero, cards, carrinho, modais, rodapé, Firebase, rotas ou estrutura de dados.

## 2026-05-08 — Público: faixa promocional reforçada para não cair em branco
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: forcei a faixa promocional do topo a renderizar com fundo sólido e layout flex quando ativa, evitando a aparência de faixa branca mesmo com as cores configuradas no Admin.
- Escopo preservado: não alterei desktop/mobile fora do topo, nem Firebase, rotas ou estrutura de dados.

## 2026-05-08 — Público: banner promocional volta a aparecer com fallback
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: corrigi a exibição do banner promocional no topo para ele aparecer quando estiver ativado no Admin, mesmo se o texto estiver vazio, usando fallback traduzido.
- Escopo preservado: não alterei desktop/mobile fora do topo, nem Firebase, rotas ou estrutura de dados.

## 2026-05-08 — Admin: formato de cor do banner promocional padronizado
- Módulo afetado: Admin > Cardápio > Template da loja.
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: padronizei o seletor da `Cor do banner promocional` para o mesmo formato visual do novo campo de cor da letra do banner promocional, mantendo a experiência consistente.
- Escopo preservado: não alterei loja pública, Firebase, rotas, estrutura de dados ou outros campos do template.

## 2026-05-08 — Admin: capa da loja com desktop/mobile e promo text color
- Módulo afetado: Admin > Cardápio > Template da loja.
- Arquivos alterados: `js/modules/catalogo.js`, `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: removi as opções de resumo da loja sobre a capa e do bloco “Calcular taxa e tempo de entrega”, e passei a abrir a configuração da capa ao ativar “Usar imagem de capa no topo”.
- Novos campos: upload de capa desktop e mobile, previews enviados, tamanho recomendado, cor da sobreposição, opacidade da sobreposição e cor da letra do banner promocional.
- Conexão pública: a loja pública agora lê a capa mobile no mobile e a cor do texto do banner promocional, mantendo as demais conexões existentes.
- Validações realizadas: `node --check` em `js/modules/catalogo.js` e checagem de sintaxe dos scripts inline de `index.html`.

## 2026-05-08 — Admin: remoção do preview lateral do Template da loja
- Módulo afetado: Admin > Cardápio > Template da loja.
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: removi o preview lateral dessa tela e deixei a área principal ocupar a largura disponível.
- Escopo preservado: não alterei o preview mobile de `preview-template.html`, nem a loja pública, Firebase, rotas ou estrutura de dados.
- Validações realizadas: `node --check` em `js/modules/catalogo.js`.

## 2026-05-08 — Mobile: hero encostado no topo
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: subi o hero no mobile para o banner alcançar o topo da página, sem mexer no desktop.
- Escopo preservado: não alterei desktop, cards, carrinho, modais, rodapé, Firebase, rotas ou estrutura de dados.
- Validações realizadas: `node -e` para scripts inline do `index.html`.

## 2026-05-08 — Mobile: fundo extra do menu superior removido
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: removi o fundo/área extra do header mobile para deixar visível apenas o card arredondado do menu superior.
- Escopo preservado: não alterei desktop, banner, hero, cards, carrinho, modais, rodapé, Firebase, rotas ou estrutura de dados.
- Validações realizadas: `node -e` para scripts inline do `index.html`.

## 2026-05-08 — Mobile: WhatsApp flutuante reposicionado
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: subi um pouco o botão flutuante de WhatsApp no mobile para abrir mais espaço da borda inferior.
- Ajuste visual: usei a cor oficial do WhatsApp no botão e mantive distância segura da barra flutuante do carrinho.
- Escopo preservado: não alterei desktop, Firebase, rotas, autenticação, pedidos, carrinho, checkout, estrutura de dados ou o restante do layout.
- Validações realizadas: `node -e` para scripts inline do `index.html`.

## 2026-05-08 — Mobile: scrollbar da página principal ocultada
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: escondi também a barra de rolagem visível da página principal no mobile, sem bloquear a navegação por toque ou mouse.
- Escopo preservado: não alterei desktop, Firebase, rotas, autenticação, pedidos, carrinho, checkout, estrutura de dados ou o restante do layout.
- Validações realizadas: `node -e` para scripts inline do `index.html`.

## 2026-05-08 — Mobile: scrollbars internas ocultas
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: escondi as barras de rolagem visíveis nos painéis e modais internos do mobile, mantendo a rolagem por gesto funcional.
- Áreas ajustadas: carrinho mobile, modal “Más información”, painel de navegação, sheet de autenticação e áreas internas de conteúdo com scroll.
- Escopo preservado: não alterei desktop, Firebase, rotas, autenticação, pedidos, carrinho, checkout, estrutura de dados ou o restante do layout.
- Validações realizadas: `node -e` para scripts inline do `index.html`.

## 2026-05-08 — Mobile: tipografia mais leve e verde sofisticado
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reduzi o excesso de bold no mobile, principalmente na vitrine, no carrinho e nas áreas de conversão.
- Paleta visual: troquei o verde do mobile por um tom mais sóbrio e profissional, aplicado em descontos, promoções ativas, economia e mensagens de benefício.
- Escopo preservado: não alterei desktop, Firebase, rotas, autenticação, pedidos, carrinho, checkout, estrutura de dados ou o restante do layout fora do mobile.
- Validações realizadas: `node -e` para scripts inline do `index.html`.

## 2026-05-08 — Desktop: tipografia mais leve e verde sofisticado
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reduzi o excesso de bold no desktop, principalmente na vitrine e no carrinho, para deixar a leitura mais elegante.
- Paleta visual: troquei o verde do desktop por um tom mais sóbrio e profissional, aplicado em descontos, promoções ativas, economia e estados visuais ligados a benefício.
- Escopo preservado: não alterei mobile, Firebase, rotas, autenticação, pedidos, carrinho, checkout, estrutura de dados ou o restante do layout fora do desktop.
- Validações realizadas: `node -e` para scripts inline do `index.html`.

## 2026-05-08 — Desktop: menu superior fixo durante o scroll
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo da correção: tornei o menu superior do desktop fixo no topo durante a rolagem, sem mexer no mobile.
- Ajuste de layout: reservei espaço no topo do `body` no breakpoint desktop para evitar sobreposição com o conteúdo inicial.
- Escopo preservado: não alterei mobile, banner, hero, cards, carrinho, modal, rodapé, Firebase, rotas ou estrutura de dados.
- Validações realizadas: `node -e` para scripts inline do `index.html`.

## 2026-05-08 — Mobile: menu superior corrigido para fixed
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo da correção: ajustei novamente o menu superior do mobile para permanecer visível durante o scroll usando `position: fixed` no breakpoint mobile.
- Ajuste de layout: reservei espaço no topo do `body` para o menu não cobrir o conteúdo inicial e mantive o visual limpo.
- Escopo preservado: não alterei desktop, banner, hero, cards, carrinho, modal, rodapé, Firebase, rotas ou estrutura de dados.
- Validações realizadas: pendente.

## 2026-05-08 — Mobile: menu superior sticky durante o scroll
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reforcei o comportamento sticky do menu superior no mobile para ele permanecer visível ao rolar a página.
- Visual mobile: mantive o topo limpo e responsivo, com fundo coerente ao tema do site e sem criar um bloco visual pesado.
- Escopo preservado: não alterei Firebase, rotas, autenticação, pedidos, carrinho, checkout ou estrutura de dados.
- Validações realizadas: pendente.

## 2026-05-08 — Modal mobile: abas “Más información” com arraste horizontal
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: habilitei arraste horizontal real nas abas do modal “Más información” no mobile, com suporte a dedo e mouse.
- Visual mobile: mantive as abas em uma única linha, com rolagem visual oculta e sem quebrar os botões em várias linhas.
- Escopo preservado: não alterei Firebase, rotas, autenticação, pedidos, carrinho, checkout ou estrutura de dados.
- Validações realizadas: pendente.

## 2026-05-08 — Template público: categorias mobile com arraste horizontal
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: habilitei arraste horizontal real no menu de categorias do mobile, com suporte a dedo e mouse no preview.
- Visual mobile: a barra de categorias segue em uma única linha, sem quebrar os pills, e a rolagem visual ficou oculta.
- Escopo preservado: não alterei Firebase, rotas, autenticação, pedidos, carrinho, checkout ou estrutura de dados.
- Validações realizadas: pendente.

## 2026-05-08 — Template público: barra mobile mais baixa
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: desci a barra flutuante `Ver carrito` / `Ver pedido` no mobile para ela ficar mais próxima da borda inferior da tela, mantendo uma margem segura.
- Convivência visual: preservei espaço para não cobrir conteúdo dos cards e mantive a distância segura em relação ao botão flutuante de WhatsApp.
- Escopo preservado: não alterei Firebase, rotas, autenticação, pedidos, carrinho, checkout ou estrutura de dados.
- Validações realizadas: pendente.

## 2026-05-08 — Template público: badges mobile sem sobreposição
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reorganizei as tags e badges dos cards na versão mobile para evitar sobreposição entre selo promocional e tags cadastradas.
- Layout mobile: as badges agora se comportam em coluna dentro da área da imagem, com quebra natural e espaçamento discreto, sem cobrir texto importante.
- Escopo preservado: não alterei Firebase, rotas, autenticação, pedidos, carrinho, checkout ou estrutura de dados.
- Validações realizadas: pendente.

## 2026-05-08 — Template público: i18n e ícones do topo
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: corrigi os textos públicos do carrinho, checkout, botões e navegação para respeitar o idioma ativo do template, reduzindo mistura de idiomas nos fluxos principais.
- Ícones: troquei o ícone de `Promoções` para porcentagem e o de `Pedidos` para sacola, no topo e na navegação espelhada.
- Mensagens: ajuste também os toasts de cupom, limite de horário e pontos ganhos para saírem no idioma configurado.
- Escopo preservado: não alterei Firebase, rotas, autenticação, pedidos, carrinho, checkout ou estrutura de dados.
- Validações realizadas: pendente.

## 2026-05-08 — Template público: mobile mais limpo
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: removi o menu fixo inferior da versão mobile e limpei a navegação para reduzir poluição visual.
- Botão `Ver sacola`: ajustei contraste, hover, active e focus para manter a legibilidade do texto.
- Categorias: o carrossel horizontal agora permite arraste mais fluido, com scrollbar ocultada e indicação visual discreta nas bordas.
- Modal `Más información`: escondi a barra visual/scrollbar nessa área para deixar a navegação mais limpa no mobile.
- Escopo preservado: não alterei Firebase, rotas, autenticação, pedidos, carrinho, checkout ou estrutura de dados.
- Validações realizadas: pendente.

## 2026-05-08 — Template público: header sticky corrigido
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: corrigi o comportamento do menu superior para ele permanecer fixo durante a rolagem, sem depender da sobreposição negativa no próprio header.
- Integração visual: a compensação visual agora fica no hero/banner, que sobe por trás da barra do topo sem abrir faixa branca.
- Escopo preservado: não alterei Firebase, rotas, autenticação, pedidos, carrinho ou estrutura de dados.
- Validações realizadas: pendente.

## 2026-05-08 — Template público: banner ainda mais alto no topo
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: puxei o hero/banner um pouco mais para cima no desktop e no mobile para eliminar o espaço branco restante abaixo da barra do menu.
- Menu superior: mantive a barra sticky visível ao rolar e reduzi ainda mais a separação visual entre o menu e o banner.
- Integração visual: o banner continua ocupando o fundo do topo, passando por trás da área de respiro da navegação.
- Escopo preservado: não alterei Firebase, rotas, autenticação, pedidos, carrinho ou estrutura de dados.
- Validações realizadas: pendente.

## 2026-05-08 — Template público: topo integrado ao banner
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: subi mais o banner no desktop e no mobile para ele passar por trás da área de respiro do menu do topo, sem criar uma faixa visual separada.
- Menu superior: a barra sticky agora usa um fundo mais próximo da cor principal do site, reduzindo o efeito de cartão branco solto.
- Integração visual: mantive o hero ocupando o fundo do topo inteiro e preservei apenas o respiro necessário para a navegação.
- Escopo preservado: não alterei Firebase, rotas, autenticação, pedidos, carrinho ou estrutura de dados.
- Validações realizadas: pendente.

## 2026-05-08 — Template público: modal de produto mais leve e sem técnica
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reduzi o peso tipográfico do modal de produto, compacteio o preço e transformei o bloco promocional em um único card simples e comercial.
- Copy: removi textos técnicos de promoção do modal e passei a respeitar o idioma ativo do template sem misturar idiomas.
- Escopo preservado: não alterei Firebase, rotas, autenticação, pedidos, carrinho, checkout ou estrutura de dados.
- Validações realizadas: scripts inline de `index.html` validados com Node.

## 2026-05-08 — Template público: modal de produto i18n e promo cards
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reduzi o peso tipográfico do modal de produto e reorganizei o bloco promocional com cartões mais claros para promoção ativa, benefício/economia e condição da oferta.
- Idioma: a copy do modal agora respeita o idioma ativo do template, sem misturar textos fixos em português/espanhol/inglês/francês.
- Escopo preservado: não alterei Firebase, rotas, autenticação, pedidos, carrinho, checkout ou estrutura de dados.
- Validações realizadas: scripts inline de `index.html` validados com Node.

## 2026-05-08 — Template público: topo mais leve
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reduzi a altura útil do hero/banner no desktop, aumentei o respiro superior do topo e mantive a barra superior fixa/sticky ao rolar.
- Banner: a imagem continua cobrindo o hero com `background-size: cover` e `background-position: center`, atrás dos cards da loja.
- Categorias: a barra de categorias ficou mais próxima do hero, sem um vazio grande entre os blocos do topo.
- Template da loja: os campos de cor e opacidade da sobreposição do banner já ficam disponíveis para configuração e continuam consumidos pelo público.
- Escopo preservado: não alterei Firebase, rotas, autenticação, pedidos, carrinho ou estrutura de dados.
- Validações realizadas: scripts inline de `index.html` validados com Node.

## 2026-05-08 — Template público: topo integrado ao banner
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reduzi a faixa visual separada abaixo do banner promocional, integrei melhor a barra superior ao topo e aumentei a altura útil do hero no desktop para que a imagem de capa ocupe mais espaço.
- Banner: a imagem de capa continua cobrindo o hero com `background-size: cover` e `background-position: center`, com sobreposição configurável já suportada pelo template.
- Espaçamento: a barra de categorias ficou mais próxima do hero e a área branca/cinza extra abaixo do banner promocional foi removida.
- Escopo preservado: não alterei Firebase, rotas, autenticação, pedidos, carrinho ou estrutura de dados.
- Validações realizadas: scripts inline de `index.html` validados com Node.

## 2026-05-08 — Template público: banner e rodapé
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: ajustei o banner de capa para renderizar a imagem logo abaixo da faixa promocional e da barra superior, sem a camada preta fixa embutida no `backgroundImage`.
- Personalização: a camada de sobreposição da capa agora tem cor e opacidade configuráveis no template da loja e esses valores são consumidos no público, aceitando percentuais em formato numérico.
- Rodapé: fixei a cor de fundo do rodapé público em `#991F00`, conforme solicitado.
- Escopo preservado: não alterei Firebase, rotas, autenticação, pedidos, carrinho ou estrutura de dados.
- Validações realizadas: `node --check js/modules/catalogo.js`; scripts inline de `index.html` validados com Node.

## 2026-05-08 — Template público: barra superior de utilidades
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: criei a barra superior da loja logo abaixo da faixa promocional opcional, com visual branco, cantos arredondados, sombra suave e links de utilidade para `Promociones` e `Pedidos`.
- Estados de autenticação: cliente não logado vê `Promociones` e `Entrar/Registrarse`; cliente logado vê `Promociones`, `Pedidos` e avatar; o botão de login fica oculto quando há sessão.
- Fidelidade: o badge de pontos do topo só aparece quando o cliente está logado e a loja tem programa de fidelidade ativo; sem fidelidade ativa ou sem login, permanece oculto.
- Responsividade: a barra aparece em desktop e mobile, com navegação horizontal ajustável, sem sobrepor a faixa promocional ou o hero.
- Escopo preservado: não alterei Firebase, regras, rotas, autenticação, pedidos, estrutura de dados, carrinho ou lógica de cálculo.
- Validações realizadas: scripts inline de `index.html` validados com Node; Chrome headless confirmou faixa promocional ativa com barra imediatamente abaixo, cenário não logado, cenário logado sem fidelidade, cenário logado com fidelidade, ausência de gap quando a faixa não existe e responsividade mobile.

## 2026-05-08 — Template público: carrinho mobile restaurado
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: corrigi a exibição do carrinho na versão mobile após a reorganização desktop em duas colunas.
- Mobile: o mesmo `#cart-section` agora funciona como bottom sheet fixo, aberto pelo botão `Ver sacola`, com botão de fechar, rolagem controlada no painel e ação de envio visível.
- Desktop preservado: o carrinho continua na coluna lateral direita, abaixo da barra de categorias, com `position: sticky`, sem voltar a sobrepor produtos e sem scrollbar interna no card.
- Duplicidade evitada: não criei um segundo carrinho nem alterei a lógica de cálculo; apenas reposicionamento/responsividade e abertura/fechamento mobile.
- Validações realizadas: scripts inline de `index.html` validados com Node; Chrome headless mobile confirmou botão `Ver sacola` visível; validação via DevTools adicionou `Kibe frito XL 120g`, abriu o bottom sheet e confirmou `count=1`, total/subtotal `€4,50`, item listado, botão de envio visível e botão fechar visível; captura desktop confirmou carrinho lateral preservado.

## 2026-05-07 — Template público: rodapé institucional
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: removi o card estático `Sobre nosotros` do final da loja e substituí por uma faixa de rodapé full-width, em tom sólido coerente com a paleta do Boca Food.
- Conteúdo: o rodapé agora renderiza nome da loja, ano atual, direitos reservados, dados comerciais disponíveis no template, identificação fiscal quando existir, endereço, telefone/WhatsApp e assinatura `Plataforma proporcionada por Boca Food`.
- Dados preservados: não inventei informações fixas; campos ausentes são omitidos ou recebem fallback discreto sem quebrar o layout.
- Responsividade: desktop usa blocos distribuídos em linha; mobile empilha os blocos com espaçamento e respiro.
- Escopo preservado: não alterei Firebase, rotas, autenticação, pedidos, checkout, WhatsApp ou estrutura de dados.
- Validações realizadas: scripts inline de `index.html` validados com Node; busca confirmou remoção de `Sobre nosotros` e textos antigos; servidor local em `http://127.0.0.1:4181`; Chrome headless confirmou no DOM renderizado o novo `#public-footer`, direitos reservados e assinatura Boca Food.

## 2026-05-07 — Template público: layout desktop em duas colunas
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: reorganizei o desktop abaixo da barra de categorias em duas colunas reais: produtos à esquerda e carrinho à direita, com visual leve, fundo claro, cards brancos, sombras suaves e vermelho como cor principal.
- Carrinho desktop: deixou de ser painel fixo/flutuante sobreposto e passou para a coluna lateral do layout com `position: sticky`, alinhado ao topo da área de produtos, sem `overflow`/altura fixa que gere scrollbar interna no card.
- Produtos desktop: a listagem normal voltou para grid de 2 produtos por linha, com cards consistentes, imagem em área fixa com `object-fit: cover`, conteúdo em coluna e botão de adicionar alinhado no rodapé.
- Barra de categorias: removi o seletor/dropdown `Menú`, mantendo apenas categorias em pills horizontais e busca à direita, com quebra limpa quando não couber.
- Badges/tags: os badges dos cards agora ficam agrupados em uma área própria sobre a imagem, com flex/wrap e espaçamento para evitar sobreposição.
- Mobile preservado: mantive 1 produto por linha; ajustei apenas o flex das categorias e da busca para não herdar alturas do desktop.
- Validações realizadas: scripts inline de `index.html` validados com Node; busca confirmou ausência de `cat-select`/`cat-brand`; servidor local em `http://127.0.0.1:4181`; Chrome headless em desktop confirmou 2 cards por linha, carrinho à direita abaixo da barra, busca sem sobreposição e sem scrollbar interna visível no carrinho; Chrome headless mobile confirmou categorias em scroll, busca normal e cards em 1 coluna.

## 2026-05-07 — Template público: aproximação dos modelos desktop/mobile
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Referências analisadas: `modelo_Template desktop.png` como base principal de desktop e `modelo_Template mobile.png` como base principal de mobile.
- Resumo do ajuste: refinei o layout público para uma vitrine mais leve e próxima das referências, com fundo neutro claro, cards brancos, bordas discretas, sombras suaves e uso fixo de `#991F00` nos CTAs/ativos/detalhes.
- Desktop: o header público visual foi removido da primeira dobra, o hero/card da loja foi simplificado, a barra de categorias virou uma barra única com logo pequeno, seletor, pills e busca na mesma linha, e o cardápio normal passou para cards horizontais em uma coluna com imagem fixa, texto leve, preço e botão alinhados.
- Pedido/carrinho: o resumo lateral permanece à direita, agora começando abaixo da barra de categorias/busca; os blocos existentes de entrega/retirada, cupom, totais, WhatsApp e `¿Cómo funciona?` foram agrupados visualmente no painel sem alterar a lógica do pedido.
- Mobile: o topo foi aproximado do modelo com capa visual, logo circular sobreposto, card da loja mais limpo, botão `Más información`, categorias em scroll, busca abaixo, cards normais horizontais e barra `Ver sacola` redesenhada acima da navegação inferior.
- Regras preservadas: não alterei Firestore Rules, autenticação, Master, estrutura de dados, lógica de pedido, checkout ou WhatsApp; o bloco “Calcular taxa e tempo de entrega” continua sem exibição pública.
- Validações realizadas: `AGENTS.md` lido; referências desktop/mobile abertas visualmente; scripts inline de `index.html` validados com Node; servidor local em `http://127.0.0.1:4181`; Chrome headless gerou capturas desktop/mobile para checar sobreposição, barra de categorias, cards horizontais, painel lateral e navegação inferior. Playwright não estava disponível no ambiente.

## 2026-05-07 — Template público: vitrine Pink com carrinho lateral
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: refinei a vitrine pública para aproximar da referência Pink, mantendo `Destaques` no topo com até 3 produtos configurados e ocultando a seção quando não há destaques.
- Desktop: a listagem normal passou a usar cards retangulares/horizontais em 2 colunas, com texto à esquerda, imagem lateral à direita, preço e botão de adicionar visíveis, descrição limitada e até 2 badges. Destaques, categorias, busca e listagem passaram a compartilhar a mesma largura/alinhamento.
- Carrinho desktop: o resumo do pedido existente agora aparece como painel lateral fixo ao lado da vitrine, com itens, quantidade, subtotal/total, cupom, estado vazio e botão de envio por WhatsApp. A barra inferior foi ocultada no desktop.
- Mobile: os destaques continuam no topo em rolagem horizontal e a listagem mobile foi preservada. A barra fixa inferior virou uma ação `Ver sacola`, com quantidade e total, mantendo distância da navegação inferior e rolando para o resumo do pedido existente.
- Remoção visual: o bloco de cálculo de taxa/tempo de entrega não aparece no desktop nem no mobile; nenhum dado de entrega foi removido.
- Validações realizadas: `AGENTS.md` lido; `AI_TASK_RULES.md` não encontrado nos diretórios verificados; scripts inline de `index.html` validados com Node; Chrome headless com tenant válido `MZDs5MEb9gNbX4q5xdRYVgzLL252`; desktop confirmou 3 destaques em 3 colunas, cards normais em 2 colunas com `flex-direction: row-reverse`, primeiro card normal com 375x128px e imagem lateral de 128px, larguras alinhadas de 760px para destaques/lista/categorias, carrinho lateral `fixed` com 340px, barra inferior oculta, máximo de 2 badges, ausência de `undefined` e ausência de texto de cálculo de entrega; carrinho após adicionar produto confirmou item lateral, total e botão WhatsApp habilitado; busca por `guaran` funcionou e ocultou destaques durante o filtro; cenário sem destaques confirmou seção ausente; preview mobile confirmou destaques em rolagem, grid normal com 2 colunas, barra `Ver sacola` com quantidade e total, carrinho/resumo presente, navegação inferior preservada, WhatsApp presente, sem `undefined` e sem cálculo de entrega.
- Escopo preservado: `preview-template.html` foi usado apenas para validação e não foi alterado; Firestore Rules, autenticação, Master, checkout, lógica de pedido, WhatsApp e estrutura de dados não foram alterados.
- Pendências: validar manualmente em navegador gráfico com pedidos/carrinho reais de um cliente para ajustar microespaçamentos finais se a loja tiver muitos itens ou descrições muito longas.

## 2026-05-07 — Template público: vitrine com até 3 destaques
- Módulos afetados: Template público da loja; Cardápio > Template da loja.
- Arquivos alterados: `index.html`, `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: substituí o destaque único antigo da vitrine por uma seção pública `Destacados/Destaques` com até 3 produtos definidos pela loja. Sem produtos configurados, a seção é omitida e a listagem normal sobe.
- Configuração: o Template da loja ganhou a seção `Destaques da vitrine`, com 3 seletores de produto. O salvamento grava IDs únicos em `featuredProductIds`, `highlightProductIds` e `showcaseProductIds` dentro da configuração do template, sem criar fallback automático.
- Vitrine pública: os produtos destacados aparecem no topo da vitrine em cards maiores, com imagem, nome, descrição curta, preço e controle de quantidade. No desktop aparecem em até 3 colunas; no mobile aparecem em rolagem horizontal antes da listagem normal.
- Listagem normal: no desktop continua compacta e alinhada à largura da área de destaques; produtos destacados são removidos da listagem normal quando não há busca/filtro ativo, deixando abaixo apenas os demais produtos. Durante busca/filtro de promoção, a seção de destaques é ocultada para os resultados subirem.
- Robustez visual: os cards usam fallback seguro para nome, descrição, imagem e emoji, evitando conteúdo `undefined`; badges continuam limitados a até 2 por produto; repetição visual de `Promoção ativa` segue oculta no desktop quando já há badge/preço promocional claro.
- Validações realizadas: `AGENTS.md` lido; `AI_TASK_RULES.md` não encontrado nos diretórios verificados; `node --check js/modules/catalogo.js`; scripts inline de `index.html` validados com Node; servidor local em `http://127.0.0.1:3000/preview-template.html` com tenant válido `MZDs5MEb9gNbX4q5xdRYVgzLL252`; Chrome headless desktop com 3 destaques simulados confirmou `featuredCount=3`, 3 colunas, 0 destaques repetidos na listagem normal, grid normal com 4 colunas, máximo de 1 badge nos destaques e 2 nos cards normais, ausência de `undefined`, categorias/busca/WhatsApp presentes; carrinho validado com `getCount` de 1 para 2 e WhatsApp habilitado; busca por `guaran` ocultou destaques, filtrou para 1 card e restaurou a listagem; cenário sem destaques confirmou seção ausente e listagem normal com 22 cards; preview mobile confirmou 3 destaques em rolagem horizontal, grid normal com 2 colunas, carrinho fixo, navegação inferior, categorias, busca e WhatsApp presentes, sem `undefined`.
- Escopo preservado: `preview-template.html` foi usado apenas para validação e não foi alterado; checkout, carrinho, WhatsApp, autenticação, Firestore Rules, Master e lógica principal de produtos não foram alterados.
- Pendências: validar manualmente no painel autenticado o salvamento real dos 3 seletores no Firestore e testar com um tenant que já tenha `featuredProductIds` configurado em produção.

## 2026-05-07 — Template público: cards desktop compactos
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: refinei apenas o visual desktop da listagem de produtos, com grid compacto em 3 colunas a partir de desktop e 4 colunas quando há largura suficiente, cards menores, imagem menos alta, descrição limitada a 2 linhas, preço destacado com peso menor e botão `+` menor.
- Destaque e badges: o card grande permanece restrito ao destaque principal (`oferta-card`), com 1 ocorrência validada; cards normais não receberam variação grande. Badges visíveis por produto ficaram limitados a até 2 overlays, e a linha `Promoção ativa` duplicada é ocultada somente no desktop quando já existe preço promocional ou badge.
- Escopo preservado: não alterei Firestore Rules, autenticação, Master, checkout, carrinho, WhatsApp, lógica de produtos nem `preview-template.html`.
- Validações realizadas: `AGENTS.md` lido; `AI_TASK_RULES.md` não encontrado nos diretórios verificados; servidor local em `http://127.0.0.1:3000/preview-template.html` com tenant válido `MZDs5MEb9gNbX4q5xdRYVgzLL252`; desktop direto em `index.html?tenant=MZDs5MEb9gNbX4q5xdRYVgzLL252&lang=es-ES` confirmou 22 cards, grid com 4 colunas em 1280px, primeiro card com 260x290px, 10 cards visíveis na viewport, imagens carregadas nos cards, máximo de 2 badges por card, 0 repetições visíveis de `Promoção ativa` duplicada e 1 `oferta-card`; adição ao carrinho validada em produto simples (`getCount` de 0 para 1 e WhatsApp habilitado); busca validada (`guaran` filtrou para 1 card e restaurou 22); categorias e botão WhatsApp presentes; preview mobile confirmou grid ainda com 2 colunas, card mobile 173x296px, menu mobile presente, categorias, busca e WhatsApp presentes. `preview-template.html` foi usado apenas para validação e não foi alterado.

## 2026-05-07 — Template público: topo limpo e Más información em abas
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: removi o ícone/imagem da tarja promocional do topo, mantendo a faixa apenas com texto e botão de fechar, sem uso de imagem.
- Pontuação/fidelidade: o bloco de pontos do topo e do painel de conta agora só aparece quando há configuração segura de fidelidade ativa (`loyaltyEnabled`, `pointsProgramEnabled`, `customerPoints`, `loyaltyPoints`, `rewardsEnabled` ou `pointsPerEuro > 0` em config existente); sem configuração ativa, fica oculto por padrão. O bloco do topo foi alinhado visualmente com avatar e menu.
- Modal `Más información`: reorganizado em abas de cliente final: `Sobre la tienda`, `Entrega y recogida`, `Pagos` e `Contacto y redes`; campos vazios são omitidos, abas sem conteúdo útil são ocultadas, dados não são repetidos entre abas, links `file:///` não são aceitos e não há linha de `site externo`.
- Textos/traduções: adicionados os textos fixos novos em `pt-BR`, `pt-PT`, `es-ES`, `en` e `fr`, sem traduzir valores cadastrados pela usuária.
- Validações realizadas: `AGENTS.md` lido; `AI_TASK_RULES.md` não encontrado nos diretórios verificados; alteração restrita ao template público e changelog; scripts inline de `index.html` validados com Node; servidor local em `http://127.0.0.1:3000/preview-template.html` com tenant válido `MZDs5MEb9gNbX4q5xdRYVgzLL252`; Chrome headless confirmou preview carregando `index.html?tenant=MZDs5MEb9gNbX4q5xdRYVgzLL252&lang=es-ES`; tarja simulada com texto `Promoción limpia` ficou visível sem `.mi`, `img` ou `svg`; pontos ocultos sem fidelidade (`display:none`) e visíveis/alinhados quando fidelidade foi ativada em memória (`display:flex`, `42 pts`); modal abriu inicialmente em `Sobre la tienda`; abas funcionaram no preview mobile, desktop direto e mobile direto; mobile confirmou `overflow-x:auto` nas abas; campos vazios ficaram fora do DOM da aba ativa; redes sociais simuladas apareceram em `Contacto y redes`; `#cart-section`, `.cart-pill`, categorias, busca e botão WhatsApp continuaram presentes; busca/DOM confirmou ausência de `file:///`.
- Escopo preservado: `preview-template.html` foi usado apenas para validação e não foi alterado; Firestore Rules, autenticação, Master, checkout, carrinho, WhatsApp e estrutura de dados não foram alterados.

## 2026-05-07 — Template público: cor fixa e menu Pedidos por login
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- Resumo do ajuste: fixei a cor dos pontos de destaque/conversão do template público em `#991F00`, removendo a leitura visual de `primaryColor`, `colorPrimary` e `mainColor` para esses pontos.
- Card lateral/comercial: mantida borda fina de `1px`, adicionada sutileza com degradê claro e sombra com tom derivado de `#991F00`, preservando o efeito comercial anterior sem voltar ao laranja.
- Menu `Pedidos`: passou a depender do estado de login no template público; deslogado fica oculto no desktop e no mobile, logado volta a aparecer em ambos.
- Edição de cores: removidos da tela de aparência/configuração os campos editáveis `Cor principal` e `Cor secundária`, preservando valores já salvos apenas como histórico para não apagar dados ao salvar logo/banner/nome.
- Validações realizadas: `AGENTS.md` lido; `AI_TASK_RULES.md` não encontrado no projeto nem nos diretórios acima verificados; arquivos alterados limitados ao template público, configuração visual ligada ao template e changelog; `node --check js/modules/configuracoes.js`; scripts inline de `index.html` validados com Node; busca confirmou ausência de `app-primary-color`, `app-secondary-color`, `Cor principal`, `Cor secundária`, `#E4572E`, `colorPrimary`, `mainColor` e leitura dinâmica de cor para destaque; servidor local em `http://127.0.0.1:3000/preview-template.html?tenant=MZDs5MEb9gNbX4q5xdRYVgzLL252&lang=es-ES`; Chrome headless validou o preview-template.html com tenant válido, `--cta-primary=#991F00`, `--red=#991F00`, card lateral com `border 1px rgba(153, 31, 0, 0.18)` e `linear-gradient(rgb(255, 255, 255), rgb(255, 247, 244))`; Chrome headless validou `Pedidos` deslogado/logado no preview mobile (`none`/visível), desktop direto (`none`/`flex`) e mobile direto (`none`/`flex`).
- Escopo preservado: Firestore Rules, autenticação, Master, checkout, carrinho e WhatsApp não foram alterados.

## 2026-05-07 — Template público: suavização visual do modal “Mis pedidos”
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: suavizei apenas o CSS do modal público `Mis pedidos`, reduzindo peso visual de títulos, labels e valores, removendo aparência de campos/admin nos blocos de `Total`, `Estado`, `Entrega/recogida` e `Pago`, e preservando a hierarquia pedido/data/status/resumo/total/itens/ações.
- Botões: `Ver detalles` continua como ação principal com destaque; `Contactar por WhatsApp` ficou visualmente secundário, com fundo neutro e peso menor.
- Status: badges funcionais preservados com aviso para pendente/preparação, vermelho para cancelado e verde para entregue/finalizado/listo.
- Validações realizadas: `AGENTS.md` lido; `AI_TASK_RULES.md` não encontrado no projeto; arquivos necessários limitados a `index.html` e `AI_CHANGELOG.md`; alteração restrita a visual/CSS do modal de pedidos; scripts inline de `index.html` validados com Node; `preview-template.html` usado somente para validação em `http://127.0.0.1:3000/preview-template.html` com tenant válido; Chrome headless confirmou preview mobile; Chrome headless com pedido simulado apenas em memória validou desktop e mobile, com título em peso `600`, blocos de fatos sem fundo/borda de campo, valores em peso `500`, botão secundário neutro e botões em largura adequada no mobile; busca confirmou ausência de `file:///`.
- Pendências: validar manualmente no navegador gráfico com pedidos reais para confirmar a percepção visual final em dados reais do tenant.

## 2026-05-07 — Template público: filtro de produtos por promoção
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: o botão do modal público de promoções deixou de abrir automaticamente o primeiro produto vinculado e passou a aplicar um filtro temporário na vitrine pública com os produtos relacionados à promoção clicada.
- Nova ação do botão da promoção: `Ver productos`, `Ver oferta` e `Usar promoción` fecham o modal, rolam até a área de produtos e renderizam a lista `Productos de esta promoción`, com chip/aviso de promoção ativa e botão `Ver todos los productos`.
- Comportamento com múltiplos produtos: quando a promoção possui vários `productIds`, todos os produtos válidos e visíveis são exibidos na lista filtrada; nenhum produto isolado é aberto por padrão.
- Fallback: quando a promoção não possui produtos válidos, a vitrine completa permanece disponível e o cliente recebe a mensagem `Esta promoción no tiene productos disponibles en este momento.`
- Textos novos adicionados: `Productos de esta promoción`, `Ver todos los productos` e `Esta promoción no tiene productos disponibles en este momento.` em `pt-BR`, `pt-PT`, `es-ES`, `en` e `fr`.
- Validações realizadas: `AGENTS.md` lido; arquivos necessários limitados a `index.html` e `AI_CHANGELOG.md`; `preview-template.html` usado somente para validação; scripts inline de `index.html` validados com Node; servidor local em `http://127.0.0.1:3000/preview-template.html`; Chrome headless desktop com promoção simulada em memória confirmou modal com 3 produtos vinculados, clique no botão abrindo lista filtrada com 3 cards, `detailOpen=false` e botão `Ver todos los productos` restaurando a lista completa; Chrome headless mobile confirmou o mesmo filtro com 3 cards; fallback com produtos inexistentes confirmou toast amigável e lista completa preservada; busca confirmou ausência de `file:///`.
- Pendências: validar manualmente com tenant real que possua promoções ativas com múltiplos produtos no Firestore para conferir os vínculos reais cadastrados.

## 2026-05-07 — Template público: modal “Meus pedidos”
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste no modal de pedidos: o painel aberto por `Pedidos` passou a funcionar como área pública de `Mis pedidos`, com subtítulo, estado não logado, estado vazio, cards visuais de pedido, referência curta em vez de ID completo, status com cores, data formatada, total, entrega/retirada, pagamento, resumo de produtos, botão `Ver detalles` com expansão e botão `Contactar por WhatsApp` quando há telefone da loja.
- Textos novos adicionados: `Mis pedidos`, `Consulta el estado de tus últimos pedidos.`, `Aún no tienes pedidos`, `Cuando hagas un pedido, aparecerá aquí.`, `Entra o regístrate para ver tus pedidos.`, `Ver detalles`, `Contactar por WhatsApp`, `Ver productos`, `Total`, `Productos`, `Pedido`, `Pendiente`, `Cancelado`, `Entregado`, `En preparación`, `Listo para retirar`, além de rótulos de entrega/retirada, pagamento, observação e endereço em `pt-BR`, `pt-PT`, `es-ES`, `en` e `fr`.
- Dados técnicos removidos da apresentação pública: o ID completo do Firestore deixa de ser título do pedido; a interface mostra apenas referência curta, campos preenchidos e labels traduzidos, sem objetos brutos, valores nulos ou datas sem formatação.
- Validações realizadas: `AGENTS.md` lido; arquivos necessários limitados a `index.html` e `AI_CHANGELOG.md`; `preview-template.html` usado somente para validação; scripts inline de `index.html` validados com Node; servidor local em `http://127.0.0.1:3000/preview-template.html`; Chrome headless confirmou o preview mobile; Chrome headless confirmou estado não logado com `Entra o regístrate para ver tus pedidos`; Chrome headless com pedido simulado apenas em memória confirmou `Mis pedidos`, referência curta `Pedido #DEFGHI`, data `01/05/2026`, total `€23,00`, status `En preparación`, resumo de produtos, `Ver detalles`, expansão de detalhes e `Contactar por WhatsApp`; busca confirmou ausência de `file:///`.
- Pendências: validar manualmente em navegador gráfico com cliente real logado e pedidos reais no Firestore para conferir a consulta, os estados de status dinâmicos e o clique final de WhatsApp em ambiente real.

## 2026-05-07 — Template público: modal comercial de promoções
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste no modal de promoções: o painel aberto por `Promoções` passou a usar título comercial, subtítulo de conversão, cards de oferta com badge/ícone, título tratado com fallback para nomes técnicos, benefício em destaque, produtos relacionados como `Válido para`, validade formatada e botão de ação seguro para produto ou lista de produtos.
- Textos novos adicionados: `Promociones activas`, `Aprovecha las ofertas disponibles antes de finalizar tu pedido.`, `No hay promociones activas`, `Cuando la tienda active una oferta, aparecerá aquí.`, `Oferta especial`, `Descuento disponible`, `Promoción por tiempo limitado`, `Cupón disponible`, `Válido para`, `Válido hasta`, `Ver productos`, `Usar promoción`, `Ver oferta`, além dos textos fixos de benefício para desconto, 2x1, leve/pague e oferta em produtos selecionados em `pt-BR`, `pt-PT`, `es-ES`, `en` e `fr`.
- Dados técnicos removidos da apresentação pública: o modal não concatena mais tipo bruto, data solta ou o rótulo técnico `Produtos relacionados`; nomes fracos como `promo`, `ofeta` e `prmo` recebem fallback comercial no título.
- Validações realizadas: `AGENTS.md` lido; arquivos necessários limitados a `index.html` e `AI_CHANGELOG.md`; `preview-template.html` usado somente para validação; scripts inline de `index.html` validados com Node; servidor local em `http://127.0.0.1:3000/preview-template.html`; Chrome headless com tenant válido confirmou o estado vazio do modal; Chrome headless com promoção ativa simulada apenas em memória confirmou cards com `Promociones activas`, benefício claro, `Válido para`, `Válido hasta 08/05/2026` e botão `Ver productos`; screenshot mobile do preview gerado; busca confirmou ausência de `file:///`, `Produtos relacionados:` e `Productos relacionados:` na interface estática.
- Pendências: validar manualmente em navegador gráfico com um tenant real que já possua promoções ativas/cupones ativos no Firestore, para conferir dados reais e cliques finais em todas as variações de promoção.

## 2026-05-07 — Template público: configuração do card comercial do topo
- Módulo afetado: Template público da loja; Cardápio > Template da loja.
- Arquivos alterados: `index.html`, `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Nova configuração criada no Template da loja: seção `Destaque comercial do topo`, com toggle `Ativar card de destaque`, select de tipo (`Nenhum`, `Cupom ativo`, `Promoção ativa`, `Produto destaque`, `Produto mais pedido`, `Texto personalizado`), título, texto, texto do botão, ação/destino do botão e produto vinculado.
- Comportamento do card lateral: o template público agora só exibe o card comercial quando `featuredActionEnabled` está ativo e `featuredActionType` tem um tipo válido diferente de `none`; o card usa título, texto, ícone, botão, produto vinculado e ação configurados com fallback seguro.
- Regra desktop sem card lateral: quando não há destaque configurado ou não há conteúdo válido, o card lateral fica oculto e o card principal de informações da loja passa a usar a classe `no-featured`, expandindo sua largura para ocupar melhor o topo sem deixar buraco à direita.
- Regra mobile sem card lateral: quando não há destaque configurado ou válido, o card comercial fica totalmente oculto e não reserva espaço no fluxo mobile.
- Ações do botão: cupom aplica o cupom e leva ao carrinho; promoção abre painel de promoções ou produto relacionado; produto abre o modal do produto; seção de produtos rola para produtos; `Nenhuma ação` deixa o botão sem navegação útil e o botão pode ser ocultado quando não há rótulo.
- Validações realizadas: `AGENTS.md` lido; arquivos necessários limitados a `index.html`, `js/modules/catalogo.js` e `AI_CHANGELOG.md`; `preview-template.html` usado somente para validação mobile; `node --check js/modules/catalogo.js`; scripts inline de `index.html` validados com Node; busca por `tpl-featured`, `featuredActionEnabled`, `featuredActionType`, `featuredActionProductId`, `store-top-info.no-featured` e `file:///`; screenshot desktop com tenant válido sem card lateral; screenshot mobile via `http://127.0.0.1:3000/preview-template.html` sem card lateral; conferido visualmente que o desktop expande o card principal e o mobile não deixa espaço vazio.
- Pendências: validar no navegador gráfico autenticado a edição real do Template da loja e salvamento no Firestore; validar visualmente com tenant que já tenha `featuredActionEnabled=true` e tipos `coupon`, `promotion`, `featured_product`, `most_ordered` e `custom`, pois o tenant local usado na captura ainda não tem essa nova configuração salva.

## 2026-05-07 — Template público: cor principal nos destaques e navegação
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo do ajuste: mantive a base neutra do template e passei a usar a cor principal configurada da loja apenas nos pontos de destaque/conversão, sem aplicar a cor na estrutura geral. Também aumentei e centralizei melhor o menu superior desktop e substituí as ações antigas de rolagem por painéis de navegação para promoções e pedidos.
- Campo de cor principal usado: `primaryColor`, com aliases seguros `colorPrimary` e `mainColor` apenas como fallback; `secondaryColor` continua preservado nos dados, mas não é usado visualmente no template público.
- Onde a cor principal passou a ser aplicada: botões comerciais, botão `Ver cupón`/`Ver promoción`, categoria ativa, links de ação, ícones/badges de destaque, botões de adicionar e elementos ativos relevantes. Fundos, cards, caixa principal da loja, chips neutros, navegação estrutural, status e áreas de suporte continuam neutros ou funcionais.
- Paleta automática: removi a aplicação obrigatória de paleta derivada no template público; o CSS/JS aplica a cor principal diretamente nos destaques e mantém neutros fixos para estrutura e cores funcionais fixas para status.
- Ações de navegação ajustadas: `Promoções` abre um painel com promoções ativas e estado vazio; `Pedidos` abre painel de pedidos do cliente quando logado e estado vazio quando não há pedidos; `Entrar/Registrar` fica oculto quando há usuário logado; bolinha/avatar e item `Perfil` abrem o painel de conta/perfil existente, agora com nome, telefone quando existir, e-mail, pedidos e sair.
- Validações realizadas: `AGENTS.md` lido; arquivos necessários limitados a `index.html` e `AI_CHANGELOG.md`; `preview-template.html` usado somente para validação mobile; scripts inline de `index.html` validados com Node; busca por `file:///`, `deriveStorePalette`, `mixColor`, laranjas estruturais antigos e uso visual de `secondaryColor`; screenshot desktop direto em `index.html` com tenant válido; screenshot mobile via `http://127.0.0.1:3000/preview-template.html`; conferidos base neutra, status fechado em vermelho, menu desktop maior/centralizado, categorias, busca, carrinho e WhatsApp renderizando.
- Pendências: validar em navegador gráfico com sessão real logada para confirmar visualmente a ocultação de `Entrar/Registrar` e o painel de perfil com dados reais; validar com tenant que tenha `primaryColor` diferente do fallback para confirmar a troca cromática perceptível; validar manualmente os cliques de `Promoções` e `Pedidos` com dados reais de Firestore.

## 2026-05-07 — Preview interno: visualização apenas mobile
- Módulo afetado: Ferramenta interna de desenvolvimento / Preview do template público.
- Arquivos alterados: `preview-template.html`, `AI_CHANGELOG.md`.
- Resumo da simplificação: removi o seletor de visualização, os modos Desktop/Mobile/Ambos, o bloco Desktop, o botão de recarregar Desktop, o iframe desktop e a lógica JavaScript relacionada a desktop/ambos.
- Confirmação: o preview interno agora mostra somente a versão mobile do template público, com moldura de celular centralizada, campo `Tenant ID`, seletor de idioma, botão `Atualizar preview`, botão `Abrir loja em nova aba`, botão `Recarregar preview` e exibição da URL carregada.
- Comportamento da URL: o iframe mobile continua carregando `index.html?tenant=TENANT_ID&lang=IDIOMA`; quando o tenant está vazio, a ferramenta mostra aviso claro e usa o fallback local do template.
- Validações realizadas: `AGENTS.md` lido; arquivos necessários limitados a `preview-template.html` e `AI_CHANGELOG.md`; `index.html`, `admin.html`, `master.html`, Firestore Rules, autenticação, carrinho, pedidos, checkout, WhatsApp e dados não foram alterados; scripts inline de `preview-template.html` validados com Node; busca confirmou ausência de `Desktop`, `desktop`, `Ambos`, `both`, `view-select`, `desktop-frame` e `desktop-url`; servidor local em `http://127.0.0.1:3000/preview-template.html`; screenshot Chrome headless com tenant válido confirmou somente preview mobile, Tenant ID aplicado, idioma enviado por query param e URL do iframe exibida.
- Pendências: validar manualmente o clique real em `Abrir loja em nova aba` no navegador gráfico, pois a validação automática headless confirmou a ligação do botão e a URL gerada, mas não abriu uma aba visível.

## 2026-05-07 — Template público: ajuste fino de status e leitura dos cards
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo dos ajustes visuais: removi o status aberto/fechado da navegação superior no desktop, mantendo o status apenas dentro do card principal da loja; no mobile, o status foi removido do card branco principal e permanece apenas como badge discreto fora do card. Também reduzi o peso visual dos títulos do card principal, card comercial e modal de informações, e reforcei textos importantes dos cards para preto/quase preto.
- Estados visuais ajustados: status aberto usa verde (`success`), fechado/fechado temporariamente usa vermelho (`danger`) e estados especiais de atenção/agendamento usam amarelo (`warning`) quando identificados; localização, entrega, retirada, preparo e descrição da loja ficaram com contraste mais forte dentro dos cards.
- Validações realizadas: `AGENTS.md` lido; arquivos necessários limitados a `index.html` e `AI_CHANGELOG.md`; `preview-template.html` usado somente para validação; scripts inline de `index.html` validados com Node; servidor local em `http://127.0.0.1:3000/preview-template.html`; screenshots Chrome headless em Desktop, Mobile e Ambos com tenant válido; conferido que no desktop o status não aparece mais no topo/navegação e aparece no card principal em verde; conferido que no mobile o status não aparece dentro do card principal; conferidos títulos mais leves, textos importantes com maior contraste, categorias, busca, produtos, carrinho e WhatsApp renderizando.
- Pendências: validar visualmente com um tenant real configurado como fechado/fechado temporariamente e outro com status especial de atenção/agendamento para conferir esses estados dinâmicos no navegador, além da validação de CSS/JS já feita.

## 2026-05-07 — Template público: paleta neutra com CTAs de conversão
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Resumo da mudança de paleta: substituí o vermelho como base estrutural do template por uma base neutra, preservando a estrutura visual já implementada e concentrando a cor forte apenas em ações de conversão, links relevantes e destaques comerciais.
- Tokens/cores adotados: base neutra `--bg-page: #F7F5F2`, `--bg-surface: #FFFFFF`, `--bg-soft: #F1EEEA`, `--border-soft: #E4DED6`, `--text-primary: #1F1F1C`, `--text-secondary: #6B6A66`; CTA `--cta-primary: #E4572E`, `--cta-primary-hover: #CC4A24`, `--cta-soft: #FFF1EB`, `--cta-text-on-solid: #FFFFFF`; funcionais `--success: #1FA971`, `--success-soft: #E9F8F1`, `--warning: #D9A441`, `--warning-soft: #FFF7E7`, `--danger: #C94B4B`, `--danger-soft: #FDEEEE`.
- Onde foram aplicados: fundos, navegação, cards, caixa principal da loja, busca, categorias inativas, áreas secundárias, modal/drawer e carrinho visual usam base neutra; botões principais, links de ação, botão de adicionar, categorias ativas, cupom/promoção/destaque e card comercial usam CTA; loja aberta/disponível usa success; avisos e pontos usam warning; loja fechada, erros e indisponibilidade usam danger.
- Confirmação sobre `primaryColor`: o campo salvo do tenant continua preservado nos dados, mas não controla mais livremente a paleta pública; o template usa a paleta fixa neutra/CTA definida no próprio CSS/JS.
- Campos ignorados/removidos da interface: o bloco “Calcular taxa e tempo de entrega” continua fora do topo; `Site externo` e `file:///` não são usados; o banner promocional mantém cor própria apenas como peça isolada quando configurado.
- Validações realizadas: `AGENTS.md` lido; arquivos necessários limitados a `index.html`, `AI_CHANGELOG.md` e `preview-template.html` apenas para validação; scripts inline de `index.html` validados com Node; busca por vermelhos estruturais antigos e `file:///`; servidor local em `http://127.0.0.1:3000/preview-template.html`; validação visual do preview em Desktop, Mobile e Ambos com tenant válido; conferidos base neutra, identidade por logo/capa/textos, CTAs fortes, status aberto em success, estados danger disponíveis, categorias, busca, produtos, carrinho e WhatsApp renderizando.
- Pendências: validar em tenants publicados com combinações reais de capa, banner promocional, loja fechada, cupons, promoções e produtos em destaque para confirmar todos os estados dinâmicos fora do ambiente local.

## 2026-05-07 — Ferramenta interna: preview desktop/mobile do template público
- Módulo afetado: Ferramenta interna de desenvolvimento / Preview do template público.
- Arquivo criado: `preview-template.html`.
- Resumo da ferramenta: criei uma página interna isolada para visualizar `index.html` dentro de iframes em modo Desktop, Mobile ou Ambos, com campo de `Tenant ID`, seletor de idioma preparado via query param `lang`, botões para atualizar todos os previews, recarregar cada iframe e abrir a loja em nova aba.
- Como acessar: `http://127.0.0.1:3000/preview-template.html`; opcionalmente usar query params como `preview-template.html?tenant=TENANT_ID&view=both&lang=es-ES`.
- Observações: a ferramenta não salva dados, não acessa Firestore diretamente, não altera tenant, não muda carrinho, produtos, checkout, WhatsApp, autenticação, Master, Firestore Rules ou `index.html`.
- Validações realizadas: `AGENTS.md` lido; arquivos necessários limitados a `preview-template.html` e `AI_CHANGELOG.md`; HTML criado sem bibliotecas externas; servidor local em `http://127.0.0.1:3000/preview-template.html`; verificados preview Desktop, preview Mobile, opção Ambos, botão Atualizar preview, botões de recarregar individualmente e botão Abrir loja em nova aba; confirmado que a ferramenta apenas carrega `index.html` por iframe.
- Pendências: o seletor de idioma envia `lang` na URL, mas depende de suporte do template público a esse query param para alterar efetivamente o idioma renderizado.

## 2026-05-07 — Template público: topo Boca Food conforme referências desktop/mobile
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Imagens usadas como referência: `modelo_Template desktop.png` e `modelo_Template mobile.png`.
- Recriei o topo público para aproximar a hierarquia das referências: banner promocional opcional, navegação superior limpa, capa apenas visual, card branco principal com identidade da loja, chips resumidos e card comercial ao lado no desktop/abaixo no mobile.
- Conectei o card comercial principal com fallback seguro para `featuredActionEnabled`, `featuredActionType`, `featuredActionTitle`, `featuredActionText`, `featuredActionButtonLabel`, `featuredActionTarget`, `activeCoupon`, `activePromotion`, `featuredProduct`, `mostOrderedProduct` e `loyaltyEnabled`; quando não há ação comercial, o card fica oculto.
- Campos conectados/preservados no topo e no modal: banner promocional, capa, logo, nomes públicos, slogan/descrição, idioma, país fiscal, cidade/região/endereço/Google Maps, status/horários, entrega/retirada/preparo, contatos, pagamentos e textos institucionais.
- Campos ignorados/removidos da interface: bloco operacional “Calcular taxa e tempo de entrega”; `primaryColor` salvo continua preservado nos dados, mas não é usado como controle livre principal do visual; `Site externo` e `file:///` não são usados.
- Ampliei “Mais informações” para ocultar campos vazios e mostrar nome, descrição, endereço permitido, cidade/região, horários, retirada, entrega, formas de pagamento, WhatsApp, telefone, email, redes sociais, aviso importante e políticas.
- Mantive categorias, busca, produtos, carrinho, WhatsApp, checkout, autenticação, Master e Firestore Rules sem mudança de lógica.
- Validações realizadas: `AGENTS.md` lido; referências desktop/mobile abertas; arquivos necessários limitados a `index.html` e `AI_CHANGELOG.md`; scripts inline de `index.html` validados com Node; busca por `Calcular`, `deliveryCalc`, `file:///` e `Site externo` sem ocorrências; servidor local em `http://127.0.0.1:4177/index.html`; screenshots Chrome headless desktop e mobile; checagem visual de capa sem texto central, card branco, card comercial, categorias, busca, carrinho fixo, WhatsApp e navegação mobile.
- Pendências: validar com tenant real publicado contendo capa ativa, banner promocional ativo e promoções/cupones reais de Firestore para confirmar todas as combinações dinâmicas.

## 2026-05-07 — Template público: hierarquia visual do topo
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Ajustei a hierarquia do topo público para separar navegação, capa, informações da loja, cálculo de entrega e categorias/busca, sem redesenhar produtos, carrinho, WhatsApp ou fluxo de pedido.
- A capa da loja passou a ser apenas área visual: removi a repetição de logo, nome, slogan e localização centralizados no hero quando o bloco de informações está ativo.
- No desktop, o resumo da loja fica integrado abaixo da capa, com logo sobreposto à esquerda, nome, slogan, status, chips reais de entrega/retirada e botão `Mais informações`; o bloco de cálculo fica separado como card lateral quando ativo.
- No mobile, o resumo fica como card branco sobreposto à capa, compacto e centralizado, com logo, nome, slogan, status e `Mais informações`; os chips extensos ficam ocultos no topo mobile para reduzir repetição visual.
- Mantive categorias e busca abaixo do topo, alinhadas à largura principal do conteúdo, preservando a lógica atual de filtro e pesquisa.
- Ajustei a navegação inferior mobile para quatro colunas e preservei o item `Perfil` com fallback fixo, sem interferir no carrinho fixo ou no botão WhatsApp.
- Preservei o suporte existente a idiomas (`pt-BR`, `pt-PT`, `es-ES`, `en`, `fr`) e não alterei nomes, categorias, descrições ou textos cadastrados pela usuária.
- Validações realizadas: `AGENTS.md` relido; sintaxe dos scripts inline do `index.html`; busca por `file:///` no `index.html` sem ocorrências; servidor local limpo; screenshot Chrome headless desktop e mobile/responsivo.
- Pendências: a captura mobile ainda evidencia largura pré-existente nos cards/área fixa do pedido à direita; não corrigi essa parte porque cards, carrinho e fluxo de pedido estão fora do escopo desta tarefa.

## 2026-05-07 — Template público e Template da loja: capa persistente e paleta por cor principal
- Módulo afetado: Template público da loja; Cardápio > Template da loja.
- Arquivos alterados: `index.html`, `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Consolidei a primeira implementação do topo público sem redesenhar a loja: mantive navegação desktop/mobile, card/resumo, banner promocional, chips, busca, categorias, carrinho e WhatsApp.
- Corrigi o fluxo da imagem de capa da loja no admin: o upload em `Cardápio > Template da loja` agora salva imediatamente a URL pública em `config/template`, `config/geral` e `config/aparencia`, usando aliases compatíveis `coverImageUrl` e `bannerUrl`, além dos metadados de Storage quando disponíveis.
- Padronizei a diferença entre banner promocional de texto e imagem de capa da loja no rótulo/ajuda do admin e no preview.
- Incluí o campo claro `Cor principal da loja` com color picker, valor hexadecimal sincronizado e preview visual.
- Adicionei geração automática de cores de apoio a partir da cor principal: principal, escura, clara, fundo suave, borda/acento, contraste, hover, badge suave e chip suave.
- A paleta passou a ser salva em `colorPalette`/`supportColors` e usada no preview do admin e no template público em variáveis CSS, estados ativos, banner promocional, chips, botões e detalhes do topo.
- Preservei os dados existentes do tenant com `merge` e aliases legados; não foram alterados cards de produto, carrinho, checkout, pedido, autenticação, Master ou Firestore Rules.
- Validações realizadas: `node --check js/modules/catalogo.js`; validação dos scripts inline de `index.html`; busca por `file:///` em `index.html` e `js/modules/catalogo.js`; servidor local e screenshots Chrome headless desktop/mobile do template público.
- Pendências: validar upload e recarregamento da imagem/cor em navegador real com tenant autenticado e Firebase Storage ativo, pois essa etapa depende de sessão e permissões reais.

## 2026-05-07 — Template público da loja: topo personalizável e i18n inicial
- Módulo afetado: Template público da loja.
- Arquivos alterados: `index.html`, `AI_CHANGELOG.md`.
- Ajustei o topo público mantendo a identidade atual: navegação desktop horizontal, navegação inferior mobile, capa configurável, card/resumo da loja, botão/modal de mais informações e banner promocional opcional com fechamento por sessão/localStorage.
- Campos preparados/lidos: `showPromoBanner`, `promoBannerText`, `promoBannerColor`, `promoBannerDismissible`, `useCoverImage`, `showStoreSummaryCard`, `showCityRegion`, `showMoreInfoButton`, `showDeliveryPickupChips`, `showDeliveryCalculator`, `showDesktopNavigation`, `showMobileBottomNavigation`, `showPromotionsNavItem`, `showOrdersNavItem`, `showLoginNavItem`, `promotionsNavLabel`, `ordersNavLabel`, `language`, `mainLanguage`, `storeLanguage`, `publicStoreName`, `shortStoreName`, `slogan`, `storeDescription`, `logoUrl`, `coverImageUrl`, `primaryColor`, `secondaryColor`, `fiscalCountry`, dados de endereço, entrega/retirada, contato, horários/status, pagamentos e políticas.
- Idiomas adicionados para textos fixos do template público: `pt-BR`, `pt-PT`, `es-ES`, `en`, `fr`, com fallback em `es-ES`.
- Ajustes responsivos: desktop mantém navegação superior; mobile usa navegação inferior fixa e espaçamento para preservar prioridade do carrinho/WhatsApp.
- Observações: produtos, categorias e descrições cadastradas continuam sem tradução automática; não foram alterados cards de produto, carrinho, pedido, checkout, autenticação, Master, admin ou Firestore Rules.
- Validações realizadas: sintaxe dos scripts inline com Node; servidor local em `http://127.0.0.1:4177/index.html`; screenshots Chrome headless desktop e mobile; busca por `file:///` no `index.html` sem ocorrências.
- Pendências: validar em navegador real com tenant publicado e dados reais de capa/banner/status/idioma para conferir todas as combinações de configuração.

## 2026-05-07 — Cardápio: Avaliações movidas de Pedidos
- Módulo afetado: Pedidos e Cardápio.
- Arquivos alterados: `admin.html`, `js/modules/catalogo.js`, `js/modules/pedidos.js`, `AI_CHANGELOG.md`.
- Removi `Avaliações` do submenu lateral de `Pedidos`.
- Incluí `Avaliações` no submenu e nas abas principais de `Cardápio`, logo após `Produtos`.
- A tela atual de avaliações foi reaproveitada via `Modules.Pedidos`, preservando métricas, filtros, listagem, abertura do detalhe, aprovação e rejeição.
- Rota nova: `catalogo/avaliacoes`.
- Rota antiga: `pedidos/avaliacoes` permanece registrada e redireciona para `catalogo/avaliacoes`.
- Ajustei a copy da seção em Cardápio para tratar avaliações como prova social exibida na loja pública.
- Validações realizadas: checagem sintática de `admin.html`, `js/modules/catalogo.js` e `js/modules/pedidos.js`; busca pontual de menu/rotas.
- Pendências: validar em navegador com tenant autenticado aprovar/rejeitar avaliações e filtros em execução real.

## 2026-05-07 — Produção: filtro Tipo de Insumos interligado com Categoria
- Módulo afetado: Produção > Insumos.
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`.
- Reincluí o filtro `Tipo` na tela `Produção > Insumos`, sem voltar com o filtro `Classe`.
- O filtro `Tipo` usa somente tipos ativos com `classe: 'insumo'`, em ordem alfabética, com opção `Todos os tipos`.
- O filtro `Categoria` permanece restrito a categorias ativas de insumo, em ordem alfabética, com opção `Todas categorias`.
- Interliguei `Tipo` e `Categoria`: ao escolher um deles, o outro passa a listar apenas valores usados por insumos compatíveis, limpando a seleção quando ela não se aplica mais.
- Ajustei o layout para `Busca`, `Tipo`, `Categoria`, `Status` e `Limpar`, mantendo a busca larga e sem incluir `Classe`.
- Observações: não foram alteradas coleções, permissões, regras Firebase ou estrutura de dados.
- Pendências: validar no navegador com tenant autenticado os filtros cruzados e console limpo.

## 2026-05-07 — Produção: remover filtro Classe de Insumos
- Módulo afetado: Produção > Insumos.
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`.
- Removi o filtro visual `Classe` da área de filtros de `Produção > Insumos`.
- A área de filtros agora fica com `Busca`, `Categoria`, `Status` e o botão `Limpar`, com o campo de busca mais largo.
- Mantive a coluna `Classe`, a coluna `Tipo`, o modal Novo/Editar Insumo e a lógica de classe do cadastro.
- Observações: não foram alteradas coleções, permissões, regras Firebase ou estrutura de dados.
- Pendências: validar em navegador com tenant autenticado a tela carregando e console limpo.

## 2026-05-07 — Produção: filtros e catálogos de Insumos estritos por classe
- Módulo afetado: Produção > Insumos, Modal Novo/Editar Insumo, Produção > Configurações e Compras > Configurações.
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`.
- Corrigi a fonte das listas de `Tipo` e `Categoria` em contextos de Insumo para usar somente registros ativos com `classe: 'insumo'`.
- O filtro `Categoria` de `Produção > Insumos` agora ignora registros de Produto, registros globais/sem classe e registros `ambos`, ficando estritamente na classe Insumo e em ordem alfabética.
- Removi qualquer efeito residual do filtro oculto `Tipo` ao abrir `Produção > Insumos`, limpando `_itensFilters.tipo` nesse fluxo.
- Aumentei a largura do campo `Busca` e simplifiquei o placeholder para `Nome, categoria, classe, fornecedor, unidade...`.
- Mantive o campo `Tipo` e a coluna `Tipo`; a remoção continua limitada ao filtro da listagem.
- Origem encontrada: a função compartilhada de catálogo aceitava registros sem classe ou `classe: 'ambos'` quando recebia `insumo`, o que podia exibir dados antigos/globais nas listas de Insumo.
- Observações: não foram criadas coleções novas nem alteradas regras Firebase, permissões ou estrutura de dados.
- Pendências: validar em navegador com tenant autenticado criação/edição/exclusão e console limpo.

## 2026-05-07 — Produção: restaurar Categorias da receita em Configurações
- Módulo afetado: Produção > Configurações.
- Arquivos alterados: `js/modules/receitas.js`, `AI_CHANGELOG.md`.
- Restaurei a subaba `Categorias da receita`, que usa os cadastros próprios de categorias das fichas técnicas.
- Mantive `Tipos de insumos` e `Categorias de insumos` como subtabs separadas, usando os dados compartilhados com Compras.
- Observações: não foram alteradas coleções, regras Firebase, permissões ou dados existentes.

## 2026-05-07 — Produção: Tipos e Categorias de Insumos em Configurações
- Módulo afetado: Produção > Configurações, Compras > Configurações e Produção > Insumos.
- Arquivos alterados: `js/modules/receitas.js`, `js/modules/compras.js`, `AI_CHANGELOG.md`.
- Incluí as subtabs `Tipos de insumos` e `Categorias de insumos` dentro de `Produção > Configurações`, junto de `Componentes da receita` e `Unidades`.
- As novas subtabs usam as mesmas coleções já usadas em Compras: `compras_tipos` e `compras_categorias`.
- Em Produção, os cadastros exibem apenas registros com `classe: 'insumo'`, em ordem alfabética, sem mostrar registros da classe Produto.
- Adicionei cadastro, edição e exclusão desses tipos/categorias diretamente pela Produção, mantendo os dados compartilhados com Compras e com o modal Novo/Editar Insumo.
- Ajustei rotas internas para `receitas/configuracoes/tipos-insumos` e `receitas/configuracoes/categorias-insumos`, mantendo compatibilidade com rotas antigas de categorias.
- Reforcei a validação contra duplicidade por nome e classe também em `Compras > Configurações`, ignorando maiúsculas/minúsculas e espaços extras.
- Observações: não foram criadas coleções novas nem alteradas regras Firebase, permissões ou estrutura de dados.
- Pendências: validar em navegador com tenant autenticado o CRUD real, a sincronização visual entre Compras/Produção e console limpo.

## 2026-05-07 — Produção: Insumos sem filtro Tipo e modal com cadastro rápido
- Módulo afetado: Produção > Insumos / Modal Novo Insumo / Modal Editar Insumo.
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`.
- Removi o filtro `Tipo` da listagem de `Produção > Insumos`, mantendo `Busca`, `Classe`, `Categoria`, `Status` e `Limpar` alinhados no card de filtros.
- Removi a coluna `Venda` da tabela quando a tela está em modo `Insumos`, mantendo as colunas `Nome`, `Classe`, `Tipo`, `Categoria`, `Unidade`, `Custo atual` e `Ações`.
- Troquei os campos `Tipo` e `Categoria` do modal Novo/Editar Insumo por dropdowns pesquisáveis com fundo claro, lista alinhada ao campo e cadastro rápido.
- O cadastro rápido cria `compras_tipos` ou `compras_categorias` para o tenant atual, evita duplicidade por nome normalizado dentro da classe atual e seleciona o novo valor imediatamente.
- Garanti ordenação alfabética das listas de `Tipo` e `Categoria` usadas no modal e nos filtros.
- Ajustei `Embalagem de compra padrão` para um dropdown pesquisável sem cadastro rápido, usando apenas opções em português: `bandeja`, `bolsa`, `caixa`, `fardo`, `frasco`, `garrafa`, `lata`, `pacote`, `saco` e `unidade`.
- Observações: não foram alteradas coleções existentes, permissões, Firebase Rules ou regras de salvamento de insumo.
- Pendências: validar em navegador com tenant autenticado o cadastro rápido real e o console limpo durante criação/edição.

## 2026-05-07 — Produção: cadastros auxiliares agrupados em Configurações
- Módulo afetado: Produção / Receitas / Insumos / Componentes da receita / Categorias / Unidades.
- Arquivos alterados: `admin.html`, `js/modules/receitas.js`, `AI_CHANGELOG.md`.
- Reorganizei o submenu lateral de Produção para exibir apenas `Receitas`, `Insumos` e `Configurações`.
- Reorganizei as abas superiores de Produção para exibir apenas `Receitas`, `Insumos` e `Configurações`.
- Agrupei `Componentes da receita`, `Categorias` e `Unidades` como subtabs internas dentro de `Produção > Configurações`.
- Mantive as funções existentes de cadastro, edição, exclusão e listagem desses três cadastros, alterando apenas o contêiner de navegação.
- Ajustei compatibilidade de rotas antigas como `receitas/componentes`, `receitas/categorias-receita`, `receitas/categorias` e `receitas/unidades`, redirecionando para o novo padrão `receitas/configuracoes/...`.
- Observações: não foram alteradas coleções, permissões, regras Firebase ou estrutura de dados.
- Pendências: validação funcional completa em navegador com tenant autenticado para confirmar ações reais de CRUD e console limpo.

## 2026-05-07 — Cardápio: Template e SEO mais práticos para o topo da loja
- Módulo afetado: Cardápio > Template da loja, Cardápio > SEO da loja e topo do template público.
- Arquivos alterados: `js/modules/catalogo.js`, `index.html`, `AI_CHANGELOG.md`.
- Reorganizei o `Template da loja` em blocos práticos: `Topo da loja`, `Identidade visual`, `Entrega e retirada`, `Horários e status`, `Contato`, `Endereço`, `Pagamentos`, `Finalização do pedido`, `Textos institucionais` e `Avançado`.
- Reorganizei o `SEO da loja` em `Google`, `SEO local`, `Compartilhamento` e `Avançado`, movendo campos técnicos como URL canônica, Schema/JSON-LD, meta robots e indexação para a área avançada.
- Campos removidos da interface: `Site externo` saiu do Template da loja e não é mais usado em preview, domínio, canonical, URL pública ou publicação.
- Campos novos criados em `config/template`: controles do banner promocional, uso de capa no topo, resumo sobre a capa, cidade/região, botão de mais informações, chips de entrega/retirada, bloco de cálculo de entrega, modo de status da loja e formas locais de pagamento por país fiscal.
- Ajustei labels: `País fiscal da loja`, `Documento fiscal da loja`, `Cidade`, `Área de entrega`, `Instruções para retirada`, `Texto do botão de pedido`, `Mensagem inicial do pedido no WhatsApp` e `Aviso antes de enviar o pedido`.
- Ajustes no preview: o Template agora mostra uma prévia do topo real com barra branca, logo, status, banner promocional, capa, nome, slogan, região, chips, WhatsApp e placeholder limpo quando não há imagem.
- Ajustes no SEO: o preview do Google usa somente a URL pública real do tenant quando existir; sem URL publicada, exibe `URL da loja será exibida após publicação`.
- Ajustes no template público: o topo passou a respeitar banner promocional, capa, nome público, slogan, cidade/região, status manual/automático, chips de entrega/retirada, pedido mínimo, taxa de entrega e bloco de cálculo quando configurados.
- Observações: os dados antigos continuam preservados por gravações com merge; URLs `file:///` são bloqueadas em novos salvamentos dos campos públicos e saneadas nos previews.
- Pendências: validar em navegador com tenant real os uploads e gravações completas em Firebase, porque dependem de autenticação e Storage ativos.

## 2026-05-06 — Cardápio: abas reorganizadas, Template e SEO recriados
- Módulo afetado: Cardápio.
- Arquivos alterados: `admin.html`, `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Reorganizei o menu e as abas principais do Cardápio para `Produtos`, `Template da loja`, `SEO da loja` e `Configurações`.
- Movi `Categorias`, `Variantes` e `Tags` para subtabs internas em `Cardápio > Configurações`, preservando as funções existentes de criar, editar, excluir e ordenar quando aplicável.
- Substituí o fluxo antigo de `Template da loja` e `SEO da loja` por telas novas dentro de `Modules.Catalogo`, deixando as rotas `catalogo/template` e `catalogo/seo` apontarem para o módulo Cardápio.
- A nova tela `Template da loja` carrega dados existentes de `config/geral`, `config/aparencia`, `config/template`, `config/endereco`, `config/pagamentos`, `config/horarios` e `config/zonas`, com preview do cabeçalho da loja.
- A nova tela `SEO da loja` carrega e salva `config/seo`, com SEO principal, SEO local, Open Graph, Schema/JSON-LD, indexação e previews de Google/social.
- Campos novos criados em `config/template`: identidade pública, fiscalDocument, contatos sociais, endereço/atendimento, horários por dia, retirada/entrega, pagamentos, comportamento do pedido e textos institucionais.
- Campos novos criados em `config/seo`: mainKeyword, secondaryKeywords, slug, canonicalUrl, targetRegion, dados locais, Open Graph, schemaType, orderMethods, sameAs, indexEnabled e robots.
- Observações: os dados antigos continuam preservados por `setDocRoot(..., { merge: true })`; campos equivalentes são sincronizados com documentos já usados pelo projeto quando possível.
- Pendências: validar no navegador com um tenant real os uploads de logo/banner/imagem social, porque dependem de Firebase Storage e autenticação ativa.

## 2026-05-06 — Cardápio: listagem de produtos com filtros e cards mais claros
- Módulo afetado: Cardápio > Produtos.
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Adicionei filtros rápidos acima da listagem seguindo o padrão visual do Financeiro: busca, categoria, visibilidade, tipo, promoção e botão `Limpar filtros`.
- Reorganizei os cards para destacar preço principal sempre em euros com vírgula decimal, tipo do produto, promoção ativa, imagem/placeholder, categoria e ações.
- Corrigi os textos de `Tipo do produto`, incluindo `Produto pronto`, `Receita vinculada`, `Produto com escolhas` e `Combo/Menu`, além do plural `1 grupo de escolha` / `X grupos de escolha`.
- Ajustei `Sem categoria` para um badge neutro e mantive vermelho apenas para promoção ativa/alerta.
- Impacto esperado: leitura mais rápida da listagem, filtros cumulativos com a busca atual e melhor diferenciação visual sem alterar rotas, dados ou regras globais.
- Observações: validação automatizada limitada a checagem sintática do JS, porque o projeto não possui `package.json` com scripts de lint/teste.

## 2026-05-06 — Cardápio: modal de produto mais claro e organizado
- Arquivos alterados: `js/modules/catalogo.js`, `AI_CHANGELOG.md`
- Reorganizei o modal de Novo/Editar Produto em blocos mais claros, com preview sticky na coluna direita.
- Padronizei o tipo do produto, o botão principal, a área de imagem, a seção de upsell e as validações do combo/menu.
- Também normalizei o preço para exibição monetária e removi a exibição direta da URL/base64 da imagem no formulário.

## 2026-05-06 — Compras e Financeiro: títulos principais reforçados
- Arquivos alterados: `js/modules/compras.js`, `js/modules/financeiro.js`, `AI_CHANGELOG.md`
- Aumentei o destaque visual dos títulos principais `Compras` e `Financeiro` para recuperar a hierarquia de módulo.
- Também simplifiquei a copy interna da `Visão Geral` do Financeiro.

## 2026-05-06 — Compras e Financeiro: títulos e subtítulos padronizados
- Arquivos alterados: `js/modules/compras.js`, `js/modules/financeiro.js`, `AI_CHANGELOG.md`
- Padronizei o peso visual do título principal em `Compras` e `Financeiro` para o mesmo estilo.
- Atualizei os subtítulos das duas páginas para copies mais claras e coerentes com cada módulo.

## 2026-05-06 — Financeiro: remover Contas Bancárias do submenu lateral de verdade
- Arquivos alterados: `admin.html`, `js/modules/financeiro.js`, `AI_CHANGELOG.md`
- Removi a entrada `Contas Bancárias` do submenu lateral do módulo Financeiro no `admin.html`.
- Mantive `Contas Bancárias` apenas como aba interna em `Financeiro > Configurações`, com a rota legada redirecionando para essa área.

## 2026-05-06 — Financeiro: Contas Bancárias volta para Configurações
- Arquivo alterado: `js/modules/financeiro.js`, `AI_CHANGELOG.md`
- Reposicionei `Contas Bancárias` como aba interna de `Financeiro > Configurações`, após `Formas de Pagamento`.
- O submenu lateral do Financeiro continua sem `Contas Bancárias`, preservando o pedido anterior.

## 2026-05-06 — Financeiro: remover Contas Bancárias do submenu lateral
- Arquivo alterado: `js/modules/financeiro.js`, `AI_CHANGELOG.md`
- Removi a entrada visual `Contas Bancárias` do submenu lateral de `Configurações` no módulo Financeiro.
- O acesso às contas continua disponível pelo card/botão de gestão, sem quebrar a funcionalidade.

## 2026-05-06 — Financeiro: Visão Geral com filtro global e cards reorganizados
- Arquivo alterado: `js/modules/financeiro.js`, `AI_CHANGELOG.md`
- A aba `Visão Geral` passou a ter filtro global de período e conta bancária, com botão `Limpar filtros`.
- Reorganizei os cards principais em duas linhas: `Saldo total`, `Saldo projetado`, `A pagar` e depois `Resultado do período`, `Entradas do período`, `Saídas do período`.
- Atualizei as copies para deixar saldo disponível, projeção, pendências e resultado do período mais claros.
- `Movimentações Recentes` e o card de `Contas Bancárias` agora respeitam os filtros globais e mostram dados mais úteis para leitura rápida.

## 2026-05-06 — Compras: parcelas geradas para o Financeiro passam a salvar número sequencial
- Arquivo alterado: `js/modules/compras.js`, `AI_CHANGELOG.md`
- Os lançamentos criados em `financeiro_apagar` a partir de compras agora recebem `numeroSequencial` no formato `SA-000001`, seguindo a sequência global do Financeiro.
- O número sequencial é reservado junto com a criação das parcelas, inclusive quando a compra usa prévia editável ou cálculo automático.

## 2026-05-06 — Compras: remover envio automático e pedir conta bancária no Financeiro da listagem
- Arquivo alterado: `js/modules/compras.js`, `AI_CHANGELOG.md`
- Removi o fluxo de `Enviar para Financeiro` do modal e da gravação da compra. Agora salvar a compra não envia mais contas a pagar.
- Removi os campos de conta bancária do modal de Registro de compras.
- A listagem agora usa apenas `Atualizar Financeiro`; ao clicar, abre um prompt para escolher a conta bancária e então gerar/sincronizar as contas a pagar.
- O envio só acontece depois da confirmação da conta bancária no prompt da listagem.

## 2026-05-05 — Compras: console.error objetivo no gerador financeiro
- Arquivo alterado: `js/modules/compras.js`, `AI_CHANGELOG.md`
- Adicionei `console.error` no fluxo de geração de contas a pagar da compra salva para capturar o ponto exato da falha, sem alterar o comportamento funcional.
- O log inclui `compraId`, dados da compra, total, número do pedido e o erro retornado.

## 2026-05-05 — Compras: verificação objetiva pós-criação das parcelas
- Arquivo alterado: `js/modules/compras.js`, `AI_CHANGELOG.md`
- Após a criação financeira da compra nova, o sistema agora reconsulta as contas vinculadas e confirma se as parcelas realmente foram gravadas.
- Se nenhuma conta ativa existir após o processo, o save avisa de forma explícita que as contas a pagar não foram geradas.

## 2026-05-05 — Compras: geração financeira da compra nova sem reconsultar o documento
- Arquivo alterado: `js/modules/compras.js`, `AI_CHANGELOG.md`
- O fluxo de compra nova agora usa o objeto salvo em memória imediata para gerar as parcelas, sem depender de um `getDoc` logo após o `set`.
- Isso remove uma etapa intermediária que ainda podia atrasar ou impedir a criação das contas a pagar no primeiro salvamento.

## 2026-05-05 — Compras: criação nova gera parcelas diretamente após salvar
- Arquivo alterado: `js/modules/compras.js`, `AI_CHANGELOG.md`
- O salvamento de compra nova com `Gerar conta a pagar` agora chama a criação de parcelas diretamente após persistir o documento, sem depender do fluxo de atualização.
- A validação financeira continua sendo aplicada antes da criação, com mensagem clara quando os dados estão incompletos.

## 2026-05-05 — Compras: geração financeira após criar compra usando o documento salvo
- Arquivo alterado: `js/modules/compras.js`, `AI_CHANGELOG.md`
- Ao salvar uma compra nova com `Gerar conta a pagar`, o sistema agora recarrega o documento salvo e dispara o fluxo financeiro a partir desse registro persistido.
- Isso elimina a dependência do estado em memória logo após a criação e alinha o comportamento da compra nova ao mesmo caminho usado na atualização.

## 2026-05-05 — Compras: envio financeiro automático após criar nova compra
- Arquivo alterado: `js/modules/compras.js`, `AI_CHANGELOG.md`
- Ao salvar uma compra nova com `Gerar conta a pagar` ativo, o sistema agora dispara automaticamente a geração financeira usando o `id` real recém-criado.
- O fluxo de envio continua dependente da compra já salva, evitando tentar gerar parcelas com identificador temporário.
- O gerador financeiro passou a aceitar a compra salva como contexto explícito, cobrindo o caso em que a compra ainda não entrou na lista local no momento do envio.

## 2026-05-05 — Compras: fluxo único de geração financeira por compra salva
- Arquivo alterado: `js/modules/compras.js`, `AI_CHANGELOG.md`
- Unifiquei os caminhos de `Enviar para Financeiro` e `Atualizar Financeiro` em uma única rotina baseada em `compraId`.
- O envio financeiro agora usa o mesmo fluxo para compras novas já salvas e para compras existentes, sem depender de um ramo separado de criação.
- A mensagem de sucesso passou a refletir se foi a primeira geração das contas a pagar ou uma sincronização posterior, preservando o estado real do Financeiro.

## 2026-05-05 — Master: correção de helper de escape nas configurações globais
- Arquivo alterado: `master.html`, `AI_CHANGELOG.md`
- Corrigido o uso incorreto de `_esc(...)` na tela de `Configurações Globais`, substituindo pelas chamadas ao helper existente `esc(...)`.
- A correção evita o erro `_esc is not defined` ao abrir ou editar tipos globais no Master.

## 2026-05-05 — Master: configurações globais financeiras e selects do Admin por país fiscal
- Arquivos alterados: `master.html`, `js/modules/financeiro.js`, `AI_CHANGELOG.md`
- Criada a área `Configurações Globais` no Master para gerenciar tipos globais de conta bancária e tipos globais de forma de pagamento, com país fiscal, ordem, slug, status ativo/inativo e exclusão lógica.
- Os registros globais passaram a ser persistidos em `system/config` dentro do bloco `globalFinance`, com fallback seguro quando a lista está vazia.
- O Admin financeiro passou a carregar tipos globais ativos e compatíveis com o país fiscal do tenant atual para o cadastro de contas bancárias e formas de pagamento.
- A forma de pagamento do tenant agora herda a regra `Exige conta bancária` do tipo global, preservando compatibilidade com dados antigos.
- As contas bancárias antigas e formas antigas continuam editáveis; quando o tipo salvo não existe mais, o modal mostra a opção legada para não perder o registro.

## 2026-05-05 — Compras: envio financeiro real unificado na listagem e no modal
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`
- O botão `Enviar para Financeiro` da listagem do Registro de compras segue chamando a rotina real de geração em `financeiro_apagar`, com validação de dados obrigatórios antes da gravação.
- Quando faltam dados financeiros, a ação da listagem abre o modal de edição e foca a seção financeira em vez de exibir sucesso falso.
- O fluxo de salvamento da compra deixou de sugerir envio já concluído: agora a mensagem é contextual para `gerarContaPagar` ou `pendente_atualizacao`, sem fingir gravação no Financeiro.
- A proteção contra duplicidade continua baseada em vínculos reais da compra com `financeiro_apagar`, preservando tenant e registros já existentes.

## 2026-05-05 — Tarefa: Simplificar fluxo financeiro das Compras — único botão "Atualizar Financeiro"
- Arquivo alterado: `js/modules/compras.js`, `AI_CHANGELOG.md`
- **Fix 1 — Novo estado `pendente_financeiro`**: `_financeiroStateCompra` substituiu o estado `'nao_gerada'` por dois estados distintos: `'pendente_financeiro'` (quando `gerarContaPagar !== false` mas sem documentos em `financeiro_apagar`) e `'nao_configurada'` (quando `gerarContaPagar=false`). Estados mantidos: `'gerada'` e `'pendente_atualizacao'`.
- **Fix 2 — Badge "Pendente financeiro"**: `_financeiroBadgeHtml` agora exibe badge laranja "Pendente financeiro" para o novo estado, sem badge para `'nao_configurada'`. Elimina o antigo badge cinza "Não gerada" que confundia com um estado neutro.
- **Fix 3 — Botão único "Atualizar Financeiro" na listagem**: `_financeiroActionHtml` removeu completamente o botão "Enviar para Financeiro". Um único botão laranja "Atualizar Financeiro" aparece para os estados `'pendente_financeiro'` e `'pendente_atualizacao'`, sempre chamando `_atualizarCompraFinanceiro`. Texto de loading unificado para "Atualizando...".
- **Fix 4 — Botão único "Atualizar Financeiro" no modal**: `_compraFooterEditHtml` simplificado — substitui a lógica com dois botões distintos ("Enviar para Financeiro" / "Atualizar Financeiro") por um único botão "Atualizar Financeiro" que aparece para ambos os estados `pendente_financeiro` e `pendente_atualizacao`, chamando `_atualizarCompraFinanceiroFromModal`.
- **Fix 5 — Mensagem única em `_doSaveCompra`**: Quando `gerarContaPagar=true`, a mensagem é sempre "Compra salva. Atualize o Financeiro para gerar ou sincronizar as contas a pagar." — independentemente de ser primeira vez ou re-envio. Não há mais bifurcação entre "Envie" e "Atualize".
- **Fix 6 — Compatibilidade retroativa**: `_enviarCompraFinanceiroFromList` e `_enviarCompraFinanceiroFromModal` redirecionam internamente para `_atualizarCompraFinanceiro` / `_atualizarCompraFinanceiroFromModal`. Nomes mantidos no objeto de retorno público para não quebrar referências externas.

## 2026-05-05 — Tarefa: Corrigir fluxo real de "Enviar para Financeiro" e "Atualizar Financeiro" no Registro de Compras
- Arquivo alterado: `js/modules/compras.js`, `AI_CHANGELOG.md`
- **Fix 1 — Mensagem correta em "Enviar para Financeiro"**: `_enviarCompraFinanceiro` exibe "Conta a pagar enviada para o Financeiro." somente após confirmação real via `_contasAtivasForCompra` pós-gravação.
- **Fix 2 — `_atualizarCompraFinanceiro` — mensagem certa**: Toast de sucesso alterado de "Contas a pagar enviadas para o Financeiro." → "Financeiro atualizado com sucesso.".
- **Fix 3 — `_atualizarCompraFinanceiro` — falha de validação abre modal**: Quando campos financeiros estão incompletos, chama `_abrirCompraParaCompletarFinanceiro(id)` (abre modal + foca seção financeira) em vez de só exibir toast. Consistente com o fluxo de "Enviar para Financeiro".
- **Fix 4 — `_atualizarCompraFinanceiro` — aviso de parcelas auto-pagas**: Verifica se há parcelas com `status='pago'` sem movimento efetivado (`selfPaid`). Se encontrar, exibe `UI.confirm` antes de prosseguir, avisando que serão recriadas como pendentes. Usuário pode cancelar.
- **Fix 5 — `_atualizarCompraFinanceiro` — `_paintRegistrosTable` no catch**: Erros `validation`, `paid` e `user_cancel` chamam `_paintRegistrosTable()` para remover o estado "Enviando..." do botão.
- **Fix 6 — `_doSaveCompra` — mensagens contextuais**: (a) `contaPagarStatus='pendente_atualizacao'` → "Compra salva. Clique em 'Atualizar Financeiro' para sincronizar as contas a pagar."; (b) `gerarContaPagar=true` e ainda não gerada → "Compra salva. Envie para o Financeiro para gerar as contas a pagar."; (c) demais → "Compra salva com sucesso."
- **Fix 7 — Banner `hasPending` no modal**: Texto corrigido para "Salve a compra e clique em 'Atualizar Financeiro' para sincronizar as contas a pagar." — elimina afirmação falsa de que salvar recalcula automaticamente as parcelas.

## 2026-05-05 — Compras: envio financeiro real pela listagem
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`
- O botão `Enviar para Financeiro` na listagem do Registro de compras passou a chamar um wrapper próprio que reaproveita a mesma rotina real usada no modal de edição.
- O clique do botão na listagem agora interrompe o clique da linha, evitando abertura/ação acidental do modal durante o envio.
- A rotina só mostra `Contas a pagar enviadas para o Financeiro.` depois de criar/confirmar contas reais vinculadas à compra e recarregar a listagem.
- Se faltarem dados financeiros obrigatórios, a listagem abre o modal da compra, destaca a seção financeira e mostra `Complete os dados financeiros antes de enviar para o Financeiro.`
- A verificação de duplicidade passou a reconhecer vínculos por `compraId`, `sourceCompraId` e `sourceCollection: compras`/`sourceId`, e os novos documentos em `financeiro_apagar` salvam esses vínculos.
- Não foram alteradas rotas, permissões, tenant, coleções ou regras financeiras globais.

## 2026-05-05 — Financeiro: resumo da saída com campos completos
- Arquivos alterados: `js/modules/financeiro.js`, `AI_CHANGELOG.md`
- O modal `Resumo da saída` passou a normalizar os dados antes da renderização para exibir número interno, número do documento, descrição, favorecido, categoria, conta bancária e forma de pagamento.
- A normalização cobre aliases usados por saídas manuais (`contas_pagar`) e saídas originadas de Compras (`financeiro_apagar`), mantendo leitura por `sourceCollection`/coleção de origem já carregada.
- Quando há apenas IDs, o resumo busca o nome correspondente nas contas bancárias, categorias de saída e formas de pagamento do tenant já carregadas no módulo.
- O resumo deixou de depender apenas da movimentação de pagamento para exibir `Conta de saída` e `Forma de pagamento`, evitando `—` quando esses campos existem no documento da saída.
- Não foram alteradas rotas, permissões, regras de tenant, coleções ou geração de dados financeiros.

## 2026-05-05 — Financeiro: listagens limpas e busca padronizada
- Arquivos alterados: `js/modules/financeiro.js`, `AI_CHANGELOG.md`
- As listagens de `Entradas` e `Saídas` deixaram de exibir a coluna `Categoria`, preservando a categoria no cadastro interno e na busca.
- As tabelas receberam larguras de coluna mais equilibradas, com mais espaço para `Cliente` em Entradas e `Fornecedor` em Saídas, além de rolagem horizontal estável para telas menores.
- Os campos `Cliente` no modal de Entrada e `Fornecedor/Favorecido` no modal de Saída passaram a usar combobox com dropdown no mesmo padrão visual e comportamento do fornecedor do Registro de Compras.
- A seleção por busca continua salvando o vínculo quando o cadastro existe e permite texto manual quando não houver cliente/fornecedor cadastrado.
- O item `Contas Bancárias` permanece fora das abas principais do Financeiro, mantendo a funcionalidade acessível dentro de `Financeiro > Configurações`.
- Não foram alteradas rotas, permissões, tenant, coleções, regras financeiras ou estrutura global.

## 2026-05-05 — Financeiro: Entradas, Saídas e formas de pagamento
- Arquivos alterados: `js/modules/financeiro.js`, `AI_CHANGELOG.md`
- As abas `Entradas` e `Saídas` receberam botão `Limpar filtros`, resetando período, conta, status, busca e datas personalizadas com atualização imediata da listagem.
- As listagens de Entradas e Saídas agora têm seleção por checkbox, seleção de todos os itens visíveis e barra de ações em massa para alterar categoria, forma de pagamento, conta bancária, status/confirmar e excluir com validações locais.
- A confirmação em massa de Saídas valida a coleção de origem (`contas_pagar` ou `financeiro_apagar`) e evita lançamento duplicado no Fluxo de Caixa para o mesmo item.
- Os modais `Nova Entrada`/`Editar Entrada` e `Nova Saída`/`Editar Saída` foram alargados, ganharam campo de busca para cliente/fornecedor/favorecido, número sequencial interno, número do documento, categoria obrigatória e forma de pagamento obrigatória.
- As formas de pagamento passaram a ser lidas de `config/financeiro` do tenant, com compatibilidade para registros antigos em texto e fallback mínimo quando a configuração estiver vazia.
- O cadastro de Forma de Pagamento nas Configurações Financeiras agora salva nome, tipo, ativo/inativo, exige conta bancária, conta padrão, prazo de compensação, taxa percentual, taxa fixa e observação.
- Entradas e Saídas exibem número interno, documento, categoria, forma de pagamento, conta bancária e dados de pessoa na listagem e incluem esses campos na busca textual.
- Não foram alteradas rotas, permissões, regras globais de tenant, regras fiscais ou estrutura global.

## 2026-05-05 — Compras: envio manual de contas a pagar para o Financeiro
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`
- O Registro de compras deixou de criar contas a pagar automaticamente ao registrar ou atualizar uma compra.
- O salvamento agora persiste apenas a compra, os dados financeiros configurados e a prévia das parcelas, exibindo “Compra salva com sucesso.” ou “Compra salva com sucesso. Envie para o Financeiro quando quiser gerar as contas a pagar.”
- A coluna `Conta a pagar` passou a considerar somente contas reais vinculadas ao `compraId` em `financeiro_apagar`/`contas_pagar`; compras antigas marcadas como geradas mas sem contas reais aparecem como `Não gerada`.
- Foram adicionados os botões manuais `Enviar para Financeiro` e `Atualizar Financeiro`, com validação dos dados financeiros, proteção contra duplo clique e bloqueio quando há pagamento confirmado.
- Ao editar uma compra já enviada e alterar campos que impactam o financeiro, a compra passa para `Pendente atualização` sem alterar automaticamente as contas a pagar.
- O envio manual cria entrada e parcelas com origem `compra`, vínculos por `compraId`, número amigável do pedido, conta bancária, forma de pagamento, categoria financeira e metadados de parcela.
- Não foram alteradas rotas, tenant, permissões, coleções, regras fiscais ou estrutura global.

## 2026-05-05 — Financeiro: Contas Bancárias em cards nas Configurações
- Arquivos alterados: `js/modules/financeiro.js`, `AI_CHANGELOG.md`
- A aba `Financeiro > Configurações > Contas Bancárias` deixou de usar a listagem simples e passou a renderizar a listagem oficial em cards.
- Os cards exibem nome da conta, banco/instituição ou tipo, saldo atual destacado, saldo inicial, entradas, saídas e ações `Editar`/`Excluir`.
- O estado vazio da listagem de contas agora mantém o padrão visual em cards e mostra ação para criar uma nova conta.
- O modal de conta bancária foi ajustado para os títulos `Nova Conta` e `Editar Conta`, mantendo campos de nome, banco/instituição, tipo, saldo inicial e conta ativa no padrão visual do sistema.
- Após criar, atualizar ou excluir uma conta bancária dentro de Configurações, a tela recarrega a própria aba `Contas Bancárias` em cards, sem voltar para a listagem simples antiga.
- Não foram alteradas rotas, tenant, permissões, coleções ou regras financeiras globais.

## 2026-05-05 — Compras: contas a pagar geradas no primeiro salvamento
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`
- O fluxo de criação de compra nova agora pré-gera o `compraId` real antes de salvar, grava a compra com esse id e só depois cria as contas a pagar vinculadas no Financeiro.
- A geração financeira passa a validar que existe `compraId`, confirmar que ao menos uma conta foi criada e atualizar a compra com `contaPagarId`, `contaPagarIds` e `contaPagarGeradaEm` antes de exibir sucesso.
- A prévia das parcelas é reconstruída imediatamente antes do salvamento, garantindo que entrada e parcelas enviadas ao Financeiro sejam as mesmas do modal no primeiro registro.
- Foi adicionada proteção local contra duplo envio: os botões do rodapé ficam desabilitados enquanto a compra está sendo salva/processada.
- A rotina evita duplicidade reaproveitando contas a pagar ativas já vinculadas ao `compraId` quando existirem.
- Se a compra for salva mas a geração financeira falhar, o sistema mostra a mensagem clara: “Compra salva, mas as contas a pagar não foram geradas. Tente novamente ou revise os dados financeiros.”
- Não foram alteradas rotas, permissões, tenant, coleções, regras financeiras globais ou fluxo de edição com pagamento confirmado.

## 2026-05-05 — Documentação: padrão global de Limpar filtros
- Arquivos alterados: `MODULE_VALIDATION.md`, `MODULE_FIX_RULES.md`, `AI_CHANGELOG.md`
- `MODULE_VALIDATION.md` recebeu a seção `Filtros e limpeza`, definindo presença obrigatória do botão "Limpar filtros", reset completo de período, status, conta bancária e busca, retorno ao estado padrão e atualização automática da listagem.
- `MODULE_FIX_RULES.md` recebeu a seção `Filtros e limpar filtros`, autorizando correções automáticas seguras para inserir/corrigir o botão, resetar filtros e atualizar listagens, sem alterar lógica complexa sem regra explícita.
- Nenhuma alteração funcional foi feita no sistema.

## 2026-05-05 — Financeiro: filtros globais, busca contínua e listas seguras
- Arquivos alterados: `js/modules/financeiro.js`, `AI_CHANGELOG.md`
- Os filtros de período de `Fluxo de Caixa`, `Entradas` e `Saídas/Contas a pagar` passaram a usar a lista global padronizada: Todo período, Hoje, Ontem, Esta semana, Semana passada, Este mês, Mês passado, Últimos 7 dias, Últimos 30 dias, Últimos 90 dias, Este trimestre, Este ano, Ano passado e Personalizado.
- O cálculo dos períodos foi centralizado em helper local, preservando datas `YYYY-MM-DD` sem conversão UTC e aplicando os filtros sobre o resultado já filtrado por status, conta e busca.
- Os campos de busca de Entradas e Saídas receberam preservação de foco e cursor após a filtragem para permitir digitação contínua.
- O filtro de contas em Entradas agora exibe contas ativas em ordem alfabética.
- Não foram alteradas rotas, permissões, tenant, coleções, regras financeiras principais ou arquitetura global.

## 2026-05-05 — Financeiro: validação segura e correções locais
- Arquivos alterados: `js/modules/financeiro.js`, `AI_CHANGELOG.md`
- Criados helpers locais de data no módulo Financeiro para formatar, ler e somar datas `YYYY-MM-DD` sem conversão UTC nos filtros de período, mês atual e geração de datas recorrentes.
- O seletor de conta bancária em entradas agora oculta contas inativas (`ativo === false`), preservando a conta já selecionada quando o registro está em edição.
- Entradas e saídas manuais agora bloqueiam valores menores ou iguais a zero antes de salvar.
- Exclusões inseguras foram bloqueadas: entradas recebidas/parciais, saídas pagas/parciais e saídas geradas por outro módulo não podem ser removidas diretamente pelo Financeiro.
- O modal de detalhe de Contas a pagar não exibe ações manuais de editar/excluir/pagar para registros gerados por Compras, preservando o vínculo de origem.
- O modal de Nova/Editar Saída voltou a exibir o campo Categoria no bloco principal.
- Ajustados textos e estados locais seguros: toast de conta bancária salva, título Novo/Editar Categoria e leitura correta do modo de custos indiretos, com bloqueio de percentual negativo.
- Não foram alteradas rotas, permissões, tenant, coleções, regras fiscais ou arquitetura global.

## 2026-05-05 — Estrutura global de logs de validação
- Arquivos alterados: `ai_logs/_GLOBAL_VALIDATION_INDEX.md`, `ai_logs/_TEMPLATE_MODULE_VALIDATION.md`, `ai_logs/compras_validation.md`, `AI_CHANGELOG.md`
- Criada a pasta `/ai_logs` para centralizar o histórico de validações e correções dos módulos.
- Criado o índice global de status dos módulos e o template padrão de validação/correção.
- Criado o arquivo inicial `compras_validation.md` a partir do template para uso nas próximas validações do módulo Compras.
- Nenhuma alteração funcional foi feita no sistema.

## 2026-05-05 — Compras: desconto unitário por embalagem
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`
- O campo de desconto do item no Registro de compras foi renomeado visualmente para `Desc. un. (€)` para deixar claro que o valor digitado é por unidade/embalagem comprada.
- O cálculo do item agora usa `descontoUnitario × qtdComprada` para chegar ao `descontoTotal`; o total líquido da linha passa a ser `(precoEmbalagem - descontoUnitario) × qtdComprada`.
- O resumo antes de adicionar item mostra preço bruto unitário, desconto unitário, desconto total, total líquido e custo/base calculado sobre o total líquido.
- A tabela de itens adicionados mostra `Desc. un.`, `Desc. total` e `Total`, preservando compatibilidade com compras antigas que tinham apenas `desconto` total.
- Itens novos passam a salvar campos explícitos para rastreio: `precoEmbalagem`, `quantidadeComprada`, `descontoUnitario`, `descontoTotal`, `totalBruto`, `totalLiquido` e `custoBaseUnitario`.
- A validação agora bloqueia desconto unitário maior que o preço por embalagem com a mensagem: “O desconto por unidade não pode ser maior que o preço por embalagem.”

## 2026-05-05 — Compras: desconto claro, vencimento local e contas bancárias reais
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`
- A origem de “Conta bancária prevista” no Registro de compras foi corrigida de `financeiro_contas` para `contas_bancarias`, a mesma base usada em `Financeiro > Contas Bancárias`, filtrando contas com `ativo !== false`.
- O modal de compra agora salva `contaBancariaId`, `contaBancariaNome` e `contaBancariaOrigem: 'financeiro'` na compra e nas contas a pagar geradas. A entrada usa a conta da entrada; as parcelas usam a conta prevista ou herdam a conta da entrada quando a prevista estiver vazia.
- A prévia e a geração das parcelas passaram a usar helpers de data local (`YYYY-MM-DD`) sem `toISOString()` no cálculo, evitando deslocamento por timezone. A primeira parcela agora fica exatamente igual ao campo “Vencimento”; as próximas somam o prazo em dias.
- A exibição de desconto nos itens ficou explícita: preço bruto, desconto negativo, total líquido e custo/base no resumo antes de adicionar; na tabela, itens com desconto mostram `Desconto: -€...` e `Total: €...`.
- Foi adicionada validação para impedir desconto maior que o valor bruto do item, com a mensagem: “O desconto não pode ser maior que o valor bruto do item.”
- As validações financeiras foram reforçadas para exigir conta bancária prevista ou herdada, forma de pagamento, categoria financeira, vencimento e parcelas quando houver saldo parcelado, mantendo as validações específicas da entrada.

## 2026-05-05 — Ajuste visual no Fluxo de Caixa
- Arquivo alterado: `js/modules/financeiro.js`, `AI_CHANGELOG.md`
- A coluna `Data` da aba `Financeiro > Fluxo de Caixa` agora exibe `DD/MM/AAAA`.
- A mudança foi só visual: o valor salvo no Firestore, a ordenação e os filtros por período continuam usando a data real.

## 2026-05-05 — Tarefa: Conectar campos financeiros, corrigir vencimento de parcelas com entrada e validar datas
- Arquivo alterado: `js/modules/compras.js`, `AI_CHANGELOG.md`
- **Fix 1 — Formas de pagamento reais do Financeiro**: `_renderRegistros` agora carrega também `DB.getDoc('config', 'financeiro')` e armazena em `_finFormas[]`. Nova função `_finFormasPagOptions(selected)` usa `_finFormas` (com fallback à lista padrão hardcoded quando vazio) e garante que "A definir" sempre está no topo. Todos os selects de forma de pagamento no modal de compra (`cp-forma`, `cp-entrada-forma`) e no formulário de fornecedor (`fo-payment-method`) passaram a usar `_finFormasPagOptions` em vez de `_paymentOptions`.
- **Fix 2 — Categorias financeiras de saída**: Nova função `_finCatSaidaOptions(selected)` filtra `_finCategorias` por `tipo === 'saida'`, ordena por nome e gera as `<option>`. O campo `cp-fin-cat` no modal agora usa essa função em vez de `_options()` sobre a lista completa — apenas categorias de despesa aparecem no seletor.
- **Fix 3 — Vencimento das parcelas com entrada (correção de bug)**: `_buildParcelasPreview` quando `teveEntrada=true` agora usa o campo `cp-venc` (Vencimento) como base de cálculo das parcelas restantes: Parcela 1 = `vencimento`, Parcela N = `vencimento + (N-1)×prazo dias`. Antes usava `entradaData + N×prazo` o que era incorreto. Se `saldo > 0` e `vencBase` não foi preenchido, a função retorna sem gerar preview (evita datas inválidas).
- **Fix 4 — Herança de conta/forma para parcelas com entrada**: Quando `teveEntrada=true` e as parcelas restantes não têm override próprio, o campo `cp-conta`/`cp-forma` (conta bancária e forma de pagamento das parcelas principais) é herdado automaticamente nas parcelas geradas, desde que não seja "A definir".
- **Fix 5 — Validação de datas financeiras em `_saveCompra`**: Novas verificações antes de salvar: (a) Vencimento não pode ser anterior à data da compra; (b) Data da entrada não pode ser anterior à data da compra; (c) Data da entrada não pode ser posterior ao vencimento quando há saldo > 0 (haveria parcelas sem data lógica).
- **Fix 6 — Metadados ricos em `_criarContasPagar`**: O objeto `base` das contas a pagar agora inclui: `tipoMovimento:'saida'`, `origem:'compra'`, `fornecedorNome` (nome textual do fornecedor), `categoriaFinanceiraNome` (nome da categoria buscada em `_finCategorias`), `categoriaFinanceiraTipo:'saida'`. Esses campos facilitam relatórios e listagens no módulo Financeiro sem joins.
- **Fix 7 — Campo `tipoParcela` por item**: Cada item gerado no loop de `_criarContasPagar` recebe `tipoParcela: p.isEntrada ? 'entrada' : 'parcela'` — distingue no Firestore qual item é a entrada e quais são as parcelas regulares.

## 2026-05-05 — Tarefa complementar: Menu lateral, card Pendentes e Status editável com pagamento confirmado
- Arquivos alterados: `admin.html`, `js/modules/compras.js`, `AI_CHANGELOG.md`
- **Fix 1 — Menu lateral Compras**: Removidos os itens "Tipos" e "Categorias" do submenu lateral. Reordenação para: Registro de compras · Produtos / Insumos · Fornecedores · Configurações. A rota `compras/configuracoes` já existia e abre a aba correta. Tipos e Categorias continuam acessíveis dentro da aba Configurações (subtabs internos — inalterados). A lógica de `_loadSub` que redirecionava `tipos`/`categorias` → `configuracoes` foi preservada para compatibilidade com bookmarks antigos.
- **Fix 2 — Card "Pendentes" — normalização robusta**: Extraída função `_statusCompraRaw(c)` que lê `statusCompra || status || estado || situacao || situação || statusPagamento || paymentStatus`. Definidas constantes `_PENDENTE_STATUS` (pendente, pendentes, aguardando, em aberto, aberto) e `_PAGO_STATUS` (pago, paga, quitado, quitada, recebida, concluido, concluída, cancelada, cancelado, parcial). `_compraPendente` usa as duas listas para decidir sem ambiguidade. Comparação sempre lowercase+trim. Card recalcula em todos os eventos existentes (filtro, create, edit, delete) pois `_paintRegistrosTable` já é chamado em todos eles.
- **Fix 3 — Campo Status sempre editável com pagamento confirmado**: Em `_updateCompraModalUI` quando `hasPaid`, o loop de bloqueio agora verifica `if (lockedEls[k].id === 'cp-status') continue` — o select de status não é desabilitado. Após o loop, restaura `opacity/cursor/pointerEvents` do `#cp-status` explicitamente para garantir aparência normal mesmo que CSS de pai interfira.
- **Fix 4 — Botão "Salvar status" no rodapé**: Quando `hasPaid`, o footer agora exibe 3 botões: "Fechar" · "Salvar status" (azul) · "Estornar pagamentos e liberar edição" (vermelho). O botão "Salvar status" chama `_saveStatusOnly(id)`.
- **Fix 5 — `_saveStatusOnly(id)`**: Nova função. Lê apenas `#cp-status`, faz `DB.update('compras', id, { statusCompra: newStatus })`, atualiza o objeto em `_compras[]` localmente, exibe toast "Status atualizado com sucesso.", repinta a tabela via `_paintRegistrosTable()` e fecha o modal. Não toca em `financeiro_apagar`, `contas_pagar`, `movimentacoes` nem em nenhuma lógica de parcelas/estorno.

## 2026-05-05 — Tarefa complementar: Alinhamento do Prazo, entrada parcial e integração financeira
- Arquivo alterado: `js/modules/compras.js`, `AI_CHANGELOG.md`
- **Fix 1 — Alinhamento do campo "Prazo entre parcelas (dias)"**: Adicionado `align-items:end` ao grid de 4 colunas (Vencimento · Prazo · Parcelas · Categoria). Quando o label longo do campo "Prazo" quebra linha (uppercase via CSS), os inputs ficam todos alinhados na base do grid.
- **Fix 2 — Cálculo de datas da prévia**: `_buildParcelasPreview` reescrito. Sem entrada: Parcela 1 = vencimento, Parcela N = vencimento + (N-1)×prazo dias. Com entrada: linha de entrada usa `entradaData`; parcelas restantes começam de `entradaData + 1×prazo`, `entradaData + 2×prazo`, etc. Nunca gera data anterior ao vencimento/entrada.
- **Feature — "Teve entrada?"**: Novo checkbox na seção "Gerar conta a pagar". Quando marcado, exibe sub-painel "Dados da entrada" com 4 campos: Valor da entrada (€), Data da entrada, Forma de pagamento da entrada, Conta bancária da entrada. O painel aparece/desaparece via `_toggleEntradaSection()` sem re-render do modal.
- **Label dinâmico**: Quando "Teve entrada?" está marcado, o campo "Parcelas" passa a exibir "PARCELAS RESTANTES" (via `_toggleEntradaSection` + label inicial pelo `c.teveEntrada` na abertura).
- **Prévia com entrada**: Linha de entrada renderizada com fundo verde claro `#F0FFF8`, texto em verde `#1A9E5A` + badge "ENTRADA". Parcelas restantes renderizadas normalmente abaixo.
- **Cálculo de valores com entrada**: Saldo = total − entradaValor; cada parcela = saldo / parcelas. Se entradaValor ≥ total, nenhuma parcela extra é gerada.
- **Validação de entrada**: Quando `teveEntrada=true`, valida valor > 0, valor ≤ total, data preenchida, forma ≠ "A definir", conta bancária preenchida. Validações de Conta/Forma/Vencimento do painel principal ficam condicionais a `teveEntrada=false`.
- **`_criarContasPagar` atualizado**: Usa `idx+1` como `parcelaNumero` (posição no array, entry=1). Aplica `contaBancariaId`/`formaPagamento` por item do preview — entrada usa conta/forma da entrada, parcelas regulares usam a conta/forma do painel principal. Campo `isEntrada:true` marcado no doc do Firestore para rastreabilidade.
- **`_saveCompra`**: Persistidos no compraData: `teveEntrada`, `entradaValor`, `entradaData`, `entradaFormaPagamento`, `entradaContaBancariaId`.

## 2026-05-04 — Tarefa 29 + KPI: Melhorias no módulo Compras e correção dos cards métricos
- Arquivo alterado: `js/modules/compras.js`, `AI_CHANGELOG.md`
- **Tarefa 29.1 — Ordenação por Data**: Coluna "Data" na tabela de Registro de compras agora é clicável — toggle asc/desc com seta visual (↑/↓). Padrão: desc (mais recente primeiro). Adicionado `ordem:'desc'` ao `_registroFilters` e função `_toggleRegistrosOrdem()`. `_filteredRegistros` agora ordena o resultado antes de retornar.
- **Tarefa 29.2 — Bloqueio de campos com pagamento confirmado**: `_updateCompraModalUI` quando `hasPaid`, além do banner e rodapé existentes, agora itera todos os `input/select/textarea/button` dentro do corpo do formulário e define `disabled=true`, `opacity:0.55`, `cursor:not-allowed`. Impede qualquer edição sem estornar primeiro.
- **Tarefa 29.3 — Validação de campos obrigatórios no "Gerar conta a pagar"**: `_saveCompra` agora valida que, quando `gerarContaPagar` está marcado, os seguintes campos estão preenchidos: Conta bancária, Forma de pagamento (não pode ser "A definir"), Vencimento, Categoria financeira. Mostra toast de erro e interrompe o save se algum faltar.
- **Tarefa 29.4 — Campo "Prazo entre parcelas (dias)"**: Novo campo `cp-prazo` (padrão 30) adicionado à seção "Gerar conta a pagar". Layout alterado de 3-colunas para 4-colunas: Vencimento · Prazo · Parcelas · Categoria financeira. `_buildParcelasPreview` agora usa `prazo × i dias` (offset fixo por intervalo) em vez de `+1 mês` para calcular os vencimentos das parcelas. `_saveCompra` persiste `prazoParcelas`.
- **KPI — Corrigir card "Pendentes"**: `_compraPendente` agora usa comparação case-insensitive: `String(c.statusCompra).toLowerCase() === 'pendente'`. Eliminada falha quando status vem em lowercase ou UPPERCASE do Firestore.
- **KPI — Corrigir card "Ticket médio"**: Removido o fallback `'-'` quando não há compras. `UI.fmt(ticketMedio)` exibe `€0,00` para lista vazia (ticketMedio = 0).
- **KPI — Filtro de status case-insensitive**: `_filteredRegistros` compara `String(cStatus).toLowerCase() !== _registroFilters.status.toLowerCase()` — o filtro de status na barra agora funciona independentemente de capitalização.

## 2026-05-05 — Tarefa 28: Corrigir interpretação da coleção financeiro_apagar
- Pedido feito: `financeiro_apagar` NÃO é legado — é a fonte de contas a pagar geradas pelo módulo Compras. Ambas as coleções devem poder ser confirmadas como saída.
- Arquivo alterado: `js/modules/financeiro.js`, `AI_CHANGELOG.md`
- **Fix 1 — `_loadContasPagarData`**: removido rótulo `'legado'`. Cada item agora recebe `_colecao` correto (`'contas_pagar'` ou `'financeiro_apagar'`), `_origemFinanceira` (`'financeiro_manual'` ou `'compra'`) e `_acionavel: true` para ambos.
- **Fix 2 — Botões na listagem**: "Confirmar saída" usa `cp._acionavel` (true para ambas as coleções). "Editar" e "Excluir" continuam restritos a `contas_pagar` — itens de `financeiro_apagar` vinculados a compras não devem ser excluídos pelo Financeiro para não quebrar o vínculo.
- **Fix 3 — `_savePagamentoCP` source-aware**: removido guard que bloqueava `financeiro_apagar`. Adicionado `var colecao = cp._colecao || 'contas_pagar'`. `DB.getDoc(colecao, id)` e `DB.update(colecao, id, upd)` agora usam a coleção correta. Movimentação gerada passa a incluir `sourceCollection`, `sourceId`, `origem`, `compraId`, `parcelaNumero`, `totalParcelas` para rastreabilidade no Fluxo de Caixa.
- **Proteção anti-duplicidade**: antes de criar movimentação, verifica em `_movimentacoes` se já existe saída efetivada para o mesmo `sourceCollection+sourceId` (ou `contaPagarId`). Se sim e não for pagamento parcial, rejeita com aviso.

## 2026-05-05 — Tarefa 27: Corrigir origem dos dados e fluxo de confirmação de saída
- Pedido feito: "Confirmar saída" ainda disparava a mensagem de não encontrado para itens legados (financeiro_apagar) que nunca existiram em contas_pagar.
- Arquivo alterado: `js/modules/financeiro.js`, `AI_CHANGELOG.md`
- **Causa raiz**: `_loadContasPagarData` une `contas_pagar` (docs reais) com `financeiro_apagar` (coleção legada). Itens legados têm IDs próprios que não existem em `contas_pagar/`, por isso `DB.getDoc('contas_pagar', id)` retorna null para eles, disparando a mensagem de erro.
- **Fix 1 — Tag de origem**: `_loadContasPagarData` agora marca cada item com `_colecao:'contas_pagar'` (real) ou `_colecao:'legado'` (financeiro_apagar). A deduplicação já coloca itens reais primeiro; se o mesmo ID aparecer nos dois lados, o real prevalece.
- **Fix 2 — Botões condicionais**: "Confirmar saída" e "Editar" só aparecem quando `cp._colecao === 'contas_pagar'`. Itens legados são exibidos para consulta histórica (status, valor, vencimento) sem botões de ação. "Excluir" também limitado a docs reais.
- **Fix 3 — Guard em `_savePagamentoCP`**: verificação adicional — se `cp._colecao !== 'contas_pagar'`, a função rejeita imediatamente com mensagem informativa sem tocar o Firestore.
- **Resultado**: conta real → botões aparecem, fluxo funciona; item legado → exibido só como histórico, sem botão, sem erro.

## 2026-05-05 — Tarefa 26: Corrigir confirmação de saída quando conta a pagar não é encontrada
- Pedido feito: o `_savePagamentoCP` registrava a movimentação ANTES de verificar se o documento `contas_pagar/{id}` existe, causando a mensagem confusa e uma saída avulsa órfã.
- Arquivo alterado: `js/modules/financeiro.js`, `AI_CHANGELOG.md`
- **Causa raiz**: `DB.add('movimentacoes', mov)` era a primeira chamada; o `DB.getDoc('contas_pagar', id)` ficava dentro do `.then()`, após a movimentação já ter sido gravada no Firestore.
- **Correção**: invertida a ordem — `DB.getDoc('contas_pagar', id)` é agora a primeira chamada. Se o documento não existir: fecha o modal, remove o item da lista local, exibe "Esta conta a pagar não existe mais ou já foi removida. A lista foi atualizada.", recarrega a listagem e **não cria nenhuma movimentação**. Se existir: segue o fluxo normal (`DB.add('movimentacoes')` → `DB.update('contas_pagar')`).
- **Bonus**: ao confirmar o pagamento, o `upd` enviado para `contas_pagar` agora inclui `conta_id` e `contaBancariaId` — a conta bancária utilizada fica registrada no documento da saída, o que permite ao Fluxo de Caixa filtrar corretamente por conta em pagamentos futuros.
- Mensagem "A conta a pagar não foi encontrada. O pagamento foi registrado na movimentação." removida.

## 2026-05-04 — Tarefa 25: Corrigir erros de update no Financeiro e filtro de Conta Bancária no Fluxo de Caixa
- Pedido feito: corrigir erro "No document to update" em config/financeiro e contas_pagar; corrigir filtro de Conta Bancária no Fluxo de Caixa para usar conta_id em vez de nome.
- Arquivo alterado: `js/modules/financeiro.js`, `AI_CHANGELOG.md`
- **1 — config/financeiro (formas de pagamento)**: `_saveFormaPag`, `_addFormaPag`, `_removeFormaPag` usavam `DB.update('config','financeiro',...)` que falha se o documento não existir. Substituídos por `DB.setDocRoot('config','financeiro',...)` que usa `set({merge:true})` — cria o documento automaticamente na primeira gravação sem sobrescrever outros campos. Mesmo fix aplicado a `DB.update('config','geral',...)` e `DB.update('config','custos',...)` em `_saveCustosInd`.
- **2 — contas_pagar stale ID**: `_saveCP` agora chama `DB.getDoc('contas_pagar', _editingId)` antes de `DB.update`. Se o documento não existir: remove da lista local, fecha o modal, exibe mensagem amigável "Esta conta a pagar não existe mais ou já foi removida. A lista foi atualizada." e recarrega a listagem. Mesma proteção adicionada em `_savePagamentoCP`. Nenhum erro técnico do Firestore é exibido ao usuário. Não cria conta duplicada.
- **3 — Filtro Conta Bancária no Fluxo de Caixa**: `_normalizeLegacyCP` agora normaliza `conta_id: cp.conta_id || cp.contaId || cp.conta_bancaria_id || cp.contaBancariaId || ''` (suporta múltiplos nomes de campo legados). `_refreshFluxoResults` filtra contas a pagar por `conta_id` quando uma conta específica está selecionada — lançamentos sem conta vinculada ficam ocultos. Movimentações já usavam `conta_id` normalizado. O saldo filtrado reflete exatamente os lançamentos visíveis na tabela.

## 2026-05-04 — Tarefa 24: Filtros e resumo do Fluxo de Caixa
- Pedido feito: atualizar lista de períodos, corrigir campo de busca (perda de foco), adicionar filtro por Conta Bancária, botão Limpar filtros, ordenação alfabética de listas, e corrigir copy e cálculo do resumo de saldo.
- Arquivo alterado: `js/modules/financeiro.js`, `AI_CHANGELOG.md`
- **1 — Nova lista de períodos** (`_PERIODO_OPTIONS`): Todo período / Hoje / Ontem / Esta semana / Semana passada / Este mês / Mês passado / Últimos 7, 30 e 90 dias / Este trimestre / Este ano / Ano passado / Personalizado — nessa ordem exata. Lógica de cálculo via `_fluxoPeriodRange()`.
- **2 — Correcção do campo Busca**: `_paintFluxoCaixa` agora cria dois containers estáveis (`#fluxo-summary-txt` e `#fluxo-results`). Ao digitar no campo de busca, `_setFluxoFiltro('busca',…)` chama apenas `_refreshFluxoResults()` — sem re-renderizar o card de filtros nem destruir o `<input>`. Foco e cursor mantidos durante digitação contínua.
- **3 — Filtro Conta Bancária**: novo `<select>` no card de filtros. Lista contas cadastradas do tenant atual (`_contasBancarias`, respeitando `ativo !== false`), ordenadas alfabeticamente. Opção padrão "Todas as contas". Filtra `_movimentacoes` por `conta_id`; contas a pagar (sem `conta_id`) aparecem em qualquer conta. Estado em `_fluxoFiltro.conta`.
- **4 — Botão Limpar filtros**: chama `_limparFluxoFiltros()` que restaura `_fluxoFiltro` para os valores padrão (todos os status marcados, período = "Todo período", conta = "Todas as contas", busca vazia) e re-renderiza tudo.
- **5 — Saldo filtrado**: cálculo e copy alterados. Valor = soma líquida (entradas − saídas) dos eventos exibidos, partindo de zero. Texto: `"Saldo filtrado: € X · Considera os lançamentos exibidos conforme período, status e conta bancária selecionados."` Atualizado via `_refreshFluxoResults()`, refletindo período, status, busca e conta.
- **6 — Ordenação**: contas bancárias listadas no select em ordem alfabética (`localeCompare`).

## 2026-05-04 — Tarefa 23: Tipos e Categorias de Compras por tenant com refresh automático
- Pedido feito: garantir que `Tipo` e `Categoria` em Produtos / Insumos venham sempre do tenant atual, sem listas globais, e que filtros/selects atualizem após criar, editar ou excluir esses cadastros.
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`
- **1 — Catálogo por tenant**:
  - `Tipo` e `Categoria` passaram a ser lidos exclusivamente do banco do tenant atual via `DB.getAll('compras_tipos')` e `DB.getAll('compras_categorias')`.
  - A interface de Produtos / Insumos não usa mais fallback fixo para montar os selects.
  - Nenhum cadastro de outro tenant entra na lista atual.
- **2 — Atualização automática**:
  - Ao criar, editar ou excluir Tipo/Categoria em `Compras > Tipos` ou `Compras > Categorias`, o módulo recarrega os catálogos e atualiza:
    - filtros da aba Produtos / Insumos
    - selects do modal Novo Produto / Editar Produto
  - O refresh acontece sem recarga manual da página quando o estado do app está ativo.
- **3 — Filtros e compatibilidade**:
  - Os filtros de Produtos / Insumos continuam cumulativos entre `Tipo`, `Categoria`, busca, classe e status.
  - Se um Tipo/Categoria usado em produto for excluído, o produto continua listado e o campo aparece como vazio / `Não informado`, sem quebrar o modal.
  - Se um filtro ficar apontando para um valor removido, ele é limpo automaticamente.

## 2026-05-04 — Tarefa 22: Carregamento inicial e ações da lista de Usuários no Master
- Pedido feito: fazer a lista de usuários carregar automaticamente ao abrir `master.html` e corrigir os botões `Editar` e `Excluir` após a limpeza visual da aba.
- Arquivos alterados: `master.html`, `AI_CHANGELOG.md`
- **1 — Carregamento inicial da lista**:
  - `loadUsers()` agora tenta primeiro `POST /api/master/firebase/sync-users`.
  - Se a sincronização automática falhar, o Master não fica em branco: ele cai para `overview` e, se necessário, para a listagem local.
  - A interface mostra estado discreto de carregamento e aviso claro quando o sync automático não puder ser concluído.
  - O botão `Sincronizar usuários Firebase` continua funcionando e usa o mesmo fluxo.
- **2 — Ações da linha de usuário**:
  - Os botões `Editar` e `Excluir` foram amarrados explicitamente em `window.editUser(...)` e `window.deleteUser(...)` para não perder referência após a renderização dinâmica.
  - `editUser(id)` e `deleteUser(id)` continuam disponíveis no escopo global e agora registram o `id` clicado no console.
  - A exclusão continua pedindo confirmação e recarrega a listagem ao final.
- **3 — Logs e diagnóstico**:
  - O console agora registra:
    - início do carregamento inicial
    - resposta de `sync-users`
    - quantidade de usuários renderizados
    - erros do sync e dos fallbacks
    - `id` acionado em `Editar` e `Excluir`

## 2026-05-04 — Tarefa 21: País fiscal aplicado a Fornecedores e Produtos / Insumos
- Pedido feito: ajustar fornecedores, Configurações de Compras e Produtos / Insumos para respeitar `fiscalCountry` como país fiscal/operacional, sem mexer no idioma do painel.
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`
- **1 — Fornecedor no modal de Compras**:
  - O bloco Contato foi reorganizado para ficar em duas linhas:
    - linha 1: WhatsApp e Telefone
    - linha 2: E-mail em largura total
  - O DDI padrão agora segue o país do fornecedor, ou o `fiscalCountry` do tenant quando o fornecedor não tem país próprio:
    - PT → `+351`
    - ES → `+34`
  - Se o número já estiver preenchido, o código não é sobrescrito.
  - A mudança de país atualiza o rótulo fiscal e também o DDI padrão apenas quando o campo está vazio.
- **2 — Produtos / Insumos**:
  - As listas de `Tipo` e `Categoria` no modal foram ordenadas alfabeticamente.
  - Foi adicionado campo de busca de fornecedor no modal, no mesmo padrão da busca usada em Nova Compra.
  - A seleção do fornecedor continua compatível com cadastro sem fornecedor.
- **3 — Filtros da listagem de Produtos / Insumos**:
  - `Tipo` e `Categoria` agora se alimentam de forma cumulativa.
  - O dropdown de `Categoria` se restringe ao contexto atual do `Tipo`, e vice-versa, sem resetar os demais filtros.
  - Busca e status continuam combinando com os filtros de tipo/categoria.
- **4 — Configurações de Compras**:
  - O filtro `Ambos` foi removido da listagem de manutenção de tipos/categorias.
  - A interface passou a trabalhar com `Todos`, `Insumo` e `Produto`.
- **5 — País fiscal sem mexer em idioma**:
  - Nenhuma dessas mudanças altera `adminLanguage` ou `publicStoreLanguage`.
  - O `fiscalCountry` continua sendo apenas país fiscal/operacional do tenant.

## 2026-05-04 — Tarefa 20: Limpeza da aba Usuários do Master e correção real do Excluir
- Pedido feito: remover a barra preta técnica de Firebase do topo, eliminar o botão `Recarregar` da aba Usuários, deixar a listagem mais limpa e fazer o botão `Excluir` funcionar sem o registro reaparecer na próxima sincronização.
- Arquivos alterados: `master.html`, `server.rb`, `AI_CHANGELOG.md`
- **1 — UI do Master (`master.html`)**:
  - Barra preta de autenticação Firebase ocultada da interface visual.
  - A aba Usuários perdeu o botão `Recarregar`; ficou apenas `Sincronizar usuários Firebase`.
  - A listagem foi simplificada para priorizar:
    - nome
    - e-mail
    - status
    - sync
    - loja
  - O layout da tabela ficou menos poluído, com menos colunas e badges mais discretos.
  - O carregamento da listagem continua acontecendo automaticamente ao abrir a página.
- **2 — Exclusão correta de usuário**:
  - O botão `Excluir` agora chama confirmação, remove o tenant local e tenta apagar `system_tenants/{uid}` no Firestore.
  - Foi adicionado tombstone local em `.master-store.json` para impedir que o auto-sync traga o mesmo UID de volta logo depois.
  - O save/import/provision do Master restaura o UID quando o usuário é recriado intencionalmente.
  - O console agora informa quando a exclusão foi apenas local ou quando `system_tenants` também foi removido.
- **3 — Sincronização preservada**:
  - O auto-sync com Firebase Auth continua ativo.
  - A listagem agora não depende mais da barra técnica de login para aparecer.

## 2026-05-04 — Tarefa 19: Autoimportar usuários do Firebase Auth para o Master local
- Pedido feito: ao abrir/recarregar o Master, importar automaticamente usuários existentes no Firebase Auth para `.master-store.json` e `system_tenants/{uid}`, sem trazer clientes finais do template público.
- Arquivos alterados: `server.rb`, `master.html`, `admin.html`, `AI_CHANGELOG.md`
- **1 — Auto sync no backend (`server.rb`)**:
  - Adicionado `POST /api/master/firebase/sync-users`.
  - Novo helper `firebase_customer_uids` percorre `tenants/{tenantId}/store_customers` e `tenants/{tenantId}/customers` para bloquear clientes finais.
  - Novo helper `firebase_auto_sync_master_from_auth!`:
    - lista usuários do Firebase Auth
    - ignora clientes finais
    - cria registro local quando faltar no Master
    - cria/atualiza `system_tenants/{uid}`
    - usa `source: firebase_auth_auto_import`
    - define `status: active`, `role: store_owner`, `plan: starter`
  - Logs de resumo agora registram:
    - total de usuários no Firebase Auth
    - já sincronizados
    - importados para o Master
    - system_tenants criados/atualizados
    - ignorados por serem clientes finais
- **2 — Master local (`master.html`)**:
  - `loadUsers()` agora chama o endpoint de auto sync antes de renderizar a listagem.
  - O botão `Sincronizar usuários Firebase` também dispara esse mesmo fluxo.
  - A listagem passa a refletir o estado pós-sync sem depender de ação manual.
- **3 — Admin (`admin.html`)**:
  - Mensagem de bloqueio por falta de liberação ajustada para:
    - `Sua conta ainda não foi liberada no Master.`
- **4 — Regra de exclusão**:
  - Clientes finais detectados em `store_customers` ou `customers` não entram no Master e não recebem `system_tenants`.

## 2026-05-04 — Tarefa 18: Sincronização bidirecional Master ↔ Firebase Auth ↔ system_tenants
- Pedido feito: estruturar fluxo seguro entre Master local, Firebase Auth e `system_tenants`, sem mexer no template público nem em seed/publicação.
- Arquivos alterados: `server.rb`, `master.html`, `js/core/auth.js`, `admin.html`, `AI_CHANGELOG.md`
- **1 — Backend administrativo no `server.rb`**:
  - Adicionados helpers para autenticação admin via OAuth de service account e acesso REST ao Firebase Auth / Firestore.
  - Novas rotas:
    - `GET /api/master/firebase/overview` → lista unificada com origem, sync, loja e seed.
    - `POST /api/master/firebase/provision` → cria/atualiza Auth, salva no `.master-store.json` e tenta escrever `system_tenants/{uid}`.
    - `POST /api/master/firebase/import-users` → importa usuários do Firebase Auth para o Master local, sem liberar acesso automaticamente.
    - `POST /api/master/firebase/release-access` → cria/atualiza `system_tenants/{uid}` somente para usuário autorizado.
  - O backend agora é a fonte das operações administrativas do Firebase Auth; o navegador não grava Auth diretamente.
- **2 — Master local (`master.html`)**:
  - A aba Usuários passou a consumir `GET /api/master/firebase/overview`.
  - Removida a leitura direta de `system_tenants` pelo navegador.
  - Adicionados botões:
    - `Sincronizar usuários Firebase`
    - `Criar no Firebase`
    - `Importar para Master`
    - `Liberar acesso`
  - `saveUser()` agora chama o backend de provisionamento e registra no console:
    - ação
    - e-mail
    - UID
    - origem
    - criação/recuperação do Firebase Auth
    - gravação no Master
    - criação/atualização de `system_tenants`
  - A listagem mostra:
    - origem
    - status de sync
    - status da loja
    - seed vinculada ou pendente
  - O seletor de papel foi atualizado para:
    - `master_admin`
    - `store_owner`
    - `store_staff`
    - `store_customer`
    - `pending_classification`
  - O status do usuário agora aceita `pending`.
- **3 — Login do Centro de Control (`js/core/auth.js` + `admin.html`)**:
  - O login continua via Firebase Auth.
  - Após login, o sistema consulta `system_tenants/{currentUser.uid}` e bloqueia se:
    - o doc não existe → `Sua conta existe no Firebase, mas ainda não foi liberada no Master.`
    - status não é `active` → `Seu acesso está inativo. Fale com o suporte.`
    - role é `store_customer` → `Esta conta é de cliente da loja e não tem acesso ao Centro de Control.`
  - Logs agora mostram:
    - email
    - UID
    - path consultado
    - doc encontrado/ausente
    - status
    - role
    - motivo do bloqueio
  - Bootstrap admin continua liberado por e-mail.
- **4 — Regras de identidade**:
  - `uid` continua sendo a chave principal.
  - Usuário do Master e usuário do Firebase Auth agora podem convergir no mesmo UID.
  - O fluxo não libera cliente final como dono de loja.
- **5 — Resultado prático**:
  - Usuário criado no Master pode ser provisionado no Firebase Auth e em `system_tenants`.
  - Usuário existente no Firebase Auth pode ser importado para o Master.
  - Usuário autorizado e ativo passa a abrir o `/admin.html` quando o `system_tenants/{uid}` está presente.

## 2026-05-04 — Tarefa 17: Corrigir login do Centro de Control — sync Master → Firestore
- Pedido feito: corrigir acesso ao Centro de Control para usuário cadastrado no Master mas sem sync com Firestore; diferenciar mensagens de erro; adicionar sync automático; detectar UIDs duplicados.
- Arquivos alterados: `firestore.rules`, `js/core/auth.js`, `admin.html`, `master.html`, `AI_CHANGELOG.md`
- **Causa raiz**: `master.html` salva usuários APENAS no `.master-store.json` local (via `server.rb`). O login em `admin.html` verifica SOMENTE `system_tenants/{uid}` no Firestore. Nunca houve sincronização automática entre os dois.
- **1 — `firestore.rules`**:
  - `system_tenants`: adicionado `allow read/write: if master@bocadobrasil.com`. Antes: apenas o próprio tenant podia ler e `write: false` bloqueava todos. Agora: master pode ler todos os docs e gravar (necessário para sync).
- **2 — `js/core/auth.js`** — melhor diagnóstico e mensagens:
  - Quando Firestore não encontra doc: emite `console.warn` com uid, email, snapExists, status e reason.
  - Após sign-out, tenta `fetch('/api/master/tenants')` para verificar se o usuário existe no store local.
  - Se encontrado no Master local: loga campos ausentes (storeUrl, status), motivo exato ("Documento system_tenants/UID não existe"), e chama `showAccessDenied('nosync')`.
  - Se não encontrado: chama `showAccessDenied('no_tenant_doc')`.
  - Se server não acessível: fallback ao comportamento anterior.
  - Erro de rede/Firestore: chama `showAccessDenied('error')`.
- **3 — `admin.html`** — mensagens diferenciadas:
  - `showAccessDenied(reason)` aceita reason parameter:
    - `'nosync'` → "Usuário cadastrado no Master, mas ainda não sincronizado com o sistema. Acesse o Master, edite este usuário e clique em Salvar para ativar o acesso."
    - `'disabled'` → "Este usuário está desativado. Contacte o administrador do Master para reativar o acesso."
    - `'error'` → "Erro ao verificar o acesso. Verifique sua conexão e tente novamente."
    - default → mensagem original (cliente da loja).
- **4 — `master.html`** — sync automático e melhorias na listagem:
  - **`saveUser()`**: após save local bem-sucedido, chama `_syncTenantToFirestore(p)` em background. Se falhar: toast de aviso + console.warn. Usuários desativados (`status=disabled`) não são sincronizados.
  - **`_syncTenantToFirestore(p)`**: nova função. Espera Firebase auth, escreve `system_tenants/{id}` com `set({merge:true})`. Campos gravados: `tenantId, email, name, role, status, fiscalCountry, updatedAt`.
  - **`syncTenantToFirestore(id)`**: função pública para o botão "Sincronizar" na listagem. Busca usuário, chama `_syncTenantToFirestore`, exibe toast de resultado, recarrega listagem.
  - **Listagem — badge de sincronização**:
    - `source === 'firebase'` (doc existe no Firestore): badge cinza "Firebase" — sem mudança.
    - `source === 'master'` (só no store local): badge vermelho "⚠ Não sincronizado".
  - **Listagem — botão Sincronizar**: aparece para usuários com `source === 'master'`. Cor amarela, clique chama `syncTenantToFirestore(id)`.
  - **Listagem — coluna Loja**: se `domain` e `storeUrl` ambos ausentes, exibe "Loja não configurada" em vermelho.
  - **Detecção de UIDs duplicados**: `loadUsers()` detecta o mesmo UID aparecendo mais de uma vez no store local e loga no console com nomes dos registros conflitantes.
- **Fluxo corrigido para usuário existente (patricia.fezurc@gmail.com)**:
  1. Master abre `master.html`, encontra Patricia na listagem com badge "⚠ Não sincronizado".
  2. Clica em "Sincronizar" OU edita e salva. Isso cria `system_tenants/ZjO5moRK9ZNwvLZFKeejlAvJ0aT2` no Firestore.
  3. Patricia tenta login em `admin.html`. `auth.js` encontra o doc no Firestore. Acesso liberado.
- **Novos usuários**: ao criar usuário no Master e salvar, o sync Firestore ocorre automaticamente. Nenhuma ação manual necessária.

## 2026-05-04 — Tarefa 16b: Complemento — Clientes, template público, formas de pagamento por país
- Pedido feito: (1) módulo Clientes adaptado a país fiscal; (2) cliente criado pelo template público preserva country; (3) template público mantém idioma próprio; (4) normalização de métodos de pagamento corrigida; sem refatoração ampla.
- Arquivos alterados: `js/modules/clientes.js`, `index.html`, `AI_CHANGELOG.md`
- **1 — Clientes (`js/modules/clientes.js`)**:
  - **País padrão para novo cliente**: `_defaultCountry` deriva do `Auth.getFiscalCountry()` do tenant — ES → 'España', PT → 'Portugal'.
  - **NIF dinâmico**: campo NIF no modal agora tem `id="cli-fiscal-label"` e `id="cli-fiscal-hint"` inicializados com labels/placeholder/hint do `FiscalConfig` baseados no país do cliente. Para ES: NIF/NIE/CIF. Para PT: NIF/NIPC.
  - **Região dinâmica**: label do campo Estado/Província tem `id="cli-state-label"` inicializado com `regionLabel` do FiscalConfig (Província para ES, Distrito para PT).
  - **`_regionOptions(country, selected)`**: nova função que gera as options do select de região. Para ES: 52 províncias espanholas. Para PT: 20 distritos/regiões portuguesas (inclui Açores, Madeira). Para outros países: vazio (campo livre).
  - **`_onClienteCountryChange()`**: nova função chamada no `onchange` do `cli-country`. Atualiza label/placeholder/hint do NIF, label do Estado/Região, e reconstrói as options do select de região.
  - **País select**: `cli-country` recebe `onchange="Modules.Clientes._onClienteCountryChange()"`.
  - **Validação NIF**: `_saveCliente` agora usa `FiscalConfig.get().validateNif()` e mensagem de erro do config. ES valida NIF/NIE/CIF; PT valida 9 dígitos; outros países: sempre válido.
  - **Validação código postal**: `_validPostalCode()` agora aceita Portugal (`\d{4}-\d{3}` ou `\d{4}`). Mensagem de erro de `_saveCliente` é dinâmica por país.
  - **`_onClienteCountryChange` exposta no return object**.
- **2 — Template público (`index.html`) — mudanças mínimas**:
  - **`normalizePaymentMethods()`**: corrigida/expandida. Antes mapeava `mbway` → 'Bizum' (errado). Agora: `cash`→'Efectivo', `card`→'Tarjeta', `bizum`→'Bizum', `mbway`→'MB WAY', `multibanco`→'Multibanco', `transferencia`→'Transferencia'. Métodos desconhecidos continuam com valor literal. Nenhum método é adicionado automaticamente — só se a loja ativou.
  - **Customer criado no `onAuthStateChanged`**: ao criar novo doc em `customers`, agora inclui `country: cfg?.country || cfg?.geral?.country || ''` como default do país da loja. Não é obrigatório — se vazio, fica vazio.
  - **Idioma do template**: NÃO alterado. O template continua usando seu próprio mecanismo de idioma (`publicStoreLanguage`). `fiscalCountry` não afeta o idioma.
  - **WhatsApp**: NÃO alterado. Geração de mensagem inalterada.
  - **Layout do template**: NÃO alterado.
- **3 — Regras garantidas**:
  - Bizum apenas aparece no template se a loja configurou `bizum` como método de pagamento ativo.
  - MB WAY/Multibanco apenas aparecem se ativados nas configurações de pagamento.
  - O `fiscalCountry` do tenant NÃO força nem oculta métodos de pagamento no template público.
  - Uma loja PT pode ter template em espanhol; uma loja ES pode ter template em português.

## 2026-05-04 — Tarefa 16: País fiscal por tenant (ES/PT) — Admin Master + regras por país no painel do cliente
- Pedido feito: implementar configuração de país fiscal por tenant no Admin Master; aplicar regras diferentes para Espanha e Portugal em módulos do painel; criar utilitário central `FiscalConfig`; ocultar menu Fiscal para PT; adaptar campos de fornecedor, compra e pagamento por país.
- Arquivos alterados: `js/core/auth.js`, `admin.html`, `master.html`, `js/modules/compras.js`, `js/modules/operacao.js`, `js/modules/configuracoes.js`, `AI_CHANGELOG.md`
- **1 — `FiscalConfig` global (`js/core/auth.js`)**:
  - Adicionado `window.FiscalConfig` IIFE ao final de `auth.js` (carregado antes de todos os módulos).
  - Configurações detalhadas para `ES` (NIF/NIE/CIF, IVA ativo, Fiscal ativado) e `PT` (NIF/NIPC, sem IVA, Fiscal desativado).
  - Config genérica `_default` para outros países (França, Itália, etc.) com validação permissiva.
  - `get(v)`: aceita código ISO (`'ES'`, `'PT'`) ou nome de exibição (`'España'`, `'Portugal'`).
  - `countryToCode(displayName)`: converte nome de exibição para código ISO.
  - `Auth.getFiscalCountry()`: retorna `_adminProfile.fiscalCountry || 'ES'`.
  - `AdminApp.applyFiscalVisibility()` chamado nos dois pontos de resolução da auth: bootstrap admin e `finally` do Firestore.
- **2 — Admin do cliente (`admin.html`)**:
  - `id="nav-group-fiscal"` adicionado ao `<div class="nav-group">` do menu Fiscal.
  - `AdminApp.applyFiscalVisibility()` adicionado ao objeto `AdminApp`:
    - Verifica `FiscalConfig.get(Auth.getFiscalCountry()).fiscalModuleEnabled`.
    - Oculta o grupo de nav Fiscal para tenants PT; mostra para ES/outros.
    - Se a rota atual começar com `fiscal/`, redireciona para `dashboard` ao ocultar.
- **3 — Admin Master (`master.html`)**:
  - Campo `<select id="user-fiscal-country">` adicionado ao formulário de usuário: opções 🇪🇸 Espanha (ES) / 🇵🇹 Portugal (PT).
  - `userPayload()`: inclui `fiscalCountry: val('user-fiscal-country') || 'ES'`.
  - `editUser()`: restaura `setVal('user-fiscal-country', t.fiscalCountry || 'ES')`.
  - `clearUserForm()`: reseta com `setVal('user-fiscal-country', 'ES')`.
  - O campo é salvo em `system_tenants/{tenantId}.fiscalCountry` via API Master.
- **4 — Configurações do cliente (`js/modules/configuracoes.js`)**:
  - `_renderGeral()`: adicionado bloco informativo de país fiscal (somente leitura) com bandeira, nome do país e nota sobre módulo fiscal. Lê `Auth.getAdminProfile().fiscalCountry`.
- **5 — Compras (`js/modules/compras.js`)**:
  - Corrigida referência obsoleta a `_googleMapsKey` (de Tarefa 15) → `BocaPlaces.getKey()`.
  - Modal de fornecedor:
    - País padrão ao criar novo fornecedor respeita o `fiscalCountry` do tenant (ES → España, PT → Portugal).
    - NIF label (`fo-nif-label`), placeholder e hint (`fo-nif-hint`) inicializados com config do país do fornecedor via `FiscalConfig`.
    - Label do estado (`fo-state-label`) inicializado com `regionLabel` do país.
    - `fo-country` select: `onchange="Modules.Compras._onFornecedorCountryChange()"`.
    - Nova função `_onFornecedorCountryChange()`: atualiza dinamicamente label/placeholder/hint do NIF e label do estado ao mudar o país.
    - `_saveFornecedor`: validação do NIF usa `FiscalConfig.get(FiscalConfig.countryToCode(país) || país).validateNif()` e mensagem de erro do config. Funciona para ES (NIF/NIE/CIF), PT (9 dígitos) e outros (sempre válido).
  - Modal de compra:
    - Bloco Fiscal (`cp-fiscal-card`) apenas renderizado se `FiscalConfig.get(fiscalCountry).fiscalModuleEnabled === true`.
    - Campo IVA % (`cp-iva-line`) exibido apenas para ES; para PT é `<input type="hidden">` para não quebrar `_calcCompraLinha`.
    - Grid da linha de item ajusta colunas dinamicamente (4 colunas com IVA para ES, 3 sem para PT).
- **6 — Operação (`js/modules/operacao.js`)**:
  - `_renderPagamentos()`: exibe Bizum apenas para ES; exibe MB WAY e Multibanco apenas para PT; campo "Dados bancários / referência" exibido para todos.
  - `_savePagamentos()`: salva `bizum` (ES), `mbway`/`multibanco` (PT) sem perder valores de outros países — campos de país não ativo preservam o valor já salvo.
- **Fluxo de dados**:
  - `fiscalCountry` salvo em `system_tenants/{tenantId}` pelo Admin Master.
  - `auth.js` lê o campo via `Object.assign({ tenantId, role }, snap.data())` — já incluído automaticamente.
  - `Auth.getFiscalCountry()` disponível globalmente para todos os módulos a partir do momento em que a auth resolve.

## 2026-05-04 — Tarefa 15: Google Maps / Places movido para Admin Master, autocomplete global em todos os campos de endereço
- Pedido feito: mover configuração Google Maps / Places do Admin Cliente para o Admin Master; criar utilitário global `BocaPlaces`; conectar todos os campos de endereço encontrados ao autocomplete global.
- Arquivos alterados: `master.html`, `firestore.rules`, `js/core/db.js`, `js/modules/compras.js`, `js/modules/configuracoes.js`, `js/modules/clientes.js`, `js/modules/pedidos.js`, `js/modules/operacao.js`, `AI_CHANGELOG.md`
- **1 — Removido do Admin Cliente (`configuracoes.js`)**:
  - Removida variável `gmapsSection` com bloco HTML da seção Google Maps / Places.
  - Removidos campos `cfg-gmaps-enabled` e `cfg-gmaps-key` do formulário de Integrações.
  - Removidos `googleMapsEnabled` e `googleMapsKey` do collect function.
  - Integrações continuam exibindo Google Analytics 4, GTM, Meta Pixel e WhatsApp sem alteração.
- **2 — Admin Master (`master.html`)**:
  - Novo card "Google Maps / Places" na aba Configurações, antes do card de JSON global.
  - Status visual: "● Configurado" (verde) / "● Não configurado" (vermelho).
  - Campo de chave do tipo `password` com botão Mostrar/Ocultar.
  - Checkbox "Ativar autocomplete de endereço nos formulários da plataforma".
  - Botão "Remover chave" aparece apenas quando há chave configurada.
  - Botões Salvar (Firebase) e Recarregar.
  - Campo vazio no save = preserva chave existente (não sobrescreve). Só atualiza se um novo valor for informado.
  - Funções: `loadGmapsConfig()`, `saveGmapsConfig()`, `clearGmapsKey()`, `toggleGmapsKeyVisibility()`.
  - Configuração salva em Firestore: `system/config` — fora de qualquer tenant.
  - `loadGmapsConfig()` chamado na inicialização da página.
- **3 — Firestore Rules (`firestore.rules`)**:
  - Nova regra: `match /system/config { allow read: if signedIn(); allow write: if signedIn() && request.auth.token.email == 'master@bocadobrasil.com'; }`
  - Regra `match /system/{document=**} { allow read, write: if false; }` mantida como fallback para outros docs de sistema.
- **4 — Utilitário global `BocaPlaces` (`js/core/db.js`)**:
  - Adicionado `window.BocaPlaces` ao final de `db.js` (carregado antes de todos os módulos).
  - `loadConfig()`: lê `system/config` do Firestore; cacheia resultado; falha silenciosamente.
  - `getKey()`: retorna chave se `googleMapsEnabled !== false && googleMapsKey` estiver definida.
  - `loadScript(cb)`: carrega script Google Maps com `_bocaPlacesReady` callback; gerencia fila de callbacks concorrentes; falha silenciosamente se sem chave.
  - `init(inputId)`: versão simples para campos que não precisam de `place_changed` personalizado — ativa autocomplete básico no input.
  - `setConfig(data)`: escreve em `system/config` via Firestore SDK.
  - Adicionados `DB.getSystemConfig()` e `DB.setSystemConfig(data)` para acesso direto ao doc `system/config`.
- **5 — Compras (`js/modules/compras.js`)**:
  - Removidas variáveis `_googleMapsKey` e `_googleMapsLoading`.
  - Removida função `_loadGooglePlaces`.
  - `_initAddressAutocomplete`: refatorada para usar `BocaPlaces.loadConfig()` + `BocaPlaces.loadScript()`. Mantém toda a lógica de `place_changed` que preenche `fo-neighborhood`, `fo-state`, `fo-country`. Falha silenciosamente se BocaPlaces não disponível ou sem chave.
  - `_renderFornecedores`: removida leitura de `config/integracoes` para chave do Maps. Agora usa `BocaPlaces.loadConfig()` como segunda promise.
- **6 — Campos de endereço conectados**:
  - `fo-address` (`compras.js`) — autocomplete com place_changed personalizado (preenche bairro, estado, país)
  - `cli-address` (`clientes.js`) — `BocaPlaces.init('cli-address')` 200ms após modal abrir
  - `oc-address` (`pedidos.js`) — `BocaPlaces.init('oc-address')` 200ms após overlay de cliente do pedido ser inserido no DOM
  - `mo-address` (`pedidos.js`) — `BocaPlaces.init('mo-address')` 300ms após overlay de pedido manual ser inserido no DOM (adicionado nos dois constructors: `_openNewOrderLegacy` e `_openNewOrder`)
  - `op-address-line` (`operacao.js`) — `BocaPlaces.init('op-address-line')` 100ms após `_renderEndereco` escrever no DOM
  - `cfg-address-line` (`configuracoes.js`) — `BocaPlaces.init('cfg-address-line')` 100ms após `_renderEndereco` renderizar
  - `cfg-tpl-pickup-address` (`configuracoes.js`) — `BocaPlaces.init('cfg-tpl-pickup-address')` 100ms após `_renderTemplate` renderizar
- **7 — Comportamento quando chave não configurada**:
  - Sem chave ou com `googleMapsEnabled: false`: `BocaPlaces.loadScript()` retorna silenciosamente sem carregar o script Google Maps.
  - Nenhum erro no console. Todos os campos de endereço funcionam normalmente como entrada manual.
  - `_bocaAc = true` na flag do input evita dupla inicialização se o modal for reaberto.
- **8 — Segurança / SaaS**:
  - Chave não aparece em nenhuma tela do Admin Cliente (removida da UI e do collect).
  - Chave salva em `system/config` (raiz do Firestore), não dentro de `tenants/{id}`.
  - Apenas o usuário `master@bocadobrasil.com` pode escrever em `system/config`.
  - Qualquer usuário autenticado pode ler (necessário para o autocomplete funcionar no front-end do painel).

## 2026-05-04 — Tarefa 14: Modal compra, combobox fornecedor, listas financeiras, coluna Fiscal, busca Configurações
- Pedido feito: (1) reordenar linha 1 do modal: Data|Nº Documento|Status; (2) Fornecedor em linha própria como combobox pesquisável; (3) Observações como textarea abaixo do Fornecedor; (4) ordenar Conta bancária e Categoria financeira alfabeticamente; (5) remover coluna Fiscal da tabela de Fornecedores; (6) corrigir perda de foco na busca de Tipos/Categorias em Configurações.
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`
- **1 — Linha 1 do modal reordenada**: Data | Nº Documento | Status (Fornecedor saiu desta linha).
- **2 — Fornecedor como combobox pesquisável (linha própria, largura total)**:
  - `cp-forn-display`: input visível com placeholder "Buscar fornecedor...", valor pré-preenchido com nome ao editar.
  - `cp-forn`: `<select>` oculto que mantém o `value` lido por `_saveCompra` e `_buildParcelasPreview`.
  - `cp-forn-dropdown`: div absoluta com lista de fornecedores filtrável.
  - `_compraFornSearch(q)`: busca accent-insensitive por nome, contato, NIF, telefone, WhatsApp, email, estado; exibe dropdown com opção "Sem fornecedor" + até 60 resultados com nome em bold e sub-linha de contato/email/estado.
  - `_compraFornSelect(id)`: preenche hidden select + display input + fecha dropdown + chama `_buildParcelasPreview()`.
  - `onmousedown` nos itens do dropdown (dispara antes do `onblur` do input), sem conflito com o `setTimeout(..., 200)` no blur.
- **3 — Observações como textarea**: usa helper `_textarea('cp-obs', ...)` já existente — `min-height:74px`, `resize:vertical`. Leitura em `_saveCompra` inalterada (`.value` funciona em textarea).
- **4 — Ordenação alfabética de listas financeiras**:
  - `_contas` e `_finCategorias` ordenados por `.name` com `localeCompare` antes de gerar options.
  - `_paymentOptions` já estava ordenado — sem alteração.
- **5 — Coluna Fiscal removida de `_paintFornecedoresTable`**: cabeçalho e célula removidos; variável `fiscal` removida. NIF e endereço ainda são usados na busca (`_filteredFornecedores`) e no modal de edição.
- **6 — Busca em Tipos/Categorias sem perda de foco**:
  - `_paintSimpleList` agora apenas renderiza o shell estático (filtros + `<div id="compras-simpleList-table-{kind}">`) e delega a tabela para `_repaintSimpleTable(kind)`.
  - `_repaintSimpleTable(kind)`: aplica filtros de classe e busca, escreve somente no `<div>` da tabela — sem tocar no input de busca.
  - `_setSimpleListQ(kind, q)`: chama `_repaintSimpleTable` em vez de `_paintSimpleList` — foco do input preservado.
  - `_setSimpleListClasse` continua chamando `_paintSimpleList` (recria tudo ao mudar filtro de classe, o que é correto pois os botões precisam ser re-renderizados).

## 2026-05-04 — Tarefa 13: Modal Fornecedor — layout, telefone DDI, endereço Places, campo removido
- Pedido feito: (1) remover campo "Categorias / itens fornecidos"; (2) melhorar layout do modal; (3) telefone/WhatsApp com seletor de país e DDI; (4) endereço com Google Places Autocomplete opcional; (5) Google Maps / Places em Configurações > Integrações.
- Arquivos alterados: `js/modules/compras.js`, `js/modules/configuracoes.js`, `AI_CHANGELOG.md`
- **1 — Campo "Categorias / itens fornecidos" removido**:
  - Campo removido do HTML do modal.
  - `_saveFornecedor`: linha `categories: _el('fo-categories').value` removida do payload.
  - Dados antigos (`categories`/`categorias`) já salvos em Firestore são preservados (não são apagados).
  - `_filteredFornecedores`: busca ainda inclui `f.categories` para retrocompatibilidade.
- **2 — Layout do modal corrigido**:
  - Cards: `padding:20px 22px`, `border-radius:16px`, `gap:14px` entre seções.
  - Títulos de seção: `font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em`.
  - Grids internos: `gap:14px` (era `12px`), alinhamento consistente.
  - Campo Nome com `margin-bottom:14px` isolado antes do grid de 2 colunas.
  - Estado/Província convertido de `<select>` para `<input list="fo-state-list">` (datalist) — permite tanto valores predefinidos espanhóis quanto texto livre (necessário para Places autocomplete).
  - Hint de contato removido do card (era redundante após adicionar o seletor de DDI).
- **3 — Telefone e WhatsApp com país / DDI**:
  - `PHONE_COUNTRIES`: array de 8 países (ES, BR, PT, FR, IT, DE, GB, US) com bandeira emoji e DDI.
  - `_parsePhoneValue(val)`: detecta DDI de valores já salvos como "+34 600 000 000" e extrai país + número.
  - `_phoneField(idPrefix, label, savedValue)`: gera label + flex row com `<select id="{idPrefix}-ddi">` (bandeira + DDI) e `<input id="{idPrefix}-num">`. Preserva compatibilidade com dados antigos via `_parsePhoneValue`.
  - `_phoneValue(idPrefix)`: lê DDI + número e retorna string normalizada "+34 600 000 000".
  - `_saveFornecedor`: usa `_phoneValue('fo-whatsapp')` e `_phoneValue('fo-phone')`.
  - Validação de telefone continua funcional (lê o valor combinado).
- **4 — Endereço com Google Places Autocomplete (opcional)**:
  - `_loadGooglePlaces(key, cb)`: carrega o script da API Maps/Places dinamicamente uma única vez; fila de callbacks se já estiver carregando.
  - `_initAddressAutocomplete()`: inicializa `google.maps.places.Autocomplete` no campo `fo-address`; ao selecionar uma sugestão, preenche automaticamente Bairro, Estado/Província e País; silencioso se Places não disponível.
  - `_renderFornecedores`: carrega `DB.getDocRoot('config','integracoes')` em paralelo com os fornecedores; armazena a chave em `_googleMapsKey`.
  - `_openFornecedorModal`: após abrir o modal, chama `setTimeout(_initAddressAutocomplete, 300)`; exibe indicador "● Autocomplete ativo" na seção de endereço quando a chave está configurada.
  - Fallback: sem chave configurada, o campo `fo-address` funciona como input manual normal, sem mensagem de erro.
- **5 — Google Maps / Places em Configurações > Integrações**:
  - `_renderIntegracoes` (configuracoes.js): adicionados campos `cfg-gmaps-enabled` (checkbox) e `cfg-gmaps-key` (input texto), sob subtítulo visual "Google Maps / Places" com indicador "● Configurado / Não configurado".
  - Collect function inclui `googleMapsEnabled` e `googleMapsKey`, salvos em `config/integracoes` via `DB.setDocRoot`.
  - Multi-tenant: segue o mesmo padrão dos outros campos de integrações.
  - Chave não é exposta além do necessário (usada apenas para inicializar o script Places no front).

## 2026-05-03 — Tarefa 12: Combobox pesquisável Produto/Insumo no modal de compra
- Pedido feito: remover campo de busca separado e substituir o select nativo de Produto/Insumo por um combobox pesquisável (digita dentro do próprio campo, lista filtrada, seleciona, fecha).
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`
- O que foi feito:
  - Removido `<input id="cp-item-search">` (campo separado que existia acima do select).
  - `<select id="cp-item">` agora é oculto (`display:none`), mantendo todos os `data-*` attributes intactos para que `_onCompraItemChange` e `_addCompraLinha` continuem a funcionar sem alteração.
  - Novo `<input id="cp-item-display">` visível com `onfocus`/`oninput` que abre o dropdown filtrado.
  - Novo `<div id="cp-item-dropdown">` posicionado em `absolute` abaixo do input, `z-index:9999`, max-height 220px com scroll.
  - `_normalizeStr(s)`: helper que remove acentos via `normalize('NFD')` — permite buscar "guarana" e encontrar "Guaraná".
  - `_compraItemSearch(q)`: filtra `window._compraAllItems` por nome, classe, tipo, categoria e fornecedor vinculado (accent-insensitive), renderiza até 60 itens no dropdown; usa `onmousedown` nos itens para garantir que o evento dispara antes do `onblur` do input.
  - `_compraItemSelect(id)`: define `cp-item.value = id`, preenche `cp-item-display`, fecha dropdown, chama `_onCompraItemChange()`.
  - `onblur` do display input fecha o dropdown com delay de 200ms (para permitir `onmousedown` disparar primeiro).
  - `_addCompraLinha`: após limpar o select, também limpa `cp-item-display`, fecha o dropdown e reabilita o campo `cp-conteudo` (que pode ter ficado bloqueado para Produto).
  - Funções exportadas no return: `_compraItemSearch`, `_compraItemSelect`.

## 2026-05-03 — Tarefa 11: Filtros, busca e organização das listas no módulo Compras
- Pedido feito: 8 melhorias — pill-filters em Configurações, busca em Tipos/Categorias, filtros em Fornecedores, remover filtro de Fornecedor de Itens, botão Limpar em 3 abas, fix foco busca Registros, busca expandida, ordem alfabética.
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`
- **1 — Configurações: pill-filters ordem Todos/Ambos/Insumo/Produto**:
  - Ordem dos botões corrigida para: Todos → Ambos → Insumo → Produto.
  - Estilo pill (border-radius 20px, destacado vermelho para activo) já existente, mantido.
- **2 — Busca em Tipos e Categorias**:
  - Novo `var _simpleListQ = ''` para guardar o texto de busca da lista activa.
  - `_paintSimpleList`: card de filtros com `<input id="sl-search-{kind}">` acima dos pill-buttons; filtra por nome, descrição e classe.
  - `_setSimpleListQ(kind, q)`: actualiza `_simpleListQ` e re-pinta.
  - `_switchConfigSub`: reseta `_simpleListQ` e `_simpleListClasseFilter` ao trocar de sub-aba.
- **3 — Fornecedores: card de filtros**:
  - Novo `var _fornecedoresFilters = { q: '', status: 'ativo' }`.
  - `_paintFornecedores` reescrita: card de filtros (busca + status + Limpar) + `<div id="compras-forn-table">`.
  - `_filteredFornecedores()`: filtra por status e texto (name, contact, email, phone, nif, address, categories).
  - `_paintFornecedoresTable()`: re-pinta apenas o `compras-forn-table` sem recriar filtros (preserva foco).
  - `_filterFornecedores()`, `_clearFornecedoresFilters()`.
- **4 — Produtos/Insumos: remover filtro Fornecedor**:
  - Select "Fornecedor" removido do card de filtros (grid de 6→5 colunas).
  - `_filterItens` não lê mais `it-f-forn`.
  - `_filteredItens`: busca geral inclui fornecedor vinculado, classe, unidade_base, unidade_compra_padrao.
- **5 — Botão Limpar**:
  - Adicionado em Registro de compras, Produtos/Insumos e Fornecedores.
  - `_clearRegistrosFilters()`, `_clearItensFilters()`, `_clearFornecedoresFilters()` — resetam estado e re-pintam a aba completa.
- **6 — Fix foco de busca em Registro de compras**:
  - `_paintRegistros` separado em shell estático + `_paintRegistrosTable()`.
  - `_filterRegistros` agora chama apenas `_paintRegistrosTable()` (não recria os inputs), preservando o foco.
  - `_repaintForKey('registros')` também usa `_paintRegistrosTable()`.
  - Busca expandida: conta bancária, categoria financeira, statusCompra adicionados ao haystack.
- **7 — Busca expandida em Produtos/Insumos**:
  - Haystack inclui: nome, tipo, categoria, classe, unidade_base, unidade_compra_padrao, nome do fornecedor.
  - Placeholder actualizado para reflectir os campos buscados.
- **8 — Ordem alfabética**:
  - Tipos e categorias nos selects de filtro de Produtos/Insumos: ordenados via `.localeCompare` antes do `map`.
  - `_paymentOptions`: ordem actualizada para "A definir, Cartão, Débito direto, Dinheiro, MB WAY, Outro, Transferência".
  - Opções de status em Registros: "Todos, Cancelada, Parcial, Pendente, Recebida".

## 2026-05-03 — Tarefa 10: Aba Configurações, menu, financeiro e filtros de período
- Pedido feito: (1) criar aba "Configurações" com Tipos+Categorias como sub-abas; (2) remover Tipos/Categorias do menu principal; (3) atualizar descrição da entrada financeira para incluir número do PC; (4) confirmar herança de dados do financeiro (já feito); (5) expandir filtro de período para o conjunto completo.
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`
- **1 — Aba Configurações no menu**:
  - `TABS` reduzido de 6 para 4 entradas: Registro de compras, Produtos/Insumos, Fornecedores, Configurações. Tipos e Categorias removidos do menu principal.
  - Nova variável `var _configSub = 'tipos'` para controlar a sub-aba activa dentro de Configurações.
  - `_loadSub`: adicionado caso `'configuracoes'` → `_renderConfiguracoes()`. Adicionadas rotas legadas para `'tipos'` e `'categorias'` que redirecionam para Configurações definindo `_configSub` e `_activeSub`.
  - `_repaintForKey`: caso `'configuracoes'` → `_paintConfiguracoes()`.
- **2 — Funções `_renderConfiguracoes`, `_paintConfiguracoes`, `_switchConfigSub`**:
  - `_renderConfiguracoes`: carrega `compras_tipos` e `compras_categorias` em paralelo, depois chama `_paintConfiguracoes`.
  - `_paintConfiguracoes`: renderiza cabeçalho "Configurações de Compras" + botões sub-aba (Tipos/Categorias) + `<div id="compras-config-sub">` para conteúdo da sub-aba activa, depois chama `_paintSimpleList`.
  - `_switchConfigSub(sub)`: actualiza `_configSub` e `_editingKind`, re-pinta Configurações.
  - `_switchConfigSub` adicionado ao objecto `return` do módulo.
- **3 — `_paintSimpleList` com suporte a contexto**:
  - Detecta `_activeSub === 'configuracoes'`: escreve apenas `classeFilter + table` em `#compras-config-sub` (sem `_head`, pois Configurações já tem cabeçalho próprio).
  - Modo autónomo (acesso directo a Tipos/Categorias): escreve em `compras-content` com `_head` completo.
- **4 — Descrição da entrada financeira**:
  - `_criarContasPagar` e `_buildParcelasPreview`: `descBase` agora usa formato `'Pedido de Compra #' + pcLabel + ' — ' + fornNome` (ou `'Compra — ' + fornNome` quando não há número de PC).
  - Separador de parcela alterado de `' • Parcela '` para `' — Parcela '` para consistência.
- **5 — Filtros de período expandidos**:
  - `_periodoMatch`: adicionados casos `hoje`, `ontem`, `semana_atual`, `semana_passada`, `mes_passado`, `trimestre_atual`, `ano_passado`. Lógica numérica mantida para `'7'`, `'30'`, `'90'` dias.
  - Select de período em `_paintRegistros`: agora mostra 13 opções — Todo período, Hoje, Ontem, Esta semana, Semana passada, Este mês, Mês passado, Últimos 7/30/90 dias, Este trimestre, Este ano, Ano passado.

## 2026-05-03 — Tarefa 9: Status, filtros, busca, validação parcelas, filtros itens, tipos/cats por classe
- Pedido feito: 6 funcionalidades — campo statusCompra, filtro de status, busca de produto no modal, validação soma parcelas, filtros completos em Produtos/Insumos, tipos/categorias separados por classe.
- Arquivos alterados: `js/modules/compras.js`, `AI_CHANGELOG.md`
- **1 — Campo Status da compra (`statusCompra`)**:
  - `_compraStatusOptions`: novo helper que gera as opções Pendente/Recebida/Parcial/Cancelada.
  - `_statusBadge(status)`: renderiza badge colorido (Pendente=orange, Recebida=green, Parcial=blue, Cancelada=gray).
  - `_openCompraModal`: grid de cabeçalho passou de 2 para 3 colunas (Data | Fornecedor | Status). Status default = 'Pendente' em novas compras.
  - `_saveCompra`: lê `cp-status` e inclui `statusCompra` no payload.
  - `_compraPendente`: usa `c.statusCompra` em primeiro lugar; mantém fallback legado para compras sem o campo.
  - Tabela da listagem: nova coluna "Status" com badge; coluna "Conta a pagar" mantida; colspan atualizado para 9.
- **2 — Filtro de status na listagem**:
  - `_registroFilters` ganhou campo `status`.
  - Card de filtros da listagem reformulado: fundo branco, bordas arredondadas, sombra suave — mesmo estilo do Financeiro. Adicionado `select#compras-reg-status`.
  - `_filterRegistros`: lê `compras-reg-status`.
  - `_filteredRegistros`: aplica filtro por `statusCompra` (com fallback `_compraPendente` para dados legados).
- **3 — Busca de produto no modal Nova/Editar Compra**:
  - `window._compraAllItems = _itens` armazenado ao abrir o modal.
  - `_filterItemSelect()`: reconstrói `<select id="cp-item">` filtrando `_itens` pelo nome digitado em `cp-item-search`. Preserva todos os `data-*` attributes (unidade, aproveitamento, emb, conteudo, classe).
  - HTML da célula Produto/Insumo: adicionado `<input id="cp-item-search">` acima do select.
- **4 — Validação soma de parcelas**:
  - `_saveCompra`: antes de salvar, se `gerarContaPagar` e `_compraParcelasPreview.length > 0`, calcula `somaParcelas`; se `somaParcelas > total + 0.01` bloqueia e exibe mensagem clara.
  - `_onParcelaValorChange`: calcula soma ao vivo e exibe aviso "⚠ A soma das parcelas excede o total da compra" inline na célula de total da prévia.
- **5 — Filtros completos em Produtos/Insumos**:
  - Nova variável `_itensFilters { q, classe, tipo, categoria, fornecedor, ativo }`.
  - `_filteredItens()`: filtra `_itens` pelos 6 campos combinados.
  - `_paintItens`: renderiza card de filtros (grid 6 colunas) acima da tabela. Status default = 'ativo'.
  - `_filterItens`: lê todos os campos do card e re-renderiza tabela.
- **6 — Tipos e Categorias por Classe**:
  - Novos seeds `DEFAULT_TIPOS_SEED` / `DEFAULT_CATS_SEED` com campo `classe` (insumo/produto/ambos). `_seedDefaults` usa os novos seeds.
  - `_openSimpleModal`: campo `sl-classe` (select Insumo/Produto/Ambos). Default = classe do filtro activo.
  - `_saveSimple`: persiste `classe` no documento.
  - `_paintSimpleList`: botões de filtro por classe (Todos/Insumo/Produto/Ambos) acima da tabela; coluna "Classe" na tabela.
  - `_setSimpleListClasse(kind, classe)`: novo helper que actualiza `_simpleListClasseFilter` e re-pinta.
  - `_openItemModal`: `tiposFiltrados`/`catsFiltradas` — filtra por `t.classe === classeItem || !t.classe || t.classe === 'ambos'`.
  - `_toggleItemClasse`: ao trocar classe, reconstrói `<select id="it-tipo">` e `<select id="it-categoria">` com opções da nova classe, mantendo a selecção actual se ainda existir.
- Backward compat: tipos/cats existentes sem campo `classe` continuam visíveis para ambas as classes (tratados como 'ambos').

## 2026-05-03 — Tarefa 8: Bloquear campo Conteúdo para Produto
- Pedido feito: bloquear o campo "Conteúdo (×)" no formulário de compra e o campo "Conteúdo por embalagem (×)" no modal de item quando a classe for Produto.
- Arquivos alterados:
  - `js/modules/compras.js`
  - `AI_CHANGELOG.md`
- O que foi feito:
  - **`itemOpts`**: adicionado `data-classe` em cada `<option>` do select de itens da compra, para que `_onCompraItemChange` saiba se o item é Produto ou Insumo.
  - **`_onCompraItemChange`**: ao seleccionar um item com `data-classe="produto"`, o campo `cp-conteudo` é fixado em `1` e desabilitado (`disabled=true`, opacidade 0,45, cursor not-allowed). Ao seleccionar Insumo ou limpar a selecção, o campo é reabilitado. O valor do histórico (`lastCfg.conteudo`) e o default do cadastro (`conteudoPadraoItem`) não são aplicados ao campo quando classe = Produto.
  - **`_toggleItemClasse`** (modal de item): ao mudar para classe Produto, `it-conteudo-padrao` é fixado em `1` e desabilitado com o mesmo estilo. Ao voltar para Insumo, o campo é reabilitado.
  - O cálculo de `qtyBase` e `custoAjustado` permanece inalterado — `conteudo = 1` para Produto garante `qtyBase = qtdComprada × 1 = qtdComprada`.

## 2026-05-03 — Tarefa 7: Produto vs Insumo — modal e lógica de unidade base
- Pedido feito: diferenciar Produto (revenda direta, unidade vendável) de Insumo (ingrediente de receita). Modal Produto não deve mostrar campos de catálogo/venda. Unidade base de Produto deve ser 'un' por padrão. Lógica de compra reflete que Produto não entra em receitas.
- Arquivos alterados:
  - `js/modules/compras.js`
  - `AI_CHANGELOG.md`
- O que foi feito:
  - **`it-produto-fields` simplificado**: removidos do bloco "Cardápio e venda" os campos de upload de imagem (`it-img-file`), URL alternativa (`it-img`), Preço de compra (`it-preco-compra`), Preço de venda (`it-preco-venda`) e Descrição para venda (`it-desc-venda`). O bloco passou a chamar-se "Produto para revenda direta" com hint explicativo. Mantido apenas o checkbox "Alimentar cardápio / venda como produto único" (`it-venda`).
  - **`_saveItem` para Produto**: removida a leitura dos campos de catálogo eliminados; removida a chamada a `_syncProdutoCatalogo` (catálogo é gerido em módulo próprio). Para Produto, apenas `venda_habilitada` e `usar_em_fichas: false` são escritos além dos campos comuns.
  - **`_toggleItemClasse` — unidade base padrão**: quando o utilizador muda a classe para Produto e o campo `it-unidade` ainda não tem valor, o sistema auto-selecciona 'un'. Para itens existentes com unidade_base já configurada, o valor não é alterado.
  - **Hint dinâmico "Compra e custo"**: secção recebeu `id="it-custo-hint"`. Em `_toggleItemClasse`, o hint troca de texto conforme a classe: Produto → "controlo de estoque e custo por unidade vendável"; Insumo → "custos, receitas e cálculo financeiro".
- Regras preservadas:
  - `_convFactor`, `_isBaseUnit`, cálculo de `qtyBase`, `custoAjustado` e `totalLinha` inalterados.
  - `_doSaveCompra` continua a actualizar `preco_compra` (custo/base calculado) no item após cada compra.
  - Para Produto como Guaraná: Embalagem=unidade, Conteúdo=1, Unid. base=un → +1 un, custo €1,00/un. Para caixa c/ 12: Embalagem=caixa, Conteúdo=12 → +12 un, custo €0,6667/un.

## 2026-05-03 — Tarefa 6: Preço por embalagem (preço unitário de compra)
- Pedido feito: o campo "Preço total (€)" estava sendo tratado como total da linha, gerando custo/base incorreto. Corrigir para que o utilizador informe o preço por embalagem/unidade comprada, e o sistema calcule o total automaticamente.
- Arquivos alterados:
  - `js/modules/compras.js`
  - `AI_CHANGELOG.md`
- O que foi feito:
  - **Campo renomeado**: `"Preço total (€)"` → `"Preço/embalagem (€)"` no formulário de item da compra.
  - **`_calcCompraLinha` corrigido**: introduz variável `precoUnit` (o que o utilizador digita). `subtotalItem = qty × precoUnit`; `totalLinha = subtotalItem − desconto`; `valorSemIva` e `ivaValor` calculados sobre `totalLinha`; `custo/base = valorSemIva / qtyBase / aproveitamento`. Preview agora mostra também o Total calculado em vermelho (ex: "Total: €7,00").
  - **`_addCompraLinha` corrigido**: mesma fórmula que `_calcCompraLinha`. Armazena dois campos no objeto de linha: `precoUnitario` (novo, o que o user digitou) e `precoPago` (igual a `precoUnitario`, para compatibilidade com `_getLastCompraConfig`). `totalLinha` passa a refletir `qty × precoUnit − desconto`.
  - **`_renderCompraLinhas` atualizado**:
    - Cabeçalho: `"Preço pago"` → `"€/embal. · Total"`.
    - Célula: mostra `€3,50/embal.` na linha principal e `Total €7,00 · IVA 23%` em sub-linha menor.
  - **`_getLastCompraConfig` atualizado**: ao buscar auto-fill de preço, retorna `precoUnitario` se existir (dados novos), senão usa `precoPago` como fallback (dados legados — antigos compras salvavam o total, isso é aceitável pois não há como distinguir retroactivamente).
  - **Backward compat**: linhas antigas sem `precoUnitario` continuam sendo exibidas (a célula mostra `precoPago/embal.`). O total da compra (`_lineTotal`) continua a usar `totalLinha` — campo já existente — sem mudança.
- Fórmula final:
  ```
  subtotalItem         = qtdComprada × precoUnitario
  totalLinha           = max(0, subtotalItem − desconto)
  valorSemIva          = ivaPct > 0 ? totalLinha / (1 + ivaPct/100) : totalLinha
  ivaValor             = totalLinha − valorSemIva
  qtyBase              = qtdComprada × conteudoPorEmbalagem × _convFactor(emb, base)
  custoAjustado        = valorSemIva / qtyBase / (aproveitamento/100)
  ```
- Exemplo verificado: 2 pacotes × 5 kg, €3,50/pacote → subtotal €7,00, estoque +10 kg, custo €0,70/kg ✓

## 2026-05-03 — Tarefa 5: Refinar separação embalagem × unidade base
- Pedido feito: impedir que o campo Embalagem auto-preencha com unidades de medida (kg, g, L, ml); adicionar campos `unidadeCompraPadrao`/`conteudoPorEmbalagemPadrao` no cadastro de item; novo helper `_isBaseUnit`; corrigir fallback de `_onCompraItemChange`; remover kg/g/L/ml do datalist; mostrar embalagem padrão na tabela de itens.
- Arquivos alterados:
  - `js/modules/compras.js`
  - `AI_CHANGELOG.md`
- O que foi feito:
  - **`_isBaseUnit(u)`**: novo helper que retorna `true` para kg, g, gr, L, ml, kilo, litro, litros. Usado para detectar quando um valor salvo como `unidadeCompra` é na verdade uma unidade de medida (dado legado) em vez de uma embalagem (pacote, caixa, etc.).
  - **`itemOpts` com `data-emb`/`data-conteudo`**: ao gerar o `<select>` de itens, cada `<option>` recebe `data-emb` (embalagem padrão do item — filtrada por `_isBaseUnit` para nunca expor unidade de medida) e `data-conteudo` (conteúdo padrão). Prioridade: `unidade_compra_padrao` > `ultima_embalagem`; ambos filtrados por `_isBaseUnit`.
  - **`_onCompraItemChange` reescrito (fix principal)**: ao selecionar um item, `cp-emb` passa a ser preenchido com:
    1. `_getLastCompraConfig.embalagem` — mas apenas se `_isBaseUnit` retornar `false` (dado limpo);
    2. caso contrário, usa `opt.dataset.emb` (embalagem padrão do cadastro do item);
    3. se não há histórico, usa `opt.dataset.emb` e `opt.dataset.conteudo` — **nunca** usa `unidadeBase`.
    Isso corrige o comportamento anterior onde compras antigas que salvavam "kg" em `unidadeCompra` propagavam esse valor errado para o formulário.
  - **Datalist `cp-emb-list` limpo**: removidas as opções kg, g, L, ml. Mantidas apenas embalagens: un, unidade, pacote, caixa, fardo, saco, garrafa, lata, frasco, bandeja, botella, bolsa, caja.
  - **Campos no cadastro de item (`_openItemModal`)**: nova grade em "Compra e custo" com `it-emb-padrao` (Embalagem de compra padrão — texto livre + datalist sem unidades de medida) e `it-conteudo-padrao` (Conteúdo por embalagem — número, default 1). Esses campos definem o auto-preenchimento futuro quando não houver histórico de compras.
  - **`_saveItem` atualizado**: persiste `unidade_compra_padrao` e `conteudo_por_embalagem_padrao` no documento do item.
  - **`_itensTable` — coluna Unidade enriquecida**: exibe `unidade_base` na linha principal; se o item tiver `unidade_compra_padrao`, exibe em sub-linha menor (cor suave) com o formato "pacote ×5" (conteúdo se > 1).
- Compatibilidade: compras antigas com `unidadeCompra = 'kg'` continuam sendo calculadas corretamente (`_convFactor` lida com isso); o único efeito da correção é no preenchimento do campo de formulário, não no cálculo de estoque.

## 2026-05-03 — Tarefa 4: Separar embalagem, conteúdo e unidade base
- Pedido feito: separar unidade de compra (embalagem), conteúdo por embalagem e unidade base de cálculo; corrigir custo/base e entrada no estoque; auto-preencher última configuração ao selecionar item; nova tabela de linhas com coluna Compra → Estoque.
- Arquivos alterados:
  - `js/modules/compras.js`
  - `AI_CHANGELOG.md`
- O que foi feito:
  - **`_convFactor(emb, base)`**: novo helper que retorna o fator de conversão entre unidade de compra e unidade base para sub-unidades conhecidas (`g→kg = 0,001`, `ml→L = 0,001`, e inversos). Para embalagens livres (pacote, caixa, fardo…) retorna 1, pois o `conteudo` já carrega o multiplicador.
  - **`_toBase` atualizado**: simplificado para delegar a `_convFactor`; mantido para compatibilidade com compras antigas (onde `conteudoPorEmbalagem` não existe).
  - **`_getLastCompraConfig(itemId)`**: substitui `_getLastPrecoPago`. Retorna `{precoPago, embalagem, conteudo, unidadeBase}` da compra mais recente que contém aquele item. Compras antigas sem `conteudoPorEmbalagem` retornam `conteudo:1`.
  - **Formulário de item (nova grade em dois rows):**
    - Row 1: `Produto/Insumo | Qtd. comprada | Embalagem (text+datalist) | Conteúdo (×) | Unid. base (read-only)`
    - Row 2: `Preço total (€) | Desc. (€) | IVA % | + Adicionar`
    - `<datalist id="cp-emb-list">` com opções comuns: kg, g, L, ml, un, pacote, caixa, fardo, saco, garrafa, lata, frasco, botella, bolsa, caja.
    - Campo `cp-unidade-base`: read-only, preenchido automaticamente pela unidade base do item selecionado.
    - Campo `cp-emb`: texto livre com sugestões. Auto-preenchido com a última embalagem usada para aquele item.
    - Campo `cp-conteudo`: número, default 1. Auto-preenchido com o último conteúdo usado.
  - **Fórmula corrigida:** `qtyBase = qtdComprada × conteudoPorEmbalagem × _convFactor(embalagem, unidadeBase)`. Exemplos verificados: 1 pacote × 5 kg = 5 kg de estoque, €3,50 / 5 kg = €0,70/kg. 12 un × 1 = 12 un, €8,00 / 12 = €0,6667/un.
  - **`_onCompraItemChange` reescrito:** ao selecionar item, preenche `cp-unidade-base`, e auto-preenche `cp-emb`, `cp-conteudo` e `cp-preco` (preço só se estiver vazio) com dados da última compra. Exibe hint "Última compra: N embalagem × C unidadeBase · €X.XX".
  - **`_calcCompraLinha` reescrito:** usa novos campos `cp-emb` e `cp-conteudo`. Preview inline: "Compra: 1 pacote × 5 kg → Estoque: +5,000 kg · Custo/base: €0,7000/kg · IVA: …".
  - **`_addCompraLinha` reescrito:** lê `cp-emb` e `cp-conteudo`; armazena `conteudoPorEmbalagem` na linha; limpa todos os campos incluindo os novos após adicionar.
  - **`_renderCompraLinhas` reescrito:** colunas `Item | Compra | +Estoque | Preço pago | Custo/base`. Compra mostra "1 pacote × 5 kg" se `conteudo > 1`, ou "N unidade" se `conteudo = 1`. Estoque mostra "+5,000 kg" em azul. Backward compat: linhas antigas usam `conteudo = 1`.
  - **`_doSaveCompra`**: ao atualizar custo do item após compra, também persiste `ultima_embalagem` e `ultimo_conteudo` para auto-preenchimento futuro.
- Compatibilidade: compras antigas sem `conteudoPorEmbalagem` são exibidas com `conteudo = 1`, sem recalcular `qtyBase` (usa o valor já salvo). Nenhum dado antigo é alterado.
- Pendências: os módulos de Receitas/Fichas técnicas ainda usam o custo por unidade base vindo de `custo_atual` no item — isso já estava correto e continua funcionando pois `custoAjustado` é calculado sobre a `unidadeBase` do item.

## 2026-05-02
- Pedido feito: número sequencial de pedido de compra (PC-000001), melhor descrição no financeiro, coluna de pedido na listagem, número no modal, sugestão de preço por item, e prévia editável de parcelas antes de salvar.
- Arquivos alterados:
  - `js/modules/compras.js`
  - `AI_CHANGELOG.md`
- O que foi feito:
  - **`_padNum(n, len)`**: zero-pad helper (ex: `_padNum(1, 6)` → `'000001'`).
  - **`_gerarNumeroPedido()`**: lê `DB.getDocRoot('config', 'compras')` → `{lastPCNum: N}`, incrementa e persiste de volta. Bootstrap: se o contador não existir usa `_compras.length` como base. Retorna `'PC-000001'`. Chamado apenas ao criar uma compra nova.
  - **`_getFornecedorNome(fornecedorId)`**: retorna nome do fornecedor ou `'Compra sem fornecedor'`.
  - **`_getLastPrecoPago(itemId)`**: varre `_compras` em ordem decrescente de data, retorna o `precoPago` mais recente para aquele item.
  - **`_buildParcelasPreview()`**: disparado ao mudar fornecedor, gerar-conta-a-pagar, vencimento ou parcelas. Reconstrói `_compraParcelasPreview[]` com descrição `PC-000001 • Fornecedor • Parcela N/T`, valor e data; chama `_renderParcelasPreview()`.
  - **`_renderParcelasPreview()`**: renderiza tabela editável em `#cp-parcelas-preview` com inputs de valor e vencimento por parcela. Rodapé mostra total em tempo real.
  - **`_onParcelaValorChange(idx, value)`** / **`_onParcelaVencChange(idx, value)`**: atualizam `_compraParcelasPreview[idx]` sem re-renderizar a tabela inteira.
  - **Coluna "Pedido" na listagem** (`_paintRegistros`): `thead` e dados agora têm 8 colunas; coluna mostra `c.numPedido || '—'` em fonte monospace; empty state atualizado para `colspan="8"`.
  - **Número no modal** (`_openCompraModal`): badge com `numPedido` exibido abaixo do banner financeiro para compras existentes. Reset de `_compraParcelasPreview = []` ao abrir. Forn select, checkbox gerar-conta, vencimento e parcelas ganham handlers `_buildParcelasPreview`. Div `#cp-preco-hint` inserido após grade de itens; `#cp-parcelas-preview` inserido no card de parcelamento.
  - **Sugestão de preço** (`_onCompraItemChange`): após trocar o item, chama `_getLastPrecoPago`. Se encontrado e o campo de preço estiver vazio, preenche automaticamente e exibe hint "Último preço pago: €X.XX [Usar]".
  - **`_renderCompraLinhas`**: chama `_buildParcelasPreview()` ao final para manter prévia atualizada ao adicionar/remover itens.
  - **Validação antes de salvar** (`_saveCompra`): se `gerarContaPagar` e a prévia tem itens, bloqueia se qualquer valor ≤ 0 ou vencimento vazio.
  - **`_doSaveCompra`**: para novas compras, chama `_gerarNumeroPedido()` antes de persisitir e injeta `numPedido` em `compraData`; passa `pcLabel` para `_criarContasPagar`.
  - **`_criarContasPagar(compraId, compraData, total, numPedido)`**: prioriza `_compraParcelasPreview` se disponível (usa valores, datas e descrições da prévia). Fallback auto-calcula e usa descrição `PC-XXXXXX • Fornecedor • Parcela N/T`. Salva `numPedido` em cada conta gerada.
  - **Pesquisa**: campo `numPedido` incluído na hay de `_filteredRegistros`.
- Compatibilidade: lógica de estorno (Task 2) totalmente preservada. `_criarContasPagar` ainda cancela pendentes antes de recriar quando chamado com `mode:'recalculate'`.

## 2026-05-02
- Pedido feito: lógica completa de edição, exclusão, estorno e recriação de contas a pagar vinculadas às compras.
- Arquivos alterados:
  - `js/modules/compras.js`
  - `AI_CHANGELOG.md`
- O que foi feito:
  - **Estado financeiro assíncrono**: `_loadEstadoFinanceiro(compraId)` carrega as contas de `financeiro_apagar` + `contas_pagar` e as movimentações de `movimentacoes`, classifica cada conta como paga (tem movimento `efetivado`) ou pendente, ignorando estornadas/canceladas.
  - **Fluxo 1 — sem contas**: edição livre, footer normal (Cancelar / Atualizar compra).
  - **Fluxo 2 — parcelas pendentes**: banner laranja informativo + confirmação antes de salvar → `_cancelarParcelasPendentes` remove as parcelas antigas → `_criarContasPagar` gera novas. Mensagem: "Compra atualizada e contas a pagar recalculadas."
  - **Fluxo 3 — pagamento confirmado**: banner vermelho bloqueante + `_saveCompra` recusa salvar + footer mostra só "Fechar" e "Estornar pagamentos e liberar edição".
  - **Estorno** (`_executarEstorno`): para cada parcela paga cria movimento de entrada `tipo:entrada / origem:estorno_compra` na coleção `movimentacoes`, marca o movimento original como `estornado:true`, marca a conta a pagar como `status:'Estornada'` (mantém histórico), remove parcelas pendentes, limpa `contaPagarId/contaPagarIds` na compra. Após estorno: banner verde + footer de edição liberado.
  - **Fluxo 4 — salvar após estorno**: contas estornadas têm status `Estornada` e são ignoradas pelo estado; `_criarContasPagar` gera novas parcelas do zero.
  - **Exclusão segura** (`_deleteCompra`): carrega estado antes de confirmar; se há pagamento pago → toast de bloqueio; se há pendentes → confirma com aviso de remoção das parcelas → `_doDeleteCompra` remove parcelas + compra; se sem contas → confirmação simples.
  - **Anti-duplo-clique**: flag `_savingCompra` bloqueia chamadas simultâneas ao `_doSaveCompra`.
  - **Coleções usadas**: leitura em `financeiro_apagar` + `contas_pagar`; escrita/remoção em `financeiro_apagar` (padrão existente); movimentos de estorno em `movimentacoes`; registros de compra em `compras`.
  - `_saveContaPagarFromCompra` (legada) removida e substituída por `_criarContasPagar` (sem "atualizar existente" — sempre fresh após cancelar pendentes).
- Pendências reais:
  - O módulo Financeiro / Contas a pagar ainda não exibe o status "Estornada" com visual próprio — atualmente mostra o status como texto bruto. Uma task futura pode adicionar o badge "Estornada" na coluna de status.
  - Não há tela de detalhe de compra no módulo Financeiro com link de volta à compra original — pode ser adicionado futuramente.
  - A carga de `movimentacoes` completa ao abrir o modal pode ser lenta em bases grandes; otimização futura com query filtrada por `contaPagarId`.

## 2026-05-02
- Pedido feito: ajustes finais na página Compras — paginação em todas as abas, botões de modal (Cancelar / Excluir), estados vazios com CTA e redução dos pesos tipográficos.
- Arquivos alterados:
  - `js/modules/compras.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: a página Compras não tinha paginação (listas longas ficavam sem controle de scroll), os modais tinham apenas o botão de ação principal (sem Cancelar nem Excluir em modo de edição), os estados vazios eram texto simples sem CTA, e toda a tipografia usava `font-weight:900/800` de forma excessiva tornando a interface visualmente pesada.
- Impacto esperado:
  - **Paginação**: todas as 5 abas (registros, itens, fornecedores, tipos, categorias) exibem seletor 10 / 25 / 50 por página e navegação numérica. Estado `_pag` por aba, resetado ao filtrar/pesquisar. Botões de página com destaque ativo em vermelho.
  - **Botões de modal**: em criação → `Cancelar` + botão primário; em edição → `Excluir` (vermelho claro, à esquerda) + `Cancelar` + botão primário. Funções `_delete*` fecham o modal antes de executar a remoção.
  - **Estados vazios com CTA**: tabelas vazias exibem mensagem + botão "+ Adicionar" / "+ Nova compra" que abre o modal correspondente.
  - **Tipografia**: `font-weight:900/800` → `600` em todo o módulo (h2 de seção, labels, cabeçalhos de tabela, célula strong, botão principal). H1 "Compras" recebe `font-weight:600` inline. Adicionadas funções `_cancelStyle()` e `_dangerStyle()`.
  - Funções `_paintFornecedores` e `_paintSimpleList` separadas de `_renderFornecedores` / `_renderSimpleList` para permitir repintura sem recarregar do banco ao mudar de página.
- Sem mudança de fluxo ou dependência com outros módulos.

## 2026-05-01
- Pedido feito: bloquear edição acidental do tenantId no Master.
- Arquivos alterados:
  - `master.html`
  - `server.rb`
  - `AI_CHANGELOG.md`
- Motivo da alteração: o campo "ID do usuário" era um input editável tanto em criação quanto em edição. Em modo de edição, qualquer alteração acidental no ID causava a criação de um novo tenant órfão em vez de atualizar o existente — o que gerava configuração (repo/token) salva no tenant errado.
- Impacto esperado: em edição, o Tenant ID aparece em bloco somente-leitura com botão "Copiar" e aviso "fixo após criação". O `window._editingTenantId` garante que o payload sempre usa o ID original. A lista de tenants exibe botão "Copiar" ao lado de cada ID. O backend usa `existing['id']` quando o tenant já existe, ignorando qualquer ID diferente que venha no payload.
- Sem mudança de fluxo ou dependência.

## 2026-05-01
- Pedido feito: adicionar campo GitHub Token no Master UI para configurar o token de publicação por tenant.
- Arquivos alterados:
  - `master.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: o backend do upload legado de imagem lê `githubToken` do registro do tenant, mas o formulário do Master não tinha campo para salvar esse token. Sem o token configurado, o upload retornava "GitHub Token não configurado".
- Impacto esperado: a seção "Publicação GitHub" do modal de edição/criação de tenant passa a ter o campo "GitHub Token" (type password). Ao editar um tenant com token já salvo, o campo fica vazio e exibe o badge "✓ configurado" — o valor real nunca é exibido. Ao salvar com campo vazio, o token existente é preservado (chave ausente no payload → backend mantém). Ao digitar um novo token, o valor é atualizado. Um checkbox "Remover token configurado" aparece somente quando há token salvo e permite limpá-lo explicitamente. O `.master-store.json` já estava no `.gitignore`, portanto o token fica protegido sem necessidade de arquivo separado.
- Sem mudança de fluxo ou dependência.

## 2026-05-01
- Pedido feito: restaurar o fluxo legado de upload de imagem de produto para GitHub Raw — corrigir bug de multipart no WEBrick.
- Arquivos alterados:
  - `server.rb`
  - `AI_CHANGELOG.md`
- Motivo da alteração: `WEBrick::HTTPUtils::FormData` (Ruby 2.6 / WEBrick 1.9.1) é uma subclasse de `String` sem métodos `tempfile` nem `read`. O backend testava apenas essas duas interfaces e caía no branch `else`, tentando decodificar um `dataUrl` vazio — resultando em "Arquivo de imagem obrigatório" antes de qualquer upload. Adicionado um `elsif` específico para `FormData` que usa `.filename` e `.to_s` para extrair nome e conteúdo do arquivo.
- Impacto esperado: o upload multipart agora passa pela etapa de leitura do arquivo e avança até a verificação do token do GitHub. Confirmado via `curl`: a resposta mudou de "Arquivo de imagem obrigatório" para "GitHub Token não configurado", provando que o arquivo é lido corretamente.
- Pendências: configurar `githubToken` no tenant via Master UI para concluir o fluxo end-to-end. Nenhuma alteração de código é necessária para isso.
- Sem mudança de fluxo ou dependência.

## 2026-05-01
- Pedido feito: corrigir o CORS no backend local para permitir o upload legado de imagem de produto do admin em `http://localhost:8080`.
- Arquivos alterados:
  - `server.rb`
  - `AI_CHANGELOG.md`
- Motivo da alteração: adicionar resposta correta para preflight `OPTIONS` e incluir headers CORS em sucesso e erro na rota `/api/master/product-image/upload`.
- Impacto esperado: o frontend local consegue chamar o backend local sem bloqueio CORS, publicar a imagem no GitHub Raw e preencher automaticamente a URL do produto.
- Pendências: testar o fluxo completo de upload no navegador com o admin em `8080` e o backend em `3000`.

## 2026-05-01
- Pedido feito: restaurar o fluxo legado de upload de imagem de produto para GitHub Raw quando o upload novo estiver desativado.
- Arquivos alterados:
  - `server.rb`
  - `js/modules/catalogo.js`
  - `FEATURE_INDEX.md`
  - `DEPENDENCY_MAP.md`
  - `AI_CHANGELOG.md`
- Motivo da alteração: voltar a publicar a imagem pelo backend local para gerar automaticamente a URL raw.githubusercontent.com, sem expor token no frontend e sem depender do Firebase Storage nesta fase.
- Impacto esperado: o campo de imagem volta a preencher a URL automaticamente, o produto salva normalmente e o catálogo continua exibindo imagens antigas e novas no padrão legado.
- Pendências: testar criação de produto novo, edição com imagem antiga raw e confirmação de que o upload novo não aciona Firebase Storage.

## 2026-05-01
- Pedido feito: ajustar temporariamente a interface de imagem do produto para mostrar apenas URL enquanto o upload automático está pendente.
- Arquivos alterados:
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: evitar confusão na tela enquanto o envio direto de foto está desativado por pendência de armazenamento.
- Impacto esperado: o cadastro/edição de produto passa a exibir somente o campo de URL e uma mensagem curta, sem abrir espaço para um upload que não será concluído nesta fase.
- Pendências: reexibir o seletor de arquivo quando a flag de upload for reativada.

## 2026-05-01
- Pedido feito: restaurar temporariamente o fluxo antigo de imagem de produto e desativar o envio novo para Firebase Storage nesta fase.
- Arquivos alterados:
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: evitar o travamento do cadastro/edição de produto enquanto a configuração final de CORS/Blaze permanece pendente.
- Impacto esperado: o formulário deixa de tentar enviar imagem para o Storage, mantém preview e URL manual/existente funcionando e evita bloqueio de salvamento.
- Pendências: reativar o envio automático apenas quando a configuração do Storage estiver concluída no bucket real.

## 2026-05-01
- Pedido feito: documentar a configuração pendente do Firebase Storage/CORS para upload de imagens e registrar a finalização futura.
- Arquivos alterados:
  - `PENDING_SETUP.md`
  - `AI_CHANGELOG.md`
- Motivo da alteração: deixar explícito que o fluxo de upload já está preparado no código, mas a aplicação do CORS depende do bucket real e de ambiente com Google Cloud SDK ou Cloud Shell.
- Impacto esperado: a pendência técnica fica registrada com comandos, risco e decisão temporária, evitando retrabalho até a etapa com Blaze/Google Cloud ativo.
- Pendências: executar `gcloud storage buckets update` e `gcloud storage buckets describe` no bucket `gs://bocado-brasil.firebasestorage.app` quando houver ambiente adequado.

## 2026-05-01
- Pedido feito: resolver definitivamente o bloqueio CORS do Firebase Storage no upload de imagens.
- Arquivos alterados:
  - `cors.json`
  - `AI_CHANGELOG.md`
- Motivo da alteração: ajustar a política de CORS com `OPTIONS` e headers de upload para o bucket correto do Storage, liberando a preflight request do navegador.
- Impacto esperado: o bucket aceita a origem local do admin e o upload de produto consegue avançar até `getDownloadURL` sem cair em erro CORS.
- Pendências: aplicar a configuração no bucket `gs://bocado-brasil.firebasestorage.app` com `gcloud storage buckets update` e confirmar com `gcloud storage buckets describe`.

## 2026-05-01
- Pedido feito: corrigir o CORS do bucket Firebase Storage para liberar upload de imagem de produto sem travar.
- Arquivos alterados:
  - `cors.json`
  - `AI_CHANGELOG.md`
- Motivo da alteração: definir as origens permitidas e os headers necessários para upload do Storage a partir do admin local e do domínio público.
- Impacto esperado: o bucket passa a aceitar as preflight requests do upload de produto e o fluxo deixa de ficar preso antes do `getDownloadURL`.
- Pendências: aplicar a configuração no bucket com `gcloud storage buckets update` e confirmar o `cors_config` no `gs://bocado-brasil.firebasestorage.app`.

## 2026-05-01
- Pedido feito: diagnosticar por que o upload de imagem de produto ainda trava após ajuste de regras.
- Arquivos alterados:
  - `js/core/image-tools.js`
  - `js/modules/catalogo.js`
- Motivo da alteração: registrar `auth.uid`, `tenantId`, `productId`, caminho exato do Storage e `FirebaseError.code` durante o upload para confirmar se o bloqueio vem de permissão, caminho ou falha de envio.
- Impacto esperado: o console passa a mostrar a origem real da falha e o produto mantém o estado correto enquanto o upload tenta finalizar ou falha.
- Pendências: validar no navegador se `auth.uid` e `tenantId` batem, se o caminho segue `tenants/{tenantId}/products/{productId}/` e se o erro do Storage/Firestore aparece com o código correto.

## 2026-05-01
- Pedido feito: verificar se o travamento do upload de imagem de produto estava ligado às configurações e regras do Firebase Storage/Firestore.
- Arquivos alterados:
  - `storage.rules`
  - `firebase.json`
  - `FEATURE_INDEX.md`
  - `DEPENDENCY_MAP.md`
  - `AI_CHANGELOG.md`
- Motivo da alteração: explicitar a configuração do Storage por tenant e documentar a dependência de Firebase para upload de imagens de produto sem abrir o bucket inteiro.
- Impacto esperado: uploads de produto passam a ter regras de Storage específicas, com leitura pública de URLs e escrita restrita ao tenant autenticado, reduzindo a chance de bloqueio por configuração ausente.
- Pendências: validar o upload no navegador com produto antigo do GitHub Raw e produto novo enviado ao Storage.

## 2026-05-01
- Pedido feito: separar imagens antigas do GitHub Raw e novas imagens do Firebase Storage sem deixar o upload de produto preso.
- Arquivos alterados:
  - `js/core/image-tools.js`
  - `js/modules/catalogo.js`
- Motivo da alteração: garantir timeout real para upload de produto, preencher a URL final quando o envio conclui e manter compatibilidade com imagens antigas já publicadas no GitHub Raw.
- Impacto esperado: imagens antigas continuam aparecendo, novas imagens passam a ser enviadas para o Storage com encerramento garantido do estado de upload e sem salvar arquivos de usuária no repositório.
- Pendências: testar no navegador produto antigo com URL raw, produto novo com upload e edição com troca de imagem.

## 2026-05-01
- Pedido feito: impedir que imagens de produto entrem no repositório local ou no GitHub.
- Arquivos alterados:
  - `.gitignore`
- Motivo da alteração: bloquear pastas de upload locais e arquivos de imagem enviados pelas usuárias, preservando apenas assets fixos do sistema com exceções explícitas.
- Impacto esperado: imagens de produto não aparecem como arquivos novos no Git e não são enviadas ao GitHub; o fluxo continua usando Storage e Firestore apenas para URL/metadados.
- Pendências: confirmar no ambiente real se não existe nenhum fluxo antigo gravando arquivo local fora das pastas bloqueadas.

## 2026-05-01
- Pedido feito: impedir que o upload de imagem do produto fique preso em estado de envio quando houver demora ou falha.
- Arquivos alterados:
  - `js/modules/catalogo.js`
- Motivo da alteração: criar timeout, liberar o estado de envio e evitar bloqueio infinito no cadastro/edição de produto.
- Impacto esperado: o botão salvar volta a funcionar após timeout ou erro, o preview retorna ao estado anterior e a URL final só entra quando o envio conclui.
- Pendências: testar upload normal, edição com troca de imagem e falha simulada no navegador.

## 2026-05-01
- Pedido feito: impedir que o upload de imagem do produto fique travado em estado de envio indefinidamente.
- Arquivos alterados:
  - `js/modules/catalogo.js`
- Motivo da alteração: adicionar timeout e liberação garantida de estado para o fluxo de imagem do produto.
- Impacto esperado: o cadastro/edição de produto deixa de ficar preso em "A imagem ainda está sendo enviada" quando o envio falha ou demora demais.
- Pendências: testar no navegador a troca de imagem em produto novo, produto existente e um caso de falha simulada.

## 2026-05-01
- Pedido feito: corrigir o fluxo de upload de imagem no cadastro/edição de produto, com preview imediato e preenchimento automático da URL.
- Arquivos alterados:
  - `js/core/image-tools.js`
  - `js/modules/catalogo.js`
- Motivo da alteração: fazer o input de imagem disparar preview instantâneo, upload assíncrono e persistência correta da URL/metadados do produto.
- Impacto esperado: ao escolher um arquivo, o preview do produto atualiza na hora, a URL é preenchida após o envio e o catálogo passa a mostrar a imagem correta.
- Pendências: testar o fluxo de edição de produto com imagem antiga, troca de imagem e cancelamento/erro de upload no navegador.

## 2026-05-01
- Pedido feito: incluir instruções de tamanhos e formatos de imagem e mostrar motivo claro quando um upload não puder ser concluído.
- Arquivos alterados:
  - `js/core/image-tools.js`
  - `js/modules/catalogo.js`
  - `js/modules/configuracoes.js`
- Motivo da alteração: orientar a usuária sobre formatos e dimensões recomendadas e tornar as recusas de upload mais explicáveis.
- Impacto esperado: a tela passa a informar JPG/JPEG/PNG/WebP aceitos, tamanhos recomendados e mensagens mais claras quando a imagem não for enviada.
- Pendências: testar no navegador os três fluxos de upload e confirmar se as mensagens de erro ficam claras na prática.

## 2026-05-01
- Pedido feito: padronizar e otimizar automaticamente imagens enviadas pelas usuárias no catálogo, banners e logos.
- Arquivos alterados:
  - `admin.html`
  - `js/core/image-tools.js`
  - `js/modules/catalogo.js`
  - `js/modules/configuracoes.js`
  - `index.html`
  - `tools/generate-product-pages.rb`
- Motivo da alteração: reduzir peso das imagens, diminuir custo de Storage/tráfego e usar versões otimizadas no catálogo público e no admin.
- Impacto esperado: uploads passam a gerar WebP otimizado com variantes por uso, preservando a experiência atual e melhorando velocidade de carregamento.
- Pendências: validar o fluxo real de upload no navegador, conferir Storage por tenant e revisar se há algum cadastro legado sem URLs derivadas.

## 2026-05-01
- Pedido feito: criar documentação de passagem para outro agente, sem alterar funcionalidades.
- Arquivos alterados:
  - `PROJECT_MAP.md`
  - `FEATURE_INDEX.md`
  - `DEPENDENCY_MAP.md`
  - `AI_CHANGELOG.md`
  - `CLAUDE.md`
- Motivo da alteração: reduzir consumo de contexto e registrar a arquitetura, módulos, dependências e instruções de trabalho.
- Impacto esperado: facilitar a continuidade do desenvolvimento por IA sem releitura integral do projeto.
- Pendências: manter este arquivo atualizado após cada mudança futura feita por IA.

## 2026-05-01
- Pedido feito: criar páginas públicas individuais de produto para SEO, sitemap e robots por loja single-tenant, com exportação isolada via GitHub.
- Arquivos alterados:
  - `server.rb`
  - `js/modules/catalogo.js`
  - `tools/generate-product-pages.rb`
  - `produtos.json`
  - `sitemap.xml`
  - `robots.txt`
  - `produtos/` (páginas geradas por slug)
- Motivo da alteração: habilitar páginas públicas indexáveis por produto, preservar slug estável, gerar sitemap/robots e conectar a geração ao fluxo de publicação do master.
- Impacto esperado: o storefront continua com modal, enquanto o site publicado passa a ter URLs rastreáveis por produto e publicação isolada por tenant/repositório.
- Pendências: validar na publicação real com domínio customizado do tenant e conferir que os arquivos gerados são enviados ao repositório correto.

## 2026-05-01
- Pedido feito: restaurar novamente o fluxo legado de imagem de produto usando o repositório configurado no Master e fechar a trilha de logs do upload.
- Arquivos alterados:
  - `server.rb`
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: tornar a rota de upload compatível com a configuração do tenant no Master, aceitar upload multipart com arquivo real e registrar logs claros de tenant, produto, repositório e URL gerada.
- Impacto esperado: o botão de imagem volta a publicar a foto no repositório da loja, preencher a URL automaticamente e mostrar logs úteis caso a publicação falhe.
- Pendências: reiniciar o backend local em `3000` e validar o upload no navegador com a instância atualizada.

## 2026-05-01
- Pedido feito: restaurar o fluxo legado de upload de imagem de produto usando o repositório GitHub configurado no Master para o tenant atual.
- Arquivos alterados:
  - `server.rb`
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: fazer o botão de imagem voltar a publicar no repositório da loja, gerar URL `raw.githubusercontent.com` automaticamente e preencher o campo de imagem sem depender de Firebase Storage.
- Impacto esperado: o upload legado volta a funcionar via backend local com resolução do repositório do tenant no Master, retorno da URL final e atualização do preview/campo de imagem no produto.
- Pendências: reiniciar o backend local em `3000` e validar o upload no navegador com a instância atualizada.

## 2026-05-01
- Pedido feito: corrigir o erro 404 da rota legada de upload de imagem de produto no backend local.
- Arquivos alterados:
  - `server.rb`
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: garantir que o backend local responda ao upload legado em `/api/master/product-image/upload` e aceitar aliases legados caso o frontend ainda encontre uma rota antiga em execução.
- Impacto esperado: o upload legado passa a encontrar rota válida, devolver a URL `raw.githubusercontent.com` e preencher automaticamente o campo de imagem no produto sem cair no fallback 404.
- Pendências: reiniciar o backend local em `3000` e validar o upload no navegador com a instância atualizada.

## 2026-05-01
- Pedido feito: criar a área interna `Backup do Sistema` no Master para verificar alterações locais e enviar backup do código para GitHub privado.
- Arquivos alterados:
  - `master.html`
  - `server.rb`
  - `.gitignore`
  - `FEATURE_INDEX.md`
  - `DEPENDENCY_MAP.md`
  - `AI_CHANGELOG.md`
- Motivo da alteração: permitir backup interno do código via Master, com comandos Git executados somente no backend/local server e sem expor credenciais no frontend.
- Impacto esperado: o Master passa a ver status do Git local, listar arquivos alterados e enviar backup do código para um repositório privado configurado.
- Pendências: validar o push real com repositório privado e token configurado no servidor.

## 2026-05-08
- Pedido feito: fazer o carrinho e a pílula principal respeitarem os horários configurados em `Horários e status`.
- Arquivos alterados:
  - `index.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: normalizar a leitura dos horários no template público para usar a ordem salva no Admin e evitar desencontro entre a configuração diária e o status/slots exibidos ao cliente.
- Impacto esperado: o status da loja e a seleção de horários no carrinho passam a refletir corretamente os períodos configurados, inclusive quando o template salva os dias em ordem diferente da indexação nativa do navegador.

## 2026-05-08
- Pedido feito: trocar o texto de status fechado do card principal por uma chamada para pedido programado, mantendo o vermelho.
- Arquivos alterados:
  - `index.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: tornar o estado fechado mais comercial no topo da loja, sem perder o destaque visual em vermelho.
- Impacto esperado: quando a loja estiver fechada, o card principal passa a sugerir pedido programado em vez de exibir apenas `Fechado`/`Cerrado`.

## 2026-05-08
- Pedido feito: adicionar seletor de país com bandeira nos campos de WhatsApp e Telefone e usar o valor internacional normalizado nos links públicos.
- Arquivos alterados:
  - `js/modules/catalogo.js`
  - `index.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: permitir edição mais clara de números internacionais no Admin e gerar links corretos para WhatsApp e ligação no template público.
- Impacto esperado: o Admin passa a mostrar país + código + número local, enquanto a loja pública abre WhatsApp/telefone com o número internacional limpo e sem caracteres extras.

## 2026-05-08
- Pedido feito: remover área de entrega, instruções de retirada e toggle de exibição do endereço no card `Endereço`, adicionando o campo `bairro`.
- Arquivos alterados:
  - `js/modules/catalogo.js`
  - `index.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: simplificar a seção de endereço para focar na localização pública, sem perder compatibilidade com os dados já salvos.
- Impacto esperado: o Admin passa a exibir `Bairro` no lugar dos campos removidos e o template público passa a considerar o bairro nos textos de endereço e no rodapé.

## 2026-05-08
- Pedido feito: remover também o campo `Link do Google Maps` da seção `Endereço` e fazer a pílula de retirada usar o bairro como complemento.
- Arquivos alterados:
  - `js/modules/catalogo.js`
  - `index.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: limpar ainda mais o card de endereço no Admin e deixar a pílula pública de retirada mais coerente com o bairro configurado.
- Impacto esperado: o campo de Google Maps some da interface do Admin, o valor antigo é preservado por compatibilidade e a pílula do topo passa a exibir algo como `Recogida en BAIRRO`.

## 2026-05-08
- Pedido feito: criar o card `Zonas de entrega` no Template da loja e conectar zonas por CEP ao chip público e ao carrinho.
- Arquivos alterados:
  - `js/modules/catalogo.js`
  - `index.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: permitir cadastro de zonas com CEPs e frete por zona, refletindo isso no template público e no cálculo do pedido.
- Impacto esperado: o Admin passa a salvar zonas de entrega com CEPs e valor por zona; o chip público usa a menor faixa ativa; o carrinho aplica o frete conforme o CEP informado e bloqueia entrega fora de cobertura.

## 2026-05-08
- Pedido feito: corrigir a abertura do `Template da loja`, que ficava preso em `Carregando...`.
- Arquivos alterados:
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: remover a dependência do helper de telefone do template público dentro do Admin, que impedia a renderização da seção.
- Impacto esperado: a aba `Template da loja` volta a abrir normalmente no Admin e os campos de contato com seletor de país permanecem funcionais.

## 2026-05-09
- Pedido feito: trazer os filtros anteriores de `Cardápio > Produtos`, removendo `Lista`, `Grade` e `Mais filtros`, e deixar a busca responder sem atraso.
- Arquivos alterados:
  - `js/modules/catalogo.js`
- Motivo da alteração: restaurar os filtros completos na barra principal e simplificar a interação da busca.
- Impacto esperado: a página volta a exibir os filtros tradicionais, com botão de limpar filtro, sem os controles de visualização extra.

## 2026-05-09
- Pedido feito: polir a tela `Cardápio > Produtos` comparando o layout atual com o template premium aprovado.
- Arquivos alterados:
  - `js/modules/catalogo.js`
  - `admin.html`
- Motivo da alteração: corrigir ícones e métricas, simplificar sidebar e rodapé, refinar filtros e dar acabamento visual mais próximo do template.
- Impacto esperado: a tela fica mais premium, com métricas limpas, sidebar mais leve, ajuda discreta e tabela/filtros mais consistentes.

## 2026-05-09
- Pedido feito: corrigir ícones quebrados, refinar os cards de métricas e reorganizar o rodapé da sidebar na tela `Cardápio > Produtos`.
- Arquivos alterados:
  - `js/modules/catalogo.js`
  - `admin.html`
- Motivo da alteração: substituir nomes técnicos de ícones por SVG inline, reduzir o peso visual da sidebar e melhorar a leitura do bloco de loja e do card de ajuda.
- Impacto esperado: os cards de métricas deixam de exibir texto fantasma, a sidebar fica mais elegante e o rodapé passa a mostrar loja, usuário, status e ajuda de forma compacta.

## 2026-05-09
- Pedido feito: refinar visualmente a tela `Cardápio > Produtos` para reduzir aparência de ERP antigo e aproximar de SaaS premium moderno.
- Arquivos alterados:
  - `js/modules/catalogo.js`
  - `admin.html`
- Motivo da alteração: polir a sidebar, o topo, os cards de métricas, os filtros e a tabela, removendo excesso de peso visual e a ajuda duplicada abaixo da listagem.
- Impacto esperado: a tela fica mais limpa, adulta e sofisticada, com menos vermelho, menos caixas e uma hierarquia visual mais leve.

## 2026-05-09
- Pedido feito: corrigir a tela `Cardápio > Produtos` que estava presa em `Carregando`.
- Arquivos alterados:
  - `js/modules/catalogo.js`
- Motivo da alteração: um `ReferenceError` no render da lista impedia a tela de terminar de montar.
- Impacto esperado: a página volta a abrir normalmente, mantendo a lista premium, filtros, paginação e ações de produto.

## 2026-05-09
- Pedido feito: refazer a tela `Cardápio > Produtos` para aproximar do mockup premium e tornar a lista/tabela o modo principal.
- Arquivos alterados:
  - `js/modules/catalogo.js`
- Motivo da alteração: reduzir a sensação de cadastro/ERP, deixar a tela mais leve e funcional e adicionar as ações `Importar produtos` e `Duplicar`.
- Impacto esperado: a página passa a abrir em lista premium com métricas, filtros compactos, paginação e ações discretas, mantendo o modo grade como opção secundária.

## 2026-05-09
- Pedido feito: remover `Google Maps` e `Google Business Profile` do resumo somente leitura do card `SEO local`.
- Arquivos alterados:
  - `js/modules/catalogo.js`
- Motivo da alteração: deixar o card mais limpo e evitar duplicidade com os dados editáveis do restante do fluxo.
- Impacto esperado: o resumo mostra apenas endereço, telefone e WhatsApp, mantendo o restante do card sem mudança funcional.

## 2026-05-09
- Pedido feito: criar o arquivo `BOCAFOOD_DESIGN_SYSTEM.md` na raiz do projeto.
- Arquivos alterados:
  - `BOCAFOOD_DESIGN_SYSTEM.md`
  - `AI_CHANGELOG.md`
- Motivo da alteração: documentar o padrão oficial de layout e identidade visual do BocaFood Admin para orientar futuras mudanças.
- Impacto esperado: nenhuma tela foi alterada; o projeto passa a ter uma referência visual centralizada para decisões de UI.

## 2026-05-09
- Pedido feito: aplicar o padrão visual do `Template_bocafood` na tela de `Produtos` e mostrar a contagem de pedidos em aberto no menu `Pedidos`.
- Arquivos alterados:
  - `js/modules/catalogo.js`
  - `admin.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: aproximar a experiência do admin ao padrão do template, com perfil/negócio no topo, sino com pedidos em aberto, filtros com ordenação e paginação, cards mais consistentes e ajuda no rodapé.
- Impacto esperado: a tela de produtos passa a ter estrutura mais próxima do template visual e o menu `Pedidos` mostra a quantidade de pedidos abertos em tempo real.

## 2026-05-09
- Pedido feito: refinar a tela de `Produtos` para ficar mais próxima da vitrine do template público.
- Arquivos alterados:
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: trocar a listagem em formato de linha por cards verticais mais visuais e reduzir a densidade dos blocos de suporte.
- Impacto esperado: os produtos passam a ser exibidos em cards de vitrine mais próximos da linguagem visual do template, mantendo a edição inline e a paginação.

## 2026-05-09
- Pedido feito: ajustar a tela de `Produtos` no módulo `Cardápio` com base no `BOCAFOOD_DESIGN_SYSTEM`.
- Arquivos alterados:
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: alinhar a listagem de produtos ao padrão visual oficial, com topo mais limpo, filtros em card branco e cards de produto mais consistentes.
- Impacto esperado: a tela de produtos fica mais premium e legível, sem mudar a lógica de edição, busca, filtro ou ordenação.

## 2026-05-09
- Pedido feito: refinar a tela `Cardápio > Produtos` para aumentar contraste controlado, remover o bloco de loja da sidebar e trazer os dados da loja para o topo direito.
- Arquivos alterados:
  - `admin.html`
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: dar mais presença visual à tela sem mudar a estrutura funcional, reforçando métricas, cabeçalho, filtros e tabela.
- Impacto esperado: a página passa a parecer menos frágil/apagada, com sidebar mais limpa, identidade da loja no topo e listagem com acabamento mais premium.

## 2026-05-09
- Pedido feito: refinar o acabamento visual da tela `Produtos` com fundo cinza azulado premium, KPIs mais fortes, filtros em barra e tabela mais elegante.
- Arquivos alterados:
  - `admin.html`
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: elevar a sensação de produto SaaS maduro com micro UI, contraste controlado e superfícies mais sólidas.
- Impacto esperado: a tela ganha mais presença, melhora a leitura dos cards e filtros, e reduz a aparência de painel administrativo genérico sem mexer na lógica.

## 2026-05-09
- Pedido feito: fazer o polimento final da tela `Cardápio > Produtos` sem mudar a estrutura geral.
- Arquivos alterados:
  - `admin.html`
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: ajustar micro UI, profundidade, tipografia, botões, sidebar, KPIs, filtros e tabela para uma leitura mais premium.
- Impacto esperado: a tela fica mais madura, sólida e refinada, com acabamento mais próximo de um SaaS premium tipo Nuvemshop/Tiny.

## 2026-05-09
- Pedido feito: refinar a identidade visual global do painel BocaFood com tipografia Manrope, paleta off-white quente e sensação food-tech premium.
- Arquivos alterados:
  - `admin.html`
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: sair da aparência SaaS genérica/fria e aproximar o painel de uma marca gastronômica premium, com mais calor humano e refinamento.
- Impacto esperado: o painel passa a ter uma base visual mais acolhedora e sofisticada, mantendo a estrutura e a lógica intactas.

## 2026-05-09
- Pedido feito: manter a fonte Manrope e ajustar apenas a paleta, contraste, bordas, chips, filtros e botões para reduzir o bege apagado.
- Arquivos alterados:
  - `admin.html`
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: aumentar a limpeza visual e o contraste sem perder o calor premium da base off-white.
- Impacto esperado: a interface fica mais clara, mais refinada e menos envelhecida, com cards e chips majoritariamente brancos e bordas neutras.

## 2026-05-09
- Pedido feito: aplicar os ajustes finais em `Cardápio > Produtos` com fundo branco/quase branco, cards com sombra premium e cabeçalho da tabela em branco com títulos maiúsculos.
- Arquivos alterados:
  - `admin.html`
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: terminar o polimento visual com maior contraste, superfícies brancas e leitura de tabela mais limpa, sem alterar estrutura ou lógica.
- Impacto esperado: a tela fica mais luminosa e premium, com KPIs, filtros e tabela mais sólidos, e o cabeçalho da tabela ganha leitura mais editorial e refinada.

## 2026-05-09
- Pedido feito: alinhar bordas e linhas ao cinza-azulado usado nos textos secundários.
- Arquivos alterados:
  - `admin.html`
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: unificar o tratamento de bordas, divisórias e separadores com uma leitura mais coerente e tech, sem mexer na fonte nem na estrutura.
- Impacto esperado: a interface ganha linhas e contornos mais consistentes com a paleta de suporte, deixando o conjunto mais limpo e mais sofisticado.

## 2026-05-09
- Pedido feito: escurecer um pouco mais as bordas e linhas e colocar os cards em off-white.
- Arquivos alterados:
  - `admin.html`
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: reforçar contraste de contornos usando o mesmo eixo cinza-azulado da tipografia secundária e dar mais presença às superfícies dos cards.
- Impacto esperado: os cards passam a ter leitura off-white e as linhas ficam mais sólidas, sem perder a leveza do painel.

## 2026-05-09
- Pedido feito: colocar as linhas em preto e deixar o card de filtros com fundo branco.
- Arquivos alterados:
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: aumentar o contraste das separações visuais da tela de produtos e simplificar o card de filtros para branco puro.
- Impacto esperado: a listagem fica mais marcada e o filtro ganha leitura mais limpa, sem mexer na lógica da página.

## 2026-05-09
- Pedido feito: trocar as linhas para vermelho clarinho.
- Arquivos alterados:
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: suavizar a leitura visual depois do contraste escuro e retornar as divisórias para um acento BocaFood mais leve.
- Impacto esperado: a tela volta a ficar mais coerente com a identidade do painel, com linhas suaves e menos agressivas.

## 2026-05-09
- Pedido feito: remover o off-white dos cards e deixar o card de filtros branco.
- Arquivos alterados:
  - `admin.html`
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: limpar as superfícies principais da interface e manter o foco em branco puro, com bordas suaves em vermelho claro.
- Impacto esperado: a tela ganha leitura mais limpa e luminosa, sem o tom off-white nas áreas principais.

## 2026-05-09
- Pedido feito: voltar para branco e trocar apenas as bordas para off-white suave.
- Arquivos alterados:
  - `admin.html`
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: restaurar a superfície branca original e aplicar apenas contornos discretos em off-white, como antes do desvio para contraste pesado.
- Impacto esperado: a tela volta a ficar leve e limpa, com cards brancos e bordas suaves sem o peso visual do off-white nas superfícies.

## 2026-05-09
- Pedido feito: deixar os cards KPI em off-white e aumentar a presença visual dos ícones.
- Arquivos alterados:
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: reforçar a leitura das métricas sem alterar a estrutura geral da página.
- Impacto esperado: os KPIs ficam mais destacados, com ícones maiores e superfícies off-white mais consistentes com o pedido.

## 2026-05-09
- Pedido feito: tirar a borda do card de filtros.
- Arquivos alterados:
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: simplificar o card de filtros mantendo apenas a sombra e o conteúdo interno.
- Impacto esperado: o filtro fica mais leve visualmente e menos encaixotado, sem mudar a usabilidade.

## 2026-05-09
- Pedido feito: tirar a borda dos cards KPI.
- Arquivos alterados:
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: deixar os cards de métricas mais leves e integrados ao conjunto visual, sem borda externa.
- Impacto esperado: os KPIs ficam com leitura mais fluida e menos caixa, mantendo a sombra e a hierarquia.

## 2026-05-09
- Pedido feito: trocar os elementos gráficos dos KPIs por outros mais relevantes e deixá-los transparentes.
- Arquivos alterados:
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: melhorar a correspondência visual entre ícone e métrica, e remover qualquer caixa visual atrás do gráfico.
- Impacto esperado: os KPIs ficam mais claros e expressivos, com gráficos maiores, transparentes e mais ligados ao significado de cada número.

## 2026-05-09
- Pedido feito: deixar as bordas das pilulas da listagem de produtos na mesma cor do nome do produto.
- Arquivos alterados:
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: alinhar os chips da tabela ao tom preto usado no nome do produto, mantendo a leitura mais coesa.
- Impacto esperado: as pilulas da listagem ficam visualmente conectadas ao título do produto, com bordas mais consistentes.

## 2026-05-09
- Pedido feito: deixar a cor das bordas das pilulas um pouco mais leve.
- Arquivos alterados:
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: suavizar o contraste dos chips sem perder a coerência com o nome do produto.
- Impacto esperado: as pilulas ficam menos pesadas e mais próximas de uma leitura premium e limpa.

## 2026-05-09
- Pedido feito: reescrever completamente `BOCAFOOD_DESIGN_SYSTEM.md` com a nova definição oficial do design system.
- Arquivos alterados:
  - `BOCAFOOD_DESIGN_SYSTEM.md`
  - `AI_CHANGELOG.md`
- Motivo da alteração: substituir o documento antigo por uma referência única, limpa e coerente para identidade visual, tipografia, paleta e layout do BocaFood.
- Impacto esperado: o arquivo passa a ser a fonte oficial dos padrões visuais do projeto, sem regras conflitantes antigas.

## 2026-05-09
- Pedido feito: fazer a aba `SEO da loja` seguir o mesmo padrão visual da aba `Produtos`.
- Arquivos alterados:
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: alinhar topo, cards, previews, status e botões do SEO ao mesmo sistema visual premium usado em Produtos.
- Impacto esperado: a aba SEO passa a ter superfícies, contraste, densidade e linguagem visual consistentes com o restante do módulo Cardápio.

## 2026-05-09
- Pedido feito: aplicar o mesmo padrão visual de `Produtos` em `Configurações` no módulo `Cardápio`.
- Arquivos alterados:
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: alinhar a tela de Configurações, as listagens de categorias/variantes/tags e os modais ao sistema visual premium já adotado em Produtos.
- Impacto esperado: a aba Configurações ganha topo, cards, botões, chips e listagens com a mesma densidade e acabamento do restante do módulo.

## 2026-05-09
- Pedido feito: levar o mesmo padrão visual do módulo `Cardápio` para o módulo `Produção`.
- Arquivos alterados:
  - `js/modules/receitas.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: alinhar a tela de Produção, as configurações auxiliares e os modais ao mesmo acabamento premium, limpo e coerente já aplicado em Cardápio.
- Impacto esperado: Produção passa a ter topo, cards, listas, botões e modais com a mesma linguagem visual do restante do sistema.

## 2026-05-09
- Pedido feito: no modal `Editar Produto`, deixar os cards internos com fundo branco, sem borda, com sombra, e remover o texto `Venda`.
- Arquivos alterados:
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: aproximar o modal de produto do padrão premium do sistema, reduzindo peso visual e removendo o rótulo de seção que já não era necessário.
- Impacto esperado: o modal fica mais limpo, coerente e com cards brancos destacados por sombra suave.

## 2026-05-09
- Pedido feito: corrigir a busca de produtos para permitir digitar a palavra inteira sem travar.
- Arquivos alterados:
  - `js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: a busca estava re-renderizando a tela a cada tecla e quebrando a digitação contínua.
- Impacto esperado: a busca passa a aceitar digitação fluida, com atualização em debounce e preservação do campo.

## 2026-05-10
- Pedido feito: transformar o mockup premium mobile no template público real da loja, reaproveitando carrinho, modal de produto e checkout existentes.
- Arquivos alterados:
  - `index.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: conectar o novo visual aos campos já existentes de Template da Loja, Programa de Pontos, Promoções, Categorias, Produtos, Avaliações e Rodapé sem alterar a lógica de pedidos.
- Impacto esperado: o template público mobile passa a usar capa, logo, cor da marca, status, entrega/retirada, banner promocional, CTA de fidelidade, categorias por âncora, produtos agrupados e rodapé social em um layout mais premium e orientado à conversão.

## 2026-05-10
- Pedido feito: criar a versão desktop do template público com base no novo template mobile, mantendo o carrinho fixo na página.
- Arquivos alterados:
  - `index.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: levar a mesma composição premium do mobile para desktop, com hero de capa, card da loja, banner promocional, programa de pontos, destaque, categorias e lista de produtos em layout amplo.
- Impacto esperado: a loja pública no desktop passa a ter visual coerente com o mobile premium e mantém o carrinho em coluna fixa/sticky para compra rápida.

## 2026-05-10
- Pedido feito: criar uma nova versão mobile fiel ao preview aprovado `preview-template-premium.html#phone-preview`, preservando o template público já criado.
- Arquivos alterados:
  - `template-mobile-premium-fiel.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: manter uma base visual separada e fiel ao mockup aprovado para validação antes de integrar novamente ao template público real.
- Impacto esperado: o template atual permanece preservado e há um novo arquivo de referência mobile premium para comparação e próxima implementação.

## 2026-05-10
- Pedido feito: conectar o template mobile fiel aos campos reais do sistema.
- Arquivos alterados:
  - `template-mobile-premium-fiel.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: transformar o arquivo de mockup em uma base funcional que lê dados do tenant, mantendo o layout fiel e preservando o template público atual.
- Impacto esperado: o arquivo passa a carregar configurações da loja, produtos, categorias, promoções, programa de pontos, avaliações, redes sociais, carrinho, modal de produto e envio do pedido por WhatsApp.

## 2026-05-10
- Pedido feito: colocar o template mobile fiel conectado como template público.
- Arquivos alterados:
  - `index.html`
  - `index-template-publico-anterior.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: substituir a página pública pelo template mobile fiel aprovado, mantendo uma cópia do template público anterior para consulta/rollback.
- Impacto esperado: a URL pública passa a abrir o novo template mobile conectado aos dados do tenant, sem a moldura de preview, com carrinho fixo inferior, modal de produto e envio por WhatsApp.

## 2026-05-10
- Pedido feito: corrigir preview mobile que não atualizava ao trocar o tenant.
- Arquivos alterados:
  - `preview-template.html`
  - `index.html`
  - `template-mobile-premium-fiel.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: forçar recarregamento real do iframe com cache buster e aceitar variações de parâmetro de tenant.
- Impacto esperado: ao alterar o Tenant ID no preview mobile, o iframe passa a recarregar o template público com o tenant informado.

## 2026-05-10
- Pedido feito: investigar por que o preview com tenant `MZDs5MEb9gNbX4q5xdRYVgzlL252` mostrava fallback estático.
- Arquivos alterados:
  - `index.html`
  - `template-mobile-premium-fiel.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: o tenant do Master usa `...VgzlL252`, enquanto o seed legado usa `...VgzLL252`; o template agora tenta os dois IDs automaticamente.
- Impacto esperado: o preview e a loja pública deixam de cair no fallback quando os dados estiverem salvos no ID legado equivalente.

## 2026-05-10
- Pedido feito: criar um novo preview mobile para ver no desktop a versão mobile publicada.
- Arquivos alterados:
  - `preview-mobile-publico.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: oferecer uma prévia limpa que abre diretamente o `index.html` público dentro de uma moldura mobile, sem reaproveitar o preview antigo.
- Impacto esperado: fica mais fácil validar no desktop exatamente a versão mobile publicada da loja.

## 2026-05-10
- Pedido feito: corrigir conexão do Tenant ID no preview mobile público.
- Arquivos alterados:
  - `index.html`
  - `template-mobile-premium-fiel.html`
  - `firestore.rules`
  - `AI_CHANGELOG.md`
- Motivo da alteração: uma leitura de coleção pública sem regra, como `promotions`, podia falhar e derrubar todo o carregamento do tenant, fazendo a loja cair no conteúdo estático.
- Impacto esperado: o template passa a carregar config, produtos e categorias do tenant mesmo se uma coleção opcional falhar; promoções também ficam liberadas para leitura pública no template.

## 2026-05-10
- Pedido feito: impedir que letras e números usem a cor da marca no template público.
- Arquivos alterados:
  - `index.html`
  - `template-mobile-premium-fiel.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: manter textos, preços, badges, links e números em preto/neutro, deixando a cor da marca apenas para fundos, bordas e elementos visuais.
- Impacto esperado: ao trocar a cor da marca, o template preserva legibilidade e sofisticação sem tingir textos com a cor configurada.

## 2026-05-10
- Pedido feito: deixar o selo verificado azul e inserir estrela ao lado da nota de avaliação.
- Arquivos alterados:
  - `index.html`
  - `template-mobile-premium-fiel.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: separar ícones informativos da cor da marca, mantendo verificado em azul e avaliação com estrela dourada.
- Impacto esperado: a primeira dobra comunica verificação e nota com leitura mais clara, sem alterar textos, números ou lógica do tenant.

## 2026-05-10
- Pedido feito: aplicar regra de contraste para letras e símbolos sobre fundos claros e escuros.
- Arquivos alterados:
  - `index.html`
  - `template-mobile-premium-fiel.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: textos e ícones sobre fundos escuros ou de marca devem ficar legíveis; sobre fundos claros devem permanecer pretos.
- Impacto esperado: botões, carrinho, CTAs e elementos com fundo de marca passam a usar contraste automático, sem tingir texto com a cor da marca.

## 2026-05-10
- Pedido feito: trazer para o novo template o layout de carrinho usado no template público anterior.
- Arquivos alterados:
  - `index.html`
  - `template-mobile-premium-fiel.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: reaproveitar o padrão visual do carrinho antigo, com cabeçalho, lista compacta, subtotal/total e botão grande de envio pelo WhatsApp.
- Impacto esperado: o carrinho do template novo fica mais próximo do layout anterior, preservando a lógica atual de adicionar, alterar quantidade, remover item e enviar pedido pelo WhatsApp.

## 2026-05-10
- Pedido feito: trazer também a lógica do carrinho anterior, não apenas o layout.
- Arquivos alterados:
  - `index.html`
  - `template-mobile-premium-fiel.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: o carrinho precisava voltar a operar como checkout/resumo, com retirada/entrega, dados do cliente, endereço, pagamento, observação, cupom, desconto, taxa de entrega, total final, validações e gravação do pedido.
- Impacto esperado: o template novo preserva o visual aprovado e passa a ter uma lógica de carrinho mais próxima do template público anterior, mantendo envio pelo WhatsApp e salvamento em `tenants/{tenantId}/orders`.

## 2026-05-11
- Pedido feito: deixar o carrinho/fechamento mais premium e completar lógicas do pedido.
- Arquivos alterados:
  - `index.html`
  - `template-mobile-premium-fiel.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: o carrinho anterior ainda estava simples demais e faltavam regras importantes de fechamento, como seleção de horário, zona de entrega, código postal, taxa dinâmica, pedido mínimo, pagamento e capacidade por horário.
- Impacto esperado: o checkout do template novo fica organizado em blocos premium e passa a calcular entrega por zona, validar código postal/endereço, exigir horário de retirada/entrega, preencher métodos de pagamento, aplicar cupom e salvar dados de agenda no pedido.

## 2026-05-11
- Pedido feito: melhorar o design do carrinho/fechamento do pedido.
- Arquivos alterados:
  - `index.html`
  - `template-mobile-premium-fiel.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: deixar o bottom sheet, blocos do checkout, campos, itens, resumo e CTA final com aparência mais premium, leve e sofisticada.
- Impacto esperado: o carrinho mantém toda a lógica recém-conectada, mas com hierarquia visual melhor, menos aparência de formulário pesado e mais acabamento.

## 2026-05-11
- Pedido feito: trazer a lógica, estrutura e design do modal de produto antigo para o novo template.
- Arquivos alterados:
  - `index.html`
  - `template-mobile-premium-fiel.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: o modal novo ainda estava simples e não respeitava variações, complementos/adicionais, preço ao vivo e composição das escolhas no pedido.
- Impacto esperado: o modal de produto passa a ter imagem/fallback, badge, descrição completa, preço atualizado, variações obrigatórias, adicionais sugeridos, avaliações do produto, observação e envio das escolhas para carrinho, WhatsApp e pedido salvo.

## 2026-05-11
- Pedido feito: criar um template desktop novo inspirado no mobile aprovado.
- Arquivos alterados:
  - `index.html`
  - `template-mobile-premium-fiel.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: o template público ainda se comportava como um celular centralizado no desktop, sem uma experiência própria para tela grande.
- Impacto esperado: em desktop, a loja passa a usar hero amplo, vitrine em colunas, categorias sticky, produtos em grade refinada, modal de produto em duas colunas e carrinho fixo lateral, preservando o layout mobile e a lógica atual de pedido.

## 2026-05-11
- Pedido feito: manter 2 produtos por linha no template desktop.
- Arquivos alterados:
  - `index.html`
  - `template-mobile-premium-fiel.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: a grade desktop abria para 3 colunas em telas largas, deixando os cards de produto mais apertados.
- Impacto esperado: a vitrine desktop mantém 2 produtos por linha em telas grandes, com melhor leitura e mais destaque para imagem, nome e preço.

## 2026-05-11
- Pedido feito: deixar o fundo do template desktop branco.
- Arquivos alterados:
  - `index.html`
  - `template-mobile-premium-fiel.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: remover o fundo com gradientes no desktop para uma leitura mais limpa.
- Impacto esperado: a página desktop usa fundo branco, mantendo a hierarquia dos cards, sombras e vitrine.

## 2026-05-11
- Pedido feito: criar um relatório técnico dos dados disponíveis para futura criação do módulo Temporadas / Missões Operacionais.
- Arquivos alterados:
  - `DATA_MAP_FOR_SEASONS.md`
  - `AI_CHANGELOG.md`
- Motivo da alteração: mapear módulos, coleções, campos e métricas já disponíveis no BocaFood para entender o que pode ser calculado automaticamente sem alimentação manual.
- Impacto esperado: o novo relatório serve como base técnica para decidir quais temporadas/missões podem ser criadas com dados reais e quais eventos/campos ainda precisam ser padronizados.

## 2026-05-11
- Pedido feito: implementar a Fase 5 do módulo Temporadas / Missões Operacionais.
- Arquivos alterados:
  - `js/modules/temporadas.js`
  - `css/modules/temporadas.css`
  - `AI_CHANGELOG.md`
- Motivo da alteração: calcular progresso, score, status atual e risco da temporada ativa usando dados reais de pedidos do tenant, sem implementar snapshots, IA ou painel avançado.
- Impacto esperado: a temporada ativa passa a exibir e persistir progresso, score de 0 a 100, status operacional, risco atual e valor atual vs meta, mantendo isolamento por tenant, excluindo pedidos cancelados dos cálculos e limitando a consulta principal ao intervalo necessário da temporada/baseline quando o wrapper `DB.col` está disponível.

## 2026-05-11
- Pedido feito: implementar a Fase 7 do módulo Temporadas / Missões Operacionais.
- Arquivos alterados:
  - `js/modules/temporadas.js`
  - `css/modules/temporadas.css`
  - `AI_CHANGELOG.md`
- Motivo da alteração: criar snapshots automáticos diários e semanais em `season_metrics_snapshots` ao abrir a temporada ativa, evitando duplicação para o mesmo `seasonId`, tipo e data.
- Impacto esperado: o módulo passa a salvar score, progresso, status, risco, métricas principais, métricas auxiliares, confiança e alertas simples para análises futuras, além de exibir no card ativo a última atualização e a existência das análises diária/semanal.

## 2026-05-11
- Pedido feito: implementar a Fase 8 do módulo Temporadas / Missões Operacionais.
- Arquivos alterados:
  - `js/modules/temporadas.js`
  - `css/modules/temporadas.css`
  - `AI_CHANGELOG.md`
- Motivo da alteração: permitir encerrar oficialmente uma temporada ativa, calculando resultado final, classificação, resumo estratégico simples e snapshot `final`.
- Impacto esperado: temporadas ativas podem ser finalizadas com `finalResult`, `finalScore`, `finalProgressPercent`, `finalMetrics`, `finalSummary` e `finishedAt`, passam ao histórico como `finished` e podem ter o Resultado Final aberto pelo histórico sem permitir edição retroativa.

## 2026-05-11
- Pedido feito: implementar a Fase 9 do módulo Temporadas / Missões Operacionais: Copiloto de Ação com IA preparado para OpenAI.
- Arquivos alterados:
  - `admin.html`
  - `js/services/seasons.ai.js`
  - `js/modules/temporadas.js`
  - `css/modules/temporadas.css`
  - `server.rb`
  - `AI_CHANGELOG.md`
- Motivo da alteração: preparar a camada de recomendação prática para usar contexto agregado da temporada, sem deixar IA calcular score, meta, risco ou progresso e sem expor chave da OpenAI no frontend.
- Impacto esperado: o painel passa a exibir o bloco `Próxima Jogada`, snapshots aceitam campos de recomendação IA, existe fallback local diário, contexto sanitizado sem dados pessoais e há endpoint server-side preparado para futura integração segura com OpenAI.

## 2026-05-11
- Pedido feito: incluir no cadastro manual de pedido o campo de hora para análise futura de horários de pico no módulo Temporadas.
- Arquivos alterados:
  - `js/modules/pedidos.js`
  - `js/modules/temporadas.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: registrar a hora real do pedido manual como dado analítico (`orderTime`, `saleTime`, `analyticsTime`, `analyticsHour`) e permitir que Temporadas consolide horários fortes de venda.
- Impacto esperado: pedidos criados manualmente passam a carregar hora de venda estruturada, e o módulo Temporadas consegue usar esse campo para identificar `strongHours` em métricas, snapshots e recomendações.

## 2026-05-11
- Pedido feito: reestruturar a experiência do Painel da Temporada para separar métricas do sistema, snapshots e recomendações da IA.
- Arquivos alterados:
  - `js/modules/temporadas.js`
  - `css/modules/temporadas.css`
  - `AI_CHANGELOG.md`
- Motivo da alteração: tornar o módulo Temporadas uma central operacional mais clara, com HUD fixo no topo, abas internas e hierarquia explícita entre dados calculados pelo BocaFood e orientação estratégica do Copiloto IA.
- Impacto esperado: a usuária passa a navegar entre `Visão Geral`, `Próxima Jogada` e `Análises`, entendendo separadamente estado atual, snapshots automáticos e recomendação prática, sem alterar cálculos, snapshots, endpoints ou regras de IA.

## 2026-05-11
- Pedido feito: criar uma subaba dentro de Temporadas para colocar a listagem de histórico.
- Arquivos alterados:
  - `js/modules/temporadas.js`
  - `css/modules/temporadas.css`
  - `AI_CHANGELOG.md`
- Motivo da alteração: mover o histórico de temporadas anteriores para uma aba interna do painel da temporada ativa, mantendo a navegação principal mais clara.
- Impacto esperado: o painel passa a ter a subaba `Histórico`, onde temporadas finalizadas ou abandonadas ficam listadas sem disputar espaço com a visão operacional atual.

## 2026-05-11
- Pedido feito: ajustar o Histórico para ficar dentro do menu Temporadas, e não dentro do Painel da Temporada, como na tela de Programa de Fidelidade.
- Arquivos alterados:
  - `js/modules/temporadas.js`
  - `css/modules/temporadas.css`
  - `AI_CHANGELOG.md`
- Motivo da alteração: transformar `Histórico` em subaba da tela principal de Temporadas, ao lado de `Temporada Atual`, removendo essa opção das abas internas do painel ativo.
- Impacto esperado: a usuária acessa o histórico no nível correto do módulo Temporadas, enquanto o Painel da Temporada mantém apenas abas operacionais da temporada ativa.

## 2026-05-11
- Pedido feito: ajustar a lógica de Status/Ritmo Atual e Risco/Chance de Falha no módulo Temporadas.
- Arquivos alterados:
  - `js/modules/temporadas.js`
  - `css/modules/temporadas.css`
  - `AI_CHANGELOG.md`
- Motivo da alteração: evitar que uma temporada recém-criada seja marcada como crítica apenas por ainda estar com progresso 0%, separando ritmo atual de chance de falha.
- Impacto esperado: `currentStatus` passa a comparar progresso real com progresso esperado para o momento da temporada, exibindo `Em início` nos primeiros dias sem dados suficientes, enquanto `riskLevel` preserva o risco inicial da meta e só considera atraso real depois da janela inicial.

## 2026-05-11
- Pedido feito: ajustar o fluxo de criação e organização das Temporadas com status programado, data de início, alertas e abas separadas.
- Arquivos alterados:
  - `js/modules/temporadas.js`
  - `css/modules/temporadas.css`
  - `SEASONS_ARCHITECTURE.md`
  - `SEASONS_SPEC.md`
  - `SEASONS_UI_FLOW.md`
  - `AI_CHANGELOG.md`
- Motivo da alteração: permitir temporadas futuras sem iniciar análises imediatamente, impedir sobreposição de períodos e separar visualmente temporadas ativas, programadas e anteriores.
- Impacto esperado: o módulo passa a suportar `scheduled`, data de início escolhida pela usuária, promoção automática ao abrir quando a data chegar, alertas informativos no resumo de criação e navegação superior `Ativa`, `Programadas` e `Histórico`.

## 2026-05-11
- Pedido feito: corrigir elementos gráficos da página Temporadas que apareciam como texto, por exemplo `track_changes`.
- Arquivos alterados:
  - `js/modules/temporadas.js`
  - `css/modules/temporadas.css`
  - `AI_CHANGELOG.md`
- Motivo da alteração: remover a dependência visual dos ícones do módulo Temporadas em relação à fonte externa Material Icons, que pode falhar e exibir o nome textual do ícone.
- Impacto esperado: Temporadas passa a renderizar ícones SVG locais no próprio módulo, evitando que nomes como `track_changes`, `add` ou `warning` apareçam como texto na interface.

## 2026-05-11
- Pedido feito: adicionar animação comemorativa ao Resultado Final da Temporada quando houver `Vitória Total`.
- Arquivos alterados:
  - `js/modules/temporadas.js`
  - `css/modules/temporadas.css`
  - `AI_CHANGELOG.md`
- Motivo da alteração: reforçar visualmente a conquista real quando a temporada atinge a meta final, sem alterar cálculo, score, snapshots ou IA.
- Impacto esperado: ao abrir o Resultado Final com `finalResult = Vitória Total`, o módulo dispara uma animação curta e não bloqueante de confete/estrelas/serpentinas, controlada em memória para não repetir indefinidamente.

## 2026-05-11
- Pedido feito: adicionar comemoração automática quando a meta da Temporada for atingida pela primeira vez, mesmo fora da tela Temporadas.
- Arquivos alterados:
  - `admin.html`
  - `js/core/router.js`
  - `js/modules/temporadas.js`
  - `css/modules/temporadas.css`
  - `SEASONS_ARCHITECTURE.md`
  - `AI_CHANGELOG.md`
- Motivo da alteração: registrar o marco de meta atingida em `seasons` e permitir que o Admin exiba uma comemoração global quando houver `goalCelebrationPending`.
- Impacto esperado: ao chegar em `progressPercent >= 100` pela primeira vez, a temporada ativa salva `goalReachedAt` e `goalCelebrationPending`; o Admin checa esse estado ao abrir/trocar módulos, exibe uma comemoração global com ação `Ver temporada` e marca `goalCelebrationShownAt` para não repetir.

## 2026-05-11
- Pedido feito: deixar as duas comemorações de Temporadas mais explosivas, festivas e com duração de até 5 segundos.
- Arquivos alterados:
  - `js/modules/temporadas.js`
  - `css/modules/temporadas.css`
  - `AI_CHANGELOG.md`
- Motivo da alteração: aumentar quantidade, variedade e presença visual dos elementos comemorativos tanto na meta atingida quanto na `Vitória Total`.
- Impacto esperado: as comemorações passam a usar mais partículas, estrelas, serpentinas, pontos e sparks com animação mais ampla e duração controlada em 5 segundos, mantendo `pointer-events` sem bloquear a interface.
## 2026-05-14
- Pedido feito: integrar o BocaFood com webhooks da Hotmart usando Firebase Cloud Functions e Firestore.
- Arquivos alterados:
  - `firebase.json`
  - `functions/package.json`
  - `functions/index.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: receber eventos da Hotmart, validar `X-HOTMART-HOTTOK`, registrar eventos brutos, normalizar assinatura/compra e atualizar billing de tenants ou pendencias por email.
- Impacto esperado: compras aprovadas, assinaturas ativas, atrasos, cancelamentos, reembolsos, chargebacks e trocas de plano passam a ter uma base automatizada para atualizar `hotmart_events`, `hotmart_subscriptions`, `billing_plan_mappings/hotmart`, `system_tenants/{uid}.billing` e `pending_hotmart_access`, sem apagar tenants e sem alterar layout, rotas do Admin ou regras visuais.

## 2026-05-14
- Pedido feito: gerar um mapeamento visual das conexoes do sistema BocaFood.
- Arquivos alterados:
  - `SISTEMA_BOCAFOOD_MAPA_CONEXOES.md`
  - `SISTEMA_BOCAFOOD_MAPA_CONEXOES.mmd`
  - `SISTEMA_BOCAFOOD_MAPA_CONEXOES.svg`
  - `AI_CHANGELOG.md`
- Motivo da alteração: documentar como Master, Admin, template publico, Firebase, Storage, modulos operacionais, Temporadas, Maturidade e integracoes se conectam.
- Impacto esperado: facilitar revisao tecnica das dependencias do sistema antes de novas padronizacoes ou deploys, sem alterar codigo, layout, dados, Firebase, rotas ou permissoes.

## 2026-05-16
- Pedido feito: configurar os codigos reais das ofertas Hotmart para os planos internos do BocaFood.
- Arquivos alterados:
  - `functions/index.js`
  - `server.rb`
  - `AI_CHANGELOG.md`
- Motivo da alteração: mapear `data.purchase.offer.code` e o parametro `off=` para `starter`, `compromisso_anual` e `fundadoras`, preenchendo `billing.billingCycle`, espelhos no topo e dados de pendencia com trial correto.
- Impacto esperado: eventos Hotmart aprovados/ativos passam a gravar plano, ciclo, oferta e trial conforme as ofertas reais; o plano Fundadoras nao cria `trialEndsAt`, pois nao possui teste gratis.

## 2026-05-16
- Pedido feito: corrigir o mapeamento da oferta Hotmart `u7wyvsyn` de `starter` para `essencial`.
- Arquivos alterados:
  - `functions/index.js`
  - `server.rb`
  - `master.html`
  - `public/admin.html`
  - `public/js/modules/configuracoes.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: o BocaFood nao possui Plano Starter nesta fase; a oferta real corresponde ao Plano Essencial Mensal.
- Impacto esperado: novos eventos/reprocessamentos Hotmart gravam `planSlug: essencial`, `plan: essencial`, ciclo mensal e trial de 15 dias; registros antigos com `starter` continuam legiveis, mas sao exibidos/migrados como `Plano Essencial` ao atualizar.

## 2026-05-16
- Pedido feito: ajustar a edicao da aba Master Usuarios > Editar usuario > Plano e acesso conforme o provedor de cobranca.
- Arquivos alterados:
  - `AGENTS.md`
  - `master.html`
  - `server.rb`
  - `AI_CHANGELOG.md`
- Motivo da alteração: impedir que dados de plano/cobranca controlados pela Hotmart sejam sobrescritos manualmente pelo Master como se fossem cobranca manual.
- Impacto esperado: quando `billing.provider` for `hotmart`, plano, ciclo, status, trial, ativacao e cancelamento ficam somente leitura e o backend preserva os dados Hotmart; quando for `manual`, o Master pode editar esses campos e os espelhos do tenant sao atualizados.
- Compatibilidade: tenants antigos inferem provider visual por codigos Hotmart, origem manual/master ou ausencia de cobranca; valores antigos continuam legiveis sem migracao destrutiva.
- Logs: alteracoes manuais de provider, plano, ciclo, status de assinatura, trial, ativacao e cancelamento registram `system_access_logs`.

## 2026-05-16
- Pedido feito: limpar a aba Plano e acesso e ajustar exibicao/edicao de datas de cobranca.
- Arquivos alterados:
  - `master.html`
  - `server.rb`
  - `AI_CHANGELOG.md`
- Motivo da alteração: remover `Papel` da area de plano/cobranca e evitar exibicao crua de datas ISO nos campos de trial, ativacao e cancelamento.
- Impacto esperado: `Papel` fica junto dos dados da usuaria/acesso; `Fim do trial`, `Ativado em` e `Cancelado em` usam `datetime-local` quando a cobranca e manual e exibem leitura formatada `DD/MM/AAAA HH:mm` quando controlados pela Hotmart ou bloqueados.
- Compatibilidade: a interface trata strings ISO, timestamps Firebase, valores vazios e ausentes sem gerar datas falsas como 1970 ou data atual automatica.
- Logs: datas alteradas manualmente usam actions `billing_trial_changed`, `billing_activation_date_changed` e `billing_cancellation_date_changed`.

## 2026-05-16
- Pedido feito: ajustar a aba Hotmart do modal Master Usuarios > Editar usuario para suporte/auditoria.
- Arquivos alterados:
  - `master.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: remover placeholders que pareciam dados reais e deixar claro quando uma conta nao esta vinculada a Hotmart.
- Impacto esperado: campos Hotmart ficam sempre somente leitura, exibem estados como `Nao vinculado`, `Nao recebido` e `Aguardando evento da Hotmart`, e a aba mostra badge `Vinculado a Hotmart` apenas quando `billing.provider`/codigos Hotmart indicam vínculo.
- Mapeamento visual: `hotmartOfferCode` passa a exibir `u7wyvsyn — Plano Essencial`, `kah1d2ne — Plano Compromisso Anual` ou `woavlwrh — Plano Fundadoras`.
- Acoes: `Vincular compra Hotmart` e `Ver eventos Hotmart` permanecem funcionais; `Reprocessar vínculo` fica desabilitado como `Em desenvolvimento` para nao parecer acao clicavel sem implementacao.

## 2026-05-16
- Pedido feito: fazer pente fino na conexao dos campos Hotmart.
- Arquivos alterados:
  - `functions/index.js`
  - `server.rb`
  - `master.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: garantir que os campos exibidos na aba Hotmart venham de dados reais do webhook/vinculo e que textos visuais de estado vazio nao sejam salvos como codigos Hotmart.
- Impacto esperado: `billing.lastHotmartEventAt` passa a ser preenchido pelo webhook e pelo vinculo local; o Master usa valores crus em `dataset.rawValue` e nao grava `Nao vinculado`, `Nao recebido` ou labels formatados como dados reais.
- Campos auditados: `hotmartSubscriberCode`, `hotmartTransaction`, `hotmartProductId`, `hotmartOfferCode`, `purchaseStatus`, `subscriptionStatus` e `lastHotmartEventAt`.

## 2026-05-16
- Pedido feito: separar SEO tecnico no Master e SEO basico/comercial no Admin da usuaria.
- Arquivos alterados:
  - `AGENTS.md`
  - `master.html`
  - `server.rb`
  - `public/js/modules/catalogo.js`
  - `AI_CHANGELOG.md`
- Motivo da alteração: a usuaria nao deve editar campos tecnicos como meta robots, schema, sitemap, robots ou Search Console no Admin comum.
- Impacto esperado: a aba `SEO avançado` do Master passa a funcionar como painel tecnico/status, salvando em `system_tenants/{uid}.seo`; o Admin mantem apenas SEO basico/comercial da loja, como titulo, descricao, categoria/localidade e imagem de compartilhamento.
- Campos Master: `allowIndexing`, `metaRobots`, `schemaType`, `schemaCategory`, `sitemapEnabled`, `robotsEnabled`, `searchConsoleLinked` e `lastSeoPublishedAt`.
- Ajustes visuais: ultima publicacao SEO aparece formatada, schema fica como leitura tecnica padrao e sitemap/robots/Search Console aparecem com badges de status.

## 2026-05-16
- Pedido feito: ajustar a nomenclatura do Master para diferenciar contas, negocios, loja publica, usuarios da conta e clientes finais.
- Arquivos alterados:
  - `AGENTS.md`
  - `master.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: evitar que tenants/clientes BocaFood sejam chamados de "Usuarios", ja que cada conta podera ter varios usuarios internos no futuro.
- Impacto esperado: a area principal do Master passa a usar "Contas", a listagem usa labels de conta/negocio/responsavel e o modal passa a usar abas "Negocio", "Responsavel", "Plano e acesso", "Hotmart" e "SEO tecnico".
- Definicoes oficiais: Conta e o cliente BocaFood/tenant; Negocio e a operacao gastronomica; Loja publica e a vitrine publicada; Usuarios da conta sao pessoas com acesso ao Centro de Controle; Clientes da loja sao consumidores finais.
- Compatibilidade: nomes tecnicos, colecoes Firestore, `system_tenants`, `tenantUid`, `uid`, rotas e IDs internos foram mantidos sem migracao de dados.

## 2026-05-16
- Pedido feito: melhorar a listagem Master > Contas para ficar mais compacta e facil de escanear.
- Arquivos alterados:
  - `master.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: reduzir a altura de cada conta, organizar a hierarquia de informacoes e evitar que todas as acoes secundarias fiquem empilhadas na linha.
- Impacto esperado: a tabela de Contas BocaFood exibe colunas compactas para conta/negocio, responsavel, e-mail, plano, status da conta, status da loja, origem, ultimo acesso e acoes.
- Acoes: apenas `Ver`, `Editar` e `Mais ações` ficam visiveis; liberar acesso, bloquear, trocar plano, vincular Hotmart, logs e arquivar ficam dentro do menu secundario.
- Filtros: adicionados filtros de `Status da loja` e `Origem`, mantendo busca, plano, status da conta e assinatura.
- Badges: status da conta, loja e assinatura receberam labels amigaveis e cores consistentes.
- Paginacao: a listagem passa a mostrar 20 contas por pagina, com controles `Anterior` e `Próxima`.
- Segurança/escopo: a fonte da listagem continua sendo somente `system_tenants` validos; nao foram adicionadas consultas a clientes finais, pedidos, customers ou usuarios Firebase Auth sem tenant.

## 2026-05-16
- Pedido feito: limpar e reorganizar a aba Configuracoes do Master.
- Arquivos alterados:
  - `AGENTS.md`
  - `master.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: remover atalhos duplicados e fluxos legados da area principal de Configuracoes, mantendo apenas cards uteis para operacao atual.
- Impacto esperado: a aba Configuracoes mostra `Google Maps / Places`, `Diagnostico tecnico` e `Ferramentas tecnicas`.
- E-mails automaticos: o card duplicado foi ocultado porque ja existe aba propria no Master.
- Publicacao legada: `Publicar site` e `Publicar todos os sites` foram ocultados da interface principal como fluxo legado do modelo GitHub por tenant, sem remover o codigo.
- Templates: o card principal foi ocultado e seus controles ficaram agrupados em `Ferramentas tecnicas` como item legado/tecnico.
- Configuracoes globais: a edicao de JSON cru saiu do card principal e foi movida para `Ferramentas tecnicas`.
- Logs: `Logs e erros` foi renomeado para `Diagnostico tecnico`.
- Visual: os cards visiveis da aba Configuracoes ficam empilhados em coluna unica, centralizados, com largura maxima controlada e menor espaco entre cards.

## 2026-05-16
- Pedido feito: conectar gatilhos reais dos e-mails automaticos Hotmart usando SMTP salvo no Master.
- Arquivos alterados:
  - `functions/index.js`
  - `master.html`
  - `AI_CHANGELOG.md`
- Motivo da alteração: o webhook Hotmart nao deve depender apenas da colecao `mail`/fila para disparar e-mails automaticos.
- Impacto esperado: Functions passa a carregar `system_email_settings/default`, `system_private_email_secrets/default` e `system_email_templates/{templateKey}` para enviar e-mails por SMTP real.
- Gatilhos conectados: `welcome_hotmart` para compra aprovada sem tenant vinculado, `subscription_active` para compra/assinatura ativa com tenant vinculado, `payment_pending` para pagamento pendente/aguardando e `subscription_canceled` para cancelamento, reembolso ou chargeback.
- Deduplicacao: o envio usa chave baseada em `eventId + templateKey + buyerEmail` e nao reenvia quando ja existe `email_logs` com sucesso para a mesma chave.
- Logs: `email_logs` registra `to`, `templateKey`, `subject`, `status`, `source`, `eventId`, `tenantUid`, `error` e `createdAt`, sem HTML completo, payload Hotmart completo, senhas ou tokens.
- Compatibilidade: a colecao `mail` permanece apenas como fallback para `welcome_hotmart` quando o SMTP real falha, sem tratar `queued` como envio real.
- Master: a lista de templates passa a mostrar status de gatilho `Manual`, `Conectado` ou `Preparado, não conectado`; `password_reset` e `verify_email` continuam preparados, mas nao conectados.

## 2026-05-16
- Pedido feito: evoluir e-mails automaticos para gatilhos configuraveis por etiquetas inteligentes.
- Arquivos alterados:
  - `AGENTS.md`
  - `functions/index.js`
  - `server.rb`
  - `master.html`
  - `AI_CHANGELOG.md`
- Estrutura de tags: `system_tenants/{uid}.tags.{tagKey}` passa a suportar etiquetas leves com `active`, `addedAt`, `updatedAt`, `source`, `reason` e `metadata`.
- Helpers: criados `applyTenantTag`, `removeTenantTag` e `hasActiveTenantTag` nas Functions.
- Rotinas agendadas: adicionadas `dailyTenantTagCheck` e `dailyEmailTriggerCheck`, com agenda diaria em `Europe/Madrid`.
- Colecao nova: `system_email_triggers/{triggerKey}` guarda `tagKey`, `templateKey`, `enabled`, `delayHours`, `dedupeWindowDays`, `source`, `createdAt` e `updatedAt`.
- Gatilhos iniciais: `trial_ending_email`, `trial_expired_email`, `payment_pending_email`, `subscription_canceled_email` e `store_not_published_email`.
- Templates novos: `trial_ending`, `trial_ends_today`, `trial_expired` e `store_not_published`.
- Master: adicionada aba `Gatilhos` em E-mails automaticos para listar, criar, editar, ativar/desativar e configurar etiqueta, template, atraso e janela anti-duplicidade.
- Contas: o modal de edicao passa a mostrar `Etiquetas ativas` como badges somente leitura.
- Deduplicacao: `dailyEmailTriggerCheck` evita reenvio quando ja existe `email_logs` success para `tenantUid + triggerKey` dentro da janela configurada.
- Pendencias: a validacao de requisitos reais para `store_ready_to_publish` ainda usa campos resumidos em `system_tenants.store`; uma validacao mais profunda pode ser criada depois se for necessario ler categorias/produtos.

## 2026-05-17
- Pedido feito: criar no Master uma pagina com resumo visual das respostas do cadastro/onboarding.
- Arquivos alterados:
  - `master.html`
  - `AI_CHANGELOG.md`
- Motivo da alteracao: a visualizacao no modal da conta mostra respostas individuais, mas o Master tambem precisa enxergar tendencias gerais em formato de graficos/resumos.
- Impacto esperado: o Master passa a ter a aba `Resumo do cadastro`, com metricas e graficos de barras leves em CSS usando `businessProfile` das contas carregadas de `system_tenants`.
- Resumos exibidos: tipo de produto, modelo de atendimento, ritmo de vendas, canais de pedido, cardapio, controle de pedidos, estrutura de producao, capacidade diaria, equipe, custos, principal desafio, objetivo, fase do negocio e tempo disponivel.
- Escopo: nao foram criadas novas colecoes, rotas ou consultas; a tela reutiliza os dados ja carregados pela listagem de Contas e nao altera respostas do cadastro.

## 2026-05-17
- Pedido feito: validar e preparar a pagina de login do Centro de Controle.
- Arquivos alterados:
  - `public/admin.html`
  - `server.rb`
  - `firebase.json`
  - `AI_CHANGELOG.md`
- Motivo da alteracao: o login ja existia embutido no Admin, mas nao havia rota `/login` e a tela precisava ficar alinhada ao padrao visual atual do BocaFood.
- Impacto esperado: `/login` passa a abrir o mesmo login do Centro de Controle, com visual mais premium, opcao de entrar com Google, login por e-mail/senha, recuperacao de senha e link para primeiro acesso.
- Segurança/escopo: a autenticacao continua usando Firebase Auth e `Auth.init()`; nao foram alteradas regras de acesso, validacao de tenant, Hotmart ou estrutura de dados.
- Ajuste posterior: removido o link `Primeiro acesso` da tela de login para manter essa tela focada apenas em entrada e recuperacao de acesso.
- Ajuste posterior: removida a nota sobre e-mail da compra/suporte do rodape do login para deixar a tela mais limpa.
- Ajuste posterior: a tela de login passou a declarar explicitamente a mesma familia tipografica do cadastro (`Manrope`/`Inter`) no bloco de login e seus elementos internos.
- Ajuste posterior: aumentado o logo da tela de login e reduzido o espaco entre logo e texto seguinte.
- Ajuste posterior: revisada a copy da tela de login para focar no acesso ao Centro de Controle, com labels mais claras, placeholders, botao `Entrar no Centro de Controle`, divisor `ou entre com e-mail e senha`, link discreto para primeiro acesso e mensagens de erro mais especificas para e-mail inexistente, senha incorreta e Google nao vinculado.
- Ajuste posterior: reduzido levemente o logo e a sombra do botao principal, mantendo o card centralizado e o vermelho apenas nos pontos de acao.
- Ajuste posterior: removido o link/microcopy `Primeiro acesso? Criar acesso` da tela de login.
- Ajuste posterior: removido o titulo `Acesse seu Centro de Controle` da tela de login.
- Ajuste posterior: removido o subtitulo sobre entrar com o mesmo e-mail do cadastro da tela de login.

## 2026-05-17
- Pedido feito: transformar `Esqueci minha senha` em tela propria e ativar envio pelo backend/Firebase Admin.
- Arquivos alterados:
  - `public/admin.html`
  - `functions/index.js`
  - `master.html`
  - `server.rb`
  - `AI_CHANGELOG.md`
- Motivo da alteracao: o botao de recuperacao usava o e-mail nativo do Firebase no proprio login; agora deve abrir uma tela separada e enviar o template `password_reset` configurado no Master.
- Impacto esperado: ao clicar em `Esqueci minha senha`, o login alterna para uma tela de recuperacao; ao enviar o e-mail, a callable Function `requestPasswordResetEmail` gera um link via Firebase Admin e dispara o template SMTP `password_reset`.
- Segurança: o fluxo nao retorna senha, token ou detalhes tecnicos ao frontend; quando o e-mail nao existe, registra `email_logs` como `skipped` e retorna mensagem generica para evitar exposicao de contas.
- Master/Templates: `password_reset` passa a aparecer como `Conectado` e a descricao padrao foi atualizada para indicar envio real pelo login.
- Ajuste posterior: `requestPasswordResetEmail` agora faz fallback para o link padrao do Firebase Admin se a URL de retorno configurada nao estiver autorizada no Firebase Auth.
- Ajuste posterior: a tela de login mostra mensagem especifica quando a callable `requestPasswordResetEmail` ainda nao estiver publicada em Functions.
- Ajuste posterior: adicionada `.firebaseignore` para impedir que arquivos `.env`, backups e service accounts sejam empacotados em deploy.
- Ajuste posterior: o envio transacional `password_reset` deixou de ser pulado pelos toggles de automacao/template (`system_email_disabled` ou `template_disabled`); ele continua usando o SMTP salvo no Master e ainda falha de verdade se credenciais/configuracao SMTP estiverem incorretas.
- Diagnostico posterior: adicionados logs seguros em `requestPasswordResetEmail` para indicar se o usuario foi encontrado no Firebase Auth e qual foi o resultado SMTP, usando apenas hash do e-mail e sem expor senha, token ou credenciais.
- Ajuste posterior: a tela de recuperacao do Admin tambem aciona o reset nativo do Firebase Auth apos chamar a Function `requestPasswordResetEmail`, funcionando como fallback de entrega quando o SMTP customizado nao chega ao inbox.
- Ajuste posterior: o fallback nativo do Firebase Auth passou a ser condicional; a Function retorna `smtpSent`/`fallbackRequired` e o Admin so dispara o e-mail nativo quando o SMTP customizado nao envia ou foi pulado.
- Ajuste posterior: quando o Firebase Admin nao encontra o usuario no fluxo customizado, a Function retorna `fallbackRequired` sem expor a causa para a tela; o Admin pode acionar o fluxo nativo seguro do Firebase, que tambem nao revela se a conta existe.
- Diagnostico temporario: `requestPasswordResetEmail` passa a retornar `debugCode` e flags nao sensiveis de configuracao (`settingsFound`, `templateFound`, `smtpHostConfigured`, `smtpUserConfigured`, `smtpPasswordConfigured`) para diferenciar falha de Auth, template ou SMTP em producao.
- Ajuste posterior: `sendTestEmail` nas Functions deixou de apenas criar documento na colecao `mail` e passou a usar o mesmo helper SMTP real (`sendEmailFromTemplateViaSmtp`) usado por Hotmart, cadastro e gatilhos por etiqueta, validando o motor de envio automatico em producao.

## 2026-05-17
- Pedido feito: criar uma primeira versao de Master restrito publicado para diagnostico de producao.
- Arquivos alterados:
  - `functions/index.js`
  - `firebase.json`
  - `public/master.html`
  - `AI_CHANGELOG.md`
- Motivo da alteracao: o Master local nao valida com seguranca o estado real das Functions/Firestore em producao; era necessario um painel restrito para conferir SMTP, templates, gatilhos, logs e existencia de conta Auth/tenant no projeto publicado.
- Impacto esperado: `/master` passa a abrir uma tela restrita por Firebase Auth e allowlist backend (`MASTER_EMAILS`), usando endpoint protegido `masterEmailDiagnostics`.
- Seguranca: o endpoint exige token Firebase e e-mail Master permitido; nao retorna senha SMTP, tokens, HTML de templates ou payloads sensiveis. A tela mostra apenas flags seguras como `smtpPasswordConfigured`, templates, gatilhos e logs sanitizados.
- Escopo: nao publiquei o `master.html` local completo; foi criada uma versao inicial de Master Produção focada em diagnostico tecnico de e-mails automaticos.
- Ajuste posterior: o helper SMTP das Functions passa a tratar erro anomalo apos envio do DATA (`smtp_response_535`, reset/EOF) como `warning` quando a mensagem ja foi enviada ao servidor, mantendo retorno `ok: true` e registrando o aviso em `email_logs`.
- Ajuste posterior: o botao `Enviar teste SMTP` do Master restrito passa a exibir feedback imediato (`Enviando...`), desabilitar durante a chamada e preservar a mensagem de sucesso/erro mesmo apos recarregar os logs.
- Ajuste posterior: o Master restrito ganhou formulário para salvar a configuração SMTP de produção via Function protegida `saveEmailSettings`, permitindo atualizar senha/host/usuário/remetente no mesmo ambiente usado pelos e-mails automáticos.
- Ajuste posterior: o SMTP das Functions agora tenta `AUTH LOGIN` como alternativa quando `AUTH PLAIN` é recusado com resposta 535/504/500/502, cobrindo provedores que exigem método de autenticação diferente.
- Ajuste posterior: para hosts Brevo, a autenticação SMTP passa a tentar `AUTH LOGIN` primeiro, evitando que uma tentativa prévia com `AUTH PLAIN` deixe a sessão recusada antes da autenticação esperada pelo relay.
- Ajuste posterior: centralizada a interpretação de transporte SMTP nas Functions; portas `587` e `2525` usam socket normal com STARTTLS obrigatório (`secure=false`, `requireTLS=true`) e porta `465` usa TLS implícito (`secure=true`). `testSmtpConnection` e `sendTestEmail` passam a usar essa mesma lógica, com trim de host/usuário/senha/remetente e logs seguros sem senha.
- Ajuste posterior: removida a regra especial que forçava `AUTH LOGIN` para Brevo no envio; `sendTestEmail` volta a usar uma autenticação única (`AUTH PLAIN`) e passa a logar de forma segura `from`, `envelopeFrom`, host, porta, `secure`, `requireTLS`, usuário mascarado, `responseCode` e resposta SMTP truncada.
- Ajuste posterior: a recuperação de senha publicada deixou de acionar o fallback nativo `firebase.auth().sendPasswordResetEmail`; o fluxo passa a depender apenas da Function `requestPasswordResetEmail` e do template SMTP `password_reset`, evitando envio do e-mail padrão do Firebase.
- Ajuste posterior: `requestPasswordResetEmail` deixou de interromper o fluxo apenas por falha em `getUserByEmail`; a geração do link de reset passa a ser a validação real antes do envio SMTP, evitando falsos `auth_user_not_found` que impediam o e-mail BocaFood.
- Ajuste posterior: a inicialização do Admin SDK nas Functions passou a definir explicitamente o `projectId` (`bocado-brasil` como fallback), garantindo que Auth e geração de link de senha usem o mesmo projeto de produção que Firestore/Hosting.
- Ajuste posterior: o fluxo de recuperação de senha passa a registrar em `email_logs` o código técnico seguro quando a geração do link pelo Firebase Auth falhar, sem expor link, senha ou dados sensíveis.
- Ajuste posterior: `requestPasswordResetEmail` passa a executar com o service account Firebase Admin do projeto para ter permissão de gerar links de recuperação no Firebase Auth, sem embutir chave ou credencial no código.
- Ajuste posterior: falhas SMTP em envio por template passam a registrar no `email_logs` a resposta SMTP truncada e segura, ajudando a diferenciar erro de autenticação, envelope ou conteúdo sem expor senha/HTML.
- Ajuste posterior: `AGENTS.md` documenta a regra operacional de conclusão automática quando a usuária disser que a tarefa "deu certo": rodar validações, fazer deploy quando necessário, commitar arquivos relacionados e fazer push, mantendo as travas contra `git add .` e arquivos sensíveis.

## 2026-05-17 — Tags de CRM para contas
- Arquivos alterados: `functions/index.js`, `server.rb`, `master.html`, `firestore.rules`, `AGENTS.md`, `AI_CHANGELOG.md`.
- Criada a camada independente de Tags de CRM para contas, usando `system_crm_tags`, `system_crm_tag_rules`, `system_crm_tag_logs` e `system_tenants/{uid}.crmTags`/`crmTagMeta`.
- Criados defaults de tags CRM como `trial_sem_cardapio`, `usuario_inativo`, `potencial_upgrade`, `cardapio_iniciado`, `loja_publicada`, `risco_cancelamento` e `cliente_avancada`.
- Criada a rotina agendada `dailyCrmTagRuleCheck`, separada de `dailyEmailTriggerCheck`, para avaliar regras ativas e aplicar/remover tags CRM em contas.
- O Master local ganhou aba `CRM tags` dentro de E-mails automáticos para gerenciar tags, regras e aplicação manual em contas.
- As regras do Firestore permitem que apenas Master leia/escreva tags e regras CRM; logs CRM são leitura Master e escrita bloqueada ao client.
- Importante: tags CRM não são etiquetas transacionais de e-mail, não integram `system_email_triggers` e não são lidas por `dailyEmailTriggerCheck`.
- Ajuste posterior: a rotina `dailyCrmTagRuleCheck` passou a injetar `uid`/`tenantUid` do documento durante a avaliação, permitindo regras com condição `uid equals ...`; o `server.rb` ganhou o endpoint local protegido `/api/master/crm/run-tag-rules` para validação manual segura das regras CRM sem tocar em campanhas ou e-mails transacionais.
- Ajuste posterior: o botão `Editar` da lista de Tags CRM no Master passou a carregar a tag no editor, rolar até o formulário e exibir feedback, evitando a impressão de botão sem ação.
- Ajuste posterior: a prévia dos modelos globais de e-mails transacionais no Master foi redesenhada com fonte do sistema, card branco limpo, borda suave, sombra leve e hierarquia inspirada no Admin/Maturidade, sem alterar envio, SMTP ou templates salvos.
- Ajuste posterior: refinada a tela de templates transacionais no Master: cabeçalho da prévia ficou mais leve com logo menor e badge discreto, título/pre-header em linhas separadas, corpo com espaçamento melhor, ajuda para HTML simples no campo de corpo, card compacto de variáveis principais e ações mais claras (`Salvar template`, `Enviar teste`, `Restaurar padrão`).
- Ajuste posterior: o topo da prévia de e-mail passou a exibir somente a logo; badge, título e pré-header foram movidos para a área de conteúdo para reduzir excesso textual no cabeçalho e aproximar a hierarquia visual dos cards do módulo Maturidade.
- Ajuste posterior: a prévia dos e-mails transacionais foi refinada para um visual SaaS mais adulto e limpo: fundo externo quase branco, card único com borda/sombra sutis, logo menor, badge menos vermelho, título em peso 700, corpo sem caixa interna pesada, CTA mais compacto e aviso de segurança mais discreto.
- Ajuste posterior: nova lapidação visual da prévia transacional no Master com `system-ui`, logo de 76px, header mais baixo, badge quase neutro, título 23px/680, corpo mais compacto sem molduras internas, CTA vermelho leve e aviso `Segurança` em linha discreta; a prévia fictícia de boas-vindas exibe a copy profissional sem alterar o template salvo.
- Ajuste posterior: removida a pílula com o nome do template da prévia de e-mail e aplicado degradê sutil branco/rosado/bege com linha superior vermelho-dourada inspirado no módulo Maturidade do Negócio.
- Ajuste posterior: o CTA da prévia de e-mail recebeu acabamento mais premium com degradê vermelho discreto, borda sutil e sombra controlada.
- Ajuste posterior: o rodapé dos e-mails transacionais passou a usar campos globais `termsUrl`, `privacyUrl`, `securityText` e `footerReasonDefault`, além de `supportEmail`/`brandName`; templates ganharam `footerReason` opcional e a renderização usa o motivo do template ou o padrão global. A prévia e o envio final foram alinhados ao novo rodapé com segurança, suporte, motivo do envio, marca, termos e política de privacidade.
- Ajuste posterior: corrigido o salvamento de templates no Master para reenviar/preservar `availableVariables` ao salvar configurações do template, evitando que metadados do modelo sejam perdidos quando o formulário salva `footerReason`, corpo, assunto ou CTA.
- Ajuste posterior: a palavra `Segurança:` no rodapé dos e-mails transacionais ganhou peso visual maior na prévia, no envio local e nas Functions.
- Ajuste posterior: o rodapé dos e-mails transacionais recebeu degradê vermelho muito leve e borda superior suave na prévia, no envio local e nas Functions, mantendo compatibilidade com clientes de e-mail.
- Ajuste posterior: o fundo geral da prévia e do HTML final dos e-mails transacionais ficou mais premium, com degradê externo off-white/rosado e card principal com degradê interno mais refinado e sombra difusa.
- Ajuste posterior: o template `password_reset` passa a preencher e preservar a URL do CTA como `{{resetPasswordUrl}}` quando o documento salvo estiver antigo ou vazio; o Master local, o `server.rb` e as Functions usam o padrão do template para evitar botão de redefinição sem destino.
- Ajuste posterior: alinhada a renderização real dos e-mails transacionais com a prévia do Master. O HTML enviado pelas Functions e o teste local do `server.rb` deixaram de usar o layout antigo com logo grande, texto `SaaS BocaFood`, título no cabeçalho e card interno pesado, passando a seguir o visual atual da prévia com logo menor, degradê, tipografia do sistema, CTA premium e corpo mais limpo.

## 2026-05-18 — Fallback Google Auth no login e cadastro
- Arquivos alterados: `public/admin.html`, `public/cadastro.html`, `AI_CHANGELOG.md`.
- Os botões de login/cadastro com Google agora exibem feedback imediato ao clique para evitar sensação de botão sem ação.
- Quando o popup do Google for bloqueado, cancelado por solicitação concorrente ou não suportado pelo navegador, o fluxo passa a usar fallback com `signInWithRedirect`.
- No cadastro, o retorno do redirect do Google é tratado para continuar o onboarding, chamar `completeSignupOnboarding` no estágio `account_created` e avançar para a etapa de dados do usuário.
- Impacto esperado: login e primeiro acesso com Google funcionam também em navegadores/ambientes que bloqueiam popup.
- Ajuste posterior: o Admin deixou de liberar acesso ao Centro de Controle apenas por e-mail de bootstrap sem tenant ativo; agora mesmo o e-mail Master precisa resolver um `system_tenants` ativo para abrir o Admin.
- Ajuste posterior: as mensagens de erro do Google Auth ficaram mais específicas para domínio não autorizado, provedor Google desativado, falha de rede e códigos desconhecidos.

## 2026-05-18 — Favicon BocaFood nas páginas internas
- Arquivos alterados: `public/admin.html`, `public/cadastro.html`, `public/redefinir-senha.html`, `public/master.html`, `master.html`, `AI_CHANGELOG.md`.
- As páginas internas do BocaFood passaram a usar o novo arquivo `public/favicon BocaFood.png` como favicon e apple-touch-icon.
- A alteração não mexe nos templates públicos da loja nem nos fluxos onde o favicon vem da usuária/tenant, preservando a personalização da loja pública.
- O Master restrito publicado deixou de referenciar `/logo.png` e passou a usar `/assets/boca-food-logo.png`, evitando imagem quebrada após a remoção do arquivo legado.
- Impacto esperado: Admin, cadastro, redefinição de senha e Master exibem o favicon oficial BocaFood, enquanto lojas publicadas continuam podendo usar o favicon configurado pela usuária.
- Ajuste posterior: os logos internos do Admin, cadastro, redefinição de senha, Master restrito, Master local e layouts transacionais de e-mail passaram a usar `public/logo BocaFood.png` (`/logo%20BocaFood.png`), mantendo a loja pública e o template da usuária sem alteração.

## 2026-05-18 — Proteção do Hottok Hotmart
- Arquivos alterados: `functions/index.js`, `deploy-hotmart-webhook.sh`, `AGENTS.md`, `AI_CHANGELOG.md`.
- O webhook `hotmartWebhook` passou a declarar `HOTMART_HOTTOK` como Firebase Functions Secret, usando Secret Manager no runtime e mantendo fallback temporário para `process.env.HOTMART_HOTTOK`.
- Adicionada validação defensiva para rejeitar valores de Hottok claramente mal configurados, como comandos de terminal, referência a `functions/.env`, `HOTMART_HOTTOK=` ou quebras de linha inesperadas, sem imprimir o token.
- Criado o script local `deploy-hotmart-webhook.sh`, que roda `node --check functions/index.js`, verifica a existência do secret, faz deploy somente de `hotmartWebhook` e mostra a URL esperada com lembrete de teste na Hotmart.
- Documentada em `AGENTS.md` a regra de não configurar Hottok manualmente no Cloud Run e sempre usar Firebase Secret Manager / Functions Secrets.
- Impacto esperado: reduzir risco de sobrescrever o token da Hotmart com valor errado durante deploy e evitar novos retornos 401 por configuração acidental.
- Ajuste posterior: adicionada a seção permanente `Hotmart Webhook — Hottok e deploy seguro` no `AGENTS.md`, proibindo salvar `HOTMART_HOTTOK` em `.env`, código, changelog, logs, prints, variáveis manuais do Cloud Run ou documentação pública.
- A documentação passou a registrar o comando oficial `firebase functions:secrets:set HOTMART_HOTTOK --project bocado-brasil`, o uso preferencial de `./deploy-hotmart-webhook.sh`, a URL oficial do webhook e a interpretação dos status 200/401/403/404/500 após teste na Hotmart.

## 2026-05-17 — Página de redefinição de senha
- Arquivos alterados: `public/redefinir-senha.html`, `functions/index.js`, `firebase.json`, `AI_CHANGELOG.md`.
- Criada a tela publicada `/redefinir-senha` com layout alinhado à tela de login do Centro de Controle, usando logo BocaFood, card central, fundo rosado claro, campos de nova senha/confirmacao e mensagens claras.
- A Function `requestPasswordResetEmail` passa a transformar o link gerado pelo Firebase Auth em uma URL do BocaFood (`/redefinir-senha?mode=resetPassword&oobCode=...`), mantendo fallback seguro quando a URL de retorno nao estiver autorizada.
- Adicionada rewrite de Hosting para `/redefinir-senha`, permitindo abrir a tela sem expor o nome do arquivo HTML.
- Impacto esperado: os e-mails transacionais de recuperacao de senha levam a uma pagina BocaFood para definir a nova senha, sem usar a tela visual padrao do Firebase.

## 2026-05-17 — Páginas do sistema no Master
- Arquivos alterados: `master.html`, `server.rb`, `AI_CHANGELOG.md`.
- Criada a aba `Páginas do sistema` no Master local para cadastrar e editar páginas institucionais globais, como Termos de uso, Política de privacidade, Avisos legais e páginas de suporte.
- Criados endpoints locais restritos ao Master em `/api/master/system-pages` para listar e salvar documentos na coleção `system_pages`.
- Estrutura salva: `key`, `title`, `slug`, `status`, `summary`, `category`, `order`, `seoTitle`, `seoDescription`, `contentHtml`, `source`, `createdAt` e `updatedAt`.
- Segurança: a tela e o backend removem `script`, `iframe`, handlers inline e `javascript:` do HTML da prévia/salvamento; a área apenas salva conteúdo e não linka automaticamente nos e-mails, rodapés ou páginas públicas.
- Impacto esperado: o Master passa a ter um editor central para preparar páginas institucionais antes de pedir o vínculo nos locais corretos.
- Ajuste posterior: a aba passou a usar o helper local do Master para carregar/salvar páginas, exibindo erro real de endpoint, credencial Firebase ou debug técnico seguro em vez de mensagem genérica.

## 2026-05-17 — Cadastro sem compra ativa
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- Corrigida a etapa final do primeiro acesso para não mostrar o card de sucesso quando o e-mail não tem compra ativa vinculada.
- Quando `purchaseFound` for falso, a tela passa a exibir um card de alerta com o título `Não encontramos uma compra ativa para este e-mail`, orientação para usar o e-mail da compra e suporte `teajudo@bocafood.app`.
- O checklist de sucesso e o botão `Entrar no BocaFood` ficam restritos ao fluxo com compra ativa encontrada.
- Ajuste posterior: quando o cadastro termina com compra ativa, a etapa final passa a exibir links para Termos de uso e Política de privacidade e exige aceite antes de entrar no Centro de Controle.
- A assinatura dos documentos é salva pela Function `completeSignupOnboarding` em `system_tenants/{uid}.legalAcceptance` e também em `system_legal_acceptances`, com log `signup_legal_terms_accepted`.
- Ajuste posterior: o modo prévia do cadastro agora permite simular compra ativa com `?preview=1&purchase=1`, exibindo a finalização com aceite dos documentos sem criar conta, consultar Hotmart ou salvar dados; `?preview=1` continua mostrando o fluxo sem compra ativa.
- Ajuste posterior: no modo prévia com compra ativa, o botão da etapa final passou a validar o checkbox dos Termos/Política e exibir confirmação de aceite simulado, em vez de voltar ao início sem feedback.
- Ajuste posterior: corrigida a aparência do checkbox de aceite dos documentos, sobrescrevendo o `appearance:none` global dos inputs apenas nesse campo.
- Ajuste posterior: corrigido o link padrão da Política de privacidade no cadastro e no fallback da Function de aceite, trocando o slug temporário `/rr` por `https://bocafood.app/privacidade`.
- Ajuste posterior: o card de aceite dos documentos na etapa final ficou mais compacto, com título/texto/links separados, checkbox alinhado ao texto e botão final desabilitado até o aceite ser marcado; em produção o botão passa a exibir `Entrar no BocaFood`.
- Ajuste posterior: o bloco de aceite foi refinado novamente para uma confirmação mais simples: título `Confirme para continuar`, texto de apoio curto e links de Termos/Política dentro da própria frase do checkbox, reduzindo peso visual e espaço vazio.
- Ajuste posterior: o texto `Li e aceito...` foi alinhado lateralmente ao checkbox, com o texto ocupando a linha ao lado do controle em vez de parecer separado.
- Ajuste posterior: o bloco de aceite voltou a exibir os links de Termos de Uso e Política de Privacidade em linha própria, antes do checkbox, com a copy final solicitada para a etapa de confirmação.
- Ajuste posterior: o label do aceite passou a forçar `flex-direction: row`, evitando que o estilo global dos labels empilhe o checkbox acima do texto.
- Ajuste posterior: o Master passou a exibir na aba Cadastro da conta um card somente leitura com o status do aceite dos documentos, data do aceite, e-mail assinante e links de Termos de Uso/Política de Privacidade salvos em `legalAcceptance`.
- Ajuste posterior: o e-mail transacional `welcome_access_created` (`Cadastro concluído`) passou a ser enviado após a confirmação/aceite dos documentos no onboarding, em vez de ser disparado antes do aceite na etapa `completed`.
- Ajuste posterior: a tela de configurações globais financeiras do Master passou a aguardar mais tempo pela autenticação Firebase antes de exibir erro, com mensagem corrigida para `Faça login no Master para carregar as configurações globais`.
- Ajuste posterior: ocultada da navegação principal do Master a aba legada `Backup do Sistema`, mantendo o código/endpoints disponíveis apenas como fluxo técnico legado de backup de código.

## 2026-05-17 — Backup de dados Firestore
- Arquivos alterados: `functions/index.js`, `master.html`, `AI_CHANGELOG.md`.
- Criada a Function protegida `firestoreBackupAdmin` para Master configurar bucket, consultar logs e iniciar exportação oficial do Firestore para Cloud Storage.
- Criada a rotina agendada `dailyFirestoreBackup`, diária às 03:00 no timezone `Europe/Madrid`, usando `system_backup_settings/firestore` e registrando execuções em `system_firestore_backups`.
- A aba Configurações do Master ganhou o card `Backup de dados Firestore`, com bucket, retenção planejada, status do último backup, logs recentes e botão `Executar backup agora`.
- O fluxo usa a API oficial `projects.databases.exportDocuments`; se faltar bucket ou permissão IAM, o erro técnico é registrado em `system_firestore_backups` e mostrado no Master sem expor credenciais.
- Pendências operacionais: criar/confirmar o bucket Cloud Storage `gs://bocado-brasil-firestore-backups` e conceder ao service account das Functions permissão para exportar Firestore e escrever no bucket.

## 2026-05-17 — Documentação consolidada do projeto
- Arquivos alterados: `AGENTS.md`, `AI_CHANGELOG.md`.
- Atualizado o objetivo do sistema para refletir publicação centralizada e remover a premissa antiga de domínio/repositório próprio por tenant.
- Documentadas as regras atuais do cadastro: aceite obrigatório de Termos de Uso e Política de Privacidade, salvamento em `system_tenants/{uid}.legalAcceptance`, auditoria em `system_legal_acceptances` e envio do template `welcome_access_created` somente após o aceite.
- Documentadas as regras dos e-mails automáticos: SMTP salvo no Master, senha sempre protegida, layout transacional compartilhado, rodapé global com termos/política, recuperação de senha via template `password_reset` e página `/redefinir-senha`.
- Documentado o backup oficial de dados Firestore via exportação para Cloud Storage, com configurações em `system_backup_settings/firestore`, logs em `system_firestore_backups`, rotina `dailyFirestoreBackup` e fluxo legado de backup de código oculto.
- Ajuste posterior: ampliada a documentação para cobrir decisões anteriores de Master/Contas, origem dos dados herdados do Admin, onboarding e `businessProfile`, Hotmart/billing, mapeamento real das ofertas, login/redefinição de senha, páginas do sistema e uso do Master restrito em produção.

## 2026-05-18 — Bloqueio automático por evento Hotmart
- Arquivos alterados: `functions/index.js`, `AGENTS.md`, `AI_CHANGELOG.md`.
- O webhook Hotmart passa a bloquear automaticamente a conta vinculada quando o status recebido for `canceled`, `refunded` ou `chargeback`, gravando `accountStatus/status = blocked`, `blockedAt` e `blockedReason`.
- Quando o status Hotmart voltar para `active`, o webhook passa a liberar a conta vinculada com `accountStatus/status = active`, além de atualizar `billing`.
- A mudança não apaga tenant, loja ou dados da conta; apenas reflete o estado de acesso em `system_tenants/{uid}` e mantém os logs existentes em `system_access_logs`.
- A documentação do projeto foi atualizada para registrar que cancelamento, reembolso e chargeback bloqueiam acesso automaticamente, enquanto evento ativo pode liberar novamente.
- Ajuste posterior: criado o template transacional `access_blocked` para avisar quando o acesso for bloqueado por cancelamento, reembolso ou chargeback Hotmart.
- O webhook Hotmart passa a enviar `access_blocked` para status `canceled`, `refunded` e `chargeback`; `payment_pending` continua reservado para pagamento pendente/atrasado sem bloqueio automático.
- O gatilho padrão `subscription_canceled_email` foi redirecionado para o template `access_blocked` quando ainda estiver com a configuração padrão do sistema, evitando manter o aviso antigo de assinatura cancelada como e-mail principal de bloqueio.
- Atualizados defaults do Master local, Functions e backend local para exibir/editar/enviar o novo template com variáveis `blockedReason`, `canceledAt`, `billingStatus`, `hotmartTransaction` e `hotmartOfferCode`.

## 2026-05-18 — Preferências de comunicação no cadastro
- Arquivos alterados: `public/cadastro.html`, `functions/index.js`, `AGENTS.md`, `AI_CHANGELOG.md`.
- A etapa final do cadastro, abaixo do aceite de Termos de Uso e Política de Privacidade, passa a mostrar o bloco `Preferências de comunicação`.
- Foram adicionadas três opções opcionais: novidades/conteúdos/campanhas comerciais, dicas para vender mais e ofertas/promoções/convites para upgrade.
- A Function `completeSignupOnboarding` salva as preferências em `system_tenants/{uid}.communicationPreferences` com origem `signup_onboarding` e `updatedAt`.
- As comunicações essenciais de conta, segurança, cobrança, senha, plano e obrigações legais continuam independentes dessas preferências.
- A mudança apenas guarda dados para uso futuro no CRM/promocionais; nenhum disparo de campanha foi conectado nesta etapa.
- Ajuste posterior: adicionado subtítulo no bloco de preferências: `Quer continuar recebendo ideias, melhorias e oportunidades para vender mais com o BocaFood?`.
- Ajuste posterior: atualizada a nota de comunicações essenciais para deixar claro que elas continuam sendo enviadas mesmo se a usuária desativar as preferências comerciais.
- Ajuste posterior: atualizadas as labels dos checkboxes para deixar explícito `Quero receber...` em novidades/campanhas, dicas práticas e ofertas/upgrade.
- Ajuste posterior: alinhados os checkboxes dos blocos de aceite legal e preferências de comunicação usando grid de duas colunas, mantendo texto e caixa no mesmo eixo visual.

## 2026-05-18 — Permissão de acesso para role admin
- Arquivos alterados: `public/js/core/auth.js`, `AI_CHANGELOG.md`.
- Corrigida a validação de papéis do Centro de Controle para aceitar `role: admin` como papel válido de tenant BocaFood.
- A mudança resolve contas criadas pelo cadastro/onboarding Hotmart que já possuem `accountStatus/status = active`, mas eram bloqueadas no frontend com a mensagem de falta de permissão.
- O ajuste não concede permissão Master; `admin` continua sendo acesso comum ao Centro de Controle e ainda depende de tenant ativo.

## 2026-05-18 — Exclusão e vínculos em Páginas do sistema
- Arquivos alterados: `master.html`, `server.rb`, `AI_CHANGELOG.md`.
- A aba Master → Páginas do sistema ganhou botão `Excluir página`, usando `POST /api/master/system-pages` com `action: delete` para remover o documento correspondente de `system_pages`, evitando bloqueio do método `DELETE` pelo WEBrick local.
- O editor passou a exibir o card `Onde esta página está linkada`, indicando vínculos conhecidos com as configurações globais de e-mail (`termsUrl`/`privacyUrl`) e links de aceite do cadastro quando a URL coincide.
- A exclusão mostra alerta quando a página possui vínculos conhecidos, deixando claro que apagar a página não remove automaticamente URLs já configuradas em outros fluxos.

## 2026-05-18 — Logo e favicon BocaFood padronizados
- Arquivos alterados: `public/assets/boca-food-logo.png`, `public/assets/boca-food-favicon.png`, `public/admin.html`, `public/cadastro.html`, `public/redefinir-senha.html`, `public/master.html`, `master.html`, `server.rb`, `functions/index.js`, `AI_CHANGELOG.md`.
- Os novos arquivos enviados como `public/logo BocaFood.png` e `public/favicon BocaFood.png` foram copiados para os assets versionados `public/assets/boca-food-logo.png` e `public/assets/boca-food-favicon.png`.
- As telas internas publicadas do BocaFood passaram a usar `/assets/boca-food-logo.png` e `/assets/boca-food-favicon.png`, evitando depender dos arquivos com espaço no nome que ficam ignorados pelo Git.
- O layout dos e-mails transacionais, a prévia do Master e os defaults de Functions/backend passaram a usar `https://bocafood.app/assets/boca-food-logo.png`, com normalização para substituir URLs antigas como `logo%20BocaFood.png`.
- Não foram alteradas as referências da loja pública/template para preservar o fluxo em que logo e favicon da loja vêm da usuária.

## 2026-05-18 — Cancelamento Hotmart por subscriber
- Arquivos alterados: `functions/index.js`, `AGENTS.md`, `AI_CHANGELOG.md`.
- Corrigida a leitura de eventos `SUBSCRIPTION_CANCELLATION` da Hotmart para extrair e-mail, nome, telefone e código do assinante a partir de `data.subscriber`.
- Antes, o webhook gravava o evento em `hotmart_events`, mas não conseguia vincular o cancelamento ao tenant quando o payload não trazia `data.buyer`.
- Impacto esperado: cancelamentos de assinatura passam a atualizar `system_tenants/{uid}` pelo e-mail/código do assinante, bloqueando acesso e atualizando `billing.status` conforme a regra já existente.
- Ajuste adicional: `hotmart_events` agora recebe `processedAt`, `processingStatus`, `billingStatus` e `linkedCount`; eventos já gravados sem `processedAt` podem ser reprocessados em um reenvio da Hotmart, evitando que um evento antigo fique preso como duplicado antes de aplicar a regra.
- Ajuste adicional: o webhook passou a salvar resumo normalizado no evento (`buyerEmail`, `hotmartSubscriberCode`, `hotmartTransaction`, `hotmartOfferCode`, `planSlug`, `billingCycle`) e marcar como `pending_manual` quando o tenant não for encontrado ou o payload vier incompleto.
- Eventos Hotmart reconhecidos mas sem identificadores mínimos agora criam pendência em `pending_hotmart_access` com `pendingReason: incomplete_hotmart_payload`, em vez de ficarem apenas registrados em `hotmart_events` sem ação manual.
- O mapeamento de plano em eventos de assinatura passou a priorizar nome do plano, evitando salvar IDs numéricos da Hotmart como `planSlug`; campos Hotmart vazios deixam de sobrescrever valores já existentes no tenant.
- Validação em produção: o evento real `SUBSCRIPTION_CANCELLATION` salvo em `hotmart_events` foi reprocessado com status 200, vinculou o tenant por `data.subscriber.email`, bloqueou a conta, marcou `billing.status = canceled`, manteve o plano como `essencial` e não reenviou e-mail duplicado graças à deduplicação de `email_logs`.
- Documentação atualizada no `AGENTS.md`: eventos reais da Hotmart podem variar entre `data.buyer`, `data.purchase` e `data.subscriber`; reprocessamentos devem usar Secret Manager e validar apenas campos seguros, sem imprimir Hottok nem payload completo.

## 2026-05-18 — Link público da Política de Privacidade
- Arquivos alterados: `public/cadastro.html`, `public/system-page.html`, `firebase.json`, `firestore.rules`, `master.html`, `server.rb`, `functions/index.js`, `AGENTS.md`, `AI_CHANGELOG.md`.
- Corrigido o link padrão da Política de Privacidade para `https://bocafood.app/politicadeprivacidade`, alinhado ao slug real publicado em `system_pages`.
- O cadastro/primeiro acesso passa a apontar o aceite para a página real de Política de Privacidade, em vez de `/privacidade` ou URL temporária.
- Os defaults de e-mail no Master local, backend local e Functions passaram a usar `https://bocafood.app/termosdeuso` e `https://bocafood.app/politicadeprivacidade`.
- Criada a página pública `public/system-page.html`, que renderiza documentos publicados de `system_pages` para as rotas `/termosdeuso` e `/politicadeprivacidade`.
- Atualizado `firebase.json` para rotear `/termosdeuso` e `/politicadeprivacidade` para o renderer público, e `firestore.rules` para permitir leitura pública somente de páginas com `status = published`.
- Documentado no `AGENTS.md` que essas são as URLs oficiais dos documentos legais globais usados em cadastro e rodapés transacionais.
- Ajuste posterior: removido o aviso `Segurança: o BocaFood nunca solicita senha por e-mail.` do corpo/prévia do e-mail, mantendo essa informação somente no rodapé transacional.
- Ajuste posterior: adicionados aliases públicos `/termos`, `/privacidade` e `/rr` para renderizar as páginas legais corretas, preservando links antigos já enviados por e-mail.

## 2026-05-18 — Logo e favicon BocaFood revisados
- Arquivos alterados: `public/assets/boca-food-logo.png`, `public/assets/boca-food-favicon.png`, `assets/boca-food-logo.png`, `assets/boca-food-favicon.png`, `public/404.html`, `public/financeiro.html`, `public/master.html`, `AI_CHANGELOG.md`.
- Atualizados os assets versionados a partir dos arquivos mais recentes enviados em `public/logo BocaFood.png` e `public/favicon BocaFood.png`.
- A página 404 publicada foi substituída pelo visual BocaFood, com logo, favicon e link para o Centro de Controle.
- A página auxiliar `public/financeiro.html` passou a usar logo, favicon e apple-touch-icon BocaFood antes do redirecionamento ao Admin.
- O Master restrito publicado passou a declarar também `apple-touch-icon`, além do favicon.
- Não foram alterados `public/index.html`, review ou tracking da loja pública para preservar o fluxo em que logo/favicon vêm da usuária/tenant.

## 2026-05-18 — Clareza na etapa Negócio do cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- A etapa 3 do cadastro passou de `Dados da loja` para `Sobre sua loja`, com subtítulo mais claro sobre a configuração inicial da loja.
- A seção `Identificação da loja` foi renomeada para `Informações básicas`, e o campo de cidade passou a exibir `Cidade onde você atende`.
- As opções de produtos e formas de venda ganharam labels mais naturais na interface, preservando os valores internos já salvos no onboarding.
- As seções internas da etapa receberam borda neutra e destaque vermelho apenas para seleção, progresso e ação principal, reduzindo a sensação de formulário pesado.

## 2026-05-18 — Favicon BocaFood atualizado novamente
- Arquivos alterados: `public/assets/boca-food-favicon.png`, `assets/boca-food-favicon.png`, `AI_CHANGELOG.md`.
- Identidade: o novo arquivo `public/favicon BocaFood.png` foi sincronizado para os assets versionados usados pelas telas internas e páginas publicadas do BocaFood.
- Escopo: alteração apenas de asset visual; não altera lógica, rotas, autenticação, Hotmart, e-mails ou favicon dinâmico das lojas públicas.

## 2026-05-18 — Clareza na etapa Vendas do cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- A etapa 4 manteve o título `Como sua loja vende hoje`, mas recebeu subtítulo mais claro sobre operação e configuração inicial.
- Os textos de apoio de ritmo de vendas, canais de pedido e cardápio foram refinados para leitura mais natural.
- Canais de pedido e situação do cardápio passaram a usar labels visuais mais leves, preservando os valores internos já salvos no onboarding.
- A etapa passou a usar o mesmo tratamento visual neutro da etapa 3, com bordas claras e destaque vermelho apenas para seleção, progresso e ação principal.

## 2026-05-18 — Mapa de vendas na etapa Vendas do cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- A etapa 4 do cadastro foi redesenhada visualmente como `mapa de vendas`, mantendo o mesmo fluxo, campos, valores internos e comportamento de seleção.
- O ritmo de vendas passou a ser exibido como uma régua de evolução, com labels visuais mais curtas e valores salvos preservados.
- Canais de pedido e cardápio ganharam opções mais compactas e neutras, reduzindo a sensação de questionário repetitivo.
- Adicionado o resumo dinâmico `Seu mapa de vendas até aqui`, mostrando ritmo, canais e cardápio conforme as escolhas da usuária.

## 2026-05-18 — Refinamento premium do mapa de vendas
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- A régua de ritmo da etapa 4 removeu os círculos numerados e passou a usar pontos discretos com linha horizontal leve.
- Os canais de pedido removeram siglas improvisadas e ficaram mais compactos, mantendo seleção múltipla e valores internos preservados.
- Cardápio e controle de pedidos foram compactados com bordas neutras e destaque vermelho apenas quando selecionados.
- O resumo `Seu mapa de vendas` passou a exibir ritmo, canais, cardápio e pedidos em chips leves, com frase neutra quando ainda não há respostas.

## 2026-05-18 — Raio-X da operação na etapa Estrutura
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- A etapa 5 do cadastro foi redesenhada visualmente como `Raio-X da operação`, mantendo fluxo, campos, valores internos e salvamento inalterados.
- Local de produção e custos passaram a usar chips compactos com labels mais naturais, preservando os valores salvos no onboarding.
- Capacidade diária e equipe passaram a usar réguas discretas de progressão, sem numeração grande nem aparência gamificada.
- Adicionado resumo dinâmico `Raio-X da sua operação`, com produção, capacidade, equipe e custos conforme as escolhas da usuária.
- Ajustado foco visível dos botões para seguir o padrão BocaFood sem perder acessibilidade.

## 2026-05-18 — Radar do momento na etapa Momento
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- A etapa 6 passou a usar o mesmo padrão visual dinâmico das etapas 4 e 5, sem alterar fluxo, campos, valores internos ou salvamento.
- Desafio e objetivo principal foram organizados em chips compactos; fase do negócio e tempo disponível passaram a usar réguas discretas.
- Adicionado resumo dinâmico `Radar do seu momento`, exibindo desafio, objetivo, fase e tempo conforme as escolhas da usuária.
- A mudança reduz a sensação de questionário repetitivo e mantém o visual premium do cadastro.

## 2026-05-18 — Mapa inicial da loja na etapa Negócio
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- A etapa 3 passou a usar o mesmo padrão visual dinâmico das etapas seguintes, sem alterar fluxo, campos, valores internos ou salvamento.
- Nome da loja e cidade seguem como campos principais; produtos e forma de venda foram organizados em opções compactas com bordas neutras.
- Adicionado o resumo dinâmico `Mapa inicial da loja`, exibindo loja, cidade, produtos e forma de venda conforme as escolhas da usuária.

## 2026-05-18 — Congelamento do Master para tarefas do Admin
- Arquivos alterados: `AGENTS.md`, `AI_CHANGELOG.md`.
- Registrada regra permanente de que o Master fica congelado para novas tarefas do Admin até liberação explícita da usuária.
- Tarefas do Admin podem herdar ou ler dados de `system_tenants`, mas não devem alterar `master.html`, visual, rotas ou lógica exclusiva do Master sem pedido direto.

## 2026-05-18 — Correção pontual do botão Arquivar no Master
- Arquivos alterados: `master.html`, `server.rb`, `AI_CHANGELOG.md`.
- O arquivamento de conta agora também aciona a atualização do Firebase Auth para desativar acesso quando `status = archived`.
- A rotina de Auth passou a tratar `archived` como status desabilitado, alinhando Arquivar ao comportamento esperado de bloqueio de acesso.
- O botão Arquivar ganhou validação de UID e força atualização visual da lista após a ação.

## 2026-05-18 — Botão de logout no menu lateral do Admin
- Arquivos alterados: `public/admin.html`, `AI_CHANGELOG.md`.
- Adicionado botão premium `Sair da conta` abaixo do card `Precisa de ajuda?` no menu lateral do Centro de Controle.
- O botão usa o logout existente de `Auth.logout()`, retorna para a tela de login e mantém o visual alinhado aos cards do menu lateral.
- O Master permanece congelado; nenhuma alteração adicional foi feita no painel Master nesta tarefa.
- Ajuste posterior: aumentado o respiro inferior do rodapé lateral para o botão `Sair da conta` não ficar colado ao fim da tela.
- Ajuste posterior: removida a linha/borda do card `Sair da conta`, mantendo o efeito premium por gradiente e sombra suave.
- Ajuste posterior: reduzido o peso visual do texto `Encerrar sessão` no botão de logout.
- Ajuste posterior: copy do card de ajuda alterada para `Precisa de suporte?` com menção à equipe BocaFood.

## 2026-05-18 — Página de abertura de chamado no Admin
- Arquivos alterados: `public/admin.html`, `public/js/modules/suporte.js`, `AI_CHANGELOG.md`.
- Criada a rota `suporte/chamado` no Centro de Controle para abertura de chamados pela usuária.
- O card `Precisa de suporte?` no menu lateral agora abre a página de suporte.
- A página salva chamados em `tenants/{tenantId}/support_tickets`, com tipo, prioridade, assunto, mensagem, contato, código do chamado e contexto seguro da conta.
- O Master permanece congelado; não houve alteração em `master.html` nesta tarefa.
- Ajuste posterior: copy do card lateral alterada para `Precisa de ajuda?` e orientação para ver instruções ou abrir chamado.
- Ajuste posterior: microcopy do card lateral refinada para mencionar instruções de uso e Central de Ajuda.
- Ajuste posterior: o card lateral passou a abrir a `Central de Ajuda`, com caminhos separados para `Guias de uso` e `Abrir chamado`.
- A área de instruções foi nomeada como `Guias de uso`, evitando a nomenclatura mais burocrática `Página de instruções`.
- Adicionada a tela `Meus chamados` no Admin para a própria usuária acompanhar os chamados salvos em `tenants/{tenantId}/support_tickets`.
- Após enviar um chamado, o Admin direciona a usuária para `Meus chamados`, onde ela vê código, status, tipo, prioridade, data e resumo da mensagem.
- Ajuste posterior: removido o CTA `Abrir ajuda` do card lateral, mantendo apenas o texto curto de orientação para suporte.

## 2026-05-19 — Guias da Central de Ajuda mais premium
- Arquivos alterados: `public/js/modules/suporte.js`, `AI_CHANGELOG.md`.
- A página principal da Central de Ajuda passou a abrir primeiro os módulos e, depois, os submódulos/guias relacionados.
- Os cards de submódulos e painéis de instruções ganharam visual mais premium, com bordas suaves, sombra leve, hierarquia melhor e navegação de volta para módulos/submódulos.
- O conteúdo detalhado dos guias fica oculto na home e aparece apenas após a escolha do módulo e do submódulo.

## 2026-05-19 — País fiscal no onboarding e visual da aba TPV
- Arquivos alterados: `public/cadastro.html`, `functions/index.js`, `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- A etapa `Sobre sua loja` do cadastro passou a perguntar `País fiscal` ao lado da cidade de atendimento.
- O país fiscal do onboarding é salvo em `system_tenants/{uid}.fiscalCountry`, `accountAddress.fiscalCountry`, `store.fiscalCountry` e `businessProfile.fiscalCountry`, permitindo herança no Master sem alterar o painel Master.
- A aba `Configurações → TPV` no Admin recebeu o mesmo padrão visual limpo usado em `Dados fiscais do negócio`, com painel único, campos alinhados, fundo off-white, foco suave e botão `Salvar alterações`.
- Ajuste posterior: removido o card/toggle próprio que destoava do padrão e reorganizada a aba TPV com a mesma composição de seção, painel, grid compacto e rodapé de ações usada nas telas de Configurações.
- Ajuste posterior: o campo `Pagamento padrão` da aba TPV passou a herdar as formas ativas de `Financeiro → Configurações → Formas de pagamento`, mantendo compatibilidade com valores antigos já salvos.
- Ajuste posterior: a aba `Usuário` passou a usar o mesmo card de rodapé de ações da TPV, com o texto `Revise os dados antes de salvar.` e o botão `Salvar alterações` fora do card principal.
- Ajuste posterior: a herança de formas de pagamento no TPV passou a aceitar os formatos `formas_pagamento`, `formasPagamento` e `paymentMethods`, preservando dados complementares do Financeiro e exibindo um resumo das formas herdadas abaixo do select.
- Ajuste posterior: removidos o card `Formas herdadas do Financeiro` e a microcopy abaixo do campo `Pagamento padrão`, mantendo apenas o select com a lista herdada.
- Ajuste posterior: a explicação do status do TPV agora descreve o comportamento quando o módulo está ativado e quando está desativado.
- Ajuste posterior: a explicação do status do TPV saiu do campo `Status` e passou para uma nota separada abaixo do painel.
- Ajuste posterior: a nomenclatura visível `TPV` foi trocada para `Venda presencial` no Admin, nas configurações, na tela de venda presencial e nos canais financeiros, preservando chaves técnicas `tpv` e compatibilidade com dados antigos.
- Ajuste posterior: o card `Status` da aba Venda presencial foi compactado, centralizado e o label passou para `Ativar venda presencial`.
- Ajuste posterior: o label `Status` saiu de dentro do card e passou a ficar acima do controle de ativação.
- Ajuste posterior: removida a borda do controle `Ativar venda presencial`, deixando o bloco mais leve.
- Ajuste posterior: revisada a hierarquia da aba `Venda presencial`, com painel interno único, grid alinhado em três colunas, status alinhado à esquerda e nota explicativa integrada ao painel.
- Ajuste posterior: a nota explicativa da aba `Venda presencial` voltou para fora do painel interno, preservando o alinhamento revisado.

## 2026-05-19 — Link público da loja sem domínio personalizado
- Arquivos alterados: `public/js/modules/configuracoes.js`, `public/admin.html`, `public/index.html`, `firebase.json`, `firestore.rules`, `server.rb`, `AI_CHANGELOG.md`.
- A aba `Domínio / URL` foi renomeada visualmente para `Link da loja`, deixando claro que a usuária configura apenas o identificador da loja.
- O link público passou do formato `bocafood.app/loja/{slug}` para `bocafood.app/{slug}`.
- O Hosting ganhou fallback para carregar a loja pública por slug na raiz, mantendo compatibilidade com links antigos em `/loja/{slug}`.
- A loja pública agora resolve tanto `/loja/{slug}` quanto `/{slug}`, ignorando rotas reservadas como `login`, `cadastro`, `master`, `termos` e `privacidade`.
- O backend local passou a calcular `publicUrl` no mesmo padrão `https://bocafood.app/{slug}` para manter consistência dos tenants.
- Ajuste posterior: o botão `Ver loja` do Admin passou a abrir `/?tenant={uid}` em vez de `/index.html?tenant={uid}`, evitando que `index.html` fosse interpretado como slug público.
- Ajuste posterior: ao salvar/publicar o link da loja, o Admin cria ou atualiza `public_stores/{slug}` para que `bocafood.app/{slug}` resolva a loja pelo link público configurado.
- Ajuste posterior: as regras do Firestore permitem que a própria conta mantenha apenas o mapeamento público do seu slug, sem permitir escrita em slugs de outros tenants.
- Ajuste posterior: `Link da loja` saiu da navegação de `Configurações` e passou para o módulo `Loja Online`, mantendo a mesma tela e compatibilidade com a rota antiga.

## 2026-05-19 — Copy da aba Integrações no Admin
- Arquivos alterados: `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- A aba `Configurações → Integrações` recebeu copy mais clara e menos técnica, com foco em canais, redes sociais e medição da página pública.
- Os cards de status, o bloco `Visitas e campanhas`, o bloco `Canais de contato` e o card lateral foram renomeados para explicar melhor a função de WhatsApp, redes sociais, Analytics, GTM e Meta Pixel.
- O botão principal passou de `Salvar configurações` para `Salvar alterações`, sem alterar rotas, campos internos, salvamento ou lógica das integrações.
- Ajuste posterior: mantido o layout anterior dos cards principais `Visitas e campanhas` e `Canais de contato`, preservando apenas a copy mais clara.
- Ajuste posterior: apenas o campo `WhatsApp` de Integrações passou a usar o mesmo padrão visual do WhatsApp da aba `Usuário`, com DDI e número agrupados no mesmo controle.
- Ajuste posterior: os blocos de informação dos cards `Visitas e campanhas` e `Canais de contato` ganharam borda suave, fundo off-white e hierarquia mais alinhada, sem alterar campos ou salvamento.
- Ajuste posterior: o fundo off-white ficou restrito aos campos, e as notas dos campos foram compactadas para reduzir peso visual.

## 2026-05-19 — Padronização visual da aba Geral
- Arquivos alterados: `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- A aba `Configurações → Geral` foi alinhada ao padrão visual usado em `Integrações`, com painéis internos de borda suave, fundo branco e campos em off-white.
- As notas dos campos ficaram mais discretas e compactas, mantendo labels, IDs, rotas, Firestore e salvamento sem alteração.
- Os blocos `Perfil do negócio`, `Contato e preferências` e `Dados fiscais do negócio` mantêm a mesma lógica, mas com hierarquia visual mais limpa e consistente.

## 2026-05-19 — Rastreamento da loja pública por Integrações
- Arquivos alterados: `public/index.html`, `AI_CHANGELOG.md`.
- A loja pública passou a ler `config/integracoes` para carregar GA4, Google Tag Manager e Meta Pixel quando os respectivos campos estiverem preenchidos.
- O template público valida formatos básicos dos IDs antes de injetar scripts e evita carregamento duplicado.
- Foram conectados eventos básicos de `PageView`, `add_to_cart` e `begin_checkout` para apoiar medição de visitas, campanhas e intenção de pedido.

## 2026-05-19 — Documentação das decisões recentes do Admin
- Arquivos alterados: `AGENTS.md`, `AI_CHANGELOG.md`.
- Registradas regras permanentes sobre `Loja Online → Link da loja`, URL pública `https://bocafood.app/{slug}`, mapeamento em `public_stores/{slug}` e estado de loja ainda não publicada.
- Documentado o padrão visual das abas de Configurações do Admin, incluindo uso de campos off-white, bordas suaves, notas discretas e separação entre dados da loja e dados do usuário.
- Documentada a conexão entre `Configurações → Integrações`, `config/integracoes` e o rastreamento real da loja pública com GA4, GTM, Meta Pixel e eventos mínimos.

## 2026-05-19 — Guias de Configurações na Central de Ajuda
- Arquivos alterados: `public/js/modules/suporte.js`, `AI_CHANGELOG.md`.
- O módulo `Configurações` da Central de Ajuda passou a incluir guias para `Venda presencial`, `Integrações` e `Plano`, além de `Geral` e `Usuário`.
- Os novos guias explicam, em linguagem prática, quando ativar venda presencial, como preencher canais e ferramentas de medição, e como entender período grátis, acesso e cobranças.
- A página principal da Central continua mostrando apenas os módulos; os detalhes aparecem somente ao abrir `Configurações` e escolher o subguia.
- Ajuste posterior: o guia de `Plano` foi atualizado para refletir a tela `Meu plano` atual, explicando plano atual, acesso, período grátis apenas quando aplicável, dados da compra na Hotmart e ausência de histórico financeiro completo no BocaFood.

## 2026-05-19 — Aba Meu plano no Admin
- Arquivos alterados: `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- A aba `Configurações → Plano` foi transformada visualmente em `Meu plano`, com copy voltada à usuária final e sem termos técnicos como Master, tenant ou campo sincronizado.
- Adicionado banner de período grátis com estados para trial ativo, trial terminando em breve, trial terminando amanhã e trial encerrado, com CTAs para escolher plano ou falar com suporte.
- Cards e blocos foram reorganizados para exibir plano atual, acesso, período grátis, cobrança, detalhes do plano, recursos incluídos e uso do plano com labels humanos.
- Mantida a leitura dos campos existentes de plano, billing, status, ciclo e trial sem alterar rotas, permissões, Firestore, Hotmart ou salvamento.
- Ajuste posterior: os blocos `Recursos incluídos` e `Uso do plano` foram ocultados temporariamente até existirem limites e recursos reais configurados nos planos.
- Ajuste posterior: os quatro cards de resumo do plano foram alinhados em uma única linha no desktop, com quebra responsiva em tablets e mobile.
- Ajuste posterior: o bloco `Detalhes do plano` foi removido da visão da usuária por repetir informações já presentes nos cards principais.
- Ajuste posterior: o card de suporte foi movido para o topo da aba e renomeado para `Precisa de ajuda com seu plano?`.
- Ajuste posterior: o antigo `Histórico de cobrança` foi separado em `Linha do tempo do plano` para eventos do período grátis e `Cobranças` para pagamentos reais, evitando exibir valores `€0,00` como se fossem extrato financeiro.
- Ajuste posterior: o card `Linha do tempo do plano` foi ocultado, mantendo apenas `Cobranças` para pagamentos reais futuros.
- Ajuste posterior: o card lateral de perfil/conta passou a exibir `X dias grátis restantes` durante o período grátis ativo, voltando ao nome do plano quando o trial termina.
- Ajuste posterior: quando `diasRestantes <= 0`, a aba deixa de exibir card, data final e mensagens de período grátis ativo, passando a mostrar estado pós-trial com CTA `Escolher plano` e cards de `Plano atual`, `Acesso` e `Cobrança`.
- Ajuste posterior: o estado vazio de `Cobranças` deixa de mencionar período grátis após o vencimento e orienta que pagamentos e renovações aparecerão depois da escolha de um plano.
- Ajuste posterior: a regra pós-trial passou a considerar `diasRestantes <= 0` independentemente de `billingStatus`, impedindo que o card `Período grátis` continue aparecendo quando a data do trial já venceu.
- Ajuste posterior: quando o trial venceu mas `billingStatus` e `accountStatus` indicam conta ativa, a aba deixa de pedir escolha de plano e passa a mostrar plano/acesso/cobrança como ativos, sem banner de período grátis.
- Ajuste posterior: removido o card `Cobranças`, já que o BocaFood não recebe da Hotmart um histórico financeiro completo e confiável de cobranças/renovações.
- Ajuste posterior: o card `Precisa de ajuda com seu plano?` ganhou mais presença visual, os cards superiores receberam mais altura e espaçamento, e foi adicionado um bloco informativo para a usuária conferir pagamentos, recibos e dados financeiros no painel da Hotmart.

## 2026-05-19 — Acabamento visual da etapa 1 do cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- A etapa `Crie seu acesso` ganhou uma classe visual própria para aproximar o card do padrão premium usado no Admin e na tela `Meu plano`.
- O aviso sobre usar o mesmo e-mail da compra foi redesenhado como box discreto com ícone, borda suave, fundo claro e melhor hierarquia.
- O botão `Continuar com Google`, o divisor, os campos e o rodapé do card receberam ajustes leves de espaçamento, sombra e alinhamento, sem alterar fluxo, autenticação, Firebase, rotas, validações ou salvamento.
- Ajuste posterior: adicionada uma entrada visual de boas-vindas na etapa 1, com gradiente suave, mensagem de início e três indicadores curtos para dar mais presença, cor e acolhimento ao primeiro acesso.
- Ajuste posterior: removidos os indicadores curtos e o subtítulo repetido da etapa 1, mantendo a informação essencial apenas no box de aviso do e-mail da compra.

## 2026-05-19 — Acabamento visual da etapa 2 do cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- A etapa `Dados do responsável pela conta` passou a usar o mesmo padrão visual premium da etapa 1, com painel destacado, faixa superior em degradê e rodapé mais alinhado.
- Adicionado bloco introdutório leve para explicar que os dados identificam quem administra a conta e recebe comunicações importantes.
- Os blocos de dados do responsável e preferência da conta ganharam borda suave, fundo claro e melhor separação visual, sem alterar campos, validações, Firebase, rotas ou salvamento.
- Ajuste posterior: removido o subtítulo repetido abaixo do título da etapa 2, mantendo a explicação apenas no bloco introdutório.
- Ajuste posterior: o WhatsApp do responsável passou a usar o mesmo padrão visual agrupado da aba `Usuário`, e o campo de idioma foi removido da etapa por enquanto, mantendo `pt-BR` como valor padrão interno.

## 2026-05-19 — Acabamento visual da etapa 3 do cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- A etapa `Sobre sua loja` passou a seguir o mesmo padrão visual das etapas 1 e 2, com painel dedicado, faixa superior em degradê e bloco introdutório dentro do card.
- O subtítulo externo foi removido e a orientação sobre preparar a base da loja foi movida para o bloco visual da etapa.
- Mantidos os mesmos campos, opções, valores internos, validações, Firebase, rotas e salvamento do onboarding.

## 2026-05-19 — Acabamento visual da etapa 4 do cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- A etapa `Como sua loja vende hoje` passou a seguir o mesmo padrão visual das etapas anteriores, com painel destacado e bloco introdutório em degradê dentro do card.
- O subtítulo externo foi removido, mantendo a orientação da etapa dentro do bloco visual `Vendas`.
- Preservados os mesmos campos, seleções simples/múltiplas, valores internos, validações, Firebase, rotas e salvamento.

## 2026-05-19 — Acabamento visual da etapa 5 do cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- A etapa `Estrutura e capacidade` passou a seguir o mesmo padrão visual das etapas anteriores, com painel destacado e bloco introdutório em degradê dentro do card.
- O subtítulo externo foi removido e a orientação da etapa foi movida para o bloco visual `Estrutura`.
- Mantidos os mesmos campos, opções, valores internos, validações, Firebase, rotas e salvamento.

## 2026-05-19 — Acabamento visual da etapa 6 do cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- A etapa `Momento do negócio` passou a usar o mesmo padrão visual das etapas anteriores, com painel destacado e bloco introdutório em degradê dentro do card.
- O subtítulo externo foi removido e a orientação da etapa foi movida para o bloco visual `Momento`.
- Preservados os mesmos campos, opções, valores internos, validações, Firebase, rotas e salvamento.

## 2026-05-19 — Acabamento visual da etapa 7 do cadastro
- Arquivos alterados: `public/cadastro.html`, `AI_CHANGELOG.md`.
- A etapa `Finalização` passou a seguir o mesmo padrão visual das demais etapas, com painel destacado e bloco introdutório em degradê.
- O estado de sucesso ganhou uma entrada visual `Tudo pronto`, mantendo checklist, aceite de termos, preferências de comunicação e botão final sem alteração de lógica.
- O estado sem compra ativa ganhou entrada visual própria de atenção, mantendo a mensagem de compra não encontrada e ações existentes.
- Removido o subtítulo externo da finalização, preservando fluxo, Firebase, rotas, aceite, preferências e salvamento.

## 2026-05-19 — Espelhamento Admin para Master em Configurações
- Arquivos alterados: `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- O salvamento de `Configurações → Geral` passou a espelhar em `system_tenants/{uid}` campos de topo usados pelo Master, como `businessName`, `storeName`, `legalName`, `companyFiscalId`, `fiscalDocument`, descrição, avatar e WhatsApp da loja.
- O salvamento de `Configurações → Usuário` passou a gravar aliases compatíveis para responsável e WhatsApp, incluindo `fullName`, `responsibleName`, `ownerWhatsappFull` e `userWhatsappFull`.
- Mantida a gravação original em `config/geral`, `config/conta_usuario` e nos objetos `store`/`accountAddress`, sem alterar Master, rotas, permissões ou estrutura de tela.
- Ajuste posterior: o espelhamento de `Geral` passou a atualizar também `name`, `fiscalCountry`, `store.region`, `store.province`, `store.postalCode`, `store.fiscalCountry` e números separados de telefone/WhatsApp, cobrindo os campos lidos na aba `Negócio` do Master.
- Ajuste posterior: o campo `URL pública calculada` no Master passou a usar o padrão atual `https://bocafood.app/{slug}`, e a dica do slug foi atualizada para `Loja Online → Link da loja`.
- Ajuste posterior: o card de prévia do negócio em `Configurações → Geral` ganhou acabamento mais premium, com fundo off-white, brilho suave, sombra difusa, logo mais valorizada e resumo visual mais agradável da marca.
- Ajuste posterior: removido o texto explicativo interno do card de prévia para deixar a visualização da marca mais limpa.
- Ajuste posterior: o card de prévia passou a exibir o número do documento fiscal, endereço, telefone, WhatsApp e redes sociais cadastradas de forma organizada, com estados discretos para campos ainda não informados.
- Ajuste posterior: o documento fiscal foi movido para a linha de badges ao lado do país e as redes sociais foram removidas da prévia do negócio.

## 2026-05-20 — Destino do banner promocional mobile
- Arquivos alterados: `public/js/modules/catalogo.js`, `public/index.html`, `AI_CHANGELOG.md`.
- O card `Banner promocional` do Template da loja passou a mostrar campos condicionais no bloco `Mostrar no mobile`: ao escolher `Abrir página da promoção`, aparece busca de promoção; ao escolher `Abrir produto da promoção`, aparece busca de produtos vinculados a promoções; ao escolher `Abrir todas as promoções`, não aparece seletor extra.
- O template público agora salva e respeita `mobilePromoBannerProductId`/`promoBannerProductId`, abrindo o produto promocional escolhido quando o destino do banner é produto.
- Mantida compatibilidade com os campos antigos de promoção e destino do banner, sem alterar rotas, Firebase, permissões ou estrutura principal do template.
- Ajuste posterior: a prévia da faixa do topo no card `Banner promocional` ficou mais próxima dos campos acima, com menos espaçamento vertical e altura mais compacta.
- Ajuste posterior: o botão `Mostrar no mobile` foi renomeado para `Mostrar banner promocional` e passou a controlar a exibição do banner promocional tanto no desktop quanto no mobile.
- Ajuste posterior: removido o botão separado `Mostrar no desktop`; a imagem desktop do banner promocional ganhou card de upload próprio, com orientação de tamanho recomendado e sem campo visível de URL.
- Ajuste posterior: os uploads de imagem do banner promocional mobile e desktop ocultam os campos técnicos de URL, mantendo apenas envio, preview e orientações visuais para a usuária.
- Ajuste posterior: a imagem do banner promocional desktop foi movida para dentro do mesmo card do banner, logo abaixo da imagem mobile, mantendo mobile e desktop agrupados no mesmo bloco.
- Ajuste posterior: o banner promocional no template público recebeu acabamento mais chamativo e premium, com overlay mais apetitoso, brilho sutil, sombra reforçada, CTA com mais presença e textos padrão em espanhol para incentivar a ação do cliente.
- Ajuste posterior: o card `Imagem de capa` foi movido para antes de `Banner promocional` e recebeu o mesmo padrão visual de layout, com switch no topo, uploads desktop/mobile agrupados, URLs técnicas ocultas e configurações de sobreposição ao lado.
- Ajuste posterior: o template público passou a escolher a imagem de capa correta por viewport, usando capa mobile em telas pequenas e capa desktop em telas maiores, respeitando o controle `Mostrar imagem de capa`.
- Ajuste posterior: removido o espaço entre o card principal da loja e o banner promocional no template público, zerando o respiro superior do conteúdo e o intervalo entre hero e conteúdo no desktop.
- Ajuste posterior: as imagens de capa desktop e mobile ficaram independentes no Admin; o campo mobile não herda mais visualmente a imagem desktop nem salva a desktop como mobile. O fallback continua apenas na prévia/loja pública quando uma das versões não foi configurada.
- Ajuste posterior: no template mobile público, a navegação rápida por chips foi movida para logo abaixo do header/card principal e antes do banner promocional, com comportamento sticky leve para facilitar navegação pelo cardápio.
- Ajuste posterior: o banner promocional mobile ficou mais compacto e menos pesado visualmente, com overlay mais leve, altura menor, sombra mais suave e CTA preservado sem dominar a primeira dobra.
- Ajuste posterior: o banner promocional público agora só aparece quando há promoção ativa vinculada, evitando bloco vazio ou genérico antes dos produtos.
- Ajuste posterior: a área de destaque/mais pedidos passou a vir logo após navegação e promoção, aproximando o fluxo de compra dos produtos.
- Ajuste posterior: a faixa do topo e o banner promocional foram removidos da interface do Template da loja e da loja pública. Os campos antigos ficaram ocultos para compatibilidade e para não apagar configurações já salvas.
- Ajuste posterior: no desktop, a imagem de capa passou a preencher toda a área do hero com `cover`, posição central e degradê inferior mais leve para deixar a imagem ocupar melhor o espaço visual.
- Ajuste posterior: no desktop, o hero deixou de parecer um card arredondado; a imagem de capa agora atravessa toda a área superior da loja e o carrinho fica sobreposto à capa.

## 2026-05-21 — Ajustes no topo mobile da loja pública
- Arquivos alterados: `public/index.html`, `AI_CHANGELOG.md`.
- A imagem de capa do hero no mobile passou a ficar limitada ao topo do card, terminando visualmente próxima à metade da logo, sem alterar o comportamento do hero no desktop.
- Ajuste posterior: a capa mobile foi levemente estendida para passar pela logo e chegar mais próxima da metade do card principal, mantendo o desktop inalterado.
- Ajuste posterior: o fundo geral da loja pública foi unificado em uma única superfície clara para tela, conteúdo, barra de categorias e rodapé, mantendo o hero como exceção por usar a imagem de capa.
- Ajuste posterior: o card `Destaque da casa` passou a usar a mesma base clara da página, inclusive no degradê da imagem, evitando sensação de fundo diferente.
- Ajuste posterior: no mobile, o degradê dinâmico da imagem do `Destaque da casa` passou a usar a cor clara real da página, e os botões `Iniciar sesión` e `Ver promociones` foram equalizados em altura, peso e alinhamento.
- Ajuste posterior: no mobile, a `Cor da sobreposição da capa` passou a cobrir somente a área real da imagem do hero; a área sem imagem mantém o fundo base da página.
- Ajuste posterior: a sobreposição da capa no mobile foi separada em uma camada própria com altura fixa da imagem, impedindo que a cor configurada alcance a área vazia do hero.
- Ajuste posterior: no mobile, as sombras do card principal e do card `Destaque da casa` foram removidas; o desktop permanece com o comportamento visual anterior.
- Ajuste posterior: no mobile, o degradê do card principal foi removido para manter a mesma base clara da página; o desktop permanece inalterado.
- Ajuste posterior: no mobile, a transição entre a imagem do hero e o fundo ganhou uma sombra/degradê sutil na cor da marca, sem alterar o desktop.
- Ajuste posterior: o efeito de transição mobile entre hero e fundo ficou mais presente, com área maior e reforço radial na cor da marca.
- Ajuste posterior: a bolsinha do topo foi removida, mantendo apenas o carrinho fixo/visível da loja; o botão de busca recebeu cursor e estados de hover/click.
- Ajuste posterior: o botão `Iniciar sesión` foi refinado para aproximar o ícone do texto e alinhar melhor sua altura visual ao botão `Ver promociones`.
- Ajuste posterior: o bloco `Destaque da casa` foi redesenhado como card herói de produto, com composição inspirada na referência `CARD PRINCIPAL.png`: badge suave, nome/preço em destaque, CTA vermelho, imagem integrada à direita e degradê de transição sobre a foto.
- Ajuste posterior: o botão de busca do topo passou a abrir um painel de busca de produtos, filtrando por nome, descrição, código/SKU e categoria, com resultados clicáveis para abrir o produto.
- Ajuste posterior: removido o card de dica inicial do painel de busca; agora a área fica vazia até a cliente digitar e só mostra estado vazio quando não encontra produto.
- Ajuste posterior: removido o efeito de card externo da barra `Menu de categorias` da vitrine, mantendo apenas os botões de categoria e o comportamento sticky.
- Ajuste posterior: removido da aba `Vitrine` do Admin o card `Menu de categorias`, mantendo dados e funções antigas sem exibição para compatibilidade.
- Ajuste posterior: criada na aba `Vitrine` a seção `Ordem das categorias`, permitindo arrastar categorias e salvar a sequência no mesmo campo `categories/{id}.order`; o template público passou a respeitar essa ordem ao montar o menu e as seções.
- Ajuste posterior: a aba `Vitrine` passou a carregar diretamente a coleção `categories`, conectando o card de ordenação às categorias criadas em configurações do produto mesmo quando a tela é aberta direto pelo Template da loja.
- Ajuste posterior: o card `Ordem das categorias` ganhou botões discretos de subir/descer como alternativa ao arrastar, salvando a ordem no mesmo campo `categories/{id}.order`.
- Correção: o salvamento do Template da loja deixou de quebrar a atualização da prévia por uso da paleta de cores antes da inicialização.
- Ajuste posterior: o menu de categorias do template público deixou de exibir entradas automáticas de promoções/descontos, mantendo apenas `Todas`, `Mais pedidos` e categorias reais da loja.
- Ajuste posterior: removido o número visual dos cards em `Ordem das categorias`, deixando apenas nome, quantidade de produtos e ações de ordenação.
- Correção: o checkbox `Ativar destaque` passou a controlar de fato a exibição do card `Destaque da casa` e do título da seção no template público.
- Ajuste posterior: removida a opção `Produto destaque` da configuração do destaque comercial, deixando produtos destacados apenas no card próprio `Destaques da vitrine`.
- Ajuste posterior: o card público `Destaque da casa` passou a respeitar o `Tipo de conteúdo do card`, alternando entre cupom, promoção, produto mais pedido e texto personalizado com ações conectadas aos campos salvos.
- Correção: o seletor `Promoção ativa` do card `Configuração do destaque` passou a reconhecer os campos/status usados pelo módulo de promoções, incluindo datas alternativas e status pausado/finalizado/expirado.
- Ajuste posterior: removido o card `Destaques da vitrine` da aba `Vitrine`; a vitrine passa a usar automaticamente produtos marcados como destaque no cadastro.
- O botão `Ver promoções` foi conectado ao template público: aparece quando há promoção ativa e leva a cliente para a seção de promoções/produtos promocionais.
- O botão `Entrar/Iniciar sesión` passou a abrir um modal de acesso no template público, com textos traduzidos conforme o idioma principal da loja.
- Mantidos carrinho, pedidos, produtos, categorias, promoções, rotas, tenant e Firestore sem alteração estrutural.

## 2026-05-19 — Padrão visual em Compras Configurações
- Arquivos alterados: `public/js/modules/compras.js`, `AI_CHANGELOG.md`.
- A aba `Compras → Configurações` recebeu o mesmo padrão visual aprovado para compras, com abas mais premium, card de filtros em degradê suave, campos off-white e chips de aplicação mais discretos.
- A lista de `Tipos` e `Categorias` foi redesenhada com cards/linhas mais leves, hover sutil, ações alinhadas e textos mais claros para a usuária.
- O modal de criação/edição de tipos e categorias passou a seguir o padrão dos modais de cadastro, com card interno, campos no mesmo estilo dos fornecedores/produtos, select com seta alinhada e rodapé com botões `Cancelar` e `Salvar alterações`.
- Mantidos os mesmos dados, coleções, filtros, paginação, exclusão e salvamento existentes.
- Ajuste posterior: o modal de `Unidades de medida` também passou para o padrão visual aprovado, com card em degradê suave, campos off-white, select com seta alinhada e copy mais clara.
- Ajuste posterior: removidas as descrições auxiliares repetitivas das linhas de `Tipos` e `Categorias`, deixando a listagem mais limpa.
- Ajuste posterior: o título e subtítulo da aba passaram a usar o mesmo padrão de fonte e tamanho da listagem de `Fornecedores`, e a regra foi registrada no `AGENTS.md` para futuras telas administrativas.
- Ajuste posterior: o modal de `Tipos` e `Categorias` foi simplificado, removendo o cabeçalho interno com ícone e texto de apoio para deixar o formulário mais limpo, compacto e alinhado ao padrão visual dos cadastros.
- Ajuste posterior: removido o nome do módulo `Compras` do topo da aba, deixando o cabeçalho mais direto.
- Ajuste posterior: os modais compactos de `Tipos`, `Categorias` e `Unidades` passaram a manter somente o título externo padrão do modal, removendo título/subtítulo interno dos cards para evitar duplicidade visual.
- Ajuste posterior: os campos do modal de `Unidades` foram corrigidos para usar o mesmo padrão direto de input/select do modal de produto, sem wrapper visual estranho.
- Ajuste posterior: as copys de `Tipos` e `Categorias` foram atualizadas para explicar a diferença prática entre natureza do item e agrupamento de organização, orientando melhor a usuária sobre quando usar cada cadastro.
- Ajuste posterior: o subtítulo geral da aba foi simplificado para reforçar organização, agilidade na busca e separação de custos.
- Ajuste posterior: no cadastro de insumo/produto pronto, a label `Tipo de item *` foi ajustada para `Classe do item *`, preservando o mesmo campo e comportamento.
- Ajuste posterior: o cadastro `Tipo` foi removido da interface do módulo Compras para evitar confusão com `Classe` e `Categoria`. A tela de Produtos/Insumos deixou de mostrar filtro, coluna, campo e KPI de tipo; o modal de cadastro passou a usar apenas `Classe do item` e `Categoria`.
- Ajuste posterior: a aba `Compras → Configurações` passou a exibir somente `Categorias`, mantendo os dados antigos de tipo sem apagá-los para compatibilidade, mas sem criar ou editar novos tipos pelo módulo Compras.
- Ajuste posterior: no modal de insumo/produto pronto, os campos `Classe do item`, `Nome` e `Categoria` foram alinhados na mesma linha no desktop, mantendo quebra responsiva no mobile.
- Ajuste posterior: removido o botão/aba interna `Categorias` de `Compras → Configurações`, deixando a lista de categorias aberta diretamente.
- Ajuste posterior: a descrição da seção de categorias foi simplificada para `Categorias organizam itens parecidos no mesmo grupo.`
- Ajuste posterior: a lista de categorias passou a ser ordenada alfabeticamente de forma consistente ao carregar, listar e alimentar selects/filtros.
- Ajuste posterior: removidos os totalizadores de dentro do card de filtros da listagem `Produtos / Insumos`, deixando o card mais limpo.
- Ajuste posterior: o filtro de categorias da listagem `Produtos / Insumos` passou a ser recalculado quando a `Classe` muda, garantindo que categorias incompatíveis sejam ocultadas e seleções antigas sejam limpas.
- Ajuste posterior: o botão `Limpar filtros` da listagem `Produtos / Insumos` agora aparece somente quando há filtro aplicado além do estado padrão da tela.
- Ajuste posterior: o `AGENTS.md` passou a registrar o padrão completo de `Compras → Configurações`, incluindo hierarquia, layout, cards, filtros, botões, campos, modais, paginação, responsividade, cores e tom de copy.
- Ajuste posterior: a página `Registro de compras` recebeu o mesmo padrão de card de filtros das listagens aprovadas, com campos off-white, selects com seta alinhada, botão `Limpar filtros` condicional e remoção do resumo duplicado dentro do filtro, mantendo os KPIs existentes.
- Ajuste posterior: o modal `Nova/Editar compra` passou a seguir o padrão visual dos cadastros aprovados, com cards em degradê suave, campos off-white, selects padronizados, cabeçalhos com ícones discretos e grids mais proporcionais, sem alterar IDs, salvamento ou fluxo financeiro/fiscal.
- Ajuste posterior: o KPI `Fornecedor principal` em `Registro de compras` passou a priorizar o nome comercial do fornecedor, usando o nome fiscal/antigo apenas como fallback.
- Ajuste posterior: no modal de compra, o card `Dados da compra` passou a exibir `Fornecedor` com busca e `Nome comercial` na mesma linha, preenchendo o nome comercial automaticamente ao selecionar o fornecedor.
- Ajuste posterior: a copy do modal `Editar registro de compra` foi refinada para o padrão BocaFood, com títulos e textos mais claros em `Resumo da compra`, `Itens comprados`, `Dados fiscais` e `Pagamento e vencimento`, sem alterar lógica ou salvamento.
- Ajuste posterior: o aviso de compras com contas a pagar já geradas foi reescrito em frase única, orientando a usar `Atualizar compra` para salvar mudanças e sincronizar parcelas.
- Ajuste posterior: a seção `Itens comprados` do modal de compra recebeu uma ajuda colapsável discreta `Como preencher?`, fechada por padrão, com exemplo de preenchimento sem alterar cálculos, labels ou estrutura de dados.
- Ajuste posterior: a copy `Uso em receitas` no cadastro de insumo/produto pronto foi ajustada para explicar que, ao ativar o uso em receitas, o item aparece como ingrediente e seu custo entra no cálculo dos produtos preparados.
- Ajuste posterior: a seção `Compra e custo` do modal de Produtos/Insumos recebeu uma ajuda colapsável discreta `Como preencher?`, fechada por padrão, explicando unidade base, fornecedor padrão, embalagem e conteúdo por embalagem sem alterar cálculos ou estrutura de dados.
- Ajuste posterior: o texto da ajuda `Como preencher?` em `Compra e custo` foi simplificado para explicar, com exemplo de saco de batata, como o sistema usa embalagem e conteúdo para calcular custo por kg/unidade/litro.
- Ajuste posterior: a ajuda `Como preencher?` passou a incluir também o bloco `Exemplo preenchido`, mostrando unidade base, embalagem de compra padrão e conteúdo por embalagem.
- Ajuste posterior: o link `Como preencher?` da seção `Compra e custo` passou a aparecer somente para itens da classe `Insumo`; ao trocar para `Produto`, a ajuda é ocultada.
- Ajuste posterior: o campo `Aproveitamento (%)` ganhou texto de apoio explicando quando usar 100% e quando reduzir a porcentagem por perdas de limpeza, preparo ou descasque.
- Ajuste posterior: a seção `Uso em receitas` foi reorganizada em dois blocos internos leves, separando a ativação do item como ingrediente das receitas e a configuração de aproveitamento, com copy mais clara para a usuária.
- Ajuste posterior: a listagem `Registro de compras` ganhou checkbox por linha, seleção da página, barra de ações em massa e botão individual `Confirmar` para alterar o status de recebimento sem mexer em itens, parcelas ou contas a pagar.
- Ajuste posterior: compras selecionadas podem ter o status alterado em lote para `Pendente`, `Recebida`, `Parcial` ou `Cancelada`, com confirmação antes da atualização e limpeza automática da seleção.
- Ajuste posterior: o botão individual `Confirmar` passou a abrir um modal de recebimento com opções `Recebida`, `Recebida parcial` e `Cancelar compra`; no recebimento parcial, a usuária seleciona os itens recebidos e informa quantidades, deixando o restante registrado como pendente.
- Ajuste posterior: alterações de status para `Recebida` ou `Cancelada` também atualizam um resumo de recebimento por item dentro da compra, preservando compatibilidade com compras antigas.
- Ajuste posterior: a opção `Cancelar compra` foi removida do modal `Confirmar recebimento` e virou ação separada na linha e na barra de seleção em massa, com confirmação própria.
- Ajuste posterior: removidos da barra em massa o select de status e o botão `Alterar status`, mantendo apenas `Confirmar recebimento`, `Cancelar compras` e `Limpar seleção`.
- Ajuste posterior: compras com status `Recebida`, `Parcial` ou `Cancelada` passaram a bloquear edição estrutural; para editar, a compra deve voltar para `Pendente`.
- Ajuste posterior: confirmar recebimento total ou parcial agora exige conta a pagar gerada no Financeiro; se faltar configuração financeira, a compra é aberta para completar os dados antes de confirmar.
- Ajuste posterior: recebimentos de compra passam a registrar movimentações em `estoque_movimentacoes` de forma idempotente, preparando a futura Gestão de Estoque sem alterar saldos diretamente.
- Ajuste posterior: cancelamento de compra remove parcelas pendentes, estorna pagamentos confirmados quando necessário, registra estorno de estoque quando já houve recebimento e marca a compra como `Cancelada`.
- Ajuste posterior: voltar uma compra para `Pendente` cria ajuste de estorno de estoque quando havia recebimento registrado e libera o formulário para edição.
- Ajuste posterior: o botão em massa `Confirmar recebimento` deixou de confirmar direto; com uma compra selecionada abre o modal de recebimento normal, e com várias compras selecionadas pergunta se o recebimento foi completo ou se a usuária quer detalhar uma compra parcial.
- Ajuste posterior: o recebimento parcial agora valida o saldo pendente por item, impedindo receber quantidade maior que o total comprado.
- Ajuste posterior: o modal de recebimento parcial passou a mostrar histórico com data, quantidade recebida e saldo pendente por item.
- Ajuste posterior: novos recebimentos parciais somam ao que já foi recebido e movimentam estoque apenas pela quantidade nova, evitando duplicar entrada.
- Ajuste posterior: compras com recebimento parcial ou qualquer quantidade já recebida não podem mais ser canceladas diretamente; a usuária deve voltar a compra para `Pendente` antes de cancelar.
- Ajuste posterior: removidos os chips totalizadores do cabeçalho de `Registro de compras`, mantendo os KPIs da tela como resumo principal.
- Ajuste posterior: removidos também os chips totalizadores do cabeçalho de `Produtos / Insumos`, mantendo os KPIs e a listagem como resumo principal.
- Ajuste posterior: removidos os chips de resumo do cabeçalho e do card de filtros de `Fornecedores`, deixando a listagem mais limpa e alinhada ao padrão aprovado.
- Ajuste posterior: o `AGENTS.md` passou a registrar que listagens não devem repetir totalizadores no título nem no card de filtros quando já houver KPIs, tabela, paginação ou resumo próprio.
- Ajuste posterior: em `Compras → Configurações`, o botão `+ Adicionar categoria` foi alinhado ao cabeçalho do card e passou a usar classe visual própria no padrão dos botões primários aprovados.
- Ajuste posterior: o `AGENTS.md` passou a registrar que botões principais em cards de configuração devem ficar alinhados ao título do card, com vermelho BocaFood, sombra sutil, hover leve e altura compacta.

## 2026-05-19 — Central de Ajuda do módulo Compras
- Arquivos alterados: `public/js/modules/suporte.js`, `AI_CHANGELOG.md`.
- A Central de Ajuda ganhou o módulo `Compras` como card disponível, com quatro guias: `Registro de compras`, `Produtos / Insumos`, `Fornecedores` e `Configurações`.
- Os guias explicam em linguagem prática como preencher compras, itens comprados, fornecedores, categorias, custos, uso em receitas, aproveitamento, pagamento, parcelas e contas a pagar.
- A copy evita termos técnicos de implementação e foca no que a usuária precisa entender para usar o módulo no dia a dia.
- Não houve alteração em lógica de compras, Firestore, rotas, permissões, Master, cálculos, modais ou salvamento.

## 2026-05-19 — Padrão visual em Receitas de produção
- Arquivos alterados: `public/js/modules/catalogo.js`, `AGENTS.md`, `AI_CHANGELOG.md`.
- A aba `Produção → Receitas` passou a seguir o padrão de listagem definido em Compras, com topo limpo, botão primário alinhado, card de filtros em degradê suave, campo off-white e botão `Limpar filtros` condicional.
- Removidos os chips totalizadores duplicados do cabeçalho e do card de filtros da tela de receitas.
- A busca de receitas passou a filtrar os dados antes da paginação, preservando foco no campo e exibindo estado vazio específico quando o filtro não encontra resultados.
- A paginação passou a contar o total filtrado e o seletor de itens por página ganhou seta alinhada ao padrão visual aprovado.
- O `AGENTS.md` passou a registrar o padrão específico para `Produção → Receitas`, mantendo a orientação de copy prática e sem linguagem técnica.
- Ajuste posterior: o modal `Nova/Editar Receita` recebeu o padrão visual dos modais aprovados, com cards em degradê suave, campos off-white, selects com seta alinhada, grids mais proporcionais, cards de custo mais leves e rodapé com ação principal compacta.
- Ajuste posterior: componentes e linhas de insumos da receita passaram a usar blocos internos mais leves, mantendo os mesmos IDs, cálculos, salvamento e estrutura de dados.
- Ajuste posterior: o `AGENTS.md` passou a registrar o padrão específico do modal de `Produção → Receitas`.

## 2026-05-22 — Operação do Template da loja
- Arquivos alterados: `public/js/modules/catalogo.js`, `public/index.html`, `AI_CHANGELOG.md`.
- Removidos da aba `Template da loja → Operação` os campos sem uso no template público: texto de entrega, texto de retirada e aviso de horário especial.
- A loja pública passou a respeitar entrega/retirada desativadas também no carrinho, escondendo a opção indisponível e mantendo apenas o modo ativo.
- A antecedência configurada em `Dias mínimos de antecedência` agora afeta a geração real de horários disponíveis no checkout.
- O status aberto/fechado passou a usar a grade semanal quando o modo está automático, preservando os estados manuais de aberta/fechada.
- O salvamento do template passou a gerar resumo automático de horário para alimentar o card principal quando a opção de horário resumido estiver ativa.
- Ajuste visual posterior: o card `Entrega e retirada` foi reorganizado em blocos mais compactos, com hierarquia mais clara e campos proporcionais ao conteúdo, preservando os mesmos IDs e lógica.

## 2026-05-21 — Promoções ativas no Template da loja
- Arquivos alterados: `public/js/modules/catalogo.js`, `public/index.html`, `AI_CHANGELOG.md`.
- O seletor `Promoção ativa` do card promocional passou a normalizar promoções vindas de Ações de Vendas, aceitando variações de `id`, status, tipo, datas e produtos vinculados.
- O filtro de promoções ativas agora considera campos alternativos como `dataInicio`, `dataFim`, `startsAt`, `endsAt`, `validFrom`, `validUntil`, `state` e `status`, evitando ocultar promoções válidas por diferença de estrutura.
- A loja pública passou a reconhecer os mesmos campos alternativos para exibir e abrir o card promocional selecionado, sem alterar coleções, rotas ou estrutura salva.
- Correção posterior: o Template da loja passou a carregar também a coleção `promocoes`, além de `promotions`, igual ao módulo de Ações de Vendas. As duas origens são mescladas e normalizadas para alimentar o seletor `Promoção ativa`.
- Correção posterior: promoções normalizadas para o Template agora alinham `enabled` com `active`, evitando que registros legados com `active: true` e `enabled: false` apareçam ativos em Ações de Vendas, mas bloqueados no seletor do Template.
- Correção posterior: a mescla de promoções do Template passou a preferir versões ativas quando há duplicidade entre origens e também inclui promoções derivadas de `product.promo`, cobrindo o mesmo cenário exibido em Ações de Vendas.
- Ajuste posterior: o seletor `Promoção ativa` deixou de bloquear quando há promoções carregadas com status inconsistente, passando a exibir as promoções disponíveis para escolha e mantendo `promotions` como fonte oficial.
- Ajuste posterior: a loja pública também normaliza e mescla `promotions` e `promocoes`, evitando que uma promoção selecionada no Admin deixe de ser encontrada no template por diferença de origem.
- Ajuste posterior: todos os tipos de conteúdo do card de destaque passaram a aceitar imagem, tag, título, subtítulo e CTA editáveis no Template da loja.
- Ajuste posterior: o template público passou a aplicar esses textos/imagem customizados por cima dos dados automáticos de cupom, promoção, mais pedido ou texto personalizado.
- Ajuste posterior: o cabeçalho externo `Destaque da casa / Ver todas` foi ocultado no template público, deixando apenas o card de destaque.
- Ajuste posterior: o menu de categorias da loja pública foi reposicionado para aparecer depois do card de fidelidade e recebeu acabamento mais premium, com hover, superfície translúcida e seleção usando a cor da marca em vez de vermelho fixo.
- Ajuste posterior: a pilha de fontes do template público passou a priorizar `Manrope`, depois `Inter`, mantendo apenas `sans-serif` como fallback técnico.
- Ajuste posterior: removida do Template da loja a configuração duplicada de `Programa de fidelidade`; o card público agora prioriza os campos reais de `config/pontos_program` (`active`, `programName`, `storeText`, `earnPerEuro`) e mantém campos antigos apenas como fallback de compatibilidade.
- Ajuste posterior: o template público ganhou um modal próprio de pontos, aberto pelo botão do card de fidelidade, com consulta por WhatsApp/e-mail, saldo, desconto estimado, regra de resgate e histórico de movimentos quando os dados do tenant estiverem disponíveis.
- Ajuste posterior: a aba `Vitrine` voltou a exibir um card de Programa de Pontos sem duplicar regras, mostrando o resumo de `config/pontos_program` e levando a configuração para `Ações de Vendas → Programa de Pontos`.
- Ajuste posterior: o card público de fidelidade passou a usar a cor da marca nos detalhes antes fixos em vermelho, mantendo as estrelas em amarelo.
- Correção: quando `Status do programa` está inativo em `Ações de Vendas → Programa de Pontos`, o card público de fidelidade agora fica oculto mesmo que existam campos legados de fidelidade no template.
- Ajuste posterior: o modal público de pontos recebeu hierarquia tipográfica mais próxima da prévia do Programa de Pontos no Admin, com títulos 16/700, textos 13px, labels discretas e cards mais leves.
- Ajuste posterior: a prévia do Programa de Pontos foi movida para dentro do card `Identidade do programa`, logo abaixo de status, nome e texto exibido na loja, mantendo a mesma lógica de atualização em tempo real.
- Ajuste posterior: o texto exibido no card público do Programa de Pontos deixou de usar negrito, mantendo a label do campo no padrão do Admin.
- Ajuste posterior: as informações rápidas do card principal da loja pública deixaram de usar negrito, mantendo nome, frase da loja, status `Aberto/Fechado` e link `Mais informações` com a hierarquia anterior.
- Ajuste posterior: o subtítulo/descrição do card de destaque da loja pública deixou de usar negrito, preservando a hierarquia do título, preço e botão.
- Ajuste posterior: removida a borda do elemento gráfico dentro da tag de destaque do card de produto herói, mantendo a borda da tag principal.
- Ajuste posterior: removido do template público o botão `Ordenar` da seção de produtos, mantendo apenas o título da lista.
- Ajuste posterior: removido do template público o título `Todos os produtos / Todos los productos`, deixando a lista começar diretamente pelas categorias.
- Ajuste posterior: removido do modal público de fidelidade o texto inicial pedindo WhatsApp/e-mail; mensagens de status aparecem apenas quando houver resultado ou erro.
- Ajuste posterior: a seção `Mais pedidos` passou a priorizar contadores reais salvos nos produtos (`salesCount`, `orderCount`, `soldCount` e variações), usando produtos marcados como destaque/popular apenas como fallback.
- Ajuste posterior: removido o subtítulo `Favoritos da loja / Favoritos de la tienda` da seção `Mais pedidos`.
- Ajuste posterior: promoções deixaram de aparecer como seção fixa dentro da lista de produtos; o botão `Ver promoções` agora abre uma tela/modal própria com todas as promoções ativas juntas e botão para voltar aos produtos.
- Ajuste posterior: os cards de produto da loja pública foram ajustados conforme a referência visual `card de produto.png`: imagem grande no topo, corpo branco com título forte, linha curta destacada, descrição, preço grande no rodapé e botão `+` quadrado usando a cor da marca.
- Ajuste posterior: o preço dos cards de produto passou a usar preto, mantendo a cor da marca no botão de adicionar e nos detalhes.
- Ajuste posterior: a tag do banner promocional foi restaurada ao padrão anterior, mantendo a nova tag amarela apenas nos cards de produto.
- Ajuste posterior: a seção `Mais pedidos / Más pedidos` passou a exibir os produtos em carrossel horizontal, mantendo as demais categorias no grid padrão.
- Ajuste posterior: revertida a compactação dos cards de produto, restaurando as proporções aprovadas antes do pedido de carrossel e mantendo apenas `Mais pedidos / Más pedidos` em carrossel.
- Ajuste posterior: refinada a proporção final aprovada dos cards de produto, mantendo imagem grande, corpo branco mais equilibrado, preço preto, botão de adicionar proporcional e `Mais pedidos / Más pedidos` em carrossel sem afetar as demais categorias.
- Ajuste posterior: reduzido o espaçamento entre as linhas de texto dos cards de produto para deixar título, destaque e descrição mais próximos.
- Ajuste posterior: o botão `+` dos cards de produto foi centralizado internamente e alinhado visualmente ao preço no rodapé.
- Ajuste posterior: o modal de produto do template público foi aproximado da referência `template para ver.html`, mantendo a lógica atual de carrinho, produtos e pedidos. A experiência ganhou folha inferior mais premium, imagem de destaque, variantes com progresso, opções selecionadas com destaque, complementos em layout mais claro, rodapé fixo e botão com total atualizado.
- O modal também passou a fechar ao clicar fora, atualizar `aria-hidden` corretamente e orientar melhor quando houver opções obrigatórias pendentes, sem alterar Firestore, rotas, tenant ou estrutura de dados.
- Correção posterior: a varredura de lógica do modal de produto alinhou os complementos e o `Perfecto con` ao template de referência. Complementos vinculados por ID agora aparecem mesmo quando estão ocultos da vitrine, o produto sugerido em `pairing` ganhou bloco próprio e os complementos são adicionados como itens separados no carrinho, evitando multiplicação indevida quando a quantidade do produto principal muda.
- Correção posterior: o cadastro de produto passou a salvar escolhas de combo e grupos de variantes também em `variants`, formato lido diretamente pelo template público. O template ganhou fallback para `menuChoiceGroups`, leitura de `tags` como badge do produto e uso de `imageAlt` na imagem do card.
- Ajuste posterior: o modal de produto do Admin ganhou campo de descrição completa, usado no modal público do produto, e o salvamento deixou de apagar `pairing` existente quando não há edição específica desse campo.
- Ajuste posterior: o cadastro de produto passou a salvar `productType: "combo"` para produtos com escolhas/menu e ganhou seleção visual do produto `Perfecto con`, mantendo `pairing`, `pairingId` e `pairingProductId` alinhados para o template público.
- Ajuste posterior: o modal público passou a tratar combos com comportamento próprio: quantidade inicial zero, seletor `¿Cuántos quieres?` antes das escolhas, opções bloqueadas até escolher quantidade, botão final desativado enquanto a quantidade estiver zerada e layout desktop de combo com imagem ampla no topo.
- O bloco de complementos do modal público passou a respeitar o título configurado no cadastro (`addAlsoTitle`), preservando a lógica de adicionar complementos e produto sugerido como itens separados no carrinho.
- Correção: o total do modal passou a calcular acréscimos de variantes pelo total escolhido, evitando multiplicar extras duas vezes quando um combo tem quantidade maior que 1.
- Correção: a loja pública passou a carregar `variantGroups` e usar `variantGroupIds` como fallback quando o produto ainda não possui `variants` materializado, restaurando a exibição de variantes antigas ou globais no modal do produto.
- Correção: as tags exibidas nos cards e no modal do produto agora usam as cores escolhidas no cadastro (`bgColor`/`textColor`) e mantêm `badgeColor`/`badgeTextColor` apenas como fallback.
- Ajuste posterior: o cadastro de grupos de variantes passou a permitir marcar obrigatoriedade, mínimo e máximo por item adicionado, valor extra ou desconto por opção e foto opcional por opção.
- Ajuste posterior: o modal público passou a respeitar mínimo e máximo separadamente, exibir acréscimos e descontos corretamente, e deixar a opção sem área de imagem quando nenhuma foto estiver cadastrada.
- Ajuste posterior: a tag do produto deixou de exibir elemento gráfico antes do texto e preserva também a cor da fonte escolhida pela usuária no cadastro.
- Correção: o modal de cadastro de produto voltou a abrir após adicionar helper local para fallback de textos e expor handlers usados pelos campos de preço e prévia do produto.
- Ajuste posterior: no cadastro do produto, os grupos de variantes agora mostram as opções apenas quando a variante está marcada para aquele produto, exibindo nome, valor extra/desconto e foto quando existir.
- Correção posterior: a prévia das opções de variantes no cadastro do produto passou a normalizar os campos de foto e preço, mostrando acréscimo, desconto ou `Sem acréscimo`, e renderizando imagem somente quando houver foto válida cadastrada.
- Correção posterior: a loja pública passou a carregar a coleção de tags do tenant e resolver a tag do produto por id/texto, preservando cor de fundo e cor da fonte escolhidas pela usuária também quando o produto salva apenas referência da tag.
- Ajuste visual: o modal público do produto foi refinado com fundo mais premium, imagem com tratamento visual, tipografia mais forte, seções de opções mais leves, seleção com destaque sutil e rodapé de compra mais conversor, sem alterar a lógica de carrinho, variantes ou pedidos.
- Ajuste visual posterior: removida a borda do bloco de quantidade `¿Cuántos quieres?` no modal público do produto, mantendo a sombra para preservar o destaque leve.
- Funcionalidade: criada camada de cálculo promocional no template público, usando promoções ativas de `promotions/promocoes` para aplicar desconto percentual, valor fixo, preço fixo, 2x1/leve-pague e frete grátis na vitrine, modal, carrinho, WhatsApp e pedido salvo, preservando cupons como desconto separado.
- Ajuste visual posterior: o bloco de upsell/complementos do modal público recebeu visual mais conversor e o botão totalizador ficou verde, maior e centralizado; no preço promocional do modal, a tag de desconto foi removida e o valor cheio passou a aparecer riscado ao lado, sem negrito.
- Ajuste visual posterior: removidas as bordas externas e linhas internas dos cards de variação no modal público do produto, mantendo fundo, sombra e destaque de seleção.
- Funcionalidade: quando um produto de upsell/complemento no modal público possui variações, o botão de adicionar abre a seleção das variações dentro do próprio bloco antes de somar o item, e o item relacionado é enviado ao carrinho com as escolhas e acréscimos selecionados.
- Ajuste visual posterior: microcopies e preços antigos riscados no template público passaram a usar peso normal, sem negrito, incluindo preço antes da promoção no card, modal e carrinho.
- Ajuste posterior: no cadastro do produto, o card `Perfecto con` foi removido da interface e `Aumentar valor do pedido` passou a aceitar apenas 1 produto selecionado por vez, listando todos os produtos ativos do cardápio como candidatos.
- Correção posterior: o cadastro do produto deixou de descartar itens de `Aumentar valor do pedido` ao reabrir/salvar quando o produto sugerido possui variantes ou estrutura diferente de produto simples.
- Correção posterior: no modal público do produto, itens de `Aumentar valor do pedido` com variantes agora abrem a seleção de opções na primeira tentativa de adicionar, inclusive quando as variantes são opcionais.
- Ajuste posterior: no modal público, variantes de itens de `Aumentar valor do pedido` só podem ser escolhidas depois que o produto sugerido foi adicionado; variantes obrigatórias pendentes bloqueiam o botão final até a escolha ser completada.
- Ajuste posterior: tags nos cards de produto passaram a resolver também referências simples por texto/id para aplicar a cor de fundo e fonte escolhidas no cadastro da tag.
- Ajuste visual posterior: a página/modal de promoções recebeu cards compactos próprios, visual mais premium e sem barras de rolagem visíveis; o template também oculta a barra de rolagem visual do site mantendo a rolagem funcional.
- Ajuste visual posterior: no modal público do produto, o espaçamento entre título e descrição curta foi reduzido para deixar a leitura mais compacta.
- Ajuste visual posterior: o card de Programa de Pontos passou a exibir cursor de clique ao passar o mouse, mantendo o título do bloco de upsell limpo.
- Correção posterior: a tag exibida nos cards de produto deixou de ser sobrescrita por regra global de cor e agora usa variáveis próprias para respeitar fundo e texto cadastrados pela usuária.
- Ajuste visual posterior: removida a sombra do card de variantes dentro do modal público do produto, mantendo o bloco mais leve.
- Funcionalidade: conectado o modal de acesso do template público para login/criação de acesso de cliente final com e-mail/senha ou Google, salvando/atualizando o cliente em `store_customers` do tenant.
- Ajuste posterior: o modal de Programa de Pontos agora mostra o bloco de login/cadastro quando não há cliente logado e conecta os botões `Iniciar sesión` e `Crear acceso` ao modal de acesso correto.
- Ajuste posterior: as resenhas da loja pública passaram a aparecer em carrossel horizontal, sem contador de resenhas aprovadas e sem efeito degradê no card.
- Correção posterior: o card de resenha agora tenta vincular produto por ID, slug, SKU ou nome normalizado, além de usar imagem do próprio review quando existir, para exibir imagem e nome do produto citado.
- Ajuste posterior: o carrossel de resenhas ganhou arraste por mouse/toque no template público.
- Ajuste posterior: a nota de avaliação do card principal agora respeita o toggle do Template, aceita médias já salvas como fallback e aparece em destaque com estrelas ao lado, na mesma linha da localização quando houver espaço.
- Ajuste posterior: o menu de categorias do template público também ganhou arraste horizontal por mouse/toque.
- Ajuste visual posterior: todos os textos do rodapé da loja pública passaram a usar preto, mantendo o nome da loja em negrito.
- Ajuste posterior: as estrelas da nota no card principal agora acompanham a avaliação arredondada, em vez de sempre exibir cinco estrelas.
- Funcionalidade: quando a cliente já está logada no template público, o botão do avatar agora abre um modal de conta com dados da cliente, acesso aos pontos quando o programa está ativo e ação para sair; quando não há login, continua abrindo o modal de acesso.
- Ajuste visual posterior: os botões `+` do template público passaram a usar verde conversor, e o CTA de avaliação ganhou tom claro da cor da marca.
- Funcionalidade: o modal de conta e o checkout da loja pública passaram a pedir WhatsApp da cliente e salvar o dado em `store_customers`, junto ao endereço de entrega, para reutilização em próximas compras.
- Ajuste posterior: quando a cliente está logada, o checkout tenta preencher automaticamente WhatsApp e endereço salvos, mantendo a edição disponível no carrinho e no modal de conta.
- Ajuste visual posterior: o campo de WhatsApp da cliente no checkout e no modal de conta passou a seguir o padrão de DDI + número usado na aba Usuário do Admin.
- Ajuste visual posterior: o modal de conta da cliente ficou mais compacto, mostrando WhatsApp/endereço em resumo e abrindo os campos de edição somente ao clicar em `Editar`.
- Ajuste posterior: o card `Dirección de entrega` do modal de conta da loja pública ficou mais compacto e o campo de endereço passou a usar a mesma busca/autocomplete do Google já aplicada no carrinho, preenchendo rua, número, bairro, código postal, cidade e província quando disponível.
- Correção: a autenticação da cliente na loja pública passou a configurar persistência local antes de login, cadastro e Google, evitando que o estado logado se perca ao fechar modais e mantendo pontos, conta e checkout usando a mesma sessão.
- Correção posterior: o modal de Programa de Pontos passou a consultar também o usuário atual do Firebase Auth antes de exibir `Iniciar sesión` e `Crear acceso`, ocultando esses botões quando a cliente já está logada.
- Ajuste posterior: removida a frase `Aquí guardamos tus datos para que puedas comprar más rápido.` do modal de conta da cliente na loja pública, ocultando o subtítulo quando não houver texto configurado para o idioma.
- Correção posterior: o bloco de login/cadastro do modal de Programa de Pontos agora é ocultado por classe, `display` e `aria-hidden` quando existe cliente logada, evitando que `Iniciar sesión` e `Crear acceso` reapareçam ao abrir pontos a partir do modal de conta.
- Ajuste visual posterior: o botão `Ver promociones` passou a usar fundo claro na cor da marca, e os campos do card `Dirección de entrega` foram reorganizados em grid mais compacto com número/piso proporcionais, bairro e código postal na mesma linha, e localidade/província lado a lado.
- Ajuste posterior: removido do modal de conta da cliente o botão `Cerrar sesión`, mantendo somente o botão de fechar do modal no topo.
- Ajuste visual posterior: o botão `Ver promociones` passou a seguir o mesmo padrão visual do CTA de avaliações, com fundo claro na cor da marca, borda suave, sombra leve e tipografia menos pesada.
- Correção visual posterior: reforçada a regra final do botão `Ver promociones` para igualar o CTA de avaliações também após os estilos do topo e do mobile, mantendo fundo claro, borda sutil e texto na cor da marca.
- Ajuste visual posterior: o card `Dirección de entrega` do modal de conta foi reorganizado em duas colunas fixas para campos curtos, deixando número/piso, bairro/código postal e localidade/província lado a lado, enquanto busca de rua e sugestões ocupam a linha inteira.
- Correção posterior: a busca do Google no campo `Dirección de entrega` do modal de conta passou a cancelar retornos antigos, limpar a lista após seleção e aceitar clique/toque nas sugestões, evitando que a lista continue aberta ou não aplique o endereço escolhido.
- Correção posterior: o card `Dirección de entrega` mantém duas colunas também no mobile, e o botão `Ver puntos` do modal de conta agora impede propagação do clique, confirma a sessão atual e abre apenas o modal de pontos sem acionar logout.
- Correção posterior: a busca de endereço do checkout passou a usar a mesma proteção da busca do modal de conta, cancelando retornos antigos do Google, limpando sugestões após seleção, aceitando clique/toque e reinicializando o autocomplete quando os campos de entrega ficam visíveis.
- Correção posterior: o salvamento do cadastro da cliente na loja pública passou a usar a sessão real do Firebase Auth como fallback, gravando WhatsApp e endereço em `store_customers` com campos de compatibilidade (`deliveryAddress`, `defaultDeliveryAddress`, `addressData`, endereço estruturado e telefone).
- Correção posterior: o carrinho da loja pública passou a usar `storeAuthUser()` para reconhecer a sessão real da cliente ao abrir, renderizar e enviar pedido, evitando que cliente logada seja tratada como convidada quando `currentStoreUser` ainda não sincronizou.
- Correção posterior: os campos de rua do checkout e do cadastro da cliente deixaram de usar a lista nativa do Google Places, que aparecia com outro formato e podia continuar aberta após a seleção; agora ambos usam apenas a lista BocaFood alimentada pelo Google Geocoder e escondem qualquer dropdown nativo remanescente após escolher endereço.
- Correção posterior: fechar o carrinho deixou de manter modais de checkout abertos e o envio por WhatsApp agora espera a restauração inicial da sessão do Firebase antes de pedir login/criação de acesso, evitando tratar cliente logada como convidada por atraso do Auth.
- Correção posterior: o botão `Ver puntos` dentro do modal de edição do cadastro da cliente agora espera a sessão do Firebase, fecha o modal de conta e abre o modal de pontos em seguida, evitando que a troca de modais falhe.
- Correção posterior: o fechamento do modal de cadastro da cliente agora bloqueia propagação do clique, limpa sugestões de endereço e revalida a sessão atual antes de atualizar o botão do avatar, evitando que fechar o modal pareça encerrar a sessão.

- Funcionalidade: o cadastro da cliente e o checkout da loja pública passaram a trabalhar com agenda de endereços de entrega em `store_customers`, permitindo salvar endereços com nome, validar o código postal contra as zonas atendidas e reutilizar os endereços salvos no carrinho. Mantidos os campos legados `deliveryAddress`, `defaultDeliveryAddress`, `addressData` e campos planos para compatibilidade.

- Correção: o envio do pedido pelo WhatsApp no carrinho público passou a preservar explicitamente a sessão atual da cliente antes e depois do envio, deixou de tentar salvar endereço vazio em pedidos de retirada e agora mostra uma confirmação de sucesso dentro do carrinho após abrir o WhatsApp.

- Ajuste visual e funcional: no modal de conta da cliente, o WhatsApp foi separado da agenda de endereços, mantendo um único contato para todos os endereços. O cadastro de endereço agora abre somente pelo botão de adicionar, salva e retorna para uma lista de cards com os endereços cadastrados.

- Correção: o pedido enviado por WhatsApp agora abre um modal real de confirmação no template público, com título, texto, referência do pedido e botão traduzidos pela camada de idioma da loja.

- Correção: o botão `Añadir dirección` no modal de conta da cliente agora limpa corretamente os campos do formulário antes de cadastrar novo endereço, evitando reabrir o endereço anterior como edição.

- Correção: o WhatsApp da cliente passou a ser preservado ao salvar endereços, não é mais sobrescrito por valor vazio, espelha imediatamente para o checkout e valida o campo antes de gravar no cadastro da cliente.

- Ajuste: após enviar o pedido por WhatsApp, o template público agora salva o pedido, limpa o carrinho, fecha o painel do carrinho e deixa visível apenas o modal de confirmação do pedido enviado.

- Correção: a loja pública passou a buscar diretamente `store_customers/{uid}` quando a sessão da cliente é restaurada pelo Firebase Auth, mesclando WhatsApp e endereços salvos antes de preencher carrinho e modal de conta. Isso evita que, ao atualizar a página publicada, os dados cadastrados pareçam apagados quando a listagem inicial de clientes ainda não trouxe o documento completo.

- Ajuste visual: a primeira dobra mobile da loja pública recebeu uma camada de padronização para hero, card principal, botões superiores, logo, textos de informação e início do conteúdo, reduzindo pesos excessivos, alinhando espaçamentos e mantendo o desktop preservado.

- Ajuste visual posterior: os botões superiores da primeira dobra mobile da loja pública passaram para 40px de altura, com avatar de 30px e texto levemente maior para melhorar toque e legibilidade em celular.

- Ajuste visual posterior: o card principal mobile da loja pública ganhou mais respiro inferior, apresentação curta maior, informações rápidas mais legíveis e peso menor no nome da loja, mantendo a composição compacta da primeira dobra.

- Ajuste visual: o modal de cadastro da cliente na loja pública foi refinado com resumo mais leve, WhatsApp separado dos endereços, lista de endereços em cards compactos, formulário de endereço em grid proporcional e remoção de texto vazio no cabeçalho/resumo quando não há mensagem a exibir.

- Correção visual: os campos curtos do cadastro de endereço da cliente agora quebram em pares de duas colunas, evitando que número, piso, bairro, código postal, localidade e província fiquem comprimidos na mesma linha.

- Ajuste visual: o botão `Ver promoções` no topo da loja pública recebeu fundo claro mais evidente baseado na cor da marca, mantendo borda e sombra leves.

- Correção visual: reforçado o fundo do botão `Ver promoções` nas regras finais do template para impedir que estilos duplicados o deixem transparente no topo da loja pública.

- Ajuste visual: o card `Destaque da casa` no mobile ficou mais compacto e conversor, com imagem integrada, título menos pesado, preço em preto, CTA verde e selo de destaque mais discreto.

- Ajuste visual: o card de Programa de Pontos no mobile foi refinado com fundo claro na cor da marca, estrelas mais discretas, hierarquia mais leve e CTA com área de toque maior.

- Ajuste visual: removido o degradê do card principal mobile da loja pública, mantendo fundo limpo, borda na cor da marca e sombra leve.

- Ajuste visual: o modal `Ver promoções` da loja pública recebeu cabeçalho mais leve, cards de promoção com borda suave, badges menos pesados e produtos com imagem, texto, preço e botão `+` mais alinhados para mobile.

- Ajuste visual: o modal de Programa de Pontos/Fidelidade foi refinado com saldo em destaque, desconto e regra em cards mais leves, estado de login mais premium e histórico em cards compactos menos administrativos.

- Ajuste visual: os botões de categoria da loja pública ficaram mais confortáveis no mobile, com altura maior para toque, espaçamento de carrossel melhor, peso de fonte mais leve e estado ativo em tom claro da cor da marca.

- Ajuste visual: os cards de produto da loja pública foram refinados no mobile com tipografia menos pesada, preço menor, descrição mais compacta, botão `+` mais alinhado e tags mais delicadas.

- Ajuste visual: o modal de produto da loja pública foi refinado no mobile para lidar melhor com muitas opções, com imagem mais controlada, textos menos pesados, seções de variação mais claras, upsell mais compacto, observação menor e rodapé de compra mais alinhado.

- Ajuste visual: o card/carrossel de resenhas da loja pública ficou mais leve e premium, com slides mais compactos, borda suave, quote mais legível, produto citado integrado e CTA de avaliação preservado fora do card.

- Ajuste mobile: o formulário de cadastro de endereço da cliente passou a usar campos mais confortáveis no celular, em duas colunas proporcionais e com fonte mínima de 16px para evitar zoom automático ao tocar nos inputs em iPhone/Safari.

- Ajuste mobile: os campos do carrinho da loja pública foram revisados para celular, com inputs/selects em 16px, altura mínima mais confortável, grade de endereço em duas colunas e campos de data, horário, pagamento, cupom e WhatsApp alinhados para reduzir zoom automático e melhorar o toque.

- Correção visual: os overlays dos modais da loja pública passaram a ocupar `100dvh` com rolagem interna no painel, evitando que o fundo defumado ou o próprio modal pareçam terminar antes do fim da tela no celular.

- Ajuste mobile: os botões do modal de produto ficaram maiores e com área de toque mais segura no celular, incluindo stepper de variações, quantidade principal, combo, botão de adicionar, observação e fechar, reduzindo toques fora do alvo e zoom indesejado.

- Correção visual: a camada defumada dos modais da loja pública passou a ser renderizada como pseudo-elemento fixo independente do painel, cobrindo toda a viewport no mobile e evitando cortes quando o conteúdo do modal rola.

- Correção visual: o botão de adicionar no modal de produto foi padronizado entre produto simples e combo; quando o item é combo e o seletor de quantidade fica no topo, o rodapé vira uma única coluna e o botão ocupa a largura correta.

- Ajuste mobile: o menu de categorias da loja pública recebeu uma camada final de refinamento com botões mais confortáveis para toque, rolagem horizontal com snap, estado ativo mais elegante na cor da marca e fundo sutil para funcionar como navegação rápida do cardápio.

- Ajuste visual: o rodapé da loja pública foi refinado com logo maior, marca mais presente, informações em linhas organizadas, redes sociais com área de toque maior e respiro inferior adequado para mobile.

- Correção funcional: o status aberto/fechado do card principal da loja pública deixou de calcular pela grade de horários e passou a apenas espelhar o estado gravado pelo Admin/topo, usando `manual_open`, `manual_closed`, `manualOpen`, `manualClosed`, `isOpen` e campos explícitos equivalentes.

- Correção mobile: adicionada contenção de overflow horizontal no template público da loja, ajustando largura de containers, hero, cards, barra fixa do pedido, WhatsApp flutuante, imagens e chips de categoria para impedir movimento lateral da página no celular.

- Ajuste de carregamento: a loja pública agora abre com um skeleton premium e mantém o conteúdo principal oculto até aplicar dados, tema, imagens e blocos essenciais, reduzindo saltos visuais de logo, banner, nome, cards e cores ao abrir ou recarregar a página.

- Correção mobile: removida a contenção aplicada em ancestrais da loja pública que prendia elementos `fixed`, restaurando o comportamento fixo do botão `Ver pedido`, WhatsApp flutuante, modal de produto e carrinho, mantendo a proteção horizontal apenas nos blocos visuais seguros.

- Correção de carregamento: o skeleton da loja pública agora espera as imagens críticas e fontes ficarem prontas antes de liberar o conteúdo principal, evitando que capa, logo, destaque, produtos e tipografia apareçam montando depois do carregamento inicial.

- Ajuste de carregamento: a loja pública recebeu um estado real de preparação, com tela elegante, prévia estrutural, status por etapa e barra de progresso suave enquanto dados, tema, imagens e fontes são carregados antes de exibir o conteúdo final.

- Ajuste visual: o carregamento da loja pública foi simplificado para um spinner elegante com texto curto, mantendo a espera por dados, imagens e fontes sem excesso de informação visual.

- Ajuste visual: removida a sombra projetada debaixo do card principal da loja pública, preservando apenas acabamento interno suave para manter o topo mais limpo.

- Ajuste mobile: a busca de produtos da loja pública foi refinada com campo maior para toque, foco mais claro, painel sticky, botão de fechar mais delicado e resultados no mesmo grid dos cards de produto.

- Correção mobile: o card principal voltou a permitir overflow visível no celular e a logo recebeu camada própria, evitando que a parte que sai do card seja cortada.

- Ajuste desktop: a loja pública recebeu uma camada de refinamento exclusiva para desktop, com hero mais proporcional, conteúdo com largura útil limitada, grid de produtos mais equilibrado, tipografia menos exagerada e carrinho lateral mais integrado.

- Correção de carregamento: o template público ganhou timeout de segurança e finalização idempotente do loading, evitando que o overlay borrado permaneça preso no desktop caso imagens, fontes ou alguma etapa visual demorem demais.

- Ajuste visual: removido o blur do overlay de carregamento da loja pública, mantendo apenas fundo claro e spinner para evitar sensação de tela borrada enquanto o conteúdo prepara.

- Correção de carregamento: removido definitivamente o blur do loading, a loja deixa de ficar invisível por classe de carregamento e foi adicionado um fallback inline inicial para esconder o overlay mesmo se o fluxo principal não finalizar.

- Correção desktop: o overlay de carregamento foi desativado apenas na versão desktop e os `backdrop-filter` principais foram neutralizados nessa largura, eliminando a tela borrada no computador sem alterar a experiência mobile.

- Correção desktop: o loading da loja pública agora é removido imediatamente no desktop por script inicial, antes do fluxo principal, mantendo a tela de carregamento apenas para mobile.

- Correção desktop: o carrinho lateral deixou de herdar a altura/overlay dos modais no desktop, removendo o pseudo-fundo borrado do `cart-sheet` e preservando apenas o painel lateral.

- Ajuste desktop: o grid de produtos da loja pública passou a manter três colunas fixas no desktop, evitando que cards fiquem largos demais quando uma categoria tem poucos produtos.

- Ajuste desktop: o modal de produto da loja pública foi refinado com proporção maior e mais equilibrada, imagem lateral mais consistente, corpo com melhor respiro, opções mais legíveis e rodapé de ação alinhado para desktop.

## 2026-05-24 — Padrão de cadastro na aba Atendimento do Template da loja
- Arquivos alterados: `public/js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- A aba `Loja Online > Template da loja > Atendimento` passou a usar o padrão visual de cadastro aprovado: cards suaves em degradê, borda clara, campos off-white, foco discreto e organização em larguras proporcionais.
- Os blocos de contatos, redes sociais, endereço público, rodapé e botão flutuante do WhatsApp foram reorganizados para reduzir peso visual e deixar campos curtos ocupando apenas o espaço necessário.
- WhatsApp e telefone mantêm a mesma lógica de DDI + número, agora em controle visual alinhado ao padrão dos formulários do Admin.
- As opções de exibição no rodapé passaram a usar checkboxes limpos, sem aparência de mini-card, preservando os mesmos IDs e salvamento.

## 2026-05-24 — Horários da loja com segundo período independente
- Arquivos alterados: `public/js/modules/catalogo.js`, `public/admin.html`, `public/index.html`, `AI_CHANGELOG.md`.
- A configuração de horários em `Loja Online > Template da loja > Operação` agora trata o 2º período como uma janela independente, com o próprio controle `Fechada`.
- O checkbox `Fechada` do primeiro período deixou de ser alterado visualmente pelo cálculo automático de status, evitando que o horário 2 mude a configuração do horário 1.
- O status automático do topo do Admin e da loja pública passou a avaliar o primeiro e o segundo período separadamente, permitindo que um período esteja fechado sem bloquear o outro.
- Ajustada a sincronização visual dos campos de horário para que cada checkbox atualize imediatamente apenas os campos do próprio período, sem depender de recarregar a prévia.
- Atualizada a versão do `catalogo.js` carregada no Admin para evitar teste com arquivo antigo em cache.
- Corrigido o cálculo automático para horários que cruzam meia-noite: um período do próprio dia com fechamento menor que abertura só abre a partir do horário inicial, e a madrugada só é considerada quando o período começou no dia anterior.
- Reforçado o estado visual do checkbox `Fechada` nos horários, aplicando classe marcada diretamente no componente além do estado nativo do input.
- O bloco `Status público da loja` ficou mais compacto e deixou de usar card com fundo/borda, mantendo apenas texto e seletor alinhados.

- Ajuste desktop: o modal de produtos combo deixou de virar layout em coluna no desktop; agora mantém imagem lateral, área ampla para escolhas, grupos de opções em duas colunas e botão final ocupando a largura correta.

- Ajuste mobile: o rodapé da loja pública foi refinado com fundo mais premium, logo maior, informações mais organizadas e menor espaçamento final abaixo do rodapé.

- Ajuste desktop: o modal de produto da loja pública passou para composição vertical no desktop, com foto no topo e conteúdo abaixo, reduzindo campos amontoados e melhorando a leitura de produtos simples e combos.

- Ajuste comercial: o modal de promoções da loja pública passou a destacar benefício, economia e quantidade de produtos por oferta, deixando a experiência mais focada em conversão.

- Ajuste comercial: cards de produto com promoção agora exibem benefício/economia de forma discreta, além de preço promocional e preço anterior riscado quando aplicável.

- Ajuste comercial: o modal de produto agora mostra a economia da promoção junto ao preço quando o item possui promoção ativa, preservando a lógica promocional existente.

- Ajuste de checkout: a área de entrega do carrinho da loja pública recebeu uma microcopy dinâmica para orientar a cliente passo a passo, explicando código postal, endereço, data/horário e revisão antes do envio pelo WhatsApp.

- Ajuste de checkout: a validação do código postal agora mostra uma mensagem mais humana quando a loja entrega ou não entrega na região, incluindo zona, valor de entrega e pedido mínimo quando configurados.

- Ajuste de checkout: a lista de endereços salvos no carrinho passou a perguntar em qual endereço a cliente quer receber o pedido, deixando a escolha mais clara e menos administrativa.

- Ajuste de checkout: endereços salvos no carrinho passaram a abrir em um seletor interno compacto, em vez de aparecerem como lista sempre aberta.

- Ajuste de checkout: a opção de guardar endereço para próximas compras agora aparece apenas quando a cliente está preenchendo um endereço novo.

- Ajuste de checkout: a pergunta de data e horário da entrega ganhou o texto `¿Cuándo quieres recibir tu pedido?`, guiando a cliente antes dos campos de agendamento.

- Ajuste visual: a informação de zona e valor da entrega recebeu destaque em formato de pílula leve na cor da marca.

- Ajuste de checkout: removida a mensagem dinâmica de endereço pronto antes da escolha de data e horário, mantendo apenas a pergunta direta de quando a cliente quer receber o pedido.

- Ajuste de checkout: adicionada orientação antes do código postal para explicar que ele deve ser preenchido quando a cliente quer receber o pedido em um endereço novo.

- Ajuste de checkout: a aba de retirada agora identifica claramente o endereço de retirada e também pergunta quando a cliente quer receber o pedido antes de data/horário.

- Ajuste de idioma: as novas orientações do carrinho para endereço salvo, endereço novo, retirada e agendamento passaram a respeitar o idioma ativo da loja pública.

- Ajuste visual: o total do carrinho passou a ficar em preto, evitando que ele use a cor da marca como destaque excessivo.

- Ajuste comercial: removido o totalizador de economia do grupo no modal de promoções; a economia permanece no card de cada produto, onde o valor faz sentido.

- Ajuste visual: o card de Programa de Pontos na loja pública manteve a borda externa leve e passou a usar a linha lateral interna no amarelo das estrelas.

- Ajuste visual: o texto descritivo do card de Programa de Pontos na loja pública passou a usar 13px para melhorar leitura.

- Ajuste mobile: reduzido o respiro final do rodapé da loja pública para diminuir o espaço vazio no fim da página.

- Implementação: o carrinho da loja pública passou a permitir resgate de pontos para clientes logadas, usando a regra do Programa de Pontos para calcular desconto no pedido.

- Implementação: o desconto de pontos aparece no resumo do carrinho, no texto enviado pelo WhatsApp e no pedido salvo em Firestore como `pointsDiscountTotal` e `pointsRedemption`.

- Implementação: ao enviar pedido com pontos, o sistema registra o uso em `points_movements` e reduz o saldo da cliente em `store_customers`, mantendo a visualização local atualizada.

- Ajuste de checkout: o texto antes do código postal agora explica que ele deve ser usado para endereço novo ou quando a cliente ainda não tem endereço cadastrado.

- Correção de vitrine: a loja pública agora mantém uma renderização de segurança para exibir todos os produtos carregados quando nenhum produto casar com as categorias, evitando a sensação de que os produtos do tenant sumiram por inconsistência de categoria.

- Correção de rota local: quando a loja pública é aberta com `?tenant=...`, o template deixa de tentar interpretar `index.html` como slug de loja e passa a carregar diretamente o tenant informado.

- Ajuste de vitrine: a categoria automática de mais pedidos deixou de duplicar a categoria `mais-pedidos` quando ambas existem no tenant.

- Reversão controlada: removida a camada de resgate de pontos dentro do carrinho público para estabilizar o checkout. O Programa de Pontos permanece visível para consulta, mas não altera total, WhatsApp, pedido salvo ou saldo da cliente nesta etapa.

- Correção de conexão da loja pública: o template voltou ao estado versionado antes das mudanças de carrinho/pontos e recebeu apenas ajustes de leitura do tenant por `?tenant=...`, fallback de categoria dos produtos e proteção para exibir produtos carregados mesmo quando a categoria estiver inconsistente.

- Ajuste comercial: o card de produto e o modal de produto da loja pública passaram a exibir o benefício da promoção ativa junto ao preço, deixando a oportunidade mais evidente sem alterar a regra de cálculo promocional.

- Ajuste de checkout: a opção `Guardar esta dirección para próximas compras` agora aparece apenas quando a cliente está preenchendo um endereço novo no carrinho; ao selecionar um endereço já salvo, o bloco fica oculto e desmarcado.

- Ajuste visual: as informações do card principal da loja pública foram padronizadas em 13px e o rodapé deixou de parecer um card arredondado, ficando contínuo com a página, mais compacto e sem espaço vazio no fim.

- Ajuste visual: o rodapé da loja pública recebeu fundo suave na cor da marca, organização sem bolinhas, divisórias leves e respiro inferior para não ficar coberto pela barra fixa no mobile.

## 2026-05-24 — Padrão de Compras Configurações em Cardápio Configurações
- Arquivos alterados: `public/js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- A tela `Cardápio > Configurações` passou a usar o padrão visual aprovado de `Compras > Configurações`, com título mais compacto, subtabs leves, cards brancos/off-white, bordas suaves e botões primários discretos.
- As áreas de categorias, variantes e tags foram reorganizadas visualmente com listas mais limpas, ações alinhadas à direita, estados vazios mais leves e menor excesso de peso visual.
- Os modais de categoria, variante e tag receberam o padrão de cadastro com card interno premium, campos off-white, hierarquia mais clara e botões com copy objetiva.
- O bloco de categorias foi simplificado para trabalhar apenas com o nome da categoria, removendo imagem/ícone da lista e os campos de emoji/ícone e link/imagem do modal.
- Impacto esperado: a configuração do cardápio fica coerente com o padrão do Admin sem alterar rotas, Firebase, permissões, coleções, IDs de campos ou lógica de salvamento.

## 2026-05-24 — Padrão de modais de cadastro em Configurações
- Arquivos alterados: `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- Os modais legados de `Configurações` para fornecedor e unidade de medida passaram a usar o padrão visual de cadastro do Admin, com card interno em degradê sutil, bordas suaves, campos off-white e rodapé com ações alinhadas.
- O modal de unidade recebeu grid proporcional para nome, símbolo e tipo, mantendo o campo curto de símbolo no tamanho adequado e select com seta interna.
- O modal de fornecedor recebeu campos mais claros para nome, contato e observações, com copy voltada ao uso da loja.
- Impacto esperado: os cadastros auxiliares de Configurações ficam coerentes com o padrão aprovado sem alterar lógica, Firebase, rotas, permissões ou estrutura de dados.

## 2026-05-24 — Validação dos links públicos da loja
- Arquivos alterados: `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- A tela `Loja Online > Link da loja` passou a exibir apenas os links públicos com uso real hoje: loja pública e avaliações.
- O salvamento do identificador agora bloqueia nomes reservados como `admin`, `login`, `cadastro`, `master`, `termos`, `privacidade`, `review`, `track` e `api`.
- Foi adicionada validação contra slug já usado por outro tenant antes de salvar ou publicar.
- O documento `public_stores/{slug}` deixa de ser marcado como `active` apenas por salvar o link; agora só fica ativo quando a loja está publicada.
- A copy do card `Última publicação` deixou de expor o texto técnico `Data registrada em system_tenants`.
- Removido o card informativo `Endereço público da loja` da tela, deixando o fluxo mais direto.
- Impacto esperado: evita link público quebrado, conflito entre tenants e exposição da loja antes da publicação, preservando os campos internos legados para compatibilidade.

## 2026-05-24 — Imagem das opções no modal de variantes
- Arquivos alterados: `public/js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- O modal de variantes em `Cardápio > Configurações` passou a exibir a imagem de cada opção no padrão do cadastro de produto, com prévia, botão `Enviar imagem`, botão `Remover imagem` e ajuda curta.
- A remoção limpa o valor salvo no campo oculto da opção e a prévia, sem alterar a estrutura de salvamento das variantes.
- As linhas de opções foram reorganizadas com mais largura para o nome da variante, colunas proporcionais e botão de remoção alinhado ao conjunto de campos.
- Impacto esperado: a edição de fotos das opções fica clara e consistente com o restante do Admin.

## 2026-05-24 — Padrão de cadastro em Loja Online > Link da loja
- Arquivos alterados: `public/js/modules/configuracoes.js`, `AI_CHANGELOG.md`.
- A tela `Loja Online > Link da loja` passou a usar uma camada visual escopada no padrão de cadastro do Admin, com cards em degradê sutil, bordas suaves, campo off-white para o identificador e ações alinhadas.
- O card do link principal, o bloco de identificador, a lista de links, o aviso informativo e o rodapé de salvamento foram reorganizados para ficar mais limpos e consistentes com o padrão aprovado.
- A copy foi ajustada para dar protagonismo ao identificador/subdomínio da usuária, deixando o domínio BocaFood apenas como endereço gerado pelo sistema.
- Impacto esperado: a gestão do link público fica mais premium e clara para a usuária, sem alterar lógica de slug, publicação, Firebase, rotas, permissões ou estrutura de dados.

## 2026-05-24 — Documentação do template público da loja
- Arquivos alterados: `PUBLIC_STORE_TEMPLATE_GUIDE.md`, `AI_CHANGELOG.md`.
- Criado guia consolidado do template público da loja com padrões de mobile, desktop, card principal, cards de produto, modal de produto, promoções, Programa de Pontos, avaliações, carrinho, rodapé, WhatsApp, idiomas, loading e checklist de validação.
- A documentação registra decisões visuais e funcionais para orientar próximas alterações sem perder o padrão aprovado.

## 2026-05-24 — Pedidos da loja pública na cozinha
- Arquivos alterados: `public/index.html`, `public/js/modules/pedidos.js`, `AI_CHANGELOG.md`.
- Pedidos enviados pelo template público da loja agora são salvos com `channel: "cardapio"`, `source: "template"`, `originSource: "storefront"`, `originChannel: "template"`, `kitchenQueue: true` e `kitchenStatus: "Pendente"`.
- A tela de cozinha passou a reconhecer pedidos antigos vindos do template público, `store` ou `storefront`, além do canal `cardapio`.
- Impacto esperado: o pedido continua aparecendo na lista de pedidos e passa a entrar também no painel de cozinha para acompanhamento operacional.

## 2026-05-24 — Template da loja herda redes sociais de Integrações
- Arquivos alterados: `public/js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- A aba `Loja Online > Template da loja > Atendimento` passou a carregar `config/integracoes` junto das demais configurações da loja.
- Os campos de WhatsApp, Instagram, Facebook e TikTok agora usam os dados de `Configurações > Integrações` como herança quando o template não tiver valor próprio.
- Ao salvar o atendimento do template, os canais sociais também atualizam `config/integracoes` preservando os dados de medição, como GA4, GTM e Meta Pixel.
- Impacto esperado: redes sociais e WhatsApp ficam consistentes entre Integrações, Template da loja e template público, sem duplicidade visual para a usuária.
- Ajuste visual: somente o controle `Mostrar contatos` do rodapé passou a usar botão liga/desliga discreto; as opções individuais de canais continuam como checkboxes simples.
- Refinamento visual: o botão `Mostrar contatos` manteve o liga/desliga, mas sem fundo nem borda própria para ficar mais leve no card de rodapé.
- Ajuste de endereço: ao selecionar endereço no autocomplete de `Localização principal`, o campo principal passa a manter apenas o nome da rua; número, bairro, cidade, região, código postal e país seguem preenchidos nos campos próprios.
- Refinamento visual: os campos de WhatsApp e telefone em `Canais de atendimento` perderam a moldura externa composta; DDI e número agora aparecem como campos leves separados, alinhados aos demais inputs.

## 2026-05-24 — Padrão de cadastro na aba Checkout do Template da loja
- Arquivos alterados: `public/js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- A aba `Loja Online > Template da loja > Checkout` passou a usar o padrão visual de cadastro aprovado nos blocos de pagamentos e finalização do pedido.
- Os cards de formas de pagamento ficaram mais leves, com degradê sutil, borda suave, menor peso visual e instruções em campos off-white.
- As opções de observação, cupom e textos dos botões passaram a usar campos e checkboxes alinhados ao padrão dos formulários do Admin.
- Impacto esperado: a configuração do checkout fica mais compacta, premium e coerente com as abas Operação e Atendimento, sem alterar IDs, rotas, Firebase, permissões ou lógica de salvamento.

## 2026-05-24 — Conexão dos campos de Checkout com a loja pública
- Arquivos alterados: `public/index.html`, `AI_CHANGELOG.md`.
- O template público passou a respeitar formas de pagamento desativadas no Admin, exibindo apenas métodos ativos em `paymentMethodConfigs`.
- O campo `Permitir observação do cliente no pedido` agora controla a exibição da observação no carrinho e limpa o valor quando estiver desativado.
- O campo `Permitir cupom` agora oculta o bloco de cupom quando estiver desativado, mesmo que existam cupons cadastrados.
- Os textos configurados para `Ver pedido` e para o botão final passam a sobrescrever os textos padrão do idioma.
- A observação geral de pagamento configurada no Checkout passou a aparecer junto das instruções da forma de pagamento no carrinho.

## 2026-05-24 — Padrão de cadastro na aba Textos do Template da loja
- Arquivos alterados: `public/js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- A aba `Loja Online > Template da loja > Textos` passou a usar o padrão visual de cadastro aprovado, com cards leves, campos off-white, bordas suaves e hierarquia mais clara.
- Os textos de apresentação, aviso importante, política de entrega e política de cancelamento foram reorganizados em blocos funcionais sem alterar IDs, salvamento, rotas, Firebase, permissões ou estrutura de dados.
- Impacto esperado: a edição dos textos do modal público de informações da loja fica mais limpa, compacta e coerente com as abas Operação, Atendimento e Checkout.

## 2026-05-24 — Chips de resumo em tempo real no Template da loja
- Arquivos alterados: `public/js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- Os chips de resumo do `Template da loja` agora são recalculados em tempo real ao editar campos, marcar checkboxes, trocar selects ou alterar imagens.
- Foram conectados resumos de logo, capa, entrega, retirada, card principal, atendimento, endereço, pagamentos, checkout, WhatsApp e textos informativos ao mesmo fluxo de atualização da prévia.
- Impacto esperado: a usuária vê o estado da configuração imediatamente, sem precisar atualizar a página para os chips refletirem as mudanças.

## 2026-05-24 — Padrão de listagem em Cardápio > Produtos
- Arquivos alterados: `public/js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- A página `Cardápio > Produtos` recebeu o padrão visual de páginas de listagem do Admin no topo, filtros, estado vazio, lista e paginação.
- O card de filtros passou a usar fundo branco/off-white, borda suave, campos off-white, labels claros e botão `Limpar filtros` somente quando houver busca, filtro ou ordenação aplicada.
- Foram removidos chips repetidos de resumo do cabeçalho e do card de filtros; os cards de KPI foram mantidos como estavam.
- Os selects de categoria, visibilidade, ordenação e itens por página passaram a usar seta interna com respiro, alinhada ao padrão dos modais/cadastros.
- Impacto esperado: a listagem fica mais limpa, alinhada ao padrão de fornecedores/compras e mais fácil de escanear, sem alterar lógica, Firebase, rotas, permissões ou estrutura de dados.

## 2026-05-24 — Padrão de modal em Cardápio > Produtos
- Arquivos alterados: `public/js/modules/catalogo.js`, `AI_CHANGELOG.md`.
- O modal de cadastro/edição de produto recebeu uma camada visual escopada no padrão de modais aprovado: cards com degradê sutil, bordas suaves, sombra leve, campos off-white e foco discreto.
- Foram ajustadas a hierarquia dos blocos de dados do produto, tipo de produto, escolhas do combo, organização/variantes, observação interna, dados fiscais e rodapé de ações.
- A copy do bloco fiscal deixou de mencionar preparação futura e passou a explicar o uso prático dos dados.
- Impacto esperado: o modal fica mais premium, alinhado e fácil de preencher, sem alterar IDs, lógica, Firebase, rotas, permissões ou estrutura de dados.

## 2026-05-24 — Fluxo próprio de upsell no carrinho da loja pública
- Arquivos alterados: `public/index.html`, `AI_CHANGELOG.md`.
- O carrinho do template público passou a avaliar regras ativas de `upsellRules` próprias para carrinho/checkout, sem forçar benefícios complexos dentro do modal do produto.
- Foram adicionados cálculos para desconto de carrinho, combo com preço fechado, leve/pague, brinde condicionado e frete grátis quando a regra e o pedido cumprem as condições configuradas.
- O resumo do carrinho passou a exibir uma área discreta de benefícios de upsell, linha de desconto própria e economia total considerando promoções, upsell, cupom e pontos.
- O pedido salvo agora registra `upsellDiscountTotal`, `upsellBenefits`, origem do frete grátis por upsell quando aplicável e mantém metadados de regras aplicadas para conferência no Admin.
- Impacto esperado: regras de upsell de carrinho passam a ter um fluxo seguro e rastreável, evitando descontos incorretos no modal do produto e refletindo os benefícios no WhatsApp e no pedido salvo.
- Ajuste de comportamento: benefícios de upsell no carrinho não são mais aplicados automaticamente. Quando o gatilho da regra é atingido, a loja abre um modal de sugestão; o desconto, brinde, combo, leve/pague ou frete grátis só entra no pedido se a cliente aceitar.
- Refinamento visual: o modal de upsell do carrinho ganhou apresentação mais vendedora, com destaque de benefício, imagem maior, microcopy de desejo, selo de oportunidade e CTA verde mais forte para incentivar a aceitação sem alterar a lógica.
- Refinamento de copy: os textos do modal de upsell deixaram de explicar a regra de forma técnica e passaram a usar uma linguagem mais comercial, natural e orientada a desejo para a cliente final.
- Ajuste de tom: removida a frase impessoal “recomendação da loja” no modal de upsell; a copy agora fala de forma direta com a cliente.
- Internacionalização: as copies do modal de upsell do carrinho passaram a usar textos localizados em `pt-BR`, `pt-PT`, `es-ES`, `en` e `fr`, respeitando o idioma principal configurado na loja.
