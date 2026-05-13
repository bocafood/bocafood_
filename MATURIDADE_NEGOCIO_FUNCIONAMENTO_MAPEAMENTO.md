# Maturidade do Negócio / Sistema de Pedras — funcionamento e mapeamento

## 1. Objetivo

Maturidade do Negócio é a camada permanente de evolução acumulada da loja. Ela é diferente de Temporadas:

- Temporadas medem ciclos curtos de execução.
- Maturidade mede o estágio acumulado do negócio.

O objetivo é mostrar se a loja está evoluindo de forma saudável, com consistência, execução, risco controlado, fidelização e crescimento sustentável. A lógica não deve premiar somente faturamento bruto ou volume de pedidos.

## 2. Onde está implementado hoje

Arquivos principais:

- `public/js/modules/temporadas.js`
- `public/css/modules/temporadas.css`
- `public/admin.html`

Documentos relacionados:

- `STONES_EVOLUTION_SYSTEM.md`
- `STONES_SCORING_SYSTEM.md`
- `STONES_ARCHITECTURE.md`
- `STONES_UI_FLOW.md`
- `BUSINESS_MATURITY_DATA_MAP.md`
- `TEMPORADAS_FUNCIONAMENTO_MAPEAMENTO.md`

Rota atual:

- `crescimento/maturidade`

Menu:

- `Maturidade do Negócio` aparece no topo do Admin, antes de `Início`.

Observação técnica:

Hoje a tela de Maturidade usa funções dentro de `public/js/modules/temporadas.js`. A rota está separada visualmente, mas o código ainda divide o mesmo módulo base de Temporadas.

## 3. Conceito das Pedras

Ordem oficial:

1. Pedra Bruta
2. Quartzo
3. Ametista
4. Safira
5. Esmeralda
6. Rubi
7. Diamante
8. Ônix

Pedra Bruta é o nível inicial e não representa fracasso. Ela representa:

- começo;
- estruturação;
- sobrevivência;
- organização inicial;
- negócio ainda em lapidação.

## 4. Diferença entre Temporadas e Maturidade

| Área | Papel | Janela |
|---|---|---|
| Temporadas | Campanhas operacionais com meta, score, risco e resultado final. | 30 ou 90 dias. |
| Maturidade | Evolução acumulada do negócio baseada no histórico. | Permanente. |

Temporadas alimentam Maturidade, mas não são o único critério.

## 5. Coleções Firestore usadas

### `business_maturity/current`

Caminho:

`tenants/{tenantId}/business_maturity/current`

Documento principal da maturidade atual.

Campos atuais:

| Campo | Tipo | Descrição |
|---|---|---|
| `tenantId` | string | Tenant dono da maturidade. |
| `currentStone` | string | Pedra atual. |
| `nextStone` | string | Próxima Pedra. |
| `stoneProgressPercent` | number | Progresso para a próxima Pedra, de 0 a 100. |
| `previousStoneProgressPercent` | number | Progresso anterior antes do último cálculo. |
| `maturityScore` | number | Score consolidado de maturidade. |
| `indexes` | object | Índices oficiais calculados. |
| `strengths` | array | Pontos fortes detectados. |
| `weaknesses` | array | Pontos que limitam evolução. |
| `checklist` | array | Caminho da Pedra automático. |
| `checklistSummary` | object | Totais de concluídos, pendentes e limitadores. |
| `blockers` | array | Travas ou bloqueios de upgrade. |
| `lastSeasonImpact` | object | Impacto da última temporada finalizada/abandonada. |
| `lastSeasonImpactPercent` | number | Percentual de impacto da última temporada. |
| `lastSeasonImpactReason` | string | Motivo textual do impacto. |
| `seasonContributionSummary` | object | Resumo das temporadas fechadas. |
| `lastUpgradeSignature` | string | Assinatura do último upgrade para evitar repetição. |
| `lastUpgradeReason` | string | Motivo do último upgrade. |
| `lastUpgradeFrom` | string | Pedra anterior do último upgrade. |
| `lastUpgradeTo` | string | Nova Pedra do último upgrade. |
| `lastCalculatedAt` | timestamp | Último cálculo. |
| `lastUpgradeAt` | timestamp/null | Última subida de Pedra. |
| `createdAt` | timestamp | Criação. |
| `updatedAt` | timestamp | Atualização. |
| `calculationVersion` | string | Versão da lógica. Hoje `stones_phase_4`. |
| `calculationNotes` | array | Notas técnicas do cálculo. |

### `business_maturity_snapshots`

Caminho:

