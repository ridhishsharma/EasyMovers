/**
 * ============================================================================
 * EasyMovers
 * Booking Builder
 * ============================================================================
 *
 * File:
 * domains/booking/builders/booking.builder.ts
 *
 * Responsibilities:
 * - Construct immutable Booking domain objects
 * - Generate Booking IDs and Booking codes
 * - Populate audit and timeline data
 * - Apply validated Booking updates and workflow actions
 *
 * This file does not:
 * - Validate input
 * - Access Prisma
 * - Call repositories
 * - Return HTTP responses
 * ============================================================================
 */

import crypto from "crypto";

import {
  BookingStatus,
} from "../models/booking.model";

import type {
  AIInventoryAnalysis,
  AssignVendorInput,
  BookingAudit,
  BookingPaymentSummary,
  BookingQuotationSummary,
  BookingRequest,
  BookingTimelineEvent,
  BookingTrackingSummary,
  CancelBookingInput,
  CreateBookingInput,
  UnassignVendorInput,
  UpdateBookingInput,
  UpdateBookingStatusInput,
  VendorAssignment,
} from "../models/booking.model";

/* ============================================================================
 * Internal helpers
 * ============================================================================
 */

function now(): string {
  return new Date()
    .toISOString();
}

function generateId(): string {
  return crypto.randomUUID();
}

function generateBookingCode():
  string {
  const date =
    new Date();

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  const random =
    Math.floor(
      Math.random() *
        9000 +
        1000
    );

  return `EM${year}${month}${day}${random}`;
}

function resolveCreationActor(
  input:
    CreateBookingInput
): string {
  return (
    input.createdBy ??
    input.userId ??
    `LEAD:${input.leadReferenceId}`
  );
}

function buildAudit(
  actorId: string,
  source:
    BookingAudit["source"]
): BookingAudit {
  const timestamp =
    now();

  return {
    createdAt:
      timestamp,

    createdBy:
      actorId,

    updatedAt:
      timestamp,

    updatedBy:
      actorId,

    source,
  };
}

function buildTimelineEvent(
  event: string,
  description: string,
  performedBy?: string
): BookingTimelineEvent {
  return {
    event,

    description,

    timestamp:
      now(),

    performedBy,
  };
}

function cloneAddress<T>(
  value: T
): T {
  return structuredClone(
    value
  );
}

/* ============================================================================
 * New Booking
 * ============================================================================
 */

export function buildNewBooking(
  input:
    CreateBookingInput
): BookingRequest {
  const actorId =
    resolveCreationActor(
      input
    );

  return {
    bookingId:
      generateId(),

    bookingCode:
      generateBookingCode(),

    customer: {
      leadId:
        input.leadId,

      leadReferenceId:
        input.leadReferenceId,

      userId:
        input.userId,
    },

    serviceType:
      input.serviceType,

    moveType:
      input.moveType,

    status:
      BookingStatus.DRAFT,

    contact:
      cloneAddress(
        input.contact
      ),

    pickupAddress:
      cloneAddress(
        input.pickupAddress
      ),

    dropAddress:
      cloneAddress(
        input.dropAddress
      ),

    schedule:
      cloneAddress(
        input.schedule
      ),

    inventory:
      input.inventory.map(
        (item) =>
          cloneAddress(
            item
          )
      ),

    inventorySummary:
      cloneAddress(
        input.inventorySummary
      ),

    services:
      cloneAddress(
        input.services
      ),

    requirements:
      input.requirements
        ? cloneAddress(
            input.requirements
          )
        : undefined,

    aiAnalysis:
      undefined,

    vendor:
      undefined,

    quotation:
      undefined,

    payment:
      undefined,

    tracking:
      undefined,

    timeline: [
      buildTimelineEvent(
        "BOOKING_CREATED",
        `Booking created from Lead ${input.leadReferenceId}.`,
        actorId
      ),
    ],

    audit:
      buildAudit(
        actorId,
        input.source
      ),
  };
}

/* ============================================================================
 * Editable Booking updates
 * ============================================================================
 */

