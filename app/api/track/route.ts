import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
try {
const body = await req.json()

const lead = await prisma.lead.findFirst({
  where: {
    referenceId: body.referenceId,
    mobile: body.mobile,
  },

  include: {
    inventory: true,
  },
})

if (!lead) {
  return NextResponse.json({
    success: false,
    message:
      "No request found. Please check Reference ID and Mobile Number.",
  })
}

return NextResponse.json({
  success: true,

  lead,

  inventoryStatus:
    lead.inventory?.status ||
    "NOT_STARTED",

  completionPercentage:
    lead.inventory?.completionPercentage || 0,
})
} catch (error) {
console.error(error)

return NextResponse.json(
  {
    success: false,
    message: "Unable to track request",
  },
  { status: 500 }
)


}
}
