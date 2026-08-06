import {
  Prisma,
  TrackingStatus,
} from "@prisma/client";

import type {
  Booking as PrismaBooking,
} from "@prisma/client";

import {
  AddressType,
  BookingSource,
  BookingStatus,
  ContactPreference,
  LiftAvailability,
  MoveType,
  ParkingAccess,
  PropertyType,
  ServiceType,
} from "../models/booking.model";

import type {
  AIInventoryAnalysis,
  BookingAddress,
  BookingAudit,
  BookingContact,
  BookingListItem,
  BookingPaymentSummary,
  BookingQuotationSummary,
  BookingRequest,
  BookingRequirements,
  BookingSchedule,
  BookingServices,
  BookingTimelineEvent,
  BookingTrackingSummary,
  InventoryItem,
  InventorySummary,
  VendorAssignment,
} from "../models/booking.model";

/**
 * Booking Mapper
 *
 * Converts between:
 *
 * BookingRequest
 *      ⇄
 * Prisma Booking
 *
 * Searchable fields remain in normal database columns.
 * Complete Booking domain sections are preserved in JSON columns.
 */
export class BookingMapper {
  /**
   * Converts a complete Booking domain object into Prisma create data.
   *
   * The same mapped object is also compatible with Prisma update data
   * in the current Booking repository.
   */
  static toPrisma(
    booking: BookingRequest
  ): Prisma.BookingUncheckedCreateInput {
    const totalAmount =
      booking.payment?.totalAmount ??
      booking.quotation?.selectedQuoteAmount ??
      0;

    return {
      id:
        booking.bookingId,

      bookingNumber:
        booking.bookingCode,
leadId:
  booking.customer.leadId,

leadReferenceId:
  booking.customer.leadReferenceId,

      selectedQuotationId:
  booking.quotation
    ?.selectedQuotationId ??
  null,

      customerName:
        booking.contact.fullName,

      customerMobile:
        booking.contact.mobileNumber,

      customerEmail:
        booking.contact.email ??
        null,

      userId:
        booking.customer.userId ??
        null,

      serviceType:
        booking.serviceType,

      moveType:
        booking.moveType,

      moveDate:
        BookingMapper.toDate(
          booking.schedule
            .preferredMoveDate
        ),

      deliveryDate:
        BookingMapper.optionalDate(
          booking.tracking
            ?.expectedDeliveryTime
        ),

      pickupCity:
        booking.pickupAddress.city,

      pickupState:
        booking.pickupAddress.state,

      pickupPincode:
        booking.pickupAddress
          .postalCode,

      dropCity:
        booking.dropAddress.city,

      dropState:
        booking.dropAddress.state,

      dropPincode:
        booking.dropAddress
          .postalCode,

      pickupAddress:
        BookingMapper.formatAddress(
          booking.pickupAddress
        ),

      dropAddress:
        BookingMapper.formatAddress(
          booking.dropAddress
        ),

      contactJson:
        BookingMapper.toJson(
          booking.contact
        ),

      pickupAddressJson:
        BookingMapper.toJson(
          booking.pickupAddress
        ),

      dropAddressJson:
        BookingMapper.toJson(
          booking.dropAddress
        ),

      scheduleJson:
        BookingMapper.toJson(
          booking.schedule
        ),

      inventoryJson:
        BookingMapper.toJson(
          booking.inventory
        ),

      inventorySummaryJson:
        BookingMapper.toJson(
          booking.inventorySummary
        ),

      servicesJson:
        BookingMapper.toJson(
          booking.services
        ),

      requirementsJson:
        BookingMapper.toNullableJson(
          booking.requirements
        ),

      aiAnalysisJson:
        BookingMapper.toNullableJson(
          booking.aiAnalysis
        ),

      vendorId:
        booking.vendor?.vendorId ??
        null,

      vendorName:
        booking.vendor?.vendorName ??
        null,

      assignedVendorCode:
        booking.vendor?.vendorCode ??
        null,

      vendorJson:
        BookingMapper.toNullableJson(
          booking.vendor
        ),

      quotationJson:
        BookingMapper.toNullableJson(
          booking.quotation
        ),

      paymentJson:
        BookingMapper.toNullableJson(
          booking.payment
        ),

      trackingJson:
        BookingMapper.toNullableJson(
          booking.tracking
        ),

      timelineJson:
        BookingMapper.toJson(
          booking.timeline ??
          []
        ),

      auditJson:
        BookingMapper.toJson(
          booking.audit
        ),

      totalAmount:
        new Prisma.Decimal(
          totalAmount
        ),

      currency:
        "INR",

      bookingStatus:
        booking.status,

      paymentStatus:
        BookingMapper.resolvePaymentStatus(
          booking
        ),

      trackingStatus:
        BookingMapper.resolveTrackingStatus(
          booking.tracking
            ?.currentStage
        ),

      notes:
        booking.requirements
          ?.specialInstructions ??
        null,

      createdAt:
        BookingMapper.toDate(
          booking.audit.createdAt
        ),

      updatedAt:
        BookingMapper.toDate(
          booking.audit.updatedAt
        ),
    };
  }

