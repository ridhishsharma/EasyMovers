/**
 * ============================================================================
 * EasyMovers
 * Booking Request Mapper
 * ============================================================================
 *
 * File:
 * domains/booking/mappers/booking-request.mapper.ts
 *
 * Purpose:
 * - Convert raw API payloads into Booking domain inputs
 * - Normalize strings, dates, phone numbers and enum values
 * - Keep HTTP/controller code free from payload-shape logic
 * - Preserve the Booking domain model as the source of truth
 *
 * This file does not:
 * - Apply business validation
 * - Access Prisma
 * - Call repositories
 * - Generate booking IDs or booking codes
 * ============================================================================
 */

import {
  AddressType,
  BookingSource,
  BookingStatus,
  ContactPreference,
  InventoryCategory,
  LiftAvailability,
  MoveType,
  ParkingAccess,
  PropertyType,
  ServiceType,
  SpecialHandlingType,
} from "../models/booking.model";

import type {
  AIInventoryAnalysis,
  AssignVendorInput,
  BookingAddress,
  BookingContact,
  BookingPaymentSummary,
  BookingQuotationSummary,
  BookingRequirements,
  BookingSchedule,
  BookingSearchCriteria,
  BookingServices,
  BookingTrackingSummary,
  CancelBookingInput,
  CreateBookingInput,
  InventoryItem,
  InventorySummary,
  UnassignVendorInput,
  UpdateBookingInput,
  UpdateBookingStatusInput,
} from "../models/booking.model";

/* ============================================================================
 * Mapper result contracts
 * ============================================================================
 */

export type BookingRequestPayloadKind =
  | "normalized"
  | "unknown";

export interface BookingRequestMappingWarning {
  field: string;
  message: string;
  code:
    | "VALUE_NORMALIZED"
    | "VALUE_DEFAULTED"
    | "UNSUPPORTED_VALUE_IGNORED";
}

export interface BookingRequestMappingError {
  field: string;
  message: string;
  code:
    | "INVALID_PAYLOAD"
    | "REQUIRED_FIELD_MISSING"
    | "INVALID_FIELD_TYPE"
    | "INVALID_ENUM_VALUE"
    | "INVALID_DATE_VALUE";
}

export interface BookingRequestMappingSuccess<T> {
  success: true;
  data: T;
  payloadKind:
    BookingRequestPayloadKind;
  warnings:
    BookingRequestMappingWarning[];
}

export interface BookingRequestMappingFailure {
  success: false;
  payloadKind:
    BookingRequestPayloadKind;
  errors:
    BookingRequestMappingError[];
  warnings:
    BookingRequestMappingWarning[];
}

export type BookingRequestMappingResult<T> =
  | BookingRequestMappingSuccess<T>
  | BookingRequestMappingFailure;

/* ============================================================================
 * Public mapping functions
 * ============================================================================
 */

/**
 * Maps a raw request body into CreateBookingInput.
 */
export function mapCreateBookingRequest(
  payload: unknown
): BookingRequestMappingResult<
  CreateBookingInput
> {
  const context =
    createMappingContext(
      payload
    );

  if (!context.record) {
    return context.failure();
  }

  const record =
    context.record;

  const leadId =
    context.requiredString(
      record.leadId,
      "leadId"
    );

  const leadReferenceId =
    context.requiredString(
      record.leadReferenceId,
      "leadReferenceId"
    );

  const userId =
    context.optionalString(
      record.userId
    );

  const createdBy =
    context.optionalString(
      record.createdBy
    );

  const serviceType =
    context.requiredEnum(
      record.serviceType,
      ServiceType,
      "serviceType"
    );

  const moveType =
    context.requiredEnum(
      record.moveType,
      MoveType,
      "moveType"
    );

  const contact =
    mapBookingContact(
      record.contact,
      context,
      "contact"
    );

  const pickupAddress =
    mapBookingAddress(
      record.pickupAddress,
      AddressType.PICKUP,
      context,
      "pickupAddress"
    );

  const dropAddress =
    mapBookingAddress(
      record.dropAddress,
      AddressType.DROP,
      context,
      "dropAddress"
    );

  const schedule =
    mapBookingSchedule(
      record.schedule,
      context,
      "schedule"
    );

  const inventory =
    mapInventoryItems(
      record.inventory,
      context,
      "inventory"
    );

  const inventorySummary =
    mapInventorySummary(
      record.inventorySummary,
      inventory ?? [],
      context,
      "inventorySummary"
    );

  const services =
    mapBookingServices(
      record.services,
      context,
      "services"
    );

  const requirements =
    record.requirements ===
    undefined
      ? undefined
      : mapBookingRequirements(
          record.requirements,
          context,
          "requirements"
        );

  const source =
    context.optionalEnum(
      record.source,
      BookingSource,
      "source"
    ) ??
    BookingSource.WEB;

  if (
    !leadId ||
    !leadReferenceId ||
    !serviceType ||
    !moveType ||
    !contact ||
    !pickupAddress ||
    !dropAddress ||
    !schedule ||
    !inventory ||
    !inventorySummary ||
    !services
  ) {
    return context.failure();
  }

  const input:
    CreateBookingInput = {
    leadId,

    leadReferenceId,

    userId,

    serviceType,

    moveType,

    contact,

    pickupAddress,

    dropAddress,

    schedule,

    inventory,

    inventorySummary,

    services,

    requirements,

    source,

    createdBy,
  };

  return context.success(
    input
  );
}

