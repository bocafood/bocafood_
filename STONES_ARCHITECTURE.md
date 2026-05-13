# Arquitetura Técnica do Sistema de Pedras / Maturidade do Negócio

## 1. Objetivo da arquitetura

O Sistema de Pedras é uma camada permanente de maturidade do negócio. Ele representa a evolução acumulada da loja ao longo do tempo, diferente das Temporadas, que funcionam como campanhas operacionais de curto prazo.

As Temporadas alimentam as Pedras com sinais de execução, consistência, risco, conclusão de metas e evolução operacional. O Plano de Voo e a Performance ajudam a validar se o crescimento foi saudável, aderente ao estágio atual da loja e sustentado por dados reais de pedidos, metas e saúde financeira.

O cálculo das Pedras deve ser auditável. Cada resultado relevante precisa registrar quais dados foram usados, quais limitações existiam, quais bloqueios foram aplicados e por que a loja subiu ou não subiu de Pedra.

O sistema não deve depender de recalcular todo o histórico a cada abertura de tela. A V1 deve usar snapshots, janelas de análise limitadas e eventos de upgrade para manter rastreabilidade e boa performance.

## 2. Coleções Firestore sugeridas

Todas as coleções devem ficar dentro do escopo do tenant:

```text
tenants/{tenantId}/business_maturity/{maturityId}
tenants/{tenantId}/business_maturity_snapshots/{snapshotId}
tenants/{tenantId}/stone_upgrade_events/{eventId}
```

### business_maturity

Documento principal de maturidade por tenant. Na V1, recomenda-se um documento único por loja, por exemplo `tenants/{tenantId}/business_maturity/current`.

Campos sugeridos:

| Campo | Tipo sugerido | Descrição |
|---|---|---|
| `tenantId` | string | Tenant dono do documento. Deve bater com o caminho. |
| `currentStone` | string | Pedra atual da loja. |
| `nextStone` | string | Próxima Pedra possível. |
| `stoneProgressPercent` | number | Progresso acumulado para a próxima Pedra, de 0 a 100. |
| `maturityScore` | number | Score consolidado de maturidade, de 0 a 100. |
| `indexes` | object | Índices calculados de crescimento, consistência, financeiro, risco, fidelização e execução. |
| `checklist` | array | Checklist automático de marcos cumpridos e pendentes. |
| `blockers` | array | Travas/desacelerações aplicadas ao cálculo. |
| `strengths` | array | Pontos fortes detectados. |
| `weaknesses` | array | Pontos fracos detectados. |
| `lastCalculatedAt` | timestamp | Última execução do cálculo. |
| `lastUpgradeAt` | timestamp/null | Última subida de Pedra, quando existir. |
| `createdAt` | timestamp | Criação do documento. |
| `updatedAt` | timestamp | Última atualização do documento. |

Observações técnicas:

- `currentStone`, `nextStone` e `stoneProgressPercent` devem refletir o estado atual, não um cálculo temporário da tela.
- `indexes`, `checklist`, `blockers`, `strengths` e `weaknesses` devem guardar evidências resumidas para auditoria.
- O documento não deve substituir snapshots históricos.

### business_maturity_snapshots

Coleção de snapshots históricos da maturidade. Serve para auditoria, evolução temporal e para evitar recálculo completo do passado.

Campos sugeridos:

| Campo | Tipo sugerido | Descrição |
|---|---|---|
| `tenantId` | string | Tenant dono do snapshot. |
| `snapshotType` | string | Tipo do snapshot. |
| `periodStart` | timestamp/string | Início do período analisado. |
| `periodEnd` | timestamp/string | Fim do período analisado. |
| `currentStone` | string | Pedra no momento do snapshot. |
| `nextStone` | string | Próxima Pedra no momento do snapshot. |
| `maturityScore` | number | Score consolidado do período. |
| `stoneProgressPercent` | number | Progresso para a próxima Pedra no snapshot. |
| `indexes` | object | Índices calculados do período. |
| `checklist` | array | Checklist automático no momento do snapshot. |
| `blockers` | array | Travas aplicadas no período. |
| `dataConfidence` | string | `high`, `medium` ou `low`. |
| `createdAt` | timestamp | Data de criação do snapshot. |