`tenants/{tenantId}/business_maturity_snapshots/{snapshotId}`

Guarda histórico auditável da maturidade.

Tipos atuais:

| Tipo | Quando cria |
|---|---|
| `monthly` | Ao abrir/calcular no mês, se ainda não existir snapshot mensal. |
| `season_final` | Ao finalizar uma temporada. |
| `stone_upgrade` | Quando há subida de Pedra. |
| `manual_recalculation` | Previsto para futuro, não usado na tela atual. |

Campos atuais:

| Campo | Descrição |
|---|---|
| `tenantId` | Tenant dono. |
| `snapshotType` | Tipo do snapshot. |
| `periodStart` | Início do período. |
| `periodEnd` | Fim do período. |
| `currentStone` | Pedra atual no snapshot. |
| `nextStone` | Próxima Pedra no snapshot. |
| `stoneProgressPercent` | Progresso no snapshot. |
| `maturityScore` | Score no snapshot. |
| `indexes` | Índices salvos. |
| `checklistSummary` | Resumo do checklist. |
| `checklist` | Itens do checklist. |
| `blockers` | Travas. |
| `strengths` | Pontos fortes. |
| `weaknesses` | Pontos limitadores. |
| `dataConfidence` | Confiança consolidada. |
| `source` | Origem do snapshot. |
| `relatedSeasonId` | Temporada vinculada, quando for `season_final`. |
| `relatedUpgradeEventId` | Evento vinculado, quando for `stone_upgrade`. |
| `createdAt` | Data de criação. |

### `stone_upgrade_events`

Caminho:

`tenants/{tenantId}/stone_upgrade_events/{eventId}`

Registra cada subida de Pedra.

Campos atuais:

| Campo | Descrição |
|---|---|
| `tenantId` | Tenant dono. |
| `fromStone` | Pedra anterior. |
| `toStone` | Nova Pedra. |
| `previousProgress` | Progresso antes do upgrade. |
| `newProgress` | Progresso após upgrade. Hoje reinicia em 0. |
| `maturityScore` | Score usado no upgrade. |
| `reason` | Motivo textual. |
| `indicatorsUsed` | Indicadores usados na decisão. |
| `snapshotId` | Preparado, hoje vazio. |
| `calculationSignature` | Assinatura do cálculo para evitar duplicidade. |
| `upgradedAt` | Data de upgrade. |
| `celebrationPending` | Se deve exibir comemoração. |
| `celebrationShownAt` | Quando a comemoração foi exibida. |

## 6. Fontes de dados usadas hoje

O cálculo atual lê:

| Fonte | Uso |
|---|---|
| `orders` | Pedidos, faturamento, ticket médio, dias ativos, semanas ativas, crescimento recente. |
| `store_customers` | Apoio para recorrência quando não há pedido suficiente. |
| `flight_plans` | Contexto do cenário do Plano de Voo. |
| `flight_plan_month_scenarios/{monthKey}` | Cenário mensal selecionado. |
| `seasons` | Temporadas finalizadas/abandonadas, score, resultado, risco e dificuldade. |
| `business_maturity/current` | Estado anterior da Pedra. |
| `stone_upgrade_events` | Histórico de upgrades. |
| `business_maturity_snapshots` | Histórico de maturidade. |

Dados não usados como base forte nesta fase:

- margem real por venda;
- estoque real;
- desperdício real;
- lucro exato por pedido;
- capacidade operacional;
- IA como prova de execução;
- ranking entre lojas.

## 7. Normalização de pedidos

Pedidos cancelados/reembolsados são ignorados quando o sistema calcula maturidade.

Status ignorados:

- `cancelado`
- `cancelada`
- `canceled`
- `cancelled`
- `reembolsado`
- `refunded`

Valor do pedido usa o primeiro campo disponível:

1. `total`
2. `grandTotal`
3. `finalTotal`
4. `amount`
5. `value`
6. `subtotal`

Data do pedido usa:

1. `createdAt`
2. `date`
3. `data`
4. `paidAt`
5. `updatedAt`

## 8. Índices oficiais

O campo `indexes` contém seis índices.

| Índice | Peso no score | O que mede |
|---|---:|---|
| `healthyGrowth` | 20% | Crescimento saudável, pedidos, receita, ticket e contexto do Plano de Voo. |
| `consistency` | 25% | Dias com venda, semanas ativas, temporadas concluídas, score médio e abandono. |
| `financialHealth` | 20% | Saúde financeira básica nesta fase, usando pedidos/ticket e cenário como sinal leve. |
| `controlledRisk` | 15% | Risco médio das temporadas, abandono e execução com risco controlado. |
| `loyalty` | 10% | Clientes recorrentes e taxa de recorrência. |
| `execution` | 10% | Temporadas concluídas, vitórias e score. |

