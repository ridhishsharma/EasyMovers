"use client";

import Link from "next/link";
import { useState } from "react";
import { QuickEnquiry } from "@/components/moving/quick-enquiry";
import styles from "./landing-page.module.css";
import { BrandLogo } from "@/components/brand/brand-logo";
import { RouteExplorer } from "./route-explorer";
import { PlatformCounters } from "./platform-counters";

type MoveType = "Household" | "Office" | "Vehicle";
const services: { type: MoveType; number: string; title: string; copy: string; icon: string }[] = [
  { type: "Household", number: "01", title: "Home shifting", copy: "From a few boxes to a whole home. Tell us what is moving, and where.", icon: "⌂" },
  { type: "Office", number: "02", title: "Office relocation", copy: "Plan furniture, equipment and packing around your business requirements.", icon: "▤" },
  { type: "Vehicle", number: "03", title: "Vehicle transport", copy: "Include your car or two-wheeler in a move, or request transport on its own.", icon: "↗" },
];
const faqs = [
  ["How do I get a moving quotation?", "Share your pickup city, destination, moving date and contact details. You can then add your inventory, which helps our team prepare a quotation based on your requirements."],
  ["Can I move within the same city?", "Yes. Choose Within City, then enter your pickup and drop localities. Availability will be confirmed for your route and preferred date."],
  ["What determines the price of my move?", "The route, quantity of goods, packing, access at both properties and additional services affect the quotation. Review the included services and charges before confirming."],
  ["Can I request help with fragile or special items?", "Yes. Add fragile goods, plants, vehicles and installation requirements when completing your inventory. The team will confirm what can be supported."],
  ["Does submitting this form confirm a booking?", "No. This is an enquiry. A booking is confirmed later, after the quotation and booking requirements have been agreed."],
];

function Arrow() { return <span aria-hidden="true">↗</span>; }

function MoveIllustration() {
  return <svg viewBox="0 0 620 410" role="img" aria-label="Illustration of a moving truck, packed boxes and a new home" className={styles.illustration}>
    <circle cx="332" cy="188" r="158" fill="#e7ede9" />
    <path d="M52 341H583" stroke="#a3b5b0" strokeWidth="2" />
    <path d="M384 157l71-57 70 57v141H384Z" fill="#fdfcf5" />
    <path d="M369 160l86-70 85 70" stroke="#264942" strokeWidth="8" strokeLinejoin="round" fill="none" />
    <rect x="441" y="231" width="33" height="67" rx="3" fill="#c2d2cb" />
    <rect x="401" y="179" width="30" height="33" rx="3" fill="#e3bb63" />
    <rect x="481" y="179" width="30" height="33" rx="3" fill="#e3bb63" />
    <path d="M416 179v33m-15-17h30m65-16v33m-15-17h30" stroke="#fff" strokeWidth="2" />
    <path d="M552 301v-79m0 35c-35 0-32-38-15-43 3-30 35-31 40-6 26 11 19 46-25 49" fill="#a6bcb0" stroke="#738f7d" strokeWidth="2" />
    <rect x="72" y="189" width="273" height="130" rx="12" fill="#132d3c" />
    <path d="M345 232h61l37 45v42h-98Z" fill="#d9a742" />
    <path d="M357 244h42l25 31h-67Z" fill="#f6f4ea" />
    <rect x="61" y="306" width="389" height="18" rx="5" fill="#264353" />
    <circle cx="126" cy="326" r="27" fill="#14232e" /><circle cx="126" cy="326" r="13" fill="#d5ddd9" />
    <circle cx="393" cy="326" r="27" fill="#14232e" /><circle cx="393" cy="326" r="13" fill="#d5ddd9" />
    <text x="108" y="249" fill="#f8f7f2" fontSize="29" fontWeight="700" fontFamily="Arial, sans-serif">EasyMovers</text>
    <text x="109" y="273" fill="#c8d5d8" fontSize="12" fontFamily="Arial, sans-serif" letterSpacing="2">A FRESH START AWAITS</text>
    <rect x="196" y="134" width="81" height="55" rx="3" fill="#dbb36b" /><path d="M236 134v55" stroke="#f2d8a7" strokeWidth="13" />
    <rect x="282" y="151" width="52" height="38" rx="3" fill="#b78c4c" /><path d="M308 151v38" stroke="#e8cc98" strokeWidth="8" />
    <rect x="463" y="305" width="52" height="36" rx="3" fill="#dbb36b" /><path d="M489 305v36" stroke="#f2d8a7" strokeWidth="8" />
    <path d="M103 122c38-36 68-43 104-37" stroke="#d9a742" strokeWidth="2" strokeDasharray="5 7" fill="none" />
    <path d="M213 77l-5 10-11 2" stroke="#d9a742" strokeWidth="2" fill="none" />
    <circle cx="82" cy="137" r="9" fill="#d9a742" /><circle cx="82" cy="137" r="3" fill="#fff" />
  </svg>;
}

