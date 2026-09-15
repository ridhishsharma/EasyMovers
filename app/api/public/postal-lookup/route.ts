import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const pin = new URL(request.url).searchParams.get("pin") ?? "";
  if (!/^[1-9]\d{5}$/.test(pin)) return NextResponse.json({ success: false, message: "Enter a valid six-digit Indian PIN code." }, { status: 400 });
  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal: AbortSignal.timeout(8000), next: { revalidate: 86400 } });
    if (!response.ok) throw new Error("Postal lookup unavailable");
    const data = await response.json();
    const offices = data?.[0]?.PostOffice;
    if (data?.[0]?.Status !== "Success" || !Array.isArray(offices) || !offices.length) return NextResponse.json({ success: false, message: "PIN code not found. Enter the destination manually." }, { status: 404 });
    return NextResponse.json({ success: true, locations: offices.filter((office: { Pincode?: string }) => office.Pincode === pin).map((office: { Name?: string; District?: string; State?: string; Block?: string; Division?: string }) => ({ locality: office.Name, district: office.District, state: office.State, block: office.Block, division: office.Division, pin })) });
  } catch {
    return NextResponse.json({ success: false, message: "Postal lookup is unavailable. You can enter the destination manually." }, { status: 503 });
  }
}
