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
  generatedAt: string;
};

const total = (counts: Counts, statuses: string[]) => statuses.reduce((sum, status) => sum + (counts[status] ?? 0), 0);

export function CrmDashboard({ supabaseUrl, publishableKey }: { supabaseUrl: string; publishableKey: string }) {
  const router = useRouter();
  const client = useMemo(() => supabaseUrl && publishableKey ? createClient(supabaseUrl, publishableKey) : null, [supabaseUrl, publishableKey]);
  const [data, setData] = useState<DashboardData | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!client) { setMessage("Administrator sign-in is not configured."); setLoading(false); return; }
    setLoading(true); setMessage("");
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) { router.replace("/admin/login?returnTo=/admin/dashboard"); return; }
    try {
      const response = await fetch("/api/admin/dashboard", { cache: "no-store", headers: { Authorization: `Bearer ${sessionData.session.access_token}` } });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload?.error?.message || "Unable to load the dashboard.");
      setData(payload.data);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load the dashboard."); }
    finally { setLoading(false); }
  }, [client, router]);

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

    <section className={styles.cards} aria-label="CRM summary">
      {data.vendorApplications && <>
        <article className={styles.attention}><span>Applications requiring action</span><strong>{openApplications}</strong><small>{data.vendorApplications.staleCount} waiting more than 3 days</small></article>
        <article className={data.vendorApplications.oldestOpenAgeDays >= 3 ? styles.ageing : styles.information}><span>Oldest open application</span><strong>{data.vendorApplications.oldestOpenAgeDays} days</strong><small>{data.vendorApplications.oldestOpenAgeDays >= 3 ? "Attention required" : "Within review target"}</small></article>
        <article className={styles.success}><span>Approved applications</span><strong>{data.vendorApplications.counts.APPROVED ?? 0}</strong><small>Converted to vendor profiles</small></article>
      </>}
      {data.vendors && <>
        <article className={styles.active}><span>Active vendors</span><strong>{data.vendors.counts.ACTIVE ?? 0}</strong><small>{data.vendors.counts.PENDING ?? 0} pending verification</small></article>
        <article className={styles.inactive}><span>Inactive vendors</span><strong>{data.vendors.counts.INACTIVE ?? 0}</strong><small>Require activation review</small></article>
        <article className={styles.cities}><span>Active service cities</span><strong>{data.vendors.activeCities}</strong><small>Enabled origin cities</small></article>
      </>}
      {data.officeUsers && <article className={styles.invitations}><span>Pending staff invitations</span><strong>{data.officeUsers.pendingInvitations}</strong><small>Passwords not configured</small></article>}
      {data.leads && <>
        <article className={styles.sales}><span>Open sales pipeline</span><strong>{pipelineLeads}</strong><small>Active prospects</small></article>
        <article className={styles.leads}><span>New leads today</span><strong>{data.leads.newToday}</strong><small>Received since midnight</small></article>
      </>}
    </section>

    <section className={styles.work}>
      <div><p className={styles.eyebrow}>TODAY&apos;S WORK</p><h2>Action centre</h2><p>Only modules permitted for your assigned roles are shown.</p></div>
      <div className={styles.actions}>
        {data.vendorApplications && <Link href="/admin/vendor-applications"><strong>Review vendor applications</strong><span>{openApplications} currently require attention →</span></Link>}
        {data.officeUsers && <Link href="/admin/users"><strong>Manage office access</strong><span>{data.officeUsers.pendingInvitations} invitations awaiting password setup →</span></Link>}
        {data.leads && <div className={styles.coming}><strong>Sales pipeline</strong><span>Role access is ready; workflow screen is the next commercial module.</span></div>}
      </div>
    </section>
  </main>;
}
