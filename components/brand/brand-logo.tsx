import styles from "./brand-logo.module.css";

/** Shared logo for public, customer, vendor and administrator pages. */
export function BrandLogo() {
  return <span className={styles.logo}><img src="/image/easymovers-logo.png" alt="EasyMovers" width={1350} height={629} /></span>;
}
