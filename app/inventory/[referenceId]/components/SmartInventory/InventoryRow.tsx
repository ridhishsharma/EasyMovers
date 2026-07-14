 
"use client"

import {

  Pencil,

  Trash2,

  Package,

  Hash

} from "lucide-react"

import { InventoryItem } from "./SmartInventory"

interface InventoryRowProps {

  item: InventoryItem

  onEdit: (
    item: InventoryItem
  ) => void

  onDelete: (
    id: string
  ) => void

}

export default function InventoryRow({

  item,

  onEdit,

  onDelete

}: InventoryRowProps) {

  return (

    <div className="flex flex-col gap-4 p-5 transition-all hover:bg-slate-50 md:flex-row md:items-center md:justify-between">

      {/* Left Section */}

      <div className="flex items-start gap-4">

        {/* Icon */}

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">

          <Package
            size={24}
            className="text-blue-700"
          />

        </div>

        {/* Details */}

        <div>

          <h3 className="text-lg font-semibold text-slate-800">

            {item.itemName}

          </h3>

          <div className="mt-1 flex flex-wrap gap-3">

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">

              {item.category}

            </span>

            <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">

              <Hash size={12} />

              Qty {item.quantity}

            </span>

          </div>

        </div>

      </div>

      {/* Right Section */}

      <div className="flex gap-3">

        <button

          type="button"

          onClick={() =>
            onEdit(item)
          }

          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"

        >

          <Pencil size={16} />

          Edit

        </button>

        <button

          type="button"

          onClick={() =>

            item.id &&

            onDelete(item.id)

          }

          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"

        >

          <Trash2 size={16} />

          Delete

        </button>

      </div>

    </div>

  )

}
 
