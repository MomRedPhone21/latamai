import json
import re
import unicodedata
from pathlib import Path
from typing import Any

from .constants import LATAM_COUNTRIES, TOPIC_KEYWORDS

STOPWORDS = {
    "de", "la", "el", "los", "las", "y", "o", "en", "del", "por", "para", "con", "que", "cual", "cuál"
}


def _normalize_text(value: str) -> str:
    text = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return text.lower().strip()


def _tokenize(value: str) -> list[str]:
    tokens = re.findall(r"[a-z0-9]{3,}", _normalize_text(value))
    return [token for token in tokens if token not in STOPWORDS]


def load_docs(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        return []
    return [doc for doc in data if isinstance(doc, dict)]


def detect_countries(question: str) -> list[str]:
    lowered = _normalize_text(question)
    found = sorted({country for country in LATAM_COUNTRIES if country in lowered})
    return found


def is_latam_scoped(question: str) -> bool:
    lowered = _normalize_text(question)
    if detect_countries(question):
        return True
    return any(marker in lowered for marker in {"latam", "latinoamerica", "latin america", "caribe", "sudamerica", "south america"})


def _doc_searchable(doc: dict[str, Any]) -> str:
    title = str(doc.get("title", ""))
    content = str(doc.get("content", ""))
    topic = str(doc.get("topic", ""))
    countries = " ".join(str(c) for c in doc.get("country", []))
    tags = " ".join(str(t) for t in doc.get("tags", []))
    return _normalize_text(f"{title} {content} {topic} {countries} {tags}")


def _score_doc(question: str, doc: dict[str, Any]) -> int:
    score = 0
    q_tokens = _tokenize(question)
    q_text = _normalize_text(question)
    d_text = _doc_searchable(doc)

    for token in q_tokens:
        if token in d_text:
            score += 2

    topic = _normalize_text(str(doc.get("topic", "")))
    for topic_name, keywords in TOPIC_KEYWORDS.items():
        if any(keyword in q_text for keyword in keywords):
            if topic_name in topic:
                score += 4

    requested_countries = detect_countries(question)
    doc_countries = [_normalize_text(str(c)) for c in doc.get("country", [])]
    if requested_countries and any(country in doc_countries for country in requested_countries):
        score += 6

    return score


def retrieve(question: str, docs: list[dict[str, Any]], top_k: int = 4) -> list[dict[str, Any]]:
    scored: list[tuple[int, dict[str, Any]]] = [(_score_doc(question, doc), doc) for doc in docs]
    scored.sort(key=lambda item: item[0], reverse=True)
    picked = [dict(doc) for score, doc in scored if score > 0][:top_k]
    return picked


def build_context_block(docs: list[dict[str, Any]]) -> str:
    lines: list[str] = []
    for idx, doc in enumerate(docs, start=1):
        title = str(doc.get("title", ""))
        content = str(doc.get("content", ""))
        topic = str(doc.get("topic", "general"))
        countries = ", ".join(str(c) for c in doc.get("country", []))
        source = str(doc.get("source_name", "fuente"))
        as_of_date = str(doc.get("as_of_date", "")) or "sin fecha"
        lines.append(f"[S{idx}] [{topic}] {title} | Paises: {countries} | Fecha: {as_of_date} | Fuente: {source} | {content}")
    return "\n".join(lines)


def infer_data_cutoff(docs: list[dict[str, Any]]) -> str:
    dates = []
    for doc in docs:
        as_of_date = str(doc.get("as_of_date", "")).strip()
        if as_of_date:
            dates.append(as_of_date)
    if not dates:
        return "no-disponible"
    return sorted(dates)[-1]
