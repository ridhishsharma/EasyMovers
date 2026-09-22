"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import styles from "./service-locations-admin.module.css";

type LocationStatus = "DRAFT" | "READY" | "ACTIVE" | "SUSPENDED";
type ServiceStatus = LocationStatus;
type Scope = "WITHIN_CITY" | "WITHIN_STATE" | "PAN_INDIA";
type ServiceType = "HOUSEHOLD_RELOCATION" | "OFFICE_RELOCATION" | "CORPORATE_RELOCATION" | "VEHICLE_TRANSPORT" | "COMMERCIAL_GOODS" | "WAREHOUSING" | "PACKING_ONLY" | "LOADING_UNLOADING" | "INSTALLATION_UNINSTALLATION";
type FulfilmentMode = "INSTANT_RATE" | "QUOTATION" | "SURVEY_AND_QUOTATION";
type Capabilities = { canManage: boolean; canActivate: boolean };
type LocationSummary = { id: string; code: string; city: string; state: string; countryCode: string; status: LocationStatus; plannedLaunchAt: string | null; activatedAt: string | null; suspendedAt: string | null; updatedAt: string; _count: { services: number } };
type LocationService = { id: string; scope: Scope; serviceType: ServiceType; fulfilmentMode: FulfilmentMode; status: ServiceStatus; instantPricingAvailable: boolean; surveyRequired: boolean; minimumVerifiedVendors: number };
type LocationDetail = LocationSummary & { district: string | null; stateCode: string | null; verificationPostalCode: string | null; locationSource: "CATALOG" | "POSTAL_LOOKUP" | "MANUAL_REVIEW"; locationVerifiedAt: string | null; serviceablePostalCodes: string[]; operationsContactName: string | null; operationsContactMobile: string | null; operationsContactEmail: string | null; approvedAt: string | null; suspensionReason: string | null; services: LocationService[] };
type ReadinessService = { id: string; scope: Scope; serviceType: ServiceType; status: ServiceStatus; verifiedVendors: number; minimumVerifiedVendors: number; ready: boolean };
type Readiness = { locationStatus: LocationStatus; services: ReadinessService[]; readyServices: number; blockers: ReadinessService[] };
type Pagination = { page: number; pageSize: number; total: number; totalPages: number };
type StateChoice = { code: string; name: string };
type CityChoice = { city: string; state: string; stateCode: string };
type PostalCandidate = CityChoice & { district: string; locality: string; division: string | null; pin: string };

const statusOptions: Array<"" | LocationStatus> = ["", "DRAFT", "READY", "ACTIVE", "SUSPENDED"];
const scopes: Scope[] = ["WITHIN_CITY", "WITHIN_STATE", "PAN_INDIA"];
const serviceTypes: ServiceType[] = ["HOUSEHOLD_RELOCATION", "OFFICE_RELOCATION", "CORPORATE_RELOCATION", "VEHICLE_TRANSPORT", "COMMERCIAL_GOODS", "WAREHOUSING", "PACKING_ONLY", "LOADING_UNLOADING", "INSTALLATION_UNINSTALLATION"];
const fulfilmentModes: FulfilmentMode[] = ["INSTANT_RATE", "QUOTATION", "SURVEY_AND_QUOTATION"];
const label = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/^./, letter => letter.toUpperCase());
const dateTime = (value?: string | null) => value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Not recorded";
const dateOnly = (value?: string | null) => value ? new Date(value).toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: "UTC" }) : "Not recorded";
const isSuccessMessage = (value: string) => /success|saved|created|updated|ready|suspended|verified/i.test(value);

async function token(client: SupabaseClient) {
  const { data } = await client.auth.getSession();
  if (!data.session) throw new Error("Your office session has expired. Sign in again.");
  return data.session.access_token;
}

