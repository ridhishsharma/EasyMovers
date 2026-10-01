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

export function VendorPortalDashboard({ supabaseUrl, publishableKey }: { supabaseUrl: string; publishableKey: string }) {
  const client = useMemo(() => createClient(supabaseUrl, publishableKey), [supabaseUrl, publishableKey]);
  const [data, setData] = useState<PortalData | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

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
  </main>;
}
