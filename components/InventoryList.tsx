
"use client"

import { Package } from "lucide-react"
import InventoryRow from "./InventoryRow"
import { InventoryItem } from "./SmartInventory"

interface InventoryListProps {

  items: InventoryItem[]

  onEdit: (
    item: InventoryItem
  ) => void

  onDelete: (
    id: string
  ) => void

}

export default function InventoryList({

  items,

  onEdit,

  onDelete

}: InventoryListProps) {

  //------------------------------------------------

  if (items.length === 0) {

    return (

      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">

        <Package
          size={50}
          className="mx-auto text-slate-400"
        />

        <h3 className="mt-4 text-lg font-semibold text-slate-700">

          No Inventory Added Yet

        </h3>

        <p className="mt-2 text-sm text-slate-500">

          Start adding household or office items.

        </p>

      </div>

    )

  }

  //------------------------------------------------

  return (

    <div className="rounded-2xl border bg-white shadow-sm">

      {/* Header */}

      <div className="border-b px-6 py-4">

        <h2 className="text-xl font-bold text-slate-800">

          Added Inventory

        </h2>

        <p className="text-sm text-slate-500">

          {items.length} item(s) added

        </p>

      </div>

      {/* Rows */}

      <div className="divide-y">

        {items.map((item) => (

          <InventoryRow

            key={item.id}

            item={item}

            onEdit={onEdit}

            onDelete={onDelete}

          />

        ))}

      </div>

    </div>

  )

}
 