Tipos de snapshot:

- `monthly`: fechamento mensal ou primeira abertura do painel após o fim do período.
- `season_final`: snapshot gerado ao finalizar uma Temporada.
- `manual_recalculation`: snapshot gerado por recálculo administrativo futuro.

### stone_upgrade_events

Coleção de eventos de subida de Pedra. Deve registrar cada evolução oficial para auditoria e histórico.

Campos sugeridos:

| Campo | Tipo sugerido | Descrição |
|---|---|---|
| `tenantId` | string | Tenant dono do evento. |
| `fromStone` | string | Pedra anterior. |
| `toStone` | string | Nova Pedra. |
| `previousProgress` | number | Progresso antes da subida. |
| `newProgress` | number | Progresso inicial após a subida. |
| `maturityScore` | number | Score usado no upgrade. |
| `reason` | string | Motivo resumido da evolução. |
| `indicatorsUsed` | array/object | Indicadores e evidências usadas. |
| `snapshotId` | string | Snapshot associado ao upgrade. |
| `createdAt` | timestamp | Data do evento. |

## 3. Ordem oficial das Pedras

Ordem oficial da V1:

1. Pedra Bruta
2. Quartzo
3. Ametista
4. Safira
5. Esmeralda
6. Rubi
7. Diamante
8. Ônix

Pedra Bruta representa negócio em estruturação, sobrevivência e primeiros passos operacionais. Ela não deve ser tratada como fracasso. Sobreviver, organizar e reduzir caos também é evolução.

## 4. Fontes de dados

| Fonte | Uso esperado | Confiabilidade | Cuidado técnico |
|---|---|---:|---|
| `seasons` | Status, objetivos, dificuldade, score atual/final, risco, conclusão, abandono e resultado final das Temporadas. | Alta | Usar somente dados do tenant; respeitar status oficiais como `scheduled`, `active`, `finished` e `abandoned`; não inferir vitória sem evidência de conclusão/finalização. |
| `season_metrics_snapshots` | Histórico diário, semanal e final de score, progresso, risco, ritmo e métricas capturadas durante Temporadas. | Alta/Média | Preferir snapshots finais e períodos fechados; validar `snapshotType`, datas e consistência com a Temporada relacionada. |
| `orders` | Faturamento, quantidade de pedidos, ticket médio, dias com venda, recorrência e evolução por período. | Alta/Média | Filtrar por status válido e período; evitar contar pedidos cancelados; normalizar datas e valores monetários. |
| `store_customers` | Clientes recorrentes, frequência, recompra e base ativa. | Média | Dados dependem da qualidade do cadastro e associação dos pedidos ao cliente; evitar usar como única prova de fidelização. |
| `reviews` | Satisfação, reputação e sinais de experiência do cliente. | Média | Amostra pode ser pequena; usar como apoio, não como critério dominante. |
| `points_movements` | Uso do programa de pontos, recorrência incentivada e engajamento. | Média | Diferenciar concessão automática, resgate e ajustes manuais; usar com cautela quando o programa estiver pouco usado. |
| `flight_plans` | Plano mensal, cenário escolhido, metas e resumo esperado/realizado. | Alta/Média | Validar mês, cenário e fechamento; não premiar meta agressiva se houver risco/financeiro ruim. |
| `flight_plan_month_scenarios` | Cenários `survival`, `equilibrium`, `growth` e `expansion`, metas mensais e aderência por cenário. | Alta/Média | Usar cenário escolhido pela usuária quando disponível; interpretar Survival sem penalizar crescimento lento. |
| `performance` | Indicadores consolidados de vendas, metas, crescimento, comparações e tendência. | Média | Verificar se é cálculo de tela ou dado persistido; preferir fontes persistidas e snapshots quando existirem. |
| Financeiro normalizado | Entradas, saídas, lucro estimado, margem, contas vencidas, caixa e saúde financeira. | Média/Baixa | Há risco de duplicidade entre coleções financeiras; só usar dados normalizados e com período claro. |
| Compras | Apoio para custos, fornecedores e pressão de caixa. | Média/Baixa | Não inferir margem real por produto sem snapshot confiável no pedido; usar como contexto financeiro. |
| `products` | Apoio para cardápio, mix, dependência de produtos e preço. | Média/Baixa | Produtos mudam ao longo do tempo; não usar preço/custo atual para recalcular venda histórica sem snapshot. |

