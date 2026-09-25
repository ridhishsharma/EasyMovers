"use client";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { indianCities } from "@/lib/indian-cities";
import styles from "./moving.module.css";
const defaults = {
  companyName: "",
  gstNumber: "",
  panNumber: "",
  businessType: "SOLE_PROPRIETOR",
  engagementMode: "QUOTATION",
  category: "LOCAL",
  ownerName: "",
  ownerMobile: "",
  ownerEmail: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};

const PLACE_NAME_PATTERN = "[A-Za-z][A-Za-z .'-]{1,99}";

function placeNameInput(value: string) {
  return value.replace(/[0-9]/g, "").slice(0, 100);
}

function personNameInput(value: string) {
  return Array.from(value)
    .filter((character) => /[\p{L}\p{M} .'-]/u.test(character))
    .join("")
    .slice(0, 100);
}

function addressInput(value: string) {
  return value.replace(/[^\p{L}\p{M}\p{N}\s,.'#&/()\-:]/gu, "").slice(0, 300);
}

const comparable = (value: string) =>
  value.normalize("NFKC").toLocaleLowerCase("en-IN").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export function PartnerRegistration() {
  const [fields, setFields] = useState(defaults),
    [step, setStep] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [termsAccepted, setTermsAccepted] = useState(false),
    [sopAccepted, setSopAccepted] = useState(false),
    [callbackOpen, setCallbackOpen] = useState(false),
    [callbackName, setCallbackName] = useState(""),
    [callbackMobile, setCallbackMobile] = useState(""),
    [callbackTime, setCallbackTime] = useState(""),
    [callbackMessage, setCallbackMessage] = useState("");
  const lock = useRef(false);
  const requestId = useRef("");
  function change(key: keyof typeof defaults, value: string) {
    setFields((previous) => ({ ...previous, [key]: value }));
    setError("");
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    if (step === 0) {
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!/^[\p{L}][\p{L}\p{M} .'-]{1,99}$/u.test(fields.ownerName.trim())) {
        setError("Enter the owner's name using letters only.");
        return;
      }
      lock.current = true;
      setBusy(true);
      setError("");
      try {
        const response = await fetch(`/api/public/postal-lookup?pin=${fields.pincode}`);
        const data = await response.json();
        const location = data.locations?.[0];
        if (!response.ok || !data.success || !location?.state || !(location.district || location.locality)) {
          throw Error(data.message || "Enter a valid Indian PIN code.");
        }
        const city = String(location.district || location.locality);
        const state = String(location.state);
        if (comparable(fields.city) !== comparable(city) || comparable(fields.state) !== comparable(state)) {
          setFields((previous) => ({ ...previous, city, state }));
          setError(`City and state were corrected from PIN ${fields.pincode}. Please review them and click Continue again.`);
          return;
        }
        setStep(2);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Unable to verify this PIN code.");
      } finally {
        setBusy(false);
        lock.current = false;
      }
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      requestId.current ||= crypto.randomUUID();
      const response = await fetch("/api/public/vendor-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-id": requestId.current,
        },
        body: JSON.stringify({
          requestId: requestId.current,
          companyName: fields.companyName,
          businessType: fields.businessType,
          engagementMode: fields.engagementMode,
          operatingCategory: fields.category,
          gstNumber: fields.gstNumber || undefined,
          panNumber: fields.panNumber || undefined,
          contactName: fields.ownerName,
          mobile: fields.ownerMobile,
          email: fields.ownerEmail,
          addressLine1: fields.address,
          city: fields.city,
          state: fields.state,
          postalCode: fields.pincode,
          consent: termsAccepted,
          sopConsent: sopAccepted,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        const validation = data.error?.details?.validationErrors;
        throw Error(
          validation
            ?.map((entry: { message: string }) => entry.message)
            .join(" ") ||
            data.error?.message ||
            data.message ||
            "Unable to submit registration.",
        );
      }
      setSuccess(data.data?.reference || "Submitted");
      setCallbackName(fields.ownerName);
      setCallbackMobile(fields.ownerMobile);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to submit registration.",
      );
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  async function requestCallback(event: FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    if (!/^[\p{L}][\p{L}\p{M} .'-]{1,99}$/u.test(callbackName.trim()) || !/^[6-9][0-9]{9}$/.test(callbackMobile) || !callbackTime) {
      setCallbackMessage("Enter a contact name, valid mobile number and preferred callback time.");
      return;
    }
    lock.current = true; setBusy(true); setCallbackMessage("");
    try {
      const response = await fetch("/api/public/vendor-applications/callback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ applicationReference: success || undefined, fullName: callbackName, mobile: callbackMobile, email: fields.ownerEmail || undefined, city: fields.city || undefined, preferredTime: `${callbackTime}+05:30`, consent: true }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw Error(data.error?.message || "Unable to request callback.");
      setCallbackMessage("Callback requested. Our partner team will contact you at the selected time.");
    } catch (reason) { setCallbackMessage(reason instanceof Error ? reason.message : "Unable to request callback."); }
    finally { setBusy(false); lock.current = false; }
  }
  return (
    <main className={`${styles.page} ${styles.companyPage}`}>
      <div className={`${styles.container} ${styles.companyContainer}`}>
        <nav className={styles.companyBreadcrumb} aria-label="Breadcrumb">
          <Link href="/">Home</Link><span aria-hidden="true">›</span>
          <Link href="/partner">Partner options</Link><span aria-hidden="true">›</span>
          <span>Company registration</span>
        </nav>
        <div className={`${styles.intro} ${styles.companyIntro}`}>
          <p className={styles.eyebrow}>Grow with EasyMovers</p>
          <h1>Become a moving partner</h1>
          <p>
            Register your company in three steps. Service coverage, vehicles and
            documents are verified before activation.
          </p>
        </div>
        <div className={styles.companyHelpBar}>
          <span>Need help with company registration?</span>
          <button type="button" className={styles.secondary} onClick={() => setCallbackOpen(value => !value)}>Request callback</button>
          <a href="tel:+918959591603" className={styles.secondary}>Call +91 89595 91603</a>
        </div>
        {callbackOpen && <form className={styles.callbackPanel} onSubmit={requestCallback}>
          <p className={styles.callbackIntro}>Our partner team will call you. No onboarding account is required.</p>
          <label className={styles.field}>Contact name<input required minLength={2} maxLength={100} title="Enter a name using letters only." value={callbackName} onChange={event => setCallbackName(personNameInput(event.target.value))} /></label>
          <label className={styles.field}>Mobile number<input required type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} value={callbackMobile} onChange={event => setCallbackMobile(event.target.value.replace(/\D/g, ""))} /></label>
          <label className={styles.field}>Preferred callback time (India)<input required type="datetime-local" value={callbackTime} onChange={event => setCallbackTime(event.target.value)} /></label>
          <button className={styles.primary} disabled={busy}>{busy ? "Requesting…" : "Confirm callback"}</button>
          {callbackMessage && <p role="status" className={styles.muted}>{callbackMessage}</p>}
        </form>}
        <div className={styles.companyLayout}>
          <section className={`${styles.card} ${styles.companyCard}`} aria-busy={busy}>
            {success ? (
              <>
                <span className={styles.status}>Profile created</span>
                <h2 style={{ marginTop: 16 }}>Your onboarding has started</h2>
                <p>
                  Application reference: <strong>{success}</strong>
                </p>
                <p className={styles.muted}>
                  Your profile remains inactive until the required information
                  and checks are complete.
                </p>
                <div className={styles.actions}><button type="button" className={styles.secondary} onClick={() => setCallbackOpen(true)}>Request onboarding callback</button><a href="tel:+918959591603" className={styles.secondary}>Call +91 89595 91603</a></div>
              </>
            ) : (
              <>
                <div className={styles.companySteps} aria-label={`Step ${step + 1} of 3`}>
                  {["Business", "Contact & address", "Review"].map(
                    (label, index) => (
                      <span
                        className={step === index ? styles.current : ""}
                        key={label}
                      >
                        {index + 1}. {label}
                      </span>
                    ),
                  )}
                </div>
                <form onSubmit={submit}>
                  <fieldset
                    disabled={busy}
                    style={{ border: 0, padding: 0, margin: 0 }}
                  >
                    {step === 0 && (
                      <div className={styles.fields}>
                        <h2>Your business</h2>
                        <label className={styles.field}>
                          Company / business name
                          <input
                            required
                            minLength={2}
                            maxLength={150}
                            value={fields.companyName}
                            onChange={(e) =>
                              change("companyName", e.target.value)
                            }
                          />
                        </label>
                        <label className={styles.field}>
                          Business type
                          <select
                            value={fields.businessType}
                            onChange={(e) =>
                              change("businessType", e.target.value)
                            }
                          >
                            <option value="SOLE_PROPRIETOR">
                              Sole proprietor
                            </option>
                            <option value="REGISTERED_BUSINESS">
                              Registered business
                            </option>
                          </select>
                        </label>
                        <label className={styles.field}>
                          Operating category
                          <select
                            value={fields.category}
                            onChange={(e) => change("category", e.target.value)}
                          >
                            <option value="LOCAL">Local</option>
                            <option value="REGIONAL">Regional</option>
                            <option value="NATIONAL">National</option>
                          </select>
                        </label>
                        <label className={styles.field}>
                          How will you accept work?
                          <select
                            value={fields.engagementMode}
                            onChange={(e) => change("engagementMode", e.target.value)}
                          >
                            <option value="QUOTATION">Quotation after survey or move assessment</option>
                            <option value="INSTANT_RATE">Instant-rate jobs using registered vehicles</option>
                            <option value="HYBRID">Both quotation and instant-rate jobs</option>
                          </select>
                          <small>Instant-rate work requires verified vehicles before availability is published.</small>
                        </label>
                        <div className={styles.row}>
                          <label className={styles.field}>
                            GST number (optional)
                            <input
                              maxLength={15}
                              pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]"
                              value={fields.gstNumber}
                              onChange={(e) =>
                                change(
                                  "gstNumber",
                                  e.target.value.toUpperCase(),
                                )
                              }
                            />
                          </label>
                          <label className={styles.field}>
                            PAN (optional)
                            <input
                              maxLength={10}
                              pattern="[A-Z]{5}[0-9]{4}[A-Z]"
                              value={fields.panNumber}
                              onChange={(e) =>
                                change(
                                  "panNumber",
                                  e.target.value.toUpperCase(),
                                )
                              }
                            />
                          </label>
                        </div>
                      </div>
                    )}
                    {step === 1 && (
                      <div className={styles.fields}>
                        <h2>Contact & registered address</h2>
                        <label className={styles.field}>
                          Owner / authorised representative
                          <input
                            required
                            minLength={2}
                            maxLength={100}
                            title="Enter the representative's name using letters only."
                            value={fields.ownerName}
                            onChange={(e) =>
                              change("ownerName", personNameInput(e.target.value))
                            }
                          />
                        </label>
                        <div className={styles.row}>
                          <label className={styles.field}>
                            Mobile number
                            <input
                              type="tel"
                              inputMode="numeric"
                              required
                              pattern="[6-9][0-9]{9}"
                              maxLength={10}
                              value={fields.ownerMobile}
                              onChange={(e) =>
                                change(
                                  "ownerMobile",
                                  e.target.value.replace(/\D/g, ""),
                                )
                              }
                            />
                          </label>
                          <label className={styles.field}>
                            Contact email
                            <input
                              type="email"
                              required
                              maxLength={254}
                              value={fields.ownerEmail}
                              onChange={(e) =>
                                change("ownerEmail", e.target.value)
                              }
                            />
                          </label>
                        </div>
                        <label className={styles.field}>
                          Registered address
                          <textarea
                            required
                            minLength={5}
                            maxLength={300}
                            value={fields.address}
                            onChange={(e) => change("address", addressInput(e.target.value))}
                          />
                        </label>
                        <div className={styles.row}>
                          <label className={styles.field}>
                            City
                            <input
                              required
                              minLength={2}
                              maxLength={100}
                              pattern={PLACE_NAME_PATTERN}
                              title="Enter a valid city name using letters only."
                              autoComplete="address-level2"
                              value={fields.city}
                              onChange={(e) =>
                                change("city", placeNameInput(e.target.value))
                              }
                            />
                          </label>
                          <label className={styles.field}>
                            State / union territory
                            <input
                              required
                              list="partner-states"
                              minLength={2}
                              maxLength={100}
                              pattern={PLACE_NAME_PATTERN}
                              title="Enter a valid state or union territory using letters only."
                              autoComplete="address-level1"
                              value={fields.state}
                              onChange={(e) =>
                                change("state", placeNameInput(e.target.value))
                              }
                            />
                            <datalist id="partner-states">
                              {[
                                ...new Set(
                                  indianCities.map((city) => city.state),
                                ),
                              ].map((state) => (
                                <option key={state}>{state}</option>
                              ))}
                            </datalist>
                          </label>
                        </div>
                        <label className={styles.field}>
                          PIN code
                          <input
                            required
                            inputMode="numeric"
                            pattern="[1-9][0-9]{5}"
                            maxLength={6}
                            value={fields.pincode}
                            onChange={(e) =>
                              change(
                                "pincode",
                                e.target.value.replace(/\D/g, ""),
                              )
                            }
                          />
                        </label>
                      </div>
                    )}
                    {step === 2 && (
                      <div className={styles.review}>
                        <h2>Review your profile</h2>
                        <dl>
                          <dt>Business</dt>
                          <dd>{fields.companyName}</dd>
                          <dt>Category</dt>
                          <dd>{fields.category}</dd>
                          <dt>Owner</dt>
                          <dd>{fields.ownerName}</dd>
                          <dt>Contact</dt>
                          <dd>
                            +91 {fields.ownerMobile}
                            <br />
                            {fields.ownerEmail}
                          </dd>
                          <dt>Address</dt>
                          <dd>
                            {fields.address}, {fields.city}, {fields.state}{" "}
                            {fields.pincode}
                          </dd>
                          <dt>GST / PAN</dt>
                          <dd>
                            {fields.gstNumber || "Not provided"} /{" "}
                            {fields.panNumber || "Not provided"}
                          </dd>
                        </dl>
                        <label className={styles.check}>
                          <input type="checkbox" required checked={termsAccepted} onChange={event => setTermsAccepted(event.target.checked)} />
                          <span>I confirm these business details are accurate, accept onboarding review and verification, and agree to the <a href="/legal/vendor-terms" target="_blank" rel="noopener noreferrer" className={styles.smallLink}>Vendor Terms &amp; Conditions</a>.</span>
                        </label>
                        <label className={styles.check} style={{marginTop:12}}>
                          <input type="checkbox" required checked={sopAccepted} onChange={event => setSopAccepted(event.target.checked)} />
                          <span>I agree to follow EasyMovers SOPs and service quality standards.</span>
                        </label>
                      </div>
                    )}
                  </fieldset>
                  <div className={styles.actions}>
                    {step > 0 && (
                      <button
                        type="button"
                        disabled={busy}
                        className={styles.secondary}
                        onClick={() => setStep(step - 1)}
                      >
                        ← Back
                      </button>
                    )}
                    <button
                      className={styles.primary}
                      disabled={busy}
                    >
                      {busy
                        ? "Submitting…"
                        : step < 2
                          ? "Continue →"
                          : "Submit onboarding profile"}
                    </button>
                  </div>
                </form>
              </>
            )}
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
