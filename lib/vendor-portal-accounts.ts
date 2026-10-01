import { Prisma } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

export class VendorPortalAccountError extends Error {
  constructor(public readonly code: string, message: string, public readonly status: number) {
    super(message);
    this.name = "VendorPortalAccountError";
  }
}

function normalize(input: { fullName: unknown; email: unknown; mobile: unknown }) {
  const fullName = typeof input.fullName === "string" ? input.fullName.trim().replace(/\s+/g, " ") : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const mobile = typeof input.mobile === "string" ? input.mobile.replace(/\D/g, "") : "";
  if (fullName.length < 2 || fullName.length > 100 || !/^[\p{L}][\p{L}\p{M} .'-]*$/u.test(fullName))
    throw new VendorPortalAccountError("INVALID_FULL_NAME", "Enter a valid vendor user name.", 400);
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new VendorPortalAccountError("INVALID_EMAIL", "Enter a valid vendor email address.", 400);
  if (!/^[6-9]\d{9}$/.test(mobile))
    throw new VendorPortalAccountError("INVALID_MOBILE", "Enter a valid 10-digit Indian mobile number.", 400);
  return { fullName, email, mobile };
}

export async function listVendorPortalAccounts(vendorId: string) {
  const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, deletedAt: null }, select: { id: true } });
  if (!vendor) throw new VendorPortalAccountError("VENDOR_NOT_FOUND", "Vendor was not found.", 404);
  return prisma.user.findMany({
    where: { vendorId, role: "VENDOR" },
    orderBy: [{ isActive: "desc" }, { fullName: "asc" }],
    select: { id: true, fullName: true, email: true, mobile: true, isActive: true, emailVerified: true, mobileVerified: true, lastLogin: true, createdAt: true },
  });
}

export async function inviteVendorPortalAccount(input: {
  vendorId: string; actorUserId: string; fullName: unknown; email: unknown; mobile: unknown; origin: string; ipAddress?: string;
}) {
  const normalized = normalize(input);
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const secretKey = (process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
  if (!supabaseUrl || !secretKey)
    throw new VendorPortalAccountError("VENDOR_INVITATION_NOT_CONFIGURED", "Secure vendor invitations are not configured.", 503);
  const [vendor, duplicate] = await Promise.all([
    prisma.vendor.findFirst({ where: { id: input.vendorId, deletedAt: null }, select: { id: true, vendorCode: true, companyName: true } }),
    prisma.user.findFirst({ where: { OR: [{ email: normalized.email }, { mobile: normalized.mobile }] }, select: { id: true } }),
  ]);
  if (!vendor) throw new VendorPortalAccountError("VENDOR_NOT_FOUND", "Vendor was not found.", 404);
  if (duplicate) throw new VendorPortalAccountError("VENDOR_USER_ALREADY_EXISTS", "An account already uses this email address or mobile number.", 409);

  const admin = createClient(supabaseUrl, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const redirectTo = `${input.origin}/vendor/login?mode=recovery&returnTo=%2Fvendor%2Fdashboard`;
  const { data, error } = await admin.auth.admin.inviteUserByEmail(normalized.email, {
    redirectTo,
    data: { full_name: normalized.fullName, easymovers_vendor_invitation: true, vendor_id: vendor.id, vendor_code: vendor.vendorCode },
  });
  if (error || !data.user)
    throw new VendorPortalAccountError("VENDOR_INVITATION_FAILED", "The vendor invitation could not be sent. Confirm that the email is not already registered.", 502);
  try {
    return await prisma.$transaction(async transaction => {
      const user = await transaction.user.create({
        data: {
          supabaseAuthId: data.user.id,
          email: normalized.email,
          mobile: normalized.mobile,
          passwordHash: "SUPABASE_AUTH_MANAGED",
          fullName: normalized.fullName,
          role: "VENDOR",
          vendorId: vendor.id,
          isActive: true,
          emailVerified: false,
          mobileVerified: false,
        },
        select: { id: true, fullName: true, email: true, mobile: true, isActive: true },
      });
      await transaction.crmAuditLog.create({
        data: { actorUserId: input.actorUserId, action: "VENDOR_PORTAL_USER_INVITED", entityType: "User", entityId: user.id, ipAddress: input.ipAddress, metadata: { vendorId: vendor.id, vendorCode: vendor.vendorCode, email: normalized.email } },
      });
      return { ...user, invitationSent: true, vendor: { id: vendor.id, vendorCode: vendor.vendorCode, companyName: vendor.companyName } };
    });
  } catch (persistError) {
    await admin.auth.admin.deleteUser(data.user.id).catch(() => undefined);
    if (persistError instanceof Prisma.PrismaClientKnownRequestError && persistError.code === "P2002")
      throw new VendorPortalAccountError("VENDOR_USER_ALREADY_EXISTS", "An account already uses this email address or mobile number.", 409);
    throw persistError;
  }
}
