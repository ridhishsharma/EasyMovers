"use client"
import { useState } from "react"
import {
ShieldCheck,
CheckCircle2,
Phone,
MessageCircle,
} from "lucide-react"

import { AnimatedCounter } from "@/components/sections/animated-counter"
import { useRouter } from "next/navigation"

const cities = [
  "Bhopal",
  "Indore",
  "Jabalpur",
  "Gwalior",
  "Delhi",
  "Noida",
  "Gurugram",
  "Mumbai",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Hyderabad",
  "Bengaluru",
  "Chennai",
  "Kolkata",
]

export function HeroSection() {
 const shiftingTypes = [
"Home Shifting",
"Office Relocation",
"Vehicle Transport"
]

const [shiftingType, setShiftingType] = useState("")
const [houseType, setHouseType] = useState("")
const [name, setName] = useState("")
const [mobile, setMobile] = useState("")
const [email, setEmail] = useState("")
const [notes, setNotes] = useState("")
const [pickupCity, setPickupCity] = useState("")
const [destinationSearch, setDestinationSearch] = useState("")
const [destinationCity, setDestinationCity] = useState("")
const [destinationState, setDestinationState] = useState("")
const [destinationPincode, setDestinationPincode] = useState("")
const [shiftingDate, setShiftingDate] = useState("")
const [officeSize, setOfficeSize] = useState("")
const [showLeadPopup, setShowLeadPopup] = useState(false)
const [pickupFloor, setPickupFloor] = useState("")
const [vehicleType, setVehicleType] = useState("")
const [vehicleIncluded, setVehicleIncluded] = useState("")
const [liftAvailable, setLiftAvailable] = useState("")
const [packingRequired, setPackingRequired] = useState("")
const [plantsIncluded, setPlantsIncluded] = useState("")
const [showDecisionScreen, setShowDecisionScreen] = useState(false)
const [leadId, setLeadId] = useState("")
const router = useRouter()
const handlePincodeLookup = async (value: string) => {
  setDestinationSearch(value)

  const pincode = value.replace(/\D/g, "")

  if (pincode.length !== 6) {
    setDestinationCity("")
    setDestinationState("")
    return
  }

  try {
    const response = await fetch(
      `https://api.postalpincode.in/pincode/${pincode}`
    )

    const data = await response.json()

console.log("Searching:", value)
console.log("City:", destinationCity)
console.log("State:", destinationState)    

console.log("PINCODE API:", data)

    const office = data?.[0]?.PostOffice?.[0]

    if (office) {
      setDestinationPincode(pincode)
      setDestinationCity(office.District)
      setDestinationState(office.State)
    }
  } catch (err) {
    console.error("Pincode Error:", err)
  }
}

const generateLeadId = () => {
  const now = new Date()

  const datePart =
    now.getFullYear().toString().slice(-2) +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0")

  const randomPart = Math.floor(
    100 + Math.random() * 900
  )

  return `EM${datePart}${randomPart}`
}


const handleQuoteSubmit = async () => {

  if (!name.trim()) {
    alert("Please enter your name")
    return
  }

  if (name.trim().length < 3) {
    alert("Name should contain at least 3 characters")
    return
  }

  if (!mobile.trim()) {
    alert("Please enter mobile number")
    return
  }

  if (mobile.length !== 10) {
    alert("Mobile number must be 10 digits")
    return
  }
if (!pickupCity) {
  alert("Please select Pickup City")
  return
}

if (!destinationCity) {
  alert("Please Provide Pincode of Destination City")
  return
}

if (!shiftingType) {
  alert("Please select Move Type")
  return
}

if (
  shiftingType === "Household" &&
  !houseType
) {
  alert("Please select House Type")
  return
}

if (
  shiftingType === "Office" &&
  !officeSize
) {
  alert("Please select Office Size")
  return
}

if (
  shiftingType === "Vehicle" &&
  !vehicleType
) {
  alert("Please select Vehicle Type")
  return
}
  const refId = generateLeadId()

  try {

   const response = await fetch("/api/leads", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
  referenceId: refId,

  name,
  mobile,
  email,

  pickupCity,

  destinationSearch,
  destinationCity,
  destinationState,
  destinationPincode,

  shiftingDate,

  shiftingType,
  houseType,
officeSize,
plantsIncluded,

  pickupFloor,
  liftAvailable,
  packingRequired,
notes:
  vehicleIncluded === "Yes"
    ? `${notes} | Vehicle Included`
    : notes,
}),
})

