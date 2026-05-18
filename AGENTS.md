# AGENTS.md

## Boca Food

### Objetivo do sistema
O Boca Food é um sistema de gestão e operação de loja com painel admin, catálogo público, pedidos, cozinha, financeiro, clientes, promoções, upsell, performance, publicação centralizada e suporte multi-tenant.

### Regras de tenant e multiusuário
- O sistema é multi-tenant.
- Toda leitura, escrita, exportação e publicação devem respeitar o `tenantId` ou `lojaId` selecionado.
- Não misturar dados entre lojas.
- Ao publicar/exportar, enviar somente os dados da loja selecionada.
- Nesta fase, a publicação é centralizada no BocaFood. Não assumir repositório GitHub ou domínio próprio por tenant.
- A loja pública padrão usa `https://bocafood.app/loja/{slug}`, com o slug configurado pela usuária no Centro de Controle e apenas visualizado no Master.

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

### Master e contas BocaFood
- A área principal do Master para clientes do SaaS chama-se "Contas", não "Usuários".
- A listagem de Contas deve buscar somente `system_tenants` válidos e nunca misturar clientes finais, pedidos, `customers`, `tenants/{tenantId}/clientes` ou usuários soltos do Firebase Auth sem tenant real.
- Registros importados apenas de Firebase Auth, sem loja, billing, status SaaS ou origem válida, não devem aparecer como Conta BocaFood.
- Ações de conta no Master devem ser funcionais ou ficar ocultas/desabilitadas; não deixar botões clicáveis sem ação real.
- Campos vindos do Admin, Hotmart, Firebase Auth ou cálculo do sistema devem indicar origem visual e ficar bloqueados por padrão. Correções manuais devem exigir modo suporte quando aplicável e gerar log.
- O Master deve ler dados reais de `system_tenants/{uid}` e exibir estado vazio claro quando algo não existir. Não usar placeholders como dados reais.
- O Master pode ter uma versão publicada restrita para diagnóstico de produção, mas ela deve exigir Firebase Auth, validação backend/allowlist Master e nunca retornar senhas, tokens, HTML sensível ou payloads completos.

### Admin, cadastro e dados herdados
- O Admin/Centro de Controle é a origem real dos dados operacionais preenchidos pela usuária, como dados da conta, loja, template, redes sociais, localização atendida, endereço público e slug.
- Dados relevantes para suporte, cobrança, fiscal, publicação e Master devem ser sincronizados para `system_tenants/{uid}` com `merge`, sem apagar `billing`, `auth`, `seo`, Hotmart ou outros campos existentes.
- A aba Admin Configurações → Conta / Usuária guarda dados do usuário responsável pela conta, não dados da loja. O usuário responsável deve ter nome completo, nome curto/social quando existir, WhatsApp próprio, idioma da conta, e-mail de acesso e papel/permissão.
- O campo `role`/Papel pertence ao respectivo usuário da conta e deve preparar o sistema para múltiplos usuários futuros, mesmo que nesta fase exista apenas a responsável principal.
- O nome da loja, cidade principal, localização atendida, redes sociais e slug público devem alimentar `system_tenants/{uid}.store` para aparecerem no Master.
- Cidade, província/estado e país operacionais da loja devem vir primeiro da localização atendida configurada antes das zonas de entrega; endereço público da loja em Atendimento → Endereço pode servir como fallback.
- O cadastro de zonas de entrega só deve ser liberado depois de a localização atendida estar definida.

### Onboarding e diagnóstico inicial
- O onboarding público fica em `public/cadastro.html` e deve parecer uma experiência guiada de primeiro acesso, não uma landing page nem um formulário genérico.
- O fluxo coleta acesso, dados do usuário responsável, dados iniciais da loja e diagnóstico de maturidade do negócio.
- Dados de diagnóstico devem ser salvos em `system_tenants/{uid}.businessProfile`, com origem `signup_onboarding`, mantendo compatibilidade com campos antigos e sem sobrescrever billing vindo da Hotmart.
- O Master pode exibir respostas individuais no modal da conta e também resumos agregados em gráficos/tabelas leves, sem criar campanhas automaticamente a partir desses dados.
- O modo prévia do cadastro pode existir para validar telas sem criar conta, consultar Hotmart ou salvar dados reais; ele não substitui validação do fluxo real autenticado.

