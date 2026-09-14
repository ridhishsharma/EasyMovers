import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inventoryAccess, isNewDraft } from "@/lib/inventory-access";
const reply = (body: object, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
export async function GET(req: Request) {
  try {
    const referenceId = new URL(req.url).searchParams.get("referenceId") || "";
    if (!referenceId)
      return reply({ success: false, message: "Reference required." }, 400);
    if (!(await inventoryAccess(req, referenceId)).authorized)
      return reply(
        { success: false, message: "Verified access is required." },
        401,
      );
    const inventory = await prisma.inventory.findUnique({
      where: { referenceId },
      include: { lead: true, items: true },
    });
    return reply({ success: true, inventory });
  } catch {
    return reply({ success: false, message: "Unable to load inventory." }, 503);
  }
}
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (typeof body.referenceId !== "string" || typeof body.leadId !== "string")
      return reply({ success: false, message: "Invalid request." }, 400);
    const access = await inventoryAccess(req, body.referenceId);
    if (!access.admin)
      return reply(
        {
          success: false,
          message: "Create your draft through the moving enquiry form.",
        },
        403,
      );
    const lead = await prisma.lead.findFirst({
      where: { id: body.leadId, referenceId: body.referenceId },
      select: { id: true },
    });
    if (!lead)
      return reply({ success: false, message: "Lead unavailable." }, 404);
    const inventory = await prisma.inventory.upsert({
      where: { referenceId: body.referenceId },
      update: {},
      create: {
        referenceId: body.referenceId,
        leadId: lead.id,
        status: "DRAFT",
        createdBy: "ADMIN",
      },
    });
    return reply({ success: true, inventory });
  } catch {
    return reply(
      { success: false, message: "Unable to create inventory." },
      503,
    );
  }
}
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (typeof body.inventoryId !== "string")
      return reply({ success: false, message: "Inventory required." }, 400);
    const record = await prisma.inventory.findUnique({
      where: { id: body.inventoryId },
      select: { referenceId: true },
    });
    if (!record)
      return reply({ success: false, message: "Inventory unavailable." }, 404);
    const access = await inventoryAccess(req, record.referenceId);
    if (!access.authorized)
      return reply(
        { success: false, message: "Verified access is required." },
        401,
      );
    if (isNewDraft(record.referenceId) && !access.admin)
      return reply(
        {
          success: false,
          message: "Update this draft from its moving plan page.",
        },
        403,
      );
    if (body.status && !["DRAFT", "COMPLETED"].includes(body.status))
      return reply(
        { success: false, message: "Invalid inventory status." },
        400,
      );
    const inventory = await prisma.inventory.update({
      where: { id: body.inventoryId },
      data: {
        status: body.status || undefined,
        ...(typeof body.remarks === "string"
          ? { remarks: body.remarks.slice(0, 3000) }
          : {}),
        ...(typeof body.packingType === "string"
          ? { packingType: body.packingType.slice(0, 50) }
          : {}),
        ...(Array.isArray(body.specialHandling)
          ? { specialHandling: body.specialHandling }
          : {}),
        ...(Array.isArray(body.additionalServices)
          ? { additionalServices: body.additionalServices }
          : {}),
        ...(Array.isArray(body.preMoveServices)
          ? { preMoveServices: body.preMoveServices }
          : {}),
        ...(Number.isInteger(body.completionPercentage) &&
        body.completionPercentage >= 0 &&
        body.completionPercentage <= 100
          ? { completionPercentage: body.completionPercentage }
          : {}),
        ...(Number.isInteger(body.moveReadinessScore) &&
        body.moveReadinessScore >= 0 &&
        body.moveReadinessScore <= 100
          ? { moveReadinessScore: body.moveReadinessScore }
          : {}),
      },
    });
    return reply({ success: true, inventory });
  } catch {
    return reply(
      { success: false, message: "Unable to update inventory." },
      503,
    );
  }
}
