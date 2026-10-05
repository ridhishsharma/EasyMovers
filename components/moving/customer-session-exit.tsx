"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./customer-session-exit.module.css";

export function CustomerSessionExit({ reference }: { reference: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function endSession() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/public/customer-session", {
        method: "DELETE",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
    } finally {
      router.replace(`/track?reference=${encodeURIComponent(reference)}`);
      router.refresh();
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={styles.button}
      disabled={busy}
      onClick={() => void endSession()}
    >
      {busy ? "Ending session…" : "End secure session"}
    </button>
  );
}
