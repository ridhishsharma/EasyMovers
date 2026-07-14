import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {

  const body = await req.json()

  console.log("ITEM BODY =", body)
  console.log("INVENTORY ID =", body.inventoryId)
const inventory =
  await prisma.inventory.findUnique({
    where: {
      id: body.inventoryId,
    },
  })

console.log(
  "FOUND INVENTORY =",
  inventory
)
  const item = await prisma.inventoryItem.create({
    data: {
      inventoryId: body.inventoryId,
      category: body.category,
      itemName: body.itemName,
      quantity: Number(body.quantity || 1),
      fragile: body.fragile || false,
      requiresPacking: body.requiresPacking ?? true,
      remarks: body.remarks || null,
    },
  })

  return NextResponse.json({
    success: true,
    item,
  })

} catch (error) {

  console.error("ITEM CREATE ERROR =", error)

  return NextResponse.json(
    {
      success: false,
      message: "Unable to create item",
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

 
const inventoryId =
  searchParams.get("inventoryId")

if (!inventoryId) {
  return NextResponse.json(
    {
      success: false,
      message:
        "Inventory ID required",
    },
    {
      status: 400,
    }
  )
}

const items =
  await prisma.inventoryItem.findMany({
    where: {
      inventoryId,
    },

    orderBy: {
      createdAt: "desc",
    },
  })

return NextResponse.json({
  success: true,
  items,
})
 

} catch (error) {
console.error(error)

 
return NextResponse.json(
  {
    success: false,
    message:
      "Unable to fetch items",
  },
  {
    status: 500,
  }
)
 

}
}

export async function DELETE(req: Request) {
try {
const { searchParams } =
new URL(req.url)

 
const itemId =
  searchParams.get("itemId")

if (!itemId) {
  return NextResponse.json(
    {
      success: false,
      message: "Item ID required",
    },
    {
      status: 400,
    }
  )
}

await prisma.inventoryItem.delete({
  where: {
    id: itemId,
  },
})

return NextResponse.json({
  success: true,
})
 

} catch (error) {
console.error(error)

 
return NextResponse.json(
  {
    success: false,
    message:
      "Unable to delete item",
  },
  {
    status: 500,
  }
)
 

}
}
