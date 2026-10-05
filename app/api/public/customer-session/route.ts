import { NextResponse } from "next/server";
import {
  checkOrigin,
  clearCustomerAccessCookie,
} from "@/lib/enquiry-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    const raw = await request.text();
    if (raw.length > 200)
      return NextResponse.json({ success: false }, { status: 400 });
    const body = JSON.parse(raw) as Record<string, unknown>;
    const reference =
      typeof body.reference === "string" ? body.reference.trim() : "";
    if (!/^EM-[A-Z0-9-]{6,80}$/i.test(reference))
      return NextResponse.json({ success: false }, { status: 400 });

    return NextResponse.json(
      { success: true },
      {
        headers: {
          "Cache-Control": "no-store",
          "Set-Cookie": clearCustomerAccessCookie(
            reference,
            process.env.NODE_ENV === "production" ||
              new URL(request.url).protocol === "https:",
          ),
        },
      },
    );
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
