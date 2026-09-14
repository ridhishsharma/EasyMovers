"use client";
import { useEffect, useState } from "react";
import styles from "./landing-page.module.css";

type Metrics = { successfulMoves: number | null; citiesCovered: number | null; verifiedVendors: number | null; rating: number | null; updatedAt: string | null };
function Counter({ value, rating = false }: { value: number | null; rating?: boolean }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (value === null || matchMedia("(prefers-reduced-motion: reduce)").matches) { setProgress(1); return; }
    let frame = 0; const start = performance.now();
    const tick = (now: number) => { const p = Math.min((now - start) / 1200, 1); setProgress(1 - (1 - p) ** 3); if (p < 1) frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [value]);
  return <strong>{value === null ? "—" : rating ? `${(value * progress).toFixed(1)}/5` : Math.round(value * progress).toLocaleString("en-IN")}</strong>;
}
export function PlatformCounters() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    async function refresh() { try { const response = await fetch("/api/public/platform-summary", { signal: controller.signal }); if (response.ok) setMetrics(await response.json()); } catch { /* Keep last known approved figures if refresh fails. */ } }
    void refresh(); const timer = setInterval(() => { if (!document.hidden) void refresh(); }, 60000);
    return () => { controller.abort(); clearInterval(timer); };
  }, []);
  const items = [{ label: "Successful moves", value: metrics?.successfulMoves ?? null, icon: "↗" }, { label: "Cities covered", value: metrics?.citiesCovered ?? null, icon: "◎" }, { label: "Verified vendors", value: metrics?.verifiedVendors ?? null, icon: "✓" }, { label: "Customer rating", value: metrics?.rating ?? null, icon: "★", rating: true }];
  return <section className={styles.counterSection} aria-label="Platform figures"><div className={styles.counterGrid}>{items.map(item => <div key={item.label}><span aria-hidden="true">{item.icon}</span><Counter value={item.value} rating={item.rating} /><p>{item.label}</p></div>)}</div><p className={styles.counterNote}>{items.every(item => item.value === null) ? "Platform figures are currently unavailable." : `Approved platform figures${metrics?.updatedAt ? ` · Updated ${new Date(metrics.updatedAt).toLocaleDateString("en-IN")}` : ""}`}</p></section>;
}
