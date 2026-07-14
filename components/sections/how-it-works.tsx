import {
  SearchCheck,
  ClipboardList,
  Truck,
  House,
} from "lucide-react"

const steps = [
  {
    icon: SearchCheck,
    step: "01",
    title: "Submit Move Details",
    description:
      "Enter pickup city, destination, move size, and shifting date.",
  },
  {
    icon: ClipboardList,
    step: "02",
    title: "Compare Quotes",
    description:
      "Receive instant quotations from verified packers and movers.",
  },
  {
    icon: Truck,
    step: "03",
    title: "Track Your Shipment",
    description:
      "Monitor your goods with live tracking and move updates.",
  },
  {
    icon: House,
    step: "04",
    title: "Safe Delivery",
    description:
      "Get secure and timely delivery with insurance protection.",
  },
]

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-24 bg-gradient-to-b from-slate-50 to-white"
    >

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto">

          <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-5">
            Simple Process
          </span>

          <h2 className="text-4xl font-bold tracking-tight text-gray-900">
            How EasyMovers Works
          </h2>

          <p className="mt-5 text-lg text-gray-600 leading-relaxed">
            Our technology-driven relocation process makes
            moving safer, faster, and completely hassle-free.
          </p>
        </div>

        {/* STEPS */}
        <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-4">

          {steps.map((item, index) => {
            const Icon = item.icon

            return (
              <div
                key={index}
                className="relative rounded-3xl bg-white border border-gray-200 p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >

                {/* STEP NUMBER */}
                <div className="absolute top-5 right-5 text-5xl font-bold text-gray-100">
                  {item.step}
                </div>

                {/* ICON */}
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
                  <Icon className="h-8 w-8" />
                </div>

                {/* TITLE */}
                <h3 className="text-xl font-semibold text-gray-900">
                  {item.title}
                </h3>

                {/* DESCRIPTION */}
                <p className="mt-4 text-gray-600 leading-relaxed">
                  {item.description}
                </p>

              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}