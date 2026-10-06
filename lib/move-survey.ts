import { MoveSurveyMode, MoveSurveyStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class MoveSurveyError extends Error {
  constructor(public code: string, message: string, public status = 400) { super(message); this.name = "MoveSurveyError"; }
}
const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const integer = (value: unknown, name: string, max = 500) => {
  const result = Number(value);
  if (!Number.isInteger(result) || result < 0 || result > max) throw new MoveSurveyError("INVALID_SURVEY_VALUE", `${name} must be between 0 and ${max}.`);
  return result;
};
const decimal = (value: unknown, name: string) => {
  if (value === null || value === undefined || value === "") return null;
  const result = Number(value);
  if (!Number.isFinite(result) || result < 0 || result > 100000) throw new MoveSurveyError("INVALID_SURVEY_VALUE", `${name} must be a valid non-negative estimate.`);
  return new Prisma.Decimal(result);
};
const number = () => `EMS-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
const customerEditableStatuses = new Set<MoveSurveyStatus>([MoveSurveyStatus.REQUESTED, MoveSurveyStatus.RETURNED_FOR_CORRECTION, MoveSurveyStatus.IN_PROGRESS]);
const customerSubmittableStatuses = new Set<MoveSurveyStatus>([MoveSurveyStatus.IN_PROGRESS, MoveSurveyStatus.RETURNED_FOR_CORRECTION]);

export const surveyInclude = {
  rooms: { orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }], include: { media: { orderBy: { createdAt: "asc" as const } } } },
  media: { where: { roomId: null }, orderBy: { createdAt: "asc" as const } },
};

export async function getOrCreateCustomerSurvey(leadId: string) {
  const existing = await prisma.moveSurvey.findFirst({ where: { leadId, status: { notIn: [MoveSurveyStatus.CANCELLED] } }, orderBy: { version: "desc" }, include: surveyInclude });
  if (existing) return existing;
  const inventory = await prisma.inventory.findUnique({ where: { leadId }, select: { id: true } });
  return prisma.moveSurvey.create({ data: { surveyNumber: number(), leadId, inventoryId: inventory?.id, mode: MoveSurveyMode.CUSTOMER_SELF }, include: surveyInclude });
}

export async function saveCustomerSurveyRoom(leadId: string, surveyId: string, input: Record<string, unknown>) {
  const survey = await prisma.moveSurvey.findFirst({ where: { id: surveyId, leadId }, select: { id: true, status: true } });
  if (!survey) throw new MoveSurveyError("SURVEY_NOT_FOUND", "Survey not found.", 404);
  if (!customerEditableStatuses.has(survey.status)) throw new MoveSurveyError("SURVEY_LOCKED", "This survey version can no longer be changed.", 409);
  const roomName = text(input.roomName, 80);
  if (roomName.length < 2) throw new MoveSurveyError("ROOM_NAME_REQUIRED", "Enter the room or area name.");
  await prisma.moveSurvey.update({ where: { id: survey.id }, data: { status: MoveSurveyStatus.IN_PROGRESS, startedAt: survey.status === MoveSurveyStatus.REQUESTED ? new Date() : undefined } });
  return prisma.moveSurveyRoom.upsert({
    where: { surveyId_roomName: { surveyId, roomName } },
    create: { surveyId, roomName, estimatedBoxes: integer(input.estimatedBoxes ?? 0, "Estimated boxes"), fragileItems: integer(input.fragileItems ?? 0, "Fragile items"), estimatedWeightKg: decimal(input.estimatedWeightKg, "Estimated weight"), estimatedVolumeCft: decimal(input.estimatedVolumeCft, "Estimated volume"), remarks: text(input.remarks, 1000) || null, sortOrder: integer(input.sortOrder ?? 0, "Room order", 100) },
    update: { estimatedBoxes: integer(input.estimatedBoxes ?? 0, "Estimated boxes"), fragileItems: integer(input.fragileItems ?? 0, "Fragile items"), estimatedWeightKg: decimal(input.estimatedWeightKg, "Estimated weight"), estimatedVolumeCft: decimal(input.estimatedVolumeCft, "Estimated volume"), remarks: text(input.remarks, 1000) || null, sortOrder: integer(input.sortOrder ?? 0, "Room order", 100) },
  });
}

export async function confirmCustomerSurvey(leadId: string, surveyId: string, sessionRef: string) {
  return prisma.$transaction(async tx => {
    const survey = await tx.moveSurvey.findFirst({ where: { id: surveyId, leadId }, include: { rooms: { include: { media: true } } } });
    if (!survey) throw new MoveSurveyError("SURVEY_NOT_FOUND", "Survey not found.", 404);
    if (!customerSubmittableStatuses.has(survey.status)) throw new MoveSurveyError("SURVEY_NOT_SUBMITTABLE", "Add and review the survey before confirmation.", 409);
    if (!survey.rooms.length) throw new MoveSurveyError("SURVEY_ROOMS_REQUIRED", "Add at least one room or area.", 409);
    if (survey.mode === MoveSurveyMode.CUSTOMER_SELF && !survey.rooms.some(room => room.media.length > 0)) throw new MoveSurveyError("SURVEY_PHOTO_REQUIRED", "Add at least one survey photograph.", 409);
    return tx.moveSurvey.update({ where: { id: survey.id }, data: { status: MoveSurveyStatus.REVIEW_PENDING, submittedAt: new Date(), customerConfirmedAt: new Date(), customerConfirmation: "OTP_VERIFIED_TRACK_SESSION", customerSessionRef: sessionRef }, include: surveyInclude });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function updateSurveyOperations(surveyId: string, input: Record<string, unknown>, actorUserId: string) {
  const action = text(input.action, 40).toUpperCase();
  const current = await prisma.moveSurvey.findUnique({ where: { id: surveyId } });
  if (!current) throw new MoveSurveyError("SURVEY_NOT_FOUND", "Survey not found.", 404);
  if (action === "SCHEDULE") {
    const scheduledAt = new Date(String(input.scheduledAt || ""));
    if (!Number.isFinite(scheduledAt.getTime()) || scheduledAt <= new Date()) throw new MoveSurveyError("INVALID_SURVEY_SCHEDULE", "Choose a future survey time.");
    return prisma.moveSurvey.update({ where: { id: surveyId }, data: { status: MoveSurveyStatus.SCHEDULED, scheduledAt, assignedToUserId: text(input.assignedToUserId, 100) || null, assignedToVendorId: text(input.assignedToVendorId, 100) || null }, include: surveyInclude });
  }
  if (action === "APPROVE") {
    if (current.status !== MoveSurveyStatus.REVIEW_PENDING) throw new MoveSurveyError("SURVEY_REVIEW_REQUIRED", "Only a submitted survey can be approved.", 409);
    return prisma.moveSurvey.update({ where: { id: surveyId }, data: { status: MoveSurveyStatus.APPROVED, reviewedAt: new Date(), reviewedByUserId: actorUserId, approvedAt: new Date(), reviewRemarks: text(input.remarks, 1000) || null }, include: surveyInclude });
  }
  if (action === "RETURN") {
    if (current.status !== MoveSurveyStatus.REVIEW_PENDING) throw new MoveSurveyError("SURVEY_REVIEW_REQUIRED", "Only a submitted survey can be returned.", 409);
    const remarks = text(input.remarks, 1000); if (!remarks) throw new MoveSurveyError("REVIEW_REMARKS_REQUIRED", "Explain what must be corrected.");
    return prisma.moveSurvey.update({ where: { id: surveyId }, data: { status: MoveSurveyStatus.RETURNED_FOR_CORRECTION, reviewedAt: new Date(), reviewedByUserId: actorUserId, reviewRemarks: remarks }, include: surveyInclude });
  }
  if (action === "SHARE") {
    if (current.status !== MoveSurveyStatus.APPROVED) throw new MoveSurveyError("SURVEY_APPROVAL_REQUIRED", "Approve the survey before sharing it with vendors.", 409);
    return prisma.moveSurvey.update({ where: { id: surveyId }, data: { status: MoveSurveyStatus.SHARED, sharedAt: new Date() }, include: surveyInclude });
  }
  throw new MoveSurveyError("INVALID_SURVEY_ACTION", "Choose a valid survey action.");
}
