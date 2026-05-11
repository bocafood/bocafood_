# Plano Técnico de Implementação V1: Temporadas / Missões Operacionais

## 1. Objetivo da implementação V1

A V1 do módulo **Temporadas / Missões Operacionais** deve ser enxuta, incremental e focada em dados confiáveis. O objetivo não é resolver toda a operação da loja, criar IA complexa, automatizar decisões pesadas ou transformar o sistema em uma experiência de gamificação infantil.

A V1 não deve tentar resolver estoque, desperdício, capacidade produtiva avançada, previsão comportamental ou campanhas externas. Também não deve depender de IA complexa, animações exageradas, XP fake, recompensas fictícias ou mecânicas de jogo infantil.

O foco da V1 é:

- Criar temporadas.
- Acompanhar progresso.
- Interpretar dados reais do sistema.
- Gerar leitura operacional clara.
- Mostrar risco, evolução e resultado final de forma simples.
- Preservar estabilidade do BocaFood existente.

## 2. Escopo da V1

A V1 deve incluir apenas os itens abaixo.

### Objetivos

- Vender Mais.
- Aumentar Ticket.
- Fidelizar Clientes.
- Melhorar Consistência.

### Builds

- Volume.
- Margem.
- Fidelização.

### Duração

- 30 dias.
- 90 dias.

### Tipo de meta

- Automática.
- Fixa.

### Status

- `draft`
- `active`
- `finished`
- `abandoned`

## 3. Estrutura inicial do módulo

Arquivos sugeridos:

- `js/modules/temporadas.js`
- `css/modules/temporadas.css`

Arquivos opcionais, se a implementação crescer além do módulo de tela:

- `js/services/seasons.service.js`
- `js/services/seasons.analytics.js`

Diretrizes:

- O módulo deve ser independente.
- Evitar acoplamento excessivo com Dashboard, Performance, Pedidos, Financeiro ou Plano de Voo.
- Reaproveitar `DB` e `Auth` existentes.
- Usar `Auth.getTenantId()` para todo acesso a dados.
- Preservar rotas, contratos e comportamento de módulos existentes.
- Centralizar normalizadores e cálculos para evitar duplicação entre tela, snapshots e resultado final.
- Não alterar modelos existentes de pedidos, clientes, produtos ou financeiro na V1, salvo se uma etapa futura explicitamente aprovar isso.

Separação sugerida:

- `temporadas.js`: renderização do módulo, navegação interna, fluxo de criação e painel.
- `temporadas.css`: estilos específicos do módulo.
- `seasons.service.js`: CRUD de temporadas, snapshots e consultas por tenant.
- `seasons.analytics.js`: baseline, score, progresso, risco, status e resultado final.

## 4. Ordem de implementação

### Fase 1 — Estrutura base

Objetivo:

Criar base do módulo.

Implementar:

- Item no menu `Crescimento > Temporadas`.
- Rota/navegação.
- Tela vazia inicial.
- Estado inicial do módulo.
- Carregamento do tenant atual.

Cuidados:

- Não alterar comportamento de Crescimento, Performance ou Plano de Voo.
- Criar entrada mínima e reversível.
- Garantir que a tela vazia não execute consultas pesadas.

Resultado esperado:

Módulo acessível sem funcionalidades completas.

------------------------------------------------

### Fase 2 — Coleção `seasons`

Objetivo:

Criar CRUD básico da temporada.

Implementar:

- Criar documento `seasons`.
- Listar temporadas.
- Carregar temporada ativa.
- Impedir múltiplas temporadas `active`.
- Status básicos.

Campos mínimos:

- `tenantId`
- `objective`
- `build`
- `difficulty`
- `durationType`
- `targetMode`
- `targetValue`
- `status`
- `startDate`
- `endDate`
- `createdAt`

Cuidados:

- Salvar sempre dentro de `tenants/{tenantId}`.
- Validar `tenantId` antes de leitura e escrita.
- Não permitir alteração de temporada `active`, `finished` ou `abandoned`.
- Preparar campos para evolução futura sem exigir todos na primeira gravação.

