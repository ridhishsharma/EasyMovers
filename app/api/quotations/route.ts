import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
try {
const body = await req.json()

console.log("QUOTATION RECEIVED =", body)

const quotation = await prisma.quotation.create({
  data: {

    referenceId:
  body.referenceId ??
  `EM-${new Date().getFullYear()}-${Date.now()}`,

    quotationNumber:
  body.quotationNumber ??
  `QT-${new Date().getFullYear()}-${Date.now()}`,

    leadId: body.leadId,

    vendorId: body.vendorId,

    transportationCost: body.transportationCost ?? 0,

    packingCost: body.packingCost ?? 0,

    unpackingCost: body.unpackingCost ?? 0,

    labourCost: body.labourCost ?? 0,

    insuranceCost: body.insuranceCost ?? 0,

    otherCost: body.otherCost ?? 0,

    totalAmount: body.totalAmount,

    pickupDate: body.pickupDate,

    deliveryDate: body.deliveryDate,

    transitDays: body.transitDays,

    remarks: body.remarks,

    status: body.status ?? "SUBMITTED",

  }
})
return NextResponse.json({
  success: true,
  quotation,
})


} catch (error) {
console.error(error)


return NextResponse.json(
  {
    success: false,
    message: "Unable to save quotation",
  },
  { status: 500 }
)


}
}

export async function GET() {
try {
const quotations = await prisma.quotation.findMany({
include: {
lead: true,
vendor: true,
},


  orderBy: {
    createdAt: "desc",
  },
})

return NextResponse.json({
  success: true,
  quotations,
})


} catch (error) {
console.error(error)


return NextResponse.json(
  {
    success: false,
    message: "Unable to fetch quotations",
  },
  { status: 500 }
)


}
}
