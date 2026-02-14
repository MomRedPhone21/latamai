import { NextResponse } from "next/server";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

type ChatRequest = {
  question: string;
  messages: ChatMessage[];
};

const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000/v1/chat";
const REQUEST_TIMEOUT_MS = 22_000;

export async function POST(request: Request) {
  let body: ChatRequest;

  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return NextResponse.json(
      { error: "Payload invalido." },
      { status: 400 },
    );
  }

  const question = body?.question?.trim();
  if (!question) {
    return NextResponse.json(
      { error: "La pregunta es obligatoria." },
      { status: 400 },
    );
  }

  const backendUrl = process.env.LATAM_BACKEND_URL ?? DEFAULT_BACKEND_URL;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
        messages: body.messages ?? [],
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: "El backend LATAM respondio con error.",
          detail: errorText.slice(0, 400),
        },
        { status: 502 },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      {
        error:
          "No se pudo conectar con el backend local. Inicia FastAPI en http://127.0.0.1:8000.",
      },
      { status: 503 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
