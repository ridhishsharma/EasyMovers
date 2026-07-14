 
"use client"

interface PropertyDetailsProps {

  property: {

    propertyType: string

    pickupFloor: number

    destinationFloor: number

    liftAvailable: boolean

    parkingDistance: string

    sameProperty: boolean

    specialInstructions: string

  }

  setProperty: React.Dispatch<
    React.SetStateAction<any>
  >

}

export default function PropertyDetails({

  property,

  setProperty

}: PropertyDetailsProps) {

  function updateField(

    field: string,

    value: any

  ) {

    setProperty((previous: any) => ({

      ...previous,

      [field]: value

    }))

  }

  return (

    <section className="rounded-2xl border bg-white shadow-sm p-6">

      <div className="mb-6">

        <h2 className="text-xl font-bold text-slate-800">

          Property Details

        </h2>

        <p className="text-sm text-slate-500">

          This information helps us estimate manpower and vehicle requirements.

        </p>

      </div>

      <div className="grid gap-5 md:grid-cols-2">

        {/* Property Type */}

        <div>

          <label className="mb-2 block text-sm font-semibold">

            Property Type

          </label>

          <select

            value={property.propertyType}

            onChange={(e) =>

              updateField(

                "propertyType",

                e.target.value

              )

            }

            className="w-full rounded-xl border border-slate-300 p-3"

          >

            <option value="">

              Select Property

            </option>

            <option value="Apartment">

              Apartment

            </option>

            <option value="Independent House">

              Independent House

            </option>

            <option value="Villa">

              Villa

            </option>

            <option value="Office">

              Office

            </option>

            <option value="Warehouse">

              Warehouse

            </option>

          </select>

        </div>

        {/* Parking */}

        <div>

          <label className="mb-2 block text-sm font-semibold">

            Parking Distance

          </label>

          <select

            value={property.parkingDistance}

            onChange={(e) =>

              updateField(

                "parkingDistance",

                e.target.value

              )

            }

            className="w-full rounded-xl border border-slate-300 p-3"

          >

            <option value="">

              Select Distance

            </option>

            <option>

              At Door

            </option>

            <option>

              Within 25 m

            </option>

            <option>

              25–50 m

            </option>

            <option>

              More than 50 m

            </option>

          </select>

        </div>

        {/* Pickup Floor */}

        <div>

          <label className="mb-2 block text-sm font-semibold">

            Pickup Floor

          </label>

          <input

            type="number"

            min={0}

            value={property.pickupFloor}

            onChange={(e) =>

              updateField(

                "pickupFloor",

                Number(e.target.value)

              )

            }

            className="w-full rounded-xl border border-slate-300 p-3"

          />

        </div>

        {/* Destination Floor */}

        <div>

          <label className="mb-2 block text-sm font-semibold">

            Destination Floor

          </label>

          <input

            disabled={property.sameProperty}

            type="number"

            min={0}

            value={property.destinationFloor}

            onChange={(e) =>

              updateField(

                "destinationFloor",

                Number(e.target.value)

              )

            }

            className="w-full rounded-xl border border-slate-300 p-3"

          />

        </div>

      </div>

      {/* Same Property */}

      <div className="mt-5">

        <label className="flex items-center gap-3">

          <input

            type="checkbox"

            checked={property.sameProperty}

            onChange={(e) =>

              updateField(

                "sameProperty",

                e.target.checked

              )

            }

          />

          <span className="text-sm font-medium">

            Destination floor is same as pickup floor

          </span>

        </label>

      </div>

      {/* Lift */}

      <div className="mt-5">

        <label className="flex items-center gap-3">

          <input

            type="checkbox"

            checked={property.liftAvailable}

            onChange={(e) =>

              updateField(

                "liftAvailable",

                e.target.checked

              )

            }

          />

          <span className="text-sm font-medium">

            Lift Available

          </span>

        </label>

      </div>

      {/* Instructions */}

      <div className="mt-6">

        <label className="mb-2 block text-sm font-semibold">

          Special Instructions

        </label>

        <textarea

          rows={4}

          value={property.specialInstructions}

          onChange={(e) =>

            updateField(

              "specialInstructions",

              e.target.value

            )

          }

          placeholder="Any access restrictions, society timing, fragile movement instructions..."

          className="w-full rounded-xl border border-slate-300 p-3"

        />

      </div>

    </section>

  )

}
 
