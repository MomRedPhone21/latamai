#!/usr/bin/env bash
set -euo pipefail

cd backend

if [[ ! -f ".venv/bin/activate" ]]; then
  echo "No existe backend/.venv/bin/activate"
  echo "Crea el entorno primero: cd backend && python3 -m venv .venv"
  exit 1
fi

source .venv/bin/activate

if [[ -f ".env" ]]; then
  set -a
  source .env
  set +a
fi

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "Falta OPENAI_API_KEY. Define la variable en backend/.env"
  exit 1
fi

echo "== LATAM Agent backend (Python + OpenAI) =="
echo "Iniciando en http://127.0.0.1:8000"

if ! python -c "import fastapi, uvicorn" >/dev/null 2>&1; then
  echo "Faltan dependencias Python en backend/.venv"
  echo "Ejecuta: cd backend && source .venv/bin/activate && pip install -r requirements.txt"
  exit 1
fi

python -m uvicorn app.main:app --reload --port 8000