Cada índice salva:

- `score`: 0 a 100;
- `confidence`: `high`, `medium` ou `low`;
- `notes`: observações do cálculo.

## 9. Score de maturidade

Fórmula atual:

```txt
maturityScore =
  healthyGrowth * 0.20 +
  consistency * 0.25 +
  financialHealth * 0.20 +
  controlledRisk * 0.15 +
  loyalty * 0.10 +
  execution * 0.10
```

Se não houver dados mínimos, o score exibido fica 0.

Dados mínimos:

- pelo menos 1 temporada fechada; ou
- pelo menos 3 pedidos válidos.

## 10. Progresso para a próxima Pedra

O progresso atual é calculado de forma conservadora:

```txt
stoneProgressPercent = maturityScore * 0.68 + totalImpactDasTemporadas
```

Depois é limitado entre 0 e 100.

`totalImpactDasTemporadas` é derivado das temporadas finalizadas/abandonadas e limitado a 42 pontos.

Se não houver dados suficientes:

- `currentStone = Pedra Bruta`
- `nextStone = Quartzo`
- `stoneProgressPercent = 0`
- `maturityScore = 0`

## 11. Impacto das Temporadas

Temporadas com status `finished` e `abandoned` alimentam a maturidade.

Resultados positivos:

| Resultado | Impacto base |
|---|---:|
| `Vitória Total` | +13 |
| `Vitória Parcial` | +8 |
| `Temporada Instável` | +3 |
| `Falha Operacional` | +1 |
| `Abandono` | -7 |

Ajustes adicionais:

| Condição | Ajuste |
|---|---:|
| Score >= 85 | +5 |
| Score >= 65 | +3 |
| Score entre 1 e 39 | -3 |
| Risco `low` | +3 |
| Risco `medium` | +1 |
| Risco `high` | -5 |
| Risco `very_high` | -7 |
| Dificuldade `aggressive` com risco baixo/médio | +4 |
| Dificuldade `balanced` | +2 |
| Dificuldade `safe` | +1 |

Impacto final de uma temporada:

- mínimo: -8;
- máximo: +22.

## 12. Pontos fortes e limitadores

Pontos fortes podem incluir:

- temporadas concluídas;
- vitórias totais ou parciais;
- vendas em mais dias;
- clientes recorrentes;
- risco controlado;
- cenário `survival` como construção válida.

Pontos que limitam podem incluir:

- falta de temporadas concluídas;
- temporadas abandonadas;
- risco alto recorrente;
- poucos dias com venda;
- baixa recorrência;
- saúde financeira com leitura ainda básica.

## 13. Checklist automático — Caminho da Pedra

O checklist é automático. A usuária não marca manualmente.

Cada item contém:

| Campo | Descrição |
|---|---|
| `id` | Identificador técnico. |
| `title` | Marco exibido. |
| `description` | Explicação do marco. |
| `category` | `growth`, `consistency`, `financial`, `risk`, `loyalty` ou `execution`. |
| `completed` | Booleano. |
| `completedAt` | Data da evidência, quando concluído. |
| `status` | `completed`, `pending` ou `limited`. |
| `source` | Fonte dos dados. |
| `evidence` | Evidências usadas. |

Status:

- `completed`: marco concluído.
- `pending`: ainda não concluído.
- `limited`: existe um fator limitador real.

Resumo:

```txt
checklistSummary = {
  completed,
  pending,
  limited,
  total
}
```

## 14. Checklist por transição de Pedra

### Pedra Bruta -> Quartzo

- `sell_more_days`: manter vendas em mais dias da semana.
- `finish_season`: concluir uma temporada.
- `reduce_initial_instability`: reduzir instabilidade inicial.
- `minimum_order_base`: criar base mínima de pedidos.

### Quartzo -> Ametista

- `stable_weeks`: manter semanas mais estáveis.
- `reduce_oscillation`: reduzir oscilações fortes.
- `improve_average_score`: melhorar score médio das temporadas.
- `reduce_recurring_risk`: reduzir risco recorrente.
- `season_partial_win`: alcançar Vitória Parcial.

### Ametista -> Safira

- `improve_recurrence`: melhorar recorrência.
- `increase_stability`: aumentar estabilidade.
- `grow_with_control`: crescer mantendo controle.
- `balanced_seasons`: concluir temporadas equilibradas.

