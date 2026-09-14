import { createHmac, timingSafeEqual } from "node:crypto";
export const DRAFT_SECONDS = 30 * 24 * 60 * 60;
export function enquirySecret() {
  const value = process.env.ENQUIRY_SESSION_SECRET;
  if (!value || value.length < 32) throw Error("Draft session unavailable");
  return value;
}
export function draftSignature(value: string) {
  return createHmac("sha256", enquirySecret())
    .update(value)
    .digest("base64url");
}
export function draftCookieName(reference: string) {
  return `em_draft_${draftSignature(reference).slice(0, 16)}`;
}
export function draftToken(id: string, reference: string) {
  const payload = Buffer.from(
    JSON.stringify({
      id,
      reference,
      expires: Date.now() + DRAFT_SECONDS * 1000,
    }),
  ).toString("base64url");
  return `${payload}.${draftSignature(payload)}`;
}
export function readDraftSession(
  req: Request,
  reference: string,
): { id: string; reference: string } | null {
  const name = draftCookieName(reference);
  const token =
    req.headers
      .get("cookie")
      ?.split(";")
      .map((value) => value.trim())
      .find((value) => value.startsWith(`${name}=`))
      ?.slice(name.length + 1) || "";
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra || token.length > 1500) return null;
  const expected = Buffer.from(draftSignature(payload));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.reference === reference &&
      typeof data.id === "string" &&
      data.expires > Date.now()
      ? { id: data.id, reference }
      : null;
  } catch {
    return null;
  }
}
export function draftCookie(id: string, reference: string, secure: boolean) {
  return `${draftCookieName(reference)}=${draftToken(id, reference)}; HttpOnly; SameSite=Lax; Path=/api; Max-Age=${DRAFT_SECONDS}${secure ? "; Secure" : ""}`;
}
export function checkOrigin(req: Request) {
  if (req.headers.get("origin") !== new URL(req.url).origin)
    throw Error("Invalid origin");
}
