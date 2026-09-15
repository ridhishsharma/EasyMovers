"use client";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { LocationChoice } from "./location-picker";
import styles from "./moving.module.css";
type Locality = { locality: string; district: string; state: string };

export function PostalPicker({ label, value, onChange }: {
  label: string; value: LocationChoice | null; onChange: (value: LocationChoice | null) => void;
}) {
  const [pin, setPin] = useState("");
  const [locations, setLocations] = useState<Locality[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  function select(item: Locality, checkedPin: string) {
    onChange({ pin: checkedPin, locality: item.locality, label: `${item.locality}, ${item.district}, ${item.state}` });
  }
  async function lookup() {
    request.current?.abort(); onChange(null); setLocations([]);
    if (!/^[1-9]\d{5}$/.test(pin)) { setError("Enter a valid six-digit PIN."); return; }
    const controller = new AbortController(); request.current = controller;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/public/postal-lookup?pin=${pin}`, { signal: controller.signal });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.locations) || !data.locations.length) throw Error(data.message || "No postal locality found. Choose a city instead.");
      if (controller.signal.aborted) return;
      setLocations(data.locations); select(data.locations[0], pin);
    } catch (reason) {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "PIN lookup unavailable.");
    } finally { if (!controller.signal.aborted) setBusy(false); }
  }
  return <div className={styles.fields}>
    <div className={styles.pinSearch}>
      <label className={styles.field}>{label} PIN<input inputMode="numeric" maxLength={6} value={pin} placeholder="6-digit PIN" onChange={event => {
        request.current?.abort(); setBusy(false); setPin(event.target.value.replace(/\D/g, "").slice(0, 6)); setLocations([]); setError(""); onChange(null);
      }} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); void lookup(); } }} /></label>
      <button type="button" className={styles.secondary} disabled={busy} onClick={lookup} aria-label={`Find ${label.toLowerCase()} PIN`} title={`Find ${label.toLowerCase()} PIN`}><Search size={18} /></button>
    </div>
    {busy && <p className={styles.muted} role="status">Checking PIN...</p>}
    {locations.length > 0 && <label className={styles.field}>{label} locality<select value={locations.findIndex(item => item.locality === value?.locality)} onChange={event => select(locations[Number(event.target.value)], pin)}>
      {locations.map((item, index) => <option key={index} value={index}>{item.locality}, {item.district}</option>)}
    </select></label>}
    {error && <p className={styles.error} role="alert">{error}</p>}
  </div>;
}
