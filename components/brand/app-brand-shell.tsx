"use client";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const isAdmin = pathname.startsWith("/admin");
  const isAdminLogin = pathname === "/admin/login";
  const isVendor = pathname.startsWith("/vendor");
  const isVendorLogin = pathname === "/vendor/login";
  const isProtectedPortalPage = (isAdmin && !isAdminLogin) || (isVendor && !isVendorLogin);
  const protectedLoginDestination = isVendor
    ? `/vendor/login?returnTo=${encodeURIComponent(pathname)}`
    : `/admin/login?returnTo=${encodeURIComponent(pathname)}`;
  const client = useMemo(
    () => supabaseUrl && publishableKey ? createClient(supabaseUrl, publishableKey) : null,
    [supabaseUrl, publishableKey],
  );
  const [sessionState, setSessionState] = useState<SessionState>(isProtectedPortalPage ? "checking" : "authenticated");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!isProtectedPortalPage) {
      // Route scope changed; reset the shared shell gate for public/login pages.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSessionState("authenticated");
      return;
    }
    let active = true;
    setSessionState("checking");
    if (!client) {
      setSessionState("unauthenticated");
      window.location.replace(protectedLoginDestination);
      return;
    }
    void client.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.session) {
        setSessionState("unauthenticated");
        window.location.replace(protectedLoginDestination);
        return;
      }
      setSessionState("authenticated");
    });
    const { data } = client.auth.onAuthStateChange((event, session) => {
      if (!active || event === "INITIAL_SESSION") return;
      if (event === "SIGNED_OUT" || !session) {
        setSessionState("unauthenticated");
        window.location.replace(protectedLoginDestination);
      } else {
        setSessionState("authenticated");
      }
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [client, isProtectedPortalPage, protectedLoginDestination]);

  async function signOutOffice() {
    if (!client || signingOut) return;
    setSigningOut(true);
    try {
      const { data } = await client.auth.getSession();
      if (data.session && isAdmin) {
        // Audit logging must never prevent the browser session from closing.
        void fetch("/api/admin/session-events", {
          method: "POST",
          cache: "no-store",
          keepalive: true,
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ event: "LOGOUT" }),
        }).catch(() => undefined);
      }
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error) throw error;
      setSessionState("unauthenticated");
      if (isVendor) window.location.replace("/vendor/login");
      else window.location.replace("/admin/login");
    } catch {
      setSigningOut(false);
      window.alert("Sign out could not be completed. Please try again.");
    }
  }

  const mayRenderPortalPage = !isProtectedPortalPage || sessionState === "authenticated";
  return (
    <>
      {pathname !== "/" && (
        <header className={`${styles.header} ${isVendor ? styles.vendorHeader : ""}`}>
          <div className={styles.inner}>
            <Link href={isAdmin ? "/admin/dashboard" : isVendor ? "/vendor/dashboard" : "/"} aria-label={isAdmin ? "EasyMovers administration" : isVendor ? "EasyMovers vendor portal" : "EasyMovers home"}>
              <BrandLogo variant={isVendor ? "vendor" : "default"} />
            </Link>
            {isAdmin ? isAdminLogin ? <span className={styles.adminArea}>Office administration</span> : sessionState === "authenticated" ? <div className={styles.adminActions}><nav className={styles.adminNav} aria-label="Office navigation"><Link href="/admin/dashboard">Dashboard</Link><Link href="/admin/vendor-applications">Vendor applications</Link><Link href="/admin/vendors">Vendor operations</Link><Link href="/admin/vendor-changes">Change approvals</Link><Link href="/admin/vendor-settlements">Settlements</Link><Link href="/admin/service-locations">Service locations</Link><Link href="/admin/users">Office users</Link></nav><button type="button" className={styles.signOut} disabled={signingOut} onClick={() => void signOutOffice()}>{signingOut ? "Signing out…" : "Sign out"}</button></div> : <span className={styles.adminArea}>Checking office session…</span> : isVendor ? isVendorLogin ? <span className={styles.adminArea}>Partner portal</span> : sessionState === "authenticated" ? <div className={styles.adminActions}><nav aria-label="Vendor navigation"><Link href="/vendor/dashboard">Dashboard</Link></nav><button type="button" className={styles.signOut} disabled={signingOut} onClick={() => void signOutOffice()}>{signingOut ? "Signing out…" : "Sign out"}</button></div> : <span className={styles.adminArea}>Checking vendor session…</span> : <nav aria-label="Page navigation">
              <Link href="/">Home</Link>
              <Link href="/track">Track / resume move</Link>
              <Link href="/partner">Become a partner</Link>
            </nav>}
          </div>
        </header>
      )}
      {mayRenderPortalPage ? children : <main className={styles.sessionGate}><p>{sessionState === "checking" ? "Checking secure session…" : "Redirecting to sign in…"}</p></main>}
    </>
  );
}