/**
 * Maps a raw request body into UpdateBookingInput.
 */
export function mapUpdateBookingRequest(
  payload: unknown
): BookingRequestMappingResult<
  UpdateBookingInput
> {
  const context =
    createMappingContext(
      payload
    );

  if (!context.record) {
    return context.failure();
  }

  const record =
    context.record;

  const result:
    UpdateBookingInput = {};

  if (
    record.contact !==
    undefined
  ) {
    const contact =
      mapBookingContact(
        record.contact,
        context,
        "contact"
      );

    if (contact) {
      result.contact =
        contact;
    }
  }

  if (
    record.pickupAddress !==
    undefined
  ) {
    const pickupAddress =
      mapBookingAddress(
        record.pickupAddress,
        AddressType.PICKUP,
        context,
        "pickupAddress"
      );

    if (pickupAddress) {
      result.pickupAddress =
        pickupAddress;
    }
  }

  if (
    record.dropAddress !==
    undefined
  ) {
    const dropAddress =
      mapBookingAddress(
        record.dropAddress,
        AddressType.DROP,
        context,
        "dropAddress"
      );

    if (dropAddress) {
      result.dropAddress =
        dropAddress;
    }
  }

  if (
    record.schedule !==
    undefined
  ) {
    const schedule =
      mapBookingSchedule(
        record.schedule,
        context,
        "schedule"
      );

    if (schedule) {
      result.schedule =
        schedule;
    }
  }

  if (
    record.inventory !==
    undefined
  ) {
    const inventory =
      mapInventoryItems(
        record.inventory,
        context,
        "inventory"
      );

    if (inventory) {
      result.inventory =
        inventory;
    }
  }

  if (
    record.inventorySummary !==
    undefined
  ) {
    const inventorySummary =
      mapInventorySummary(
        record.inventorySummary,
        result.inventory ??
          [],
        context,
        "inventorySummary"
      );

    if (inventorySummary) {
      result.inventorySummary =
        inventorySummary;
    }
  }

  if (
    record.services !==
    undefined
  ) {
    const services =
      mapBookingServices(
        record.services,
        context,
        "services"
      );

    if (services) {
      result.services =
        services;
    }
  }

  if (
    record.requirements !==
    undefined
  ) {
    const requirements =
      mapBookingRequirements(
        record.requirements,
        context,
        "requirements"
      );

    if (requirements) {
      result.requirements =
        requirements;
    }
  }

  return context.hasErrors()
    ? context.failure()
    : context.success(
        result
      );
}

/**
 * Maps a raw status-change request.
 */
export function mapUpdateBookingStatusRequest(
  bookingId: string,
  payload: unknown
): BookingRequestMappingResult<
  UpdateBookingStatusInput
> {
  const context =
    createMappingContext(
      payload
    );

  if (!context.record) {
    return context.failure();
  }

  const status =
    context.requiredEnum(
      context.record.status,
      BookingStatus,
      "status"
    );

  const changedBy =
    context.requiredString(
      context.record.changedBy,
      "changedBy"
    );

  if (
    !status ||
    !changedBy
  ) {
    return context.failure();
  }

  return context.success({
    bookingId:
      bookingId.trim(),

    status,

    changedBy,

    reason:
      context.optionalString(
        context.record.reason
      ),

    remarks:
      context.optionalString(
        context.record.remarks
      ),
  });
}

/**
 * Maps a raw vendor-assignment request.
 */
export function mapAssignVendorRequest(
  bookingId: string,
  payload: unknown
): BookingRequestMappingResult<
  AssignVendorInput
> {
  const context =
    createMappingContext(
      payload
    );

  if (!context.record) {
    return context.failure();
  }

  const vendorId =
    context.requiredString(
      context.record.vendorId,
      "vendorId"
    );

  const assignedBy =
    context.requiredString(
      context.record.assignedBy,
      "assignedBy"
    );

  if (
    !vendorId ||
    !assignedBy
  ) {
    return context.failure();
  }

  return context.success({
    bookingId:
      bookingId.trim(),

    vendorId,

    vendorCode:
      context.optionalString(
        context.record.vendorCode
      )?.toUpperCase(),

    vendorName:
      context.optionalString(
        context.record.vendorName
      ),

    assignedBy,
  });
}

/**
 * Maps a raw vendor-unassignment request.
 */
export function mapUnassignVendorRequest(
  bookingId: string,
  payload: unknown
): BookingRequestMappingResult<
  UnassignVendorInput
> {
  const context =
    createMappingContext(
      payload
    );

  if (!context.record) {
    return context.failure();
  }

  const unassignedBy =
    context.requiredString(
      context.record.unassignedBy,
      "unassignedBy"
    );

  const reason =
    context.requiredString(
      context.record.reason,
      "reason"
    );

  if (
    !unassignedBy ||
    !reason
  ) {
    return context.failure();
  }

  return context.success({
    bookingId:
      bookingId.trim(),

    unassignedBy,

    reason,
  });
}

/**
 * Maps a raw booking-cancellation request.
 */
export function mapCancelBookingRequest(
  bookingId: string,
  payload: unknown
): BookingRequestMappingResult<
  CancelBookingInput
