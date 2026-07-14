
"use client"

import {
  ClipboardList,
  Camera,
  Video,
  CheckCircle2
} from "lucide-react"

export type InventoryMethodType =
  | "MANUAL"
  | "PHOTO"
  | "VIDEO"

interface InventoryMethodProps {

  value: InventoryMethodType

  onChange: (
    value: InventoryMethodType
  ) => void

}

const options = [

  {

    id: "MANUAL" as InventoryMethodType,

    title: "Add Inventory Manually",

    description:
      "Create your inventory using smart search and categories.",

    icon: ClipboardList,

    color:
      "border-blue-500 bg-blue-50"

  },

  {

    id: "PHOTO" as InventoryMethodType,

    title: "Upload Room Photos",

    description:
      "Upload room photographs and our experts will prepare the inventory.",

    icon: Camera,

    color:
      "border-orange-500 bg-orange-50"

  },

  {

    id: "VIDEO" as InventoryMethodType,

    title: "Request Video Survey",

    description:
      "Schedule a video call with our inventory expert.",

    icon: Video,

    color:
      "border-green-500 bg-green-50"

  }

]

export default function InventoryMethod({

  value,

  onChange

}: InventoryMethodProps) {

  return (

    <section className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">

      <div className="mb-6">

        <h2 className="text-xl font-bold text-slate-800">

          Choose Inventory Method

        </h2>

        <p className="mt-2 text-sm text-slate-500">

          Select the most convenient way to provide your inventory.

        </p>

      </div>

      <div className="grid gap-5 lg:grid-cols-3">

        {options.map((option) => {

          const Icon = option.icon

          const selected =
            value === option.id

          return (

            <button
              key={option.id}
              type="button"
              onClick={() =>
                onChange(option.id)
              }
              className={`relative rounded-2xl border-2 p-6 text-left transition-all duration-200 hover:shadow-md ${
                selected
                  ? option.color
                  : "border-slate-200 hover:border-blue-300"
              }`}
            >

              {selected && (

                <CheckCircle2
                  className="absolute right-4 top-4 text-green-600"
                  size={24}
                />

              )}

              <div className="mb-5">

                <Icon
                  size={36}
                  className="text-blue-600"
                />

              </div>

              <h3 className="text-lg font-semibold text-slate-800">

                {option.title}

              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">

                {option.description}

              </p>

            </button>

          )

        })}

      </div>

    </section>

  )

}
 
