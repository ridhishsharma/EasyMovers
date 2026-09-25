"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./crm-dashboard.module.css";

type Counts = Record<string, number>;
type DashboardData = {
  user: { fullName: string; email: string | null; lastLogin: string | null };
  roles: Array<{ code: string; name: string }>;
  permissions: string[];
  vendorApplications: { counts: Counts; staleCount: number; oldestOpenAgeDays: number } | null;
  vendors: { counts: Counts; activeCities: number } | null;
  officeUsers: { pendingInvitations: number } | null;
  leads: { counts: Counts; newToday: number } | null;
  serviceLocations: { counts: Counts } | null;
  analytics: { periodDays: number; city: string | null; state: string | null; serviceType: string | null; vendorsAdded: number; leadsInPeriod: number; topServices: Array<{ serviceType: string | null; count: number }> };
  generatedAt: string;
};

const total = (counts: Counts, statuses: string[]) => statuses.reduce((sum, status) => sum + (counts[status] ?? 0), 0);

export function CrmDashboard({ supabaseUrl, publishableKey }: { supabaseUrl: string; publishableKey: string }) {
  const router = useRouter();
  const client = useMemo(() => supabaseUrl && publishableKey ? createClient(supabaseUrl, publishableKey) : null, [supabaseUrl, publishableKey]);
  const [data, setData] = useState<DashboardData | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ period: "30", city: "", state: "", serviceType: "" });

  const load = useCallback(async () => {
    if (!client) { setMessage("Administrator sign-in is not configured."); setLoading(false); return; }
    setLoading(true); setMessage("");
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) { router.replace("/admin/login?returnTo=/admin/dashboard"); return; }
    try {
      const query = new URLSearchParams({ period: appliedFilters.period });
      if (appliedFilters.city) query.set("city", appliedFilters.city);
      if (appliedFilters.state) query.set("state", appliedFilters.state);
      if (appliedFilters.serviceType) query.set("serviceType", appliedFilters.serviceType);
      const response = await fetch(`/api/admin/dashboard?${query}`, { cache: "no-store", headers: { Authorization: `Bearer ${sessionData.session.access_token}` } });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload?.error?.message || "Unable to load the dashboard.");
      setData(payload.data);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load the dashboard."); }
    finally { setLoading(false); }
  }, [appliedFilters, client, router]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <main className={styles.page}><p className={styles.state}>Preparing your work dashboard…</p></main>;
  if (!data) return <main className={styles.page}><section className={styles.error}><h1>Dashboard unavailable</h1><p>{message}</p><button onClick={() => void load()}>Try again</button></section></main>;

  const firstName = data.user.fullName.trim().split(/\s+/)[0] || "there";
  const openApplications = data.vendorApplications ? total(data.vendorApplications.counts, ["PENDING", "UNDER_REVIEW", "NEEDS_INFORMATION"]) : 0;
  const pipelineLeads = data.leads ? total(data.leads.counts, ["NEW", "CONTACTED", "QUALIFIED"]) : 0;

  return <main className={styles.page}>
    <header className={styles.heading}>
      <div><p className={styles.eyebrow}>EASYMOVERS CRM</p><h1>Welcome, {firstName}</h1><p>Your priorities and operational position for today.</p></div>
      <div className={styles.refreshGroup}><span>Updated {new Date(data.generatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span><button className={styles.refresh} onClick={() => void load()}>Refresh dashboard</button></div>
    </header>
    <section className={styles.identity} aria-label="Current office access">
      <span>Signed in as <strong>{data.user.email || data.user.fullName}</strong></span>
      <div>{data.roles.map(role => <span className={role.code.includes("ADMIN") ? styles.adminRole : styles.role} key={role.code}>{role.name}</span>)}</div>
    </section>

    <form className={styles.filters} aria-label="Dashboard filters" onSubmit={(event) => { event.preventDefault(); setAppliedFilters({ period, city: city.trim(), state: state.trim(), serviceType }); }}>
      <label>Period<select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></label>
      <label>State<input placeholder="All states" value={state} onChange={(event) => setState(event.target.value)} /></label>
      <label>City<input placeholder="All cities" value={city} onChange={(event) => setCity(event.target.value)} /></label>
      <label>Service<select value={serviceType} onChange={(event) => setServiceType(event.target.value)}><option value="">All services</option><option value="HOUSEHOLD_RELOCATION">Household relocation</option><option value="OFFICE_RELOCATION">Office relocation</option><option value="CORPORATE_RELOCATION">Corporate relocation</option><option value="VEHICLE_TRANSPORT">Vehicle transport</option><option value="COMMERCIAL_GOODS">Commercial goods</option><option value="PACKING_ONLY">Packing only</option><option value="LOADING_UNLOADING">Loading/unloading</option></select></label>
      <button type="submit">Apply</button>
      <button type="button" onClick={() => { setPeriod("30"); setState(""); setCity(""); setServiceType(""); setAppliedFilters({ period: "30", city: "", state: "", serviceType: "" }); }}>Reset</button>
    </form>

    <section className={styles.cards} aria-label="CRM summary">
      {data.vendorApplications && <>
        <Link className={styles.cardLink} href="/admin/vendor-applications?status=PENDING"><article className={styles.attention}><span>Applications awaiting action</span><strong>{openApplications}</strong><small>{data.vendorApplications.staleCount} over SLA · oldest {data.vendorApplications.oldestOpenAgeDays} days · View →</small></article></Link>
        <Link className={styles.cardLink} href="/admin/vendor-applications?status=APPROVED"><article className={styles.success}><span>Approved applications</span><strong>{data.vendorApplications.counts.APPROVED ?? 0}</strong><small>Converted to vendor profiles · View →</small></article></Link>
      </>}
      {data.vendors && <>
        <Link className={styles.cardLink} href="/admin/vendors?status=ACTIVE"><article className={styles.active}><span>Active vendors</span><strong>{data.vendors.counts.ACTIVE ?? 0}</strong><small>Operational network · View →</small></article></Link>
        <Link className={styles.cardLink} href="/admin/vendors?status=INACTIVE"><article className={styles.inactive}><span>Inactive vendors</span><strong>{data.vendors.counts.INACTIVE ?? 0}</strong><small>Require activation review · View →</small></article></Link>
        <Link className={styles.cardLink} href="/admin/vendors?status=PENDING"><article className={styles.verification}><span>Pending verification</span><strong>{data.vendors.counts.PENDING ?? 0}</strong><small>Vendor profiles awaiting checks · View →</small></article></Link>
        <article className={styles.cities}><span>Vendor-covered cities</span><strong>{data.vendors.activeCities}</strong><small>Cities represented by active service areas</small></article>
        <article className={styles.information}><span>Vendors added</span><strong>{data.analytics.vendorsAdded}</strong><small>During the selected {data.analytics.periodDays}-day period</small></article>
      </>}
      {data.officeUsers && <Link className={styles.cardLink} href="/admin/users"><article className={styles.invitations}><span>Pending staff invitations</span><strong>{data.officeUsers.pendingInvitations}</strong><small>Passwords not configured · View →</small></article></Link>}
      {data.serviceLocations && <>
        <Link className={styles.cardLink} href="/admin/service-locations?status=ACTIVE"><article className={styles.cities}><span>Active service locations</span><strong>{data.serviceLocations.counts.ACTIVE ?? 0}</strong><small>Controlled launch cities · View →</small></article></Link>
        <Link className={styles.cardLink} href="/admin/service-locations?status=READY"><article className={styles.verification}><span>Locations ready to launch</span><strong>{data.serviceLocations.counts.READY ?? 0}</strong><small>Awaiting authorised activation · View →</small></article></Link>
      </>}
      {data.leads && <>
        <Link className={styles.cardLink} href="/admin/leads?status=OPEN"><article className={styles.sales}><span>Open sales pipeline</span><strong>{pipelineLeads}</strong><small>Active prospects · View →</small></article></Link>
        <Link className={styles.cardLink} href="/admin/leads?period=today"><article className={styles.leads}><span>New leads today</span><strong>{data.leads.newToday}</strong><small>Received since midnight · View →</small></article></Link>
        <Link className={styles.cardLink} href={`/admin/leads?period=${data.analytics.periodDays}`}><article className={styles.sales}><span>Leads in selected period</span><strong>{data.analytics.leadsInPeriod}</strong><small>Demand during the last {data.analytics.periodDays} days · View →</small></article></Link>
      </>}
    </section>

    {data.analytics.topServices.length > 0 && <section className={styles.insights}><div><p className={styles.eyebrow}>DEMAND INTELLIGENCE</p><h2>Most requested services</h2><p>Based on leads received during the selected period and geography.</p></div><ol>{data.analytics.topServices.map((item) => <li key={item.serviceType || "unspecified"}><span>{item.serviceType ? item.serviceType.replaceAll("_", " ").toLowerCase() : "Unspecified"}</span><strong>{item.count}</strong></li>)}</ol></section>}

    <section className={styles.work}>
      <div><p className={styles.eyebrow}>TODAY&apos;S WORK</p><h2>Action centre</h2><p>Only modules permitted for your assigned roles are shown.</p></div>
      <div className={styles.actions}>
        {data.vendorApplications && <Link href="/admin/vendor-applications"><strong>Review vendor applications</strong><span>{openApplications} currently require attention →</span></Link>}
        {data.officeUsers && <Link href="/admin/users"><strong>Manage office access</strong><span>{data.officeUsers.pendingInvitations} invitations awaiting password setup →</span></Link>}
        {data.vendors && <Link href="/admin/vendors"><strong>Open vendor directory</strong><span>Review verification and operational capacity →</span></Link>}
        {data.leads && <Link href="/admin/leads?status=OPEN"><strong>Manage sales pipeline</strong><span>{pipelineLeads} open leads require follow-up →</span></Link>}
        {data.serviceLocations && <Link href="/admin/service-locations"><strong>Manage service locations</strong><span>Review service readiness and launch capacity →</span></Link>}
      </div>
    </section>
  </main>;
}
