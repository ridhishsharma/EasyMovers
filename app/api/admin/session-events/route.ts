import { NextResponse } from "next/server";
import { resolveApplicationAuthentication } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EVENTS = ["INVITATION_ACCEPTED", "PASSWORD_SET", "LOGIN", "LOGOUT"] as const;
type SessionEvent = (typeof EVENTS)[number];

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const authentication = await resolveApplicationAuthentication(request);
  if (!authentication.authenticated || !authentication.userId) {
    return reply({ success: false, error: { code: "UNAUTHENTICATED", message: "A verified office session is required." } }, 401);
  }

  const body = await request.json().catch(() => null);
  const event = body?.event as SessionEvent;
  if (!EVENTS.includes(event)) {
    return reply({ success: false, error: { code: "INVALID_SESSION_EVENT", message: "The office session event is invalid." } }, 400);
  }

  const now = new Date();
  const user = await prisma.user.findUnique({
    where: { id: authentication.userId },
    select: { officeInvitationAcceptedAt: true, officePasswordSetAt: true, officeFirstLoginAt: true },
  });
  if (!user) return reply({ success: false, error: { code: "OFFICE_USER_NOT_FOUND", message: "The office user was not found." } }, 404);

  const data = event === "INVITATION_ACCEPTED"
    ? { emailVerified: true, officeInvitationAcceptedAt: user.officeInvitationAcceptedAt ?? now }
    : event === "PASSWORD_SET"
      ? { emailVerified: true, officeInvitationAcceptedAt: user.officeInvitationAcceptedAt ?? now, officePasswordSetAt: user.officePasswordSetAt ?? now }
      : event === "LOGIN"
        ? { emailVerified: true, officeInvitationAcceptedAt: user.officeInvitationAcceptedAt ?? now, officeFirstLoginAt: user.officeFirstLoginAt ?? now, lastLogin: now }
        : { officeLastLogoutAt: now };

  await prisma.$transaction([
    prisma.user.update({ where: { id: authentication.userId }, data }),
    prisma.crmAuditLog.create({
      data: {
        actorUserId: authentication.userId,
        action: `CRM_USER_${event}`,
        entityType: "User",
        entityId: authentication.userId,
        ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      },
    }),
  ]);

  return reply({ success: true, data: { event, recordedAt: now.toISOString() } });
}