> {
  const context =
    createMappingContext(
      payload
    );

  if (!context.record) {
    return context.failure();
  }

  const cancelledBy =
    context.requiredString(
      context.record.cancelledBy,
      "cancelledBy"
    );

  const cancellationReason =
    context.requiredString(
      context.record
        .cancellationReason,
      "cancellationReason"
    );

  if (
    !cancelledBy ||
    !cancellationReason
  ) {
    return context.failure();
  }

  return context.success({
    bookingId:
      bookingId.trim(),

    cancelledBy,

    cancellationReason,

    customerRemarks:
      context.optionalString(
        context.record
          .customerRemarks
      ),

    internalRemarks:
      context.optionalString(
        context.record
          .internalRemarks
      ),
  });
}

/**
 * Maps a raw AI-analysis request.
 */
export function mapAIInventoryAnalysisRequest(
  payload: unknown
): BookingRequestMappingResult<
  AIInventoryAnalysis
> {
  const context =
    createMappingContext(
      payload
    );

  if (!context.record) {
    return context.failure();
  }

  const analyzed =
    context.requiredBoolean(
      context.record.analyzed,
      "analyzed"
    );

  if (
    analyzed ===
    undefined
  ) {
    return context.failure();
  }

  return context.success({
    analyzed,

    confidenceScore:
      context.optionalNumber(
        context.record
          .confidenceScore
      ),

    estimatedWeightKg:
      context.optionalNumber(
        context.record
          .estimatedWeightKg
      ),

    estimatedVolumeCubicFeet:
      context.optionalNumber(
        context.record
          .estimatedVolumeCubicFeet
      ),

    recommendedVehicle:
      context.optionalString(
        context.record
          .recommendedVehicle
      ),

    recommendedCrewSize:
      context.optionalInteger(
        context.record
          .recommendedCrewSize
      ),

    packingDifficulty:
      context.optionalLiteral(
        context.record
          .packingDifficulty,
        [
          "LOW",
          "MEDIUM",
          "HIGH",
        ] as const,
        "packingDifficulty"
      ),

    estimatedPackingTimeHours:
      context.optionalNumber(
        context.record
          .estimatedPackingTimeHours
      ),

    remarks:
      context.optionalStringArray(
        context.record.remarks
      ),
  });
}

/**
 * Maps a raw quotation-summary request.
 */
export function mapBookingQuotationSummaryRequest(
  payload: unknown
): BookingRequestMappingResult<
  BookingQuotationSummary
> {
  const context =
    createMappingContext(
      payload
    );

  if (!context.record) {
    return context.failure();
  }

  const totalQuotations =
    context.requiredInteger(
      context.record
        .totalQuotations,
      "totalQuotations"
    );

  if (
    totalQuotations ===
    undefined
  ) {
    return context.failure();
  }

  return context.success({
    totalQuotations,

    lowestQuote:
      context.optionalNumber(
        context.record.lowestQuote
      ),

    highestQuote:
      context.optionalNumber(
        context.record.highestQuote
      ),

    selectedQuoteAmount:
      context.optionalNumber(
        context.record
          .selectedQuoteAmount
      ),

    quotationExpiryDate:
      context.optionalDateString(
        context.record
          .quotationExpiryDate,
        "quotationExpiryDate"
      ),
  });
}

/**
 * Maps a raw payment-summary request.
 */
export function mapBookingPaymentSummaryRequest(
  payload: unknown
): BookingRequestMappingResult<
  BookingPaymentSummary
> {
  const context =
    createMappingContext(
      payload
    );

  if (!context.record) {
    return context.failure();
  }

  return context.success({
    totalAmount:
      context.optionalNumber(
        context.record.totalAmount
      ),

    advanceAmount:
      context.optionalNumber(
        context.record.advanceAmount
      ),

    balanceAmount:
      context.optionalNumber(
        context.record.balanceAmount
      ),

    paidAmount:
      context.optionalNumber(
        context.record.paidAmount
      ),

    paymentPending:
      context.optionalNumber(
        context.record
          .paymentPending
      ),
  });
}

/**
 * Maps a raw tracking-summary request.
 */
export function mapBookingTrackingSummaryRequest(
  payload: unknown
): BookingRequestMappingResult<
  BookingTrackingSummary
> {
  const context =
    createMappingContext(
      payload
    );

  if (!context.record) {
    return context.failure();
  }

  const liveTrackingEnabled =
    context.requiredBoolean(
      context.record
        .liveTrackingEnabled,
      "liveTrackingEnabled"
    );

  if (
    liveTrackingEnabled ===
    undefined
  ) {
    return context.failure();
  }

  return context.success({
    currentStage:
      context.optionalString(
        context.record.currentStage
      ),

    expectedPickupTime:
      context.optionalDateString(
        context.record
          .expectedPickupTime,
        "expectedPickupTime"
      ),

    expectedDeliveryTime:
      context.optionalDateString(
        context.record
          .expectedDeliveryTime,
        "expectedDeliveryTime"
      ),

    liveTrackingEnabled,
  });
}

/**
 * Maps URLSearchParams into BookingSearchCriteria.
 */
