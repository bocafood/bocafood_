# Pendência: Firebase Storage / Upload de imagens

## Status atual
O upload de imagens de produto foi preparado para Firebase Storage, usando o bucket `bocado-brasil.firebasestorage.app` e caminhos separados por tenant em `tenants/{tenantId}/products/{productId}/`.

O arquivo `cors.json` já está configurado no projeto, mas ainda não foi aplicado no bucket real porque o ambiente atual não possui `gcloud`/`gsutil` instalado.

Enquanto o CORS não for aplicado no bucket real, uploads feitos a partir de `http://localhost:8080` podem continuar bloqueados pelo navegador com erro de CORS.

## Motivo da pendência
A configuração final depende de aplicar CORS no bucket real do Google Cloud Storage. Essa etapa não foi concluída neste ambiente.

## Comandos necessários
Executar em um ambiente com Google Cloud SDK ou Cloud Shell:

```bash
gcloud storage buckets update gs://bocado-brasil.firebasestorage.app --cors-file=cors.json
gcloud storage buckets describe gs://bocado-brasil.firebasestorage.app --format="default(cors_config)"
```

## Quando executar
Quando o projeto estiver pronto para produção e o plano Blaze / Google Cloud estiver ativo.

## Risco se não executar
Sem aplicar o CORS no bucket real, o navegador pode continuar bloqueando o upload com erro de preflight, mesmo com o fluxo do código já preparado.

## Decisão temporária
- Não remover o fluxo preparado
- Não migrar imagens antigas agora
- Manter compatibilidade com imagens antigas do GitHub Raw
- Finalizar o upload definitivo de imagens quando o projeto estiver pronto para contratar/ativar Blaze e configurar Google Cloud