## 5. Índices calculados

O campo `indexes` deve conter os índices oficiais do Sistema de Pedras. Cada índice deve ter `score`, `confidence`, `metricsUsed` e `notes`.

Estrutura sugerida:

```json
{
  "healthyGrowth": {
    "score": 0,
    "confidence": "medium",
    "metricsUsed": [],
    "notes": []
  },
  "consistency": {
    "score": 0,
    "confidence": "medium",
    "metricsUsed": [],
    "notes": []
  },
  "financialHealth": {
    "score": 0,
    "confidence": "low",
    "metricsUsed": [],
    "notes": []
  },
  "controlledRisk": {
    "score": 0,
    "confidence": "medium",
    "metricsUsed": [],
    "notes": []
  },
  "loyalty": {
    "score": 0,
    "confidence": "medium",
    "metricsUsed": [],
    "notes": []
  },
  "execution": {
    "score": 0,
    "confidence": "high",
    "metricsUsed": [],
    "notes": []
  }
}
```

Índices oficiais:

| Índice | Peso conceitual | Fontes principais | Observação |
|---|---:|---|---|
| `healthyGrowth` | 20% | `orders`, `flight_plans`, `flight_plan_month_scenarios`, Performance | Crescimento só conta bem quando há consistência, risco controlado e saúde financeira mínima. |
| `consistency` | 25% | `orders`, `seasons`, `season_metrics_snapshots` | Deve pesar mais que faturamento bruto. Mede regularidade, estabilidade e repetição saudável. |
| `financialHealth` | 20% | Financeiro normalizado, Plano de Voo, Performance | Não deve punir agressivamente lojas pequenas; deve evitar premiar crescimento ruim. |
| `controlledRisk` | 15% | `seasons`, `season_metrics_snapshots`, Plano de Voo | Risco alto recorrente deve desacelerar ou travar evolução. |
| `loyalty` | 10% | `store_customers`, `points_movements`, `reviews`, `orders` | Usar como sinal de maturidade, com cautela quando a amostra for pequena. |
| `execution` | 10% | `seasons`, snapshots finais, eventos futuros | Mede disciplina operacional, conclusão e abandono. |

## 6. Checklist automático

O checklist deve ser consequência dos dados do sistema. A usuária não marca itens manualmente.

Estrutura sugerida de cada item:

| Campo | Tipo sugerido | Descrição |
|---|---|---|
| `id` | string | Identificador estável do marco. |
| `title` | string | Título curto do item. |
| `description` | string | Explicação do que foi medido. |
| `category` | string | Área do item: crescimento, consistência, financeiro, risco, fidelização ou execução. |
| `completed` | boolean | Se o item foi cumprido automaticamente. |
| `completedAt` | timestamp/null | Data em que o item foi cumprido, quando aplicável. |
| `source` | string | Fonte principal da evidência. |
| `evidence` | object | Dados mínimos que comprovam o item. |

Exemplos de itens:

- Concluir temporada.
- Atingir vitória parcial.
- Atingir vitória total.
- Manter score médio acima do mínimo.
- Reduzir risco.
- Atingir meta do Plano de Voo.
- Manter contas vencidas sob controle.
- Aumentar recompra.
- Evitar abandono.