export function mapBookingSearchQuery(
  searchParams:
    URLSearchParams
): BookingSearchCriteria {
  const criteria:
    BookingSearchCriteria = {};

  assignOptionalString(
    criteria,
    "bookingCode",
    searchParams.get(
      "bookingCode"
    )
  );

  assignOptionalString(
    criteria,
    "leadId",
    searchParams.get(
      "leadId"
    )
  );

  assignOptionalString(
    criteria,
    "leadReferenceId",
    searchParams.get(
      "leadReferenceId"
    )
  );

  assignOptionalString(
    criteria,
    "userId",
    searchParams.get(
      "userId"
    )
  );

  assignOptionalString(
    criteria,
    "vendorId",
    searchParams.get(
      "vendorId"
    )
  );

  assignOptionalString(
    criteria,
    "mobileNumber",
    searchParams.get(
      "mobileNumber"
    )
  );

  assignOptionalString(
    criteria,
    "city",
    searchParams.get(
      "city"
    )
  );

  assignOptionalString(
    criteria,
    "state",
    searchParams.get(
      "state"
    )
  );

  const bookingStatus =
    normalizeEnumValue(
      searchParams.get(
        "bookingStatus"
      ),
      BookingStatus
    );

  if (bookingStatus) {
    criteria.bookingStatus =
      bookingStatus;
  }

  const serviceType =
    normalizeEnumValue(
      searchParams.get(
        "serviceType"
      ),
      ServiceType
    );

  if (serviceType) {
    criteria.serviceType =
      serviceType;
  }

  const moveType =
    normalizeEnumValue(
      searchParams.get(
        "moveType"
      ),
      MoveType
    );

  if (moveType) {
    criteria.moveType =
      moveType;
  }

  assignOptionalString(
    criteria,
    "moveDateFrom",
    searchParams.get(
      "moveDateFrom"
    )
  );

  assignOptionalString(
    criteria,
    "moveDateTo",
    searchParams.get(
      "moveDateTo"
    )
  );

  return criteria;
}

/* ============================================================================
 * Nested structure mappers
 * ============================================================================
 */

function mapBookingContact(
  value: unknown,
  context:
    BookingMappingContext,
  fieldPrefix: string
): BookingContact | undefined {
  const record =
    context.object(
      value,
      fieldPrefix
    );

  if (!record) {
    return undefined;
  }

  const fullName =
    context.requiredString(
      record.fullName,
      `${fieldPrefix}.fullName`
    );

  const mobileNumber =
    context.requiredString(
      record.mobileNumber,
      `${fieldPrefix}.mobileNumber`
    );

  const preferredContactMethod =
    context.optionalEnum(
      record
        .preferredContactMethod,
      ContactPreference,
      `${fieldPrefix}.preferredContactMethod`
    ) ??
    ContactPreference.PHONE;

  if (
    !fullName ||
    !mobileNumber
  ) {
    return undefined;
  }

  return {
    fullName,

    mobileNumber:
      normalizeIndianMobile(
        mobileNumber
      ),

    alternateMobileNumber:
      context.optionalString(
        record
          .alternateMobileNumber
      )
        ? normalizeIndianMobile(
            context.optionalString(
              record
                .alternateMobileNumber
            )!
          )
        : undefined,

    email:
      context.optionalString(
        record.email
      )?.toLowerCase(),

    preferredContactMethod,

    whatsappConsent:
      context.optionalBoolean(
        record.whatsappConsent
      ),
  };
}

function mapBookingAddress(
  value: unknown,
  expectedType:
    AddressType,
  context:
    BookingMappingContext,
  fieldPrefix: string
): BookingAddress | undefined {
  const record =
    context.object(
      value,
      fieldPrefix
    );

  if (!record) {
    return undefined;
  }

  const addressLine1 =
    context.requiredString(
      record.addressLine1,
      `${fieldPrefix}.addressLine1`
    );

  const city =
    context.requiredString(
      record.city,
      `${fieldPrefix}.city`
    );

  const state =
    context.requiredString(
      record.state,
      `${fieldPrefix}.state`
    );

  const postalCode =
    context.requiredString(
      record.postalCode,
      `${fieldPrefix}.postalCode`
    );

  const country =
    context.optionalString(
      record.country
    ) ??
    "India";

  const propertyType =
    context.optionalEnum(
      record.propertyType,
      PropertyType,
      `${fieldPrefix}.propertyType`
    ) ??
    PropertyType.OTHER;

  const liftAvailability =
    context.optionalEnum(
      record.liftAvailability,
      LiftAvailability,
      `${fieldPrefix}.liftAvailability`
    ) ??
    LiftAvailability.UNKNOWN;

  const parkingAccess =
    context.optionalEnum(
      record.parkingAccess,
      ParkingAccess,
      `${fieldPrefix}.parkingAccess`
    ) ??
    ParkingAccess.UNKNOWN;

  if (
    !addressLine1 ||
    !city ||
    !state ||
    !postalCode
  ) {
    return undefined;
  }

  const coordinatesRecord =
    record.coordinates ===
    undefined
      ? undefined
      : context.object(
          record.coordinates,
          `${fieldPrefix}.coordinates`
        );

  return {
    type:
      expectedType,

    addressLine1,

    addressLine2:
      context.optionalString(
        record.addressLine2
      ),

    landmark:
      context.optionalString(
        record.landmark
      ),

    locality:
      context.optionalString(
        record.locality
      ),

    city,

    district:
      context.optionalString(
        record.district
      ),

    state,

    postalCode,

    country,

    digipin:
      context.optionalString(
        record.digipin
      )?.toUpperCase(),

    propertyType,

    floorNumber:
      context.optionalInteger(
        record.floorNumber
      ),

    totalFloors:
      context.optionalInteger(
        record.totalFloors
      ),

    liftAvailability,

    parkingAccess,

    walkingDistanceMeters:
      context.optionalNumber(
        record
          .walkingDistanceMeters
      ),

    coordinates:
      coordinatesRecord
        ? {
            latitude:
              context.requiredNumber(
                coordinatesRecord
                  .latitude,
                `${fieldPrefix}.coordinates.latitude`
              ) ??
              0,

            longitude:
              context.requiredNumber(
                coordinatesRecord
                  .longitude,
                `${fieldPrefix}.coordinates.longitude`
              ) ??
              0,
          }
        : undefined,

    accessNotes:
      context.optionalString(
        record.accessNotes
      ),
  };
}