export function applyBookingUpdate(
  booking:
    BookingRequest,
  input:
    UpdateBookingInput,
  updatedBy:
    string
): BookingRequest {
  return {
    ...booking,

    contact:
      input.contact
        ? cloneAddress(
            input.contact
          )
        : booking.contact,

    pickupAddress:
      input.pickupAddress
        ? cloneAddress(
            input.pickupAddress
          )
        : booking.pickupAddress,

    dropAddress:
      input.dropAddress
        ? cloneAddress(
            input.dropAddress
          )
        : booking.dropAddress,

    schedule:
      input.schedule
        ? cloneAddress(
            input.schedule
          )
        : booking.schedule,

    inventory:
      input.inventory
        ? input.inventory.map(
            (item) =>
              cloneAddress(
                item
              )
          )
        : booking.inventory,

    inventorySummary:
      input.inventorySummary
        ? cloneAddress(
            input.inventorySummary
          )
        : booking
            .inventorySummary,

    services:
      input.services
        ? cloneAddress(
            input.services
          )
        : booking.services,

    requirements:
      input.requirements !==
      undefined
        ? cloneAddress(
            input.requirements
          )
        : booking.requirements,

    timeline: [
      ...(booking.timeline ??
        []),

      buildTimelineEvent(
        "BOOKING_UPDATED",
        "Booking details updated successfully.",
        updatedBy
      ),
    ],

    audit: {
      ...booking.audit,

      updatedAt:
        now(),

      updatedBy,
    },
  };
}

/* ============================================================================
 * Status updates
 * ============================================================================
 */

export function applyBookingStatusUpdate(
  booking:
    BookingRequest,
  input:
    UpdateBookingStatusInput
): BookingRequest {
  const description =
    input.reason
      ? `Booking status changed to ${input.status}. Reason: ${input.reason}`
      : `Booking status changed to ${input.status}.`;

  return {
    ...booking,

    status:
      input.status,

    timeline: [
      ...(booking.timeline ??
        []),

      buildTimelineEvent(
        "BOOKING_STATUS_CHANGED",
        description,
        input.changedBy
      ),
    ],

    audit: {
      ...booking.audit,

      updatedAt:
        now(),

      updatedBy:
        input.changedBy,
    },
  };
}

/* ============================================================================
 * Vendor assignment
 * ============================================================================
 */

export function applyVendorAssignment(
  booking:
    BookingRequest,
  input:
    AssignVendorInput
): BookingRequest {
  const assignedAt =
    now();

  const vendor:
    VendorAssignment = {
    vendorId:
      input.vendorId,

    vendorCode:
      input.vendorCode,

    vendorName:
      input.vendorName,

    assignedAt,

    assignedBy:
      input.assignedBy,
  };

  const description =
    input.vendorName
      ? `Vendor ${input.vendorName} assigned to the Booking.`
      : `Vendor ${input.vendorId} assigned to the Booking.`;

  return {
    ...booking,

    vendor,

    status:
      BookingStatus
        .VENDOR_SELECTED,

    timeline: [
      ...(booking.timeline ??
        []),

      buildTimelineEvent(
        "VENDOR_ASSIGNED",
        description,
        input.assignedBy
      ),
    ],

    audit: {
      ...booking.audit,

      updatedAt:
        assignedAt,

      updatedBy:
        input.assignedBy,
    },
  };
}

export function applyVendorUnassignment(
  booking:
    BookingRequest,
  input:
    UnassignVendorInput
): BookingRequest {
  const updatedAt =
    now();

  const vendorDescription =
    booking.vendor
      ?.vendorName
      ? `Vendor ${booking.vendor.vendorName} removed from the Booking.`
      : booking.vendor
          ?.vendorId
        ? `Vendor ${booking.vendor.vendorId} removed from the Booking.`
        : "Assigned Vendor removed from the Booking.";

  return {
    ...booking,

    vendor:
      undefined,

    status:
      BookingStatus
        .QUOTATION_RECEIVED,

    timeline: [
      ...(booking.timeline ??
        []),

      buildTimelineEvent(
        "VENDOR_UNASSIGNED",
        `${vendorDescription} Reason: ${input.reason}`,
        input.unassignedBy
      ),
    ],

    audit: {
      ...booking.audit,

      updatedAt,

      updatedBy:
        input.unassignedBy,
    },
  };
}

/* ============================================================================
 * Cancellation
 * ============================================================================
 */

