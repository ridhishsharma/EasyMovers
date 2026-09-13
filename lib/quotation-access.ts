/** Internal quotation records require a verified platform administrator. */
export interface QuotationIdentity {
  authenticated: boolean;
  userId?: string;
  roles?: string[];
}
export type QuotationAccess =
  | { allowed: true; userId: string }
  | { allowed: false; status: 401 | 403; code: string; message: string };

export async function authorizeInternalQuotation(
  request: Request,
  resolveIdentity: (request: Request) => Promise<QuotationIdentity>
): Promise<QuotationAccess> {
  let identity: QuotationIdentity;
  try {
    identity = await resolveIdentity(request);
  } catch {
    return { allowed: false, status: 401, code: "UNAUTHENTICATED",
      message: "Verified authentication is required." };
  }
  if (!identity.authenticated || !identity.userId) {
    return { allowed: false, status: 401, code: "UNAUTHENTICATED",
      message: "Verified authentication is required." };
  }
  if (!identity.roles?.some(role => role === "ADMIN" || role === "SUPER_ADMIN")) {
    return { allowed: false, status: 403, code: "FORBIDDEN",
      message: "Administrator access is required." };
  }
  return { allowed: true, userId: identity.userId };
}
