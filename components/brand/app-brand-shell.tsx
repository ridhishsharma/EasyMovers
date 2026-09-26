"use client";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BrandLogo } from "./brand-logo";
import styles from "./brand-shell.module.css";

type SessionState = "checking" | "authenticated" | "unauthenticated";

export function AppBrandShell({ children, supabaseUrl, publishableKey }: {
  children: React.ReactNode;
  supabaseUrl: string;
  publishableKey: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = pathname.startsWith("/admin");
  const isAdminLogin = pathname === "/admin/login";
  const isProtectedAdminPage = isAdmin && !isAdminLogin;
  const client = useMemo(
    () => supabaseUrl && publishableKey ? createClient(supabaseUrl, publishableKey) : null,
    [supabaseUrl, publishableKey],
  );
  const [sessionState, setSessionState] = useState<SessionState>(isProtectedAdminPage ? "checking" : "authenticated");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!isProtectedAdminPage) {
      setSessionState("authenticated");
      return;
    }
    let active = true;
    setSessionState("checking");
    if (!client) {
      setSessionState("unauthenticated");
      router.replace(`/admin/login?returnTo=${encodeURIComponent(pathname)}`);
      return;
    }
    void client.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.session) {
        setSessionState("unauthenticated");
        router.replace(`/admin/login?returnTo=${encodeURIComponent(pathname)}`);
        return;
      }
      setSessionState("authenticated");
    });
    const { data } = client.auth.onAuthStateChange((event, session) => {
      if (!active || event === "INITIAL_SESSION") return;
      if (event === "SIGNED_OUT" || !session) {
        setSessionState("unauthenticated");
        router.replace(`/admin/login?returnTo=${encodeURIComponent(pathname)}`);
      } else {
        setSessionState("authenticated");
      }
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [client, isProtectedAdminPage, pathname, router]);

  async function signOutOffice() {
    if (!client || signingOut) return;
    setSigningOut(true);
    try {
      const { data } = await client.auth.getSession();
      if (data.session) {
        await fetch("/api/admin/session-events", {
          method: "POST",
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ event: "LOGOUT" }),
        }).catch(() => undefined);
      }
    } finally {
      await client.auth.signOut();
      setSessionState("unauthenticated");
      router.replace("/admin/login");
      router.refresh();
    }
  }

  const mayRenderAdminPage = !isProtectedAdminPage || sessionState === "authenticated";
  return (
    <>
      {pathname !== "/" && (
        <header className={styles.header}>
          <div className={styles.inner}>
            <Link href={isAdmin ? "/admin/dashboard" : "/"} aria-label={isAdmin ? "EasyMovers administration" : "EasyMovers home"}>
              <BrandLogo />
            </Link>
            {isAdmin ? isAdminLogin ? <span className={styles.adminArea}>Office administration</span> : sessionState === "authenticated" ? <div className={styles.adminActions}><nav className={styles.adminNav} aria-label="Office navigation"><Link href="/admin/dashboard">Dashboard</Link><Link href="/admin/vendor-applications">Vendor applications</Link><Link href="/admin/vendors">Vendor operations</Link><Link href="/admin/vendor-changes">Change approvals</Link><Link href="/admin/service-locations">Service locations</Link><Link href="/admin/users">Office users</Link></nav><button type="button" className={styles.signOut} disabled={signingOut} onClick={() => void signOutOffice()}>{signingOut ? "Signing out…" : "Sign out"}</button></div> : <span className={styles.adminArea}>Checking office session…</span> : <nav aria-label="Page navigation">
              <Link href="/">Home</Link>
              <Link href="/track">Track / resume move</Link>
              <Link href="/partner">Become a partner</Link>
            </nav>}
          </div>
        </header>
      )}
      {mayRenderAdminPage ? children : <main className={styles.sessionGate}><p>{sessionState === "checking" ? "Checking office session…" : "Redirecting to office sign in…"}</p></main>}
    </>
  );
}
