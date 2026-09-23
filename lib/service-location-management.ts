import {
  LocationServiceStatus,
  Prisma,
  ServiceFulfilmentMode,
  ServiceLocationStatus,
  VendorServiceScope,
  VendorServiceType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { catalogLocation, verifyPostalLocation } from "@/lib/india-location-catalog";

export class ServiceLocationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ServiceLocationError";
  }
}

const locationSelect = {
  id: true,
  code: true,
  city: true,
  district: true,
  state: true,
  countryCode: true,
  stateCode: true,
  verificationPostalCode: true,
  locationSource: true,
  locationVerifiedAt: true,
  serviceablePostalCodes: true,
  status: true,
  operationsContactName: true,
  operationsContactMobile: true,
  operationsContactEmail: true,
  plannedLaunchAt: true,
  approvedByUserId: true,
  approvedAt: true,
  activatedByUserId: true,
  activatedAt: true,
  suspendedByUserId: true,
  suspendedAt: true,
  suspensionReason: true,
  createdAt: true,
  updatedAt: true,
  services: {
    orderBy: [{ scope: "asc" as const }, { serviceType: "asc" as const }],
  },
} satisfies Prisma.ServiceLocationSelect;

function text(value: unknown, name: string, minimum: number, maximum: number) {
  if (typeof value !== "string" || value.trim().length < minimum || value.trim().length > maximum) {
    throw new ServiceLocationError("INVALID_SERVICE_LOCATION", `${name} must contain ${minimum} to ${maximum} characters.`, 400);
  }
  return value.trim().replace(/\s+/g, " ");
}

function optionalText(value: unknown, name: string, maximum: number) {
  if (value === undefined || value === null || value === "") return null;
  return text(value, name, 2, maximum);
}

function locationName(value: unknown, name: string) {
  const normalized = text(value, name, 2, 80);
  if (!/^[\p{L}][\p{L}\s.'()-]*$/u.test(normalized)) {
    throw new ServiceLocationError("INVALID_SERVICE_LOCATION", `${name} contains unsupported characters.`, 400);
  }
  return normalized;
}

function code(value: unknown, city: string, state: string) {
  const candidate = typeof value === "string" && value.trim()
    ? value.trim().toUpperCase()
    : `${city}-${state}`.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (!/^[A-Z0-9][A-Z0-9-]{2,49}$/.test(candidate)) {
    throw new ServiceLocationError("INVALID_LOCATION_CODE", "Location code must contain 3 to 50 uppercase letters, numbers or hyphens.", 400);
  }
  return candidate;
}

function postalCodes(value: unknown) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > 250) {
    throw new ServiceLocationError("INVALID_POSTAL_CODES", "Provide no more than 250 Indian postal codes.", 400);
  }
  const normalized = [...new Set(value.map(item => String(item).trim()))];
  if (normalized.some(item => !/^[1-9][0-9]{5}$/.test(item))) {
    throw new ServiceLocationError("INVALID_POSTAL_CODES", "Every postal code must be a valid 6-digit Indian PIN.", 400);
  }
  return normalized;
}

function optionalEmail(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    throw new ServiceLocationError("INVALID_OPERATIONS_EMAIL", "Provide a valid operations email address.", 400);
  }
  return value.trim().toLowerCase();
}

function optionalMobile(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const normalized = String(value).replace(/^\+91/, "").replace(/\D/g, "");
  if (!/^[6-9][0-9]{9}$/.test(normalized)) {
    throw new ServiceLocationError("INVALID_OPERATIONS_MOBILE", "Provide a valid 10-digit Indian operations mobile number.", 400);
  }
  return normalized;
}

function optionalDate(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new ServiceLocationError("INVALID_PLANNED_LAUNCH", "Provide a valid planned launch date.", 400);
  return date;
}

function enumValue<T extends string>(value: unknown, values: readonly T[], name: string): T {
  if (typeof value !== "string" || !values.includes(value.toUpperCase() as T)) {
    throw new ServiceLocationError("INVALID_LOCATION_SERVICE", `${name} is invalid.`, 400);
  }
  return value.toUpperCase() as T;
}

