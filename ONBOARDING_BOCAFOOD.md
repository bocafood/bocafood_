# Onboarding BocaFood

## Objetivo
O onboarding deve ensinar a usuaria a entender o BocaFood antes de pedir que ela preencha telas.

A experiencia nao deve parecer uma visita tecnica ao software. Ela deve mostrar como o sistema ajuda a organizar o negocio de comida, criar uma rota, colocar a rotina para funcionar e acompanhar evolucao real.

## Estrutura definida

### 1. Boas-vindas
Antes de abrir checklist ou explicar modulos, mostrar um popup curto e emocional.

Direcao de copy:
- falar sobre o negocio da usuaria, nao sobre o BocaFood;
- gerar expectativa realista;
- deixar claro que o primeiro objetivo e montar a base para vender com mais clareza;
- manter linguagem simples e proprietaria.

Exemplo de linha:
`bora construir seu imperio de comida na Europa?`

### 2. Primeiro passeio: como o BocaFood funciona
Antes dos modulos, o passeio precisa explicar a logica da interface:
- menu lateral;
- Inicio como atalho da rotina;
- cards como leituras e proximas acoes;
- botoes principais;
- filtros;
- listagens;
- modais;
- badges, cores e status;
- configuracoes como base que alimenta todo o sistema.

A usuaria deve entender:
- onde clicar;
- o que e resumo;
- o que e acao;
- o que e filtro;
- quando algo salva ou apenas filtra;
- que modais sao janelas para criar, editar ou ver detalhes.

### 3. Segundo passeio: logica do negocio
Depois da interface, explicar a ordem natural para gerar valor:
1. preencher cadastro e dados do negocio;
2. criar canais de venda;
3. definir regras de preco e margem;
4. cadastrar produtos;
5. cadastrar receitas/fichas tecnicas;
6. cadastrar despesas, custos e formas de pagamento;
7. criar o primeiro Plano de Voo;
8. criar a primeira Temporada;
9. configurar cardapio online;
10. iniciar a rotina com compras e pedidos.

Mensagem central:
`O BocaFood nao comeca pela venda. Ele comeca pela base que faz a venda fazer sentido.`

### 4. Terceiro passeio: modulos principais
Somente depois explicar os modulos:
- Configuracoes;
- Cardapio;
- Producao;
- Financeiro;
- Loja Online;
- Pedidos;
- Plano de Voo;
- Temporadas;
- Performance;
- Maturidade.

### 5. Checklist flutuante
Depois do passeio, abrir a janela fixa no canto com fases:
- Base do negocio;
- Produtos e custos;
- Rota de crescimento;
- Loja pronta para vender;
- Primeira rotina.

Cada item deve ter:
- titulo claro;
- frase simples;
- botao/acao para abrir a tela certa;
- check automatico quando os dados ja existem.

### 6. Comportamento esperado
- O passeio pode ser pulado e revisto depois.
- A janela flutuante aparece em todas as telas enquanto houver passos pendentes.
- O scroll fica travado durante o passeio.
- O popup deve ficar perto do elemento destacado quando possivel.
- O progresso deve ser salvo por navegador/usuario via estado local atual.

## Padrao visual
Usar a identidade visual da tela Maturidade:
- fundo claro com profundidade;
- branco, bege suave e detalhe vermelho/dourado;
- bordas leves;
- sombra elegante;
- hierarquia clara;
- pouco negrito;
- cards internos leves;
- elementos graficos apenas quando ajudam a leitura.

## Fases de implantacao

### Fase 1
Reorganizar o passeio guiado:
- explicar primeiro a logica da interface;
- depois explicar a logica do negocio;
- depois explicar modulos.

### Fase 2
Aprofundar passos por modulo:
- mostrar principais abas;
- explicar para que serve cada uma;
- criar textos especificos por tela.

Status: implementada na versao `2026-05-28-v3`.

O passeio agora explica, com textos proprios por tela:
- Configuracoes Geral e Canais de venda;
- Cardapio Produtos e Configuracoes;
- Producao Receitas, Ordens e Lista de compras;
- Financeiro Visao geral, Entradas e Saidas;
- Venda presencial;
- Compras;
- Estoque;
- Acoes de Vendas;
- Plano de Voo;
- Temporadas;
- Performance;
- Maturidade;
- Loja Online Template e Link/publicacao;
- Pedidos Cozinha, Lista e Clientes.

