# Guia do Template Público da Loja

Este documento registra o padrão atual do template público da loja BocaFood. Ele deve ser usado como referência antes de alterar a loja publicada, principalmente em `public/index.html`.

## Fonte de Verdade

- A loja publicada usa os arquivos dentro de `public/`.
- O arquivo principal do template público é `public/index.html`.
- Arquivos duplicados na raiz são referência/legado, salvo quando a tarefa pedir explicitamente.
- Toda alteração visual ou funcional da loja publicada deve acontecer em `public/`.

## Princípios Gerais

- Textos vistos pelo cliente final devem respeitar o idioma configurado da loja.
- O template público deve parecer um app de pedido premium, leve e direto.
- Evitar excesso de negrito. Usar peso visual apenas em nome da loja, status aberto/fechado, preço, CTA e pontos realmente importantes.
- Evitar aparência de banner publicitário pesado.
- Usar a cor da marca da loja como destaque, não como cor dominante em todas as áreas.
- Não criar cards vazios quando não houver dados reais.
- Elementos visuais devem respeitar o tenant/loja carregado.

## Mobile

O mobile é a experiência principal do cliente.

Padrões:
- Evitar scroll horizontal.
- Não usar elementos internos com `width: 100vw` quando houver padding/margem.
- Usar `max-width: 100%` e `box-sizing: border-box`.
- Botões tocáveis devem ter altura confortável para dedo.
- Modais devem cobrir a tela de forma estável e rolar internamente quando necessário.
- Overlay de modal deve cobrir toda a viewport.
- Barra fixa de pedido não pode cobrir informações importantes do rodapé.

## Desktop

No desktop:
- O carrinho permanece como sidebar lateral/sticky.
- O carrinho não deve virar overlay com blur no desktop.
- A vitrine deve usar grid equilibrado.
- Cards de produto devem manter proporção consistente, mesmo quando há poucos produtos.
- O modal de produto no desktop usa composição vertical com imagem no topo e conteúdo abaixo.

## Card Principal da Loja

O card principal apresenta a marca e deve ser claro, compacto e premium.

Conteúdos:
- Logo da loja.
- Nome comercial.
- Apresentação curta.
- Nota de avaliação, quando ativada e houver dados.
- Localização.
- Status aberto/fechado.
- Horário resumido.
- Entrega/retirada.
- Pedido mínimo, tempo ou informações rápidas configuradas.
- Link `Mais informações`.

Padrões:
- Informações rápidas usam `13px`.
- Nome da loja mantém hierarquia maior.
- Apresentação curta deve ser leve, sem excesso de negrito.
- Status aberto/fechado pode manter destaque.
- Separadores entre informações devem ser discretos.
- O card mobile não deve ocupar altura excessiva antes da lista de produtos.
- No desktop, preservar a experiência própria do desktop.

## Mais Informações

O botão `Mais informações` abre um modal premium com:
- Sobre a loja.
- Aviso importante.
- Política de entrega.
- Política de cancelamento.
- Endereço, horários e contatos quando configurados.

Regras:
- Não mostrar campos vazios.
- Não usar linguagem técnica.
- Bordas e divisórias devem ser suaves.
- O texto deve ser simples e útil para o cliente decidir o pedido.

## Categorias

O menu de categorias deve:
- Ficar em carrossel horizontal.
- Permitir arrastar no mobile.
- Usar nomes em preto.
- Usar a cor da marca apenas no estado ativo/destaque.
- Não exibir `Promoções` como categoria fixa do menu.
- Não exibir `Todos los productos` como texto desnecessário.

A categoria `Más pedidos` deve trazer lista real dos produtos mais pedidos quando houver dados suficientes.

## Cards de Produto

Padrão atual:
- Imagem em destaque.
- Nome do produto.
- Descrição curta compacta.
- Tag do produto quando cadastrada, usando cor de fundo e cor da fonte escolhidas pela usuária.
- Preço em preto.
- Preço antigo riscado quando houver promoção.
- Benefício da promoção visível quando houver promoção ativa.
- Botão `+` verde, conversor e alinhado.

