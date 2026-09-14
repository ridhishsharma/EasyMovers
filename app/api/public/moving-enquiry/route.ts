import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  checkOrigin,
  enquirySecret,
  draftCookie,
  readDraftSession,
} from "@/lib/enquiry-session";
import { verifyIndianLocation } from "@/lib/verified-indian-location";
export const runtime = "nodejs";
const reply = (body: object, status = 200, cookie?: string) =>
  NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...(cookie ? { "Set-Cookie": cookie } : {}),
    },
  });
const draftLeadSelect = {
  id: true,
  referenceId: true,
  name: true,
  mobile: true,
  email: true,
  pickupCity: true,
  destinationCity: true,
  shiftingDate: true,
  shiftingType: true,
  houseType: true,
  officeSize: true,
  vehicleType: true,
  pickupFloor: true,
  liftAvailable: true,
  packingRequired: true,
  destinationPincode: true,
  notes: true,
  lastUpdatedAt: true,
  status: true,
} as const;
function text(data: Record<string, unknown>, key: string, max = 300) {
  const value = data[key] ?? "";
  if (typeof value !== "string" || value.length > max)
    throw Error(`Check ${key}.`);
  return value.trim();
}
async function input(req: Request) {
  checkOrigin(req);
  if (
    !req.headers.get("content-type")?.startsWith("application/json") ||
    Number(req.headers.get("content-length") || 0) > 65000
  )
    throw Error("Invalid request");
  const raw = await req.text();
  if (raw.length > 65000) throw Error("Request too large");
  const data = JSON.parse(raw);
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw Error("Invalid request");
  return data;
}
export async function POST(req: Request) {
  try {
    enquirySecret();
    let data;
    try {
      data = await input(req);
    } catch {
      return reply(
        { success: false, message: "Invalid enquiry request." },
        400,
      );
    }
    let route;
    let referenceId;
    try {
      const nonce = text(data, "requestId", 36);
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          nonce,
        )
      )
        throw Error("Invalid enquiry session.");
      referenceId = `EM-${createHmac("sha256", enquirySecret()).update(nonce).digest("hex").slice(0, 16).toUpperCase().match(/.{4}/g)!.join("-")}`;
      const mode = text(data, "mode", 20);
      if (!["LOCAL", "INTERCITY"].includes(mode))
        throw Error("Choose a route type.");
      const [from, to] = await Promise.all([
        verifyIndianLocation(data.from, mode === "LOCAL"),
        verifyIndianLocation(data.to, mode === "LOCAL"),
      ]);
      const same =
        from.city.toLowerCase() === to.city.toLowerCase() &&
        from.state === to.state;
      if (mode === "LOCAL" && !same)
        throw Error(
          "Within City requires pickup and drop in the same city. Choose Between Cities for this route.",
        );
      if (mode === "INTERCITY" && same)
        throw Error("Choose Within City for a move in the same city.");
      if (
        mode === "LOCAL" &&
        from.address.toLowerCase() === to.address.toLowerCase()
      )
        throw Error("Choose a different drop location.");
      const mobile = text(data, "mobile", 10);
      if (!/^[6-9]\d{9}$/.test(mobile))
        throw Error("Enter a valid 10-digit mobile number.");
      if (data.consent !== true) throw Error("Contact consent is required.");
      route = {
        name: "",
        mobile,
        shiftingType: ["Household", "Office", "Vehicle", "Goods"].includes(
          data.service,
        )
          ? data.service
          : mode === "LOCAL"
            ? "Goods"
            : "Household",
        pickupCity: from.city,
        pickupState: from.state,
        pickupPincode: from.pin || null,
        pickupLatitude: from.latitude ?? null,
        pickupLongitude: from.longitude ?? null,
        destinationCity: to.city,
        destinationState: to.state,
        destinationPincode: to.pin || null,
        destinationLatitude: to.latitude ?? null,
        destinationLongitude: to.longitude ?? null,
        destinationInput: to.address,
        notes: JSON.stringify({
          version: 2,
          mode,
          stage: "DRAFT",
          from,
          to,
          contactConsent: true,
          consentAt: new Date().toISOString(),
        }),
      };
    } catch (error) {
      return reply(
        {
          success: false,
          message: error instanceof Error ? error.message : "Check your route.",
        },
        400,
      );
    }
    const lead = await prisma.$transaction(async (tx) => {
      const record = await tx.lead.upsert({
        where: { referenceId },
        update: {},
        create: { ...route, referenceId },
        select: { id: true, referenceId: true },
      });
      await tx.inventory.upsert({
        where: { referenceId },
        update: {},
        create: {
          referenceId,
          leadId: record.id,
          status: "DRAFT",
          createdBy: "CUSTOMER",
        },
      });
      return record;
    });
    return reply(
      { success: true, reference: lead.referenceId },
      201,
      draftCookie(
        lead.id,
        lead.referenceId,
        new URL(req.url).protocol === "https:",
      ),
    );
  } catch {
    return reply(
      { success: false, message: "Unable to save your draft. Please retry." },
      503,
    );
  }
}
export async function GET(req: Request) {
  try {
    const reference = new URL(req.url).searchParams.get("reference") || "";
    if (!/^EM-[A-Z0-9-]{6,80}$/i.test(reference))
      return reply(
        { success: false, message: "Enter your reference number." },
        400,
      );
    const session = readDraftSession(req, reference);
    if (!session)
      return reply(
        {
          success: false,
          verificationRequired: true,
          message: "Verify your mobile to open this draft on this device.",
        },
        401,
      );
    const lead = await prisma.lead.findUnique({
      where: { id: session.id, referenceId: reference },
      select: draftLeadSelect,
    });
    if (!lead)
      return reply({ success: false, message: "Draft unavailable." }, 404);
    const inventory = await prisma.inventory.findUnique({
      where: { referenceId: reference },
      select: {
        status: true,
        remarks: true,
        updatedAt: true,
        items: {
          select: {
            category: true,
            itemName: true,
            quantity: true,
            fragile: true,
            requiresPacking: true,
          },
        },
      },
    });
    let metadata;
    try {
      metadata = JSON.parse(lead.notes || "{}");
    } catch {
      metadata = {};
    }
    const { id, notes, ...safeLead } = lead;
    return reply({ success: true, lead: safeLead, metadata, inventory });
  } catch {
    return reply(
      { success: false, message: "Unable to load your draft." },
      503,
    );
  }
}
export async function PATCH(req: Request) {
  try {
    let data;
    try {
      data = await input(req);
    } catch {
      return reply({ success: false, message: "Invalid draft request." }, 400);
    }
    const reference = text(data, "reference", 85);
    const session = readDraftSession(req, reference);
    if (!session)
      return reply(
        {
          success: false,
          verificationRequired: true,
          message: "Verify your mobile to continue.",
        },
        401,
      );
    const version = text(data, "version", 40);
    if (!version || !Number.isFinite(new Date(version).getTime()))
      return reply(
        { success: false, message: "Reopen your draft before saving." },
        400,
      );
    const submit = data.action === "SUBMIT";
    if (!["SAVE", "SUBMIT"].includes(data.action))
      return reply({ success: false, message: "Choose save or submit." }, 400);
    let fields;
    let extras;
    let items: {
      itemName: string;
      quantity: number;
      category: string;
      fragile: boolean;
      requiresPacking: boolean;
    }[];
    try {
      const name = text(data, "name", 100),
        email = text(data, "email", 254),
        shiftingType = text(data, "shiftingType", 30),
        shiftingDate = text(data, "shiftingDate", 10);
      if (name && name.length < 2) throw Error("Enter your full name.");
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw Error("Check your email.");
      if (!["Household", "Office", "Vehicle", "Goods"].includes(shiftingType))
        throw Error("Choose what you are moving.");
      if (shiftingDate) {
        const date = new Date(`${shiftingDate}T00:00:00Z`);
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(shiftingDate) ||
          !Number.isFinite(date.getTime()) ||
          date.toISOString().slice(0, 10) !== shiftingDate
        )
          throw Error("Check the moving date.");
      }
      const today = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      });
      if (submit && (!name || !shiftingDate || shiftingDate < today))
        throw Error(
          "Enter your name and a future or today's moving date before submitting.",
        );
      fields = {
        name,
        email: email || null,
        shiftingType,
        shiftingDate: shiftingDate || null,
        houseType: text(data, "houseType", 50) || null,
        officeSize: text(data, "officeSize", 100) || null,
        vehicleType: text(data, "vehicleType", 50) || null,
        pickupFloor: text(data, "pickupFloor", 20) || null,
        liftAvailable: text(data, "liftAvailable", 20) || null,
        packingRequired: text(data, "packingRequired", 20) || null,
      };
      extras = {
        pickupAddress: text(data, "pickupAddress", 300),
        destinationAddress: text(data, "destinationAddress", 300),
        destinationFloor: text(data, "destinationFloor", 20),
        destinationLift: text(data, "destinationLift", 20),
        parking: text(data, "parking", 250),
        specialItems: text(data, "specialItems", 500),
        additionalServices: text(data, "additionalServices", 500),
      };
      if (submit && (!extras.pickupAddress || !extras.destinationAddress))
        throw Error("Enter both full addresses before submitting.");
      if (!Array.isArray(data.items) || data.items.length > 100)
        throw Error("Add up to 100 item rows.");
      items = data.items.map((item: Record<string, unknown>) => {
        const itemName = text(item, "itemName", 150);
        const quantity = item.quantity;
        if (
          !itemName ||
          !Number.isInteger(quantity) ||
          Number(quantity) < 1 ||
          Number(quantity) > 999
        )
          throw Error("Each item needs a name and quantity from 1 to 999.");
        return {
          itemName,
          quantity: Number(quantity),
          category: text(item, "category", 50) || "OTHER",
          fragile: item.fragile === true,
          requiresPacking: item.requiresPacking !== false,
        };
      });
      if (submit && !items.length)
        throw Error("Add at least one item before requesting a quotation.");
      for (const value of [
        fields.liftAvailable,
        fields.packingRequired,
        extras.destinationLift,
      ])
        if (value && !["Yes", "No"].includes(value))
          throw Error("Choose Yes or No for lift and packing options.");
    } catch (error) {
      return reply(
        {
          success: false,
          message:
            error instanceof Error ? error.message : "Check your details.",
        },
        400,
      );
    }
    const result = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({
        where: { id: session.id, referenceId: reference },
        select: { notes: true },
      });
      if (!lead) throw Error("DRAFT_UNAVAILABLE");
      let previous;
      try {
        previous = JSON.parse(lead.notes || "{}");
      } catch {
        previous = {};
      }
      const changed = await tx.inventory.updateMany({
        where: {
          referenceId: reference,
          leadId: session.id,
          status: "DRAFT",
          updatedAt: new Date(version),
        },
        data: {
          status: submit ? "COMPLETED" : "DRAFT",
          completionPercentage: submit ? 100 : 0,
        },
      });
      if (changed.count !== 1) throw Error("DRAFT_CONFLICT");
      const inventory = await tx.inventory.findUniqueOrThrow({
        where: { referenceId: reference },
        select: { id: true, updatedAt: true },
      });
      await tx.inventoryItem.deleteMany({
        where: { inventoryId: inventory.id },
      });
      if (items.length)
        await tx.inventoryItem.createMany({
          data: items.map((item) => ({ ...item, inventoryId: inventory.id })),
        });
      await tx.lead.update({
        where: { id: session.id },
        data: {
          ...fields,
          ...(submit ? { status: "QUOTATION_REQUESTED" as const } : {}),
          notes: JSON.stringify({
            ...previous,
            ...extras,
            stage: submit ? "QUOTATION_REQUESTED" : "DRAFT",
            ...(submit ? { submittedAt: new Date().toISOString() } : {}),
            savedAt: new Date().toISOString(),
          }),
        },
      });
      return {
        reference,
        version: inventory.updatedAt.toISOString(),
        status: submit ? "QUOTATION_REQUESTED" : "DRAFT",
      };
    });
    return reply({ success: true, ...result });
  } catch (error) {
    if (error instanceof Error && error.message === "DRAFT_CONFLICT")
      return reply(
        {
          success: false,
          message:
            "This draft changed in another tab or was already submitted. Reopen it before saving.",
        },
        409,
      );
    if (error instanceof Error && error.message === "DRAFT_UNAVAILABLE")
      return reply({ success: false, message: "Draft unavailable." }, 404);
    return reply(
      {
        success: false,
        message: "Unable to save these changes. Please retry.",
      },
      503,
    );
  }
}