Diretriz de copy aplicada:
- explicar o que a usuaria faz naquela tela;
- mostrar quais abas/campos importam primeiro;
- evitar termos tecnicos quando existir forma mais simples;
- sempre fechar com uma orientacao pratica de primeiro passo.

### Fase 3
Criar acoes guiadas por contexto:
- abrir tela correta;
- destacar botao principal da tela;
- orientar proximo preenchimento.

Status: implementada na versao `2026-05-28-v4`.

Comportamento aplicado:
- o botao do passo nao apenas abre a tela, ele mantem o passeio no mesmo passo;
- quando a tela abre, o destaque visual passa do item do menu para a acao principal da tela;
- o modal mostra um bloco extra `Acao principal nesta tela`, com uma orientacao objetiva do que preencher ou clicar;
- se o elemento principal nao existir naquela tela ou naquele estado, o passeio volta a destacar o item original sem quebrar o fluxo.

Acoes guiadas mapeadas:
- Configuracoes Geral: salvar dados do negocio;
- Canais de venda: adicionar canal;
- Produtos: adicionar produto;
- Categorias: adicionar categoria;
- Receitas: adicionar receita;
- Ordens de producao: nova ordem;
- Lista de compras: gerar lista;
- Financeiro: entradas, saidas e leitura da visao geral;
- Venda presencial: buscar produto e finalizar venda;
- Compras: nova compra;
- Estoque: inventario/ajuste;
- Acoes de venda: criar acao comercial;
- Plano de Voo: criar nova rota;
- Temporadas: nova temporada;
- Performance: ler o status do mes;
- Maturidade: ler Pedra e marcos;
- Loja Online Template: comecar por identidade/checkout;
- Loja Online Link: salvar/publicar link;
- Cozinha: acompanhar cards de pedido e alarme;
- Pedidos: buscar ou criar pedido;
- Clientes: buscar cliente ou cadastrar novo.

### Fase 4
Salvar progresso por tenant/usuario no Firestore, se fizer sentido, mantendo fallback local.

Status: implementada na versao `2026-05-28-v5`.

Persistencia definida:
- caminho: `tenants/{tenantId}/config/onboarding_dashboard_{userId}`;
- cada usuario do tenant tem seu proprio progresso;
- o estado local continua existindo como fallback imediato;
- se Firestore falhar por permissao, rede ou ambiente local, o onboarding continua funcionando pelo navegador.

Campos salvos:
- `version`;
- `welcomeSeen`;
- `tourOpen`;
- `tourDone`;
- `tourStep`;
- `collapsed`;
- `userId`;
- `tenantId`;
- `updatedAt`.

Regras:
- o progresso remoto so e aplicado quando a versao salva bate com a versao atual do onboarding;
- se a usuaria interagir enquanto o remoto ainda carrega, o estado local recente nao e sobrescrito;
- mudancas de abrir/fechar passeio, avancar passo, concluir tour e recolher/expandir checklist sao persistidas.

### Fase 5
Criar uma segunda jornada apos loja online configurada:
- primeira compra;
- primeiro pedido;
- rotina de cozinha;
- financeiro;
- estoque;
- crescimento.

Status: implementada na versao `2026-05-28-v6`.

Jornada aplicada no checklist:
- aparece depois da base, rota e loja pronta;
- troca a ideia de configuracao por rotina real;
- guia a usuaria pelo primeiro ciclo operacional do negocio.

Passos da segunda jornada:
1. Registrar primeira compra;
2. Receber a compra no estoque;
3. Receber primeiro pedido;
4. Acompanhar na cozinha;
5. Conferir dinheiro da venda;
6. Conferir estoque depois da venda;
7. Olhar o crescimento da semana.

Dados usados para dar check:
- compras cadastradas em `compras`;
- movimentos de estoque em `stock_movements`;
- pedidos em `orders`;
- entradas financeiras normalizadas pelo Dashboard;
- Plano de Voo e pedido existente para liberar a leitura de crescimento.

Diretriz:
- a segunda jornada deve mostrar que o BocaFood nao termina na configuracao da loja;
- o objetivo e fazer a usuaria registrar uma operacao real e enxergar como compra, pedido, cozinha, financeiro, estoque e crescimento conversam.

### Fase 6
Criar a orientacao continua depois que o onboarding principal termina:
- nao deixar a janela simplesmente desaparecer;
- transformar o checklist em um painel leve de rotina;
- sugerir a proxima tela mais util do dia;
- manter acesso para rever o passeio guiado;
- manter acesso para Maturidade.

