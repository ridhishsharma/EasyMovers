"use client"

import { useState } from "react"
import Link from "next/link"

export default function PartnerPage() {
const [loading, setLoading] = useState(false)

const [companyName, setCompanyName] = useState("")
const [gstNumber, setGstNumber] = useState("")
const [panNumber, setPanNumber] = useState("")
const [website, setWebsite] = useState("")

const [address, setAddress] = useState("")
const [city, setCity] = useState("")
const [stateName, setStateName] = useState("")
const [pincode, setPincode] = useState("")

const [ownerName, setOwnerName] = useState("")
const [ownerMobile, setOwnerMobile] = useState("")
const [ownerEmail, setOwnerEmail] = useState("")

const [quotationContactName, setQuotationContactName] = useState("")
const [quotationContactMobile, setQuotationContactMobile] = useState("")
const [quotationContactEmail, setQuotationContactEmail] = useState("")

const [coordinatorName, setCoordinatorName] = useState("")
const [coordinatorMobile, setCoordinatorMobile] = useState("")
const [coordinatorEmail, setCoordinatorEmail] = useState("")

const [experienceYears, setExperienceYears] = useState("")
const [totalVehicles, setTotalVehicles] = useState("")
const [totalLabours, setTotalLabours] = useState("")

const [serviceCities, setServiceCities] = useState("")

const [householdService, setHouseholdService] = useState(false)
const [officeService, setOfficeService] = useState(false)
const [vehicleService, setVehicleService] = useState(false)

const [insuranceAvailable, setInsuranceAvailable] = useState(false)

const [remarks, setRemarks] = useState("")

async function handleSubmit(e: React.FormEvent) {
e.preventDefault()


setLoading(true)

const vendorCode =
  "VND" + Date.now().toString().slice(-6)

try {
  const response = await fetch("/api/vendors", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      vendorCode,

      companyName,
      gstNumber,
      panNumber,
      website,

      address,
      city,
      state: stateName,
      pincode,

      ownerName,
      ownerMobile,
      ownerEmail,

      quotationContactName,
      quotationContactMobile,
      quotationContactEmail,

      coordinatorName,
      coordinatorMobile,
      coordinatorEmail,

      experienceYears,
      totalVehicles,
      totalLabours,

      serviceCities,

      householdService,
      officeService,
      vehicleService,

      insuranceAvailable,

      remarks,
    }),
  })

  const data = await response.json()

  if (data.success) {
    alert(
      `Registration Submitted Successfully


Vendor Code: ${vendorCode}

Our onboarding team will contact you shortly.`
)


    window.location.reload()
  } else {
    alert(data.message)
  }
} catch (error) {
  console.error(error)

  alert("Unable to submit registration")
}

setLoading(false)


}

