"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Phone, Save, Trash2 } from "lucide-react";
import { localServiceCities, localVehicles } from "@/lib/local-services";
import { applicationDefaults, individualDraftKey, restoreIndividualDraft, serializableIndividualDraft, type IndividualApplication } from "@/lib/individual-application";
import styles from "./partner-journey.module.css";

const steps = ["Your details", "Your vehicle", "Verification"];

export function IndividualTransporter() {
  const [fields, setFields] = useState(applicationDefaults);
  const [step, setStep] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { try { const raw = localStorage.getItem(individualDraftKey); if (raw) { setFields(restoreIndividualDraft(raw)); setMessage("Draft restored. आवेदन अभी जमा नहीं हुआ है।"); } } catch { setMessage("Saved draft could not be restored."); } setReady(true); }, []);
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [dirty]);
  function change(key: keyof IndividualApplication, value: string) { setFields(previous => ({ ...previous, [key]: value })); setDirty(true); setMessage(""); }
  function valid() { if (step === 0) return fields.fullName.trim().length >= 2 && /^[6-9][0-9]{9}$/.test(fields.mobile) && Boolean(fields.serviceCity); if (step === 1) return Boolean(fields.vehicleCategory); const identityValid = fields.identityType === "AADHAAR" ? /^[0-9]{4}$/.test(fields.identityLastFour) : /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(fields.identityLastFour); return fields.licenceNumber.trim().length >= 5 && identityValid && accepted; }
  function save(event: FormEvent) { event.preventDefault(); if (!valid()) { setMessage("Please complete this step. सहायता चाहिए तो कॉल करें।"); return; } try { localStorage.setItem(individualDraftKey, JSON.stringify(serializableIndividualDraft(fields))); setDirty(false); setMessage("Interest saved on this device. EasyMovers will help complete verification."); } catch { setMessage("Could not save. Your entries remain open in this tab."); } }
  return <main className={styles.page}><div className={styles.container}>
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><span>›</span><Link href="/partner">Partner options</Link><span>›</span><span>Individual transporter</span></nav>
    <div className={styles.compactHeading}><div><p className={styles.eyebrow}>DRIVE WITH EASYMOVERS</p><h1>Register your vehicle</h1><p className={styles.intro}>Simple registration · आसान रजिस्ट्रेशन · No payment required</p></div></div>
    <ol className={styles.steps} aria-label="Registration progress">{steps.map((label,index)=><li key={label} className={index===step?styles.activeStep:index<step?styles.doneStep:""}><span>{index<step?<Check size={16}/>:index+1}</span>{label}</li>)}</ol>
    <form onSubmit={save} className={styles.compactForm}><fieldset disabled={!ready} className={styles.formBody}>
      {step===0&&<section className={styles.stepPanel}><h2>Your details / आपकी जानकारी</h2><p className={styles.note}>We need these details so our team can contact and assist you.</p><div className={styles.grid}>
        <label className={styles.field}>Full name / पूरा नाम<input required minLength={2} maxLength={100} autoComplete="name" value={fields.fullName} onChange={e=>change("fullName",e.target.value)}/></label>
        <label className={styles.field}>Mobile number / मोबाइल नंबर<input required type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} autoComplete="tel-national" placeholder="10-digit number" value={fields.mobile} onChange={e=>change("mobile",e.target.value.replace(/\D/g,""))}/></label>
        <label className={`${styles.field} ${styles.wide}`}>Service city / काम का शहर<select required value={fields.serviceCity} onChange={e=>change("serviceCity",e.target.value)}><option value="">Choose city</option>{localServiceCities.map(city=><option key={city}>{city}</option>)}</select></label>
      </div></section>}
      {step===1&&<section className={styles.stepPanel}><h2>Choose your vehicle / वाहन चुनें</h2><p className={styles.note}>Tap the vehicle you own. Registration number and RC will be checked later.</p><div className={styles.vehicleChoices} role="radiogroup">{localVehicles.map(item=><label key={item.code} className={fields.vehicleCategory===item.code?styles.selectedVehicle:styles.vehicleChoice}><input type="radio" name="vehicleCategory" checked={fields.vehicleCategory===item.code} onChange={()=>change("vehicleCategory",item.code)}/><span className={styles.vehicleIcon}>🚚</span><span>{item.label}</span></label>)}</div></section>}
      {step===2&&<section className={styles.stepPanel}><h2>Basic verification / जरूरी दस्तावेज</h2><p className={styles.note}>Only basic details now. Our executive will securely verify documents later.</p><div className={styles.grid}>
        <label className={styles.field}>Commercial driving licence / कमर्शियल लाइसेंस<input required maxLength={20} autoComplete="off" placeholder="Licence number" value={fields.licenceNumber} onChange={e=>change("licenceNumber",e.target.value.toUpperCase())}/></label>
        <label className={styles.field}>Identity document / पहचान पत्र<select value={fields.identityType} onChange={e=>{change("identityType",e.target.value);change("identityLastFour","");}}><option value="PAN">PAN card</option><option value="AADHAAR">Aadhaar (last 4 only)</option></select></label>
        <label className={`${styles.field} ${styles.wide}`}>{fields.identityType==="AADHAAR"?"Last 4 Aadhaar digits / आखिरी 4 अंक":"Complete PAN number / पूरा पैन नंबर"}<input required inputMode={fields.identityType==="AADHAAR"?"numeric":"text"} minLength={fields.identityType==="AADHAAR"?4:10} maxLength={fields.identityType==="AADHAAR"?4:10} pattern={fields.identityType==="AADHAAR"?"[0-9]{4}":"[A-Z]{5}[0-9]{4}[A-Z]"} autoComplete="off" placeholder={fields.identityType==="AADHAAR"?"Only last 4 digits":"ABCDE1234F"} value={fields.identityLastFour} onChange={e=>change("identityLastFour",e.target.value.replace(/\s/g,"").toUpperCase())}/></label>
      </div><label className={styles.consent}><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/><span>I agree to be contacted for verification. / मैं सत्यापन के लिए संपर्क की अनुमति देता/देती हूँ।</span></label><aside className={styles.laterCheck}><strong>Checked later with our executive:</strong> vehicle RC, insurance, permit/fitness/PUC where applicable, and payout details.</aside></section>}
      <div className={styles.stepActions}><a href="tel:+918959591603" className={styles.helpButton}><Phone size={18}/>Call for help / सहायता</a><div className={styles.actionGroup}>{step>0&&<button type="button" className={styles.secondary} onClick={()=>{setStep(v=>v-1);setMessage("");}}><ArrowLeft size={18}/>Back</button>}{step<2?<button type="button" className={styles.primary} disabled={!valid()} onClick={()=>{if(valid()){setStep(v=>v+1);setMessage("");}}}>Continue / आगे बढ़ें <ArrowRight size={18}/></button>:<button type="submit" className={styles.primary} disabled={!valid()}><Save size={18}/>Save interest / सेव करें</button>}<button type="button" className={styles.textButton} onClick={()=>{if(!window.confirm("Delete this draft and clear the form?"))return;try{localStorage.removeItem(individualDraftKey);setFields(applicationDefaults);setAccepted(false);setStep(0);setDirty(false);setMessage("Local draft deleted.");}catch{setMessage("Could not delete the draft.");}}}><Trash2 size={16}/>Clear</button></div></div>
    </fieldset><p className={styles.note}>Saved only in this browser; this does not activate a transporter.</p>{message&&<p role="status" className={styles.pending}>{message}</p>}</form>
  </div></main>;
}