function mapBookingSchedule(
  value: unknown,
  context:
    BookingMappingContext,
  fieldPrefix: string
): BookingSchedule | undefined {
  const record =
    context.object(
      value,
      fieldPrefix
    );

  if (!record) {
    return undefined;
  }

  const preferredMoveDate =
    context.requiredDateString(
      record.preferredMoveDate,
      `${fieldPrefix}.preferredMoveDate`
    );

  const flexibleDate =
    context.requiredBoolean(
      record.flexibleDate,
      `${fieldPrefix}.flexibleDate`
    );

  if (
    !preferredMoveDate ||
    flexibleDate ===
      undefined
  ) {
    return undefined;
  }

  return {
    preferredMoveDate,

    preferredTimeSlot:
      context.optionalString(
        record.preferredTimeSlot
      ),

    flexibleDate,

    alternateMoveDate:
      context.optionalDateString(
        record.alternateMoveDate,
        `${fieldPrefix}.alternateMoveDate`
      ),

    surveyRequired:
      context.optionalBoolean(
        record.surveyRequired
      ),

    surveyPreferredDate:
      context.optionalDateString(
        record.surveyPreferredDate,
        `${fieldPrefix}.surveyPreferredDate`
      ),
  };
}

function mapInventoryItems(
  value: unknown,
  context:
    BookingMappingContext,
  fieldPrefix: string
): InventoryItem[] | undefined {
  if (
    !Array.isArray(
      value
    )
  ) {
    context.addError({
      field:
        fieldPrefix,

      code:
        "INVALID_FIELD_TYPE",

      message:
        `${fieldPrefix} must be an array.`,
    });

    return undefined;
  }

  const items:
    InventoryItem[] = [];

  value.forEach(
    (
      itemValue,
      index
    ) => {
      const itemPrefix =
        `${fieldPrefix}.${index}`;

      const record =
        context.object(
          itemValue,
          itemPrefix
        );

      if (!record) {
        return;
      }

      const itemId =
        context.requiredString(
          record.itemId,
          `${itemPrefix}.itemId`
        );

      const name =
        context.requiredString(
          record.name,
          `${itemPrefix}.name`
        );

      const category =
        context.requiredEnum(
          record.category,
          InventoryCategory,
          `${itemPrefix}.category`
        );

      const quantity =
        context.requiredInteger(
          record.quantity,
          `${itemPrefix}.quantity`
        );

      if (
        !itemId ||
        !name ||
        !category ||
        quantity ===
          undefined
      ) {
        return;
      }

      items.push({
        itemId,

        name,

        category,

        quantity,

        description:
          context.optionalString(
            record.description
          ),

        estimatedWeightKg:
          context.optionalNumber(
            record
              .estimatedWeightKg
          ),

        estimatedVolumeCubicFeet:
          context.optionalNumber(
            record
              .estimatedVolumeCubicFeet
          ),

        handlingRequirements:
          mapEnumArray(
            record
              .handlingRequirements,
            SpecialHandlingType,
            context,
            `${itemPrefix}.handlingRequirements`
          ),

        isFragile:
          context.optionalBoolean(
            record.isFragile
          ),

        isHighValue:
          context.optionalBoolean(
            record.isHighValue
          ),

        declaredValue:
          context.optionalNumber(
            record.declaredValue
          ),
      });
    }
  );

  return items;
}

function mapInventorySummary(
  value: unknown,
  inventory:
    InventoryItem[],
  context:
    BookingMappingContext,
  fieldPrefix: string
): InventorySummary | undefined {
  if (
    value ===
    undefined
  ) {
    return {
      totalItems:
        inventory.reduce(
          (
            total,
            item
          ) =>
            total +
            item.quantity,
          0
        ),
    };
  }

  const record =
    context.object(
      value,
      fieldPrefix
    );

  if (!record) {
    return undefined;
  }

  const totalItems =
    context.requiredInteger(
      record.totalItems,
      `${fieldPrefix}.totalItems`
    );

  if (
    totalItems ===
    undefined
  ) {
    return undefined;
  }

  return {
    totalItems,

    estimatedWeightKg:
      context.optionalNumber(
        record
          .estimatedWeightKg
      ),

    estimatedVolumeCubicFeet:
      context.optionalNumber(
        record
          .estimatedVolumeCubicFeet
      ),

    furnitureCount:
      context.optionalInteger(
        record.furnitureCount
      ),

    applianceCount:
      context.optionalInteger(
        record.applianceCount
      ),

    electronicsCount:
      context.optionalInteger(
        record.electronicsCount
      ),

    fragileItemCount:
      context.optionalInteger(
        record.fragileItemCount
      ),

    vehicleCount:
      context.optionalInteger(
        record.vehicleCount
      ),

    boxCount:
      context.optionalInteger(
        record.boxCount
      ),
  };
}

