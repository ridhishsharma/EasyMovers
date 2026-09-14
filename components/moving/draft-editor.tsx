"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SearchSuggestions } from "./search-suggestions";
import { inventoryMaster } from "@/lib/inventory-master";
import { DraftAssistance } from "./draft-assistance";
import styles from "./moving.module.css";
type Item = {
  itemName: string;
  quantity: number;
  category: string;
  fragile: boolean;
  requiresPacking: boolean;
};
const empty = {
  name: "",
  email: "",
  shiftingType: "Household",
  shiftingDate: "",
  houseType: "",
  officeSize: "",
  vehicleType: "",
  pickupAddress: "",
  destinationAddress: "",
  pickupFloor: "",
  destinationFloor: "",
  liftAvailable: "",
  destinationLift: "",
  parking: "",
  packingRequired: "",
  specialItems: "",
  additionalServices: "",
};
const requestStages:Record<string,string> = {NEW:"Awaiting review",CONTACTED:"Team contacted you",QUALIFIED:"Requirements reviewed",INVENTORY_PENDING:"Inventory needed",QUOTATION_REQUESTED:"Quotation requested",QUOTATION_RECEIVED:"Quotation ready",BOOKING_CREATED:"Booking created",CONVERTED:"Booking confirmed",LOST:"Enquiry closed",CLOSED:"Closed"};