Exemplo de item:

```json
{
  "id": "season_finished",
  "title": "Concluir uma Temporada",
  "description": "A loja finalizou uma Temporada válida no período analisado.",
  "category": "execution",
  "completed": true,
  "completedAt": "timestamp",
  "source": "seasons",
  "evidence": {
    "seasonId": "abc123",
    "status": "finished",
    "finalScore": 82
  }
}
```

## 7. Blockers / travas

Blockers representam situações que desaceleram a evolução ou, em casos graves, impedem a subida de Pedra no período.

Blockers sugeridos:

- Muitas temporadas abandonadas.
- Risco muito alto recorrente.
- Contas vencidas recorrentes.
- Crescimento com deterioração financeira.
- Baixa consistência.
- Dados insuficientes.
- Crescimento concentrado demais em poucos dias ou produtos.
- Score médio muito baixo.

Comportamento esperado:

- Blockers devem reduzir a velocidade de evolução.
- Blockers graves podem travar a subida mesmo com `stoneProgressPercent >= 100`.
- Blockers não devem destruir automaticamente a Pedra atual.
- A perda de Pedra, se existir no futuro, deve ser uma regra separada, conservadora e auditável.

Estrutura sugerida:

```json
{
  "id": "recurring_high_risk",
  "severity": "high",
  "category": "controlledRisk",
  "reason": "Risco alto recorrente em temporadas recentes.",
  "source": "season_metrics_snapshots",
  "evidence": {
    "periodStart": "timestamp",
    "periodEnd": "timestamp",
    "highRiskSnapshots": 5
  },
  "effect": "block_upgrade"
}
```

## 8. Quando recalcular

### Ao finalizar temporada

Ao finalizar uma Temporada, o sistema deve recalcular maturidade usando o resultado final, score, risco, status, snapshots finais e impacto no histórico recente.

Resultado esperado:

- Atualizar `business_maturity/current`.
- Criar snapshot `season_final`.
- Criar `stone_upgrade_events` se houver subida.

### Mensalmente / ao abrir painel

Ao abrir o painel, o sistema pode verificar se já existe snapshot mensal do último período fechado. Se não existir, pode gerar um snapshot `monthly`.

Regra importante:

- Não recalcular todo o histórico a cada abertura de tela.
- Usar janelas limitadas, por exemplo mês atual, mês anterior e histórico consolidado em snapshots.

### Quando Plano de Voo do mês for fechado

Quando o Plano de Voo do mês for fechado ou consolidado, recalcular aderência ao plano:

- Cenário escolhido.
- Meta atingida ou não.
- Resultado previsto vs realizado.
- Impacto financeiro e risco.

### Manual recalculation

Pode existir no futuro para admin interno ou manutenção. Deve gerar snapshot `manual_recalculation` com motivo, período e limitações.

## 9. Data confidence

`dataConfidence` deve indicar a confiança do cálculo ou do snapshot.

Níveis:

- `high`: dados suficientes, período fechado, temporadas concluídas, pedidos consistentes e fontes financeiras/Plano de Voo minimamente confiáveis.
- `medium`: dados úteis, mas com lacunas moderadas, pouca maturidade histórica ou alguma dependência de inferência.
- `low`: dados insuficientes, duplicados, incompletos ou com baixa base estatística.

Usar `low` quando houver:

- Poucos pedidos.
- Poucos dados financeiros.
- Nenhuma Temporada concluída.
- Nenhum Plano de Voo salvo.
- Dados financeiros duplicados ou incompletos.
- Datas não padronizadas.
- Valores monetários inconsistentes ou como string.

Regra de produto:

- Baixa confiança deve reduzir a certeza do sistema, não rotular automaticamente a loja como ruim.
- Para lojas iniciais, `low` pode significar apenas início de base histórica.

## 10. Upgrade de Pedra

Regra da V1:

Quando `stoneProgressPercent >= 100`, o sistema pode subir para a próxima Pedra se não houver blocker grave impedindo o upgrade.

Fluxo recomendado:

1. Validar `currentStone` e `nextStone` pela ordem oficial.
2. Validar se o progresso chegou a 100%.
3. Validar blockers graves.
4. Criar snapshot associado ao evento.
5. Criar documento em `stone_upgrade_events`.
6. Atualizar `business_maturity/current` com a nova Pedra.
7. Reiniciar o progresso para a próxima Pedra.
8. Salvar motivo da evolução e indicadores usados.

Regras adicionais:

- Nunca pular mais de uma Pedra na V1.
- Uma única Temporada não deve subir uma Pedra inteira sozinha, salvo exceções futuras documentadas.
- Upgrade deve depender de maturidade acumulada, não de pico momentâneo.

## 11. Auditabilidade

Cada cálculo importante deve salvar:

- Período analisado.
- Indicadores usados.
- Limitações dos dados.
- Score por índice.
- Confiança por índice.
- Blockers aplicados.
- Checklist gerado.
- Motivo da subida ou da não subida.
- Snapshot associado.

A auditoria deve permitir responder:

- Por que a loja está nesta Pedra?
- O que falta para a próxima Pedra?
- Quais dados foram usados?
- Quais dados tinham baixa confiança?
- O que travou ou desacelerou a evolução?
- Qual evento oficial subiu a loja de Pedra?

## 12. Multi-tenant

Regra obrigatória:

- Tudo deve ficar dentro de `tenants/{tenantId}`.
- Nunca comparar lojas entre si na V1.
- Nunca misturar dados entre tenants.
- Usar `Auth.getTenantId()` e o wrapper de DB existente.
- Toda consulta, snapshot, cálculo, evento e exportação deve respeitar o tenant ativo.

O Sistema de Pedras deve medir cada loja contra o próprio histórico, não contra outras lojas.

## 13. Performance

Diretrizes:

- Snapshots são obrigatórios para evitar recálculo pesado.
- Consultas devem ser filtradas por período e tenant.
- Não recalcular todo o histórico em tempo real.
- Reutilizar dados de Temporadas e Performance quando forem persistidos e confiáveis.
- Evitar duplicidade financeira sem normalizador.
- Preferir períodos fechados para cálculos oficiais.
- Manter `business_maturity/current` pronto para leitura rápida do painel.

Estratégia sugerida:

- Tela lê `business_maturity/current`.
- Cálculo pesado roda em eventos específicos: fim de Temporada, fechamento mensal, fechamento do Plano de Voo ou recálculo manual.
- Histórico lê `business_maturity_snapshots`.
- Upgrades lêem `stone_upgrade_events`.

## 14. Fora do escopo da V1

Não incluir na V1:

- Ranking entre lojas.
- Comparação pública.
- IA decidindo subida de Pedra.
- Estoque real.
- Desperdício real.
- Capacidade operacional.
- Lucro real por venda.
- Prova automática de execução da IA.
- Múltiplas subidas de Pedra de uma vez.

A IA pode futuramente explicar sinais, sugerir próximos passos e resumir evolução, mas a subida de Pedra deve ser determinada por regras auditáveis.

## 15. Resultado esperado

Esta arquitetura define uma base técnica para salvar, calcular, auditar e atualizar o Sistema de Pedras com segurança.

Resultado esperado:

- Pedras salvas em `business_maturity/current`.
- Histórico salvo em `business_maturity_snapshots`.
- Subidas salvas em `stone_upgrade_events`.
- Progresso calculado por maturidade acumulada.
- Temporadas, Plano de Voo e Performance integrados como fontes de evidência.
- Cálculo auditável, com indicadores, confiança, checklist e blockers.
- Consultas leves, baseadas em snapshots e períodos fechados.
- Respeito total ao multi-tenant.
- V1 protegida contra crescimento ruim, faturamento bruto isolado e comparações injustas entre lojas.