function mapBookingServices(
  value: unknown,
  context:
    BookingMappingContext,
  fieldPrefix: string
): BookingServices | undefined {
  const record =
    context.object(
      value,
      fieldPrefix
    );

  if (!record) {
    return undefined;
  }

  return {
    packingRequired:
      context.booleanWithDefault(
        record.packingRequired,
        false
      ),

    unpackingRequired:
      context.booleanWithDefault(
        record.unpackingRequired,
        false
      ),

    loadingRequired:
      context.booleanWithDefault(
        record.loadingRequired,
        false
      ),

    unloadingRequired:
      context.booleanWithDefault(
        record.unloadingRequired,
        false
      ),

    furnitureDisassemblyRequired:
      context.booleanWithDefault(
        record
          .furnitureDisassemblyRequired,
        false
      ),

    furnitureAssemblyRequired:
      context.booleanWithDefault(
        record
          .furnitureAssemblyRequired,
        false
      ),

    acDismantlingRequired:
      context.booleanWithDefault(
        record
          .acDismantlingRequired,
        false
      ),

    acInstallationRequired:
      context.booleanWithDefault(
        record
          .acInstallationRequired,
        false
      ),

    tvDismantlingRequired:
      context.booleanWithDefault(
        record
          .tvDismantlingRequired,
        false
      ),

    tvInstallationRequired:
      context.booleanWithDefault(
        record
          .tvInstallationRequired,
        false
      ),

    geyserDismantlingRequired:
      context.booleanWithDefault(
        record
          .geyserDismantlingRequired,
        false
      ),

    geyserInstallationRequired:
      context.booleanWithDefault(
        record
          .geyserInstallationRequired,
        false
      ),

    washingMachineInstallationRequired:
      context.booleanWithDefault(
        record
          .washingMachineInstallationRequired,
        false
      ),

    electricianRequired:
      context.booleanWithDefault(
        record.electricianRequired,
        false
      ),

    carpenterRequired:
      context.booleanWithDefault(
        record.carpenterRequired,
        false
      ),

    storageRequired:
      context.booleanWithDefault(
        record.storageRequired,
        false
      ),

    insuranceRequired:
      context.booleanWithDefault(
        record.insuranceRequired,
        false
      ),
  };
}

function mapBookingRequirements(
  value: unknown,
  context:
    BookingMappingContext,
  fieldPrefix: string
): BookingRequirements | undefined {
  const record =
    context.object(
      value,
      fieldPrefix
    );

  if (!record) {
    return undefined;
  }

  return {
    specialInstructions:
      context.optionalString(
        record
          .specialInstructions
      ),

    preferredLanguage:
      context.optionalString(
        record.preferredLanguage
      ),

    requiresSeniorHandling:
      context.optionalBoolean(
        record
          .requiresSeniorHandling
      ),

    requiresWomenCrew:
      context.optionalBoolean(
        record.requiresWomenCrew
      ),

    requiresExpressDelivery:
      context.optionalBoolean(
        record
          .requiresExpressDelivery
      ),

    requiresTemperatureSensitiveHandling:
      context.optionalBoolean(
        record
          .requiresTemperatureSensitiveHandling
      ),

    petPresent:
      context.optionalBoolean(
        record.petPresent
      ),

    childrenPresent:
      context.optionalBoolean(
        record.childrenPresent
      ),
  };
}

/* ============================================================================
 * Mapping context
 * ============================================================================
 */

type StringEnum =
  Record<
    string,
    string
  >;

interface BookingMappingContext {
  record?:
    Record<string, unknown>;

  addError(
    error:
      BookingRequestMappingError
  ): void;

  hasErrors(): boolean;

  success<T>(
    data: T
  ):
    BookingRequestMappingSuccess<T>;

  failure():
    BookingRequestMappingFailure;

  object(
    value: unknown,
    field: string
  ):
    | Record<
        string,
        unknown
      >
    | undefined;

  requiredString(
    value: unknown,
    field: string
  ): string | undefined;

  optionalString(
    value: unknown
  ): string | undefined;

  requiredBoolean(
    value: unknown,
    field: string
  ): boolean | undefined;

  optionalBoolean(
    value: unknown
  ): boolean | undefined;

  booleanWithDefault(
    value: unknown,
    fallback: boolean
  ): boolean;

  requiredNumber(
    value: unknown,
    field: string
  ): number | undefined;

  optionalNumber(
    value: unknown
  ): number | undefined;

  requiredInteger(
    value: unknown,
    field: string
  ): number | undefined;

  optionalInteger(
    value: unknown
  ): number | undefined;

  requiredDateString(
    value: unknown,
    field: string
  ): string | undefined;

  optionalDateString(
    value: unknown,
    field: string
  ): string | undefined;

