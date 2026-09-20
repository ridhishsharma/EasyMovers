"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import styles from "./crm-users-admin.module.css";

type Role = { code: string; name: string; description: string | null; isSystem: boolean };
type User = {
  id: string; fullName: string; email: string | null; mobile: string; role: string; isActive: boolean;
  emailVerified: boolean; mobileVerified: boolean; lastLogin: string | null; createdAt: string;
  crmRoleAssignments: Array<{ assignedAt: string; expiresAt: string | null; role: { code: string; name: string } }>;
};

async function token(client: SupabaseClient) {
  const { data } = await client.auth.getSession();
  if (!data.session) throw new Error("Your session has expired. Sign in again.");
  return data.session.access_token;
}

function isAdministratorRole(code: string) {
  return code.includes("ADMIN") || code.includes("SUPER");
}

export function CrmUsersAdmin({ supabaseUrl, publishableKey }: { supabaseUrl: string; publishableKey: string }) {
  const router = useRouter();
  const client = useMemo(() => supabaseUrl && publishableKey ? createClient(supabaseUrl, publishableKey) : null, [supabaseUrl, publishableKey]);
  const [ready, setReady] = useState(() => !client); const [signedIn, setSignedIn] = useState(false);
  const [users, setUsers] = useState<User[]>([]); const [roles, setRoles] = useState<Role[]>([]);
  const [currentUserId, setCurrentUserId] = useState(""); const [selected, setSelected] = useState<User | null>(null);
  const [roleCodes, setRoleCodes] = useState<string[]>([]); const [active, setActive] = useState(true);
  const [search, setSearch] = useState(""); const [appliedSearch, setAppliedSearch] = useState("");
  const [creating, setCreating] = useState(false); const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(""); const [mobile, setMobile] = useState("");
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");

  const api = useCallback(async (path: string, init?: RequestInit) => {
    if (!client) throw new Error("Office sign-in is not configured.");
    const response = await fetch(path, { ...init, cache: "no-store", headers: { Authorization: `Bearer ${await token(client)}`, ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers } });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
      if (response.status === 401) { await client.auth.signOut(); router.replace("/admin/login?returnTo=/admin/users"); }
      throw new Error(result?.error?.message || "The office user service is unavailable.");
    }
    return result.data;
  }, [client, router]);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const query = new URLSearchParams(); if (appliedSearch) query.set("search", appliedSearch);
      const data = await api(`/api/admin/crm-users?${query}`);
      setUsers(data.users); setRoles(data.roles); setCurrentUserId(data.currentUserId);
      if (selected) {
        const refreshed = data.users.find((user: User) => user.id === selected.id) ?? null;
        setSelected(refreshed);
        if (refreshed) { setActive(refreshed.isActive); setRoleCodes(refreshed.crmRoleAssignments.map((item: User["crmRoleAssignments"][number]) => item.role.code)); }
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load office users."); }
    finally { setBusy(false); }
  }, [api, appliedSearch, selected]);

  useEffect(() => {
    if (!client) return;
    void client.auth.getSession().then(({ data }) => { setSignedIn(Boolean(data.session)); setReady(true); if (!data.session) router.replace("/admin/login?returnTo=/admin/users"); });
    const { data } = client.auth.onAuthStateChange((_event, session) => { setSignedIn(Boolean(session)); if (!session) router.replace("/admin/login?returnTo=/admin/users"); });
    return () => data.subscription.unsubscribe();
  }, [client, router]);
  useEffect(() => { if (signedIn) void load(); }, [signedIn, appliedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  function choose(user: User) {
    setCreating(false); setSelected(user); setActive(user.isActive);
    setRoleCodes(user.crmRoleAssignments.map(item => item.role.code)); setMessage("");
  }
  function beginCreate() {
    setCreating(true); setSelected(null); setFullName(""); setEmail(""); setMobile("");
    setRoleCodes([]); setMessage("");
  }
  function toggleRole(code: string) { setRoleCodes(values => values.includes(code) ? values.filter(value => value !== code) : [...values, code]); }

  async function save(event: FormEvent) {
    event.preventDefault(); if (!selected || busy) return;
    if (!roleCodes.length) { setMessage("Select at least one CRM role."); return; }
    if (!active && selected.id === currentUserId) { setMessage("You cannot deactivate your own office account."); return; }
    setBusy(true); setMessage("");
    try {
      await api(`/api/admin/crm-users/${encodeURIComponent(selected.id)}`, { method: "PATCH", body: JSON.stringify({ isActive: active, roleCodes }) });
      await load(); setMessage(`Access updated for ${selected.fullName}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to update office access."); setBusy(false); }
  }

  async function invite(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    if (!roleCodes.length) { setMessage("Select at least one CRM role."); return; }
    setBusy(true); setMessage("");
    try {
      await api("/api/admin/crm-users", { method: "POST", body: JSON.stringify({ fullName, email, mobile, roleCodes }) });
      await load(); setCreating(false); setMessage(`Invitation sent to ${email.trim().toLowerCase()}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to invite the office user."); setBusy(false); }
  }

  const roleChoices = <fieldset><legend>CRM roles</legend><p>Permissions are inherited from the selected roles. Administrator roles are highlighted in gold.</p>{roles.map(role => {
    const selectedRole = roleCodes.includes(role.code);
    const roleTone = isAdministratorRole(role.code) ? styles.administratorRole : styles.operationalRole;
    return <label key={role.code} className={`${styles.roleOption} ${roleTone} ${selectedRole ? styles.selectedRole : ""}`}><input type="checkbox" checked={selectedRole} onChange={() => toggleRole(role.code)} /><span><strong>{role.name}</strong><small>{role.description}</small></span></label>;
  })}</fieldset>;

  if (!ready) return <main className={styles.page}><p>Checking office session…</p></main>;
  if (!client) return <main className={styles.page}><p>Office authentication is not configured.</p></main>;
  if (!signedIn) return <main className={styles.page}><p>Redirecting to office sign in…</p></main>;

  const currentUser = users.find(user => user.id === currentUserId);
  const firstName = currentUser?.fullName.trim().split(/\s+/)[0] || "Administrator";

  return <main className={styles.page}>
    <header className={styles.heading}><div><p>OFFICE ACCESS MANAGEMENT</p><h1>Welcome, {firstName}</h1><span>Manage office users, invitations and role-based access.</span></div><button className={styles.primary} onClick={beginCreate}>Add office user</button></header>
    <section className={styles.toolbar}><form onSubmit={event => { event.preventDefault(); setAppliedSearch(search.trim()); }}><label><span className={styles.srOnly}>Search office users</span><input value={search} maxLength={100} placeholder="Search name, email or mobile…" onChange={event => setSearch(event.target.value)} /></label><button>Search</button></form><button className={styles.linkButton} disabled={busy} onClick={() => void load()}>Refresh</button></section>
    {message && <p className={message.includes("updated") || message.includes("sent") ? styles.success : styles.error} role="status">{message}</p>}
    <div className={styles.workspace}>
      <section className={styles.list} aria-label="Office users"><div className={styles.listTitle}><strong>{users.length} office user{users.length === 1 ? "" : "s"}</strong><span>Maximum 100</span></div><div className={styles.scroll}>{users.map(user => <button key={user.id} className={selected?.id === user.id ? styles.selectedUser : styles.user} onClick={() => choose(user)}><span><strong>{user.fullName}</strong><small className={user.isActive ? styles.activeText : styles.inactiveText}>{user.isActive ? "Active" : "Inactive"}</small></span><span>{user.email || user.mobile}</span><span className={styles.roleBadges}>{user.crmRoleAssignments.length ? user.crmRoleAssignments.map(item => <small key={item.role.code} className={isAdministratorRole(item.role.code) ? styles.administratorBadge : styles.operationalBadge}>{item.role.name}</small>) : <small className={styles.noRoleBadge}>No active CRM role</small>}</span></button>)}</div></section>
      <section className={styles.detail} aria-label="Office user access"><div className={styles.detailScroll}>{creating ? <form onSubmit={invite}><div className={styles.person}><div><h2>Add office user</h2><p>A secure password-setup invitation will be emailed to the employee.</p></div><button type="button" className={styles.close} onClick={() => setCreating(false)}>×</button></div><div className={styles.fields}><label>Full name<input required maxLength={100} value={fullName} onChange={event => setFullName(event.target.value)} /></label><label>Official email<input required type="email" maxLength={254} value={email} onChange={event => setEmail(event.target.value)} /></label><label>Mobile number<input required inputMode="numeric" maxLength={10} value={mobile} onChange={event => setMobile(event.target.value.replace(/\D/g, "").slice(0, 10))} /></label></div>{roleChoices}<div className={styles.actionFooter}><button className={styles.primary} disabled={busy || !roleCodes.length}>{busy ? "Sending invitation…" : "Create user & send invitation"}</button></div></form> : !selected ? <div className={styles.empty}><h2>Select an office user</h2><p>Review account status and assigned CRM roles.</p></div> : <form onSubmit={save}><div className={styles.person}><div><h2>{selected.fullName}</h2><p>{selected.email || "No email"} · {selected.mobile}</p></div><span className={selected.isActive ? styles.activeBadge : styles.inactiveBadge}>{selected.isActive ? "Active" : "Inactive"}</span></div><dl><dt>Legacy account role</dt><dd>{selected.role.replaceAll("_", " ")}</dd><dt>Email verified</dt><dd>{selected.emailVerified ? "Yes" : "Invitation pending"}</dd><dt>Last login</dt><dd>{selected.lastLogin ? new Date(selected.lastLogin).toLocaleString("en-IN") : "Not recorded"}</dd></dl>{roleChoices}<label className={styles.statusControl}><input type="checkbox" checked={active} disabled={selected.id === currentUserId} onChange={event => setActive(event.target.checked)} /><span><strong>Office access active</strong><small>{selected.id === currentUserId ? "You cannot deactivate your own account." : "Turn off to block CRM access immediately."}</small></span></label><div className={styles.actionFooter}><button className={styles.primary} disabled={busy || !roleCodes.length}>{busy ? "Saving…" : "Save access"}</button></div></form>}</div></section>
    </div>
  </main>;
}