Status: implementada na versao `2026-05-28-v7`.

Comportamento aplicado:
- quando todos os passos estao completos, o painel muda para `Negocio em movimento`;
- o painel passa a sugerir uma proxima acao de rotina, com base nos dados do dia;
- a pilula recolhida muda para `Rotina`;
- a usuaria pode rever o passeio ou abrir Maturidade sem reiniciar o onboarding.

Ordem de prioridade da sugestao continua:
1. se ha pedido aberto, acompanhar Cozinha;
2. se ainda nao ha pedido hoje, registrar venda;
3. se houve venda mas nao ha entrada financeira, conferir Financeiro;
4. se ainda nao ha movimento de estoque, conferir Estoque;
5. se existe Plano de Voo e o mes esta abaixo do ritmo, abrir Temporadas;
6. caso contrario, olhar Performance.

### Fase 7
Criar controle seguro para refazer o onboarding:
- permitir que a usuaria ou suporte reinicie os primeiros passos sem limpar cache;
- nao apagar nenhum dado do negocio;
- reiniciar apenas o estado do onboarding do usuario atual;
- manter o estado remoto e local sincronizados.

Status: implementada na versao `2026-05-28-v8`.

Comportamento aplicado:
- no painel `Negocio em movimento`, foi incluido o botao `Refazer primeiros passos`;
- antes de reiniciar, aparece confirmacao explicando que os dados do negocio nao serao apagados;
- o reset limpa somente `welcomeSeen`, `tourOpen`, `tourDone`, `tourStep`, `collapsed` e a versao do onboarding;
- o reset tambem atualiza o documento remoto `tenants/{tenantId}/config/onboarding_dashboard_{userId}`;
- depois do reset, a proxima renderizacao volta a mostrar a tela de boas-vindas.

### Fase 8
Criar uma leitura do progresso do onboarding para suporte e produto:
- manter a experiencia visual igual para a usuaria;
- salvar no Firestore um resumo claro de onde ela esta na jornada;
- registrar a ultima acao feita no onboarding;
- registrar qual rota/tela estava aberta;
- nao criar nova colecao;
- nao salvar dados sensiveis;
- nao alterar dados do negocio.

Status: implementada na versao `2026-05-28-v9`.

Documento usado:
- `tenants/{tenantId}/config/onboarding_dashboard_{userId}`.

Campos adicionados ao documento remoto:
- `progressSummary.completed`;
- `progressSummary.completedSteps`;
- `progressSummary.totalSteps`;
- `progressSummary.progressPercent`;
- `progressSummary.currentPhaseKey`;
- `progressSummary.currentPhaseTitle`;
- `progressSummary.currentStepTitle`;
- `progressSummary.nextRoute`;
- `progressSummary.nextRoutineTitle`, quando a jornada principal ja terminou;
- `lastRoute`;
- `lastAction`;
- `lastActionAt`.

Acoes registradas:
- `welcome_started`;
- `tour_reopened`;
- `guided_route_opened`;
- `tour_next`;
- `tour_previous`;
- `tour_completed`;
- `panel_collapsed`;
- `panel_expanded`;
- `progress_reset`.

Diretriz:
- esta camada serve para entender onde a usuaria parou e qual e o proximo passo esperado;
- ela nao deve virar regra de permissao, regra de score ou bloqueio de uso;
- se no futuro o onboarding ganhar novas fases, atualizar `ONBOARDING_VERSION` e manter o resumo simples para suporte entender rapidamente a jornada.

### Fase 9
Simplificar o onboarding removendo o passeio guiado separado:
- nao abrir mais modal de passeio antes do checklist;
- a tela de boas-vindas abre diretamente o checklist flutuante;
- cada passo do checklist passa a ser o guia principal da usuaria;
- o checklist continua disponivel em todas as telas;
- funcoes antigas do passeio ficam apenas como compatibilidade, redirecionando para o checklist;
- a orientacao detalhada por modulo passa a ficar na Documentacao.

Status: implementada na versao `2026-05-28-v10`.

Diretriz:
- nao criar uma segunda experiencia concorrendo com o checklist;
- o onboarding deve ser uma lista guiada, pratica e permanente;
- quando precisar de explicacao longa, usar a Documentacao;
- quando precisar de acao, usar o item do checklist com rota direta para a tela certa.
