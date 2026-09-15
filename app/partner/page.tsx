import Link from "next/link";
import { Building2, Truck, ArrowRight } from "lucide-react";
import styles from "@/components/moving/partner-journey.module.css";
export default function PartnerPage() {
  return <main className={styles.page}><div className={styles.container}>
    <Link href="/" className={styles.back}>EasyMovers</Link>
    <h1>Partner with EasyMovers</h1>
    <p className={styles.intro}>Choose how you operate.</p>
    <div className={styles.choices}>
      <Link href="/partner/company" className={styles.choice}><Building2 size={32} /><h2>Register Moving Company</h2><p>For moving businesses managing teams, packing services and fleets.</p><span>Company registration <ArrowRight size={18} /></span></Link>
      <Link href="/partner/individual" className={styles.choice}><Truck size={32} /><h2>Register Individual Transporter</h2><p>For independent drivers and vehicle owners offering local transport.</p><span>Prepare application <ArrowRight size={18} /></span></Link>
    </div>
  </div></main>;
}
