"use client";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { MoveStatus } from "@/components/landing/move-status";
import styles from "./moving.module.css";
export function ReferenceTracker({
  initialReference,
  supabaseUrl,
  publishableKey,
  phoneOtpEnabled,
}: {
  initialReference: string;
  supabaseUrl: string;
  publishableKey: string;
  phoneOtpEnabled: boolean;
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
  const [reference, setReference] = useState(initialReference),
    [tab, setTab] = useState("draft"),
    [verify, setVerify] = useState(false),
    [mobile, setMobile] = useState(""),
    [code, setCode] = useState(""),
    [sent, setSent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const lock = useRef(false);
  useEffect(() => {
    if (initialReference) return;
    try {
      setReference(localStorage.getItem("em_last_reference") || "");
    } catch {}
  }, [initialReference]);
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
    if (!client || !phoneOtpEnabled || lock.current) return;
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError("Enter your 10-digit registered mobile.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const { error } = await client.auth.signInWithOtp({
        phone: `+91${mobile}`,
      });
      if (error) throw error;
      setSent(true);
      setNotice("Enter the verification code sent to your mobile.");
    } catch {
      setError(
        "Could not send a code. Please try again later or contact the move coordinator.",
      );
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  async function confirm() {
    if (!client || lock.current) return;
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the six-digit verification code.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const { data, error } = await client.auth.verifyOtp({
        phone: `+91${mobile}`,
        token: code,
        type: "sms",
      });
      if (error || !data.session) throw Error("Check the code and try again.");
      const response = await fetch("/api/public/draft-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({ reference: reference.trim() }),
      });
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
              {verify && (
                <div className={styles.otp}>
                  {!phoneOtpEnabled || !client ? (
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