Resultado esperado:

Conseguir criar e salvar temporadas.

------------------------------------------------

### Fase 3 — Fluxo Nova Temporada

Objetivo:

Criar experiência inicial de configuração.

Implementar:

- Seleção de objetivo.
- Duração.
- Tipo de meta.
- Meta fixa.
- Meta automática.
- Dificuldade.
- Build.
- Resumo final.

Implementar validações:

- Apenas 1 `active`.
- Meta obrigatória quando `targetMode` for fixa.
- Confirmação final antes de iniciar.
- Bloqueio de edição depois de iniciada.
- Duração restrita a 30 ou 90 dias.
- Objetivo, build e dificuldade restritos aos valores da V1.

Cuidados:

- A tela deve seguir o fluxo definido em `SEASONS_UI_FLOW.md`.
- Não incluir tarefas manuais.
- Não incluir gamificação infantil.
- Não iniciar temporada sem confirmação explícita.

Resultado esperado:

Usuária consegue iniciar temporada.

------------------------------------------------

### Fase 4 — Baseline e meta automática

Objetivo:

Calcular metas automáticas usando histórico.

Implementar:

- Leitura de pedidos.
- Média histórica.
- Baseline 30/90 dias.
- Cálculo automático da meta.
- Nível de risco da meta.

Usar apenas:

- `orders`
- `store_customers`
- Performance básica derivada de pedidos

Métricas de baseline:

- `baselineOrders`
- `baselineRevenue`
- `baselineAverageTicket`
- `baselineRecurringCustomers`
- `baselineActiveDays`

Cuidados:

- Excluir pedidos cancelados.
- Usar `orders.total` como valor principal.
- Normalizar data do pedido antes do cálculo.
- Usar `customerId` para recorrência e telefone normalizado como fallback.
- Se houver poucos dados, marcar confiabilidade baixa e avisar que a meta automática pode ser menos precisa.
- Não usar estoque, desperdício, capacidade produtiva ou custo exato por venda.

Resultado esperado:

Sistema sugere metas automaticamente.

------------------------------------------------

### Fase 5 — Score básico

Objetivo:

Criar cálculo inicial de progresso.

Implementar:

- Score 0–100.
- Progresso percentual.
- Status:
  - Excelente.
  - Estável.
  - Instável.
  - Crítico.

Usar:

- Pesos definidos no `SEASON_SCORING_SYSTEM.md`.

Cuidados:

- Métricas principais devem pesar mais que auxiliares.
- Métricas auxiliares devem explicar contexto, não decidir tudo.
- Build deve alterar interpretação e prioridade dos indicadores.
- Score não deve depender de IA externa.
- Baixa confiança não deve determinar vitória ou falha.

Resultado esperado:

Temporada possui leitura operacional básica.

------------------------------------------------

### Fase 6 — Painel da temporada

Objetivo:

Criar HUD principal da temporada.

Implementar:

- Cabeçalho.
- Progresso.
- Score.
- Cards principais.
- Alertas simples.
- Métricas principais.

Sem:

- Gráficos complexos.
- IA.
- Animações exageradas.
- Medalhas, XP fake ou recompensas fictícias.
- Tarefas manuais.

Cuidados:

- Priorizar cards conforme objetivo e build.
- Mostrar dados reais e confiáveis primeiro.
- Usar alertas curtos e explicáveis.
- Manter a tela leve no carregamento.
- Seguir a direção visual de `SEASONS_UI_FLOW.md`: painel tático, limpo e profissional.

Resultado esperado:

Painel funcional e leve.

------------------------------------------------

### Fase 7 — Snapshots

Objetivo:

Evitar recalcular tudo em tempo real.

Implementar:

- `season_metrics_snapshots`.
- Snapshot diário.
- Snapshot semanal simples.

Salvar:

- Score.
- Métricas principais.
- Alertas.
- Status.
- Progresso.

Campos mínimos sugeridos:

