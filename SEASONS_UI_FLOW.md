# UX, Fluxo e Estrutura Visual: Temporadas / Missões Operacionais

## 1. Objetivo da experiência

Temporadas não devem parecer um ERP tradicional. O módulo deve transmitir a sensação de uma campanha operacional com começo, ritmo, leitura tática e encerramento claro.

A experiência deve lembrar dashboards táticos e um videogame manager adulto: foco, progresso, risco, decisões e leitura inteligente do negócio. A referência é de central operacional, não de brincadeira.

Não usar gamificação infantil. Não usar medalhas falsas, XP fake, moedas virtuais, avatar decorativo ou excesso de efeitos. O valor da experiência vem dos dados reais da loja, da clareza do progresso e da interpretação prática do que está acontecendo.

O foco da UX deve ser:

- Clareza de objetivo.
- Progresso visível.
- Leitura rápida de risco.
- Evolução operacional.
- Próxima decisão evidente.
- Confiança nos dados usados.

## 2. Posicionamento no sistema

Posicionamento sugerido no menu:

- Crescimento
  - Temporadas

Motivo:

- O módulo está ligado à evolução operacional da loja.
- Conecta metas, performance e leitura de crescimento.
- Tem relação direta com Plano de Voo, ritmo esperado e comparação entre previsto e realizado.
- Deve ficar próximo de áreas estratégicas, não dentro de pedidos, financeiro ou catálogo.

## 3. Estrutura geral do módulo

Telas principais:

1. Central de Temporadas.
2. Criar Temporada.
3. Painel da Temporada.
4. Resultado Final.

Fluxo principal:

1. Usuária entra em `Crescimento > Temporadas`.
2. Se não houver temporada ativa, a Central destaca a ação `Nova Temporada`.
3. Usuária configura objetivo, duração, data de início, tipo de meta, dificuldade e build.
4. Antes de iniciar ou programar, a tela exibe resumo, alertas de risco e aviso de que a temporada não poderá ser editada depois de ativa.
5. Temporada com início hoje entra como ativa; temporada com início futuro entra como programada.
6. Durante o ciclo, o painel mostra progresso, score, status, alertas e radar operacional.
7. Ao finalizar, o sistema exibe Resultado Final e adiciona a temporada ao histórico.

## 4. Tela: Central de Temporadas

Objetivo:

Mostrar:

- Temporada ativa.
- Temporadas programadas.
- Histórico.
- Progresso geral.
- Entrada para nova temporada.

Abas superiores:

- **Ativa:** mostra temporada ativa, estado vazio e ação `Nova Temporada`.
- **Programadas:** lista temporadas futuras, sem análises ou IA.
- **Histórico:** lista temporadas finalizadas ou abandonadas.

### Cabeçalho

Mostrar:

- Título.
- Subtítulo.
- Botão `Nova Temporada`.

Direção visual:

- Cabeçalho limpo, com hierarquia clara.
- Subtítulo deve explicar o estado atual do módulo em uma frase curta.
- Botão principal deve aparecer apenas como ação direta, sem linguagem promocional.

### Card principal da temporada ativa

Mostrar:

- Nome da temporada.
- Objetivo.
- Build.
- Dificuldade.
- Progresso.
- Score.
- Status atual.
- Dias restantes.

Exemplo de status:

- Excelente.
- Estável.
- Instável.
- Crítico.

Direção visual:

- O card ativo deve ser o elemento dominante da tela.
- Progresso e status devem ser entendidos em poucos segundos.
- Score deve aparecer como indicador tático, não como placar de jogo infantil.
- Dias restantes devem reforçar urgência operacional sem exagero emocional.

Estado sem temporada ativa:

- Mostrar bloco vazio objetivo com convite para criar temporada.
- Explicar que Temporadas usam dados reais do sistema.
- Não usar ilustração excessiva nem tom motivacional.

### Histórico

Lista de temporadas anteriores:

- Nome.
- Período.
- Resultado final.
- Score final.