### Hotmart, plano e cobrança
- A fonte principal de plano/cobrança é `system_tenants/{uid}.billing`, com espelhos no topo apenas para compatibilidade (`plan`, `billingStatus`, `billingCycle`, `trialEndsAt`, `activatedAt`, `canceledAt`).
- O ciclo padrão é `billing.billingCycle`; `billing.cycle` antigo só deve ser usado como fallback de leitura.
- Mapeamento atual de ofertas Hotmart:
  - `u7wyvsyn` → `planSlug: essencial`, `billingCycle: monthly`, `trialDays: 15`, nome exibido "Plano Essencial".
  - `kah1d2ne` → `planSlug: compromisso_anual`, `billingCycle: annual`, `trialDays: 15`, nome exibido "Plano Compromisso Anual".
  - `woavlwrh` → `planSlug: fundadoras`, `billingCycle: monthly`, `trialDays: 0`, nome exibido "Plano Fundadoras".
- Não usar `starter` como plano ativo do BocaFood nesta fase; se aparecer dado antigo `starter`, manter leitura compatível e migrar para `essencial` ao reprocessar/atualizar.
- Eventos Hotmart devem atualizar status de cobrança sem apagar tenant, loja ou dados: ativo, pagamento pendente, atraso, cancelamento, reembolso e chargeback.
- Eventos Hotmart de cancelamento, reembolso ou chargeback devem bloquear automaticamente o acesso da conta (`accountStatus/status = blocked`) sem apagar tenant, loja ou dados. Um evento Hotmart ativo pode liberar novamente a conta (`accountStatus/status = active`) quando a assinatura voltar a estar ativa.
- `HOTMART_HOTTOK` deve ser configurado via Firebase Secret Manager / Functions Secrets, nunca como variável solta manual no Cloud Run. Nunca colar comandos de terminal no valor do Hottok, nunca printar ou compartilhar o token, e após cada deploy de `hotmartWebhook` testar/reprocessar um webhook Hotmart confirmando status 200.
- `pending_hotmart_access` é apenas para exceções/pendências de vínculo, não uma lista principal de contas.
- Se `billing.provider` for `hotmart`, campos de plano/ciclo/status/trial/datas são controlados pela Hotmart e ficam somente leitura no Master. Se for `manual`, o Master pode editar e deve registrar logs.

