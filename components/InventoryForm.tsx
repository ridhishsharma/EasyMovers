
"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Save, X } from "lucide-react"
import { InventoryItem } from "./SmartInventory"

interface InventoryFormProps {
  inventoryMaster: any
  editingItem: InventoryItem | null
  onAdd: (item: InventoryItem) => void
  onUpdate: (item: InventoryItem) => void
  onCancel: () => void
}

export default function InventoryForm({

  inventoryMaster,

  editingItem,

  onAdd,

  onUpdate,

  onCancel

}: InventoryFormProps) {

  //----------------------------------------

  const categories = useMemo(

    () => Object.keys(inventoryMaster ?? {}),

    [inventoryMaster]

  )

  //----------------------------------------

  const [category, setCategory] =
    useState(categories[0] ?? "")

  const [itemName, setItemName] =
    useState("")

  const [quantity, setQuantity] =
    useState(1)

  const [showSuggestions, setShowSuggestions] =
    useState(false)

  //----------------------------------------

  useEffect(() => {

    if (!editingItem) return

    setCategory(editingItem.category)

    setItemName(editingItem.itemName)

    setQuantity(editingItem.quantity)

  }, [editingItem])

  //----------------------------------------

  const suggestions = useMemo(() => {

    if (!category) return []

    const items =
      inventoryMaster?.[category] ?? []

    return items.filter((item: any) =>
      item.name
        .toLowerCase()
        .includes(itemName.toLowerCase())
    )

  }, [

    inventoryMaster,

    category,

    itemName

  ])

  //----------------------------------------

  function clearForm() {

    setItemName("")

    setQuantity(1)

    setShowSuggestions(false)

  }

  //----------------------------------------

  function handleSubmit() {

    if (!category) {

      alert("Select category")

      return

    }

    if (!itemName.trim()) {

      alert("Enter item name")

      return

    }

    if (quantity <= 0) {

      alert("Quantity should be greater than zero")

      return

    }

    const payload: InventoryItem = {

      id: editingItem?.id,

      category,

      itemName,

      quantity

    }

    if (editingItem) {

      onUpdate(payload)

    } else {

      onAdd(payload)

    }

    clearForm()

  }

  //----------------------------------------

  return (

    <div className="rounded-2xl border bg-white p-6 shadow-sm">

      <h2 className="text-xl font-bold text-slate-800">

        Add Inventory

      </h2>

      <p className="mt-1 text-sm text-slate-500">

        Search items quickly and build inventory.

      </p>

      <div className="mt-6 grid gap-5 md:grid-cols-12">

        {/* Category */}

        <div className="md:col-span-3">

          <label className="mb-2 block text-sm font-semibold">

            Category

          </label>

          <select

            value={category}

            onChange={(e) =>
              setCategory(e.target.value)
            }

            className="w-full rounded-xl border border-slate-300 p-3"

          >

            {categories.map((cat) => (

              <option

                key={cat}

                value={cat}

              >

                {cat}

              </option>

            ))}

          </select>

        </div>

        {/* Item */}

        <div className="relative md:col-span-6">

          <label className="mb-2 block text-sm font-semibold">

            Item Name

          </label>

          <input

            value={itemName}

            onFocus={() =>
              setShowSuggestions(true)
            }

            onBlur={() =>
              setTimeout(

                () =>
                  setShowSuggestions(false),

                150

              )
            }

            onChange={(e) => {

              setItemName(e.target.value)

              setShowSuggestions(true)

            }}

            placeholder="Start typing item name..."

            className="w-full rounded-xl border border-slate-300 p-3"

          />

          {showSuggestions &&

            itemName.length > 0 &&

            suggestions.length > 0 && (

              <div className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border bg-white shadow-lg">

                {suggestions.map((item: any) => (

                  <button

                    key={item.name}

                    type="button"

                    className="block w-full px-4 py-3 text-left hover:bg-slate-100"

                    onClick={() => {

                      setItemName(item.name)

                      setShowSuggestions(false)

                    }}

                  >

                    {item.icon} {item.name}

                  </button>

                ))}

              </div>

            )}

        </div>

        {/* Quantity */}

        <div className="md:col-span-2">

          <label className="mb-2 block text-sm font-semibold">

            Qty

          </label>

          <input

            type="number"

            min={1}

            value={quantity}

            onChange={(e) =>
              setQuantity(Number(e.target.value))
            }

            className="w-full rounded-xl border border-slate-300 p-3"

          />

        </div>

        {/* Button */}

        <div className="flex items-end md:col-span-1">

          <button

            type="button"

            onClick={handleSubmit}

            className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700"

          >

            {editingItem ? (

              <Save size={20} />

            ) : (

              <Plus size={20} />

            )}

          </button>

        </div>

      </div>

      {editingItem && (

        <div className="mt-4">

          <button

            type="button"

            onClick={() => {

              clearForm()

              onCancel()

            }}

            className="inline-flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2 text-red-600"

          >

            <X size={18} />

            Cancel Editing

          </button>

        </div>

      )}

    </div>

  )

}
 