Regras:
- A tag cadastrada pela usuária não deve receber elemento gráfico extra.
- A tag deve preservar cor de fundo e cor da fonte configuradas.
- Produtos com promoção devem deixar clara a oportunidade, sem transformar o card em propaganda pesada.
- Espaçamento interno deve ser compacto e legível.

## Modal de Produto

O modal de produto deve vender bem sem quebrar a lógica.

Deve exibir:
- Imagem do produto no topo.
- Nome.
- Descrição.
- Preço final.
- Preço anterior riscado quando houver promoção.
- Benefício da promoção quando houver.
- Variações/opções quando configuradas.
- Fotos de variantes somente quando cadastradas.
- Campo de observação do produto.
- Upsell/complementos quando configurados.
- Botão principal verde e grande o suficiente para toque.

Regras:
- Não alterar cálculo de variações, promoções ou carrinho sem tarefa explícita.
- Produtos combo podem ter regras de quantidade/opções diferentes, mas o botão principal deve seguir o mesmo padrão visual.
- Variações não devem ter sombra pesada.
- A seleção de variação de upsell só deve acontecer quando o produto do upsell for adicionado.
- Observação do produto deve ser enviada junto com o pedido.

## Promoções

As promoções devem aparecer de forma comercial e clara.

Padrões:
- O botão `Ver promociones` abre a tela/modal com promoções.
- Não deve existir uma seção fixa de promoções no corpo da vitrine.
- O modal de promoções deve destacar benefício, produto, preço final e preço anterior quando houver.
- Não usar totalizador geral de economia se cada produto tem desconto diferente.
- Ao clicar em produto dentro das promoções, abre o modal do produto.
- Ao fechar o modal do produto, volta para o modal de promoções.

Regras:
- Promoções devem usar a camada de cálculo promocional do template público.
- Produto com promoção também deve refletir benefício no card e no modal.

## Programa de Pontos

O card do Programa de Pontos:
- Fica na vitrine quando o programa estiver ativo.
- Usa a cor da marca onde houver destaque vermelho, mantendo estrelas amarelas.
- Texto descritivo usa `13px`.
- Deve abrir modal de pontos ao clicar.

Modal de pontos:
- Se cliente estiver logado, mostra saldo, regras, pontos a expirar e histórico quando disponível.
- Se cliente não estiver logado, pede login ou criação de acesso.
- Não deve pedir WhatsApp quando já houver fluxo de login.
- Botões de login/criação não aparecem para cliente já logada.

Observação:
- A camada de resgate de pontos no carrinho já foi testada, mas foi revertida para estabilizar checkout. Programa de Pontos permanece para consulta.

## Avaliações

Regras:
- Se não houver avaliação publicada, não exibir título `Reseñas / Ver todas`.
- Deve existir CTA para deixar avaliação.
- A página de avaliação deve respeitar o idioma configurado da loja.
- A URL de avaliação deve usar slug da loja, não tenant visível.
- Se a avaliação mencionar produto e houver imagem/nome disponível, o card deve exibir esses dados.
- `Ver todas` abre modal com todas as resenhas.
- Resenhas na página aparecem em carrossel quando aplicável.
- A nota no card principal deve aparecer apenas quando ativada e deve respeitar a nota real.

## Carrinho e Checkout

O carrinho deve guiar o cliente até o envio por WhatsApp.

Padrões:
- Mobile usa modal/bottom sheet.
- Desktop usa sidebar/sticky.
- Carrinho vazio deve ter estado bonito, com botão de fechar.
- Ao enviar pedido por WhatsApp, o pedido é salvo e o carrinho deve ser limpo.
- Após envio, mostrar confirmação de pedido enviado.
- A mensagem enviada por WhatsApp deve conter itens, variações, observações, subtotal, entrega, total, endereço, horário e pagamento.
- O pedido enviado pelo template público deve aparecer na lista de pedidos e também entrar no painel de cozinha.
- Pedidos da loja pública devem ser salvos como fila de cozinha (`kitchenQueue`) e canal operacional de cardápio, preservando origem do template para rastreio.