### Hotmart Webhook — Hottok e deploy seguro
- `HOTMART_HOTTOK` é segredo sensível e nunca deve ser salvo em `functions/.env`, arquivos `.env`, código fonte, `AI_CHANGELOG.md`, prints, logs, variáveis manuais do Cloud Run ou documentação pública.
- `HOTMART_HOTTOK` deve ser configurado exclusivamente via Firebase Functions Secrets / Secret Manager.
- Comando correto para criar ou atualizar o secret: `firebase functions:secrets:set HOTMART_HOTTOK --project bocado-brasil`.
- O webhook `hotmartWebhook` deve declarar o secret no código da Function. Não criar variável comum `HOTMART_HOTTOK` no Cloud Run.
- Não editar `HOTMART_HOTTOK` manualmente em Google Cloud → Cloud Run → hotmartwebhook → Variáveis de ambiente. Se existir variável normal `HOTMART_HOTTOK` no Cloud Run, ela deve ser removida para não conflitar com o Secret.
- Deploy da Hotmart deve ser feito preferencialmente pelo script `./deploy-hotmart-webhook.sh`. Se faltar permissão, rodar `chmod +x deploy-hotmart-webhook.sh` e depois `./deploy-hotmart-webhook.sh`.
- Após qualquer deploy da `hotmartWebhook`, testar o webhook na Hotmart e confirmar status 200/processado.
- Interpretação dos status: `200` significa webhook aceito; `401` significa Hottok errado, ausente ou mal configurado; `403` significa acesso público bloqueado; `404` significa URL errada ou Function inexistente; `500` significa erro interno da Function.
- URL oficial do webhook Hotmart: `https://us-central1-bocado-brasil.cloudfunctions.net/hotmartWebhook`.
- Nunca colar comandos de terminal no campo de valor do Hottok. Exemplo de erro que nunca deve ser repetido: `printf "HOTMART_HOTTOK=%s\n" "$(pbpaste | tr -d '\r\n')" > functions/.env`.
- Se o Hottok precisar ser trocado: gerar/copiar novo Hottok na Hotmart, rodar `firebase functions:secrets:set HOTMART_HOTTOK --project bocado-brasil`, rodar `./deploy-hotmart-webhook.sh`, testar webhook na Hotmart e confirmar status 200.
- A Function possui validação defensiva para rejeitar valores claramente errados no `HOTMART_HOTTOK`, como `printf`, `pbpaste`, `functions/.env`, `HOTMART_HOTTOK=` e quebras de linha suspeitas. Essa validação não substitui o uso correto do Secret.

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
- No Master, não manter atalhos duplicados para áreas que já possuem aba própria. Fluxos legados de GitHub/repositório por cliente devem ficar ocultos enquanto a publicação centralizada estiver ativa. Configurações técnicas perigosas, como edição de JSON cru, não devem ficar expostas como card comum e devem viver em área avançada de ferramentas técnicas.
- Logs de atividade devem ser leves e registrar apenas ações relevantes para suporte, auditoria, cobrança e segurança: login no Centro de Controle, publicação/despublicação da loja, alteração de slug público, alteração de dados fiscais, alteração de plano/status de assinatura, bloqueio/liberação de conta, alteração de status da loja, configurações críticas e erros importantes de publicação, autenticação, pagamento ou integração. Não registrar cliques comuns, abertura de abas, scroll, digitação, foco em campo, visualizações simples ou alterações temporárias não salvas.
- Logs devem usar `system_access_logs` com estrutura enxuta: `tenantUid`, `email`, `action`, `module`, `entityType`, `entityId`, `summary`, `source`, `severity`, `createdAt` e `metadata`. Nunca salvar senhas, tokens, payload completo, dados pessoais desnecessários, antes/depois completo de objetos grandes, HTML grande, imagens ou dados de clientes finais.
- Etiquetas de contas em `system_tenants/{uid}.tags` devem ser leves, sem dados sensíveis, e usadas para automações como e-mails por gatilho. Gatilhos de e-mail devem usar deduplicação, janela anti-reenvio e logs curtos; não enviar e-mails repetidos sem respeitar a janela configurada. Rotinas agendadas devem ser econômicas, limitar leituras e evitar varrer dados desnecessários.
- Tags de CRM para contas são uma camada separada das etiquetas transacionais de e-mail. Devem usar `system_crm_tags`, `system_crm_tag_rules`, `system_crm_tag_logs` e `system_tenants/{uid}.crmTags`/`crmTagMeta`. Não usar essas tags em `system_email_triggers`, não misturar com `system_tenants/{uid}.tags` e não alterar `dailyEmailTriggerCheck` para ler CRM tags. Campanhas/segmentações comerciais podem usar `crmTags`, mas e-mails transacionais continuam usando apenas as etiquetas transacionais existentes.
- O cadastro inicial do BocaFood deve ser guiado, em etapas, com visual de onboarding/conversa. A tela de cadastro deve coletar apenas o necessário para criar acesso, vincular compra Hotmart, iniciar o tenant e entender a maturidade inicial do negócio; dados de diagnóstico inicial devem ser salvos em `businessProfile`, e dados mais detalhados da loja devem ser completados depois no Centro de Controle.
- Quando o cadastro encontrar compra ativa e concluir o onboarding, a usuária deve aceitar Termos de Uso e Política de Privacidade antes de entrar no Centro de Controle. O aceite deve ser salvo em `system_tenants/{uid}.legalAcceptance` e auditado em `system_legal_acceptances`; o Master deve mostrar esse aceite como dado somente leitura da conta.
- A etapa final do cadastro também pode coletar preferências de comunicação comercial para uso futuro do CRM. Essas preferências devem ser salvas em `system_tenants/{uid}.communicationPreferences` e não devem disparar campanhas automaticamente enquanto o módulo promocional/CRM não estiver concluído.
- O e-mail transacional de cadastro concluído (`welcome_access_created`/`Cadastro concluído`) deve ser enviado somente depois da confirmação final com aceite dos documentos, não antes da liberação visual do acesso.
- Se o cadastro não encontrar compra ativa para o e-mail autenticado, a etapa final não deve exibir sucesso, checklist positivo nem botão de entrada. Deve mostrar estado de alerta claro orientando a usar o e-mail da compra ou falar com `teajudo@bocafood.app`.
- Para controle de custo, logs comuns devem ser pequenos, as leituras do Master devem ser limitadas e não se deve instrumentar ações de alta frequência. Futuramente implementar retenção automática: 90 dias para logs comuns e 1 ano para logs de cobrança, Hotmart, acesso e publicação.