export function LandingPage() {
  const [menuOpen,setMenuOpen]=useState(false);
  const [moveType,setMoveType]=useState<MoveType>("Household");
  function chooseService(type:MoveType){setMoveType(type);setMenuOpen(false);document.getElementById("move-form")?.scrollIntoView({behavior:"smooth",block:"start"});}
  return <div className={styles.page}>
    <a href="#main-content" className={styles.skip}>Skip to content</a>
    <header className={styles.header}>
      <div className={styles.nav}>
        <Link href="/" className={styles.brand} aria-label="EasyMovers home"><BrandLogo /></Link>
        <button className={styles.menuButton} aria-expanded={menuOpen} aria-controls="landing-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "Close" : "Menu"}</button>
        <nav id="landing-navigation" aria-label="Main navigation" className={`${styles.navLinks} ${menuOpen ? styles.navOpen : ""}`}>
          <a href="#services" onClick={() => setMenuOpen(false)}>Our services</a><a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a><a href="#routes" onClick={() => setMenuOpen(false)}>Explore routes</a><Link href="/track">Track / resume move</Link><a href="#questions" onClick={() => setMenuOpen(false)}>FAQs</a><Link href="/partner">Become a partner <Arrow /></Link>
        </nav>
        <a className={styles.navCta} href="#move-form">Plan your move <Arrow /></a>
      </div>
    </header>
    <main id="main-content">
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span /> YOUR NEXT CHAPTER STARTS HERE</p>
            <h1 id="hero-title">Move anywhere.<br /><em>With confidence.</em></h1>
            <p className={styles.intro}>Move anywhere with confidence. Your home, your office, your next chapter. Explore your route and plan a move built around the things that matter to you.</p>
            <div className={styles.heroNote}><span aria-hidden="true">✓</span> Your move. Your requirements. One place to start.</div>
            <div className={styles.heroVisual}><MoveIllustration /><div className={styles.floatingRoute}><span>YOUR NEXT CHAPTER</span><strong>Local streets ↗ New cities</strong><small>A clear plan for every move</small></div></div>
          </div>
          <div id="move-form" className={styles.formCard}>
            <QuickEnquiry service={moveType}/>
          </div>
        </div>
        <div className={styles.promiseStrip}><span>MOVE WITH A CLEAR PLAN</span><p>Home & office moves</p><b aria-hidden="true">·</b><p>Vehicle transportation</p><b aria-hidden="true">·</b><p>Local & intercity enquiries</p></div>
      </section>
      <PlatformCounters />
      <section id="services" className={styles.section} aria-labelledby="services-title">
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>MADE FOR YOUR NEXT MOVE</p><h2 id="services-title">Different moves.<br />The same thoughtful approach.</h2></div><p>Tell us what you need to move.<br />We’ll help you plan the next step.</p></div>
        <div className={styles.serviceGrid}>{services.map(service => <article className={styles.serviceCard} key={service.type}><div className={styles.cardTop}><span className={styles.serviceIcon} aria-hidden="true">{service.icon}</span><span>{service.number}</span></div><h3>{service.title}</h3><p>{service.copy}</p><button onClick={() => chooseService(service.type)}>Plan {service.type === "Household" ? "my home move" : service.type === "Office" ? "my office move" : "vehicle transport"} <Arrow /></button></article>)}</div>
      </section>
      <RouteExplorer pickup="" destination="" />
      <section id="how-it-works" className={styles.process} aria-labelledby="process-title"><div className={styles.section}><p className={styles.eyebrow}>FROM FIRST ENQUIRY TO MOVING DAY</p><h2 id="process-title">Less guesswork.<br />More moving forward.</h2><div className={styles.processGrid}>{[["01", "Tell us about your move", "Share your route and date, then add your inventory and any special requirements."], ["02", "Review your quotation", "Check the proposed services, charges and moving arrangements before you decide."], ["03", "Confirm your next chapter", "Complete the booking requirements and agree on the plan for moving day."]].map(([number, title, copy]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>
      <section className={`${styles.section} ${styles.detailsGrid}`} aria-labelledby="details-title"><div><p className={styles.eyebrow}>THE DETAILS MAKE THE DIFFERENCE</p><h2 id="details-title">A move is more<br />than boxes.</h2><p className={styles.sectionCopy}>The sofa that needs careful packing. The plants you want to bring along. The lift at your new home. Share the details that matter to your move.</p><a href="#move-form" className={styles.textLink}>Start with your route <Arrow /></a></div><div className={styles.detailList}>{[["Packing & fragile items", "Identify delicate goods and your packing requirements."], ["Access at both addresses", "Include floors, lifts, parking and loading access."], ["Additional services", "Request installation or removal help where available."]].map(([title, copy]) => <div key={title}><span aria-hidden="true">✓</span><div><h3>{title}</h3><p>{copy}</p></div></div>)}</div></section>
      <section className={styles.partnerSection}><div className={styles.partnerInner}><div><p className={styles.eyebrow}>GROW WITH EASYMOVERS</p><h2>Your moving expertise.<br />Our next chapter, together.</h2><p>Run a moving business? Share your services, operating areas and fleet through our partner onboarding.</p></div><Link href="/partner" className={styles.lightButton}>Become a moving partner <Arrow /></Link></div></section>
      <section id="questions" className={`${styles.section} ${styles.faqGrid}`} aria-labelledby="faq-title"><div><p className={styles.eyebrow}>GOOD QUESTIONS. CLEAR ANSWERS.</p><h2 id="faq-title">Before you<br />make your move.</h2></div><div>{faqs.map(([question, answer]) => <details className={styles.faq} key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
      <section className={styles.finalCta}><p className={styles.eyebrow}>A FRESH START IS CALLING</p><h2>Let’s make your next move easier.</h2><a href="#move-form" className={styles.primary}>Plan your move <Arrow /></a></section>
    </main>
    <footer className={styles.footer}><div className={styles.footerInner}><div><Link href="/" className={styles.brand}><BrandLogo /></Link><p>Move Anywhere With Confidence.</p></div><nav aria-label="Footer navigation"><a href="#services">Services</a><a href="#how-it-works">How it works</a><a href="#questions">FAQs</a><Link href="/partner">Partner with us</Link></nav></div><div className={styles.footerBottom}><span>© {new Date().getFullYear()} EasyMovers</span><span>Every move begins with a plan.</span></div></footer>
  </div>;
}