const resetForm = () => {
  setName("")
  setMobile("")
  setEmail("")

  setPickupCity("")

  setDestinationSearch("")
  setDestinationCity("")
  setDestinationState("")
  setDestinationPincode("")

  setShiftingDate("")

  setShiftingType("")

  setHouseType("")
  setOfficeSize("")

  setPickupFloor("")
  setLiftAvailable("")

  setPackingRequired("")

  setPlantsIncluded("")

  setVehicleIncluded("")

  setNotes("")
}
const data = await response.json()

if (data.success) {

  // Create Inventory Draft Automatically
  try {

    await fetch("/api/inventory", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        referenceId: data.referenceId,

        leadId: data.lead.id,

        status: "DRAFT",

        createdBy: "CUSTOMER",
      }),
    })

  } catch (inventoryError) {

    console.error(
      "Inventory Draft Creation Error",
      inventoryError
    )

  }

  setLeadId(data.referenceId)

  resetForm()

  alert(
    `Request Submitted Successfully

Reference ID: ${data.referenceId}

Thank you for choosing Easy Movers.

Our relocation specialist will contact you shortly.`
  )

  setShowLeadPopup(false)

  setShowDecisionScreen(true)

} else {

  alert("Unable to save lead.")

} 
} catch (error) {

  console.error(error)

  alert("Server error. Please try again.")

}

}
return ( <section className="relative overflow-hidden bg-[#030B28]">

  {/* BACKGROUND GLOW */}
  <div className="absolute inset-0 overflow-hidden">

    <div className="absolute left-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full bg-orange-500/20 blur-3xl" />

    <div className="absolute bottom-[-120px] right-[-120px] h-[320px] w-[320px] rounded-full bg-blue-500/20 blur-3xl" />

  </div>

  {/* MAIN CONTAINER */}
  <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 pt-24 sm:px-6 sm:py-14 sm:pt-28 lg:min-h-screen lg:grid-cols-2 lg:gap-14 lg:px-8">

    {/* LEFT CONTENT */}
    <div className="order-2 lg:order-1">

      {/* TAG */}
      <div className="inline-flex items-center rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-xs font-medium text-orange-300 backdrop-blur-xl sm:text-sm">

        India’s Trusted Relocation Platform

      </div>

      {/* HEADING */}
      <h1 className="mt-5 text-3xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">

        Move Anywhere

        <span className="block text-orange-400">
          With Confidence
        </span>

      </h1>

      {/* SUBTEXT */}
      <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 sm:text-lg lg:text-xl">

        Compare verified movers, receive instant quotations,
        and relocate safely across India with premium logistics support.

      </p>

      {/* TRUST BADGES */}
      <div className="mt-7 grid grid-cols-2 gap-4">

        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">

          <ShieldCheck className="h-5 w-5 flex-shrink-0 text-orange-400" />

          <span className="text-xs font-medium text-slate-200 sm:text-sm">

            Verified Vendors

          </span>

        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">

          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-orange-400" />

          <span className="text-xs font-medium text-slate-200 sm:text-sm">

            PAN India Service

          </span>

        </div>

      </div>

      {/* COUNTERS */}
      <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4">

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center backdrop-blur-xl">

          <div className="text-xl font-bold text-orange-400 sm:text-2xl">

            <AnimatedCounter endValue={15000} />+

          </div>

          <p className="mt-1 text-[11px] text-slate-300 sm:text-sm">

            Moves Completed

          </p>

        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center backdrop-blur-xl">

          <div className="text-xl font-bold text-orange-400 sm:text-2xl">

            <AnimatedCounter endValue={120} />+

          </div>

          <p className="mt-1 text-[11px] text-slate-300 sm:text-sm">

            Cities Covered

          </p>

        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center backdrop-blur-xl">

          <div className="text-xl font-bold text-orange-400 sm:text-2xl">

            <AnimatedCounter endValue={8500} />+

          </div>

          <p className="mt-1 text-[11px] text-slate-300 sm:text-sm">

            Verified Vendors

          </p>

        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center backdrop-blur-xl">

          <div className="text-xl font-bold text-orange-400 sm:text-2xl">

            <AnimatedCounter endValue={4.9} />

          </div>

          <p className="mt-1 text-[11px] text-slate-300 sm:text-sm">

            Customer Rating

          </p>

        </div>

      </div>

    </div>

    {/* BOOKING FORM */}
    <div className="order-1 flex justify-center lg:order-2">

      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-2xl sm:p-8">

        <div className="mb-6">

          <h2 className="text-2xl font-bold text-white">

            Get Instant Quote

          </h2>

          <p className="mt-2 text-sm text-slate-300">

            Receive quotations from verified movers instantly.

          </p>

        </div>

        <div className="space-y-4">

<select
  value={pickupCity}
  onChange={(e) => setPickupCity(e.target.value)}
  className="w-full rounded-lg border px-4 py-3"
>
  <option value="" disabled className="text-black">
    Select Pickup City
  </option>

  {cities.map((city) => (
    <option
      key={city}
      value={city}
      className="text-black"
    >
      {city}
    </option>
  ))}
</select>

<input
  type="text"
  placeholder="Enter Destination Pincode"
  value={destinationSearch}
  onChange={(e) => handlePincodeLookup(e.target.value)}
  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white"
/>
{destinationCity && (
  <div className="mt-2 rounded-lg border border-white/10 bg-white/5 p-3">
    <p className="text-white">
      City: {destinationCity}
    </p>

    <p className="text-white">
      State: {destinationState}
    </p>
  </div>
)}
{/* Pickup Date */}

<input
  type="date"
  min={new Date().toISOString().split("T")[0]}
className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
  value={shiftingDate}
  onChange={(e) => setShiftingDate(e.target.value)}
/>

{/* SHIFTING TYPE */}

<select
  value={shiftingType}
  onChange={(e) => setShiftingType(e.target.value)}
  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white"
>
  <option value="" disabled className="text-black">
    Select Shifting Type
  </option>

  <option value="Home" className="text-black">
    Home Shifting
  </option>

  <option value="Office" className="text-black">
    Office Relocation
  </option>

  <option value="Vehicle" className="text-black">
    Vehicle Transport
  </option>
</select>

{/* HOME SHIFTING */}

{shiftingType === "Home" && (
  <>
    {/* HOUSE TYPE */}

    <select
      value={houseType}
      onChange={(e) => setHouseType(e.target.value)}
      className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white"
    >
      <option value="" disabled className="text-black">
        Select House Type
      </option>

      <option value="1BHK" className="text-black">
        1 BHK
      </option>

      <option value="2BHK" className="text-black">
        2 BHK
      </option>

      <option value="3BHK" className="text-black">
        3 BHK
      </option>
<option value="4BHK" className="text-black">
        4 BHK
      </option>
      <option value="Villa" className="text-black">
        Villa
      </option>
<option value="IndependentHouse" className="text-black">
        Independent House
      </option>
    </select>

    {/* PICKUP FLOOR */}

    <select
      value={pickupFloor}
      onChange={(e) => setPickupFloor(e.target.value)}
      className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white"
    >
      <option value="" disabled className="text-black">
        Pickup Floor
      </option>

      <option value="Ground" className="text-black">
        Ground Floor
      </option>

      <option value="1" className="text-black">
        1st Floor
      </option>

      <option value="2" className="text-black">
        2nd Floor
      </option>

      <option value="3" className="text-black">
        3rd Floor
      </option>

      <option value="4+" className="text-black">
        4th Floor & Above
      </option>
    </select>

    {/* LIFT AVAILABLE */}

    <select
      value={liftAvailable}
      onChange={(e) => setLiftAvailable(e.target.value)}
      className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white"
    >
      <option value="" disabled className="text-black">
        Lift Available?
      </option>

      <option value="Yes" className="text-black">
        Yes
      </option>

      <option value="No" className="text-black">
        No
      </option>
    </select>

    {/* PACKING SERVICE */}

    <select
      value={packingRequired}
      onChange={(e) => setPackingRequired(e.target.value)}
      className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white"
    >
      <option value="" disabled className="text-black">
        Packing Service Required?
      </option>

      <option value="Yes" className="text-black">
        Yes
      </option>

      <option value="No" className="text-black">
        No
      </option>
    </select>
<select
  value={vehicleIncluded}
  onChange={(e) => setVehicleIncluded(e.target.value)}
  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white"
>
  <option value="" disabled>
    Vehicle Also Needs Transportation?
  </option>

  <option value="Yes" className="text-black">
    Yes
  </option>

  <option value="No" className="text-black">
    No
  </option>
</select>
</>
)}


{/* OFFICE RELOCATION */}

{shiftingType === "Office" && (
  <>
    <select
      value={officeSize}
      onChange={(e) => setOfficeSize(e.target.value)}
      className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white"
    >
      <option value="" disabled className="text-black">
        Select Office Type
      </option>

      <option value="Small" className="text-black">Small Office</option>
      <option value="Medium" className="text-black">Medium Office</option>
      <option value="Corporate" className="text-black">Corporate Office</option>
    </select>

    <select
      value={pickupFloor}
      onChange={(e) => setPickupFloor(e.target.value)}
      className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white"
    >
      <option value="" disabled>Select Pickup Floor</option>
      <option value="Ground" className="text-black">Ground Floor</option>
      <option value="1" className="text-black">1st Floor</option>
      <option value="2" className="text-black">2nd Floor</option>
      <option value="3" className="text-black">3rd Floor</option>
      <option value="4+" className="text-black">4th Floor & Above</option>
    </select>
 <select
      value={liftAvailable}
      onChange={(e) => setLiftAvailable(e.target.value)}
      className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white"
    >
      <option value="" disabled>Lift Available?</option>
      <option value="Yes" className="text-black">Yes</option>
      <option value="No" className="text-black">No</option>
</select>   
<select
  value={vehicleIncluded}
  onChange={(e) => setVehicleIncluded(e.target.value)}
  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white"
>
  <option value="" disabled className="text-black">
    Vehicle Also Needs Transportation?
  </option>

  <option value="Yes" className="text-black">
    Yes
  </option>

  <option value="No" className="text-black">
    No
  </option>
</select>
 </>

)}

{/* PLANTS INCLUDED */}

{(shiftingType === "Home" || shiftingType === "Office") && (
  <select
  value={plantsIncluded}
  onChange={(e) => setPlantsIncluded(e.target.value)}
  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white"
  >
    <option value="" disabled className="text-black">
      Plants Included?
    </option>

    <option value="Yes" className="text-black">
      Yes
    </option>

    <option value="No" className="text-black">
      No
    </option>
  </select>
)}
          <button
  type="button"
  onClick={() => setShowLeadPopup(true)}
  className="h-12 w-full rounded-xl bg-orange-500 text-sm font-semibold text-white transition hover:bg-orange-600"
>
  Get Free Quote
</button>

          {/* CTA BUTTONS */}
          <div className="grid grid-cols-2 gap-4">

            <a
              href="tel:+918959591603"
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >

              <Phone className="h-4 w-4" />

              Call Now

            </a>

            <a
              href="https://wa.me/918959591603"
              className="flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-green-600"
            >

              <MessageCircle className="h-4 w-4" />

              WhatsApp

            </a>

          </div>

        </div>

      </div>

    </div>

  </div>

{showLeadPopup && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#08122f] p-6 shadow-2xl">

      <div className="mb-5 text-center">

        <h3 className="text-2xl font-bold text-white">
          Almost Done!
        </h3>

        <p className="mt-2 text-sm text-slate-300">
          To provide accurate quotations from verified movers,
          please share a few details so we can serve you better.
        </p>

      </div>

      <div className="space-y-4">

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white"
        />

        <input
          type="tel"
          placeholder="Mobile Number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white"
        />

        <input
          type="email"
          placeholder="Email Address (Optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white"
        />
	

        <textarea
          rows={3}
          placeholder="Additional Requirements"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />

        <button
          type="button"
          onClick={handleQuoteSubmit}
          className="h-12 w-full rounded-xl bg-orange-500 font-semibold text-white hover:bg-orange-600"
        >
          Continue
        </button>

        <button
          type="button"
          onClick={() => setShowLeadPopup(false)}
          className="w-full text-sm text-slate-400 hover:text-white"
        >
          Cancel
        </button>

      </div>

    </div>

  </div>
)}

{showDecisionScreen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#08122f] p-6 shadow-2xl">

      <div className="text-center">

        <h3 className="text-2xl font-bold text-white">
  Thank You!
</h3>

<p className="mt-3 text-orange-400 font-semibold">
  Reference ID: {leadId}
</p>

        <p className="mt-3 text-slate-300">
          Your moving request has been received.
          How would you like to proceed?
        </p>

      </div>

      <div className="mt-6 space-y-4">

        <button
          type="button"
          onClick={() => {
            alert(
              "Thank you for choosing Easy Movers.\n\nOur relocation specialist will contact you shortly."
            )

            setShowDecisionScreen(false)

            setName("")
            setMobile("")
            setEmail("")
            setNotes("")
          }}
          className="h-12 w-full rounded-xl bg-orange-500 font-semibold text-white hover:bg-orange-600"
        >
          📞 Get Expert Callback
        </button>

        <button
  type="button"
  onClick={() => {
    setShowDecisionScreen(false)

    router.push(`/inventory/${leadId}`)
  }}
  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 font-semibold text-white hover:bg-white/10"
>
  📦 Provide Detailed Inventory
</button>
      </div>

    </div>

  </div>
)}
</section>
)
}