#!/bin/bash
set -euo pipefail

PROJECT_DIR="/Users/cash/Downloads/Painel de Controle - BBORIGINAL"
SERVICE_ACCOUNT_FILE="$PROJECT_DIR/firebase-service-account.json"
PROJECT_ID="bocado-brasil"
PORT="3000"

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "A porta $PORT já está em uso."
  echo "Pare o servidor antigo e tente novamente."
  exit 1
fi

cd "$PROJECT_DIR"

export FIREBASE_SERVICE_ACCOUNT_FILE="$SERVICE_ACCOUNT_FILE"
export FIREBASE_PROJECT_ID="$PROJECT_ID"

ruby server.rb &
SERVER_PID=$!

cleanup() {
  if kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup INT TERM

for _ in {1..30}; do
  if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    open "http://127.0.0.1:3000/master.html"
    open "http://127.0.0.1:3000/admin.html"
    break
  fi
  sleep 1
done

wait "$SERVER_PID"
