"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    question: "How do I get moving quotations?",
    answer:
      "Simply enter your pickup city, destination, and moving details to receive instant quotations from verified packers and movers.",
  },
  {
    question: "Are the movers verified?",
    answer:
      "Yes. Every vendor on EasyMovers undergoes KYC verification, business validation, and service quality checks.",
  },
  {
    question: "Do you provide insurance coverage?",
    answer:
      "Yes. Transit insurance options are available to protect your belongings during relocation.",
  },
  {
    question: "Can I track my shipment live?",
    answer:
      "Yes. Our platform provides real-time shipment tracking and status updates.",
  },
  {
    question: "Do you support office relocation?",
    answer:
      "Absolutely. We provide dedicated corporate and office relocation services across India.",
  },
  {
    question: "Which cities do you serve?",
    answer:
      "EasyMovers currently operates across 120+ cities throughout India.",
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="py-24 bg-slate-50">

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="text-center">

          <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-5">
            Frequently Asked Questions
          </span>

          <h2 className="text-4xl font-bold text-gray-900">
            Everything You Need To Know
          </h2>

          <p className="mt-5 text-lg text-gray-600">
            Find answers to common relocation and moving questions.
          </p>
        </div>

        {/* FAQ LIST */}
        <div className="mt-14 space-y-4">

          {faqs.map((faq, index) => {
            const isOpen = openIndex === index

            return (
              <div
                key={index}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
              >

                <button
                  onClick={() =>
                    setOpenIndex(isOpen ? null : index)
                  }
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >

                  <span className="text-lg font-semibold text-gray-900">
                    {faq.question}
                  </span>

                  <ChevronDown
                    className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />

                </button>

                {isOpen && (
                  <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                )}

              </div>
            )
          })}

        </div>

      </div>
    </section>
  )
}