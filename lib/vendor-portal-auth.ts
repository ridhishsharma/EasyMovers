import { resolveApplicationAuthentication } from "@/lib/auth";

export async function authorizeVendorPortal(request: Request) {
  const auth = await resolveApplicationAuthentication(request);
  if (!auth.authenticated)
    return { authorized: false as const, status: 401, code: "UNAUTHENTICATED", message: "Sign in with a linked vendor account." };
  if (!auth.userId || !auth.vendorId || !auth.roles?.includes("VENDOR"))
    return { authorized: false as const, status: 403, code: "VENDOR_ACCESS_REQUIRED", message: "A linked vendor account is required." };
  return { authorized: true as const, userId: auth.userId, vendorId: auth.vendorId };
}
