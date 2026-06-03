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
- O Master está congelado para novas tarefas de Admin até liberação explícita da usuária. Em tarefas do Admin, não alterar `master.html`, telas, labels, estilos, cards, abas, rotas ou lógica exclusiva do Master. O Admin pode herdar/ler dados de `system_tenants` e estruturas já existentes, mas mudanças no Master só podem ocorrer se a usuária liberar o congelamento ou pedir alteração explícita no Master.
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
- Eventos reais da Hotmart podem mudar a posição dos dados conforme o tipo de evento. Compra aprovada costuma trazer `data.buyer`/`data.purchase`; cancelamentos de assinatura podem trazer dados principais em `data.subscriber`. O webhook deve extrair e-mail, subscriber, transação, oferta e plano de forma defensiva, salvar resumo seguro em `hotmart_events` e criar pendência manual quando faltar identificador suficiente.
- Ao reprocessar evento Hotmart real salvo, nunca imprimir payload completo nem Hottok. Usar o Secret Manager, limpar apenas o marcador de processamento quando necessário e validar o resultado por campos seguros (`processingStatus`, `billingStatus`, `linkedCount`, `buyerEmail`, `hotmartSubscriberCode`, `planSlug`, `billingCycle`).
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
- Nesta fase do BocaFood, lojas não terão domínio próprio por cliente. A URL pública padrão da loja é calculada como `https://bocafood.app/{slug}`; o slug público é configurado pela usuária no Centro de Controle em `Loja Online → Link da loja` e apenas visualizado no Master.
- A rota antiga `configuracoes/dominio` pode existir apenas por compatibilidade técnica, mas a navegação principal da usuária deve apresentar `Link da loja` dentro do módulo `Loja Online`, não dentro de `Configurações`.
- O mapeamento público do slug deve ser salvo em `public_stores/{slug}` para que `bocafood.app/{slug}` resolva a loja correta. Esse documento não deve conter dados sensíveis e deve respeitar o tenant dono do slug.
- Quando uma loja tiver slug reservado, mas ainda não estiver publicada, a página pública deve exibir estado claro de loja não publicada/indisponível em vez de parecer loja inexistente.
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

### Admin — Configurações, integrações e rastreamento
- As abas de Configurações do Admin devem manter visual simples e premium: cards brancos, bordas suaves, sombra leve, campos em off-white, notas pequenas em cinza e vermelho apenas para foco, seleção ou ação principal.
- Preferência visual aprovada: evitar excesso de negrito. O BocaFood deve parecer leve, elegante e premium; usar peso alto somente em títulos, valores realmente importantes e ações principais. Textos de apoio, rodapés, microcopy, informações rápidas, labels secundárias e descrições devem usar peso normal ou médio leve.
- Quando uma tela tiver blocos internos, a borda/fundo suave deve organizar a informação sem criar aparência de card pesado dentro de card. O off-white deve ficar preferencialmente nos campos, não no painel inteiro.
- `Configurações → Geral` concentra perfil do negócio, contato/preferências e dados fiscais do negócio. Não deve exibir termos técnicos como Firebase, Storage, Auth, URL técnica ou detalhes de implementação.
- `Configurações → Usuário` é para dados do usuário responsável pela conta, como nome, WhatsApp do usuário, e-mail de acesso e recuperação de senha. Esse WhatsApp não deve ser herdado do WhatsApp da loja.
- `Configurações → Integrações` deve explicar canais, redes sociais e ferramentas de medição em linguagem simples. O bloco `Visitas e campanhas` salva GA4, GTM e Meta Pixel em `config/integracoes` e a loja pública deve carregar esses valores para rastreamento real.
- O template público `public/index.html` deve ler `config/integracoes` e carregar GA4, Google Tag Manager e Meta Pixel apenas quando os IDs forem preenchidos e tiverem formato válido. Evitar script duplicado e não inventar IDs.
- Eventos mínimos de rastreamento da loja pública: `PageView`, `add_to_cart` e `begin_checkout`. Não registrar dados pessoais de clientes finais nesses eventos.
- No checkout da loja pública, pedidos devem ser salvos em `orders` antes de limpar o carrinho. Se o salvamento falhar, o carrinho deve permanecer disponível para a cliente não perder o pedido. Em pagamento Stripe pendente/falho, manter o pedido com status `Pendente`, informar claramente que o pagamento está pendente e oferecer ação para tentar pagar novamente ou trocar a forma de pagamento sem criar pedido duplicado.
- Pedidos criados pela loja pública devem salvar aliases compatíveis com o Admin: `customerId/clientId/customerUid`, `customerName/clientName/name`, `customerPhone/phone/whatsapp`, endereço detalhado em `deliveryAddress` e também campos de topo como `streetAddress`, `addressNumber`, `neighborhood`, `city`, `province`, `country`, `postalCode`, agenda em `scheduleDate/scheduleTime/deliveryDate/deliveryTime/pickupDate/pickupTime`, pagamento em `payment/paymentMethod/paymentStatus/paymentState` e origem `source/channel/originSource/originChannel`.
- O bloco `Canais de contato` salva WhatsApp e redes sociais usadas na página pública. O campo WhatsApp deve usar o mesmo padrão visual de DDI + número agrupado usado na aba `Usuário`.

