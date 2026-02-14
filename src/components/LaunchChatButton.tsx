"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./LaunchChatButton.module.css";

type LaunchChatButtonProps = {
  label: string;
};

export default function LaunchChatButton({ label }: LaunchChatButtonProps) {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleOpenChat = () => {
    if (isTransitioning) {
      return;
    }

    setIsTransitioning(true);
    window.setTimeout(() => {
      router.push("/chat");
    }, 850);
  };

  return (
    <>
      <button
        type="button"
        className={`btn-primary ${styles.trigger}`}
        onClick={handleOpenChat}
        disabled={isTransitioning}
        aria-busy={isTransitioning}
      >
        {isTransitioning ? "Abriendo chat..." : label}
      </button>

      {isTransitioning && (
        <div className={styles.overlay} aria-hidden="true">
          <div className={styles.panel}>
            <div className={styles.spinner} />
            <p>Inicializando motor LATAM...</p>
          </div>
        </div>
      )}
    </>
  );
}