Definir:

- Cards clicáveis.
- Abrir Resultado Final da temporada.
- Ordenar por mais recentes primeiro.
- Exibir classificação final com cor discreta e sem medalhas.

## 5. Tela: Criar Temporada

Objetivo:

Criar sensação de configuração de campanha/save de jogo, mas com visual adulto e operacional. A usuária deve sentir que está preparando um ciclo estratégico, não preenchendo um formulário comum.

Fluxo em etapas:

1. Objetivo.
2. Duração.
3. Tipo de Meta.
4. Dificuldade.
5. Build operacional.
6. Resumo final.

### Etapa 1 — Objetivo

Mostrar:

- Vender Mais.
- Aumentar Ticket.
- Fidelizar Clientes.
- Melhorar Consistência.

Cada opção deve mostrar:

- Descrição curta.
- Foco estratégico.

Direção por objetivo:

- **Vender Mais:** foco em pedidos, faturamento e dias com venda.
- **Aumentar Ticket:** foco em ticket médio, valor por pedido e adicionais/upsell.
- **Fidelizar Clientes:** foco em recorrência, recompra e frequência.
- **Melhorar Consistência:** foco em dias ativos, estabilidade semanal e redução de dias fracos.

### Etapa 2 — Duração

Opções:

- Sprint → 30 dias.
- Temporada → 90 dias.

Direção visual:

- Mostrar diferença de compromisso entre curto e médio prazo.
- Evitar períodos customizados na V1.
- Deixar claro que a duração influencia baseline, snapshots e resultado final.

### Etapa 3 — Tipo de Meta

#### Meta automática

Explicar:

- BocaFood calcula baseado no histórico.
- Para Sprint, usa últimos 30 dias.
- Para Temporada, usa últimos 90 dias.

#### Meta fixa

Explicar:

- Usuária define manualmente.
- BocaFood calcula nível de risco comparando com histórico.

Se meta fixa:

- Mostrar nível de risco estimado.
- Usar rótulos simples: baixo, médio, alto, muito alto.
- Alertar quando a meta estiver muito acima da média histórica.

### Etapa 4 — Dificuldade

Opções:

- Seguro.
- Equilibrado.
- Agressivo.

Explicar:

- Muda exigência da temporada.
- Altera meta calculada, tolerância de risco e ritmo esperado.

Direção visual:

- Três opções em comparação direta.
- Evitar linguagem de desafio exagerado.
- Agressivo deve parecer uma escolha de maior pressão operacional, não uma conquista.

### Etapa 5 — Build operacional

Opções:

- Volume.
- Margem.
- Fidelização.

Explicar:

- Build altera interpretação dos resultados.
- Build muda prioridade visual dos indicadores, alertas e leitura do resultado.
- Build não altera o sistema inteiro e não modifica pedidos, financeiro ou catálogo.

### Etapa 6 — Resumo final

Mostrar:

- Objetivo.
- Meta.
- Build.
- Dificuldade.
- Duração.
- Risco estimado.
- Previsão inicial.

Mensagem obrigatória:

> Depois de iniciada, a temporada não poderá ser editada.

Botão:

- `Iniciar Temporada`.

Direção visual:

- Resumo deve parecer confirmação de campanha.
- Usar uma área de alerta discreta para a regra de bloqueio pós-início.
- Não iniciar automaticamente sem confirmação explícita.

## 6. Tela: Painel da Temporada

Objetivo:

Ser o HUD operacional principal da temporada.

O painel deve parecer painel tático: visual limpo, profissional e com sensação de central operacional. A tela precisa responder rapidamente às perguntas principais:

- Estamos no ritmo?
- Qual é o risco?
- O que mudou?
- Onde está a força da temporada?
- Onde está o ponto fraco?

### Cabeçalho principal

Mostrar:

- Nome da temporada.
- Progresso geral.
- Score.
- Status.
- Dias restantes.

Exemplo:

- Dia 18/90.
- Score 72.
- Status: Estável.