export function applyBookingCancellation(
  booking:
    BookingRequest,
  input:
    CancelBookingInput
): BookingRequest {
  const updatedAt =
    now();

  const descriptionParts = [
    `Booking cancelled. Reason: ${input.cancellationReason}`,
  ];

  if (
    input.customerRemarks
  ) {
    descriptionParts.push(
      `Customer remarks: ${input.customerRemarks}`
    );
  }

  if (
    input.internalRemarks
  ) {
    descriptionParts.push(
      `Internal remarks: ${input.internalRemarks}`
    );
  }

  return {
    ...booking,

    status:
      BookingStatus.CANCELLED,

    timeline: [
      ...(booking.timeline ??
        []),

      buildTimelineEvent(
        "BOOKING_CANCELLED",
        descriptionParts.join(
          " "
        ),
        input.cancelledBy
      ),
    ],

    audit: {
      ...booking.audit,

      updatedAt,

      updatedBy:
        input.cancelledBy,
    },
  };
}

/* ============================================================================
 * AI analysis
 * ============================================================================
 */

export function applyAIAnalysis(
  booking:
    BookingRequest,
  analysis:
    AIInventoryAnalysis,
  updatedBy:
    string
): BookingRequest {
  return {
    ...booking,

    aiAnalysis:
      cloneAddress(
        analysis
      ),

    timeline: [
      ...(booking.timeline ??
        []),

      buildTimelineEvent(
        "AI_ANALYSIS_COMPLETED",
        "AI inventory analysis completed.",
        updatedBy
      ),
    ],

    audit: {
      ...booking.audit,

      updatedAt:
        now(),

      updatedBy,
    },
  };
}

/* ============================================================================
 * Quotation summary
 * ============================================================================
 */

export function applyQuotationSummary(
  booking:
    BookingRequest,
  quotation:
    BookingQuotationSummary,
  updatedBy:
    string
): BookingRequest {
  const updatedAt =
    now();

  return {
    ...booking,

    quotation:
      cloneAddress(
        quotation
      ),

    status:
      quotation.totalQuotations >
      0
        ? BookingStatus
            .QUOTATION_RECEIVED
        : BookingStatus
            .QUOTATION_PENDING,

    timeline: [
      ...(booking.timeline ??
        []),

      buildTimelineEvent(
        "QUOTATION_UPDATED",
        `${quotation.totalQuotations} quotation(s) available.`,
        updatedBy
      ),
    ],

    audit: {
      ...booking.audit,

      updatedAt,

      updatedBy,
    },
  };
}

/* ============================================================================
 * Payment summary
 * ============================================================================
 */

export function applyPaymentSummary(
  booking:
    BookingRequest,
  payment:
    BookingPaymentSummary,
  updatedBy:
    string
): BookingRequest {
  return {
    ...booking,

    payment:
      cloneAddress(
        payment
      ),

    timeline: [
      ...(booking.timeline ??
        []),

      buildTimelineEvent(
        "PAYMENT_UPDATED",
        "Payment information updated.",
        updatedBy
      ),
    ],

    audit: {
      ...booking.audit,

      updatedAt:
        now(),

      updatedBy,
    },
  };
}

/* ============================================================================
 * Tracking summary
 * ============================================================================
 */

export function applyTrackingSummary(
  booking:
    BookingRequest,
  tracking:
    BookingTrackingSummary,
  updatedBy:
    string
): BookingRequest {
  return {
    ...booking,

    tracking:
      cloneAddress(
        tracking
      ),

    timeline: [
      ...(booking.timeline ??
        []),

      buildTimelineEvent(
        "TRACKING_UPDATED",
        "Tracking information updated.",
        updatedBy
      ),
    ],

    audit: {
      ...booking.audit,

      updatedAt:
        now(),

      updatedBy,
    },
  };
}

/* ============================================================================
 * Utilities
 * ============================================================================
 */

export function cloneBooking(
  booking:
    BookingRequest
): BookingRequest {
  return structuredClone(
    booking
  );
}

export function appendTimelineEvent(
  booking:
    BookingRequest,
  event:
    string,
  description:
    string,
  performedBy?:
    string
): BookingRequest {
  return {
    ...booking,

    timeline: [
      ...(booking.timeline ??
        []),

      buildTimelineEvent(
        event,
        description,
        performedBy
      ),
    ],

    audit: {
      ...booking.audit,

      updatedAt:
        now(),

      updatedBy:
        performedBy,
    },
  };
}