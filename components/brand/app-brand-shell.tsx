"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "./brand-logo";
import styles from "./brand-shell.module.css";
export function AppBrandShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <>
      {pathname !== "/" && (
        <header className={styles.header}>
          <div className={styles.inner}>
            <Link href="/" aria-label="EasyMovers home">
              <BrandLogo />
            </Link>
            <nav aria-label="Page navigation">
              <Link href="/">Home</Link>
              <Link href="/track">Track / resume move</Link>
              <Link href="/partner">Become a partner</Link>
            </nav>
          </div>
        </header>
      )}
      {children}
    </>
  );
}
