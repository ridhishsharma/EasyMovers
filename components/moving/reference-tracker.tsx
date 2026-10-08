"use client";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { MoveStatus } from "@/components/landing/move-status";
import styles from "./moving.module.css";
export function ReferenceTracker({
  supabaseUrl,
  publishableKey,
  phoneOtpEnabled,
  testOtpEnabled,
}: {
  supabaseUrl: string;
  publishableKey: string;
  phoneOtpEnabled: boolean;
  testOtpEnabled: boolean;
}) {
  const router = useRouter();
  const client = useMemo(
    () =>
      supabaseUrl && publishableKey
        ? createClient(supabaseUrl, publishableKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
        : null,
    [supabaseUrl, publishableKey],
  );
  const [reference, setReference] = useState(""),
    [tab, setTab] = useState("draft"),
    [verify, setVerify] = useState(false),
    [mobile, setMobile] = useState(""),
    [code, setCode] = useState(""),
    [sent, setSent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [recovering, setRecovering] = useState(false),
    [recoverySent, setRecoverySent] = useState(false),
    [recoveryCode, setRecoveryCode] = useState(""),
    [recovered, setRecovered] = useState<Array<{reference:string;route:string;status:string;createdAt:string;bookingNumber:string|null;token:string}>>([]);
  const lock = useRef(false);
  async function lookup(event: FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/public/moving-enquiry?reference=${encodeURIComponent(reference.trim())}`,
        { cache: "no-store" },
      );
      const data = await response.json();
      if (response.status === 401) {
        setVerify(true);
        setNotice("Verify the mobile used for this move to reopen it.");
        return;
      }
      if (!response.ok || !data.success)
        throw Error(data.message || "Unable to find draft.");
      router.push(`/draft/${encodeURIComponent(reference.trim())}`);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to open draft.",
      );
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  async function sendCode() {
    if (lock.current) return;
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError("Enter your 10-digit registered mobile.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      if (phoneOtpEnabled && client) {
        const { error } = await client.auth.signInWithOtp({
          phone: `+91${mobile}`,
        });
        if (error) throw error;
      } else if (testOtpEnabled) {
        const response = await fetch("/api/public/customer-test-otp", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "REQUEST",
            reference: reference.trim(),
            mobile,
          }),
        });
        const result = await response.json();
        if (!response.ok || !result.success)
          throw Error(result.message || "Staging verification is unavailable.");
      } else {
        throw Error("Mobile verification is not enabled.");
      }
      setSent(true);
      setNotice(
        phoneOtpEnabled && client
          ? "Enter the verification code sent to your mobile."
          : "Staging test: enter the configured verification code.",
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not start mobile verification.",
      );
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  async function confirm() {
    if (lock.current) return;
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the six-digit verification code.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      let response: Response;
      if (phoneOtpEnabled && client) {
        const { data, error } = await client.auth.verifyOtp({
          phone: `+91${mobile}`,
          token: code,
          type: "sms",
        });
        if (error || !data.session) throw Error("Check the code and try again.");
        response = await fetch("/api/public/draft-resume", {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({ reference: reference.trim() }),
        });
      } else if (testOtpEnabled) {
        response = await fetch("/api/public/customer-test-otp", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "VERIFY",
            reference: reference.trim(),
            mobile,
            code,
          }),
        });
      } else {
        throw Error("Mobile verification is not enabled.");
      }
      const result = await response.json();
      if (!response.ok || !result.success)
        throw Error(result.message || "Unable to reopen draft.");
      router.push(`/draft/${encodeURIComponent(result.reference)}`);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to verify mobile.",
      );
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  async function requestRecoveryCode() {
    if (lock.current) return;
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError("Enter your 10-digit registered mobile.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (phoneOtpEnabled && client) {
        const { error } = await client.auth.signInWithOtp({ phone: `+91${mobile}` });
        if (error) throw error;
      } else if (testOtpEnabled) {
        const response = await fetch("/api/public/customer-move-recovery", {
          method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "REQUEST", mobile }),
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw Error(result.message || "Unable to start recovery.");
      } else throw Error("Mobile verification is not enabled.");
      setRecoverySent(true);
      setNotice(phoneOtpEnabled && client ? "Enter the verification code sent to your mobile." : "Staging test: enter the configured verification code.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to start recovery.");
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  async function recoverMoves() {
    if (lock.current) return;
    if (!/^\d{6}$/.test(recoveryCode)) {
      setError("Enter the six-digit verification code.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      let authorization: Record<string, string> = {};
      if (phoneOtpEnabled && client) {
        const { data, error } = await client.auth.verifyOtp({ phone: `+91${mobile}`, token: recoveryCode, type: "sms" });
        if (error || !data.session) throw Error("Check the code and try again.");
        authorization = { Authorization: `Bearer ${data.session.access_token}` };
      }
      const response = await fetch("/api/public/customer-move-recovery", {
        method: "POST", cache: "no-store", headers: { "Content-Type": "application/json", ...authorization },
        body: JSON.stringify({ action: "VERIFY", mobile, ...(testOtpEnabled && !phoneOtpEnabled ? { code: recoveryCode } : {}) }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw Error(result.message || "Unable to find your moves.");
      setRecovered(result.data || []);
      setNotice(result.data?.length ? "Select the move you want to reopen." : "No moves were found for this verified mobile.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to recover your moves.");
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  async function openRecovered(move: { reference: string; token: string }) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/public/customer-move-recovery", {
        method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "OPEN", reference: move.reference, token: move.token }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw Error(result.message || "Unable to open this move.");
      router.push(result.destination);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to open this move.");
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  return (
    <main className={styles.page}>
      <div className={styles.container} style={{ maxWidth: 960 }}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Pick up where you left off</p>
          <h1>Track or resume your move</h1>
          <p>
            Use your customer reference to continue a saved draft or view its
            submission status. Confirmed bookings have a separate booking
            number.
          </p>
        </div>
        <div className={styles.tabs} style={{ maxWidth: 550 }}>
          <button
            className={tab === "draft" ? styles.active : ""}
            type="button"
            onClick={() => setTab("draft")}
          >
            Reference / saved draft
          </button>
          <button
            className={tab === "booking" ? styles.active : ""}
            type="button"
            onClick={() => setTab("booking")}
          >
            Confirmed booking
          </button>
        </div>
        {tab === "booking" ? (
          <MoveStatus
            supabaseUrl={supabaseUrl}
            publishableKey={publishableKey}
          />
        ) : (
          <div className={styles.trackGrid}>
            <section className={styles.card}>
              <h2>Find your move</h2>
              <form onSubmit={lookup}>
                <label className={styles.field}>
                  Reference number
                  <input
                    required
                    maxLength={85}
                    autoComplete="off"
                    placeholder="EM-AB12-CD34-EF56-7890"
                    value={reference}
                    onChange={(e) => {
                      setReference(e.target.value);
                      setVerify(false);
                      setSent(false);
                      setError("");
                      setNotice("");
                    }}
                  />
                </label>
                <button
                  className={`${styles.primary} ${styles.full}`}
                  disabled={busy}
                  style={{ marginTop: 20 }}
                >
                  {busy ? "Checking…" : "Open my move →"}
                </button>
              </form>
              <button type="button" className={styles.smallLink} onClick={() => { setRecovering(value => !value); setVerify(false); setError(""); setNotice(""); setRecovered([]); }}>
                {recovering ? "Use my EM reference instead" : "I forgot my EM reference"}
              </button>
              {recovering && (
                <div className={styles.otp}>
                  <p className={styles.muted}>Verify your registered mobile to find your EasyMovers requests. A booking number alone cannot unlock customer details.</p>
                  <label className={styles.field}>Registered mobile<input type="tel" inputMode="numeric" maxLength={10} disabled={recoverySent || busy} value={mobile} onChange={event => setMobile(event.target.value.replace(/\D/g, ""))} placeholder="10-digit mobile" /></label>
                  {!recoverySent ? <button type="button" className={styles.secondary} disabled={busy} onClick={requestRecoveryCode}>Send verification code</button> : <><label className={styles.field}>Verification code<input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={recoveryCode} onChange={event => setRecoveryCode(event.target.value.replace(/\D/g, ""))} /></label><button type="button" className={styles.primary} disabled={busy} onClick={recoverMoves}>Verify & find my moves</button></>}
                  {recovered.length > 0 && <div className={styles.recoveredMoves}>{recovered.map(move => <button type="button" key={move.reference} disabled={busy} onClick={() => void openRecovered(move)}><strong>{move.route}</strong><span>{move.reference}{move.bookingNumber ? ` · ${move.bookingNumber}` : ""}</span><small>{move.status.replaceAll("_", " ")} · Started {new Date(move.createdAt).toLocaleDateString("en-IN")}</small></button>)}</div>}
                </div>
              )}
              {verify && (
                <div className={styles.otp}>
                  {!((phoneOtpEnabled && client) || testOtpEnabled) ? (
                    <p className={styles.muted}>
                      Mobile verification is not enabled yet. Reopen this draft
                      on the device where you saved it, or contact your move
                      coordinator.
                    </p>
                  ) : (
                    <>
                      <label className={styles.field}>
                        Registered mobile
                        <input
                          type="tel"
                          inputMode="numeric"
                          placeholder="10-digit mobile"
                          maxLength={10}
                          disabled={sent || busy}
                          value={mobile}
                          onChange={(e) =>
                            setMobile(e.target.value.replace(/\D/g, ""))
                          }
                        />
                      </label>
                      {!sent ? (
                        <button
                          type="button"
                          className={styles.secondary}
                          disabled={busy}
                          onClick={sendCode}
                        >
                          Send verification code
                        </button>
                      ) : (
                        <>
                          <label className={styles.field}>
                            Verification code
                            <input
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              maxLength={6}
                              value={code}
                              onChange={(e) =>
                                setCode(e.target.value.replace(/\D/g, ""))
                              }
                            />
                          </label>
                          <button
                            type="button"
                            className={styles.primary}
                            disabled={busy}
                            onClick={confirm}
                          >
                            Verify & open draft
                          </button>
                          <button
                            type="button"
                            className={styles.smallLink}
                            disabled={busy}
                            onClick={() => {
                              setSent(false);
                              setCode("");
                            }}
                          >
                            Change mobile / request another code
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
              {notice && (
                <p className={styles.notice} role="status">
                  {notice}
                </p>
              )}
              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
            </section>
            <aside className={styles.leadPanel}>
              <h2>One reference. Your moving plan.</h2>
              <ul>
                <li>Reopen your saved inventory.</li>
                <li>Update details while the move is in draft.</li>
                <li>Submit when you are ready for a quotation.</li>
                <li>Check whether your request has been submitted.</li>
              </ul>
              <p>
                Save your changes before closing the draft. On another device,
                we verify your registered mobile to protect your details.
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
