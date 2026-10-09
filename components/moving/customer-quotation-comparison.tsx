"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CustomerSessionExit } from "./customer-session-exit";
import styles from "./customer-quotation-comparison.module.css";

type RazorpayResult = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type RazorpayCheckout = { open: () => void; on: (event: string, callback: (error: unknown) => void) => void };
type RazorpayConstructor = new (options: {
  key: string; amount: number; currency: string; order_id: string; name: string; description: string;
  handler: (response: RazorpayResult) => void; modal: { ondismiss: () => void };
  theme: { color: string };
}) => RazorpayCheckout;
declare global { interface Window { Razorpay?: RazorpayConstructor } }

async function loadRazorpayCheckout(): Promise<RazorpayConstructor> {
  if (window.Razorpay) return window.Razorpay;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay checkout could not load. Please retry."));
    document.head.appendChild(script);
  });
  if (!window.Razorpay) throw new Error("Razorpay checkout is unavailable.");
  return window.Razorpay;
}

type Quote = { id:string; label:string; quotationNumber:string; currency:string; recommended:boolean; costs:Record<string,number>; schedule:{pickupDate:string|null;deliveryDate:string|null;transitDays:number|null;validUntil:string|null}; inclusions:unknown; exclusions:unknown; remarks:string|null; performance:{status:string;averageRating:number|null;totalReviews:number;completedBookings:number;onTimeDelivery:number|null;recommendationRate:number|null}; compliance:{activePartner:boolean;identityVerified:boolean;insuranceVerified:boolean}; scoring:{price:number;quality:number;reliability:number;compliance:number;completeness:number;total:number|null;excludedReason:string|null} };
type AdvanceStatus = { stage: string; advanceVerified: boolean; bookingConfirmed: boolean;
  bookingNumber: string; bookingStatus: string; paidAmount?: number; advanceAmount?: number;
  totalAmount?: number; currency?: string; paymentStatus?: string };

async function customerPaymentRequest(path: string, reference: string, payload?: object) {
  const response = await fetch(path, payload ? {
    method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reference, ...payload }),
  } : { cache: "no-store" });
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("success" in result) || result.success !== true || !("data" in result)) {
    const message = result && typeof result === "object" && "message" in result && typeof result.message === "string"
      ? result.message : "Unable to verify payment status.";
    throw new Error(message);
  }
  return result.data;
}

type PaymentSummary = { id:string;paymentNumber:string;currency:string;totalAmount:number;advanceAmount:number;paidAmount:number;status:string };
type Comparison = { reference:string;route:string;shiftingDate:string|null;selection:{bookingNumber:string|null;selectedQuotationId:string|null;bookingStatus:string|null;payment:PaymentSummary|null};recommendation:{version:string;explanation:string|null};quotations:Quote[] };
const money=(currency:string,value:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency,maximumFractionDigits:2}).format(value);
const date=(value:string|null)=>value?new Date(value).toLocaleDateString("en-IN",{dateStyle:"medium"}):"Not committed";
const items=(value:unknown)=>value&&typeof value==="object"&&!Array.isArray(value)&&Array.isArray((value as {items?:unknown}).items)?(value as {items:string[]}).items:[];
const stars=(rating:number)=>`${"★".repeat(Math.max(0,Math.min(5,Math.round(rating))))}${"☆".repeat(Math.max(0,5-Math.round(rating)))}`;

