"use client";

import { Nunito_Sans } from "next/font/google";
import Link from "next/link";
import ThemeModeSwitch from "@/components/ThemeModeSwitch";
import {
  FormEvent,
  KeyboardEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  content: string;
  meta?: {
    sources?: {
      id: string;
      title: string;
      topic: string;
      source_name?: string;
      source_url?: string;
      license?: string;
      as_of_date?: string;
      similarity?: number;
    }[];
    dataCutoff?: string;
    retrievalMode?: string;
    evidenceMode?: string;
    llmRuntime?: string;
  };
};

const chatFont = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const initialMessage: ChatMessage = {
  id: 1,
  role: "assistant",
  content:
    "# Hola, soy tu agente LATAM\n\nPuedo ayudarte con cultura, biodiversidad, HDI, defensa y comparativas por pais en Latinoamerica y el Caribe.",
};

const quickPrompts = [
  "Cultura de Peru por regiones.",
  "Ranking HDI de Sudamerica y el Caribe.",
  "Compara biodiversidad de Brasil, Peru y Colombia.",
  "Fuerzas armadas en el Cono Sur.",
];

const inlineMarkdownRegex =
  /(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;

function renderInlineMarkdown(text: string): ReactNode[] {
  const parts = text.split(inlineMarkdownRegex);
  const nodes: ReactNode[] = [];

  parts.forEach((part, index) => {
    if (!part) {
      return;
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (linkMatch) {
      nodes.push(
        <a
          key={`md-${index}`}
          href={linkMatch[2]}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
          style={{ textDecorationColor: "var(--chat-link-decoration)" }}
        >
          {linkMatch[1]}
        </a>,
      );
      return;
    }

    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      nodes.push(
        <strong key={`md-${index}`} className="font-semibold">
          {part.slice(2, -2)}
        </strong>,
      );
      return;
    }

    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      nodes.push(
        <em key={`md-${index}`} className="italic">
          {part.slice(1, -1)}
        </em>,
      );
      return;
    }

    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      nodes.push(
        <code
          key={`md-${index}`}
          className="rounded-md px-1.5 py-0.5 font-mono text-[12px]"
          style={{ backgroundColor: "var(--chat-panel-bg-2)", color: "var(--chat-text-code)" }}
        >
          {part.slice(1, -1)}
        </code>,
      );
      return;
    }

    nodes.push(<span key={`md-${index}`}>{part}</span>);
  });

  return nodes;
}

