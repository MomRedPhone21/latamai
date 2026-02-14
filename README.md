# LATAM Agent (OpenAI + Python)

Chat enfocado solo en Latinoamerica y el Caribe, con guardrails de evidencia.

## Intención
Sí, usa OpenAI agents, ni datasets ni ollama ni nada. La intención cuenta.
PD: "Lo mismo pero mas barato", salva la web nomas?.. creo.

## Stack

- Frontend: Next.js
- Backend: FastAPI (Python)
- LLM: OpenAI (solo)
- Base de evidencia: `backend/data/knowledge_base.json`

## Quick start

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# editar OPENAI_API_KEY en backend/.env

cd ..
./run_official_backend.sh
npm install
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend health: `http://127.0.0.1:8000/health`

## TODO

- Implementar real time Chat y almacenarlo con localstorage
- Sesiones?
- Mejorar el UI Chat y Homepage, para mayor accesibilidad
- Implementar Sistema dark/light mode pero con la temática de los paises de LATAM y el Caribe.
- Implementar un modelo unico existencial en el planeta solo para LATAM y el Caribe, osea, $$ (Traté de emular algo en python pero.. la intención cuenta..)
- Añadir logica para los sources.