  /**
   * Converts a Prisma Booking record into the complete
   * Booking domain object.
   */
  static fromPrisma(
    booking: PrismaBooking
  ): BookingRequest {
    const contact =
      BookingMapper.readJsonObject<
        BookingContact
      >(
        booking.contactJson
      ) ??
      BookingMapper.createContactFallback(
        booking
      );

    const pickupAddress =
      BookingMapper.readJsonObject<
        BookingAddress
      >(
        booking.pickupAddressJson
      ) ??
      BookingMapper.createAddressFallback({
        type:
          AddressType.PICKUP,

        address:
          booking.pickupAddress,

        city:
          booking.pickupCity,

        state:
          booking.pickupState,

        postalCode:
          booking.pickupPincode,
      });

    const dropAddress =
      BookingMapper.readJsonObject<
        BookingAddress
      >(
        booking.dropAddressJson
      ) ??
      BookingMapper.createAddressFallback({
        type:
          AddressType.DROP,

        address:
          booking.dropAddress,

        city:
          booking.dropCity,

        state:
          booking.dropState,

        postalCode:
          booking.dropPincode,
      });

    const schedule =
      BookingMapper.readJsonObject<
        BookingSchedule
      >(
        booking.scheduleJson
      ) ?? {
        preferredMoveDate:
          BookingMapper.toDateOnly(
            booking.moveDate
          ),

        flexibleDate:
          false,
      };

    const inventory =
      BookingMapper.readJsonArray<
        InventoryItem
      >(
        booking.inventoryJson
      );

    const inventorySummary =
      BookingMapper.readJsonObject<
        InventorySummary
      >(
        booking
          .inventorySummaryJson
      ) ?? {
        totalItems:
          inventory.reduce(
            (
              total,
              item
            ) =>
              total +
              (
                Number.isFinite(
                  item.quantity
                )
                  ? item.quantity
                  : 0
              ),
            0
          ),
      };

    const services =
      BookingMapper.readJsonObject<
        BookingServices
      >(
        booking.servicesJson
      ) ??
      BookingMapper.emptyServices();

    const requirements =
      BookingMapper.readOptionalJsonObject<
        BookingRequirements
      >(
        booking.requirementsJson
      ) ??
      (
        booking.notes
          ? {
              specialInstructions:
                booking.notes,
            }
          : undefined
      );

    const aiAnalysis =
      BookingMapper.readOptionalJsonObject<
        AIInventoryAnalysis
      >(
        booking.aiAnalysisJson
      );

    const vendor =
      BookingMapper.readOptionalJsonObject<
        VendorAssignment
      >(
        booking.vendorJson
      ) ??
      (
        booking.vendorId
          ? {
              vendorId:
                booking.vendorId,

              vendorCode:
                booking
                  .assignedVendorCode ??
                undefined,

              vendorName:
                booking.vendorName ??
                undefined,
            }
          : undefined
      );

    const quotation =
      BookingMapper.readOptionalJsonObject<
        BookingQuotationSummary
      >(
        booking.quotationJson
      ) ??
      BookingMapper.createQuotationFallback(
        booking
      );

    if (
      booking.selectedQuotationId
    ) {
      quotation.selectedQuotationId =
        booking.selectedQuotationId;
    }

    const payment =
      BookingMapper.readOptionalJsonObject<
        BookingPaymentSummary
      >(
        booking.paymentJson
      ) ??
      BookingMapper.createPaymentSummary(
        Number(
          booking.totalAmount
        ),
        booking.paymentStatus
      );

    const tracking =
      BookingMapper.readOptionalJsonObject<
        BookingTrackingSummary
      >(
        booking.trackingJson
      ) ?? {
        currentStage:
          booking.trackingStatus,

        expectedDeliveryTime:
          booking.deliveryDate
            ?.toISOString(),

        liveTrackingEnabled:
          false,
      };

    const timeline =
      BookingMapper.readJsonArray<
        BookingTimelineEvent
      >(
        booking.timelineJson
      );

    const audit =
      BookingMapper.readJsonObject<
        BookingAudit
      >(
        booking.auditJson
      ) ?? {
        createdAt:
          booking.createdAt
            .toISOString(),

        updatedAt:
          booking.updatedAt
            .toISOString(),

        source:
          BookingSource.API,
      };

    return {
      bookingId:
        booking.id,

      bookingCode:
        booking.bookingNumber,

      customer: {
        leadId:
          booking.leadId,

        leadReferenceId:
          booking.leadReferenceId,

        userId:
          booking.userId ??
          undefined,
      },

      serviceType:
        BookingMapper.toServiceType(
          booking.serviceType
        ),

      moveType:
        BookingMapper.toMoveType(
          booking.moveType
        ),

      status:
        BookingMapper.toBookingStatus(
          booking.bookingStatus
        ),

      contact,

      pickupAddress,

      dropAddress,

      schedule,

      inventory,

      inventorySummary,

      services,

      aiAnalysis,

      requirements,

      vendor,

      quotation,

      payment,

      tracking,

      timeline,

      audit,
    };
  }