  requiredEnum<T extends StringEnum>(
    value: unknown,
    values: T,
    field: string
  ): T[keyof T] | undefined;

  optionalEnum<T extends StringEnum>(
    value: unknown,
    values: T,
    field: string
  ): T[keyof T] | undefined;

  optionalLiteral<
    const T extends
      readonly string[]
  >(
    value: unknown,
    values: T,
    field: string
  ): T[number] | undefined;

  optionalStringArray(
    value: unknown
  ): string[] | undefined;
}

function createMappingContext(
  payload: unknown
): BookingMappingContext {
  const errors:
    BookingRequestMappingError[] =
    [];

  const warnings:
    BookingRequestMappingWarning[] =
    [];

  const record =
    isRecord(
      payload
    )
      ? payload
      : undefined;

  if (!record) {
    errors.push({
      field:
        "payload",

      code:
        "INVALID_PAYLOAD",

      message:
        "Booking request payload must be a JSON object.",
    });
  }

  const context:
    BookingMappingContext = {
    record,

    addError(
      error
    ) {
      errors.push(
        error
      );
    },

    hasErrors() {
      return errors.length >
        0;
    },

    success<T>(
      data: T
    ) {
      return {
        success:
          true,

        data,

        payloadKind:
          "normalized",

        warnings,
      };
    },

    failure() {
      return {
        success:
          false,

        payloadKind:
          record
            ? "normalized"
            : "unknown",

        errors,

        warnings,
      };
    },

    object(
      value,
      field
    ) {
      if (
        !isRecord(
          value
        )
      ) {
        errors.push({
          field,

          code:
            "INVALID_FIELD_TYPE",

          message:
            `${field} must be an object.`,
        });

        return undefined;
      }

      return value;
    },

    requiredString(
      value,
      field
    ) {
      const result =
        normalizeString(
          value
        );

      if (!result) {
        errors.push({
          field,

          code:
            "REQUIRED_FIELD_MISSING",

          message:
            `${field} is required.`,
        });
      }

      return result;
    },

    optionalString(
      value
    ) {
      return normalizeString(
        value
      );
    },

    requiredBoolean(
      value,
      field
    ) {
      const result =
        normalizeBoolean(
          value
        );

      if (
        result ===
        undefined
      ) {
        errors.push({
          field,

          code:
            "INVALID_FIELD_TYPE",

          message:
            `${field} must be a boolean.`,
        });
      }

      return result;
    },

    optionalBoolean(
      value
    ) {
      return normalizeBoolean(
        value
      );
    },

    booleanWithDefault(
      value,
      fallback
    ) {
      return normalizeBoolean(
        value
      ) ??
      fallback;
    },

    requiredNumber(
      value,
      field
    ) {
      const result =
        normalizeNumber(
          value
        );

      if (
        result ===
        undefined
      ) {
        errors.push({
          field,

          code:
            "INVALID_FIELD_TYPE",

          message:
            `${field} must be a number.`,
        });
      }

      return result;
    },

    optionalNumber(
      value
    ) {
      return normalizeNumber(
        value
      );
    },

    requiredInteger(
      value,
      field
    ) {
      const result =
        normalizeInteger(
          value
        );

      if (
        result ===
        undefined
      ) {
        errors.push({
          field,

          code:
            "INVALID_FIELD_TYPE",

          message:
            `${field} must be a whole number.`,
        });
      }

      return result;
    },

    optionalInteger(
      value
    ) {
      return normalizeInteger(
        value
      );
    },

    requiredDateString(
      value,
      field
    ) {
      const result =
        normalizeDateString(
          value
        );

      if (!result) {
        errors.push({
          field,

          code:
            "INVALID_DATE_VALUE",

          message:
            `${field} must contain a valid date.`,
        });
      }

      return result;
    },

    optionalDateString(
      value,
      field
    ) {
      if (
        value ===
          undefined ||
        value ===
          null ||
        value ===
          ""
      ) {
        return undefined;
      }

      const result =
        normalizeDateString(
          value
        );

      if (!result) {
        errors.push({
          field,

          code:
            "INVALID_DATE_VALUE",

          message:
            `${field} must contain a valid date.`,
        });
      }

      return result;
    },

    requiredEnum<T extends StringEnum>(
      value: unknown,
      values: T,
      field: string
    ) {
      const result =
        normalizeEnumValue(
          value,
          values
        );

      if (!result) {
        errors.push({
          field,

          code:
            "INVALID_ENUM_VALUE",

          message:
            `${field} contains an unsupported value.`,
        });
      }

      return result;
    },

    optionalEnum<T extends StringEnum>(
      value: unknown,
      values: T,
      field: string
    ) {
      if (
        value ===
          undefined ||
        value ===
          null ||
        value ===
          ""
      ) {
        return undefined;
      }

      const result =
        normalizeEnumValue(
          value,
          values
        );

      if (!result) {
        errors.push({
          field,

          code:
            "INVALID_ENUM_VALUE",

          message:
            `${field} contains an unsupported value.`,
        });
      }

      return result;
    },

    optionalLiteral<
      const T extends
        readonly string[]
    >(
      value: unknown,
      values: T,
      field: string
    ) {
      if (
        value ===
          undefined ||
        value ===
          null ||
        value ===
          ""
      ) {
        return undefined;
      }

      const normalized =
        normalizeString(
          value
        )?.toUpperCase();

      if (
        !normalized ||
        !values.includes(
          normalized as
            T[number]
        )
      ) {
        errors.push({
          field,

          code:
            "INVALID_ENUM_VALUE",

          message:
            `${field} contains an unsupported value.`,
        });

        return undefined;
      }

      return normalized as
        T[number];
    },

    optionalStringArray(
      value
    ) {
      if (
        value ===
          undefined ||
        value ===
          null
      ) {
        return undefined;
      }

      if (
        !Array.isArray(
          value
        )
      ) {
        return undefined;
      }

      return value
        .map(
          normalizeString
        )
        .filter(
          (
            item
          ): item is string =>
            Boolean(item)
        );
    },
  };

  return context;
}

