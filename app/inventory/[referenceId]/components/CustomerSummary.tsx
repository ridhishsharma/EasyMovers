
"use client"

import {

  User,

  Phone,

  MapPin,

  CalendarDays,

  Truck,

  BadgeCheck,

  ArrowRight

} from "lucide-react"

interface CustomerSummaryProps {

  referenceId: string

  customerName: string

  mobile: string

  pickupCity: string

  destinationCity: string

  moveType: string

  moveDate: string

  status?: string

}

export default function CustomerSummary({

  referenceId,

  customerName,

  mobile,

  pickupCity,

  destinationCity,

  moveType,

  moveDate,

  status = "Draft"

}: CustomerSummaryProps) {

  const statusColor =

    status === "Submitted"

      ? "bg-green-100 text-green-700"

      : "bg-orange-100 text-orange-700"

  return (

    <section className="mb-8 rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* Header */}

      <div className="flex flex-col gap-4 border-b border-slate-200 p-6 md:flex-row md:items-center md:justify-between">

        <div>

          <h2 className="text-2xl font-bold text-slate-800">

            Move Summary

          </h2>

          <p className="text-sm text-slate-500">

            Review your booking details before continuing.

          </p>

        </div>

        <div className="text-left md:text-right">

          <p className="text-xs uppercase tracking-wide text-slate-500">

            Reference ID

          </p>

          <p className="text-xl font-bold text-blue-700">

            {referenceId}

          </p>

        </div>

      </div>

      {/* Main Grid */}

      <div className="grid gap-6 p-6 md:grid-cols-2 lg:grid-cols-4">

        {/* Customer */}

        <div>

          <div className="mb-3 flex items-center gap-2">

            <User

              size={18}

              className="text-blue-600"

            />

            <span className="font-semibold text-slate-700">

              Customer

            </span>

          </div>

          <p className="font-semibold text-slate-900">

            {customerName}

          </p>

          <div className="mt-2 flex items-center gap-2 text-slate-600">

            <Phone size={16} />

            <span>{mobile}</span>

          </div>

        </div>

        {/* Route */}

        <div>

          <div className="mb-3 flex items-center gap-2">

            <MapPin

              size={18}

              className="text-orange-600"

            />

            <span className="font-semibold text-slate-700">

              Route

            </span>

          </div>

          <div className="flex items-center gap-2 font-semibold text-slate-900">

            <span>{pickupCity}</span>

            <ArrowRight

              size={18}

              className="text-slate-400"

            />

            <span>{destinationCity}</span>

          </div>

        </div>

        {/* Move */}

        <div>

          <div className="mb-3 flex items-center gap-2">

            <Truck

              size={18}

              className="text-green-600"

            />

            <span className="font-semibold text-slate-700">

              Move

            </span>

          </div>

          <p className="font-semibold text-slate-900">

            {moveType}

          </p>

          <div className="mt-2 flex items-center gap-2 text-slate-600">

            <CalendarDays size={16} />

            <span>{moveDate}</span>

          </div>

        </div>

        {/* Status */}

        <div>

          <div className="mb-3 flex items-center gap-2">

            <BadgeCheck

              size={18}

              className="text-purple-600"

            />

            <span className="font-semibold text-slate-700">

              Booking Status

            </span>

          </div>

          <span

            className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${statusColor}`}

          >

            {status}

          </span>

        </div>

      </div>

    </section>

  )

}
 