  /**
   * Converts a Prisma Booking record into a lightweight
   * Booking list item.
   */
  static toListItem(
    booking: PrismaBooking
  ): BookingListItem {
    const quotation =
      BookingMapper.readOptionalJsonObject<
        BookingQuotationSummary
      >(
        booking.quotationJson
      );

    const persistedAmount =
      Number(
        booking.totalAmount
      );

    return {
      bookingId:
        booking.id,

      bookingCode:
        booking.bookingNumber,

      leadId:
        booking.leadId,

      leadReferenceId:
        booking.leadReferenceId,

      userId:
        booking.userId ??
        undefined,

      customerName:
        booking.customerName,

      mobileNumber:
        booking.customerMobile,

      serviceType:
        BookingMapper.toServiceType(
          booking.serviceType
        ),

      moveType:
        BookingMapper.toMoveType(
          booking.moveType
        ),

      status:
        BookingMapper.toBookingStatus(
          booking.bookingStatus
        ),

      pickupCity:
        booking.pickupCity,

      dropCity:
        booking.dropCity,

      preferredMoveDate:
        BookingMapper.toDateOnly(
          booking.moveDate
        ),

      assignedVendorCode:
        booking.assignedVendorCode ??
        undefined,

      selectedQuotationId:
        booking.selectedQuotationId ??
        quotation
          ?.selectedQuotationId,

      selectedQuoteAmount:
        quotation
          ?.selectedQuoteAmount ??
        (
          persistedAmount > 0
            ? persistedAmount
            : undefined
        ),

      createdAt:
        booking.createdAt
          .toISOString(),

      updatedAt:
        booking.updatedAt
          .toISOString(),
    };
  }