export function ServiceLocationsAdmin({ supabaseUrl, publishableKey }: { supabaseUrl: string; publishableKey: string }) {
  const router = useRouter();
  const client = useMemo(() => supabaseUrl && publishableKey ? createClient(supabaseUrl, publishableKey) : null, [supabaseUrl, publishableKey]);
  const initialStatus = useMemo(() => {
    if (typeof window === "undefined") return "";
    const value = new URLSearchParams(window.location.search).get("status")?.toUpperCase() ?? "";
    return statusOptions.includes(value as "" | LocationStatus) ? value as "" | LocationStatus : "";
  }, []);
  const [ready, setReady] = useState(() => !client); const [signedIn, setSignedIn] = useState(false);
  const [locations, setLocations] = useState<LocationSummary[]>([]); const [selected, setSelected] = useState<LocationDetail | null>(null);
  const [readiness, setReadiness] = useState<Readiness | null>(null); const [capabilities, setCapabilities] = useState<Capabilities>({ canManage: false, canActivate: false });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 25, total: 0, totalPages: 0 });
  const [search, setSearch] = useState(""); const [appliedSearch, setAppliedSearch] = useState(""); const [status, setStatus] = useState<"" | LocationStatus>(initialStatus);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [editing, setEditing] = useState(false); const [creating, setCreating] = useState(false);
  const [states, setStates] = useState<StateChoice[]>([]); const [cities, setCities] = useState<CityChoice[]>([]); const [postalCandidates, setPostalCandidates] = useState<PostalCandidate[]>([]);
  const [lookupMode, setLookupMode] = useState<"CATALOG" | "POSTAL_LOOKUP">("CATALOG"); const [lookupPin, setLookupPin] = useState(""); const [lookingUp, setLookingUp] = useState(false);
  const [reverifyPin, setReverifyPin] = useState("");
  const [locationForm, setLocationForm] = useState({ code: "", city: "", district: "", state: "", stateCode: "", verificationPostalCode: "", pins: "", contactName: "", contactMobile: "", contactEmail: "", plannedLaunchAt: "" });
  const [serviceForm, setServiceForm] = useState<{ scope: Scope; serviceType: ServiceType; fulfilmentMode: FulfilmentMode; status: "DRAFT" | "READY"; instantPricingAvailable: boolean; surveyRequired: boolean; minimumVerifiedVendors: number }>({ scope: "WITHIN_CITY", serviceType: "HOUSEHOLD_RELOCATION", fulfilmentMode: "QUOTATION", status: "DRAFT", instantPricingAvailable: false, surveyRequired: true, minimumVerifiedVendors: 1 });

  const api = useCallback(async (path: string, init?: RequestInit) => {
    if (!client) throw new Error("Office authentication is not configured.");
    const response = await fetch(path, { ...init, cache: "no-store", headers: { Authorization: `Bearer ${await token(client)}`, ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers } });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      if (response.status === 401) { await client.auth.signOut(); router.replace("/admin/login?returnTo=/admin/service-locations"); }
      throw new Error(payload?.error?.message || "The service location operation is temporarily unavailable.");
    }
    return payload.data;
  }, [client, router]);

  const loadLocations = useCallback(async (page = 1) => {
    setBusy(true); setMessage("");
    try {
      const query = new URLSearchParams({ page: String(page), pageSize: "25" });
      if (status) query.set("status", status); if (appliedSearch) query.set("search", appliedSearch);
      const data = await api(`/api/admin/service-locations?${query}`);
      setLocations(data.locations); setPagination(data.pagination); setCapabilities(data.capabilities);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load service locations."); }
    finally { setBusy(false); }
  }, [api, appliedSearch, status]);

  const loadStates = useCallback(async () => {
    try { const data = await api("/api/admin/location-catalog"); setStates(data.states); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load Indian states."); }
  }, [api]);

  const openLocation = useCallback(async (id: string) => {
    setBusy(true); setMessage(""); setCreating(false); setEditing(false);
    try {
      const data = await api(`/api/admin/service-locations/${encodeURIComponent(id)}`);
      setSelected(data.location); setReadiness(data.readiness); setCapabilities(data.capabilities);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load the location."); }
    finally { setBusy(false); }
  }, [api]);

  useEffect(() => {
    if (!client) return;
    void client.auth.getSession().then(({ data }) => { setSignedIn(Boolean(data.session)); setReady(true); if (!data.session) router.replace("/admin/login?returnTo=/admin/service-locations"); });
    const { data } = client.auth.onAuthStateChange((_event, session) => { setSignedIn(Boolean(session)); if (!session) router.replace("/admin/login?returnTo=/admin/service-locations"); });
    return () => data.subscription.unsubscribe();
  }, [client, router]);
  useEffect(() => { if (signedIn) { void loadLocations(1); void loadStates(); } }, [signedIn, loadLocations, loadStates]);
  useEffect(() => {
    if (!message || !isSuccessMessage(message)) return;
    const timer = window.setTimeout(() => setMessage(""), 4500);
    return () => window.clearTimeout(timer);
  }, [message]);

  function resetLocationForm(location?: LocationDetail) {
    setLocationForm(location ? {
      code: location.code, city: location.city, district: location.district || "", state: location.state, stateCode: location.stateCode || "", verificationPostalCode: location.verificationPostalCode || "", pins: location.serviceablePostalCodes.join(", "),
      contactName: location.operationsContactName || "", contactMobile: location.operationsContactMobile || "", contactEmail: location.operationsContactEmail || "",
      plannedLaunchAt: location.plannedLaunchAt ? new Date(location.plannedLaunchAt).toISOString().slice(0, 10) : "",
    } : { code: "", city: "", district: "", state: "", stateCode: "", verificationPostalCode: "", pins: "", contactName: "", contactMobile: "", contactEmail: "", plannedLaunchAt: "" });
  }

  function beginCreate() { resetLocationForm(); setCities([]); setPostalCandidates([]); setLookupMode("CATALOG"); setLookupPin(""); setCreating(true); setEditing(false); setSelected(null); setReadiness(null); setMessage(""); }
  function beginEdit() { if (!selected) return; resetLocationForm(selected); setEditing(true); setCreating(false); setMessage(""); }

  async function saveLocation(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setMessage("");
    const body = { code: locationForm.code || undefined, city: locationForm.city, district: locationForm.district, state: locationForm.state, locationSource: lookupMode, verificationPostalCode: locationForm.verificationPostalCode || undefined, serviceablePostalCodes: locationForm.pins.split(/[\s,]+/).filter(Boolean), operationsContactName: locationForm.contactName || null, operationsContactMobile: locationForm.contactMobile || null, operationsContactEmail: locationForm.contactEmail || null, plannedLaunchAt: locationForm.plannedLaunchAt || null };
    const wasCreating = creating;
    try {
      const data = creating ? await api("/api/admin/service-locations", { method: "POST", body: JSON.stringify(body) }) : await api(`/api/admin/service-locations/${selected?.id}`, { method: "PATCH", body: JSON.stringify(body) });
      setCreating(false); setEditing(false); await loadLocations(1); await openLocation(data.location.id); setMessage(wasCreating ? "Service location created in draft status." : "Location details updated.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save the location."); setBusy(false); }
  }

  async function chooseState(stateName: string) {
    const state = states.find(item => item.name === stateName);
    setLocationForm(value => ({ ...value, state: state?.name || "", stateCode: state?.code || "", city: "", district: "", verificationPostalCode: "" }));
    setCities([]); setPostalCandidates([]); setMessage("");
    if (!state) return;
    setLookingUp(true);
    try { const data = await api(`/api/admin/location-catalog?state=${encodeURIComponent(state.name)}`); setCities(data.cities); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load cities for this state."); }
    finally { setLookingUp(false); }
  }

  async function findByPin() {
    if (!/^[1-9][0-9]{5}$/.test(lookupPin) || lookingUp) { setMessage("Enter a valid six-digit Indian PIN code."); return; }
    setLookingUp(true); setMessage("");
    try { const data = await api(`/api/admin/location-catalog?pin=${lookupPin}`); setPostalCandidates(data.candidates); }
    catch (error) { setPostalCandidates([]); setMessage(error instanceof Error ? error.message : "Unable to verify this PIN code."); }
    finally { setLookingUp(false); }
  }

  function choosePostalCandidate(value: string) {
    const candidate = postalCandidates[Number(value)];
    if (!candidate) return;
    setLocationForm(current => ({ ...current, city: candidate.city, district: candidate.district, state: candidate.state, stateCode: candidate.stateCode, verificationPostalCode: candidate.pin }));
  }

  function editService(service: LocationService) {
    setServiceForm({ scope: service.scope, serviceType: service.serviceType, fulfilmentMode: service.fulfilmentMode, status: service.status === "READY" ? "READY" : "DRAFT", instantPricingAvailable: service.instantPricingAvailable, surveyRequired: service.surveyRequired, minimumVerifiedVendors: service.minimumVerifiedVendors });
  }

  async function saveService(event: FormEvent) {
    event.preventDefault(); if (!selected || busy) return;
    setBusy(true); setMessage("");
    try {
      await api(`/api/admin/service-locations/${selected.id}/services`, { method: "PUT", body: JSON.stringify(serviceForm) });
      await openLocation(selected.id); await loadLocations(pagination.page); setMessage(`${label(serviceForm.serviceType)} configuration saved.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save the service."); setBusy(false); }
  }

  async function changeStatus(action: "MARK_READY" | "ACTIVATE" | "SUSPEND") {
    if (!selected || busy) return;
    const reason = action === "SUSPEND" ? window.prompt("Why is this location being suspended?", "Operational review required") : "";
    if (action === "SUSPEND" && !reason) return;
    if (action === "ACTIVATE" && !window.confirm(`Activate ${selected.city}, ${selected.state} and publish every ready service?`)) return;
    setBusy(true); setMessage("");
    try {
      await api(`/api/admin/service-locations/${selected.id}/status`, { method: "POST", body: JSON.stringify({ action, reason }) });
      await openLocation(selected.id); await loadLocations(pagination.page); setMessage(action === "ACTIVATE" ? "Location activated successfully." : action === "SUSPEND" ? "Location suspended." : "Location marked ready for activation.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to change the location status."); setBusy(false); }
  }

  async function verifyExisting(locationSource: "CATALOG" | "POSTAL_LOOKUP") {
    if (!selected || busy) return;
    if (locationSource === "POSTAL_LOOKUP" && !/^[1-9][0-9]{5}$/.test(reverifyPin)) { setMessage("Enter a valid six-digit PIN code for this existing city."); return; }
    setBusy(true); setMessage("");
    try {
      await api(`/api/admin/service-locations/${selected.id}/verify`, { method: "POST", body: JSON.stringify({ locationSource, verificationPostalCode: locationSource === "POSTAL_LOOKUP" ? reverifyPin : undefined }) });
      await openLocation(selected.id); setReverifyPin(""); setMessage("Location geography verified and audit history recorded.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to verify this existing location."); setBusy(false); }
  }

  if (!ready) return <main className={styles.page}><p>Checking office session…</p></main>;
  if (!client) return <main className={styles.page}><p>Office authentication is not configured.</p></main>;
  if (!signedIn) return <main className={styles.page}><p>Redirecting to office sign in…</p></main>;

  const locationFormPanel = <form className={styles.locationForm} onSubmit={saveLocation}>
    <div className={styles.panelTitle}><div><h2>{creating ? "Add service location" : "Edit location"}</h2><p>Creating a city does not make it publicly serviceable.</p></div><button type="button" aria-label="Close form" onClick={() => { setCreating(false); setEditing(false); }}>×</button></div>
    {creating && <div className={styles.locationMethod}><button type="button" className={lookupMode === "CATALOG" ? styles.activeMethod : styles.method} onClick={() => { setLookupMode("CATALOG"); setPostalCandidates([]); resetLocationForm(); }}>Choose state & city</button><button type="button" className={lookupMode === "POSTAL_LOOKUP" ? styles.activeMethod : styles.method} onClick={() => { setLookupMode("POSTAL_LOOKUP"); setCities([]); resetLocationForm(); }}>Find city by PIN</button></div>}
    <div className={styles.formGrid}>{creating && lookupMode === "CATALOG" ? <><label>State *<select required value={locationForm.state} onChange={event => void chooseState(event.target.value)}><option value="">Select state or union territory</option>{states.map(item => <option key={item.code} value={item.name}>{item.name}</option>)}</select></label><label>City *<select required disabled={!locationForm.state || lookingUp} value={locationForm.city} onChange={event => { const city = cities.find(item => item.city === event.target.value); setLocationForm(value => ({ ...value, city: city?.city || "", district: city?.city || "", stateCode: city?.stateCode || value.stateCode })); }}><option value="">{lookingUp ? "Loading cities…" : locationForm.state ? "Select city" : "Select state first"}</option>{cities.map(item => <option key={`${item.stateCode}-${item.city}`} value={item.city}>{item.city}</option>)}</select><small>City not listed? Use “Find city by PIN”.</small></label></> : creating ? <><label>Verification PIN *<span className={styles.pinLookup}><input required inputMode="numeric" maxLength={6} value={lookupPin} onChange={event => { setLookupPin(event.target.value.replace(/\D/g, "").slice(0, 6)); setPostalCandidates([]); }} /><button type="button" disabled={lookingUp || lookupPin.length !== 6} onClick={() => void findByPin()}>{lookingUp ? "Checking…" : "Find"}</button></span></label><label>Postal locality *<select required disabled={!postalCandidates.length} defaultValue="" onChange={event => choosePostalCandidate(event.target.value)}><option value="">{postalCandidates.length ? "Choose matching locality" : "Search PIN first"}</option>{postalCandidates.map((item, index) => <option key={`${item.pin}-${item.locality}-${index}`} value={index}>{item.locality} — {item.district}, {item.state}</option>)}</select></label><div className={styles.verifiedLocation}><strong>{locationForm.city ? `${locationForm.city}, ${locationForm.state}` : "Location not yet verified"}</strong><span>{locationForm.city ? `${locationForm.district} District · PIN ${locationForm.verificationPostalCode}` : "Choose a postal result to continue."}</span></div></> : <><label>Verified city<input readOnly value={locationForm.city} /></label><label>State<input readOnly value={locationForm.state} /></label></>}<label>Location code<input readOnly placeholder="Generated automatically" value={locationForm.code} /></label><label>Planned launch<input type="date" value={locationForm.plannedLaunchAt} onChange={event => setLocationForm(value => ({ ...value, plannedLaunchAt: event.target.value }))} /></label><label className={styles.wide}>Serviceable PIN codes <small>Coverage area—not the city-verification PIN</small><input placeholder="462011, 462016" value={locationForm.pins} onChange={event => setLocationForm(value => ({ ...value, pins: event.target.value.replace(/[^0-9,\s]/g, "") }))} /></label><label>Operations contact<input maxLength={100} value={locationForm.contactName} onChange={event => setLocationForm(value => ({ ...value, contactName: event.target.value }))} /></label><label>Operations mobile<input inputMode="numeric" maxLength={10} value={locationForm.contactMobile} onChange={event => setLocationForm(value => ({ ...value, contactMobile: event.target.value.replace(/\D/g, "").slice(0, 10) }))} /></label><label className={styles.wide}>Operations email<input type="email" maxLength={254} value={locationForm.contactEmail} onChange={event => setLocationForm(value => ({ ...value, contactEmail: event.target.value }))} /></label></div>
    <div className={styles.formActions}><button className={styles.primary} disabled={busy}>{busy ? "Saving…" : creating ? "Create draft location" : "Save location"}</button><button type="button" className={styles.secondary} onClick={() => { setCreating(false); setEditing(false); }}>Cancel</button></div>
  </form>;

  return <main className={styles.page}>
    <header className={styles.heading}><div><p>NETWORK EXPANSION</p><h1>Service locations</h1><span>Launch cities only when services and verified vendor capacity are ready.</span></div><div className={styles.headingActions}><button className={styles.secondary} disabled={busy} onClick={() => void loadLocations(pagination.page)}>Refresh</button>{capabilities.canManage && <button className={styles.primary} onClick={beginCreate}>Add location</button>}</div></header>
    <section className={styles.toolbar}><form onSubmit={event => { event.preventDefault(); setAppliedSearch(search.trim()); }}><input aria-label="Search service locations" maxLength={100} placeholder="Search city, state or code…" value={search} onChange={event => setSearch(event.target.value)} /><button>Search</button></form><select aria-label="Filter locations by status" value={status} onChange={event => { setStatus(event.target.value as "" | LocationStatus); setSelected(null); }}><option value="">All statuses</option>{statusOptions.slice(1).map(item => <option key={item} value={item}>{label(item)}</option>)}</select></section>
    {message && <p className={isSuccessMessage(message) ? styles.success : styles.error} role="status">{message}</p>}
    <div className={styles.workspace}>
      <section className={styles.listPanel}><div className={styles.listTitle}><strong>{pagination.total} location{pagination.total === 1 ? "" : "s"}</strong><span>Page {pagination.page} of {Math.max(1, pagination.totalPages)}</span></div><div className={styles.locationList}>{locations.length ? locations.map(location => <button key={location.id} className={selected?.id === location.id ? styles.selectedLocation : styles.locationCard} onClick={() => void openLocation(location.id)}><span><strong>{location.city}</strong><small className={`${styles.badge} ${styles[location.status]}`}>{label(location.status)}</small></span><span>{location.state} · {location.code}</span><small>{location._count.services} configured service{location._count.services === 1 ? "" : "s"}</small></button>) : <p className={styles.empty}>No service locations match these filters.</p>}</div><div className={styles.pagination}><button disabled={busy || pagination.page <= 1} onClick={() => void loadLocations(pagination.page - 1)}>Previous</button><button disabled={busy || pagination.page >= pagination.totalPages} onClick={() => void loadLocations(pagination.page + 1)}>Next</button></div></section>
      <section className={styles.detailPanel}>
        {creating || editing ? locationFormPanel : !selected ? <div className={styles.emptyDetail}><h2>Select a service location</h2><p>Review its launch status, vendor capacity and individual services.</p></div> : <div className={styles.detailScroll}>
          <div className={styles.detailTitle}><div><span className={`${styles.badge} ${styles[selected.status]}`}>{label(selected.status)}</span><h2>{selected.city}, {selected.state}</h2><p>{selected.code} · Updated {dateTime(selected.updatedAt)}</p></div>{capabilities.canManage && selected.status !== "ACTIVE" && <button className={styles.secondary} onClick={beginEdit}>Edit location</button>}</div>
          <div className={styles.summaryCards}><article><span>Configured services</span><strong>{selected.services.length}</strong></article><article><span>Ready services</span><strong>{readiness?.readyServices ?? 0}</strong></article><article className={readiness?.blockers.length ? styles.warningCard : styles.goodCard}><span>Capacity blockers</span><strong>{readiness?.blockers.length ?? 0}</strong></article></div>
          <dl className={styles.locationMeta}><dt>Geography verification</dt><dd>{label(selected.locationSource)}{selected.verificationPostalCode ? ` · PIN ${selected.verificationPostalCode}` : ""}{selected.district ? ` · ${selected.district} District` : ""}</dd><dt>PIN coverage</dt><dd>{selected.serviceablePostalCodes.length ? selected.serviceablePostalCodes.join(", ") : "Not configured"}</dd><dt>Planned launch</dt><dd>{dateOnly(selected.plannedLaunchAt)}</dd><dt>Operations contact</dt><dd>{selected.operationsContactName || "Not assigned"}{selected.operationsContactMobile ? ` · +91 ${selected.operationsContactMobile}` : ""}</dd>{selected.suspensionReason && <><dt>Suspension reason</dt><dd>{selected.suspensionReason}</dd></>}</dl>
          {selected.locationSource === "MANUAL_REVIEW" && capabilities.canManage && <section className={styles.manualReview}><div><strong>Geography verification required</strong><span>This record existed before canonical location checks were introduced.</span></div><button className={styles.secondary} disabled={busy} onClick={() => void verifyExisting("CATALOG")}>Verify from catalogue</button><span className={styles.reverifyPin}><input aria-label="PIN for existing location verification" inputMode="numeric" maxLength={6} placeholder="Or enter PIN" value={reverifyPin} onChange={event => setReverifyPin(event.target.value.replace(/\D/g, "").slice(0, 6))} /><button disabled={busy || reverifyPin.length !== 6} onClick={() => void verifyExisting("POSTAL_LOOKUP")}>Verify PIN</button></span></section>}
          {readiness?.blockers.length ? <div className={styles.blockers}><strong>Launch blockers</strong>{readiness.blockers.map(item => <span key={item.id}>{label(item.serviceType)} ({label(item.scope)}): {item.verifiedVendors} of {item.minimumVerifiedVendors} verified vendors</span>)}</div> : null}
          <section className={styles.services}><div className={styles.sectionTitle}><div><h3>Service matrix</h3><p>Within-city is a geographic scope; each moving service is configured independently.</p></div></div>{selected.services.length ? <div className={styles.serviceTable}><table><thead><tr><th>Service</th><th>Scope</th><th>Fulfilment</th><th>Capacity</th><th>Status</th><th></th></tr></thead><tbody>{selected.services.map(service => { const capacity = readiness?.services.find(item => item.id === service.id); return <tr key={service.id}><td><strong>{label(service.serviceType)}</strong><small>{service.surveyRequired ? "Survey required" : "No mandatory survey"}{service.instantPricingAvailable ? " · Instant price" : ""}</small></td><td>{label(service.scope)}</td><td>{label(service.fulfilmentMode)}</td><td>{capacity ? `${capacity.verifiedVendors}/${capacity.minimumVerifiedVendors}` : "—"}</td><td><span className={`${styles.badge} ${styles[service.status]}`}>{label(service.status)}</span></td><td>{capabilities.canManage && selected.status !== "ACTIVE" && <button className={styles.textButton} onClick={() => editService(service)}>Edit</button>}</td></tr>; })}</tbody></table></div> : <p className={styles.emptyServices}>No services configured. Add the first service below.</p>}</section>
          {capabilities.canManage && selected.status !== "ACTIVE" && <form className={styles.serviceForm} onSubmit={saveService}><h3>Configure a service</h3><div className={styles.serviceGrid}><label>Scope<select value={serviceForm.scope} onChange={event => setServiceForm(value => ({ ...value, scope: event.target.value as Scope }))}>{scopes.map(item => <option key={item} value={item}>{label(item)}</option>)}</select></label><label>Service<select value={serviceForm.serviceType} onChange={event => setServiceForm(value => ({ ...value, serviceType: event.target.value as ServiceType }))}>{serviceTypes.map(item => <option key={item} value={item}>{label(item)}</option>)}</select></label><label>Fulfilment<select value={serviceForm.fulfilmentMode} onChange={event => { const mode = event.target.value as FulfilmentMode; setServiceForm(value => ({ ...value, fulfilmentMode: mode, instantPricingAvailable: mode === "INSTANT_RATE" && value.instantPricingAvailable })); }}>{fulfilmentModes.map(item => <option key={item} value={item}>{label(item)}</option>)}</select></label><label>Readiness<select value={serviceForm.status} onChange={event => setServiceForm(value => ({ ...value, status: event.target.value as "DRAFT" | "READY" }))}><option value="DRAFT">Draft</option><option value="READY">Ready</option></select></label><label>Minimum vendors<input type="number" min={1} max={100} value={serviceForm.minimumVerifiedVendors} onChange={event => setServiceForm(value => ({ ...value, minimumVerifiedVendors: Number(event.target.value) }))} /></label><label className={styles.check}><input type="checkbox" checked={serviceForm.surveyRequired} onChange={event => setServiceForm(value => ({ ...value, surveyRequired: event.target.checked }))} /><span>Survey required</span></label><label className={styles.check}><input type="checkbox" disabled={serviceForm.fulfilmentMode !== "INSTANT_RATE"} checked={serviceForm.instantPricingAvailable} onChange={event => setServiceForm(value => ({ ...value, instantPricingAvailable: event.target.checked }))} /><span>Instant pricing available</span></label></div><button className={styles.primary} disabled={busy}>{busy ? "Saving…" : "Save service"}</button></form>}
          {capabilities.canActivate && <div className={styles.launchActions}>{(selected.status === "DRAFT" || selected.status === "SUSPENDED") && <button className={styles.secondary} disabled={busy} onClick={() => void changeStatus("MARK_READY")}>Mark ready</button>}{selected.status === "READY" && <button className={styles.primary} disabled={busy} onClick={() => void changeStatus("ACTIVATE")}>Activate location</button>}{(selected.status === "READY" || selected.status === "ACTIVE") && <button className={styles.danger} disabled={busy} onClick={() => void changeStatus("SUSPEND")}>Suspend</button>}</div>}
        </div>}
      </section>
    </div>
  </main>;
}
