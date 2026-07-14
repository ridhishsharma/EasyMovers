"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

const installationOptions = [
  "Assembly",
  "Disassembly",
  "Packing",
  "Unpacking",
  "Furniture Installation"
]

const additionalOptions = [
  "Storage",
  "Packing Materials",
  "Insurance",
  "Manpower"
]

export default function DestinationPage() {
  const params = useParams()
  const router = useRouter()
  const referenceId = (params.referenceId as string) ?? ""

  const [customerName, setCustomerName] = useState("")
  const [pickupCity, setPickupCity] = useState("")
  const [destinationCity, setDestinationCity] = useState("")
  const [moveType, setMoveType] = useState("")
  const [propertyType, setPropertyType] = useState("")
  const [floorNumber, setFloorNumber] = useState(0)
  const [liftAvailable, setLiftAvailable] = useState(false)
  const [parkingDistance, setParkingDistance] = useState("")
  const [installationServices, setInstallationServices] = useState<string[]>([])
  const [additionalServices, setAdditionalServices] = useState<string[]>([])
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [callbackRequested, setCallbackRequested] = useState(false)
  const [callbackSlot, setCallbackSlot] = useState("ANY_TIME")
  const [isSaving, setIsSaving] = useState(false)

  async function loadLeadDetails() {
    try {
      const response = await fetch(`/api/inventory?referenceId=${referenceId}`)
      const data = await response.json()

      if (data.success && data.inventory?.lead) {
        setCustomerName(data.inventory.lead.name ?? "")
        setPickupCity(data.inventory.lead.pickupCity ?? "")
        setDestinationCity(data.inventory.lead.destinationCity ?? "")
        setMoveType(data.inventory.lead.shiftingType ?? "")
      }
    } catch (error) {
      console.error(error)
    }
  }

  function toggleSelection(
    value: string,
    current: string[],
    setter: (value: string[]) => void
  ) {
    if (current.includes(value)) {
      setter(current.filter((item) => item !== value))
    } else {
      setter([...current, value])
    }
  }

  async function saveDraft() {
    setIsSaving(true)

    try {
      const response = await fetch("/api/destination", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          referenceId,
          propertyType,
          floorNumber,
          liftAvailable,
          parkingDistance,
          installationServices,
          additionalServices,
          specialInstructions
        })
      })

      const data = await response.json()

      if (data.success) {
        alert("Destination details saved successfully")
      } else {
        alert(data.message ?? "Unable to save draft")
      }
    } catch (error) {
      console.error(error)
      alert("Unable to save draft")
    } finally {
      setIsSaving(false)
    }
  }

  async function submitDestination() {
    if (!propertyType) {
      alert("Please select property type")
      return
    }

    await saveDraft()
    router.push(`/review/${referenceId}`)
  }

  function callExpert() {
    setCallbackRequested(true)
  }

  useEffect(() => {
    if (referenceId) {
      void loadLeadDetails()
    }
  }, [referenceId])

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Destination Details</h1>
          <p className="text-slate-500">Complete destination information</p>
        </div>

        <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-800">Customer Information</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-slate-500">Reference ID</label>
              <p className="font-semibold text-slate-800">{referenceId}</p>
            </div>

            <div>
              <label className="text-sm text-slate-500">Customer Name</label>
              <p className="font-semibold text-slate-800">{customerName}</p>
            </div>

            <div>
              <label className="text-sm text-slate-500">Pickup City</label>
              <p className="font-semibold text-slate-800">{pickupCity}</p>
            </div>

            <div>
              <label className="text-sm text-slate-500">Destination City</label>
              <p className="font-semibold text-slate-800">{destinationCity}</p>
            </div>

            <div>
              <label className="text-sm text-slate-500">Move Type</label>
              <p className="font-semibold text-slate-800">{moveType}</p>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-slate-800">Property Details</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Property Type
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-slate-800"
              >
                <option value="">Select Property Type</option>
                <option value="Apartment">Apartment</option>
                <option value="Independent House">Independent House</option>
                <option value="Villa">Villa</option>
                <option value="Office">Office</option>
                <option value="Warehouse">Warehouse</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Floor Number
              </label>
              <input
                type="number"
                min={0}
                value={floorNumber}
                onChange={(e) => setFloorNumber(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 p-3 text-slate-800"
                placeholder="0 = Ground Floor"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Lift Available
              </label>
              <select
                value={liftAvailable ? "YES" : "NO"}
                onChange={(e) => setLiftAvailable(e.target.value === "YES")}
                className="w-full rounded-xl border border-slate-300 p-3 text-slate-800"
              >
                <option value="YES">Yes</option>
                <option value="NO">No</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Parking Distance
              </label>
              <select
                value={parkingDistance}
                onChange={(e) => setParkingDistance(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-slate-800"
              >
                <option value="">Select Distance</option>
                <option value="Near Entrance">Near Entrance</option>
                <option value="20-50 Meters">20-50 Meters</option>
                <option value="50-100 Meters">50-100 Meters</option>
                <option value="More than 100 Meters">More than 100 Meters</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-slate-800">Services</h2>

          <div className="mb-6">
            <h3 className="mb-3 text-lg font-medium text-slate-700">Installation Services</h3>
            <div className="flex flex-wrap gap-3">
              {installationOptions.map((option) => {
                const checked = installationServices.includes(option)
                return (
                  <label key={option} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelection(option, installationServices, setInstallationServices)}
                    />
                    <span>{option}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-medium text-slate-700">Additional Services</h3>
            <div className="flex flex-wrap gap-3">
              {additionalOptions.map((option) => {
                const checked = additionalServices.includes(option)
                return (
                  <label key={option} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelection(option, additionalServices, setAdditionalServices)}
                    />
                    <span>{option}</span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-800">Special Instructions</h2>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            className="min-h-[120px] w-full rounded-xl border border-slate-300 p-4"
            placeholder="Add any special requirements"
          />
        </div>

        <div className="mb-8 h-[180px] rounded-2xl border bg-white p-6 shadow-sm">
          <label className="flex items-center gap-2 text-slate-800">
            <input
              type="checkbox"
              checked={callbackRequested}
              onChange={(e) => setCallbackRequested(e.target.checked)}
            />
            <span>Request Expert Callback</span>
          </label>

          {callbackRequested && (
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Preferred Callback Time
              </label>
              <select
                value={callbackSlot}
                onChange={(e) => setCallbackSlot(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-slate-800"
              >
                <option value="IMMEDIATE">Immediate</option>
                <option value="MORNING">Morning (9 AM - 12 PM)</option>
                <option value="AFTERNOON">Afternoon (12 PM - 4 PM)</option>
                <option value="EVENING">Evening (4 PM - 8 PM)</option>
                <option value="ANY_TIME">Any Time</option>
              </select>
            </div>
          )}
        </div>

        <div className="border-t pt-6">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={callExpert}
              className="h-12 min-w-[160px] rounded-xl bg-green-600 text-white"
            >
              📞 Call Expert
            </button>
            <button
              type="button"
              onClick={() => void saveDraft()}
              disabled={isSaving}
              className="h-12 min-w-[160px] rounded-xl bg-slate-700 text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Saving..." : "Save Draft"}
            </button>
            <button
              type="button"
              onClick={() => void submitDestination()}
              className="h-12 min-w-[220px] rounded-xl bg-orange-500 text-white"
            >
              Submit Destination Details
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}