
"use client"

import {
  CheckCircle2,
  Circle
} from "lucide-react"

interface ProgressStepperProps {

  currentStep: number

}

const steps = [

  "Lead Details",

  "Inventory",

  "Review",

  "Quotation"

]

export default function ProgressStepper({

  currentStep

}: ProgressStepperProps) {

  return (

    <section className="mb-8 rounded-2xl border border-slate-200 bg-white shadow-sm p-6">

      <div className="flex items-center justify-between">

        {steps.map((step, index) => {

          const stepNumber = index + 1

          const completed = stepNumber < currentStep

          const active = stepNumber === currentStep

          return (

            <div
              key={step}
              className="flex flex-1 items-center"
            >

              <div className="flex flex-col items-center">

                {completed ? (

                  <CheckCircle2
                    size={34}
                    className="text-green-600"
                  />

                ) : active ? (

                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white font-bold shadow">

                    {stepNumber}

                  </div>

                ) : (

                  <Circle
                    size={32}
                    className="text-slate-300"
                  />

                )}

                <span
                  className={`mt-2 text-sm font-medium text-center ${
                    active
                      ? "text-blue-700"
                      : completed
                      ? "text-green-700"
                      : "text-slate-500"
                  }`}
                >

                  {step}

                </span>

              </div>

              {index < steps.length - 1 && (

                <div
                  className={`mx-3 h-1 flex-1 rounded-full ${
                    completed
                      ? "bg-green-600"
                      : "bg-slate-200"
                  }`}
                />

              )}

            </div>

          )

        })}

      </div>

    </section>

  )

}
 