Direção visual:

- Cabeçalho compacto, com números fortes e texto mínimo.
- Status deve usar cor semântica discreta.
- O nome da temporada deve manter contexto, mas não competir com progresso e score.

### Barra principal de progresso

Visual forte.

Baseada em:

- Progresso da meta.
- Score geral.

Direção visual:

- Barra horizontal clara e elegante.
- Deve transmitir avanço sem parecer barra de XP.
- Pode ter marcações de ritmo esperado e posição atual.
- Deve indicar quando a temporada está acima, dentro ou abaixo do ritmo.

### Cards principais

Mostrar:

- Faturamento.
- Pedidos.
- Ticket.
- Recompra.
- Frequência.
- Consistência.

Dependendo do objetivo/build:

- Alterar prioridade visual dos cards.
- Destacar métricas principais do objetivo.
- Rebaixar métricas auxiliares para cards menores ou segunda linha.

Exemplos:

- Vender Mais + Volume: faturamento, pedidos e dias ativos em destaque.
- Aumentar Ticket + Margem: ticket, valor por pedido e margem estimada em destaque.
- Fidelizar Clientes + Fidelização: recompra, clientes recorrentes e frequência em destaque.
- Melhorar Consistência + Volume: dias ativos, regularidade semanal e pedidos por dia em destaque.

### Barras de status

Exemplo:

- Ritmo operacional.
- Consistência.
- Fidelização.
- Crescimento.
- Risco operacional.

Direção visual:

- Barras devem ser mais analíticas que decorativas.
- Cada barra deve ter rótulo, valor atual e leitura curta.
- Evitar excesso de cores simultâneas.

### Alertas táticos

Exibir:

- Riscos.
- Oportunidades.
- Mudanças relevantes.

Exemplos:

- “Quinta-feira virou seu segundo melhor dia.”
- “Seu ticket caiu 12% esta semana.”
- “Clientes recorrentes cresceram acima da média.”

Direção visual:

- Alertas devem aparecer em lista curta.
- Priorizar alertas críticos e oportunidades reais.
- Evitar poluição com mensagens repetidas.
- Na V1, alertas aparecem apenas no painel.

### Missões secundárias automáticas

Opcional visual da V1.

Exemplo:

- Aumentar ticket em €2.
- Recuperar terça-feira.
- Melhorar recompra.

Regras:

- Sem tarefas manuais.
- Sem checkbox de conclusão.
- Sem recompensa falsa.
- Devem ser sugestões derivadas automaticamente de dados, não obrigações operacionais.

Direção visual:

- Aparecer como recomendações táticas pequenas.
- Não competir com o objetivo principal.
- Podem ser ocultadas se não houver dado suficiente.

### Radar operacional

Área visual mostrando:

- Horários fortes.
- Dias fortes.
- Produtos líderes.
- Pontos fracos.

Direção visual:

- Deve funcionar como mapa rápido da operação.
- Pode usar listas, barras compactas ou pequenos gráficos.
- Deve mostrar confiança quando a métrica for parcial.
- Não deve incluir estoque real, desperdício real ou capacidade produtiva avançada na V1.

## 7. Tela: Resultado Final

Objetivo:

Encerrar temporada com leitura clara e emocionalmente forte. A tela deve reconhecer o ciclo concluído, mas sem exagero motivacional ou gamificação infantil.

### Cabeçalho

Mostrar:

- Resultado final.
- Score final.
- Classificação.

Classificações:

- Vitória Total.
- Vitória Parcial.
- Temporada Instável.
- Falha Operacional.

Direção visual:

- Cabeçalho deve ser forte e conclusivo.
- Classificação deve vir acompanhada de explicação curta.
- Evitar troféus, medalhas, XP ou efeitos de desbloqueio.

### Resumo

Mostrar:

- Meta.
- Resultado obtido.
- Evolução geral.

Direção visual:

- Comparar meta versus realizado de forma direta.
- Mostrar progresso percentual e principais números.
- Explicar se o resultado veio de crescimento real, estabilidade ou picos isolados.

