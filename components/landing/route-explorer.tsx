"use client";

import { useState } from "react";
import styles from "./landing-page.module.css";

type Route = { title: string; from: string; to: string; category: string; path: string };
const routes: Route[] = [
  { title: "A local move, a fresh start", from: "MP Nagar, Bhopal", to: "Arera Colony, Bhopal", category: "LOCAL TRANSPORT", path: "M230 210 Q340 100 440 190" },
  { title: "Across cities. Closer to home.", from: "Bhopal, Madhya Pradesh", to: "Indore, Madhya Pradesh", category: "INTERCITY MOVING", path: "M175 235 Q280 60 455 145" },
  { title: "Your next chapter, further afield", from: "Bhopal, Madhya Pradesh", to: "Pune, Maharashtra", category: "LONG DISTANCE", path: "M195 125 Q400 110 400 280" },
];

export function RouteExplorer({ pickup, destination }: { pickup: string; destination: string }) {
  const [index, setIndex] = useState(0);
  const [custom, setCustom] = useState(false);
  const selected = routes[index];
  const origin = custom ? pickup.trim() : selected.from;
  const target = custom ? destination.trim() : selected.to;
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  const params = new URLSearchParams({ key: key ?? "", origin: `${origin}, India`, destination: `${target}, India`, mode: "driving" });
  const mapsUrl = `https://www.google.com/maps/dir/?${new URLSearchParams({ api: "1", origin: `${origin}, India`, destination: `${target}, India`, travelmode: "driving" })}`;
  return <section className={styles.routeSection} id="routes" aria-labelledby="route-title">
    <div className={styles.section}><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>LOCAL STREETS. NEW CITIES. NEW POSSIBILITIES.</p><h2 id="route-title">See where your<br />next move takes you.</h2></div><p>Explore a route, or preview your own.<br />Service availability is confirmed separately.</p></div>
      <div className={styles.routeWorkspace}><div className={styles.routeChoices}><p className={styles.routeLabel}>EXPLORE EXAMPLE ROUTES</p>{routes.map((route, i) => <button key={route.category} aria-pressed={!custom && index === i} className={!custom && index === i ? styles.routeSelected : ""} onClick={() => { setIndex(i); setCustom(false); }}><small>{route.category}</small><strong>{route.from.split(",")[0]} <span>→</span> {route.to.split(",")[0]}</strong><span>{route.title}</span></button>)}<button disabled={!pickup.trim() || !destination.trim()} aria-pressed={custom} onClick={() => setCustom(true)} className={custom ? styles.routeSelected : ""}><small>YOUR ENQUIRY ROUTE</small><strong>Preview my route ↗</strong><span>Enter pickup and destination above.</span></button></div>
      <div className={styles.mapPanel}>
        <div className={styles.mapTop}><span><i /> INTERACTIVE ROUTE PREVIEW</span><small>{custom ? "Your selected locations" : "Example locations"}</small></div>
        {key ? <iframe title={`Google Maps driving route from ${origin} to ${target}`} src={`https://www.google.com/maps/embed/v1/directions?${params}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen className={styles.googleMap} /> : <div className={styles.schematic}><svg viewBox="0 0 650 350" aria-label="Illustrated route preview, not live GPS" role="img"><defs><pattern id="streets" width="85" height="65" patternUnits="userSpaceOnUse"><path d="M0 0H85V65H0Z" fill="none" stroke="#fff" strokeWidth="7" /></pattern></defs><rect width="650" height="350" fill="#e9eff4"/><path d="M0 90Q150 180 300 90T650 130V0H0Z" fill="#dce8da"/><path d="M450 0Q400 110 490 190T510 350" fill="none" stroke="#bed8eb" strokeWidth="28"/><rect width="650" height="350" fill="url(#streets)"/><path d="M20 330L620 20M0 175L650 175" stroke="#fff" strokeWidth="14"/><path d={selected.path} fill="none" stroke="#165ba5" strokeWidth="6" strokeLinecap="round"/><circle r="8" fill="#efba42" stroke="#fff" strokeWidth="3"><animateMotion dur="7s" repeatCount="indefinite" path={selected.path}/></circle><circle cx={index === 0 ? "230" : index === 1 ? "175" : "195"} cy={index === 0 ? "210" : index === 1 ? "235" : "125"} r="11" fill="#165ba5" stroke="#fff" strokeWidth="4"/><circle cx={index === 0 ? "440" : index === 1 ? "455" : "400"} cy={index === 0 ? "190" : index === 1 ? "145" : "280"} r="11" fill="#efba42" stroke="#fff" strokeWidth="4"/></svg><div className={styles.mapNotice}>Illustrated route • Not live GPS</div></div>}
        <div className={styles.mapBottom}><div><small>FROM</small><strong>{origin}</strong></div><span>→</span><div><small>TO</small><strong>{target}</strong></div><a href={mapsUrl} target="_blank" rel="noopener noreferrer">Open Google Maps ↗</a></div>
        <p className={styles.mapDisclaimer}>{key ? "Google Maps displays a driving route, not an available vehicle or confirmed service." : "Illustrated route preview. Open Google Maps to explore directions; the animation is not a vehicle location."}</p>
      </div></div>
    </div>
  </section>;
}
