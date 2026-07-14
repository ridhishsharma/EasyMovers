"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { inventoryMaster } from "@/lib/inventory-master"
import CustomerSummary from "./components/CustomerSummary"
import ActionBar from "./components/ActionBar"
import CallbackCard from "./components/CallbackCard"
import useLead from "@/hooks/useLead"

interface InventoryItem {
  id: string
  category: string
  itemName: string
  quantity: number
  fragile: boolean
  requiresPacking: boolean
}

export default function InventoryPage() {
  const params = useParams()
  const router = useRouter()
  const referenceId = (params.referenceId as string) || ""

  const [customerName, setCustomerName] = useState("")
  const [mobile, setMobile] = useState("")
  const [pickupCity, setPickupCity] = useState("")
  const [destinationCity, setDestinationCity] = useState("")
  const [moveType, setMoveType] = useState("")
  const [moveDate, setMoveDate] = useState("")
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [inventoryError, setInventoryError] = useState("")

  const [remarks, setRemarks] = useState("")
  const [packingType, setPackingType] = useState("")
  const [specialHandling, setSpecialHandling] = useState<string[]>([])
  const [additionalServices, setAdditionalServices] = useState<string[]>([])
  const [preMoveServices, setPreMoveServices] = useState<string[]>([])

  const [inventoryId, setInventoryId] = useState("")
  const [items, setItems] = useState<InventoryItem[]>([])
  const [category, setCategory] = useState("Furniture")
  const [itemName, setItemName] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [fragile, setFragile] = useState(false)
  const [requiresPacking, setRequiresPacking] = useState(true)

  const [status, setStatus] = useState("DRAFT")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [callbackRequested, setCallbackRequested] = useState(false)
  const [callbackDate, setCallbackDate] = useState("")
  const [callbackTime, setCallbackTime] = useState("")
  const [callbackRemarks, setCallbackRemarks] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { lead, loading: leadLoading, error: leadError } = useLead(referenceId)

  const filteredItems = useMemo(() => {
    if (!itemName.trim()) return []

    const categoryItems =
      (inventoryMaster[category as keyof typeof inventoryMaster] as Array<{ name: string; icon?: string }>) || []

    return categoryItems
      .filter((item) => item.name.toLowerCase().includes(itemName.toLowerCase()))
      .slice(0, 8)
  }, [category, itemName])

  useEffect(() => {
    if (!lead) return

    setCustomerName(lead.customerName || "")
    setMobile(lead.mobileNumber || "")
    setPickupCity(lead.pickupCity || "")
    setDestinationCity(lead.destinationCity || "")
    setMoveType(lead.moveType || "")
    setMoveDate(lead.movingDate || "")
  }, [lead])

  useEffect(() => {
    if (!referenceId) return
    void loadInventory()
  }, [referenceId])

  useEffect(() => {
    setCompletionPercentage(calculateCompletion())
  }, [items, packingType, remarks, specialHandling, additionalServices, preMoveServices])

  async function loadInventory() {
    if (!referenceId) return

    try {
      setLoading(true)
      setInventoryError("")

      const response = await fetch(`/api/inventory?referenceId=${referenceId}`)
      const data = await response.json()

      if (data.success && data.inventory) {
        setInventoryId(data.inventory.id || "")
        setRemarks(data.inventory.remarks || "")
        setPackingType(data.inventory.packingType || "")
        setSpecialHandling(data.inventory.specialHandling || [])
        setAdditionalServices(data.inventory.additionalServices || [])
        setPreMoveServices(data.inventory.preMoveServices || [])
        setStatus(data.inventory.status || "DRAFT")

        if (data.inventory.id) {
          await loadInventoryItems(data.inventory.id)
        }
      }
    } catch (error) {
      console.error(error)
      setInventoryError("Unable to load inventory details right now.")
    } finally {
      setLoading(false)
    }
  }

  async function loadInventoryItems(id: string) {
    try {
      const response = await fetch(`/api/inventory-items?inventoryId=${id}`)
      const data = await response.json()

      if (data.success) {
        setItems(Array.isArray(data.items) ? data.items : [])
      }
    } catch (error) {
      console.error(error)
    }
  }

  async function saveDraft() {
    if (!inventoryId) {
      alert("Inventory record not created yet.")
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch("/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryId,
          status: "DRAFT",
          remarks,
          packingType,
          specialHandling,
          preMoveServices,
          additionalServices,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setStatus("DRAFT")
        alert("Draft saved successfully")
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  async function submitInventory() {
    if (!inventoryId) {
      alert("Inventory record not created yet.")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryId,
          status: "COMPLETED",
          completionPercentage: calculateCompletion(),
          remarks,
          packingType,
          specialHandling,
          preMoveServices,
          additionalServices,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setStatus("COMPLETED")
        alert("Inventory submitted successfully")
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  function calculateCompletion() {
    let progress = 0

    if (items.length > 0) progress += 40
    if (packingType) progress += 20
    if (specialHandling.length > 0 || preMoveServices.length > 0) progress += 10
    if (additionalServices.length > 0) progress += 10
    if (remarks.trim()) progress += 20

    return Math.min(progress, 100)
  }

  function callExpert() {
    window.location.href = "tel:+919999999999"
  }

  function continueToDestination() {
    router.push(`/destination/${referenceId}`)
  }

  async function addInventoryItem() {
    if (!inventoryId) {
      alert("Inventory record not created yet.")
      return
    }

    if (!itemName.trim()) {
      alert("Please enter item name")
      return
    }

    if (quantity <= 0) {
      alert("Quantity should be greater than 0")
      return
    }

    try {
      const response = await fetch("/api/inventory-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryId,
          category,
          itemName,
          quantity,
          fragile,
          requiresPacking,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setItemName("")
        setQuantity(1)
        setFragile(false)
        setRequiresPacking(true)
        await loadInventoryItems(inventoryId)
      }
    } catch (error) {
      console.error(error)
    }
  }

  async function deleteItem(itemId: string) {
    if (!itemId) {
      alert("Item ID is undefined")
      return
    }

    try {
      const response = await fetch(`/api/inventory-items?itemId=${itemId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        await loadInventoryItems(inventoryId)
      }
    } catch (error) {
      console.error(error)
    }
  }

  function toggleSpecialHandling(item: string) {
    setSpecialHandling((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    )
  }

  function toggleService(item: string) {
    setAdditionalServices((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    )
  }

  function togglePreMoveService(service: string) {
    setPreMoveServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    )
  }

  if (loading || leadLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading Inventory...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <CustomerSummary
            referenceId={referenceId}
            customerName={customerName}
            mobile={mobile}
            pickupCity={pickupCity}
            destinationCity={destinationCity}
            moveType={moveType}
            moveDate={moveDate}
            status={status === "COMPLETED" ? "Submitted" : status}
          />

          {leadError ? (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              {leadError}
            </div>
          ) : null}

          {inventoryError ? (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {inventoryError}
            </div>
          ) : null}

          <CallbackCard
            callbackRequested={callbackRequested}
            setCallbackRequested={setCallbackRequested}
            callbackDate={callbackDate}
            setCallbackDate={setCallbackDate}
            callbackTime={callbackTime}
            setCallbackTime={setCallbackTime}
            callbackRemarks={callbackRemarks}
            setCallbackRemarks={setCallbackRemarks}
          />

          <hr className="my-8" />

          <div className="mb-6 rounded-2xl border p-6">
            <h2 className="text-xl font-bold text-slate-800">Packing Preference</h2>
            <p className="mt-1 mb-5 text-sm text-slate-500">
              Select the packing quality required for your move.
            </p>

            <div className="space-y-4">
              {[
                { value: "STANDARD", label: "Standard Packing" },
                { value: "PREMIUM", label: "Premium Packing" },
                { value: "PREMIUM_PLUS", label: "Premium + Fragile Protection" },
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-2 text-slate-800 font-medium">
                  <input
                    type="radio"
                    value={option.value}
                    checked={packingType === option.value}
                    onChange={(e) => setPackingType(e.target.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6 rounded-2xl border p-6">
            <h2 className="text-xl font-bold text-slate-800">Dismantling Services Required</h2>
            <p className="mt-1 mb-5 text-sm text-slate-500">
              Select services required before transportation.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                "AC Dismantling",
                "RO Dismantling",
                "Geyser Dismantling",
                "TV Wall Mount Removal",
                "Washing Machine Disconnect",
                "Furniture Dismantling",
                "Office Workstation Dismantling",
              ].map((service) => (
                <label key={service} className="flex items-center gap-3 text-slate-800">
                  <input
                    type="checkbox"
                    checked={preMoveServices.includes(service)}
                    onChange={() => togglePreMoveService(service)}
                    className="h-4 w-4 accent-orange-500"
                  />
                  {service}
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6 rounded-2xl border p-6">
            <h2 className="text-xl font-bold text-slate-800">Add Household Items</h2>
            <p className="mb-5 text-sm text-slate-500">
              Add major items which need packing and transportation.
            </p>

            <div className="grid gap-4 md:grid-cols-12">
              <div className="md:col-span-3">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900"
                >
                  <option value="Furniture">Furniture</option>
                  <option value="Appliances">Appliances</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Vehicles">Vehicles</option>
                  <option value="Plants">Plants</option>
                  <option value="Fragile Items">Fragile Items</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div className="relative md:col-span-6">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Item Name</label>
                <input
                  value={itemName}
                  onChange={(e) => {
                    setItemName(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Type item name..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-slate-800"
                />

                {showSuggestions && itemName.trim() && filteredItems.length > 0 ? (
                  <div className="absolute left-0 right-0 z-50 mt-1 rounded-xl border bg-white shadow-lg">
                    {filteredItems.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        className="block w-full px-4 py-3 text-left text-slate-800 hover:bg-slate-100"
                        onClick={() => {
                          setItemName(item.name)
                          setShowSuggestions(false)
                        }}
                      >
                        {item.icon} {item.name}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="md:col-span-3">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 p-3 text-slate-800"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-slate-800 font-medium">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-orange-500"
                  checked={fragile}
                  onChange={(e) => setFragile(e.target.checked)}
                />
                Fragile Item
              </label>

              <label className="flex items-center gap-2 text-slate-800 font-medium">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-orange-500"
                  checked={requiresPacking}
                  onChange={(e) => setRequiresPacking(e.target.checked)}
                />
                Packing Required
              </label>
            </div>

            <button
              type="button"
              onClick={addInventoryItem}
              className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
              + Add Item
            </button>
          </div>

          <div className="mb-6 rounded-2xl border p-6">
            <h2 className="mb-4 text-xl font-semibold text-slate-800">Current Inventory</h2>

            {items.length === 0 ? (
              <p className="text-gray-500">No Items Added Yet</p>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <table className="w-full">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="bg-slate-100 p-3 text-left font-semibold text-slate-800">Category</th>
                      <th className="bg-slate-100 p-3 text-left font-semibold text-slate-800">Item</th>
                      <th className="bg-slate-100 p-3 text-center font-semibold text-slate-800">Qty</th>
                      <th className="bg-slate-100 p-3 text-center font-semibold text-slate-800">Fragile</th>
                      <th className="bg-slate-100 p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-3 text-slate-800">{item.category}</td>
                        <td className="p-3 text-slate-800">{item.itemName}</td>
                        <td className="p-3 text-center text-slate-800">{item.quantity}</td>
                        <td className="p-3 text-center text-slate-800">{item.fragile ? "Yes" : "No"}</td>
                        <td className="p-3 text-center">
                          <button type="button" onClick={() => deleteItem(item.id)} className="text-red-600 hover:text-red-700">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Special Instructions / Remarks
            </label>
            <textarea
              rows={5}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full rounded-xl border p-4 text-slate-800"
              placeholder="Mention fragile items, valuables, dismantling requirements, etc."
            />
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-start md:justify-between">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <label className="flex items-center gap-2 text-slate-800">
                <input
                  type="checkbox"
                  checked={callbackRequested}
                  onChange={(e) => setCallbackRequested(e.target.checked)}
                />
                Request Inventory Assistance Call
              </label>

              {callbackRequested ? (
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium">Preferred Callback Time</label>
                  <select
                    value={callbackTime}
                    onChange={(e) => setCallbackTime(e.target.value)}
                    className="w-full rounded-lg border p-2 text-slate-800"
                  >
                    <option value="">Select Time</option>
                    <option value="Morning">Morning (8AM - 12PM)</option>
                    <option value="Afternoon">Afternoon (12PM - 4PM)</option>
                    <option value="Evening">Evening (4PM - 8PM)</option>
                  </select>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={callExpert}
                className="h-12 min-w-[160px] rounded-xl border border-green-600 bg-white px-6 font-medium text-green-700 transition hover:bg-green-50"
              >
                📞 Call Expert
              </button>

              <button
                type="button"
                onClick={saveDraft}
                className="h-12 min-w-[160px] rounded-xl bg-slate-700 px-6 font-medium text-white"
              >
                {isSaving ? "Saving..." : "Save Draft"}
              </button>

              <button
                type="button"
                onClick={submitInventory}
                className="h-12 min-w-[180px] rounded-xl bg-orange-500 px-6 font-medium text-white hover:bg-orange-600"
              >
                {isSubmitting ? "Submitting..." : "Submit Inventory"}
              </button>

              <button
                type="button"
                onClick={continueToDestination}
                className="h-12 min-w-[220px] rounded-xl border border-green-600 bg-white px-6 font-medium text-blue-700 hover:bg-blue-50"
              >
                ➜ Continue to Destination Details
              </button>
            </div>
          </div>

          <ActionBar
            onCallExpert={callExpert}
            onSaveDraft={saveDraft}
            onSubmit={submitInventory}
            isSaving={isSaving}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  )
}
