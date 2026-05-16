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

### Nomenclatura oficial
- Na interface do Master, usar "Contas" para clientes/tenants BocaFood.
- Não usar "Usuários" para representar tenants, contas ou negócios.
- Usar "Usuários da conta" apenas quando se tratar de pessoas com acesso ao Centro de Controle daquela conta.
- Usar "Clientes da loja" apenas para consumidores finais da loja pública.
- Usar "Loja pública" para a vitrine/cardápio publicado.
- Usar "Negócio" para os dados comerciais e operacionais da conta.
- Definições: Conta é o cliente do BocaFood/tenant/negócio que paga ou usa o SaaS; Negócio é a operação gastronômica da conta; Loja pública é a vitrine online onde o cliente final faz pedido; Usuários da conta são pessoas que acessam o Centro de Controle; Cliente final é a pessoa que compra na loja pública.

### Padrão de módulos
- Cada área funcional vive em um módulo próprio.
- Reutilize os módulos existentes sempre que possível.
- Preserve as rotas, integrações e contratos já existentes.

### Padrão global de formulários
- Campos de país nunca devem ser input livre. Devem usar select/lista com opções padronizadas, salvando preferencialmente o código ISO: Espanha (ES), Portugal (PT), Brasil (BR), França (FR), Itália (IT), Alemanha (DE), Reino Unido (GB), Estados Unidos (US) e Outro (OTHER).
- Campos de idioma nunca devem ser input livre. Devem usar select/lista com opções padronizadas, salvando o código de idioma: Português Brasil (pt-BR), Português Portugal (pt-PT), Espanhol Espanha (es-ES), Inglês (en) e Francês (fr).
- Campos de telefone e WhatsApp devem usar seletor de país com bandeira e preencher automaticamente o código telefônico: Espanha +34, Portugal +351, Brasil +55, França +33, Itália +39, Alemanha +49, Reino Unido +44 e Estados Unidos +1.
- Valores de telefone devem ser salvos separados em `phoneCountryCode`, `phoneNumber`, `phoneFull`, `whatsappCountryCode`, `whatsappNumber` e `whatsappFull`.
- Esse padrão vale para Master, Admin, fornecedores, clientes, usuários, configurações da loja e qualquer formulário futuro com país, idioma, telefone ou WhatsApp.
- Nesta fase do BocaFood, lojas não terão domínio próprio por cliente. A URL pública padrão da loja é calculada como `https://bocafood.app/loja/{slug}`; o slug público é configurado pela usuária no Centro de Controle em Configurações → Domínio / URL e apenas visualizado no Master.
- País fiscal é definido e alterado somente pelo Master. A usuária pode visualizar esse valor no Admin, mas não pode editá-lo. O Master pode corrigir apenas em modo suporte, com log, porque o campo impacta regras fiscais, campos, impostos e comportamento futuro do sistema. País fiscal não é o país do endereço: ele define regras fiscais e módulos liberados no Admin via `Auth.getFiscalCountry()`/`FiscalConfig`. Nesta fase, somente Espanha (ES) e Portugal (PT) têm regra fiscal implementada; Espanha exibe o módulo Fiscal, Portugal não exibe o módulo Fiscal. Outros países podem existir como país de endereço/loja, mas não devem liberar módulo fiscal até terem configuração fiscal própria.
- No Master, campos operacionais preenchidos pela usuária no Admin devem ser somente leitura por padrão. O Master pode visualizar para suporte, mas não deve editar livremente dados que pertencem ao fluxo da usuária, salvo em modo de suporte/correção explícito.
- Campos automáticos vindos de integrações, Firebase Auth, Hotmart ou cálculos do sistema devem ser somente leitura. Campos editáveis pelo Master devem se limitar a controle interno: status da conta, plano, status da assinatura, ciclo, provider de cobrança manual, trial, bloqueio/liberação, observações internas, ações de suporte, vínculo manual Hotmart e status administrativo da loja quando necessário.
- Campos de cobrança controlados por provedor externo, como Hotmart, devem ser somente leitura no Master. O Master só edita plano, ciclo, status de assinatura, trial, ativação e cancelamento diretamente quando `billing.provider` for `manual`; alterações manuais de cobrança devem registrar log em `system_access_logs`.
- SEO técnico fica no Master. SEO comercial/básico fica no Admin da usuária. A usuária não edita diretamente `metaRobots`, schema, sitemap, robots ou Search Console; esses campos técnicos são controlados pelo BocaFood/Master.
- Campos preenchidos no Admin/Centro de Controle devem ser sincronizados para `system_tenants/{uid}` quando forem relevantes para Master, suporte, cobrança, fiscal ou publicação. O Master não deve depender de `localStorage`, placeholders ou campos mockados; se um dado não existir, exibir estado vazio claro em vez de inventar valor.
- Cidade, província/estado e país operacionais da loja devem vir da localização atendida configurada pela usuária no Admin antes das zonas de entrega. Quando Google Places/BocaPlaces estiver disponível, esses campos devem ser preenchidos automaticamente e sincronizados para `system_tenants/{uid}.store`.
- Logs de atividade devem ser leves e registrar apenas ações relevantes para suporte, auditoria, cobrança e segurança: login no Centro de Controle, publicação/despublicação da loja, alteração de slug público, alteração de dados fiscais, alteração de plano/status de assinatura, bloqueio/liberação de conta, alteração de status da loja, configurações críticas e erros importantes de publicação, autenticação, pagamento ou integração. Não registrar cliques comuns, abertura de abas, scroll, digitação, foco em campo, visualizações simples ou alterações temporárias não salvas.
- Logs devem usar `system_access_logs` com estrutura enxuta: `tenantUid`, `email`, `action`, `module`, `entityType`, `entityId`, `summary`, `source`, `severity`, `createdAt` e `metadata`. Nunca salvar senhas, tokens, payload completo, dados pessoais desnecessários, antes/depois completo de objetos grandes, HTML grande, imagens ou dados de clientes finais.
- Para controle de custo, logs comuns devem ser pequenos, as leituras do Master devem ser limitadas e não se deve instrumentar ações de alta frequência. Futuramente implementar retenção automática: 90 dias para logs comuns e 1 ano para logs de cobrança, Hotmart, acesso e publicação.

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
- `master.html` fica fora de `public/` porque é painel interno do Master e não deve ser publicado no Firebase Hosting.
- `public/admin.html` é o Centro de Controle da usuária e deve ser acessado em testes locais por `http://127.0.0.1:3000/admin.html`, nunca abrindo o arquivo diretamente por `file://`.
- A loja pública e seus templates ficam dentro de `public/`, incluindo `public/index.html` e os assets/módulos usados pela loja publicada.
- O `server.rb` local deve servir `/master.html` a partir da raiz interna e `/admin.html`, `/index.html`, JS, CSS e assets a partir de `public/`.
- Para qualquer alteração visual, funcional ou de módulo usado pelo Admin ou pela loja publicada, edite os arquivos dentro de `public/`.
- Não edite duplicatas da raiz para telas publicadas, exceto quando a tarefa pedir explicitamente.
- Arquivos duplicados da raiz devem ser tratados como legado até uma futura limpeza ou reconciliação controlada.
- Antes de qualquer deploy, confirme que as mudanças necessárias estão dentro de `public/`.
- A raiz do projeto deve ser usada para documentação, changelogs, configurações, scripts locais e arquivos internos que não devem ser publicados.

### Finalização obrigatória
- Sempre atualizar `AI_CHANGELOG.md` ao finalizar qualquer alteração.
- Registrar no changelog o que foi feito, os arquivos alterados, o motivo e o impacto esperado.
- Se a mudança afetar módulos, dependências ou fluxos, atualizar também os documentos de arquitetura necessários.