### Safira -> Esmeralda

- `improve_loyalty`: melhorar fidelização.
- `reduce_promotion_dependency`: reduzir dependência de promoções.
- `healthy_growth`: manter crescimento saudável.
- `reduce_average_risk`: reduzir risco médio.

### Esmeralda -> Rubi

- `ambitious_goals`: sustentar metas mais ousadas.
- `financial_stability`: melhorar estabilidade financeira.
- `reduce_concentration`: reduzir dependência de poucos produtos/dias.
- `good_consistency`: manter boa consistência.

### Rubi -> Diamante

- `long_healthy_growth`: manter crescimento saudável por mais tempo.
- `reduce_operational_instability`: reduzir instabilidade operacional.
- `difficult_seasons`: concluir temporadas difíceis.
- `good_financial_health`: manter boa saúde financeira.

### Diamante -> Ônix

- `low_risk_growth`: sustentar crescimento com baixo risco.
- `high_predictability`: manter alta previsibilidade.
- `balance_growth_stability`: equilibrar crescimento e estabilidade.
- `consistent_maturity`: demonstrar maturidade consistente.

Itens extras podem entrar quando houver risco/abandono:

- `avoid_abandonment`
- `reduce_operation_risk`

## 15. Blockers / travas de upgrade

Blockers podem impedir subida de Pedra mesmo com 100% de progresso.

Blockers atuais:

| ID | Condição | Efeito |
|---|---|---|
| `insufficient_data` | Sem dados suficientes. | `block_upgrade` |
| `recurring_abandonment` | 2 ou mais temporadas abandonadas. | `block_upgrade` |
| `extreme_risk` | Risco médio >= 82 com temporadas existentes. | `block_upgrade` |
| `recurring_failure` | 2 ou mais Falhas Operacionais. | `block_upgrade` |
| `chaotic_growth` | Crescimento > 25% com risco médio >= 75. | `block_upgrade` |
| `critical_limiters` | Índice `controlledRisk` abaixo de 20. | `block_upgrade` |

Blockers não reduzem automaticamente a Pedra atual. Eles travam a subida.

## 16. Upgrade automático de Pedra

Condição para subir:

- `stoneProgressPercent >= 100`;
- não existir blocker com `effect = block_upgrade`;
- não estar na última Pedra;
- a assinatura do cálculo ainda não ter sido usada para upgrade.

Quando sobe:

1. `currentStone` vira a próxima Pedra.
2. `nextStone` vira a Pedra seguinte.
3. `stoneProgressPercent` reinicia em 0.
4. Cria evento em `stone_upgrade_events`.
5. Marca `celebrationPending = true`.
6. Cria snapshot `stone_upgrade`.
7. Nunca pula mais de uma Pedra na V1.

## 17. Assinatura de cálculo

O sistema cria uma assinatura para evitar repetir o mesmo upgrade.

A assinatura usa:

- temporadas fechadas;
- concluídas;
- abandonadas;
- vitórias totais;
- vitórias parciais;
- score médio;
- risco médio;
- pedidos;
- receita atual;
- receita anterior;
- dias ativos;
- semanas ativas;
- clientes recorrentes;
- taxa de recorrência;
- cenário do Plano de Voo.

## 18. Histórico e comemoração

Quando há upgrade registrado:

- exibe comemoração visual curta;
- mostra mensagem `Você evoluiu para [Nova Pedra].`;
- permite abrir `Histórico de evolução`.

Para evitar repetição:

- evento nasce com `celebrationPending = true`;
- depois de exibido, salva:
  - `celebrationPending = false`;
  - `celebrationShownAt`.

Histórico de evolução mostra:

- Pedra anterior;
- nova Pedra;
- data;
- motivo;
- progresso anterior;
- score;
- marcos concluídos;
- dias com venda.

## 19. Histórico de maturidade

O modal de histórico também mostra snapshots recentes de maturidade.

Na interface são limitados aos snapshots recentes, hoje normalizados e exibidos em ordem decrescente.

Cada linha mostra:

- Pedra atual;
- tipo do snapshot;
- data;
- progresso;
- score.

## 20. Relação com Plano de Voo

O sistema lê:

- `flight_plan_month_scenarios/{monthKey}`;
- `flight_plans`.

Cenário usado:

1. `monthScenario.scenario`;
2. `monthScenario.selectedScenario`;
3. cenário do flight plan mais recente.

Cenários esperados:

- `survival`;
- `equilibrium`;
- `growth`;
- `expansion`.

Uso atual:

