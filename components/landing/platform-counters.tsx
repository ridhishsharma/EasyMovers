"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, MapPin, BadgeCheck, Star } from "lucide-react";
import { parseMetrics, type Metrics } from "@/lib/platform-metrics";
import styles from "./landing-page.module.css";

function Counter({ value, rating = false }: { value: number | null; rating?: boolean }) {
  const [progress, setProgress] = useState(1);
  useEffect(() => {
    if (value === null || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / 1200, 1);
      setProgress(1 - (1 - p) ** 3);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <strong className={value === null ? styles.pendingCounter : undefined}>{value === null ? "Launching soon" : rating ? `${(value * progress).toFixed(1)}/5` : Math.round(value * progress).toLocaleString("en-IN")}</strong>;
}
export function PlatformCounters() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "api_error" | "invalid_response">("loading");
  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    async function refresh() {
      if (pending) return;
      pending = true;
      try {
        const response = await fetch("/api/public/platform-summary", { signal: controller.signal });
        if (!response.ok) throw Error("API");
        try { setMetrics(parseMetrics(await response.json())); setStatus("ready"); }
        catch { if (!controller.signal.aborted) setStatus("invalid_response"); }
      } catch { if (!controller.signal.aborted) setStatus("api_error"); }
      finally { pending = false; }
    }
    void refresh();
    const timer = setInterval(() => { if (!document.hidden) void refresh(); }, 60000);
    return () => { controller.abort(); clearInterval(timer); };
  }, []);
  const items = [
    { label: "Successful moves", value: metrics?.successfulMoves ?? null, Icon: ArrowUpRight },
    { label: "Cities covered", value: metrics?.citiesCovered ?? null, Icon: MapPin },
    { label: "Verified vendors", value: metrics?.verifiedVendors ?? null, Icon: BadgeCheck },
    { label: "Customer rating", value: metrics?.rating ?? null, Icon: Star, rating: true },
  ];
  const message = status === "loading" ? "Loading platform figures..."
    : status === "api_error" ? "Platform figures could not be loaded."
    : status === "invalid_response" ? "Platform figures could not be displayed."
    : metrics?.configuration === "missing" ? "Approved platform figures have not been published yet."
    : metrics?.configuration === "invalid" ? "Some platform figures are unavailable pending review."
    : metrics?.configuration === "partial" ? "Available approved platform figures."
    : "Approved platform figures.";
  return <section className={styles.counterSection} aria-label="Platform figures" data-status={status === "ready" ? metrics?.configuration : status}>
    <div className={styles.counterGrid}>{items.map(({ label, value, Icon, rating }) => <div key={label}><span aria-hidden="true"><Icon size={24} /></span><Counter value={value} rating={rating} /><p>{label}</p></div>)}</div>
    <p className={styles.counterNote} role="status">{message}{status !== "ready" && metrics ? " Showing last loaded approved figures." : ""}{metrics?.updatedAt ? ` Updated ${new Date(metrics.updatedAt).toLocaleDateString("en-IN")}.` : ""}</p>
  </section>;
}
