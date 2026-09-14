import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { checkOrigin, draftCookie } from "@/lib/enquiry-session";
export async function POST(req: Request) {
  const reply = (body: object, status = 200, cookie?: string) =>
    NextResponse.json(body, {
      status,
      headers: {
        "Cache-Control": "no-store",
        ...(cookie ? { "Set-Cookie": cookie } : {}),
      },
    });
  try {
    checkOrigin(req);
    const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
    if (!token || token.length > 10000)
      return reply(
        { success: false, message: "Mobile verification is required." },
        401,
      );
    const url = process.env.SUPABASE_URL,
      key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key)
      return reply(
        { success: false, message: "Mobile verification is not configured." },
        503,
      );
    const raw = await req.text();
    if (raw.length > 500)
      return reply({ success: false, message: "Invalid request." }, 400);
    const { reference } = JSON.parse(raw);
    if (
      typeof reference !== "string" ||
      !/^EM-[A-Z0-9-]{6,80}$/i.test(reference)
    )
      return reply(
        { success: false, message: "Enter your reference number." },
        400,
      );
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.auth.getUser(token);
    const phone = data.user?.phone;
    if (
      error ||
      !phone ||
      !data.user?.phone_confirmed_at ||
      !/^\+?91[6-9]\d{9}$/.test(phone)
    )
      return reply(
        { success: false, message: "Verify your Indian mobile number." },
        401,
      );
    const mobile = phone.replace(/^\+?91/, "");
    const lead = await prisma.lead.findFirst({
      where: { referenceId: reference, mobile },
      select: { id: true, referenceId: true },
    });
    if (!lead)
      return reply(
        {
          success: false,
          message: "No matching draft was found for this verified mobile.",
        },
        404,
      );
    return reply(
      { success: true, reference: lead.referenceId },
      200,
      draftCookie(
        lead.id,
        lead.referenceId,
        new URL(req.url).protocol === "https:",
      ),
    );
  } catch {
    return reply(
      { success: false, message: "Unable to reopen the draft. Please retry." },
      503,
    );
  }
}
