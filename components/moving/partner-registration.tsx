"use client";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";
import { indianCities } from "@/lib/indian-cities";
import styles from "./moving.module.css";
const defaults = {
  companyName: "",
  gstNumber: "",
  panNumber: "",
  businessType: "SOLE_PROPRIETOR",
  category: "LOCAL",
  ownerName: "",
  ownerMobile: "",
  ownerEmail: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};
export function PartnerRegistration({
  supabaseUrl,
  publishableKey,
}: {
  supabaseUrl: string;
  publishableKey: string;
}) {
  const client = useMemo(
    () =>
      supabaseUrl && publishableKey
        ? createClient(supabaseUrl, publishableKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
        : null,
    [supabaseUrl, publishableKey],
  );
  const [fields, setFields] = useState(defaults),
    [step, setStep] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [token, setToken] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [success, setSuccess] = useState("");
  const lock = useRef(false);
  function change(key: keyof typeof defaults, value: string) {
    setFields((previous) => ({ ...previous, [key]: value }));
    setError("");
  }
  async function signIn(event: FormEvent) {
    event.preventDefault();
    if (!client || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });
      if (error || !data.session)
        throw Error("Sign-in failed. Check your confirmed onboarding account.");
      setToken(data.session.access_token);
      setPassword("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign-in failed.");
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    if (!token) {
      setError("Sign in with your onboarding account before submitting.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      // Server assigns vendor code, audit identity and inactive state; no role headers are supplied.
      const response = await fetch("/api/vendors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vendor: {
            business: {
              companyName: fields.companyName,
              category: fields.category,
              businessType: fields.businessType,
              ...(fields.gstNumber ? { gstNumber: fields.gstNumber } : {}),
              ...(fields.panNumber ? { panNumber: fields.panNumber } : {}),
            },
            owner: {
              fullName: fields.ownerName,
              phone: `+91${fields.ownerMobile}`,
              email: fields.ownerEmail,
            },
            contact: {
              primaryPhone: `+91${fields.ownerMobile}`,
              email: fields.ownerEmail,
            },
            registeredAddress: {
              addressLine1: fields.address,
              city: fields.city,
              state: fields.state,
              postalCode: fields.pincode,
              country: "India",
            },
            acceptedTerms: true,
            submittedBy: "VENDOR_PORTAL",
          },
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
      const vendor = data.data?.vendor;
      setSuccess(vendor?.vendorCode || "Submitted");
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
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Grow with EasyMovers</p>
          <h1>Become a moving partner</h1>
          <p>
            Start with your business and contact details. Our onboarding process
            checks your service coverage, vehicles and documents before
            activation.
          </p>
        </div>
        <div className={styles.partnerLayout}>
          <aside className={styles.leadPanel}>
            <h2>Your expertise. More possibilities.</h2>
            <ul>
              <li>Build your business profile.</li>
              <li>Define where you can serve.</li>
              <li>Add your fleet and supporting documents.</li>
              <li>Complete review before activation.</li>
            </ul>
            <p>
              Registration starts an onboarding profile. It does not
              automatically activate your business or guarantee leads.
            </p>
          </aside>
          <section className={styles.card} aria-busy={busy}>
            {success ? (
              <>
                <span className={styles.status}>Profile created</span>
                <h2 style={{ marginTop: 16 }}>Your onboarding has started</h2>
                <p>
                  Vendor reference: <strong>{success}</strong>
                </p>
                <p className={styles.muted}>
                  Your profile remains inactive until the required information
                  and checks are complete.
                </p>
              </>
            ) : (
              <>
                <div className={styles.steps}>
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
                            <option value="INDIVIDUAL_OWNER_DRIVER">
                              Individual owner-driver
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
                        <div className={styles.row}>
                          <label className={styles.field}>
                            GST number (optional)
                            <input
                              maxLength={15}
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
                            value={fields.ownerName}
                            onChange={(e) =>
                              change("ownerName", e.target.value)
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
                            maxLength={300}
                            value={fields.address}
                            onChange={(e) => change("address", e.target.value)}
                          />
                        </label>
                        <div className={styles.row}>
                          <label className={styles.field}>
                            City
                            <input
                              required
                              maxLength={100}
                              value={fields.city}
                              onChange={(e) => change("city", e.target.value)}
                            />
                          </label>
                          <label className={styles.field}>
                            State / union territory
                            <input
                              required
                              list="partner-states"
                              maxLength={100}
                              value={fields.state}
                              onChange={(e) => change("state", e.target.value)}
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
                          <input type="checkbox" required />
                          <span>I confirm these business details are accurate, accept onboarding review and verification, and agree to the <a href="/legal/vendor-terms" target="_blank" rel="noopener noreferrer" className={styles.smallLink}>Vendor Terms &amp; Conditions</a>.</span>
                        </label>
                        <label className={styles.check} style={{marginTop:12}}>
                          <input type="checkbox" required />
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
                      disabled={busy || (step === 2 && !token)}
                    >
                      {busy
                        ? "Submitting…"
                        : step < 2
                          ? "Continue →"
                          : "Submit onboarding profile"}
                    </button>
                  </div>
                </form>
                {step === 2 && !token && (
                  <>
                    <h2>Sign in to submit your profile</h2>
                    <p className={styles.muted}>
                      Use your confirmed EasyMovers onboarding account. New
                      partners need an account provisioned by the onboarding
                      team before submission.
                    </p>
                    {!client ? (
                      <p className={styles.notice}>
                        Onboarding sign-in is not configured yet.
                      </p>
                    ) : (
                      <form onSubmit={signIn} className={styles.fields}>
                        <label className={styles.field}>
                          Account email
                          <input
                            type="email"
                            autoComplete="username"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </label>
                        <label className={styles.field}>
                          Password
                          <input
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </label>
                        <button className={styles.primary} disabled={busy}>
                          {busy ? "Signing in…" : "Sign in & continue"}
                        </button>
                      </form>
                    )}
                  </>
                )}
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
