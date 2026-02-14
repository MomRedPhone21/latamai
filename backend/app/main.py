import json
import os
import re
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel, Field

from .constants import NON_LATAM_MARKERS
from .retrieval import (
    build_context_block,
    detect_countries,
    infer_data_cutoff,
    is_latam_scoped,
    load_docs,
    retrieve,
)

BASE_DIR = Path(__file__).resolve().parents[1]

try:
    from dotenv import load_dotenv

    load_dotenv(BASE_DIR / ".env")
except Exception:
    pass

KB_PATH = Path(os.getenv("LATAM_KB_PATH", BASE_DIR / "data" / "knowledge_base.json"))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
MAX_CONTEXT_DOCS = int(os.getenv("MAX_CONTEXT_DOCS", "4"))

SYSTEM_PROMPT = (
    "Eres LATAM Agent. Solo respondes con informacion de Latinoamerica y el Caribe. "
    "Usa solo el contexto entregado. Si no hay evidencia suficiente, dilo sin inventar. "
    "Responde en espanol, maximo 4 bullets, con citas [S1], [S2]. "
    "No menciones proveedores, APIs, modelos, marcas ni detalles internos."
)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    question: str = Field(min_length=2)
    messages: list[ChatMessage] = Field(default_factory=list)


class SourceItem(BaseModel):
    id: str
    title: str
    topic: str
    source_name: str = ""
    source_url: str = ""
    as_of_date: str = ""


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceItem] = Field(default_factory=list)
    country_scope: list[str] = Field(default_factory=list)
    data_cutoff: str = "no-disponible"
    retrieval_mode: str = "lexical"
    evidence_mode: str = "strict-context"
    llm_runtime: str = "openai"


class DataSourceItem(BaseModel):
    id: str
    name: str
    url: str = ""


class DataSourcesResponse(BaseModel):
    sources: list[DataSourceItem] = Field(default_factory=list)


app = FastAPI(title="LatamAI Backend", version="1.0.0")
DOCS = load_docs(KB_PATH)


def _is_outside_latam(question: str) -> bool:
    lowered = question.lower()
    return any(marker in lowered for marker in NON_LATAM_MARKERS)


def _sanitize_answer(text: str) -> str:
    lines = text.splitlines() or [text]
    cleaned = [re.sub(r"\b(chatgpt|openai|gpt-?\d*|api)\b", "este asistente", line, flags=re.IGNORECASE) for line in lines]
    return "\n".join(cleaned).strip()


async def _ask_openai(question: str, context_block: str, data_cutoff: str) -> str:
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY no configurada")

    try:
        from agents import Agent, Runner
    except Exception as exc:
        raise RuntimeError("Falta openai-agents en el entorno") from exc

    input_text = (
        f"Pregunta: {question}\n\n"
        f"Contexto:\n{context_block}\n\n"
        f"Fecha de corte: {data_cutoff}."
    )

    agent = Agent(
        name="LATAM Agent",
        instructions=SYSTEM_PROMPT,
        model=OPENAI_MODEL,
    )
    result = await Runner.run(agent, input_text)
    final_output = getattr(result, "final_output", "")
    return str(final_output).strip()


def _build_sources(docs: list[dict[str, Any]]) -> list[SourceItem]:
    return [
        SourceItem(
            id=str(doc.get("id", "")),
            title=str(doc.get("title", "")),
            topic=str(doc.get("topic", "")),
            source_name=str(doc.get("source_name", "")),
            source_url=str(doc.get("source_url", "")),
            as_of_date=str(doc.get("as_of_date", "")),
        )
        for doc in docs
    ]


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "kb_items": len(DOCS),
        "openai_enabled": bool(OPENAI_API_KEY),
        "openai_model": OPENAI_MODEL,
        "kb_path": str(KB_PATH),
    }


@app.post("/v1/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    question = payload.question.strip()

    if not is_latam_scoped(question) or _is_outside_latam(question):
        return ChatResponse(
            answer="Este asistente solo responde consultas de Latinoamerica y el Caribe.",
            sources=[],
            country_scope=detect_countries(question),
            data_cutoff="no-disponible",
            llm_runtime="openai:latam-guard",
        )

    docs = retrieve(question, DOCS, top_k=MAX_CONTEXT_DOCS)
    if not docs:
        return ChatResponse(
            answer="No hay evidencia suficiente en la base LATAM para responder esa pregunta.",
            sources=[],
            country_scope=detect_countries(question),
            data_cutoff="no-disponible",
            llm_runtime="openai:no-evidence",
        )

    context_block = build_context_block(docs)
    data_cutoff = infer_data_cutoff(docs)

    try:
        answer = await _ask_openai(question, context_block, data_cutoff)
    except Exception:
        return ChatResponse(
            answer="No se pudo generar respuesta con OpenAI. Verifica OPENAI_API_KEY y conectividad.",
            sources=_build_sources(docs),
            country_scope=detect_countries(question),
            data_cutoff=data_cutoff,
            llm_runtime="openai:error-runtime",
        )

    if not answer:
        answer = "No hay salida valida del modelo para esta consulta con la evidencia disponible."

    return ChatResponse(
        answer=_sanitize_answer(answer),
        sources=_build_sources(docs),
        country_scope=detect_countries(question),
        data_cutoff=data_cutoff,
        llm_runtime="openai",
    )


@app.get("/v1/sources", response_model=DataSourcesResponse)
def sources() -> DataSourcesResponse:
    seen: set[str] = set()
    items: list[DataSourceItem] = []
    for doc in DOCS:
        name = str(doc.get("source_name", "")).strip()
        if not name or name in seen:
            continue
        seen.add(name)
        items.append(
            DataSourceItem(
                id=name.lower().replace(" ", "-"),
                name=name,
                url=str(doc.get("source_url", "")).strip(),
            )
        )
    return DataSourcesResponse(sources=items)