/* ============================================================================
 * Primitive normalization helpers
 * ============================================================================
 */

function isRecord(
  value: unknown
): value is
  Record<string, unknown> {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value
    )
  );
}

function normalizeString(
  value: unknown
): string | undefined {
  if (
    typeof value !==
    "string"
  ) {
    return undefined;
  }

  const normalized =
    value.trim();

  return normalized.length >
    0
    ? normalized
    : undefined;
}

function normalizeBoolean(
  value: unknown
): boolean | undefined {
  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  if (
    typeof value ===
    "number"
  ) {
    if (
      value ===
      1
    ) {
      return true;
    }

    if (
      value ===
      0
    ) {
      return false;
    }
  }

  if (
    typeof value !==
    "string"
  ) {
    return undefined;
  }

  const normalized =
    value
      .trim()
      .toLowerCase();

  if (
    normalized ===
      "true" ||
    normalized ===
      "1" ||
    normalized ===
      "yes"
  ) {
    return true;
  }

  if (
    normalized ===
      "false" ||
    normalized ===
      "0" ||
    normalized ===
      "no"
  ) {
    return false;
  }

  return undefined;
}

function normalizeNumber(
  value: unknown
): number | undefined {
  if (
    typeof value ===
      "number" &&
    Number.isFinite(
      value
    )
  ) {
    return value;
  }

  if (
    typeof value ===
      "string" &&
    value.trim()
  ) {
    const parsed =
      Number(
        value
      );

    return Number.isFinite(
      parsed
    )
      ? parsed
      : undefined;
  }

  return undefined;
}

function normalizeInteger(
  value: unknown
): number | undefined {
  const number =
    normalizeNumber(
      value
    );

  return (
    number !==
      undefined &&
    Number.isInteger(
      number
    )
  )
    ? number
    : undefined;
}

function normalizeDateString(
  value: unknown
): string | undefined {
  if (
    value instanceof
    Date
  ) {
    return Number.isNaN(
      value.getTime()
    )
      ? undefined
      : value
          .toISOString()
          .slice(
            0,
            10
          );
  }

  const normalized =
    normalizeString(
      value
    );

  if (!normalized) {
    return undefined;
  }

  const parsed =
    new Date(
      normalized
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return undefined;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(
    normalized
  )
    ? normalized
    : parsed
        .toISOString()
        .slice(
          0,
          10
        );
}

function normalizeEnumValue<
  T extends StringEnum
>(
  value: unknown,
  values: T
): T[keyof T] | undefined {
  const normalized =
    normalizeString(
      value
    )
      ?.toUpperCase()
      .replace(
        /[\s-]+/g,
        "_"
      );

  if (!normalized) {
    return undefined;
  }

  const enumValues =
    Object.values(
      values
    );

  return enumValues.includes(
    normalized
  )
    ? normalized as
        T[keyof T]
    : undefined;
}

function normalizeIndianMobile(
  value: string
): string {
  const digits =
    value.replace(
      /\D/g,
      ""
    );

  if (
    digits.length ===
      12 &&
    digits.startsWith(
      "91"
    )
  ) {
    return digits.slice(
      2
    );
  }

  if (
    digits.length ===
      11 &&
    digits.startsWith(
      "0"
    )
  ) {
    return digits.slice(
      1
    );
  }

  return digits;
}

function mapEnumArray<
  T extends StringEnum
>(
  value: unknown,
  values: T,
  context:
    BookingMappingContext,
  field: string
):
  | T[keyof T][]
  | undefined {
  if (
    value ===
      undefined ||
    value ===
      null
  ) {
    return undefined;
  }

  if (
    !Array.isArray(
      value
    )
  ) {
    context.addError({
      field,

      code:
        "INVALID_FIELD_TYPE",

      message:
        `${field} must be an array.`,
    });

    return undefined;
  }

  const result:
    T[keyof T][] = [];

  value.forEach(
    (
      item,
      index
    ) => {
      const normalized =
        normalizeEnumValue(
          item,
          values
        );

      if (!normalized) {
        context.addError({
          field:
            `${field}.${index}`,

          code:
            "INVALID_ENUM_VALUE",

          message:
            `${field}.${index} contains an unsupported value.`,
        });

        return;
      }

      result.push(
        normalized
      );
    }
  );

  return result;
}

function assignOptionalString<
  T extends object,
  K extends keyof T
>(
  target: T,
  key: K,
  value: unknown
): void {
  const normalized =
    normalizeString(
      value
    );

  if (normalized) {
    target[key] =
      normalized as
        T[K];
  }
}