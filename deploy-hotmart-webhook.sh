#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="bocado-brasil"
FUNCTION_NAME="hotmartWebhook"
FUNCTION_URL="https://us-central1-${PROJECT_ID}.cloudfunctions.net/${FUNCTION_NAME}"

echo "Validando sintaxe de functions/index.js..."
node --check functions/index.js

echo "Verificando secret HOTMART_HOTTOK..."
if ! firebase functions:secrets:get HOTMART_HOTTOK --project "${PROJECT_ID}" >/dev/null; then
  echo "Secret HOTMART_HOTTOK não encontrado."
  echo "Crie/atualize com: firebase functions:secrets:set HOTMART_HOTTOK --project ${PROJECT_ID}"
  echo "Não cole o Hottok em variáveis soltas do Cloud Run e não imprima o token no terminal."
  exit 1
fi

echo "Fazendo deploy somente de ${FUNCTION_NAME}..."
firebase deploy --only "functions:${FUNCTION_NAME}" --project "${PROJECT_ID}" --force

echo ""
echo "Deploy concluído."
echo "URL esperada da Function: ${FUNCTION_URL}"
echo "Depois do deploy, reenvie/teste o webhook na Hotmart e confirme status 200."
echo "Se retornar 401, confira se o Hottok da Hotmart é exatamente o mesmo secret HOTMART_HOTTOK."
