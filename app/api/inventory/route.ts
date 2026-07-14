import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {

  try {

    const body = await req.json()

    console.log("INVENTORY BODY =", body)

    const inventory =
      await prisma.inventory.create({
        data: {
          referenceId: body.referenceId,
          leadId: body.leadId,
          status: body.status || "DRAFT",
          createdBy: body.createdBy || "CUSTOMER",
        },
      })

    return NextResponse.json({
      success: true,
      inventory,
    })

  } catch (error) {

    console.error(error)

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    )

  }

}

export async function PUT(req: Request) {
try {
const body = await req.json()


const inventory = await prisma.inventory.update({
  where: {
    id: body.inventoryId,
  },

  data: {
    status:
      body.status || undefined,

    completionPercentage:
      body.completionPercentage,

    moveReadinessScore:
      body.moveReadinessScore,

    remarks:
      body.remarks,
  },
})

return NextResponse.json({
  success: true,
  inventory,
})


} catch (error) {
console.error(error)


return NextResponse.json(
  {
    success: false,
    message: "Unable to update inventory",
  },
  {
    status: 500,
  }
)

}
}

export async function GET(req: Request) {
try {
const { searchParams } =
new URL(req.url)


const referenceId =
  searchParams.get("referenceId")

if (!referenceId) {
  return NextResponse.json(
    {
      success: false,
      message:
        "Reference ID required",
    },
    {
      status: 400,
    }
  )
}

const inventory = await prisma.inventory.findFirst({
  where: {
    referenceId,
  },
include:{
lead:true,
items:true,
},
 
})

return NextResponse.json({
  success: true,
  inventory,
})

} catch (error) {
console.error(error)


return NextResponse.json(
  {
    success: false,
    message:
      "Unable to fetch inventory",
  },
  {
    status: 500,
  }
)


}
}