export function DraftEditor({ reference }: { reference: string }) {
  const [itemQuery,setItemQuery]=useState("");
  const [fields, setFields] = useState(empty),
    [items, setItems] = useState<Item[]>([]),
    [step, setStep] = useState(0),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [locked, setLocked] = useState(false),
    [verification, setVerification] = useState(false),
    [version, setVersion] = useState("");
  const [route, setRoute] = useState({
    from: "",
    to: "",
    mobile: "",
    mode: "",
    status: "",
  });
  const dirty = useRef(false),
    lock = useRef(false);
  useEffect(() => {
    let active = true;
    fetch(
      `/api/public/moving-enquiry?reference=${encodeURIComponent(reference)}`,
      { cache: "no-store" },
    )
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) {
          if (active) setVerification(!!data.verificationRequired);
          throw Error(data.message || "Unable to open draft.");
        }
        if (!active) return;
        const lead = data.lead,
          meta = data.metadata || {};
        setFields({
          ...empty,
          ...Object.fromEntries(
            Object.keys(empty).map((key) => [
              key,
              lead[key] ?? meta[key] ?? "",
            ]),
          ),
          pickupAddress: meta.pickupAddress || meta.from?.address || "",
          destinationAddress: meta.destinationAddress || meta.to?.address || "",
        });
        setItems(data.inventory?.items || []);
        setLocked(data.inventory?.status !== "DRAFT");
        setVersion(data.inventory?.updatedAt || "");
        setRoute({
          from: meta.from?.address || lead.pickupCity,
          to: meta.to?.address || lead.destinationCity,
          mobile: lead.mobile,
          mode: meta.mode,
          status: lead.status || "NEW",
        });
      })
      .catch((reason) => {
        if (active) setError(reason.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reference]);
  useEffect(() => {
    const before = (event: BeforeUnloadEvent) => {
      if (dirty.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, []);
  function update(key: keyof typeof empty, value: string) {
    setFields((previous) => ({ ...previous, [key]: value }));
    dirty.current = true;
    setNotice("");
  }
  function updateItem(index: number, changes: Partial<Item>) {
    setItems((previous) =>
      previous.map((item, i) => (i === index ? { ...item, ...changes } : item)),
    );
    dirty.current = true;
    setNotice("");
  }
  async function save(submit = false) {
    if (lock.current || locked) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/public/moving-enquiry", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          reference,
          version,
          items: items.filter((item) => item.itemName.trim()),
          action: submit ? "SUBMIT" : "SAVE",
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setVerification(!!data.verificationRequired);
        throw Error(data.message || "Unable to save draft.");
      }
      dirty.current = false;
      setVersion(data.version);
      if (submit) {
        setLocked(true);
        setRoute(previous => ({...previous, status: "QUOTATION_REQUESTED"}));
        setNotice(
          "Your quotation request has been submitted. Keep your reference to check its progress.",
        );
      } else
        setNotice(
          "Draft saved. You can reopen it using your reference number.",
        );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to save draft.",
      );
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  const date = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Your move, at your pace</p>
          <h1>{locked ? "Your move request" : "Build your moving plan"}</h1>
          <p>
            Add the items you want to move. Save your draft whenever you need a
            break, and submit it when you’re ready for a quotation.
          </p>
        </div>
        <div className={styles.grid}>
          <section className={styles.card} aria-busy={loading || busy}>
            {loading ? (
              <p>Opening your saved move…</p>
            ) : verification ? (
              <>
                <h2>Verify your mobile to continue</h2>
                <p className={styles.muted}>
                  We’ll check that this reference belongs to you.
                </p>
                <Link
                  className={styles.primary}
                  href={`/track?reference=${encodeURIComponent(reference)}`}
                >
                  Open reference lookup
                </Link>
              </>
            ) : (
              <>
                <nav className={styles.progress} aria-label="Move details">
                  {["1. Moving items", "2. Move details", "3. Review"].map(
                    (label, index) => (
                      <button
                        type="button"
                        key={label}
                        className={step === index ? styles.active : ""}
                        onClick={() => setStep(index)}
                      >
                        {label}
                      </button>
                    ),
                  )}
                </nav>
                <fieldset
                  disabled={busy || locked || (!!error && !route.mobile)}
                  style={{ border: 0, padding: 0, margin: 0 }}
                >
                  {step === 0 && (
                    <>
                      <h2>What needs transporting?</h2>
                      <label className={styles.field}>
                        Service
                        <select
                          value={fields.shiftingType}
                          onChange={(e) =>
                            update("shiftingType", e.target.value)
                          }
                        >
                          <option value="Goods">Goods transport</option>
                          <option value="Household">Home shifting</option>
                          <option value="Office">Office moving</option>
                          <option value="Vehicle">Vehicle transport</option>
                        </select>
                      </label>
                      <p className={styles.muted}>
                        Add furniture, appliances, boxes or vehicles. Include
                        fragile and special items.
                      </p>
                      <div className={styles.item}><SearchSuggestions label="Search moving items, e.g. sofa" value={itemQuery} options={[...new Set([...Object.values(inventoryMaster).flat().map(item=>item.name), "Double Bed", "Moving Box", "Suitcase"])]} onChange={setItemQuery} onSelect={setItemQuery}/><button type="button" className={styles.secondary} disabled={locked||items.length>=100||!itemQuery.trim()} onClick={()=>{setItems(previous=>[...previous,{itemName:itemQuery.trim(),quantity:1,category:Object.entries(inventoryMaster).find(([,list])=>list.some(item=>item.name===itemQuery))?.[0]||"OTHER",fragile:false,requiresPacking:true}]);setItemQuery("");dirty.current=true}}>+ Add item</button></div><p className={styles.muted}>Choose a suggestion or enter a custom item, then add it to your list below.</p>
                      {items.map((item, index) => (
                        <div
                          key={index}
                          style={{
                            borderBottom: "1px solid #e6edf4",
                            paddingBottom: 12,
                          }}
                        >
                          <div className={styles.item}>
                            <label className={styles.field}>
                              Item
                              <input
                                aria-label={`Item ${index + 1}`}
                                placeholder="e.g. Sofa, boxes or two-wheeler"
                                maxLength={150}
                                value={item.itemName}
                                onChange={(e) =>
                                  updateItem(index, {
                                    itemName: e.target.value,
                                  })
                                }
                              />
                            </label>
                            <label className={styles.field}>
                              Qty
                              <input
                                aria-label={`Quantity ${index + 1}`}
                                type="number"
                                min={1}
                                max={999}
                                value={item.quantity}
                                onChange={(e) =>
                                  updateItem(index, {
                                    quantity: Number(e.target.value),
                                  })
                                }
                              />
                            </label>
                            <button
                              type="button"
                              aria-label={`Remove item ${index + 1}`}
                              onClick={() => {
                                setItems((previous) =>
                                  previous.filter((_, i) => i !== index),
                                );
                                dirty.current = true;
                              }}
                            >
                              ×
                            </button>
                          </div>
                          <div className={styles.row}>
                            <label className={styles.check}>
                              <input
                                type="checkbox"
                                checked={item.fragile}
                                onChange={(e) =>
                                  updateItem(index, {
                                    fragile: e.target.checked,
                                  })
                                }
                              />
                              Fragile / handle carefully
                            </label>
                            <label className={styles.check}>
                              <input
                                type="checkbox"
                                checked={item.requiresPacking}
                                onChange={(e) =>
                                  updateItem(index, {
                                    requiresPacking: e.target.checked,
                                  })
                                }
                              />
                              Packing required
                            </label>
                          </div>
                        </div>
                      ))}
                      <DraftAssistance reference={reference} version={version} locked={locked} local={route.mode==="LOCAL"} beforeRequest={async()=>{if(dirty.current){await save(false);return false}return true}} onVersion={next=>setVersion(next)}/>
                    </>
                  )}
                  {step === 1 && (
                    <div className={styles.fields}>
                      <h2>Details for moving day</h2>
                      <div className={styles.row}>
                        <label className={styles.field}>
                          Your name
                          <input
                            autoComplete="name"
                            maxLength={100}
                            value={fields.name}
                            onChange={(e) => update("name", e.target.value)}
                          />
                        </label>
                        <label className={styles.field}>
                          Email (optional)
                          <input
                            type="email"
                            autoComplete="email"
                            maxLength={254}
                            value={fields.email}
                            onChange={(e) => update("email", e.target.value)}
                          />
                        </label>
                      </div>
                      <label className={styles.field}>
                        Preferred moving date
                        <input
                          type="date"
                          min={date}
                          value={fields.shiftingDate}
                          onChange={(e) =>
                            update("shiftingDate", e.target.value)
                          }
                        />
                      </label>
                      {fields.shiftingType === "Household" && (
                        <label className={styles.field}>
                          Home size
                          <select
                            value={fields.houseType}
                            onChange={(e) =>
                              update("houseType", e.target.value)
                            }
                          >
                            <option value="">Choose size</option>
                            {[
                              "Few items",
                              "1 RK",
                              "1 BHK",
                              "2 BHK",
                              "3 BHK",
                              "4+ BHK / Villa",
                            ].map((value) => (
                              <option key={value}>{value}</option>
                            ))}
                          </select>
                        </label>
                      )}
                      {fields.shiftingType === "Office" && (
                        <label className={styles.field}>
                          Office size / workstations
                          <input
                            maxLength={100}
                            value={fields.officeSize}
                            onChange={(e) =>
                              update("officeSize", e.target.value)
                            }
                          />
                        </label>
                      )}
                      {fields.shiftingType === "Vehicle" && (
                        <label className={styles.field}>
                          Vehicle requirement
                          <input
                            maxLength={50}
                            placeholder="Car, two-wheeler, or both"
                            value={fields.vehicleType}
                            onChange={(e) =>
                              update("vehicleType", e.target.value)
                            }
                          />
                        </label>
                      )}
                      <div className={styles.row}>
                        {(["pickupAddress", "destinationAddress"] as const).map(
                          (key) => (
                            <label className={styles.field} key={key}>
                              {key === "pickupAddress"
                                ? "Full pickup address"
                                : "Full drop address"}
                              <textarea
                                maxLength={300}
                                value={fields[key]}
                                onChange={(e) => update(key, e.target.value)}
                              />
                            </label>
                          ),
                        )}
                      </div>
                      <div className={styles.row}>
                        {(["pickupFloor", "destinationFloor"] as const).map(
                          (key) => (
                            <label className={styles.field} key={key}>
                              {key === "pickupFloor"
                                ? "Pickup floor"
                                : "Drop floor"}
                              <input
                                maxLength={20}
                                placeholder="Ground / 2"
                                value={fields[key]}
                                onChange={(e) => update(key, e.target.value)}
                              />
                            </label>
                          ),
                        )}
                      </div>
                      <div className={styles.row}>
                        {(["liftAvailable", "destinationLift"] as const).map(
                          (key) => (
                            <label className={styles.field} key={key}>
                              {key === "liftAvailable"
                                ? "Lift at pickup"
                                : "Lift at drop"}
                              <select
                                value={fields[key]}
                                onChange={(e) => update(key, e.target.value)}
                              >
                                <option value="">Not sure</option>
                                <option>Yes</option>
                                <option>No</option>
                              </select>
                            </label>
                          ),
                        )}
                      </div>
                      <label className={styles.field}>
                        Parking / loading access
                        <input
                          maxLength={250}
                          value={fields.parking}
                          onChange={(e) => update("parking", e.target.value)}
                        />
                      </label>
                      <label className={styles.field}>
                        Packing help
                        <select
                          value={fields.packingRequired}
                          onChange={(e) =>
                            update("packingRequired", e.target.value)
                          }
                        >
                          <option value="">Discuss with the team</option>
                          <option>Yes</option>
                          <option>No</option>
                        </select>
                      </label>
                      <label className={styles.field}>
                        Special items / instructions
                        <textarea
                          maxLength={500}
                          value={fields.specialItems}
                          onChange={(e) =>
                            update("specialItems", e.target.value)
                          }
                        />
                      </label>
                      <label className={styles.field}>
                        Additional services
                        <textarea
                          maxLength={500}
                          placeholder="Unpacking, AC removal or installation, where available"
                          value={fields.additionalServices}
                          onChange={(e) =>
                            update("additionalServices", e.target.value)
                          }
                        />
                      </label>
                    </div>
                  )}
                  {step === 2 && (
                    <div className={styles.review}>
                      <h2>Review before requesting a quotation</h2>
                      <dl>
                        <dt>Service</dt>
                        <dd>
                          {fields.shiftingType}{" "}
                          {fields.houseType ||
                            fields.officeSize ||
                            fields.vehicleType}
                        </dd>
                        <dt>Contact</dt>
                        <dd>
                          {fields.name || "Name still needed"} · +91{" "}
                          {route.mobile}
                        </dd>
                        <dt>Date</dt>
                        <dd>{fields.shiftingDate || "Choose a date"}</dd>
                        <dt>From</dt>
                        <dd>{fields.pickupAddress || route.from}</dd>
                        <dt>To</dt>
                        <dd>{fields.destinationAddress || route.to}</dd>
                        <dt>Items</dt>
                        <dd>
                          {items
                            .filter((item) => item.itemName.trim())
                            .map(
                              (item) => `${item.itemName} × ${item.quantity}`,
                            )
                            .join(", ") || "Add your moving items"}
                        </dd>
                        <dt>Access</dt>
                        <dd>
                          Pickup floor {fields.pickupFloor || "not specified"},
                          lift {fields.liftAvailable || "not specified"}. Drop
                          floor {fields.destinationFloor || "not specified"},
                          lift {fields.destinationLift || "not specified"}.{" "}
                          {fields.parking}
                        </dd>
                        <dt>Packing</dt>
                        <dd>
                          {fields.packingRequired || "Discuss with the team"}
                        </dd>
                        <dt>Special items</dt>
                        <dd>{fields.specialItems || "None specified"}</dd>
                        <dt>Extra services</dt>
                        <dd>{fields.additionalServices || "None specified"}</dd>
                      </dl>
                      <p className={styles.muted}>
                        This requests a quotation. Your booking is confirmed
                        separately after you agree to the quotation and booking
                        requirements.
                      </p>
                    </div>
                  )}
                </fieldset>
                {!locked && (
                  <div className={styles.actions}>
                    <button
                      type="button"
                      disabled={busy}
                      className={styles.secondary}
                      onClick={() => save(false)}
                    >
                      {busy ? "Saving…" : "Save draft"}
                    </button>
                    {step < 2 ? (
                      <button
                        type="button"
                        className={styles.primary}
                        disabled={busy}
                        onClick={() => setStep(step + 1)}
                      >
                        Continue →
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.primary}
                        disabled={busy}
                        onClick={() => save(true)}
                      >
                        Request quotation →
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
            {notice && (
              <p className={styles.notice} role="status">
                {notice}
              </p>
            )}
          </section>
          <aside className={`${styles.card} ${styles.sidebar}`}>
            <span className={styles.status}>
              {locked ? "Submitted" : "Draft"}
            </span>
            <h3>Save for later</h3>
            <p className={styles.muted}>Your customer reference</p>
            <div className={styles.reference}>
              <strong>{reference}</strong>
              <button
                type="button"
                className={styles.smallLink}
                onClick={() =>
                  navigator.clipboard
                    .writeText(reference)
                    .then(() => setNotice("Reference copied."))
                    .catch(() =>
                      setNotice("Select and copy the reference above."),
                    )
                }
              >
                Copy reference
              </button>
            </div>
            <p className={styles.muted}>
              Use Track / Resume Move to reopen this draft. Another device will
              require verification of the mobile used for this enquiry.
            </p>
            <Link
              className={styles.smallLink}
              href={`/track?reference=${encodeURIComponent(reference)}`}
            >
              Track / resume move
            </Link>
            {locked && <p className={styles.muted}>Latest request stage: {requestStages[route.status] || "Submitted"}</p>}
          <h3>Your route</h3>
            <p className={styles.muted}>
              {route.from}
              <br />↓<br />
              {route.to}
            </p>
            <p className={styles.muted}>
              Save before closing the page. Route changes after saving require a
              new enquiry or assistance from the team.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
