import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inventoryAccess, isNewDraft } from "@/lib/inventory-access";
const reply = (body: object, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
async function access(req: Request, id: string, write = false) {
  const record = await prisma.inventory.findUnique({
    where: { id },
    select: { referenceId: true },
  });
  if (!record) return false;
  const permission = await inventoryAccess(req, record.referenceId);
  return (
    permission.authorized &&
    (!write || !isNewDraft(record.referenceId) || permission.admin)
  );
}
export async function GET(req: Request) {
  try {
    const inventoryId = new URL(req.url).searchParams.get("inventoryId");
    if (!inventoryId)
      return reply({ success: false, message: "Inventory required." }, 400);
    if (!(await access(req, inventoryId)))
      return reply(
        { success: false, message: "Verified inventory access is required." },
        401,
      );
    const items = await prisma.inventoryItem.findMany({
      where: { inventoryId },
      orderBy: { createdAt: "desc" },
    });
    return reply({ success: true, items });
  } catch {
    return reply({ success: false, message: "Unable to load items." }, 503);
  }
}
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (
      typeof body.inventoryId !== "string" ||
      typeof body.itemName !== "string" ||
      !body.itemName.trim() ||
      body.itemName.length > 150 ||
      !Number.isInteger(Number(body.quantity || 1)) ||
      Number(body.quantity || 1) < 1 ||
      Number(body.quantity || 1) > 999
    )
      return reply(
        { success: false, message: "Check the item name and quantity." },
        400,
      );
    if (!(await access(req, body.inventoryId, true)))
      return reply(
        {
          success: false,
          message: "Open your moving plan to update these items.",
        },
        403,
      );
    const item = await prisma.inventoryItem.create({
      data: {
        inventoryId: body.inventoryId,
        itemName: body.itemName.trim(),
        category:
          typeof body.category === "string"
            ? body.category.slice(0, 50)
            : "OTHER",
        quantity: Number(body.quantity || 1),
        fragile: body.fragile === true,
        requiresPacking: body.requiresPacking !== false,
      },
    });
    return reply({ success: true, item });
  } catch {
    return reply({ success: false, message: "Unable to save item." }, 503);
  }
}
export async function DELETE(req: Request) {
  try {
    const id = new URL(req.url).searchParams.get("itemId");
    if (!id) return reply({ success: false, message: "Item required." }, 400);
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      select: { inventoryId: true },
    });
    if (!item || !(await access(req, item.inventoryId, true)))
      return reply(
        { success: false, message: "Verified item access is required." },
        403,
      );
    await prisma.inventoryItem.delete({ where: { id } });
    return reply({ success: true });
  } catch {
    return reply({ success: false, message: "Unable to remove item." }, 503);
  }
}
