"use client";

import { useEffect, useMemo, useState } from "react";

type ThemeMode = "auto" | "light" | "dark";

const STORAGE_KEY = "latamai-theme-mode";

function resolveAutoTheme(): "light" | "dark" {
  if (typeof window === "undefined") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function ThemeModeSwitch() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "auto";
    }
    const saved = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (saved === "light" || saved === "dark" || saved === "auto") {
      return saved;
    }
    return "auto";
  });

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      const theme = mode === "auto" ? resolveAutoTheme() : mode;
      root.setAttribute("data-theme", theme);
      root.setAttribute("data-theme-mode", mode);
    };

    applyTheme();

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (mode === "auto") {
        applyTheme();
      }
    };

    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  const label = useMemo(() => {
    if (mode === "auto") {
      return "Auto";
    }
    if (mode === "dark") {
      return "Oscuro";
    }
    return "Claro";
  }, [mode]);

  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-xs font-semibold text-[var(--app-text-muted)]">
      <span>Tema</span>
      <select
        suppressHydrationWarning
        value={mode}
        onChange={(event) => {
          const nextMode = event.target.value as ThemeMode;
          setMode(nextMode);
          window.localStorage.setItem(STORAGE_KEY, nextMode);
        }}
        aria-label="Modo de tema"
        title={`Tema actual: ${label}`}
        className="rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] px-1.5 py-0.5 text-xs font-semibold text-[var(--app-text)] outline-none"
      >
        <option value="auto">Auto</option>
        <option value="light">Claro</option>
        <option value="dark">Oscuro</option>
      </select>
    </label>
  );
}
