import styles from "./brand-logo.module.css";

/** Shared logo for public, customer, vendor and administrator pages. */
export function BrandLogo() {
  return (
    <span className={styles.logo} role="img" aria-label="EasyMovers">
      <img className={styles.icon} src="/image/New_Logo_NBG.png" alt="" width={332} height={303} />
      <span className={styles.word}>
        <span className={styles.easy}>Easy</span><span className={styles.movers}>Movers</span>
      </span>
    </span>
  );
}