### Admin — Temporadas
- Ao criar uma Temporada com início futuro, a base de previsão deve usar histórico anterior à data de início, não pedidos dentro da própria temporada. A copy deve deixar claro quando a temporada ainda não começou e diferenciar baixa confiança por pouco histórico de baixa performance dentro da temporada.
- Quando a Temporada usa meta do Plano de Voo, a meta da temporada deve ser proporcional ao período da temporada. Se o período cruza dois meses, não somar os meses inteiros; usar apenas a fração coberta em cada mês. Quando a rota tiver dias de trabalho e dias fechados configurados, a fração deve usar esses dias de venda, não apenas dias corridos.
- No onboarding/checklist, a primeira Temporada recomendada deve começar por `Aumentar Ticket` com estratégia `Margem`, porque no início ainda há pouco histórico para orientar volume. O wizard pode pré-preencher esse padrão apenas quando ainda não existir nenhuma temporada.

### Admin — Performance
- A Performance não deve transformar falta de histórico em cálculo numérico. Quando não houver ticket médio suficiente, cards e mensagens de pedidos por dia devem mostrar `Sem base` ou explicar que ainda não dá para estimar com segurança, nunca `0 pedidos por dia` como orientação.
- Textos de leitura prática devem diferenciar ausência de base, início de mês, rota não configurada e resultado real. Evitar frases híbridas como `ticket médio atual de sem base` junto com cálculo de pedidos.