- cenário entra como contexto no índice `healthyGrowth`;
- `survival` adiciona sinal positivo leve em saúde financeira e pontos fortes;
- `growth` e `expansion` só ajudam pouco se o risco médio estiver controlado.

## 21. Interface atual

Tela:

- rota `crescimento/maturidade`;
- sem abas internas;
- começa direto pelo card visual das Pedras.

Blocos exibidos:

- Pedra Atual;
- Próxima Pedra;
- progresso;
- marcos concluídos;
- Caminhada das Pedras completa;
- Evolução recente;
- Pontos fortes;
- Pontos que limitam evolução;
- Caminho da Pedra;
- Histórico de evolução.

Visual:

- card premium;
- cor alinhada à Pedra atual;
- símbolos gráficos em CSS representando as Pedras;
- trilha completa das Pedras;
- Pedra atual destacada;
- Pedras futuras discretas.

## 22. O que está funcionando hoje

- Rota própria para Maturidade.
- Estado inicial em Pedra Bruta.
- Cálculo de score de maturidade.
- Progresso para próxima Pedra.
- Índices oficiais.
- Pontos fortes e fracos.
- Checklist automático por transição de Pedra.
- Blockers de upgrade.
- Upgrade automático.
- Eventos de upgrade.
- Comemoração controlada por evento.
- Histórico de evolução.
- Snapshots mensais.
- Snapshots por temporada finalizada.
- Snapshots por upgrade.
- Integração com resultado final de Temporadas.
- Leitura básica de Plano de Voo.
- Multi-tenant via wrapper `DB` e `Auth.getTenantId()`.

## 23. Limitações atuais

### Técnicas

- Maturidade ainda está implementada dentro de `public/js/modules/temporadas.js`.
- Não há arquivo/módulo próprio de Maturidade.
- Não há testes automatizados para cálculo das Pedras.
- `snapshotId` do evento de upgrade ainda fica vazio.
- `calculationVersion` ainda está como `stones_phase_4`, mesmo após fases visuais/snapshots.
- O cálculo ainda recalcula bastante coisa ao abrir, embora salve snapshots.

### Dados

- Saúde financeira ainda é básica.
- Margem real não é usada.
- Lucro real por venda não é usado.
- Estoque real não é usado.
- Desperdício real não é usado.
- Capacidade operacional não é usada.
- Promoções/cupons ainda não entram como evidência forte.
- Avaliações ainda não entram com força no cálculo.
- Programa de pontos ainda não entra de forma completa.

### Produto/UX

- Ainda falta separar conceitualmente no código `Temporadas` e `Maturidade`.
- Falta tela/modal mais detalhado para explicar cada índice.
- Falta detalhar por que cada checklist foi concluído ou limitado.
- Falta mostrar evolução histórica em gráfico.
- Falta mostrar claramente quais dados estão com baixa confiança.

## 24. Riscos se usar errado

Não usar a Pedra como ranking entre lojas.

Não usar faturamento bruto como critério principal.

Não premiar:

- crescimento com risco extremo;
- crescimento com abandono recorrente;
- faturamento alto sem consistência;
- meta agressiva com operação caótica;
- volume sem recorrência ou saúde mínima.

Não punir injustamente:

- loja pequena;
- loja em survival;
- crescimento lento com organização real;
- fase inicial com poucos dados.

## 25. Recomendações para próxima etapa

Prioridade técnica:

1. Extrair Maturidade para `public/js/modules/maturidade.js` ou serviço próprio.
2. Criar `public/js/services/business-maturity.service.js`.
3. Criar testes para índices, progresso, blockers, checklist e upgrade.
4. Versionar cálculo como `stones_phase_6` ou nova versão compatível.
5. Vincular `stone_upgrade_events.snapshotId` ao snapshot `stone_upgrade`.
6. Melhorar data confidence por índice e mostrar isso na UI.

Prioridade de dados:

1. Padronizar cliente recorrente por `customerId` e telefone normalizado.
2. Integrar avaliações com peso pequeno em fidelização/reputação.
3. Integrar pontos/fidelidade com peso pequeno em loyalty.
4. Integrar financeiro normalizado apenas quando confiável.
5. Adicionar snapshots próprios mensais como base principal de histórico.

Prioridade de produto:

1. Explicar cada índice em linguagem simples.
2. Mostrar por que a loja está na Pedra atual.
3. Mostrar o que falta para a próxima Pedra.
4. Mostrar se a evolução está travada por risco, abandono ou baixa consistência.
5. Manter a comunicação adulta, estratégica e sem gamificação infantil.
