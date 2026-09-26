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
  vendors: { counts: Counts; activeCities: number; exceptions: { activeReadinessGaps: number; pendingDocuments: number; expiredInstantInsurance: number } } | null;
  officeUsers: { pendingInvitations: number } | null;
  leads: { counts: Counts; newToday: number } | null;
  serviceLocations: { counts: Counts } | null;
  vendorChanges: { pending: number } | null;
  analytics: { periodDays: number; city: string | null; state: string | null; serviceType: string | null; vendorsAdded: number; leadsInPeriod: number; topServices: Array<{ serviceType: string | null; count: number }> };
  generatedAt: string;
};

const total = (counts: Counts, statuses: string[]) => statuses.reduce((sum, status) => sum + (counts[status] ?? 0), 0);

const accessModules = [
  { name: "Vendor applications", href: "/admin/vendor-applications", permissions: [["vendor_application.read", "View"], ["vendor_application.review", "Review"], ["vendor_application.approve", "Approve"]] },
  { name: "Vendor operations", href: "/admin/vendors", permissions: [["vendor.read", "View"], ["vendor.manage", "Modify"], ["vendor.activate", "Activate / suspend"]] },
  { name: "Change approvals", href: "/admin/vendor-changes", permissions: [["vendor.verify", "Approve / reject"]] },
  { name: "Service locations", href: "/admin/service-locations", permissions: [["service_location.read", "View"], ["service_location.manage", "Modify"], ["service_location.activate", "Activate / suspend"]] },
  { name: "Office users", href: "/admin/users", permissions: [["crm_user.read", "View"], ["crm_user.manage", "Invite / assign roles"]] },
  { name: "Sales leads", href: "/admin/leads", permissions: [["lead.read", "View"], ["lead.manage", "Modify"], ["lead.assign", "Assign"]] },
] as const;

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
  const can = (permission: string) => data.permissions.includes(permission);
  const openApplications = data.vendorApplications ? total(data.vendorApplications.counts, ["PENDING", "UNDER_REVIEW", "NEEDS_INFORMATION"]) : 0;
  const pipelineLeads = data.leads ? total(data.leads.counts, ["NEW", "CONTACTED", "QUALIFIED"]) : 0;
  const vendorExceptionTotal = data.vendors ? data.vendors.exceptions.activeReadinessGaps + data.vendors.exceptions.pendingDocuments + data.vendors.exceptions.expiredInstantInsurance : 0;

  return <main className={styles.page}>
    <header className={styles.heading}>
      <div><p className={styles.eyebrow}>EASYMOVERS CRM</p><h1>Welcome, {firstName}</h1><p>Your priorities and operational position for today.</p></div>
      <div className={styles.refreshGroup}><span>Updated {new Date(data.generatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span><button className={styles.refresh} onClick={() => void load()}>Refresh dashboard</button></div>
    </header>
    <section className={styles.identity} aria-label="Current office access">
      <span>Signed in as <strong>{data.user.email || data.user.fullName}</strong></span>
      <div>{data.roles.map(role => <span className={role.code.includes("ADMIN") ? styles.adminRole : styles.role} key={role.code}>{role.name}</span>)}</div>
    </section>

    <section className={styles.access} aria-labelledby="access-heading">
      <div className={styles.accessIntro}><p className={styles.eyebrow}>YOUR AUTHORISED ACCESS</p><h2 id="access-heading">What you can do</h2><p>Only the actions listed below are enabled for your assigned CRM roles.</p></div>
      <div className={styles.accessGrid}>{accessModules.map(module => {
        const granted = module.permissions.filter(([permission]) => can(permission));
        return <article key={module.name} className={granted.length ? styles.accessGranted : styles.accessDenied}>
          <div><strong>{module.name}</strong><span>{granted.length ? granted.map(([, label]) => label).join(" · ") : "No access assigned"}</span></div>
          {granted.length > 0 && <Link href={module.href}>Open →</Link>}
        </article>;
      })}</div>
    </section>

    {data.vendors && vendorExceptionTotal > 0 && <section className={styles.exceptions} aria-labelledby="exceptions-heading">
      <div><p className={styles.eyebrow}>CONTROL EXCEPTIONS</p><h2 id="exceptions-heading">Problems requiring attention</h2><p>Active status and work eligibility are checked separately. Resolve these gaps before assigning affected vendors.</p></div>
      <div className={styles.exceptionGrid}>
        {data.vendors.exceptions.activeReadinessGaps > 0 && <Link href="/admin/vendors?status=ACTIVE"><strong>{data.vendors.exceptions.activeReadinessGaps}</strong><span>active vendors have readiness gaps</span><small>{can("vendor.manage") ? "Open and resolve →" : "Open for review →"}</small></Link>}
        {data.vendors.exceptions.pendingDocuments > 0 && <Link href="/admin/vendors"><strong>{data.vendors.exceptions.pendingDocuments}</strong><span>documents await verification</span><small>{can("vendor.manage") ? "Open verification queue →" : "Open for review →"}</small></Link>}
        {data.vendors.exceptions.expiredInstantInsurance > 0 && <Link href="/admin/vendors?status=ACTIVE"><strong>{data.vendors.exceptions.expiredInstantInsurance}</strong><span>instant-rate vendors have missing or expired insurance</span><small>{can("vendor.activate") ? "Review eligibility →" : "Open for review →"}</small></Link>}
      </div>
    </section>}

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
        <Link className={styles.cardLink} href="/admin/vendors?coverage=ACTIVE"><article className={styles.cities}><span>Vendor-covered cities</span><strong>{data.vendors.activeCities}</strong><small>Open vendors with active coverage · View →</small></article></Link>
        <Link className={styles.cardLink} href={`/admin/vendors?createdWithin=${data.analytics.periodDays}`}><article className={styles.information}><span>Vendors added</span><strong>{data.analytics.vendorsAdded}</strong><small>Added during the selected period · View →</small></article></Link>
      </>}
      {data.vendorChanges && <Link className={styles.cardLink} href="/admin/vendor-changes?status=PENDING"><article className={styles.verification}><span>Vendor changes awaiting approval</span><strong>{data.vendorChanges.pending}</strong><small>Independent checker action required · View →</small></article></Link>}
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
        {data.vendorApplications && <Link href="/admin/vendor-applications"><strong>{can("vendor_application.approve") ? "Review and approve vendor applications" : can("vendor_application.review") ? "Review vendor applications" : "View vendor applications"}</strong><span>{openApplications} currently require attention →</span></Link>}
        {data.officeUsers && <Link href="/admin/users"><strong>{can("crm_user.manage") ? "Manage office access" : "View office users"}</strong><span>{data.officeUsers.pendingInvitations} invitations awaiting password setup →</span></Link>}
        {data.vendors && <Link href="/admin/vendors"><strong>{can("vendor.activate") ? "Verify and activate vendors" : can("vendor.manage") ? "Maintain vendor records" : "View vendor directory"}</strong><span>{vendorExceptionTotal} operational exceptions require attention →</span></Link>}
        {data.vendorChanges && <Link href="/admin/vendor-changes"><strong>Review vendor record changes</strong><span>{data.vendorChanges.pending} changes await an independent checker →</span></Link>}
        {data.leads && <Link href="/admin/leads?status=OPEN"><strong>{can("lead.manage") ? "Manage sales pipeline" : "View sales pipeline"}</strong><span>{pipelineLeads} open leads require follow-up →</span></Link>}
        {data.serviceLocations && <Link href="/admin/service-locations"><strong>{can("service_location.activate") ? "Control service location launches" : can("service_location.manage") ? "Maintain service locations" : "View service locations"}</strong><span>Review service readiness and launch capacity →</span></Link>}
      </div>
    </section>
  </main>;
}
