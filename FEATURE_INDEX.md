# Feature Index

## Core
| Módulo | Arquivos principais | Componentes usados | Funções/serviços | Firestore | Telas afetadas | Dependências |
|---|---|---|---|---|---|---|
| Core | `js/core/auth.js`, `js/core/db.js`, `js/core/router.js`, `js/core/ui.js`, `js/core/image-tools.js` | login, modal, toast, loading, navegação, otimização de mídia | autenticação, wrapper Firestore, rota por hash, formatadores, upload/otimização de imagens | `config`, schemas e coleções de todos os módulos, Firebase Storage | admin inteiro | todos os módulos dependem de `DB`, `UI`, `Router` e, para mídia, `ImageTools` |

## Infra / Firebase
| Módulo | Arquivos principais | Componentes usados | Funções/serviços | Firestore / Storage | Telas afetadas | Dependências |
|---|---|---|---|---|---|---|
| Infra Firebase | `firebase.json`, `storage.rules`, `firestore.rules` | configuração de deploy e regras | publicação de regras do Firestore/Storage | Storage e Firestore por tenant | fluxo de upload de imagem, produtos, aparência e publicação | depende do backend/Firebase CLI e do tenant selecionado |

## Performance
| Módulo | Arquivos principais | Componentes usados | Funções/serviços | Firestore | Telas afetadas | Dependências |
|---|---|---|---|---|---|---|
| Performance | `js/modules/performance.js` | cards KPI, filtros, tabelas, mini gráficos | previsto vs real, cenário do mês, comparação temporal | `orders`, `movimentacoes`, `financeiro_entradas`, `financeiro_saidas`, `financeiro_apagar`, `financeiro_categorias`, `flight_plans`, `flight_plan_month_scenarios`, `config/dinheiro` | `Performance` | depende de `Plano de Voo`, `Financeiro`, `Pedidos` |

## Pedidos
| Módulo | Arquivos principais | Componentes usados | Funções/serviços | Firestore | Telas afetadas | Dependências |
|---|---|---|---|---|---|---|
| Pedidos | `js/modules/pedidos.js` | kanban, listas, modais, checkout manual, painel cozinha | criação/edição de pedido, status, WhatsApp, cliente vinculado, pagamento, agendamento | `orders`, `movimentacoes`, `store_customers`, `reviews`, `config` | `Pedidos`, `Cozinha`, detalhe do pedido, modal manual | depende de `Clientes`, `Marketing`, `Financeiro`, `Catalogo`, `Performance` |

## Cardápio
| Módulo | Arquivos principais | Componentes usados | Funções/serviços | Firestore | Telas afetadas | Dependências |
|---|---|---|---|---|---|---|
| Cardápio | `js/modules/catalogo.js`, `js/core/image-tools.js`, `server.rb` | cards de produto, modal, categorias, variantes, tags, fichas, SEO/template | CRUD de produtos e estrutura da loja, upload legado de imagem via backend para GitHub Raw quando o Storage estiver desativado, upload otimizado quando o Storage estiver ativo | `products`, `categories`, `variantGroups`, `tags`, `produtos_prontos`, `fichasTecnicas`, `itens_custo`, `config`, Firebase Storage, GitHub repo do tenant | `Cardápio > Produtos/Categorias/Variantes/Tags/Template/SEO` | depende de `Receitas`, `Compras`, `Operacao`, `Pedidos`, `Marketing`, `server.rb` para publicação de imagem |

## Produção
| Módulo | Arquivos principais | Componentes usados | Funções/serviços | Firestore | Telas afetadas | Dependências |
|---|---|---|---|---|---|---|
| Produção | `js/modules/receitas.js` | tabs internas, modais de cadastro, listas | receitas, componentes, categorias, unidades | `recipe_categories`, `recipe_components`, `unidades_medida` | `Produção` | depende de `Cardápio` e `Compras` |

## Compras
| Módulo | Arquivos principais | Componentes usados | Funções/serviços | Firestore | Telas afetadas | Dependências |
|---|---|---|---|---|---|---|
| Compras | `js/modules/compras.js` | listas, modais, filtros, ações rápidas | registros de compra, fornecedores, tipos, categorias, itens | `compras`, `compras_categorias`, `compras_tipos`, `fornecedores`, `itens_custo`, `products`, `unidades_medida`, `financeiro_apagar` | `Compras` | depende de `Financeiro`, `Produção`, `Cardápio` |

## Preços e Margem
| Módulo | Arquivos principais | Componentes usados | Funções/serviços | Firestore | Telas afetadas | Dependências |
|---|---|---|---|---|---|---|
| Preços e Margem | `js/modules/dinheiro.js` | radar, composição, lista, simulador, regras | cálculo de preço, custo, margem e ajuste | `config`, `products` | `Preços e Margem` | depende de `Cardápio`, `Compras`, `Marketing` |