- `tenantId`
- `seasonId`
- `snapshotType`
- `periodStart`
- `periodEnd`
- `score`
- `progressPercent`
- `status`
- `riskLevel`
- `mainMetrics`
- `auxiliaryMetrics`
- `alerts`
- `createdAt`

Cuidados:

- Snapshots devem pertencer ao tenant correto.
- Não substituir fontes originais.
- Evitar snapshots pesados com dados brutos demais.
- Manter cálculo semanal simples na V1.

Resultado esperado:

Base preparada para análises futuras.

------------------------------------------------

### Fase 8 — Resultado final

Objetivo:

Encerrar temporada corretamente.

Implementar:

- Cálculo final.
- Classificação:
  - Vitória Total.
  - Vitória Parcial.
  - Temporada Instável.
  - Falha Operacional.
- Resumo final.
- Leitura estratégica simples.

Cuidados:

- Ao finalizar, gerar snapshot final.
- Temporada `finished` não pode ser alterada.
- Resultado final deve considerar progresso, score, risco e evolução.
- Explicar o que funcionou, o que atrapalhou e sugestão para próxima temporada.
- Não transformar resultado final em gamificação infantil.

Resultado esperado:

Temporada pode ser concluída oficialmente.

## 5. Dados permitidos na V1

Usar apenas dados confiáveis ou sinais auxiliares bem identificados.

### Alta confiança

- Pedidos.
- Faturamento.
- Ticket médio.
- Clientes recorrentes.
- Recompra.
- Dias fortes/fracos.
- Horários.
- Avaliações.

### Média confiança

- Margem estimada.
- Cupons.
- Upsell.
- Promoções.

### Não usar

- Estoque real.
- Desperdício real.
- Custo exato por venda.
- Capacidade operacional avançada.

## 6. Estratégia de performance

Definir:

- Evitar recalcular histórico inteiro em toda abertura de tela.
- Usar snapshots.
- Limitar consultas por período.
- Queries sempre por tenant.
- Cálculos leves em tempo real.
- Cálculos pesados via snapshot.
- Buscar temporada ativa com filtro por `status`.
- Buscar pedidos apenas dentro do período necessário.
- Evitar depender de coleções financeiras duplicadas sem normalização.
- Manter baseline congelado na temporada iniciada.

## 7. Multi-tenant

Definir:

- Todas as temporadas devem usar `tenantId`.
- Nunca compartilhar dados entre lojas.
- Snapshots devem ser isolados por tenant.
- Usar `Auth.getTenantId()`.
- Salvar em `tenants/{tenantId}/seasons`.
- Salvar snapshots em `tenants/{tenantId}/season_metrics_snapshots`.
- Validar que temporada e snapshot pertencem ao mesmo tenant.
- Não usar dados globais para cálculo individual.

## 8. Fora do escopo da V1

Não implementar:

- IA avançada.
- Previsão comportamental.
- Ranking entre lojas.
- Multiplayer.
- Notificações externas.
- Integração Meta Ads.
- Google Analytics.
- Tarefas manuais.
- Gamificação infantil.
- Avatars.
- XP fake.
- Recompensas fictícias.
- Estoque automático.
- Desperdício real.
- Capacidade produtiva avançada.
- Múltiplas temporadas ativas.
- Comparação pública entre tenants.

## 9. Critério de sucesso da V1

A V1 será considerada bem sucedida se:

- Usuária conseguir criar temporada facilmente.
- Sistema acompanhar automaticamente.
- Painel transmitir progresso real.
- Leituras fizerem sentido.
- Experiência parecer estratégica e não burocrática.
- Módulo funcionar de forma leve e estável.
- Dados respeitarem isolamento por tenant.
- Temporada ativa bloquear edições indevidas.
- Resultado final for claro, auditável e baseado em dados reais.

## Referências técnicas

- `DATA_MAP_FOR_SEASONS.md`
- `SEASONS_SPEC.md`
- `SEASON_SCORING_SYSTEM.md`
- `SEASONS_ARCHITECTURE.md`
- `SEASONS_UI_FLOW.md`
- `AGENTS.md`