function renderMarkdown(content: string): ReactNode {
  const sections = content.split(/```/g);

  return sections.map((section, sectionIndex) => {
    if (sectionIndex % 2 === 1) {
      return (
        <pre
          key={`block-${sectionIndex}`}
          className="my-3 overflow-x-auto rounded-xl border p-3"
          style={{ borderColor: "var(--chat-panel-border-2)", backgroundColor: "var(--chat-panel-bg-2)" }}
        >
          <code className="font-mono text-[12px] leading-6" style={{ color: "var(--chat-text-code)" }}>
            {section.trim()}
          </code>
        </pre>
      );
    }

    const lines = section.split("\n");
    const blocks: ReactNode[] = [];
    let listBuffer: string[] = [];
    let orderedBuffer: string[] = [];

    const flushUnordered = (keyPrefix: string) => {
      if (listBuffer.length === 0) {
        return;
      }
      blocks.push(
        <ul key={`${keyPrefix}-ul`} className="my-2 list-disc space-y-1 pl-5">
          {listBuffer.map((item, index) => (
            <li key={`${keyPrefix}-ul-${index}`}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>,
      );
      listBuffer = [];
    };

    const flushOrdered = (keyPrefix: string) => {
      if (orderedBuffer.length === 0) {
        return;
      }
      blocks.push(
        <ol key={`${keyPrefix}-ol`} className="my-2 list-decimal space-y-1 pl-5">
          {orderedBuffer.map((item, index) => (
            <li key={`${keyPrefix}-ol-${index}`}>{renderInlineMarkdown(item)}</li>
          ))}
        </ol>,
      );
      orderedBuffer = [];
    };

    lines.forEach((rawLine, lineIndex) => {
      const line = rawLine.trim();
      const keyPrefix = `s${sectionIndex}-l${lineIndex}`;

      if (!line) {
        flushUnordered(keyPrefix);
        flushOrdered(keyPrefix);
        return;
      }

      if (line.startsWith("- ")) {
        flushOrdered(keyPrefix);
        listBuffer.push(line.slice(2));
        return;
      }

      if (/^\d+\.\s+/.test(line)) {
        flushUnordered(keyPrefix);
        orderedBuffer.push(line.replace(/^\d+\.\s+/, ""));
        return;
      }

      flushUnordered(keyPrefix);
      flushOrdered(keyPrefix);

      if (line.startsWith("### ")) {
        blocks.push(
          <h3 key={keyPrefix} className="mt-2 text-[15px] font-bold" style={{ color: "var(--chat-text-strong)" }}>
            {renderInlineMarkdown(line.slice(4))}
          </h3>,
        );
        return;
      }

      if (line.startsWith("## ")) {
        blocks.push(
          <h2 key={keyPrefix} className="mt-2 text-[16px] font-bold" style={{ color: "var(--chat-text-strong)" }}>
            {renderInlineMarkdown(line.slice(3))}
          </h2>,
        );
        return;
      }

      if (line.startsWith("# ")) {
        blocks.push(
          <h1 key={keyPrefix} className="mt-2 text-[17px] font-extrabold" style={{ color: "var(--chat-text-strong)" }}>
            {renderInlineMarkdown(line.slice(2))}
          </h1>,
        );
        return;
      }

      blocks.push(
        <p key={keyPrefix} className="my-1 leading-7" style={{ color: "var(--chat-text)" }}>
          {renderInlineMarkdown(line)}
        </p>,
      );
    });

    flushUnordered(`s${sectionIndex}-end`);
    flushOrdered(`s${sectionIndex}-end`);

    return <div key={`section-${sectionIndex}`}>{blocks}</div>;
  });
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<number | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);

  const streamTimeoutsRef = useRef<number[]>([]);
  const scrollPaneRef = useRef<HTMLDivElement | null>(null);
  const autoFollowRef = useRef(true);
  const userScrolledRef = useRef(false);

  const canSend = useMemo(
    () => input.trim().length > 0 && !typing && streamingMessageId === null,
    [input, typing, streamingMessageId],
  );

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const pane = scrollPaneRef.current;
    if (!pane) {
      return;
    }

    pane.scrollTo({ top: pane.scrollHeight, behavior });
  }, []);

  const updateAutoFollowState = useCallback(() => {
    const pane = scrollPaneRef.current;
    if (!pane) {
      return;
    }

    const distanceToBottom =
      pane.scrollHeight - pane.scrollTop - pane.clientHeight;
    const nearBottom = distanceToBottom < 140;

    autoFollowRef.current = nearBottom;
    if (!nearBottom) {
      userScrolledRef.current = true;
    }
    setShowJumpToBottom(!nearBottom);
  }, []);

  const clearStreamTimeouts = useCallback(() => {
    streamTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    streamTimeoutsRef.current = [];
  }, []);

  const stopStreaming = useCallback(() => {
    clearStreamTimeouts();
    setStreamingMessageId(null);
  }, [clearStreamTimeouts]);

  useEffect(() => {
    return () => clearStreamTimeouts();
  }, [clearStreamTimeouts]);

  useEffect(() => {
    if (!messages.length) {
      return;
    }
    if (autoFollowRef.current) {
      scrollToBottom("smooth");
    }
  }, [messages.length, scrollToBottom]);

  const streamAssistantText = useCallback(
    (messageId: number, fullText: string) => {
      clearStreamTimeouts();
      setStreamingMessageId(messageId);
      userScrolledRef.current = false;

      const chunkSize =
        fullText.length <= 250 ? 2 : fullText.length <= 900 ? 5 : fullText.length <= 1800 ? 8 : 10;
      const baseDelay =
        fullText.length <= 250 ? 150 : fullText.length <= 900 ? 115 : fullText.length <= 1800 ? 90 : 76;
      let cursor = 0;

      const step = () => {
        cursor = Math.min(fullText.length, cursor + chunkSize);
        const nextText = fullText.slice(0, cursor);

        setMessages((prev) =>
          prev.map((message) =>
            message.id === messageId ? { ...message, content: nextText } : message,
          ),
        );

        // Evita "arrastrar" al usuario durante respuestas largas.
        // Solo acompana al inicio si sigue cerca del final y no ha hecho scroll manual.
        if (autoFollowRef.current && !userScrolledRef.current && cursor <= 180) {
          scrollToBottom("auto");
        }

        if (cursor < fullText.length) {
          const lastChar = nextText[nextText.length - 1] ?? "";
          const punctuationPause = /[.!?:]/.test(lastChar)
            ? 210
            : /[,;]/.test(lastChar)
              ? 120
              : /[\n]/.test(lastChar)
                ? 155
                : 0;
          const timeoutId = window.setTimeout(step, baseDelay + punctuationPause);
          streamTimeoutsRef.current.push(timeoutId);
        } else {
          setStreamingMessageId(null);
        }
      };

      step();
    },
    [clearStreamTimeouts, scrollToBottom],
  );

  const askBackend = useCallback(
    async (prompt: string, history: { role: string; content: string }[]) => {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: prompt, messages: history }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? "Error al consultar el backend LATAM.");
      }
      return data;
    },
    [],
  );

  const submitPrompt = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed || typing || streamingMessageId !== null) {
        return;
      }

      const userMessage: ChatMessage = {
        id: Date.now(),
        role: "user",
        content: trimmed,
      };

      autoFollowRef.current = true;
      userScrolledRef.current = false;
      setShowJumpToBottom(false);
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setTyping(true);

      try {
        const history = [...messages, userMessage].map((message) => ({
          role: message.role,
          content: message.content,
        }));

        const data = await askBackend(trimmed, history);
        const aiId = Date.now() + 1;
        const fullAnswer = data?.answer ?? "No se recibio respuesta del backend LATAM.";

        const aiMessage: ChatMessage = {
          id: aiId,
          role: "assistant",
          content: "",
          meta: {
            sources: data?.sources ?? [],
            dataCutoff: data?.data_cutoff ?? "no-disponible",
            retrievalMode: data?.retrieval_mode ?? "lexical",
            evidenceMode: data?.evidence_mode ?? "strict-context",
            llmRuntime: data?.llm_runtime ?? "rule-based",
          },
        };

        setMessages((prev) => [...prev, aiMessage]);
        setTyping(false);
        streamAssistantText(aiId, fullAnswer);
      } catch (error) {
        const aiMessage: ChatMessage = {
          id: Date.now() + 1,
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Fallo de conexion con el backend local.",
        };
        setMessages((prev) => [...prev, aiMessage]);
        setTyping(false);
      }
    },
    [askBackend, messages, streamingMessageId, streamAssistantText, typing],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitPrompt(input);
  };

  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const form = event.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const copyMessage = async (messageId: number, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      window.setTimeout(() => setCopiedMessageId(null), 1200);
    } catch {
      setCopiedMessageId(null);
    }
  };

  return (
    <main className={`${chatFont.className} relative isolate h-screen overflow-hidden`} style={{ backgroundColor: "var(--chat-main-bg)", color: "var(--chat-main-text)" }}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 bg-[url('/background.png')] bg-cover bg-center bg-no-repeat"
        style={{ opacity: "var(--chat-bg-image-opacity)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--chat-bg-overlay)" }}
      />
      <div className="mx-auto flex h-screen w-full max-w-[1200px] overflow-hidden">
        <aside className="hidden w-[260px] border-r px-3 py-4 lg:block" style={{ borderColor: "var(--chat-sidebar-border)", backgroundColor: "var(--chat-sidebar-bg)" }}>
          <button
            className="mb-3 w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition"
            style={{ borderColor: "var(--chat-panel-border-3)", backgroundColor: "var(--chat-panel-bg)", color: "var(--chat-text-dim)" }}
          >
            + Nuevo chat
          </button>
          <div className="space-y-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => void submitPrompt(prompt)}
                className="w-full rounded-lg border border-transparent px-3 py-2 text-left text-xs font-medium transition"
                style={{ color: "var(--chat-text-dim)" }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-h-0 h-full flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-10 border-b px-4 py-3 backdrop-blur md:px-8" style={{ borderColor: "var(--chat-header-border)", backgroundColor: "var(--chat-header-bg)" }}>
            <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.1em]" style={{ color: "var(--chat-text-muted)" }}>LATAM AGENT</p>
                <h1 className="text-base font-bold" style={{ color: "var(--chat-text-header)" }}>Conversacion Regional</h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full border px-3 py-1 text-[11px] font-semibold" style={{ borderColor: "var(--chat-panel-border-3)", backgroundColor: "var(--chat-panel-bg)", color: "var(--chat-text-dim)" }}>
                  Modo OpenAI
                </div>
                <ThemeModeSwitch />
                <Link
                  href="/"
                  className="rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{ borderColor: "var(--chat-panel-border-3)", backgroundColor: "var(--chat-panel-bg)", color: "var(--chat-text-dim)" }}
                >
                  Inicio
                </Link>
              </div>
            </div>
          </header>

          <div
            ref={scrollPaneRef}
            onScroll={updateAutoFollowState}
            className="chat-scroll min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8"
          >
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-8">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={`chat-enter rounded-2xl px-4 py-3 text-[14px] leading-6 ${
                    message.role === "assistant"
                      ? "border"
                      : "self-end border"
                  }`}
                  style={
                    message.role === "assistant"
                      ? {
                          borderColor: "var(--chat-panel-border)",
                          backgroundColor: "var(--chat-panel-bg)",
                          color: "var(--chat-text)",
                        }
                      : {
                          borderColor: "var(--chat-user-border)",
                          backgroundColor: "var(--chat-user-bg)",
                          color: "var(--chat-main-text)",
                        }
                  }
                >
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--chat-text-muted)" }}>
                    {message.role === "assistant" ? "LATAM Agent" : "Tu"}
                  </p>

                  {message.role === "assistant" ? renderMarkdown(message.content) : <p>{message.content}</p>}

                  {streamingMessageId === message.id && (
                    <span className="inline-block h-4 w-2 animate-pulse rounded-sm align-middle" style={{ backgroundColor: "var(--chat-pulse)" }} />
                  )}

                  {message.role === "assistant" && message.content && (
                    <div className="mt-2 flex items-center gap-2 border-t pt-2" style={{ borderColor: "var(--chat-panel-border-soft)" }}>
                      <button
                        type="button"
                        onClick={() => copyMessage(message.id, message.content)}
                        className="rounded-lg border px-2 py-1 text-xs font-semibold transition"
                        style={{ borderColor: "var(--chat-quick-border)", backgroundColor: "var(--chat-panel-bg-soft)", color: "var(--chat-text-dim)" }}
                      >
                        {copiedMessageId === message.id ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                  )}

                  {message.role === "assistant" && message.meta?.sources && message.meta.sources.length > 0 && (
                    <div className="mt-3 border-t pt-2 text-xs" style={{ borderColor: "var(--chat-panel-border-soft)", color: "var(--chat-text-dim)" }}>
                      <p className="font-semibold">Fuentes</p>
                      <ul className="mt-1 list-disc space-y-1 pl-5">
                        {message.meta.sources.map((source) => (
                          <li key={source.id}>
                            {source.title} ({source.topic}) | {source.source_name ?? "fuente"}
                            {source.as_of_date ? ` | corte: ${source.as_of_date}` : ""}
                            {source.source_url ? (
                              <>
                                {" "}
                                |{" "}
                                <a href={source.source_url} target="_blank" rel="noreferrer" className="underline">
                                  link
                                </a>
                              </>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-[11px]" style={{ color: "var(--chat-text-soft)" }}>
                        Corte global: {message.meta.dataCutoff ?? "no-disponible"} | retrieval: {message.meta.retrievalMode ?? "lexical"} | evidence: {message.meta.evidenceMode ?? "strict-context"} | runtime: {message.meta.llmRuntime ?? "rule-based"}
                      </p>
                    </div>
                  )}
                </article>
              ))}

              {typing && (
                <article className="w-fit rounded-2xl border px-4 py-2 text-sm" style={{ borderColor: "var(--chat-panel-border)", backgroundColor: "var(--chat-panel-bg)", color: "var(--chat-text-dim)" }}>
                  <span className="inline-flex items-end gap-1">
                    <span>Pensando</span>
                    <span className="inline-flex gap-0.5">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:-0.25s]" style={{ backgroundColor: "var(--chat-loader)" }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:-0.12s]" style={{ backgroundColor: "var(--chat-loader)" }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full" style={{ backgroundColor: "var(--chat-loader)" }} />
                    </span>
                  </span>
                </article>
              )}
            </div>
          </div>

          {showJumpToBottom && (
            <div className="pointer-events-none sticky bottom-[88px] z-10 mx-auto flex w-full max-w-3xl justify-center px-4 md:px-0">
              <button
                type="button"
                onClick={() => {
                  autoFollowRef.current = true;
                  userScrolledRef.current = false;
                  setShowJumpToBottom(false);
                  scrollToBottom("smooth");
                }}
                aria-label="Ir al final del chat"
                className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full border shadow-[0_8px_20px_rgba(30,24,16,0.16)] backdrop-blur transition"
                style={{ borderColor: "var(--chat-jump-border)", backgroundColor: "var(--chat-jump-bg)", color: "var(--chat-jump-text)" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M12 5v14" />
                  <path d="m19 12-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}

          <div className="sticky bottom-0 border-t px-4 pb-4 pt-3 backdrop-blur md:px-8" style={{ borderColor: "var(--chat-header-border)", backgroundColor: "var(--chat-header-bg)" }}>
            <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl">
              <div className="mb-2 flex flex-wrap gap-2 lg:hidden">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void submitPrompt(prompt)}
                    disabled={typing || streamingMessageId !== null}
                    className="rounded-full border px-3 py-1 text-xs font-semibold disabled:opacity-50"
                    style={{ borderColor: "var(--chat-quick-border)", backgroundColor: "var(--chat-panel-bg)", color: "var(--chat-text-dim)" }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border p-2 shadow-[0_10px_24px_rgba(50,40,25,0.08)]" style={{ borderColor: "var(--chat-input-border)", backgroundColor: "var(--chat-panel-bg)" }}>
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  rows={2}
                  placeholder="Pregunta algo de LATAM..."
                  className="w-full resize-none border-0 bg-transparent px-2.5 py-2 text-[14px] outline-none"
                  style={{ color: "var(--chat-input-text)" }}
                />
                <div className="flex items-center justify-between px-2 pb-1">
                  <p className="text-xs" style={{ color: "var(--chat-text-soft)" }}>Shift + Enter para salto de linea</p>
                  <div className="flex items-center gap-2">
                    {streamingMessageId !== null && (
                      <button
                        type="button"
                        onClick={stopStreaming}
                        className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition"
                        style={{ borderColor: "var(--chat-stop-border)", backgroundColor: "var(--chat-stop-bg)", color: "var(--chat-stop-text)" }}
                      >
                        Detener
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={!canSend}
                      aria-label="Enviar mensaje"
                      className="grid h-10 w-10 place-items-center rounded-xl border transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ borderColor: "var(--chat-send-border)", backgroundColor: "var(--chat-send-bg)", color: "var(--chat-send-text)" }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path d="M22 2 11 13" />
                        <path d="M22 2 15 22l-4-9-9-4 20-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