### Admin — Pedidos e canais de venda
- Quando o canal de venda tiver comissão, imposto sobre comissão ou taxa fixa, o pedido deve calcular automaticamente esses abatimentos a partir do total bruto do pedido.
- Esses valores devem ficar registrados no próprio pedido como taxas/desconto do canal, com possibilidade de edição manual no detalhe do pedido.
- O detalhe do pedido pode editar o canal de venda diretamente no campo `Origem` do resumo. Ao trocar canal, atualizar `channel/source/originChannel/originSource`, categoria financeira herdada do canal e recalcular taxas pelo padrão do novo canal; se a usuária editar comissão/taxa no detalhe, manter esses valores como override manual. Não criar um seletor paralelo de canal no card `Pagamento`.
- Para canais de venda comuns, não criar movimentação financeira separada de taxa/comissão. O Financeiro deve receber uma única entrada do pedido com o saldo líquido a receber, mantendo no movimento os campos de bruto, taxas do canal e líquido para rastreio.
- Na aba `Pedidos`, o filtro `Todos` deve ocultar pedidos cancelados da lista operacional. O KPI `Ticket médio` deve calcular apenas pedidos não cancelados; cancelados podem aparecer somente quando filtrados explicitamente por `Cancelado`.
- O detalhe do pedido deve reconhecer status de pagamento operacionais (`previsto`, `parcial`, `pago`) e técnicos do Stripe/template (`pending`, `paid`, `failed`, `canceled`). `paid` deve ser tratado como pagamento integral, sem zerar `paidAmount` ao salvar o pedido.
- Em `Criar pedido manual`, produtos com variantes/escolhas devem abrir seleção antes de entrar no pedido. O item salvo deve preservar escolhas comerciais e vínculos de estoque (`choices`, `selectedOptions`, `variants`, `options`, `stockChoices`) e usar chave de linha com escolhas para permitir o mesmo produto em combinações diferentes.
- Em `Criar pedido manual`, `Produto sob encomenda` deve validar `productionLeadDays` contra a antecedência de `Operação → Prazos e capacidade` (`config/operacao.maxAdvanceDays`, `advanceDaysLimit` ou fallback do template). Pedido sob encomenda exige data de entrega/retirada, não pode ficar antes do prazo de produção nem fora da janela máxima, e deve salvar os aliases `madeToOrder`, `productMadeToOrder`, `sobEncomenda`, `productionLeadDays`, `productionLeadTimeDays`, `productionDeadlineDate` e `productionDeadlineType`.
- A ação `Ver cliente` no detalhe do pedido deve localizar o cadastro por id normalizado, aceitando `id`, `_id`, `customerId`, `clientId`, `uid`, `customerUid` e `docId`. O clique deve interromper propagação antes de abrir o perfil para não conflitar com o modal do pedido.
- O modal `Cadastrar cliente` aberto pelo detalhe do pedido pode receber apenas o id do pedido, mas deve resolver o objeto do pedido antes de montar o rodapé. Nunca renderizar o botão `Salvar cliente` com `orderId` vazio.

### Admin — Clientes
- O cadastro de clientes deve operar com id normalizado, aceitando `id`, `_id`, `customerId`, `clientId`, `uid`, `customerUid` e `docId` em listagem, edição, salvamento, exclusão, histórico, reviews e pontos.
- Documento fiscal/NIF/CIF é opcional no cadastro de cliente. Quando vazio, não deve bloquear `Salvar cliente` ou `Atualizar cliente`; quando preenchido, deve ser validado conforme o país fiscal.

## Loja pública / Stripe

- No checkout público, a forma `Cartão online` deve mostrar copy simples para a cliente, sem detalhes técnicos da integração. A mensagem padrão deve informar a taxa estimada da Stripe como `1,5% + €0,25 por venda`.
- A forma financeira criada automaticamente para pagamentos Stripe deve nascer com taxa estimada preenchida em `taxaPercentual: 1.5` e `taxaFixa: 0.25`. A taxa real continua sendo registrada depois pela informação retornada pela Stripe quando a venda é aprovada.
- Pedidos pagos por Stripe devem registrar no documento do pedido a taxa estimada enquanto o pagamento está pendente e, após aprovação via webhook, registrar `stripeFeeAmount`, `stripeGrossAmount`, `stripeNetAmount`, origem da taxa (`stripe` ou `estimated`) e os IDs das movimentações. O Financeiro deve receber uma entrada da venda e uma saída separada de `Taxa Stripe`.

