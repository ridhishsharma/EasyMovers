"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LocationPicker, type LocationChoice } from "./location-picker";
import styles from "./moving.module.css";
export function QuickEnquiry({ service = "Household" }: { service?: string }) {
  const router = useRouter(),
    nonce = useRef("");
  const [mode, setMode] = useState<"LOCAL" | "INTERCITY">("LOCAL");
  const [from, setFrom] = useState<LocationChoice | null>(null),
    [to, setTo] = useState<LocationChoice | null>(null),
    [mobile, setMobile] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [postal, setPostal] = useState(false),
    [pin, setPin] = useState("");
  const [locations, setLocations] = useState<
      { locality: string; district: string; state: string }[]
    >([]),
    [pinBusy, setPinBusy] = useState(false);
  const lock = useRef(false);
  async function lookup() {
    if (!/^[1-9]\d{5}$/.test(pin)) {
      setError("Enter a six-digit PIN.");
      return;
    }
    setPinBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/public/postal-lookup?pin=${pin}`);
      const data = await response.json();
      if (!response.ok || !data.locations?.length)
        throw Error(data.message || "No postal locality found.");
      setLocations(data.locations);
      const first = data.locations[0];
      setTo({
        pin,
        locality: first.locality,
        label: `${first.locality}, ${first.district}, ${first.state}`,
      });
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "PIN lookup unavailable.",
      );
    } finally {
      setPinBusy(false);
    }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    if (!from || !to) {
      setError("Select both locations from the suggestions.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError("Enter your 10-digit mobile number.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    if (!nonce.current) nonce.current = crypto.randomUUID();
    try {
      const response = await fetch("/api/public/moving-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: nonce.current,
          mode,
          from,
          to,
          mobile,
          consent: true,
          service:
            mode === "LOCAL" && service === "Household" ? "Goods" : service,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success)
        throw Error(data.message || "Unable to save draft.");
      try {
        localStorage.setItem("em_last_reference", data.reference);
      } catch {}
      router.push(`/draft/${encodeURIComponent(data.reference)}`);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to save draft.",
      );
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  return (
    <form onSubmit={submit} aria-busy={busy}>
      <p className={styles.eyebrow}>Let’s get you moving</p>
      <h2 style={{ margin: "10px 0 8px", fontSize: 28 }}>Where to?</h2>
      <p className={styles.muted}>
        Start with your route. Add your items next.
      </p>
      <div className={styles.tabs} role="group" aria-label="Move distance">
        {(["LOCAL", "INTERCITY"] as const).map((value) => (
          <button
            type="button"
            key={value}
            disabled={busy}
            aria-pressed={mode === value}
            className={mode === value ? styles.active : ""}
            onClick={() => {
              setMode(value);
              setFrom(null);
              setTo(null);
              setPostal(false);
              setPin("");
              setLocations([]);
              setError("");
              nonce.current = "";
            }}
          >
            {value === "LOCAL" ? "Within City" : "Between Cities"}
          </button>
        ))}
      </div>
      <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0 }}>
        <LocationPicker
          key={`${mode}-from`}
          label="From"
          local={mode === "LOCAL"}
          value={from}
          onChange={setFrom}
        />
        {!postal && (
          <LocationPicker
            key={`${mode}-to`}
            label="To"
            local={mode === "LOCAL"}
            value={to}
            onChange={setTo}
          />
        )}
        {mode === "INTERCITY" && (
          <button
            type="button"
            className={styles.smallLink}
            onClick={() => {
              setPostal(!postal);
              setTo(null);
              setLocations([]);
            }}
          >
            {postal
              ? "Choose destination city instead"
              : "Destination not listed? Use its PIN"}
          </button>
        )}
        {postal && (
          <div className={styles.fields}>
            <label className={styles.field}>
              Destination PIN
              <input
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setTo(null);
                  setLocations([]);
                }}
              />
            </label>
            <button
              type="button"
              disabled={pinBusy}
              className={styles.secondary}
              onClick={lookup}
            >
              {pinBusy ? "Checking PIN…" : "Find destination"}
            </button>
            {locations.length > 0 && (
              <label className={styles.field}>
                Postal locality
                <select
                  value={to?.locality || ""}
                  onChange={(e) => {
                    const item = locations.find(
                      (item) => item.locality === e.target.value,
                    );
                    if (item)
                      setTo({
                        pin,
                        locality: item.locality,
                        label: `${item.locality}, ${item.district}, ${item.state}`,
                      });
                  }}
                >
                  {locations.map((item, index) => (
                    <option key={index} value={item.locality}>
                      {item.locality} · {item.district}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <p className={styles.muted}>
              PIN recognition confirms a postal location. Vendor coverage is
              confirmed separately.
            </p>
          </div>
        )}
        <label className={styles.field}>
          Mobile number
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            required
            pattern="[6-9][0-9]{9}"
            placeholder="10-digit mobile number"
            maxLength={10}
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
          />
        </label>
        <label className={styles.check} style={{ marginTop: 16 }}>
          <input type="checkbox" required />I agree to be contacted about this
          moving enquiry.
        </label>
      </fieldset>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || pinBusy}
        className={`${styles.primary} ${styles.full}`}
        style={{ marginTop: 18 }}
      >
        {busy ? "Saving your draft…" : "Continue to Moving Items →"}
      </button>
      <p className={styles.muted}>
        No payment now. Save your draft and finish it later.
      </p>
    </form>
  );
}
