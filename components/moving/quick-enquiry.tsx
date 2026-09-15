"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Phone } from "lucide-react";
import { LocationPicker, type LocationChoice } from "./location-picker";
import { localServiceCities, localVehicles } from "@/lib/local-services";
import { PostalPicker } from "./postal-picker";
import styles from "./moving.module.css";

const options = { cities: localServiceCities, vehicles: localVehicles };
export function QuickEnquiry({ service = "Household" }: { service?: string }) {
  const router = useRouter();
  const nonce = useRef("");
  const lock = useRef(false);
  const [mode, setMode] = useState<"LOCAL" | "INTERCITY">("LOCAL");
  const [from, setFrom] = useState<LocationChoice | null>(null);
  const [to, setTo] = useState<LocationChoice | null>(null);
  const [mobile, setMobile] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [originPostal, setOriginPostal] = useState(false);
  const [destinationPostal, setDestinationPostal] = useState(false);
  const [serviceCity, setServiceCity] = useState("");
  const [vehicle, setVehicle] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    if (mode === "LOCAL" && (!serviceCity || !vehicle)) { setError("Select a service city and supported vehicle."); return; }
    if (!from || !to) { setError("Select both locations from the suggestions or validate their PINs."); return; }
    if (!/^[6-9]\d{9}$/.test(mobile)) { setError("Enter your 10-digit mobile number."); return; }
    lock.current = true; setBusy(true); setError("");
    if (!nonce.current) nonce.current = crypto.randomUUID();
    try {
      const response = await fetch("/api/public/moving-enquiry", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: nonce.current, mode, from, to, mobile, consent: true,
          ...(mode === "LOCAL" ? { serviceCity, localVehicle: vehicle } : {}),
          service: mode === "LOCAL" && service === "Household" ? "Goods" : service }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw Error(data.message || "Unable to save draft.");
      try { localStorage.setItem("em_last_reference", data.reference); } catch {}
      router.push(`/draft/${encodeURIComponent(data.reference)}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save draft."); }
    finally { setBusy(false); lock.current = false; }
  }
  return <form onSubmit={submit} aria-busy={busy} className={styles.quickEnquiry}>
    <h2>Where to?</h2>
    <div className={styles.tabs} role="group" aria-label="Move distance">
      {(["LOCAL", "INTERCITY"] as const).map(value => <button type="button" key={value} disabled={busy} aria-pressed={mode === value} className={mode === value ? styles.active : ""} onClick={() => {
        setMode(value); setFrom(null); setTo(null); setOriginPostal(false); setDestinationPostal(false); setError(""); nonce.current = "";
      }}>{value === "LOCAL" ? "Within City" : "Between Cities"}</button>)}
    </div>
    <fieldset disabled={busy} className={styles.enquiryFields}>
      {mode === "LOCAL" && <>
        <label className={styles.field}>Service city<select required value={serviceCity} disabled={!options} onChange={event => { setServiceCity(event.target.value); setFrom(null); setTo(null); setVehicle(""); setError(""); }}>
          <option value="">Select service city</option>{options?.cities.map(city => <option key={city}>{city}</option>)}
        </select></label>
      </>}
      {(mode === "INTERCITY" || serviceCity) && <div className={styles.enquiryRoute}>
        <div>
          {originPostal ? <PostalPicker label="Origin" value={from} onChange={setFrom} /> : <LocationPicker key={`${mode}-${serviceCity}-from`} label={mode === "LOCAL" ? "Pickup" : "From"} local={mode === "LOCAL"} serviceCity={serviceCity} value={from} onChange={setFrom} />}
          {mode === "INTERCITY" && <button type="button" className={styles.smallLink} onClick={() => { setOriginPostal(!originPostal); setFrom(null); }}>{originPostal ? "Choose origin city" : "Search origin by PIN"}</button>}
        </div>
        <div>
          {destinationPostal ? <PostalPicker label="Destination" value={to} onChange={setTo} /> : <LocationPicker key={`${mode}-${serviceCity}-to`} label={mode === "LOCAL" ? "Drop" : "To"} local={mode === "LOCAL"} serviceCity={serviceCity} value={to} onChange={setTo} />}
          {mode === "INTERCITY" && <button type="button" className={styles.smallLink} onClick={() => { setDestinationPostal(!destinationPostal); setTo(null); }}>{destinationPostal ? "Choose destination city" : "Search destination by PIN"}</button>}
        </div>
      </div>}
      {(originPostal || destinationPostal) && <p className={styles.muted}>Postal locations are verified separately from vendor coverage.</p>}
      <div className={styles.enquiryRoute}>
        {mode === "LOCAL" && <label className={styles.field}>Vehicle<select required value={vehicle} disabled={!serviceCity || !options} onChange={event => setVehicle(event.target.value)}>
          <option value="">Select supported vehicle</option>{options?.vehicles.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
        </select></label>}
        <label className={styles.field}>Mobile number<input type="tel" inputMode="numeric" autoComplete="tel-national" required pattern="[6-9][0-9]{9}" placeholder="10-digit mobile number" maxLength={10} value={mobile} onChange={event => setMobile(event.target.value.replace(/\D/g, ""))} /></label>
      </div>
      <label className={styles.check}><input type="checkbox" required />I agree to be contacted about this moving enquiry.</label>
    </fieldset>
    {error && <p className={styles.error} role="alert">{error}</p>}
    <div className={styles.enquiryActions}>
      <button type="submit" disabled={busy} className={styles.primary}>{busy ? "Saving draft..." : "Continue"}<ArrowRight size={17} /></button>
      <a href="tel:+918959591603" className={styles.secondary}><Phone size={17} />Call EasyMover Expert</a>
    </div>
    <p className={styles.muted}>No payment now. Vehicle availability is confirmed before booking.</p>
  </form>;
}