### O que funcionou

Lista automática.

Exemplos:

- Dias ativos aumentaram.
- Clientes recorrentes cresceram.
- Ticket médio manteve tendência positiva.
- Produto líder puxou faturamento.

### O que atrapalhou

Lista automática.

Exemplos:

- Vendas concentradas em poucos dias.
- Ticket perdeu força na última semana.
- Recompra não acompanhou o crescimento de novos clientes.
- Descontos pressionaram a leitura de margem.

### Evolução detectada

Resumo estratégico.

Deve responder:

- O que mudou no comportamento da loja?
- O crescimento foi consistente?
- O risco diminuiu ou aumentou?
- Qual métrica ficou mais forte?

### Sugestão para próxima temporada

Exemplo:

- Fidelização.
- Margem.
- Consistência.

Direção visual:

- Sugestão deve parecer recomendação operacional, não upsell do sistema.
- Deve ser baseada no resultado final e nos pontos fracos detectados.

## 8. Linguagem do módulo

Tom:

- Direto.
- Estratégico.
- Sem coach.
- Sem exagero motivacional.
- Sem frases infantis.
- Orientado a dados reais.

Exemplos positivos:

- “Seu ticket perdeu força esta semana.”
- “Clientes recorrentes cresceram acima da média.”
- “Seu crescimento está concentrado em poucos dias.”

Exemplos negativos:

- “Parabéns campeão!”
- “XP +500”
- “Você desbloqueou uma medalha épica!”

Regras de copy:

- Preferir frases curtas.
- Explicar causa quando possível.
- Evitar culpa ou julgamento pessoal.
- Dizer o que aconteceu e por que importa.
- Não transformar resultado ruim em frase motivacional vazia.

## 9. Visual e identidade

Definir:

- Visual premium.
- Fundo limpo.
- Poucos destaques de cor.
- Barras de progresso elegantes.
- Aparência de painel tático.
- Sem excesso de neon.
- Sem estética gamer infantil.

Inspirar em:

- Dashboards modernos.
- Game manager.
- Central operacional.
- HUD minimalista.

Direção visual:

- Usar cards compactos e organizados.
- Usar cor para status e prioridade, não para decoração excessiva.
- Preferir contraste, espaçamento e hierarquia tipográfica a efeitos visuais.
- Evitar gradientes pesados, brilho, confete, medalhas ou animações chamativas.
- Manter linguagem visual compatível com o restante do admin BocaFood.

## 10. Responsividade

Definir:

- Mobile prioritário.
- Leitura rápida.
- Cards organizados.
- HUD adaptado para celular.
- Evitar excesso de informação simultânea.

Direção mobile:

- Cabeçalho com status, score e dias restantes no topo.
- Barra principal de progresso visível sem scroll longo.
- Cards principais em ordem de prioridade do objetivo/build.
- Alertas táticos em lista curta.
- Radar operacional simplificado.
- Histórico com cards compactos.

Direção desktop:

- Usar mais largura para comparar métricas.
- Manter densidade informativa sem parecer planilha.
- Evitar cards enormes com pouco conteúdo.
- Priorizar leitura escaneável.

## 11. Fora do escopo da V1

Não incluir:

- Avatar.
- Ranking global.
- Comparação pública entre lojas.
- Multiplayer.
- Chat.
- Notificações push.
- Recompensas falsas.
- Loja de itens.
- Moedas virtuais.
- Animações excessivas.

Também não incluir na experiência V1:

- Tarefas manuais.
- Checklists de hábitos.
- Estoque automático.
- Desperdício real.
- Capacidade produtiva avançada.
- Alertas externos por WhatsApp, email ou push.

## Referências técnicas

- `DATA_MAP_FOR_SEASONS.md`
- `SEASONS_SPEC.md`
- `SEASON_SCORING_SYSTEM.md`
- `SEASONS_ARCHITECTURE.md`
- `AGENTS.md`