### E-mails automáticos
- O SMTP de produção é configurado pelo Master em `system_email_settings/default` e `system_private_email_secrets/default`; senha SMTP nunca deve ser exposta ao frontend, logs ou changelog.
- Templates transacionais vivem em `system_email_templates/{templateKey}` e devem usar o layout transacional BocaFood compartilhado entre prévia do Master, envio local e Functions.
- O rodapé transacional deve usar configurações globais `supportEmail`, `termsUrl`, `privacyUrl`, `brandName`, `securityText` e `footerReasonDefault`; templates podem sobrescrever o motivo pelo campo opcional `footerReason`.
- Recuperação de senha deve usar o template `password_reset` e a página BocaFood `/redefinir-senha`; não usar o e-mail visual padrão do Firebase como fluxo principal.
- Gatilhos transacionais por etiqueta continuam separados de CRM tags. Não misturar `system_email_triggers` com `system_crm_tags`.
- `test_email` é manual; templates Hotmart e assinatura podem ser disparados por webhook/Functions; templates por etiqueta são disparados por `dailyEmailTriggerCheck` e `system_email_triggers`.
- `sendTestEmail`, recuperação de senha e envios automáticos devem usar o mesmo helper SMTP real das Functions para evitar divergência entre teste e envio final.
- Para SMTP Brevo nas portas 587 e 2525, usar STARTTLS (`secure=false`, `requireTLS=true`); porta 465 usa TLS implícito (`secure=true`). Fazer `trim` em host, usuário, senha e remetente.
- O e-mail de acesso bloqueado deve usar template próprio `access_blocked` quando cancelamento, reembolso ou chargeback Hotmart bloquearem a conta. Pagamento pendente/atraso deve continuar usando `payment_pending` enquanto não houver regra explícita de bloqueio por inadimplência.

### Login, acesso e recuperação de senha
- A tela de login do Centro de Controle deve ser focada em acesso ao Admin, com visual alinhado ao cadastro e ao padrão BocaFood.
- `Esqueci minha senha` deve abrir fluxo/tela própria de recuperação, chamando `requestPasswordResetEmail`.
- A página `/redefinir-senha` é a tela BocaFood para concluir troca de senha usando `oobCode` do Firebase Auth.
- Mensagens de erro de login e recuperação não devem expor detalhes técnicos nem confirmar indevidamente se uma conta existe.

### Páginas do sistema
- Páginas institucionais globais, como Termos de Uso e Política de Privacidade, devem ser gerenciadas no Master em `system_pages`.
- O editor de páginas do sistema deve sanitizar HTML de entrada/preview e remover `script`, `iframe`, handlers inline e URLs `javascript:`.
- Links de Termos e Política usados em e-mails e cadastro devem apontar para as páginas corretas publicadas/configuradas; não usar slugs temporários.
- A criação de páginas no Master não deve linkar automaticamente em todos os fluxos sem uma solicitação explícita.

### Backup e manutenção
- O backup oficial de dados deve usar exportação nativa do Firestore para Cloud Storage, não o fluxo legado de backup de código por GitHub.
- Configurações do backup Firestore ficam em `system_backup_settings/firestore`; execuções e erros ficam em `system_firestore_backups`.
- O Master pode iniciar backup manual e consultar logs, e a rotina `dailyFirestoreBackup` executa backup agendado quando habilitada.
- Backup Firestore requer projeto em Blaze, bucket Cloud Storage válido e permissões IAM para o service account das Functions exportar Firestore e escrever no bucket.
- O card/fluxo legado `Backup do Sistema` deve permanecer oculto na interface principal enquanto a publicação centralizada e o backup oficial de dados estiverem ativos.

### Regras de trabalho
- Não leia o projeto inteiro sem necessidade.
- Antes de alterar qualquer coisa, identifique apenas os arquivos relacionados à tarefa.
- Altere somente os arquivos necessários para a mudança pedida.
- Não refatore fora do pedido.
- Não altere rotas, permissões, estrutura de dados ou regras globais sem necessidade explícita.
- Preserve o funcionamento atual do sistema.
- Mantenha os textos exibidos ao cliente final em espanhol.
- Quando a usuária disser que uma tarefa, correção ou ação "deu certo", considerar isso como autorização para concluir o ciclo operacional relacionado: rodar validações necessárias, fazer deploy se a mudança precisar estar publicada, commitar somente os arquivos relacionados e fazer push, inclusive direto na `main` se esse for o fluxo/branch atual.
- Mesmo com autorização de conclusão por "deu certo", nunca usar `git add .` e nunca incluir arquivos sensíveis ou locais como `.env`, `.env.save`, service accounts, credenciais, caches ou `.firebase/`. Se aparecer arquivo sensível ou suspeito no status, parar e avisar antes de commitar.

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
