import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
console.log("BODY RECEIVED =", body)
    const lead = await prisma.lead.create({
      data: {
        referenceId: body.referenceId,
        name: body.name,
        mobile: body.mobile,
        email: body.email || null,

        pickupCity: body.pickupCity || null,
        destinationCity: body.destinationCity || null,
	destinationState: body.destinationState || null,
	destinationPincode: body.destinationPincode || null,
	destinationInput: body.destinationSearch || null,
	shiftingDate: body.shiftingDate || null,
  
      	shiftingType: body.shiftingType || null,
        	houseType: body.houseType || null,
	officeSize: body.officeSize || null,
	vehicleType: body.vehicleType || null,
	vehicleCount: body.vehicleCount ? parseInt(body.vehicleCount) : null,

        	pickupFloor: body.pickupFloor || null,
        	liftAvailable: body.liftAvailable || null,
        	packingRequired: body.packingRequired || null,
	plantsIncluded:
  body.plantsIncluded === "Yes"
    ? true
    : body.plantsIncluded === "No"
    ? false
    : null,
        	notes: body.notes || null,
      },
    })

return NextResponse.json({
  success: true,
  lead,

  referenceId: lead.referenceId,
})
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        success: false,
        message: "Unable to save lead",
      },
      { status: 500 }
    )
  }
}