Entrega:
- A pergunta principal é em qual endereço a cliente quer receber o pedido.
- Endereços salvos abrem em seletor interno compacto.
- Se for endereço novo, orientar a cliente a começar pelo código postal.
- A opção `Guardar esta dirección para próximas compras` aparece apenas em endereço novo.
- Endereço novo só deve ser salvo para cliente logada e quando for atendido pela loja.
- Endereço e WhatsApp da cliente devem ser persistidos no cadastro quando aplicável.

Retirada:
- Deve deixar claro que o endereço mostrado é o endereço de retirada da loja.
- Deve perguntar quando a cliente quer receber/retirar o pedido.

Agendamento:
- Data deve ser escolhida em calendário.
- Horários devem respeitar dias e horários configurados pela loja.
- Antecedência significa até quantos dias à frente a cliente pode pedir, não a partir de quantos dias.

Pagamento:
- Forma de pagamento deve ser select.
- Cupom deve ficar próximo da forma de pagamento.
- Resumo deve destacar subtotal, promoções/descontos, economia e total com boa hierarquia.

## Rodapé

O rodapé atual:
- Deve ser contínuo com a página, sem parecer card solto.
- Não deve ter cantos arredondados.
- Deve ter fundo suave na cor da marca.
- Deve ter respiro inferior suficiente no mobile para não ficar coberto pela barra fixa de pedido.
- Não deve mostrar bolinhas antes das informações.
- Deve ocultar campos vazios.
- Deve mostrar logo da loja ao lado do nome, quando houver logo configurada.
- Deve mostrar endereço completo de atendimento e horários quando configurados.
- Textos devem ser pretos, leves e legíveis.
- Nome da loja pode ficar em negrito.

## WhatsApp Flutuante

O WhatsApp flutuante:
- Deve ser uma bolinha flutuante, não um botão dentro de `Ver pedido`.
- Deve usar uma logo de WhatsApp bonita e limpa.
- Não deve ter linha branca em volta.
- Tooltip/frase inicial não precisa ficar fixa.
- Mensagem deve respeitar configuração da loja quando existir.

## Idiomas

O template deve usar uma camada real de textos por idioma.

Regras:
- Textos fixos do cliente final devem vir de `UI_TEXT` ou função equivalente.
- Espanhol é o idioma principal esperado para clientes finais no mercado atual.
- Não adicionar copy fixa em português dentro do template público quando aparecer para o cliente.
- Admin pode estar em português, mas loja pública deve respeitar idioma configurado.

## Loading

Carregamento:
- A loja não deve parecer que está montando na frente do cliente.
- Mobile pode usar estado real de loading simples e elegante.
- Desktop não deve ficar com blur preso.
- Evitar exibir dados padrão e depois trocar por dados reais.
- Reservar espaço para imagens principais para reduzir pulos de layout.

## O Que Evitar

- Excesso de negrito.
- Cards dentro de cards sem necessidade.
- Bordas e sombras pesadas.
- Elementos vermelhos quando a cor da marca é outra.
- Barras de rolagem internas desnecessárias.
- Campos ou dados técnicos visíveis ao cliente.
- Duplicar promoções como seção fixa e modal ao mesmo tempo.
- Alterar lógica de pedido, carrinho, tenant, Firestore ou promoções ao fazer apenas ajuste visual.

## Checklist Antes de Alterar o Template

Antes de finalizar qualquer alteração em `public/index.html`:

- Verificar se mobile não tem scroll horizontal.
- Verificar se desktop não herdou regra mobile.
- Conferir se o carrinho desktop continua sidebar/sticky.
- Conferir se os textos novos respeitam idioma.
- Conferir se campos vazios não aparecem.
- Conferir se promoções continuam calculando corretamente.
- Conferir se avaliações e Programa de Pontos continuam condicionais.
- Rodar validação dos scripts inline.
- Rodar `git diff --check`.
- Atualizar `AI_CHANGELOG.md`.
