"use client";

import { createClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./vendor-portal.module.css";

type PortalData = {
  user: { fullName: string; email: string | null; mobile: string };
  vendor: { vendorCode: string; companyName: string; businessType: string; engagementMode: string; status: string };
  capabilities: { instantAvailability: boolean; quotationEnquiries: boolean };
  availability: { state: string; lastHeartbeatAt: string | null };
  enquiryPreference: { acceptingQuotationEnquiries: boolean; pausedUntil: string | null };
  summary: { pendingChanges: number; activeVehicles: number };
};
type Opportunity = {
  id: string; bookingNumber: string; serviceType: string; moveType: string; moveDate: string;
  pickupCity: string; pickupState: string; dropCity: string; dropState: string;
  inventorySummaryJson: unknown;
};

export function VendorPortalDashboard({ supabaseUrl, publishableKey }: { supabaseUrl: string; publishableKey: string }) {
  const client = useMemo(() => createClient(supabaseUrl, publishableKey), [supabaseUrl, publishableKey]);
  const [data, setData] = useState<PortalData | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [quoting, setQuoting] = useState<Opportunity | null>(null);
  const [quote, setQuote] = useState({ transportationCost: "", packingCost: "0", labourCost: "0", taxAmount: "0", validUntil: "", remarks: "" });

  const request = useCallback(async (url: string, options?: RequestInit) => {
    const { data: session } = await client.auth.getSession();
    if (!session.session) { window.location.replace("/vendor/login"); throw new Error("NO_SESSION"); }
    return fetch(url, { ...options, cache: "no-store", headers: { ...options?.headers, Authorization: `Bearer ${session.session.access_token}`, "Content-Type": "application/json" } });
  }, [client]);

  const load = useCallback(async () => {
    try {
      const response = await request("/api/vendor/portal");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Unable to load vendor portal.");
      setData(payload.data);
      if (payload.data.capabilities.quotationEnquiries && payload.data.enquiryPreference.acceptingQuotationEnquiries) {
        const queueResponse = await request("/api/vendor/opportunities");
        const queuePayload = await queueResponse.json();
        if (queueResponse.ok) setOpportunities(queuePayload.data.opportunities);
      } else setOpportunities([]);
    } catch (error) { if ((error as Error).message !== "NO_SESSION") setMessage((error as Error).message); }
  }, [request]);

  useEffect(() => {
    // Initial remote state is loaded after the Supabase browser session exists.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    if (data?.availability.state !== "ONLINE") return;
    const timer = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition(position => {
        void request("/api/vendor/availability", {
          method: "PUT",
          body: JSON.stringify({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        });
      }, () => undefined, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [data?.availability.state, request]);

  async function setAvailability(state: "ONLINE" | "PAUSED" | "OFFLINE") {
    setBusy(true); setMessage("");
    try {
      let location: { latitude?: number; longitude?: number } = {};
      if (state === "ONLINE") {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }));
        location = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      }
      const response = await request("/api/vendor/availability", { method: "POST", body: JSON.stringify({ state, ...location }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Availability could not be updated.");
      setMessage(state === "ONLINE" ? "You are online and eligible for matching while your heartbeat remains current." : `Work availability changed to ${state.toLowerCase()}.`);
      await load();
    } catch (error) {
      setMessage(error instanceof GeolocationPositionError ? "Allow location access before going online." : (error as Error).message);
    } finally { setBusy(false); }
  }

  async function setEnquiries(accepting: boolean) {
    setBusy(true); setMessage("");
    try {
      const response = await request("/api/vendor/enquiries", { method: "POST", body: JSON.stringify({ accepting }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Enquiry preference could not be updated.");
      setMessage(accepting ? "Quotation enquiries are now enabled." : "New quotation enquiries are paused.");
      await load();
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }

  async function submitQuotation(event: React.FormEvent) {
    event.preventDefault();
    if (!quoting) return;
    setBusy(true); setMessage("");
    try {
      const monetary = ["transportationCost", "packingCost", "labourCost", "taxAmount"] as const;
      const amounts = Object.fromEntries(monetary.map(key => [key, Number(quote[key])]));
      if (Object.values(amounts).some(value => !Number.isFinite(value) || value < 0)) throw new Error("Enter valid non-negative quotation amounts.");
      const totalAmount = Object.values(amounts).reduce((sum, value) => sum + value, 0);
      if (totalAmount <= 0) throw new Error("Quotation total must be greater than zero.");
      const response = await request(`/api/vendor/opportunities/${quoting.id}/quotation`, {
        method: "POST",
        body: JSON.stringify({ ...amounts, totalAmount, validUntil: quote.validUntil ? new Date(`${quote.validUntil}T23:59:59+05:30`).toISOString() : undefined, remarks: quote.remarks }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message || "Quotation could not be submitted.");
      setMessage(`Quotation submitted for ${quoting.bookingNumber}.`);
      setQuoting(null);
      setQuote({ transportationCost: "", packingCost: "0", labourCost: "0", taxAmount: "0", validUntil: "", remarks: "" });
      await load();
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }

  if (!data) return <main className={styles.page}><section className={styles.loading}>{message || "Loading your vendor workspace…"}</section></main>;
  return <main className={styles.page}>
    <section className={styles.hero}>
      <div><p className={styles.eyebrow}>PARTNER WORKSPACE</p><h1>Welcome, {data.user.fullName.split(" ")[0]}</h1><p>{data.vendor.companyName} · {data.vendor.vendorCode}</p></div>
      <span className={data.vendor.status === "ACTIVE" ? styles.active : styles.inactive}>{data.vendor.status}</span>
    </section>
    {message && <p className={styles.message} role="status">{message}</p>}
    <section className={styles.summary}>
      <article><span>Work model</span><strong>{data.vendor.engagementMode.replaceAll("_", " ")}</strong></article>
      <article><span>Active vehicles</span><strong>{data.summary.activeVehicles}</strong></article>
      <article><span>Changes awaiting review</span><strong>{data.summary.pendingChanges}</strong></article>
    </section>
    <section className={styles.workModes}>
      {data.capabilities.instantAvailability && <article className={styles.controlCard}>
        <p className={styles.eyebrow}>INSTANT-RATE WORK</p><div className={styles.cardTitle}><h2>Driver availability</h2><span className={styles.presence}>{data.availability.state}</span></div>
        <p>Online operators may receive nearby eligible jobs. Going online requires location access and a current insured vehicle.</p>
        <div className={styles.actions}><button disabled={busy || data.availability.state === "ONLINE"} onClick={() => void setAvailability("ONLINE")}>Go online</button><button disabled={busy || data.availability.state === "PAUSED"} className={styles.secondary} onClick={() => void setAvailability("PAUSED")}>Pause</button><button disabled={busy || data.availability.state === "OFFLINE"} className={styles.secondary} onClick={() => void setAvailability("OFFLINE")}>Go offline</button></div>
      </article>}
      {data.capabilities.quotationEnquiries && <article className={styles.controlCard}>
        <p className={styles.eyebrow}>SURVEY & QUOTATION WORK</p><div className={styles.cardTitle}><h2>New enquiries</h2><span className={data.enquiryPreference.acceptingQuotationEnquiries ? styles.accepting : styles.paused}>{data.enquiryPreference.acceptingQuotationEnquiries ? "ACCEPTING" : "PAUSED"}</span></div>
        <p>Company vendors receive matched quotation enquiries without needing to remain online continuously.</p>
        <div className={styles.actions}><button disabled={busy || data.enquiryPreference.acceptingQuotationEnquiries} onClick={() => void setEnquiries(true)}>Accept enquiries</button><button disabled={busy || !data.enquiryPreference.acceptingQuotationEnquiries} className={styles.secondary} onClick={() => void setEnquiries(false)}>Pause enquiries</button></div>
      </article>}
    </section>
    <section className={styles.notice}><strong>Operational controls are immediate.</strong><p>Profile, service area, vehicle, document and bank-detail amendments remain protected by EasyMovers maker-checker approval.</p></section>
    {data.capabilities.quotationEnquiries && <section className={styles.opportunities}>
      <div className={styles.sectionTitle}><div><p className={styles.eyebrow}>MATCHED TO YOUR SERVICES & COVERAGE</p><h2>Quotation enquiries</h2></div><strong>{opportunities.length} open</strong></div>
      {opportunities.length ? <div className={styles.opportunityGrid}>{opportunities.map(item => <article key={item.id}>
        <span>{item.bookingNumber}</span><h3>{item.serviceType.replaceAll("_", " ")}</h3>
        <p>{item.pickupCity}, {item.pickupState} → {item.dropCity}, {item.dropState}</p>
        <small>Move date: {new Date(item.moveDate).toLocaleDateString("en-IN")}</small>
        <button onClick={() => setQuoting(item)}>Prepare quotation</button>
      </article>)}</div> : <p className={styles.empty}>No eligible quotation enquiries are currently available for this vendor&apos;s active services and coverage.</p>}
    </section>}
    {quoting && <form className={styles.quoteForm} onSubmit={submitQuotation}>
      <div className={styles.sectionTitle}><div><p className={styles.eyebrow}>SECURE VENDOR QUOTATION</p><h2>{quoting.bookingNumber}</h2></div><button type="button" className={styles.close} onClick={() => setQuoting(null)}>Close</button></div>
      <div className={styles.quoteFields}>
        <label>Transportation ₹<input type="number" min="0" step="0.01" required value={quote.transportationCost} onChange={event => setQuote(current => ({ ...current, transportationCost: event.target.value }))} /></label>
        <label>Packing ₹<input type="number" min="0" step="0.01" value={quote.packingCost} onChange={event => setQuote(current => ({ ...current, packingCost: event.target.value }))} /></label>
        <label>Labour ₹<input type="number" min="0" step="0.01" value={quote.labourCost} onChange={event => setQuote(current => ({ ...current, labourCost: event.target.value }))} /></label>
        <label>Tax ₹<input type="number" min="0" step="0.01" value={quote.taxAmount} onChange={event => setQuote(current => ({ ...current, taxAmount: event.target.value }))} /></label>
        <label>Valid until<input type="date" required value={quote.validUntil} onChange={event => setQuote(current => ({ ...current, validUntil: event.target.value }))} /></label>
      </div>
      <label>Remarks<textarea maxLength={1000} value={quote.remarks} onChange={event => setQuote(current => ({ ...current, remarks: event.target.value }))} /></label>
      <button disabled={busy}>{busy ? "Submitting…" : "Submit quotation"}</button>
    </form>}
  </main>;
}
