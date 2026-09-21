"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "./brand-logo";
import styles from "./brand-shell.module.css";
export function AppBrandShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isAdminLogin = pathname === "/admin/login";
  return (
    <>
      {pathname !== "/" && (
        <header className={styles.header}>
          <div className={styles.inner}>
            <Link href={isAdmin ? "/admin/dashboard" : "/"} aria-label={isAdmin ? "EasyMovers administration" : "EasyMovers home"}>
              <BrandLogo />
            </Link>
            {isAdmin ? isAdminLogin ? <span className={styles.adminArea}>Office administration</span> : <nav className={styles.adminNav} aria-label="Office navigation"><Link href="/admin/dashboard">Dashboard</Link><Link href="/admin/vendor-applications">Vendor applications</Link><Link href="/admin/users">Office users</Link></nav> : <nav aria-label="Page navigation">
              <Link href="/">Home</Link>
              <Link href="/track">Track / resume move</Link>
              <Link href="/partner">Become a partner</Link>
            </nav>}
          </div>
        </header>
      )}
      {children}
    </>
  );
}