return ( <div className="min-h-screen bg-black text-white"> <div className="mx-auto max-w-5xl px-6 py-12">


    <h1 className="mb-2 text-4xl font-bold">
      Partner With Easy Movers
    </h1>

    <p className="mb-10 text-white/70">
      Join our logistics network and start receiving
      relocation leads from across India.
    </p>

    <form
      onSubmit={handleSubmit}
      className="grid gap-6"
    >
      <div className="rounded-2xl border border-white/10 p-6">
        <h2 className="mb-4 text-xl font-semibold">
          Company Information
        </h2>

        <input placeholder="Company Name"
          value={companyName}
          onChange={(e)=>setCompanyName(e.target.value)}
          className="mb-3 w-full rounded-xl bg-white/5 p-3" required />

        <input placeholder="GST Number"
          value={gstNumber}
          onChange={(e)=>setGstNumber(e.target.value)}
          className="mb-3 w-full rounded-xl bg-white/5 p-3" />

        <input placeholder="PAN Number"
          value={panNumber}
          onChange={(e)=>setPanNumber(e.target.value)}
          className="mb-3 w-full rounded-xl bg-white/5 p-3" />

        <input placeholder="Website"
          value={website}
          onChange={(e)=>setWebsite(e.target.value)}
          className="mb-3 w-full rounded-xl bg-white/5 p-3" />

        <textarea placeholder="Office Address"
          value={address}
          onChange={(e)=>setAddress(e.target.value)}
          className="w-full rounded-xl bg-white/5 p-3" />
      </div>

      <div className="rounded-2xl border border-white/10 p-6">
        <h2 className="mb-4 text-xl font-semibold">
          Owner Information
        </h2>

        <input placeholder="Owner Name"
          value={ownerName}
          onChange={(e)=>setOwnerName(e.target.value)}
          className="mb-3 w-full rounded-xl bg-white/5 p-3" required />

        <input placeholder="Owner Mobile"
          value={ownerMobile}
          onChange={(e)=>setOwnerMobile(e.target.value)}
          className="mb-3 w-full rounded-xl bg-white/5 p-3" required />

        <input placeholder="Owner Email"
          value={ownerEmail}
          onChange={(e)=>setOwnerEmail(e.target.value)}
          className="w-full rounded-xl bg-white/5 p-3" />
      </div>

      <div className="rounded-2xl border border-white/10 p-6">
        <h2 className="mb-4 text-xl font-semibold">
          Quotation Contact
        </h2>

        <input placeholder="Quotation Contact Name"
          value={quotationContactName}
          onChange={(e)=>setQuotationContactName(e.target.value)}
          className="mb-3 w-full rounded-xl bg-white/5 p-3" />

        <input placeholder="Quotation Contact Mobile"
          value={quotationContactMobile}
          onChange={(e)=>setQuotationContactMobile(e.target.value)}
          className="mb-3 w-full rounded-xl bg-white/5 p-3" />

        <input placeholder="Quotation Contact Email"
          value={quotationContactEmail}
          onChange={(e)=>setQuotationContactEmail(e.target.value)}
          className="w-full rounded-xl bg-white/5 p-3" />
      </div>

      <div className="rounded-2xl border border-white/10 p-6">
        <h2 className="mb-4 text-xl font-semibold">
          Operations Coordinator
        </h2>

        <input placeholder="Coordinator Name"
          value={coordinatorName}
          onChange={(e)=>setCoordinatorName(e.target.value)}
          className="mb-3 w-full rounded-xl bg-white/5 p-3" />

        <input placeholder="Coordinator Mobile"
          value={coordinatorMobile}
          onChange={(e)=>setCoordinatorMobile(e.target.value)}
          className="mb-3 w-full rounded-xl bg-white/5 p-3" />

        <input placeholder="Coordinator Email"
          value={coordinatorEmail}
          onChange={(e)=>setCoordinatorEmail(e.target.value)}
          className="w-full rounded-xl bg-white/5 p-3" />
      </div>

      <div className="rounded-2xl border border-white/10 p-6">
        <h2 className="mb-4 text-xl font-semibold">
          Services Offered
        </h2>

        <label className="block mb-2">
          <input type="checkbox"
            checked={householdService}
            onChange={(e)=>setHouseholdService(e.target.checked)} />
          <span className="ml-2">Household Shifting</span>
        </label>

        <label className="block mb-2">
          <input type="checkbox"
            checked={officeService}
            onChange={(e)=>setOfficeService(e.target.checked)} />
          <span className="ml-2">Office Relocation</span>
        </label>

        <label className="block">
          <input type="checkbox"
            checked={vehicleService}
            onChange={(e)=>setVehicleService(e.target.checked)} />
          <span className="ml-2">Vehicle Transportation</span>
        </label>
      </div>

      <div className="rounded-2xl border border-white/10 p-6">
        <input placeholder="Service Cities (Bhopal, Indore...)"
          value={serviceCities}
          onChange={(e)=>setServiceCities(e.target.value)}
          className="mb-3 w-full rounded-xl bg-white/5 p-3" required />

        <input placeholder="Years of Experience"
          value={experienceYears}
          onChange={(e)=>setExperienceYears(e.target.value)}
          className="mb-3 w-full rounded-xl bg-white/5 p-3" />

        <input placeholder="Total Vehicles"
          value={totalVehicles}
          onChange={(e)=>setTotalVehicles(e.target.value)}
          className="mb-3 w-full rounded-xl bg-white/5 p-3" />

        <input placeholder="Total Labours"
          value={totalLabours}
          onChange={(e)=>setTotalLabours(e.target.value)}
          className="mb-3 w-full rounded-xl bg-white/5 p-3" />

        <label className="block mb-3">
          <input type="checkbox"
            checked={insuranceAvailable}
            onChange={(e)=>setInsuranceAvailable(e.target.checked)} />
          <span className="ml-2">Insurance Available</span>
        </label>

        <textarea placeholder="Remarks"
          value={remarks}
          onChange={(e)=>setRemarks(e.target.value)}
          className="w-full rounded-xl bg-white/5 p-3" />
      </div>
	<label className="flex items-start gap-3 text-sm text-white/80">

<p className="mt-2 text-sm text-white/60">
Special instructions, service capabilities, storage availability,
AC installation support, house cleaning support, or other
operational details may be mentioned here.
</p>
</label>
 
<label className="flex items-start gap-3 text-sm text-white/80">
  <input type="checkbox" required className="mt-1" />

  <span>
    I have read and agree to the
    <a
      href="/legal/vendor-terms"
      target="_blank"
      className="ml-1 text-yellow-400 underline"
    >
      Vendor Terms & Conditions
    </a>
  </span>
</label>

<input
  type="checkbox"
  required
/>

<span>
I agree to follow Easy Movers SOPs and service quality standards.
</span>

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-yellow-500 px-6 py-4 font-semibold text-black"
      >
        {loading ? "Submitting..." : "Register As Partner"}
      </button>
<Link
  href="/"
  className="text-amber-600 font-medium"
>
  ← Back to Home
</Link>
    </form>
  </div>
</div>
)
}