  private static formatAddress(
    address: BookingAddress
  ): string {
    return [
      address.addressLine1,
      address.addressLine2,
      address.locality,
      address.landmark,
      address.district,
      address.city,
      address.state,
      address.postalCode,
      address.country,
    ]
      .filter(
        (
          part
        ): part is string =>
          typeof part ===
            "string" &&
          part.trim().length >
            0
      )
      .map(
        (part) =>
          part.trim()
      )
      .join(", ");
  }

  private static createContactFallback(
    booking: PrismaBooking
  ): BookingContact {
    return {
      fullName:
        booking.customerName,

      mobileNumber:
        booking.customerMobile,

      email:
        booking.customerEmail ??
        undefined,

      preferredContactMethod:
        ContactPreference.PHONE,

      whatsappConsent:
        false,
    };
  }

  private static createAddressFallback(
    input: {
      type: AddressType;
      address: string;
      city: string;
      state: string;
      postalCode: string;
    }
  ): BookingAddress {
    return {
      type:
        input.type,

      addressLine1:
        input.address,

      city:
        input.city,

      state:
        input.state,

      postalCode:
        input.postalCode,

      country:
        "India",

      propertyType:
        PropertyType.OTHER,

      liftAvailability:
        LiftAvailability.UNKNOWN,

      parkingAccess:
        ParkingAccess.UNKNOWN,
    };
  }

  private static createQuotationFallback(
    booking: PrismaBooking
  ): BookingQuotationSummary {
    const totalAmount =
      Number(
        booking.totalAmount
      );

    if (
      totalAmount <= 0
    ) {
      return {
        totalQuotations:
          0,
      };
    }

    return {
      totalQuotations:
        1,

      lowestQuote:
        totalAmount,

      highestQuote:
        totalAmount,

      selectedQuotationId:
        booking.selectedQuotationId ??
        undefined,

      selectedQuoteAmount:
        totalAmount,
    };
  }

  private static emptyServices():
    BookingServices {
    return {
      packingRequired:
        false,

      unpackingRequired:
        false,

      loadingRequired:
        false,

      unloadingRequired:
        false,

      furnitureDisassemblyRequired:
        false,

      furnitureAssemblyRequired:
        false,

      acDismantlingRequired:
        false,

      acInstallationRequired:
        false,

      tvDismantlingRequired:
        false,

      tvInstallationRequired:
        false,

      geyserDismantlingRequired:
        false,

      geyserInstallationRequired:
        false,

      washingMachineInstallationRequired:
        false,

      electricianRequired:
        false,

      carpenterRequired:
        false,

      storageRequired:
        false,

      insuranceRequired:
        false,
    };
  }

  private static createPaymentSummary(
    totalAmount: number,
    status: string
  ): BookingPaymentSummary {
    const normalizedStatus =
      status
        .trim()
        .toUpperCase()
        .replace(
          /[\s-]+/g,
          "_"
        );

    if (
      normalizedStatus ===
      "PAID"
    ) {
      return {
        totalAmount,

        paidAmount:
          totalAmount,

        balanceAmount:
          0,

        paymentPending:
          0,
      };
    }

    return {
      totalAmount,

      paidAmount:
        0,

      balanceAmount:
        totalAmount,

      paymentPending:
        totalAmount,
    };
  }

  private static resolvePaymentStatus(
    booking: BookingRequest
  ): string {
    const totalAmount =
      booking.payment
        ?.totalAmount ??
      booking.quotation
        ?.selectedQuoteAmount ??
      0;

    const paidAmount =
      booking.payment
        ?.paidAmount ??
      0;

    if (
      totalAmount > 0 &&
      paidAmount >=
        totalAmount
    ) {
      return "PAID";
    }

    if (
      paidAmount > 0
    ) {
      return "PARTIALLY_PAID";
    }

    return "PENDING";
  }

