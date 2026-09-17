"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "./brand-logo";
import styles from "./brand-shell.module.css";
export function AppBrandShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  return (
    <>
      {pathname !== "/" && (
        <header className={styles.header}>
          <div className={styles.inner}>
            <Link href={isAdmin ? "/admin/vendor-applications" : "/"} aria-label={isAdmin ? "EasyMovers administration" : "EasyMovers home"}>
              <BrandLogo />
            </Link>
            {isAdmin ? <span className={styles.adminArea}>Office administration</span> : <nav aria-label="Page navigation">
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
