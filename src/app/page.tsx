import LaunchChatButton from "@/components/LaunchChatButton";
import ThemeModeSwitch from "@/components/ThemeModeSwitch";

export default function Home() {
  const nav = [
    { href: "#coverage", label: "Cobertura" },
    { href: "#how", label: "Como funciona" },
    { href: "#countries", label: "Paises" },
  ];

  const coverage = [
    {
      title: "Cultura",
      text: "Contexto de tradiciones, lenguas, patrimonio y expresiones sociales en LATAM.",
    },
    {
      title: "Biodiversidad",
      text: "Fauna, flora, ecosistemas y riesgos ambientales con enfoque regional comparativo.",
    },
    {
      title: "Indicadores",
      text: "HDI, desarrollo humano y variables socioeconomicas con trazabilidad de fuentes.",
    },
    {
      title: "Defensa",
      text: "Panorama institucional y capacidades publicas en fuerzas armadas de la region.",
    },
  ];

  const steps = [
    "El backend recupera contexto relevante segun tema y pais.",
    "El chat responde en formato claro, con fuentes y fecha de corte.",
  ];

  const countries = [
    "Argentina",
    "Bolivia",
    "Brasil",
    "Chile",
    "Colombia",
    "Costa Rica",
    "Cuba",
    "Ecuador",
    "El Salvador",
    "Guatemala",
    "Haiti",
    "Honduras",
    "Jamaica",
    "Mexico",
    "Nicaragua",
    "Panama",
    "Paraguay",
    "Peru",
    "Republica Dominicana",
    "Uruguay",
    "Venezuela",
  ];

  return (
    <main className="relative isolate min-h-screen bg-[var(--app-bg)] text-[var(--app-text)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 bg-[url('/background.png')] bg-cover bg-center bg-no-repeat"
        style={{ opacity: "var(--home-bg-image-opacity)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--home-bg-overlay)" }}
      />
      <header className="sticky top-0 z-20 border-b border-[var(--app-border)] bg-[var(--app-bg)]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-3 px-4 py-3 md:px-6">
          <a href="#" className="text-sm font-extrabold tracking-wide text-[var(--app-text)] md:text-base">
            LATAM AI AGENT
          </a>

          <nav className="hidden items-center gap-4 md:flex">
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="text-sm font-semibold text-[var(--app-text-muted)] hover:text-[var(--app-text)]">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeModeSwitch />
            <LaunchChatButton label="Abrir chat" />
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-[1180px] gap-6 px-4 pb-10 pt-10 md:grid-cols-[1.1fr_0.9fr] md:px-6 md:pt-14">
        <div>
          <p className="inline-flex rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-[var(--app-text-muted)]">
            Agente para LATAM
          </p>
          <h1 className="mt-3 max-w-[18ch] text-3xl font-extrabold leading-tight md:text-5xl">
            Respuestas regionales claras, trazables y sin ruido.
          </h1>
          <p className="mt-4 max-w-[60ch] text-sm leading-7 text-[var(--app-text-muted)] md:text-base">
            Plataforma conversacional enfocada en Latinoamerica y el Caribe. Consulta por pais, tema y periodo con salida estructurada y contexto verificable.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <LaunchChatButton label="Iniciar consulta" />
            <a
              href="#coverage"
              className="btn-secondary inline-flex items-center justify-center text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cta-border)]"
            >
              Ver cobertura
            </a>
          </div>
        </div>

        <article className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[0_12px_32px_rgba(15,23,42,0.08)] md:p-5">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--app-text-muted)]">Ejemplo</p>
          <p className="mt-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-2)] p-3 text-sm leading-6 text-[var(--app-text)]">
            &quot;Compara cultura de Peru y Bolivia en musica, fiestas tradicionales y lenguas originarias. Resume riesgos de perdida cultural y acciones sugeridas.&quot;
          </p>
          <ul className="mt-4 space-y-2 text-sm text-[var(--app-text-muted)]">
            <li>Respuesta estructurada por objetivo y pais.</li>
            <li>Cobertura tematica delimitada (sin mezclar dominios).</li>
            <li>Fuentes y fecha de corte visibles.</li>
          </ul>
        </article>
      </section>

      <section id="coverage" className="border-y border-[var(--app-border)] bg-[var(--app-surface)]">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-10 md:px-6">
          <h2 className="text-center text-2xl font-bold md:text-3xl">Cobertura principal</h2>
          <div className="mx-auto mt-5 grid w-full max-w-[1000px] gap-3 md:grid-cols-2">
            {coverage.map((item) => (
              <article key={item.title} className="rounded-xl border border-[var(--app-border)] bg-[var(--app-bg)] p-4">
                <h3 className="text-base font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto w-full max-w-[1180px] px-4 py-10 md:px-6">
        <h2 className="text-center text-2xl font-bold md:text-3xl">Como funciona</h2>
        <ol className="mx-auto mt-4 flex w-full max-w-[1000px] list-none flex-wrap justify-center gap-3 p-0">
          {steps.map((step) => (
            <li
              key={step}
              className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 text-sm leading-6 text-[var(--app-text-muted)] md:max-w-[calc(50%-0.375rem)]"
            >
              {step}
            </li>
          ))}
        </ol>
      </section>

      <section id="countries" className="border-t border-[var(--app-border)] bg-[var(--app-surface)]">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-10 md:px-6">
          <h2 className="text-2xl font-bold md:text-3xl">Paises objetivo LATAM y el Caribe</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {countries.map((country) => (
              <span key={country} className="rounded-full border border-[var(--app-border)] bg-[var(--app-bg)] px-3 py-1 text-sm font-semibold text-[var(--app-text-muted)]">
                {country}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
