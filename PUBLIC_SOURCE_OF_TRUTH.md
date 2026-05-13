# Public como fonte de verdade

## Objetivo

Este projeto passa a tratar `public/` como fonte de verdade para todos os arquivos publicados no Firebase Hosting.

O GitHub guarda o projeto inteiro, incluindo raiz, documentacao, scripts e arquivos internos. O Firebase Hosting, porem, publica somente o conteudo configurado em `firebase.json`:

```json
"hosting": {
  "public": "public"
}
```

Por isso, qualquer alteracao feita apenas em duplicatas da raiz pode funcionar em um teste local pela raiz, mas nao aparecer no deploy.

## Arquivos que devem ser editados em public/

Editar dentro de `public/` sempre que a mudanca afetar a aplicacao publicada:

- Admin publicado: `public/admin.html`
- Template publico: `public/index.html`
- Paginas publicas: `public/review.html`, `public/track.html`, `public/404.html` e equivalentes
- Core usado no navegador: `public/js/core/*`
- Modulos do Admin: `public/js/modules/*`
- Servicos JS publicados: `public/js/services/*`
- CSS publicado: `public/css/*`
- Assets publicados: `public/assets/*`, quando aplicavel

## Arquivos da raiz considerados legados/duplicados

Quando houver par equivalente em `public/`, a copia da raiz deve ser considerada duplicata legada ate futura limpeza:

- `admin.html`
- `index.html`
- `review.html`
- `track.html`
- `404.html`
- `js/core/*`
- `js/modules/*`
- `js/services/*`
- `css/*`

Esses arquivos nao devem receber alteracoes para telas publicadas, exceto se a tarefa pedir explicitamente uma reconciliacao entre raiz e `public/`.

## Arquivos da raiz que continuam validos

A raiz continua sendo o lugar correto para arquivos que nao sao publicados diretamente pelo Firebase Hosting:

- Documentacao tecnica, como `ADMIN_AUDIT.md`, `BUSINESS_MATURITY_DATA_MAP.md`, `STONES_*.md`
- `AI_CHANGELOG.md`
- `AGENTS.md`
- Configuracoes do projeto, como `firebase.json`, `.firebaserc`, regras Firestore/Storage
- Scripts locais e arquivos internos
- Relatorios e planos de implementacao

## Risco de editar a raiz por engano

Editar uma duplicata da raiz pode causar falsa validacao local. A mudanca pode aparecer ao abrir `admin.html` diretamente pela raiz, mas nao entrar no deploy porque o Firebase publica `public/`.

O risco principal e publicar uma versao desatualizada, especialmente em:

- `public/admin.html`
- `public/js/modules/clientes.js`
- `public/js/modules/pedidos.js`
- `public/js/modules/configuracoes.js`
- `public/js/core/ui.js`
- `public/css/*`

## Regra antes de deploy

Antes de qualquer deploy:

1. Confirmar que os arquivos alterados para a aplicacao publicada estao dentro de `public/`.
2. Verificar se nao ha mudancas importantes feitas apenas na raiz.
3. Comparar duplicatas quando houver duvida.
4. Nao sobrescrever `public/` cegamente com a raiz sem revisar divergencias.

## Regra de trabalho

A partir desta decisao:

- `public/` = fonte de verdade da aplicacao publicada.
- raiz = documentacao, configuracao, scripts locais e legado duplicado ate limpeza futura.

GitHub versiona tudo. Firebase Hosting publica somente `public/`.
