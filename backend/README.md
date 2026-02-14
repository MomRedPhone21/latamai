# Backend LATAM Agent (Python + OpenAI)

Backend minimal para chat con estas reglas:

- Solo responde sobre Latinoamerica y el Caribe.
- Solo usa evidencia de `data/knowledge_base.json`.
- Si no hay evidencia suficiente, no inventa.
- OpenAI-only para redaccion final usando `openai-agents-python`.

## Instalacion

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

La libreria de chat usa `openai-agents-python` (`Agent` + `Runner.run`), sin llamada manual a `/v1/chat/completions`.

Edita `backend/.env` y agrega tu key real:

```env
OPENAI_API_KEY=tu_openai_api_key
OPENAI_MODEL=gpt-4o-mini
```

## Ejecutar

Desde la raiz del proyecto:

```bash
./run_official_backend.sh
```

## Endpoints

- `GET /health`
- `POST /v1/chat`

## Formato de respuesta `/v1/chat`

- `answer`
- `sources`
- `country_scope`
- `data_cutoff`
- `retrieval_mode`
- `evidence_mode`
- `llm_runtime`