function booleanValue(value: unknown, name: string) {
  if (typeof value !== "boolean") throw new ServiceLocationError("INVALID_LOCATION_SERVICE", `${name} must be true or false.`, 400);
  return value;
}

function serviceInput(body: Record<string, unknown>) {
  const scope = enumValue(body.scope, Object.values(VendorServiceScope), "Service scope");
  const serviceType = enumValue(body.serviceType, Object.values(VendorServiceType), "Service type");
  const fulfilmentMode = enumValue(body.fulfilmentMode, Object.values(ServiceFulfilmentMode), "Fulfilment mode");
  const status = enumValue(body.status ?? "DRAFT", [LocationServiceStatus.DRAFT, LocationServiceStatus.READY], "Service status");
  const instantPricingAvailable = booleanValue(body.instantPricingAvailable ?? false, "Instant pricing availability");
  const surveyRequired = booleanValue(body.surveyRequired ?? false, "Survey requirement");
  const minimumVerifiedVendors = Number(body.minimumVerifiedVendors ?? 1);
  if (!Number.isInteger(minimumVerifiedVendors) || minimumVerifiedVendors < 1 || minimumVerifiedVendors > 100) {
    throw new ServiceLocationError("INVALID_LOCATION_SERVICE", "Minimum verified vendors must be an integer from 1 to 100.", 400);
  }
  if (instantPricingAvailable && fulfilmentMode !== ServiceFulfilmentMode.INSTANT_RATE) {
    throw new ServiceLocationError("INVALID_LOCATION_SERVICE", "Instant pricing is available only for instant-rate fulfilment.", 400);
  }
  return { scope, serviceType, fulfilmentMode, status, instantPricingAvailable, surveyRequired, minimumVerifiedVendors };
}

async function verifiedLocationIdentity(body: Record<string, unknown>) {
  const source = typeof body.locationSource === "string" ? body.locationSource.toUpperCase() : "";
  if (source === "CATALOG") {
    const location = catalogLocation(body.city, body.state);
    if (!location) throw new ServiceLocationError("UNVERIFIED_SERVICE_LOCATION", "Choose a city from the selected state's approved catalogue or verify it using a PIN code.", 400);
    return { ...location, verificationPostalCode: null, locationSource: "CATALOG" as const };
  }
  if (source === "POSTAL_LOOKUP") {
    const pin = typeof body.verificationPostalCode === "string" ? body.verificationPostalCode.trim() : "";
    if (!/^[1-9][0-9]{5}$/.test(pin)) throw new ServiceLocationError("INVALID_LOCATION_VERIFICATION_PIN", "Enter a valid six-digit PIN to verify this city.", 400);
    try {
      const location = await verifyPostalLocation({ pin, city: body.city, district: body.district, state: body.state });
      if (!location) throw new ServiceLocationError("POSTAL_LOCATION_MISMATCH", "The selected city, district and state do not match this PIN code.", 400);
      return { ...location, verificationPostalCode: pin, locationSource: "POSTAL_LOOKUP" as const };
    } catch (error) {
      if (error instanceof ServiceLocationError) throw error;
      if (error instanceof Error && error.message === "POSTAL_CODE_NOT_FOUND") throw new ServiceLocationError("POSTAL_CODE_NOT_FOUND", "No Indian postal location was found for this PIN code.", 404);
      throw new ServiceLocationError("POSTAL_LOOKUP_UNAVAILABLE", "Postal verification is temporarily unavailable. Try again before creating the location.", 503);
    }
  }
  throw new ServiceLocationError("LOCATION_VERIFICATION_REQUIRED", "Select a catalogue city or verify an unlisted city using its PIN code.", 400);
}

async function verifiedVendorCount(
  transaction: Prisma.TransactionClient,
  location: { city: string; state: string },
  service: { scope: VendorServiceScope; serviceType: VendorServiceType }
) {
  return transaction.vendor.count({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      serviceAreas: {
        some: {
          active: true,
          scope: service.scope,
          ...(service.scope === VendorServiceScope.WITHIN_CITY
            ? { originCity: { equals: location.city, mode: "insensitive" } }
            : service.scope === VendorServiceScope.WITHIN_STATE
              ? { originState: { equals: location.state, mode: "insensitive" } }
              : {}),
        },
      },
      serviceOfferings: { some: { active: true, serviceType: service.serviceType } },
    },
  });
}

