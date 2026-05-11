# CLAUDE.md

## Como trabalhar neste projeto
- Não releia o projeto inteiro sem necessidade.
- Antes de alterar qualquer coisa, identifique apenas os arquivos necessários.
- Trabalhe por módulo e por fluxo.
- Evite refatoração ampla.
- Preserve funcionalidades existentes e compatibilidade com dados já salvos.
- Se precisar sair do escopo, explique o motivo antes de prosseguir.
- Sempre informe quais arquivos foram lidos e quais foram alterados.
- Após cada alteração feita por IA, atualize `AI_CHANGELOG.md`.

## REGRA OBRIGATÓRIA DE DOCUMENTAÇÃO E FINALIZAÇÃO
Depois de qualquer alteração no código, é obrigatório atualizar o `AI_CHANGELOG.md`.

Nenhuma tarefa de código pode ser considerada finalizada sem:
1. registrar no `AI_CHANGELOG.md` o que foi feito;
2. listar os arquivos alterados;
3. registrar o motivo da alteração;
4. registrar o impacto esperado;
5. verificar se `FEATURE_INDEX.md` ou `DEPENDENCY_MAP.md` precisam ser atualizados;
6. informar no resumo final quais documentos foram atualizados.

Atualizar `FEATURE_INDEX.md` somente se:
- criar novo módulo;
- mudar tela principal;
- mudar fluxo entre módulos;
- mudar coleção/campo do Firestore;
- criar nova dependência entre arquivos;
- adicionar nova funcionalidade relevante.

Atualizar `DEPENDENCY_MAP.md` somente se:
- um arquivo passar a depender de outro;
- uma funcionalidade começar a usar outro módulo;
- houver mudança em serviços compartilhados;
- houver mudança em regras, validações ou integrações;
- houver alteração em fluxo que impacte mais de uma tela.

Não atualizar `PROJECT_MAP.md` para ajustes pequenos.

Atualizar `PROJECT_MAP.md` apenas se:
- mudar a arquitetura geral;
- criar uma nova área grande do sistema;
- alterar o fluxo principal do sistema;
- mudar a estrutura geral de pastas.

Se `FEATURE_INDEX.md` ou `DEPENDENCY_MAP.md` não precisarem ser atualizados, registrar no resumo final:
`Sem mudança de fluxo ou dependência.`

## Regras práticas
- Use `apply_patch` para editar arquivos.
- Quando tocar em JavaScript, valide com `node --check` antes de concluir.
- Não mexa em rotas, coleções Firestore ou permissões sem necessidade explícita.
- Reaproveite componentes e helpers já existentes.
- Prefira corrigir o ponto exato do problema em vez de recriar telas inteiras.
- Se uma funcionalidade já existe em outro módulo, transporte o comportamento em vez de duplicar a lógica.

## Arquivos sensíveis
Trate com cuidado:
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

## Estrutura mental do sistema
- `admin.html` define a navegação e registra rotas.
- `router.js` decide qual módulo renderiza.
- `db.js` concentra o acesso ao Firestore.
- `ui.js` concentra modal, toast e helpers visuais.
- Cada arquivo em `js/modules` é uma área funcional isolada.
