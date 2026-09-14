import { resolveApplicationAuthentication } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readDraftSession } from "@/lib/enquiry-session";
export async function inventoryAccess(req: Request, reference: string) {
  const session = readDraftSession(req, reference);
  if (session) {
    const lead = await prisma.lead.findFirst({
      where: { id: session.id, referenceId: reference },
      select: { id: true },
    });
    if (lead) return { authorized: true, admin: false };
  }
  const auth = await resolveApplicationAuthentication(req);
  if (!auth.authenticated) return { authorized: false, admin: false };
  const admin = !!auth.roles?.some((role) =>
    ["ADMIN", "SUPER_ADMIN"].includes(role),
  );
  if (admin) return { authorized: true, admin: true };
  const lead = await prisma.lead.findFirst({
    where: { referenceId: reference, userId: auth.userId },
    select: { id: true },
  });
  return { authorized: !!lead, admin: false };
}
export function isNewDraft(reference: string) {
  return /^EM-(?:[A-F0-9]{4}-){3}[A-F0-9]{4}$/.test(reference);
}
