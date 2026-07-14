"use client"

import { useState } from "react"
import Link from "next/link"

export default function TrackPage() {
const [referenceId, setReferenceId] = useState("")
const [mobile, setMobile] = useState("")
const [lead, setLead] = useState<any>(null)
const [inventoryStatus, setInventoryStatus] =
  useState("NOT_STARTED")

const [completionPercentage, setCompletionPercentage] =
  useState(0)
const [loading, setLoading] = useState(false)

async function handleTrack() {
if (!referenceId || !mobile) {
alert("Please enter Reference ID and Mobile Number")
return
}

setLoading(true)

try {
  const response = await fetch("/api/track", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      referenceId,
      mobile,
    }),
  })

  const data = await response.json()

 if (data.success) {

  setLead(data.lead)

  setInventoryStatus(
    data.inventoryStatus || "NOT_STARTED"
  )

  setCompletionPercentage(
    data.completionPercentage || 0
  )

} else {
    setLead(null)
    alert(data.message)
  }
} catch (error) {
  console.error(error)
  alert("Unable to track request")
}

setLoading(false)

}

const getStatusBadge = (status: string) => {
switch (status) {
case "NEW":
return "🟡 Request Received"
case "CONTACTED":
return "🔵 Contacted"
case "QUOTE_SENT":
return "🟣 Quotation Sent"
case "BOOKED":
return "🟢 Booking Confirmed"
case "IN_TRANSIT":
return "🚚 In Transit"
case "DELIVERED":
return "✅ Delivered"
default:
return status
}
}

return ( <main className="min-h-screen bg-black text-white"> <div className="mx-auto max-w-3xl px-6 py-20">

    <h1 className="mb-2 text-4xl font-bold">
      Track My Move
    </h1>

    <p className="mb-8 text-white/70">
      Enter your Reference ID and Registered Mobile Number
    </p>

    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">

      <input
        type="text"
        placeholder="Reference ID (EM250001)"
        value={referenceId}
        onChange={(e) => setReferenceId(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-white outline-none"
      />

      <input
        type="text"
        placeholder="Registered Mobile Number"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-white outline-none"
      />

      <button
        onClick={handleTrack}
        className="rounded-lg bg-orange-500 px-6 py-3 font-semibold"
      >
        {loading ? "Searching..." : "Track Request"}
      </button>

    </div>

    {lead && (
      <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6">

        <h2 className="mb-6 text-2xl font-bold">
          Request Details
        </h2>

        <div className="space-y-3">

          <p>
            <strong>Reference ID:</strong>{" "}
            {lead.referenceId}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            {getStatusBadge(lead.status)}
          </p>

          <p>
            <strong>Customer:</strong>{" "}
            {lead.name}
          </p>

          <p>
            <strong>Pickup City:</strong>{" "}
            {lead.pickupCity}
          </p>

          <p>
            <strong>Destination City:</strong>{" "}
            {lead.destinationCity}
          </p>

          <p>
            <strong>Move Type:</strong>{" "}
            {lead.shiftingType}
          </p>

          <p>
            <strong>Moving Date:</strong>{" "}
            {lead.shiftingDate}
          </p>

          <p>
            <strong>Created:</strong>{" "}
            {new Date(
              lead.createdAt
            ).toLocaleString()}
          </p>

          <p>
            <strong>Last Updated:</strong>{" "}
            {new Date(
              lead.lastUpdatedAt
            ).toLocaleString()}
          </p>

<Link
  href="/"
  className="text-amber-600 font-medium"
>
  ← Back to Home
</Link>

        </div>
      </div>
    )}

  </div>
</main>


)
}