  private static resolveTrackingStatus(
    stage?: string
  ): TrackingStatus {
    if (!stage) {
      return TrackingStatus
        .BOOKING_CONFIRMED;
    }

    const normalizedStage =
      stage
        .trim()
        .toUpperCase()
        .replace(
          /[\s-]+/g,
          "_"
        );

    const values =
      Object.values(
        TrackingStatus
      );

    return values.includes(
      normalizedStage as
        TrackingStatus
    )
      ? normalizedStage as
          TrackingStatus
      : TrackingStatus
          .BOOKING_CONFIRMED;
  }

  private static toServiceType(
    value: string
  ): ServiceType {
    const normalizedValue =
      value
        .trim()
        .toUpperCase()
        .replace(
          /[\s-]+/g,
          "_"
        );

    const values =
      Object.values(
        ServiceType
      );

    return values.includes(
      normalizedValue as
        ServiceType
    )
      ? normalizedValue as
          ServiceType
      : ServiceType
          .HOUSEHOLD_SHIFTING;
  }

  private static toMoveType(
    value: string
  ): MoveType {
    const normalizedValue =
      value
        .trim()
        .toUpperCase()
        .replace(
          /[\s-]+/g,
          "_"
        );

    const values =
      Object.values(
        MoveType
      );

    return values.includes(
      normalizedValue as
        MoveType
    )
      ? normalizedValue as
          MoveType
      : MoveType.INTERCITY;
  }

  private static toBookingStatus(
    value: string
  ): BookingStatus {
    const normalizedValue =
      value
        .trim()
        .toUpperCase()
        .replace(
          /[\s-]+/g,
          "_"
        );

    const values =
      Object.values(
        BookingStatus
      );

    return values.includes(
      normalizedValue as
        BookingStatus
    )
      ? normalizedValue as
          BookingStatus
      : BookingStatus.DRAFT;
  }

  private static toDate(
    value: string | Date
  ): Date {
    const result =
      value instanceof Date
        ? new Date(
            value.getTime()
          )
        : new Date(
            value
          );

    if (
      Number.isNaN(
        result.getTime()
      )
    ) {
      throw new Error(
        `Invalid booking date: ${String(
          value
        )}`
      );
    }

    return result;
  }

  private static optionalDate(
    value?: string
  ): Date | null {
    return value
      ? BookingMapper.toDate(
          value
        )
      : null;
  }

  private static toDateOnly(
    value: Date
  ): string {
    return value
      .toISOString()
      .slice(
        0,
        10
      );
  }

  /**
   * Converts a domain value into a Prisma-compatible JSON value.
   *
   * JSON serialization removes undefined properties so the
   * resulting value can be safely persisted by Prisma.
   */
  private static toJson(
    value: unknown
  ): Prisma.InputJsonValue {
    return JSON.parse(
      JSON.stringify(
        value
      )
    ) as
      Prisma.InputJsonValue;
  }

  /**
   * Converts optional domain values into Prisma JSON or database null.
   */
  private static toNullableJson(
    value: unknown
  ):
    | Prisma.InputJsonValue
    | Prisma.NullTypes.DbNull {
    if (
      value === undefined ||
      value === null
    ) {
      return Prisma.DbNull;
    }

    return BookingMapper.toJson(
      value
    );
  }

  private static readJsonObject<T>(
    value:
      Prisma.JsonValue
  ): T | undefined {
    if (
      typeof value !==
        "object" ||
      value === null ||
      Array.isArray(
        value
      )
    ) {
      return undefined;
    }

    return value as T;
  }

  private static readOptionalJsonObject<T>(
    value:
      Prisma.JsonValue |
      null
  ): T | undefined {
    if (
      value === null
    ) {
      return undefined;
    }

    return BookingMapper.readJsonObject<T>(
      value
    );
  }

  private static readJsonArray<T>(
    value:
      Prisma.JsonValue
  ): T[] {
    return Array.isArray(
      value
    )
      ? value as T[]
      : [];
  }
}