export function CustomerQuotationComparison({reference}:{reference:string}){
  const [advanceStatus,setAdvanceStatus]=useState<AdvanceStatus|null>(null),[checkingPayment,setCheckingPayment]=useState(false),[data,setData]=useState<Comparison|null>(null),[message,setMessage]=useState(""),[loading,setLoading]=useState(true),[choosing,setChoosing]=useState<string|null>(null),[confirming,setConfirming]=useState<Quote|null>(null),[preparing,setPreparing]=useState(false),[paying,setPaying]=useState(false),[paymentNotice,setPaymentNotice]=useState("");
  useEffect(()=>{let active=true;void fetch(`/api/public/quotation-comparison?reference=${encodeURIComponent(reference)}`,{cache:"no-store"}).then(async response=>{const result=await response.json();if(!response.ok||!result.success)throw Error(result.message||"Unable to load quotations.");if(active)setData(result.data)}).catch(error=>{if(active)setMessage(error instanceof Error?error.message:"Unable to load quotations.")}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[reference]);
  async function choose(quote:Quote){setChoosing(quote.id);setMessage("");try{const response=await fetch("/api/public/quotation-comparison",{method:"POST",cache:"no-store",headers:{"Content-Type":"application/json"},body:JSON.stringify({reference,quotationId:quote.id})});const result=await response.json();if(!response.ok||!result.success)throw Error(result.message||"Unable to select quotation.");setData(current=>current?{...current,selection:{...current.selection,bookingNumber:result.data.bookingNumber,selectedQuotationId:result.data.selectedQuotationId}}:current);setMessage(result.message);setConfirming(null)}catch(error){setMessage(error instanceof Error?error.message:"Unable to select quotation.")}finally{setChoosing(null)}}
  async function prepareBooking(){setPreparing(true);setMessage("");try{const response=await fetch("/api/public/booking-confirmation",{method:"POST",cache:"no-store",headers:{"Content-Type":"application/json"},body:JSON.stringify({reference})});const result=await response.json();if(!response.ok||!result.success)throw Error(result.message||"Unable to confirm booking details.");setData(current=>current?{...current,selection:{...current.selection,bookingNumber:result.data.bookingNumber,bookingStatus:"VENDOR_SELECTED",payment:{id:result.data.paymentId,paymentNumber:result.data.paymentNumber,currency:result.data.currency,totalAmount:result.data.totalAmount,advanceAmount:result.data.advanceAmount,paidAmount:0,status:result.data.paymentStatus}}}:current);setMessage(result.message)}catch(error){setMessage(error instanceof Error?error.message:"Unable to confirm booking details.")}finally{setPreparing(false)}}
  const checkingRef = useRef(false);
  const checkAdvanceStatus = useCallback(async (allowFinalize: boolean) => {
    if (checkingRef.current) return;
    checkingRef.current = true;
    setCheckingPayment(true);
    try {
      const status = await customerPaymentRequest(
        `/api/public/booking-payment-status?reference=${encodeURIComponent(reference)}`, reference,
      ) as AdvanceStatus;
      setAdvanceStatus(status);
      if (status.bookingConfirmed && status.advanceVerified) {
        setPaymentNotice(`Booking ${status.bookingNumber} confirmed. Advance received. Your remaining payment milestones still apply.`);
        return;
      }
      if (status.advanceVerified && allowFinalize) {
        const finalization = await customerPaymentRequest("/api/public/booking-finalize", reference, {}) as
          { confirmed?: boolean; bookingNumber?: string };
        if (!finalization.confirmed) throw new Error("Booking confirmation is still pending.");
        const refreshed = await customerPaymentRequest(
          `/api/public/booking-payment-status?reference=${encodeURIComponent(reference)}`, reference,
        ) as AdvanceStatus;
        setAdvanceStatus(refreshed);
        if (refreshed.bookingConfirmed) {
          setPaymentNotice(`Booking ${refreshed.bookingNumber} confirmed. Advance received. Keep your reference for tracking.`);
        } else {
          setPaymentNotice("Advance recorded. Booking confirmation is being synchronized. Check status again shortly.");
        }
      } else if (status.stage === "PAYMENT_RECONCILIATION") {
        setPaymentNotice("Payment reconciliation is pending. Do not make another payment. Check status again shortly.");
      } else if (!status.advanceVerified) {
        setPaymentNotice("No verified advance is recorded yet. If you paid, do not retry until reconciliation completes.");
      }
    } catch (error) {
      setPaymentNotice(error instanceof Error ? error.message : "Payment status is temporarily unavailable. Do not pay again until checked.");
    } finally {
      checkingRef.current = false;
      setCheckingPayment(false);
    }
  }, [reference]);

  // Recover authoritative status after refresh, delayed webhook or closed checkout.
  useEffect(() => {
    if (!data?.selection.payment || advanceStatus) return;
    void checkAdvanceStatus(true);
  }, [data?.selection.payment, advanceStatus, checkAdvanceStatus]);

  async function verifyCheckoutResult(result: RazorpayResult) {
    setPaying(true);
    setPaymentNotice("Checking captured payment with Razorpay. Please do not pay again.");
    try {
      await customerPaymentRequest("/api/public/booking-payment-verify", reference, result);
      await checkAdvanceStatus(true);
    } catch (error) {
      setPaymentNotice(`${error instanceof Error ? error.message : "Payment verification pending."} If payment was deducted, do not pay again. Use Check Payment Status.`);
    } finally { setPaying(false); }
  }

  async function startAdvancePayment() {
    if (paying || checkingPayment || advanceStatus?.advanceVerified || advanceStatus?.stage === "PAYMENT_RECONCILIATION" || !data?.selection.payment) return;
    setPaying(true); setPaymentNotice("");
    try {
      const response = await fetch("/api/public/booking-payment-order", {
        method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const result: unknown = await response.json();
      if (!result || typeof result !== "object" || !("success" in result) || result.success !== true || !("data" in result)) {
        const message = result && typeof result === "object" && "message" in result && typeof result.message === "string" ? result.message : "Unable to prepare secure payment.";
        throw new Error(message);
      }
      const order = result.data as { orderId?: unknown; amount?: unknown; currency?: unknown; keyId?: unknown };
      if (typeof order.orderId !== "string" || !order.orderId.startsWith("order_") ||
          typeof order.amount !== "number" || !Number.isSafeInteger(order.amount) || order.amount <= 0 ||
          order.currency !== "INR" || typeof order.keyId !== "string" || !order.keyId.startsWith("rzp_test_")) {
        throw new Error("Invalid payment order. Please contact EasyMovers support.");
      }
      const Checkout = await loadRazorpayCheckout();
      const checkout = new Checkout({
        key: order.keyId, amount: order.amount, currency: "INR", order_id: order.orderId,
        name: "EasyMovers", description: "Booking advance · Test Mode",
        handler: response => { void verifyCheckoutResult(response); },
        modal: { ondismiss: () => setPaymentNotice("Checkout closed. Check payment status before retrying.") },
        theme: { color: "#1768aa" },
      });
      checkout.on("payment.failed", () => setPaymentNotice("Payment was not completed. Your booking remains pending."));
      checkout.open();
    } catch (error) {
      setPaymentNotice(error instanceof Error ? error.message : "Unable to open secure payment.");
    } finally { setPaying(false); }
  }
  return <main className={styles.page}><div className={styles.container}><header><div><p>EM SAFE MOVE</p><h1>{advanceStatus?.bookingConfirmed?"Booking confirmed":data?.selection.payment?"Advance payment ready":data?.selection.selectedQuotationId?"Quotation selected":"Compare your quotations"}</h1><span>{data?.route||reference}</span>{data?.selection.selectedQuotationId?<span className={styles.stage}><b>Quotation selected</b><i>{advanceStatus?.bookingConfirmed?"Booking confirmed · advance received":advanceStatus?.advanceVerified?"Advance received · confirmation pending":data.selection.payment?"Advance payment pending":"Booking confirmation pending"}</i></span>:data?.quotations.length?<b className={styles.count}>{data.quotations.length} quotations received</b>:null}</div><div className={styles.sessionAction}><CustomerSessionExit reference={reference}/></div></header>{message&&<section className={data?.selection.selectedQuotationId?styles.success:styles.state}>{message}</section>}{loading?<section className={styles.state}>Loading your protected quotations…</section>:!data?<section className={styles.state}><Link href={`/track?reference=${encodeURIComponent(reference)}`}>Verify mobile / reopen request</Link></section>:!data.quotations.length?<section className={styles.state}>Your quotation request is active. Vendor offers will appear here after submission.</section>:<><section className={styles.notice}><strong>How EasyMovers recommends an offer</strong><span>{data.recommendation.explanation||"We compare the information currently available for every eligible quotation."} You remain free to choose any eligible offer.</span></section><div className={styles.grid}>{data.quotations.map(quote=>{const included=items(quote.inclusions),excluded=items(quote.exclusions),selected=data.selection.selectedQuotationId===quote.id,locked=Boolean(data.selection.selectedQuotationId&&!selected);return <article key={quote.id} className={selected?styles.selected:quote.recommended?styles.recommended:""}>{quote.recommended&&<b className={styles.ribbon}>EM Safe Move Recommended</b>}{selected&&<b className={styles.selectedRibbon}>Your selected quotation</b>}<div className={styles.title}><div><h2>{quote.label}</h2>{quote.performance.status==="NEW_PARTNER"?<small>New EasyMovers Partner · Verified identity</small>:<small className={styles.rating}><b>{stars(quote.performance.averageRating||0)}</b> {quote.performance.averageRating?.toFixed(1)} · {quote.performance.totalReviews} verified reviews</small>}</div><strong>{money(quote.currency,quote.costs.total)}</strong></div><dl><dt>Transportation</dt><dd>{money(quote.currency,quote.costs.transportation)}</dd><dt>Packing</dt><dd>{money(quote.currency,quote.costs.packing)}</dd><dt>Labour</dt><dd>{money(quote.currency,quote.costs.labour)}</dd><dt>Insurance</dt><dd>{money(quote.currency,quote.costs.insurance)}</dd><dt>Tax</dt><dd>{money(quote.currency,quote.costs.tax)}</dd><dt>Discount</dt><dd>− {money(quote.currency,quote.costs.discount)}</dd></dl><section className={styles.included}><h3>What’s included</h3>{included.length?<ul>{included.slice(0,5).map(item=><li key={item}>✓ {item}</li>)}</ul>:<p>Standard transportation and declared quotation services.</p>}{included.length>5&&<small>+ {included.length-5} more included services</small>}{excluded.length>0&&<details><summary>Important exclusions</summary><ul>{excluded.map(item=><li key={item}>{item}</li>)}</ul></details>}</section><section className={styles.metrics}><span><b>{quote.performance.completedBookings||"New"}</b> {quote.performance.completedBookings?"completed moves":"performance history"}</span><span><b>{quote.performance.onTimeDelivery===null?"Building":`${quote.performance.onTimeDelivery.toFixed(0)}%`}</b> on-time record</span><span><b>{quote.compliance.identityVerified?"Verified":"Under review"}</b> identity</span></section><p className={styles.schedule}>Pickup: {date(quote.schedule.pickupDate)} · Delivery: {date(quote.schedule.deliveryDate)} · Valid until: {date(quote.schedule.validUntil)}</p>{quote.scoring.excludedReason&&<p className={styles.warning}>{quote.scoring.excludedReason}</p>}<button type="button" disabled={selected||locked||choosing!==null||Boolean(quote.scoring.excludedReason)} onClick={()=>setConfirming(quote)}>{selected?"Selected":locked?"Another offer selected":choosing===quote.id?"Selecting…":"Choose this quotation"}</button></article>})}</div>{data.selection.selectedQuotationId&&<section className={styles.bookingStep}>{data.selection.payment?<><div><strong>{advanceStatus?.bookingConfirmed?"Booking confirmed · advance received":advanceStatus?.advanceVerified?"Advance received · finalizing booking":"Secure advance due"}</strong><b>{money("INR",data.selection.payment.advanceAmount)}</b><span>Total move value {money("INR",data.selection.payment.totalAmount)} · {data.selection.payment.paymentNumber}</span></div><div className={styles.paymentActions}><span>At pickup: {money("INR",Math.max(0,data.selection.payment.totalAmount*0.5-data.selection.payment.advanceAmount))} · Before unpacking: {money("INR",data.selection.payment.totalAmount-Math.max(data.selection.payment.advanceAmount,data.selection.payment.totalAmount*0.5))}</span><button type="button" disabled={paying||checkingPayment||Boolean(advanceStatus?.advanceVerified)||advanceStatus?.stage === "PAYMENT_RECONCILIATION"||data.selection.payment.paidAmount>=data.selection.payment.advanceAmount} onClick={()=>void startAdvancePayment()}>{paying?"Processing payment…":advanceStatus?.bookingConfirmed?"Booking confirmed":advanceStatus?.advanceVerified?"Advance received":advanceStatus?.stage === "PAYMENT_RECONCILIATION"?"Payment under review":`Pay Secure Advance — ${money("INR",data.selection.payment.advanceAmount-data.selection.payment.paidAmount)}`}</button><button type="button" disabled={checkingPayment||paying} onClick={()=>void checkAdvanceStatus(true)}>{checkingPayment?"Checking payment status…":"Check Payment Status"}</button><small>Razorpay Test Mode. Payment status is checked on the server. Do not pay again while verification is pending.</small>{paymentNotice&&<p role="status" className={styles.paymentNotice}>{paymentNotice}</p>}</div></>:<><div><strong>Confirm booking details</strong><span>We will revalidate the selected partner, price, pickup date and delivery date, then prepare the advance.</span></div><button type="button" disabled={preparing} onClick={()=>void prepareBooking()}>{preparing?"Preparing…":"Confirm Your Booking"}</button></>}</section>}<p className={styles.next}>{advanceStatus?.bookingConfirmed?"Your booking is confirmed. Keep your booking number and pay the remaining milestones when due.":data.selection.payment?"Your commercial snapshot is locked. Complete the secure advance payment to confirm the move.":data.selection.selectedQuotationId?"Confirm the booking details to calculate and prepare the secure advance. No payment is taken at this step.":"Review each offer carefully. Your move is not booked until you choose a quotation and complete booking confirmation."}</p></>}{confirming&&<div className={styles.modalBackdrop} role="presentation" onMouseDown={()=>setConfirming(null)}><section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="quotation-confirm-title" onMouseDown={event=>event.stopPropagation()}><h2 id="quotation-confirm-title">Confirm your quotation choice</h2><p>You are selecting <strong>{confirming.label}</strong> for <strong>{money(confirming.currency,confirming.costs.total)}</strong>.</p><p>This locks the offer for booking confirmation. It does not collect payment yet.</p><div><button type="button" className={styles.secondary} disabled={choosing!==null} onClick={()=>setConfirming(null)}>Review again</button><button type="button" disabled={choosing!==null} onClick={()=>void choose(confirming)}>{choosing?"Confirming…":"Confirm selection"}</button></div></section></div>}</div></main>
}
