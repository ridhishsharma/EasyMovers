"use client"

import {

  Package,

  Wrench,

  Shield,

  Archive,

  Sparkles,

  Sofa,

  Truck,

  CheckCircle2

} from "lucide-react"

const services = [

  {
    id: "packing",
    title: "Packing Service",
    description: "Professional packing with quality materials.",
    icon: Package
  },

  {
    id: "unpacking",
    title: "Unpacking",
    description: "Complete unpacking after delivery.",
    icon: Sparkles
  },

  {
    id: "dismantling",
    title: "Dismantling",
    description: "Furniture dismantling before shifting.",
    icon: Wrench
  },

  {
    id: "installation",
    title: "Installation",
    description: "Reinstallation & furniture assembly.",
    icon: Sofa
  },

  {
    id: "insurance",
    title: "Transit Insurance",
    description: "Protect your belongings during transport.",
    icon: Shield
  },

  {
    id: "storage",
    title: "Storage Facility",
    description: "Temporary warehouse storage.",
    icon: Archive
  },

  {
    id: "vehicleTransport",
    title: "Vehicle Transport",
    description: "Car & Bike transportation.",
    icon: Truck
  }

]

interface ServiceSelectorProps {

  selectedServices: string[]

  setSelectedServices: React.Dispatch<
    React.SetStateAction<string[]>
  >

}

export default function ServiceSelector({

  selectedServices,

  setSelectedServices

}: ServiceSelectorProps) {

  function toggleService(id: string) {

    if (selectedServices.includes(id)) {

      setSelectedServices(

        selectedServices.filter(

          service => service !== id

        )

      )

    } else {

      setSelectedServices([

        ...selectedServices,

        id

      ])

    }

  }

  return (

    <section className="rounded-2xl border bg-white shadow-sm p-6">

      <div className="mb-6">

        <h2 className="text-xl font-bold text-slate-800">

          Additional Services

        </h2>

        <p className="text-sm text-slate-500">

          Select any services you would like us to include in your quotation.

        </p>

      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

        {services.map((service) => {

          const Icon = service.icon

          const selected =
            selectedServices.includes(service.id)

          return (

            <button

              key={service.id}

              type="button"

              onClick={() =>
                toggleService(service.id)
              }

              className={`relative rounded-2xl border-2 p-5 text-left transition-all duration-200 hover:shadow-md

              ${selected

                ? "border-blue-600 bg-blue-50"

                : "border-slate-200 bg-white"

              }`}

            >

              {selected && (

                <CheckCircle2

                  size={24}

                  className="absolute right-4 top-4 text-green-600"

                />

              )}

              <div className="mb-4">

                <Icon

                  size={34}

                  className="text-blue-700"

                />

              </div>

              <h3 className="text-lg font-semibold text-slate-800">

                {service.title}

              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">

                {service.description}

              </p>

            </button>

          )

        })}

      </div>

    </section>

  )

}
 