### Admin — Padrão de modais de cadastro
- O modal de `Compras → Fornecedores` é a referência atual para novos modais/cadastros do Admin, salvo quando a usuária pedir outro padrão.
- Estrutura visual: usar cards brancos com degradê vertical muito sutil `#fff` para `#FFFCFA`, borda suave `#EADFD8`, cantos arredondados próximos de 18px, sombra leve e difusa, sem aparência de formulário técnico ou ERP pesado.
- Hierarquia dos cards: primeiro card deve concentrar a identificação principal do cadastro; cards seguintes devem agrupar blocos funcionais claros, como endereço, contato, pagamento e observações. Cada card precisa ter ícone discreto, título curto em negrito moderado e texto de apoio curto.
- Subcards ou blocos internos dentro de um card não precisam ter elemento gráfico ou ícone. Usar ícone apenas quando ele ajudar a separar a leitura; se deixar a tela pesada, poluída ou repetitiva, manter somente título, texto curto e campos bem alinhados.
- Em modais compactos, preferir manter apenas o título externo padrão do modal. Não duplicar título/subtítulo dentro do card principal quando o conteúdo tiver poucos campos.
- Campos: inputs, selects e textareas devem ficar dentro de um controle off-white (`#FFFCF8`) com borda suave (`#E8DCD7`), padding interno, raio de 12px e foco com fundo branco, borda rosada e sombra vermelha discreta. Evitar campos crus apenas com borda simples quando estiverem dentro desse padrão.
- Campos de telefone/WhatsApp: manter seletor de país com bandeira/DDI e número no mesmo bloco visual, usando divisória interna e o mesmo foco suave dos demais campos.
- Campos de lista/select: manter seta visível, posicionada com respiro para dentro do campo, sem ficar colada à extremidade. A seta deve acompanhar o mesmo padrão dos selects do modal de fornecedores.
- Campos devem ocupar somente o espaço necessário para o conteúdo esperado. Um campo de número, código postal, país, prazo, unidade, quantidade, status, tipo, categoria ou select curto não deve ficar largo como um campo de nome, endereço, e-mail, busca de fornecedor, observação ou descrição. Se necessário, organizar o card em colunas proporcionais para que cada campo tenha largura coerente com o dado que será preenchido.
- Alinhamento e hierarquia entre campos são primordiais. Campos de uma mesma linha devem partir do mesmo eixo, ter altura consistente e parecer parte de um mesmo grupo visual. Quando houver campos curtos, eles devem ficar agrupados à esquerda com largura proporcional, deixando espaço livre à direita em vez de esticar artificialmente. Campos longos devem ocupar colunas maiores somente quando o conteúdo realmente exigir.
- A composição do card deve guiar a leitura: campos principais primeiro, campos complementares depois, e grupos relacionados próximos entre si. Evitar misturar campos de pesos diferentes sem alinhamento, deixar lacunas estranhas ou criar linhas em que um campo pequeno ocupe espaço excessivo.
- Quando vários subcards têm poucos campos pequenos, eles podem ficar lado a lado no desktop para reduzir altura e melhorar comparação. Não empilhar subcards curtos sem necessidade.
- Checkboxes simples não precisam parecer mini-cards. Quando a escolha for direta, usar checkbox limpo, sem fundo e sem borda, alinhado ao texto; reservar fundo/borda para grupos de opções mais complexos ou quando houver texto de apoio relevante.
- Layout desktop: usar grid proporcional e compacto. Cards principais podem ocupar a largura inteira; cards secundários podem dividir a linha quando fizer sentido, como pagamento e observações. Em mobile, empilhar tudo em uma coluna com margens confortáveis.
- Copy: falar com a usuária final, não com equipe técnica. Explicar para que a informação serve no uso da loja, sem mencionar objetos internos, herança de dados, Firebase, estrutura futura, integração futura ou lógica de bastidores.
- Tom da copy: simples, profissional, direto e humano. Não usar tom apelativo, demagógico, excessivamente didático ou frases que exponham “segredos” do produto. Evitar dizer que algo é opcional quando o card está apresentando dados importantes de cadastro.
- Estados vazios e filtros: usar linguagem prática, como “Documento não informado” ou “Ajuste a busca, limpe os filtros ou cadastre um novo fornecedor.” Evitar “sem dados fiscais” ou mensagens técnicas.
- Paginação/listagens relacionadas devem seguir o padrão de Produtos/Cardápio: mostrar intervalo de itens, seletor por página com seta alinhada, botões Anterior/Próxima e indicação visual da página atual.