## Ações de Vendas
| Módulo | Arquivos principais | Componentes usados | Funções/serviços | Firestore | Telas afetadas | Dependências |
|---|---|---|---|---|---|---|
| Ações de Vendas | `js/modules/marketing.js` | cards, filtros, modais, blocos de análise, painéis de pontos | promoções, cupons, upsell, avaliações, pontos | `promotions`, `coupons`, `upsellRules`, `reviews`, `points_movements`, `orders`, `store_customers`, `config` | `Promoções`, `Cupons`, `Upsell`, `Programa de Pontos`, `Avaliações` | depende de `Pedidos`, `Clientes`, `Cardápio`, `Performance` |

## Crescimento
| Módulo | Arquivos principais | Componentes usados | Funções/serviços | Firestore | Telas afetadas | Dependências |
|---|---|---|---|---|---|---|
| Crescimento | `js/modules/plano_voo.js` | simulação, comparação, snapshots, cenários | previsão mensal/anual, cenário do mês, snapshot salvo | `flight_plans`, `flight_plan_month_scenarios`, `contas_pagar`, `config/dinheiro` | `Crescimento > Plano de Voo` | depende de `Performance`, `Financeiro`, `Pedidos` |

## Financeiro
| Módulo | Arquivos principais | Componentes usados | Funções/serviços | Firestore | Telas afetadas | Dependências |
|---|---|---|---|---|---|---|
| Financeiro | `js/modules/financeiro.js` | visão geral, fluxo de caixa, entradas, saídas, contas, bancos | contas, movimentações, pagamentos, categorias | `movimentacoes`, `contas_pagar`, `contas_bancarias`, `financeiro_categorias`, `compras`, `fornecedores`, `itens_custo`, `config` | `Financeiro` | depende de `Pedidos`, `Compras`, `Plano de Voo`, `Performance` |

## Fiscal
| Módulo | Arquivos principais | Componentes usados | Funções/serviços | Firestore | Telas afetadas | Dependências |
|---|---|---|---|---|---|---|
| Fiscal | `js/modules/fiscal.js` | configurações fiscais, IVA, IRPF, deduções, resumo | regras e resumos fiscais | `config`, `compras` | `Fiscal` | depende de `Compras`, `Financeiro` |

## Operação
| Módulo | Arquivos principais | Componentes usados | Funções/serviços | Firestore | Telas afetadas | Dependências |
|---|---|---|---|---|---|---|
| Operação | `js/modules/operacao.js` | status, horários, zonas, pagamentos, endereço | configuração operacional da loja | `config` | `Operação` | depende de `Pedidos`, `Cardápio` |

## Configurações
| Módulo | Arquivos principais | Componentes usados | Funções/serviços | Firestore | Telas afetadas | Dependências |
|---|---|---|---|---|---|---|
| Configurações | `js/modules/configuracoes.js`, `js/core/image-tools.js` | geral, domínio, integrações, usuários, aparência | dados básicos, identidade, permissões futuras, upload otimizado de logo/banner | `config`, `fornecedores`, `unidades_medida`, Firebase Storage | `Configurações` | depende de todos os módulos que leem `config` |

## Clientes
| Módulo | Arquivos principais | Componentes usados | Funções/serviços | Firestore | Telas afetadas | Dependências |
|---|---|---|---|---|---|---|
| Clientes | `js/modules/clientes.js` | cards, filtros, modal de perfil, histórico, segmento | cadastro e visão rica do cliente | `store_customers`, `config` | `Pedidos > Clientes`, `Clientes` legado | depende de `Pedidos`, `Marketing`, `Performance` |

## Módulo legado
| Módulo | Arquivos principais | Componentes usados | Funções/serviços | Firestore | Telas afetadas | Dependências |
|---|---|---|---|---|---|---|
| Dashboard | `js/modules/dashboard.js` | visão resumida antiga | carregamento mínimo de config | `config` | `Dashboard` legado | hoje a navegação principal usa `Performance` |

## Master / Backup do Sistema
| Módulo | Arquivos principais | Componentes usados | Funções/serviços | Firestore / storage | Telas afetadas | Dependências |
|---|---|---|---|---|---|---|
| Master / Backup do Sistema | `master.html`, `server.rb`, `.gitignore` | cards, tabs, status do Git, pré-visualização textual, botões de ação | verificar alterações locais, preparar `.gitignore`, commit, push para GitHub privado, salvar config de backup | `.master-store.json` via `global_config.system_backup` | `Master > Backup do Sistema` | depende do backend local, do Git instalado, do repositório local e do repositório GitHub privado configurado |
