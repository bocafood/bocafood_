# AGENTS.md

## Boca Food

### Objetivo do sistema
O Boca Food é um sistema de gestão e operação de loja com painel admin, catálogo público, pedidos, cozinha, financeiro, clientes, promoções, upsell, performance e publicação por tenant/domínio próprio.

### Regras de tenant e multiusuário
- O sistema é multi-tenant.
- Toda leitura, escrita, exportação e publicação devem respeitar o `tenantId` ou `lojaId` selecionado.
- Não misturar dados entre lojas.
- Ao publicar/exportar, enviar somente os dados da loja selecionada.
- O site público é single-tenant por domínio/repositório.

### Padrão de módulos
- Cada área funcional vive em um módulo próprio.
- Reutilize os módulos existentes sempre que possível.
- Preserve as rotas, integrações e contratos já existentes.

### Regras de trabalho
- Não leia o projeto inteiro sem necessidade.
- Antes de alterar qualquer coisa, identifique apenas os arquivos relacionados à tarefa.
- Altere somente os arquivos necessários para a mudança pedida.
- Não refatore fora do pedido.
- Não altere rotas, permissões, estrutura de dados ou regras globais sem necessidade explícita.
- Preserve o funcionamento atual do sistema.
- Mantenha os textos exibidos ao cliente final em espanhol.

### Fonte de verdade dos arquivos publicados
- O Firebase Hosting publica a pasta `public/`; portanto, `public/` é a fonte de verdade para tudo que é publicado.
- Para qualquer alteração visual, funcional ou de módulo usado pelo Admin ou pela loja publicada, edite os arquivos dentro de `public/`.
- Não edite duplicatas da raiz para telas publicadas, exceto quando a tarefa pedir explicitamente.
- Arquivos duplicados da raiz devem ser tratados como legado até uma futura limpeza ou reconciliação controlada.
- Antes de qualquer deploy, confirme que as mudanças necessárias estão dentro de `public/`.
- A raiz do projeto deve ser usada para documentação, changelogs, configurações, scripts locais e arquivos internos que não devem ser publicados.

### Finalização obrigatória
- Sempre atualizar `AI_CHANGELOG.md` ao finalizar qualquer alteração.
- Registrar no changelog o que foi feito, os arquivos alterados, o motivo e o impacto esperado.
- Se a mudança afetar módulos, dependências ou fluxos, atualizar também os documentos de arquitetura necessários.