### Admin — Padrão de páginas de listagem
- A página `Compras → Fornecedores` é referência para listagens administrativas do Admin que ainda não tiverem padrão próprio aprovado.
- Topo da página: usar título curto e objetivo, subtítulo simples explicando o uso prático da área e botão principal à direita. O botão principal deve ser vermelho BocaFood, arredondado, com sombra sutil e texto direto, como `Adicionar fornecedor`.
- Título e subtítulo de páginas/listagens do Admin devem seguir o padrão de `Compras → Fornecedores`: título com `22px`, peso `700`, line-height próximo de `1.15`; subtítulo com `13px`, cor cinza `#6F6860`, line-height `1.5` e largura máxima controlada. Evitar títulos grandes de `28px` em listagens administrativas internas, salvo telas com hero aprovado.
- Resumos e totalizadores: não repetir chips de totalizadores no título nem dentro do card de filtros quando a tela já tiver KPIs, tabela, paginação ou resumo próprio. Se algum resumo for realmente necessário, ele deve ter função clara e não competir com o cabeçalho, filtros ou lista.
- Card de filtros: usar card com fundo branco/degradê suave, borda `#EADFD8`, cantos arredondados, sombra leve e campos off-white no mesmo padrão do modal. Busca principal fica à esquerda; filtros secundários ficam ao lado; botão `Limpar filtros` deve ser discreto e alinhado.
- Busca: placeholder deve dizer o que a usuária pode procurar, como nome, contato, documento ou endereço. Evitar termos técnicos ou nomes de campos internos.
- Selects de filtro: devem usar seta visível com respiro para dentro do campo, seguindo o mesmo padrão visual dos selects do modal.
- Tabela/lista: cabeçalho limpo, compacto, com labels curtas; linhas com hover suave; bordas claras; sem excesso de peso visual. A tabela deve facilitar leitura rápida, não parecer planilha técnica.
- Primeira coluna: deve trazer a informação principal em destaque e uma informação secundária menor abaixo. Exemplo: nome do fornecedor em destaque e documento/endereço abaixo.
- Colunas secundárias: agrupar informações relacionadas, como contato, pagamento e status. Evitar fragmentar demais a tabela com colunas pequenas que dificultam escaneamento.
- Status: usar chips claros e consistentes. Vermelho deve ser reservado para alerta, bloqueio, erro ou ação destrutiva; status neutros/inativos devem usar cinza.
- Ações: manter ações à direita, com botões de ícone discretos. Ação destrutiva pode usar vermelho, mas sem ocupar o protagonismo visual da linha.
- Estado vazio: usar card central com ícone discreto, título claro, texto prático e CTA para criar novo registro quando fizer sentido.
- Paginação: quando houver registros, mostrar paginação no rodapé da lista seguindo o padrão de Produtos/Cardápio: intervalo exibido, seletor por página, botões Anterior/Próxima e indicação visual da página atual.
- Copy da listagem: deve explicar o que a usuária faz naquela área e como isso ajuda na operação da loja. Não mencionar Firestore, objetos fiscais, integrações futuras, coleções, IDs internos ou lógica técnica.

### Admin — Compras e fornecedores
- O cadastro de fornecedor deve falar com a usuária em linguagem simples, sem explicar bastidores técnicos como objetos fiscais, herança de endereço ou estrutura de integração futura.
- Campos fiscais de fornecedor não devem ser tratados como “opcionais” na copy do card principal quando a tela estiver pedindo dados de cadastro. A orientação deve explicar para que servem no uso da loja: compras, pagamentos e documentos.
- Evitar copy apelativa, demagógica ou excessivamente didática. O texto deve ser claro, direto e profissional.

