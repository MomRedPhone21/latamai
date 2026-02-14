import { NextResponse } from "next/server";

const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000/v1/sources";
const REQUEST_TIMEOUT_MS = 14_000;

export async function GET() {
  const backendUrl = process.env.LATAM_SOURCES_BACKEND_URL ?? DEFAULT_BACKEND_URL;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(backendUrl, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: "El backend LATAM respondio con error en /v1/sources.",
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
          "No se pudo conectar con el backend local para fuentes. Inicia el backend en http://127.0.0.1:8000.",
      },
      { status: 503 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