async function readiness(transaction: Prisma.TransactionClient, locationId: string) {
  const location = await transaction.serviceLocation.findUnique({
    where: { id: locationId },
    select: { id: true, city: true, state: true, status: true, services: true },
  });
  if (!location) throw new ServiceLocationError("SERVICE_LOCATION_NOT_FOUND", "Service location was not found.", 404);
  const services = await Promise.all(location.services.map(async service => {
    const verifiedVendors = await verifiedVendorCount(transaction, location, service);
    return {
      id: service.id,
      scope: service.scope,
      serviceType: service.serviceType,
      status: service.status,
      verifiedVendors,
      minimumVerifiedVendors: service.minimumVerifiedVendors,
      ready: verifiedVendors >= service.minimumVerifiedVendors,
    };
  }));
  return {
    locationStatus: location.status,
    services,
    readyServices: services.filter(service => service.status === "READY" && service.ready).length,
    blockers: services.filter(service => service.status === "READY" && !service.ready),
  };
}

export async function createServiceLocation(body: Record<string, unknown>, actorUserId: string, ipAddress?: string | null) {
  const identity = await verifiedLocationIdentity(body);
  const city = locationName(identity.city, "City");
  const state = locationName(identity.state, "State");
  const data = {
    code: code(body.code, city, state), city, district: identity.district, state, countryCode: "IN", stateCode: identity.stateCode,
    verificationPostalCode: identity.verificationPostalCode, locationSource: identity.locationSource,
    locationVerifiedAt: new Date(), locationVerifiedByUserId: actorUserId,
    serviceablePostalCodes: postalCodes(body.serviceablePostalCodes) ?? [],
    operationsContactName: optionalText(body.operationsContactName, "Operations contact name", 100),
    operationsContactMobile: optionalMobile(body.operationsContactMobile),
    operationsContactEmail: optionalEmail(body.operationsContactEmail),
    plannedLaunchAt: optionalDate(body.plannedLaunchAt), createdByUserId: actorUserId,
  };
  try {
    return await prisma.$transaction(async transaction => {
      const location = await transaction.serviceLocation.create({ data, select: locationSelect });
      await transaction.crmAuditLog.create({ data: { actorUserId, action: "SERVICE_LOCATION_CREATED", entityType: "ServiceLocation", entityId: location.id, ipAddress: ipAddress ?? null, metadata: { code: location.code, city, state } } });
      return location;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ServiceLocationError("SERVICE_LOCATION_EXISTS", "A service location with this code or city and state already exists.", 409);
    }
    throw error;
  }
}

export async function updateServiceLocation(locationId: string, body: Record<string, unknown>, actorUserId: string, ipAddress?: string | null) {
  return prisma.$transaction(async transaction => {
    const current = await transaction.serviceLocation.findUnique({ where: { id: locationId } });
    if (!current) throw new ServiceLocationError("SERVICE_LOCATION_NOT_FOUND", "Service location was not found.", 404);
    if (current.status === ServiceLocationStatus.ACTIVE) throw new ServiceLocationError("ACTIVE_LOCATION_LOCKED", "Suspend the location before changing its configuration.", 409);
    if ((body.city !== undefined && String(body.city).trim().toLowerCase() !== current.city.toLowerCase()) ||
        (body.state !== undefined && String(body.state).trim().toLowerCase() !== current.state.toLowerCase()) ||
        (body.code !== undefined && String(body.code).trim().toUpperCase() !== current.code)) {
      throw new ServiceLocationError("LOCATION_IDENTITY_LOCKED", "City, state and location code cannot be changed after verification. Create a separate service location instead.", 409);
    }
    const city = body.city === undefined ? current.city : locationName(body.city, "City");
    const state = body.state === undefined ? current.state : locationName(body.state, "State");
    const location = await transaction.serviceLocation.update({
      where: { id: current.id },
      data: {
        ...(body.code !== undefined ? { code: code(body.code, city, state) } : {}),
        ...(body.city !== undefined ? { city } : {}),
        ...(body.state !== undefined ? { state } : {}),
        ...(body.serviceablePostalCodes !== undefined ? { serviceablePostalCodes: postalCodes(body.serviceablePostalCodes) } : {}),
        ...(body.operationsContactName !== undefined ? { operationsContactName: optionalText(body.operationsContactName, "Operations contact name", 100) } : {}),
        ...(body.operationsContactMobile !== undefined ? { operationsContactMobile: optionalMobile(body.operationsContactMobile) } : {}),
        ...(body.operationsContactEmail !== undefined ? { operationsContactEmail: optionalEmail(body.operationsContactEmail) } : {}),
        ...(body.plannedLaunchAt !== undefined ? { plannedLaunchAt: optionalDate(body.plannedLaunchAt) } : {}),
      },
      select: locationSelect,
    });
    await transaction.crmAuditLog.create({ data: { actorUserId, action: "SERVICE_LOCATION_UPDATED", entityType: "ServiceLocation", entityId: location.id, ipAddress: ipAddress ?? null } });
    return location;
  });
}

export async function verifyExistingServiceLocation(locationId: string, body: Record<string, unknown>, actorUserId: string, ipAddress?: string | null) {
  const current = await prisma.serviceLocation.findUnique({ where: { id: locationId } });
  if (!current) throw new ServiceLocationError("SERVICE_LOCATION_NOT_FOUND", "Service location was not found.", 404);
  if (current.locationSource !== "MANUAL_REVIEW") throw new ServiceLocationError("LOCATION_ALREADY_VERIFIED", "This service location already has canonical geography verification.", 409);
  const identity = await verifiedLocationIdentity({
    locationSource: body.locationSource,
    city: current.city,
    state: current.state,
    district: current.district || current.city,
    verificationPostalCode: body.verificationPostalCode,
  });
  if (identity.city.toLowerCase() !== current.city.toLowerCase() || identity.state.toLowerCase() !== current.state.toLowerCase()) {
    throw new ServiceLocationError("POSTAL_LOCATION_MISMATCH", "The verified PIN does not identify this existing city and state.", 409);
  }
  return prisma.$transaction(async transaction => {
    const location = await transaction.serviceLocation.update({
      where: { id: current.id, locationSource: "MANUAL_REVIEW" },
      data: {
        district: identity.district,
        stateCode: identity.stateCode,
        verificationPostalCode: identity.verificationPostalCode,
        locationSource: identity.locationSource,
        locationVerifiedAt: new Date(),
        locationVerifiedByUserId: actorUserId,
      },
      select: locationSelect,
    });
    await transaction.crmAuditLog.create({ data: { actorUserId, action: "SERVICE_LOCATION_GEOGRAPHY_VERIFIED", entityType: "ServiceLocation", entityId: current.id, ipAddress: ipAddress ?? null, metadata: { locationSource: identity.locationSource, stateCode: identity.stateCode, district: identity.district, verificationPostalCode: identity.verificationPostalCode } } });
    return location;
  });
}

export async function upsertLocationService(locationId: string, body: Record<string, unknown>, actorUserId: string, ipAddress?: string | null) {
  const input = serviceInput(body);
  return prisma.$transaction(async transaction => {
    const location = await transaction.serviceLocation.findUnique({ where: { id: locationId }, select: { id: true, city: true, state: true, status: true } });
    if (!location) throw new ServiceLocationError("SERVICE_LOCATION_NOT_FOUND", "Service location was not found.", 404);
    if (location.status === ServiceLocationStatus.ACTIVE) throw new ServiceLocationError("ACTIVE_LOCATION_LOCKED", "Suspend the location before changing its service matrix.", 409);
    if (input.status === LocationServiceStatus.READY) {
      const count = await verifiedVendorCount(transaction, location, input);
      if (count < input.minimumVerifiedVendors) throw new ServiceLocationError("INSUFFICIENT_VERIFIED_VENDORS", `This service requires ${input.minimumVerifiedVendors} verified vendors; ${count} currently qualify.`, 409);
    }
    const service = await transaction.serviceLocationService.upsert({
      where: { serviceLocationId_scope_serviceType: { serviceLocationId: location.id, scope: input.scope, serviceType: input.serviceType } },
      create: { serviceLocationId: location.id, ...input },
      update: input,
    });
    await transaction.crmAuditLog.create({ data: { actorUserId, action: "SERVICE_LOCATION_SERVICE_UPSERTED", entityType: "ServiceLocationService", entityId: service.id, ipAddress: ipAddress ?? null, metadata: { serviceLocationId: location.id, scope: service.scope, serviceType: service.serviceType } } });
    return service;
  });
}

export async function addStandardLocationServices(locationId: string, body: Record<string, unknown>, actorUserId: string, ipAddress?: string | null) {
  if (!Array.isArray(body.serviceTypes) || body.serviceTypes.length < 1 || body.serviceTypes.length > Object.values(VendorServiceType).length) {
    throw new ServiceLocationError("INVALID_STANDARD_SERVICES", "Select one or more supported services.", 400);
  }
  const serviceTypes = [...new Set(body.serviceTypes.map(item => enumValue(item, Object.values(VendorServiceType), "Service type")))];
  return prisma.$transaction(async transaction => {
    await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${locationId}))`;
    const location = await transaction.serviceLocation.findUnique({ where: { id: locationId }, select: { id: true, status: true } });
    if (!location) throw new ServiceLocationError("SERVICE_LOCATION_NOT_FOUND", "Service location was not found.", 404);
    if (location.status === ServiceLocationStatus.ACTIVE) throw new ServiceLocationError("ACTIVE_LOCATION_LOCKED", "Suspend the location before changing its service matrix.", 409);
    const existing = await transaction.serviceLocationService.findMany({
      where: { serviceLocationId: location.id, scope: VendorServiceScope.WITHIN_CITY, serviceType: { in: serviceTypes } },
      select: { serviceType: true },
    });
    const existingTypes = new Set(existing.map(service => service.serviceType));
    const missingTypes = serviceTypes.filter(serviceType => !existingTypes.has(serviceType));
    if (missingTypes.length) {
      const created = await transaction.serviceLocationService.createMany({
        data: missingTypes.map(serviceType => ({
          serviceLocationId: location.id,
          scope: VendorServiceScope.WITHIN_CITY,
          serviceType,
          fulfilmentMode: ServiceFulfilmentMode.QUOTATION,
          status: LocationServiceStatus.DRAFT,
          instantPricingAvailable: false,
          surveyRequired: true,
          minimumVerifiedVendors: 1,
        })),
        skipDuplicates: true,
      });
      await transaction.crmAuditLog.create({ data: { actorUserId, action: "SERVICE_LOCATION_STANDARD_SERVICES_ADDED", entityType: "ServiceLocation", entityId: location.id, ipAddress: ipAddress ?? null, metadata: { scope: VendorServiceScope.WITHIN_CITY, serviceTypes: missingTypes, createdCount: created.count } } });
      const services = await transaction.serviceLocationService.findMany({ where: { serviceLocationId: location.id }, orderBy: [{ scope: "asc" }, { serviceType: "asc" }] });
      return { createdCount: created.count, skippedCount: serviceTypes.length - created.count, services };
    }
    const services = await transaction.serviceLocationService.findMany({ where: { serviceLocationId: location.id }, orderBy: [{ scope: "asc" }, { serviceType: "asc" }] });
    return { createdCount: 0, skippedCount: serviceTypes.length, services };
  });
}

export async function changeServiceLocationStatus(locationId: string, body: Record<string, unknown>, actorUserId: string, ipAddress?: string | null) {
  const action = typeof body.action === "string" ? body.action.toUpperCase() : "";
  const reason = action === "SUSPEND" ? text(body.reason, "Suspension reason", 3, 1000) : optionalText(body.reason, "Status reason", 1000);
  if (!["MARK_READY", "ACTIVATE", "SUSPEND"].includes(action)) throw new ServiceLocationError("INVALID_LOCATION_ACTION", "Use MARK_READY, ACTIVATE or SUSPEND.", 400);
  return prisma.$transaction(async transaction => {
    await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${locationId}))`;
    const current = await transaction.serviceLocation.findUnique({ where: { id: locationId } });
    if (!current) throw new ServiceLocationError("SERVICE_LOCATION_NOT_FOUND", "Service location was not found.", 404);
    const check = await readiness(transaction, current.id);
    let toStatus: ServiceLocationStatus;
    if (action === "MARK_READY") {
      if (current.status !== ServiceLocationStatus.DRAFT && current.status !== ServiceLocationStatus.SUSPENDED) throw new ServiceLocationError("INVALID_LOCATION_TRANSITION", "Only draft or suspended locations can be marked ready.", 409);
      if (check.readyServices < 1 || check.blockers.length) throw new ServiceLocationError("LOCATION_NOT_READY", "At least one ready service must satisfy its verified-vendor requirement.", 409);
      toStatus = ServiceLocationStatus.READY;
    } else if (action === "ACTIVATE") {
      if (current.status !== ServiceLocationStatus.READY) throw new ServiceLocationError("INVALID_LOCATION_TRANSITION", "Mark the location ready before activation.", 409);
      if (check.readyServices < 1 || check.blockers.length) throw new ServiceLocationError("LOCATION_NOT_READY", "Service readiness changed; resolve all vendor-capacity blockers before activation.", 409);
      toStatus = ServiceLocationStatus.ACTIVE;
      await transaction.serviceLocationService.updateMany({ where: { serviceLocationId: current.id, status: LocationServiceStatus.READY }, data: { status: LocationServiceStatus.ACTIVE } });
    } else {
      if (current.status !== ServiceLocationStatus.READY && current.status !== ServiceLocationStatus.ACTIVE) throw new ServiceLocationError("INVALID_LOCATION_TRANSITION", "Only ready or active locations can be suspended.", 409);
      toStatus = ServiceLocationStatus.SUSPENDED;
      await transaction.serviceLocationService.updateMany({ where: { serviceLocationId: current.id, status: LocationServiceStatus.ACTIVE }, data: { status: LocationServiceStatus.SUSPENDED } });
    }
    const now = new Date();
    const location = await transaction.serviceLocation.update({
      where: { id: current.id },
      data: {
        status: toStatus,
        ...(toStatus === ServiceLocationStatus.READY ? { approvedByUserId: actorUserId, approvedAt: now, suspendedByUserId: null, suspendedAt: null, suspensionReason: null } : {}),
        ...(toStatus === ServiceLocationStatus.ACTIVE ? { activatedByUserId: actorUserId, activatedAt: now } : {}),
        ...(toStatus === ServiceLocationStatus.SUSPENDED ? { suspendedByUserId: actorUserId, suspendedAt: now, suspensionReason: reason } : {}),
      },
      select: locationSelect,
    });
    await transaction.serviceLocationStatusHistory.create({ data: { serviceLocationId: current.id, fromStatus: current.status, toStatus, changedByUserId: actorUserId, reason } });
    await transaction.crmAuditLog.create({ data: { actorUserId, action: `SERVICE_LOCATION_${action}`, entityType: "ServiceLocation", entityId: current.id, ipAddress: ipAddress ?? null, metadata: { fromStatus: current.status, toStatus, reason } } });
    return { location, readiness: await readiness(transaction, current.id) };
  }, { maxWait: 10_000, timeout: 30_000 });
}

export async function getServiceLocation(locationId: string) {
  const location = await prisma.serviceLocation.findUnique({ where: { id: locationId }, select: locationSelect });
  if (!location) throw new ServiceLocationError("SERVICE_LOCATION_NOT_FOUND", "Service location was not found.", 404);
  const check = await prisma.$transaction(transaction => readiness(transaction, location.id));
  return { location, readiness: check };
}