### Admin — Estoque e regularizações
- Regularização por saldo negativo deve ser tratada como correção operacional rastreável, não como compra real. Ela não deve inventar fornecedor, documento, pagamento ou financeiro.
- A Fase 1 da regularização é apenas detecção passiva na baixa por venda: quando a saída deixa o item negativo, registrar `stockRegularizationPending`, saldo antes/depois, quantidade faltante e origem `saldo_negativo_venda` no pedido/movimentação.
- A Fase 2 da regularização é a tela `Estoque → Regularizações`, listando as pendências por pedido e item com busca, filtros, status, falta, saldo antes/depois e custo estimado.
- A Fase 3 permite aplicar manualmente uma pendência em `Estoque → Regularizações`, criando uma movimentação `entrada_regularizacao` idempotente e marcando o item da pendência como `aplicada`. Essa entrada corrige o histórico operacional de estoque, mas não cria compra, fornecedor, documento ou financeiro.
- A Fase 4 adiciona configuração em `Estoque → Regularizações` para o comportamento da falta de saldo: `Criar pendência` como padrão seguro, `Aplicar automaticamente` para gerar `entrada_regularizacao` junto com a baixa, ou `Desligado` para não gerar pendência/entrada. Essa configuração é salva em `config/estoque.regularizationMode`.
- A Fase 5 permite converter pendências selecionadas em compra rápida, criando um registro `compras` com origem `regularizacao_estoque` e entradas `entrada_compra` para os itens selecionados. Essa compra rápida não cria financeiro automático; fornecedor, documento e pagamento completo podem ser ajustados depois em Compras/Financeiro.
- Detectar regularização pendente não pode criar entrada automática, compra, movimentação financeira, ajuste de inventário ou alteração no cardápio público.
- Futuras fases podem aplicar entrada de regularização ou converter pendências em compra rápida, mas essas ações devem ser explícitas, rastreadas e separadas de compra fiscal/financeira real.

### Admin — Produção e receitas
- A aba `Produção → Receitas` deve seguir o mesmo padrão de listagem aprovado em Compras: topo limpo, título de 22px, subtítulo curto, botão principal vermelho à direita, card de filtros compacto com campos off-white, botão `Limpar filtros` apenas quando houver filtro ativo, tabela com hover suave e paginação no rodapé.
- Não repetir chips de totalizadores no cabeçalho nem dentro do card de filtros de receitas. O resumo da tela deve vir da própria lista, paginação, estados vazios ou KPIs quando forem realmente necessários.
- O modal de `Produção → Receitas` deve seguir o padrão dos modais de cadastro aprovados: cards em degradê suave, borda clara, campos off-white com foco vermelho discreto, selects com seta alinhada, grids proporcionais, custos em cards leves e rodapé com ação principal alinhada. Não transformar ficha técnica em tela pesada de ERP.
- A copy de receitas deve explicar rendimento, ingredientes, custo e produção de forma prática para a usuária, sem mencionar estruturas internas, coleções, Firestore, cálculo de bastidores ou integrações futuras.
- `Produção → Etapas de produção` é a área correta para cadastrar etapas/base de produção reaproveitáveis, como massa, recheio, creme, molho e cobertura. A Fase 2 permite salvar rendimento, unidade, ingredientes e custo próprio diretamente na etapa, mantendo compatibilidade com receitas existentes.
- A Fase 3 integra `Receitas` com `Etapas de produção`: ao selecionar uma etapa com ingredientes próprios, a ficha pode puxar esses ingredientes como sugestão inicial e preencher rendimento/unidade se os campos estiverem vazios. Nunca sobrescrever automaticamente ingredientes ou quantidades já preenchidos na receita, para evitar perda de edição manual e duplicidade de custo/consumo.
- A Fase 4 leva as etapas para `Ordens de produção`: novas ordens devem salvar `plannedStages` no snapshot e no topo da ordem, exibir `Etapas planejadas` nos detalhes e registrar `componentName`/`productionStageName` nas saídas de ingredientes. Essa fase é rastreio/visibilidade; não alterar quantidades, custos ou baixas existentes sem fase explícita posterior.
- A Fase 5 conecta `Produção → Previsão` com `Ordens de produção`: ao gerar ordem planejada pela previsão, salvar `plannedStages` e `forecastSnapshot` com capacidade, quantidade desejada, limitador, saldos e faltas da simulação. Essa ação deve criar somente ordem `planejada`; não concluir produção, não criar movimentação e não baixar estoque.
- `Produção → Configurações` não deve voltar a exibir `Etapas da receita`; ali ficam categorias, unidades e cadastros auxiliares. Rotas antigas de etapas/componentes devem continuar redirecionando para `Produção → Etapas de produção`.
- A aba `Produção → Previsão` é a área correta para previsão operacional baseada em estoque. Ela deve permanecer conservadora e rastreável: visão por `Receitas`, `Bases de produção` e `Cardápio`, cálculo por saldo atual de estoque, item limitador, status, busca, filtros, paginação, modal `Ver cálculo` e simulação de quantidade desejada.
- A previsão deve ser somente leitura até a usuária acionar uma etapa controlada. Consultar previsão, alternar visão, filtrar, abrir cálculo ou simular quantidade não pode criar movimentação, baixar estoque, alterar pedido, publicar cardápio nem modificar Stripe.
- A ação `Gerar ordem planejada` na previsão deve criar apenas ordem com status `planejada`, origem `production_forecast`, snapshot e consumo/custo previsto. Ela não conclui produção, não baixa insumos, não gera entrada de produto e não deve pular o fluxo normal de ordem de produção.
- Na visão `Cardápio`, produtos e combos só podem receber capacidade automática quando a composição estiver clara. Combos com escolhas obrigatórias sem vínculo de estoque devem ficar como `Sem composição clara`; quando houver alternativas obrigatórias calculáveis, usar leitura conservadora para evitar previsão otimista.

### Admin — Compras Configurações
- A página `Compras → Configurações` é a referência para telas de configuração operacional com listagem curta, filtros simples e modais compactos. O padrão deve ser preservado ao criar ou ajustar categorias, unidades, formas internas de classificação e configurações auxiliares.
- Hierarquia da página: não repetir o nome do módulo no topo quando a navegação lateral já deixa claro o contexto. Usar título direto da área e subtítulo curto, com a mesma escala de `Compras → Fornecedores`: título em torno de `22px`, peso `700`, line-height próximo de `1.15`; subtítulo `13px`, cor `#6F6860`, line-height `1.5`, largura máxima controlada.
- Copy do topo: explicar o benefício prático da configuração, não a estrutura do sistema. Exemplo aprovado: `Organize seus itens de compra para encontrar tudo mais rápido e manter seus custos bem separados.`
- Estrutura principal: usar card branco com degradê muito suave `#fff` para `#FFFCFA`, borda `#EADFD8`, cantos arredondados próximos de `18px`, sombra leve e difusa. Evitar fundo cinza pesado, linhas duras ou aparência de tabela técnica.
- Abas internas: evitar abas/botões redundantes quando só houver uma área ativa. Se houver abas, usar botões compactos, borda suave, fundo neutro e estado ativo discreto em vermelho BocaFood. Não usar abas grandes que pareçam navegação principal.
- Categorias: nesta fase, `Categorias` é o cadastro principal visível em Compras Configurações. `Tipos` fica removido/oculto da interface de Compras para evitar confusão com `Classe do item`. Dados antigos de tipo podem continuar existindo para compatibilidade, mas não devem aparecer como cadastro ativo de Compras.
- Texto de categorias: usar copy simples e direta. Exemplo aprovado: `Categorias organizam itens parecidos no mesmo grupo.` Evitar textos longos dentro da listagem ou descrições repetitivas em cada linha.
- Ordem de categorias: listas, filtros e selects de categorias devem aparecer em ordem alfabética consistente.
- Card de filtros: usar card de filtros compacto com fundo branco/degradê suave, borda `#EADFD8`, raio de `18px`, sombra leve e campos off-white. O card deve organizar a busca e filtros sem virar um segundo painel pesado.
- Campos de filtro: inputs e selects devem seguir o mesmo padrão dos modais: controle off-white `#FFFCF8`, borda `#E8DCD7`, raio de `12px`, altura confortável, foco com fundo branco, borda rosada e sombra vermelha discreta. Selects devem ter seta visível com respiro interno, sem ficar colada à extremidade.
- Botão `Limpar filtros`: deve ficar dentro do card de filtros, abaixo dos campos, alinhado de forma discreta. Só deve aparecer quando existir filtro aplicado além do estado padrão da tela; não exibir o botão quando nada pode ser limpo.
- Busca e filtros: a busca deve usar placeholder prático, orientando pelo que a usuária encontra. Filtros devem ser poucos e úteis. Não mostrar KPIs, totalizadores ou chips de resumo dentro do card de filtros; o card de filtros deve ficar focado apenas em busca, filtros e limpeza condicional.
- Listagem: usar linhas/cards limpos, com cabeçalho compacto, bordas claras, hover suave e ações alinhadas à direita. A informação principal deve ficar em destaque moderado; informações secundárias devem ser menores e cinza. Evitar descrições auxiliares longas repetidas em cada item.
- Ações da listagem: botões de editar/excluir devem ser discretos, alinhados, com ícones ou textos curtos. A ação destrutiva pode usar vermelho, mas sem competir com a ação principal de adicionar/salvar.
- Botão principal da página/card: usar vermelho BocaFood, arredondado, altura compacta, sombra sutil, hover leve e texto direto, como `Adicionar categoria` ou `Nova categoria`. Em telas de configuração com lista dentro de card, o botão principal deve ficar alinhado ao título do card, à direita no desktop e em posição confortável no mobile. Não usar botões grandes demais para ações simples.
- Modais compactos: para `Categorias`, `Unidades` e outros cadastros pequenos, manter somente o título externo padrão do modal. Não duplicar título/subtítulo dentro do card quando o formulário tem poucos campos.
- Card interno do modal: usar o mesmo fundo/degradê suave da página, borda `#EADFD8`, raio próximo de `18px` e sombra leve. O card deve sustentar o formulário sem parecer card dentro de card pesado.
- Campos dos modais: usar campos diretos no padrão dos modais de produto/fornecedor, com off-white, borda suave, foco vermelho discreto e altura consistente. Não usar wrappers estranhos nem campos crus que destoem do padrão.
- Layout dos campos no modal: campos curtos, como classe, status, unidade, símbolo, fator, categoria e flags, devem ocupar apenas o espaço necessário. Campos de nome ou descrição podem ser maiores. Evitar esticar campo curto para largura inteira sem necessidade.
- Selects dos modais: manter seta visível, com padding interno e posicionamento confortável. A seta deve aparecer antes de abrir a lista e não pode ficar na extremidade do campo.
- Rodapé dos modais: usar botões `Cancelar` e `Salvar alterações` alinhados à direita no desktop; no mobile, podem empilhar ou ocupar largura confortável. `Salvar alterações` é a ação primária vermelha; `Cancelar` é secundário claro/cinza.
- Copy dos modais: explicar o que a usuária está organizando e como isso ajuda a operação, sem falar em coleções, Firestore, estrutura futura ou lógica técnica. Para campos simples, preferir labels claros a textos de ajuda longos.
- Estados vazios: usar mensagem curta, clara e prática. Exemplo: nenhuma categoria encontrada deve orientar a ajustar busca/filtro ou criar nova categoria. Não usar termos técnicos nem estado vazio com aparência de erro.
- Paginação: quando a lista crescer, seguir o padrão de Produtos/Cardápio: mostrar intervalo exibido, seletor por página com seta alinhada, botões `Anterior`/`Próxima` e indicador visual da página atual.
- Responsividade: no desktop, filtros e campos podem ficar em linha quando houver espaço; no mobile, empilhar em uma coluna com boa área de toque. Não deixar texto quebrar de forma feia nem botão sair do card.
- Cores: vermelho BocaFood deve aparecer em ação principal, foco, seleção e alerta real. Fundo de organização deve usar branco/off-white/rosado muito suave. Evitar excesso de vermelho em bordas de blocos internos.
- Tom geral: profissional, simples, premium e operacional. A tela deve ajudar a usuária organizar compras e custos sem parecer ERP pesado, planilha técnica ou página de configuração de desenvolvedor.

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
- As URLs públicas atuais dos documentos legais globais são `https://bocafood.app/termosdeuso` e `https://bocafood.app/politicadeprivacidade`. Essas rotas devem renderizar somente páginas publicadas de `system_pages`.
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
