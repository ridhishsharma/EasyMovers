/**
 * Booking Validator
 *
 * Validates booking data before it enters the business layer.
 */

import {
  AddressType,
  AssignVendorInput,
  BookingAddress,
  BookingContact,
  BookingRequest,
  BookingSchedule,
  BookingStatus,
BookingQuotationSummary,
  BookingTrackingStage,
  CancelBookingInput,
  ConfirmBookingFromQuotationInput,
  CreateBookingInput,
  InventoryItem,
  UpdateBookingInput,
  UpdateBookingStatusInput,
  UnassignVendorInput,
} from "../models/booking.model";

function isValidTrackingUrl(
  value: string
): boolean {
  try {
    const url =
      new URL(
        value
      );

    return (
      url.protocol ===
        "http:" ||
      url.protocol ===
        "https:"
    );
  } catch {
    return false;
  }
}

export function validateBookingTrackingUpdateInput(
  input: {
    coordinates?: {
      latitude: number;
      longitude: number;
    };

    estimatedArrival?: string;
    actualArrival?: string;

    photoUrl?: string;
    signatureUrl?: string;

    updatedByRole?: string;
    remarks?: string;
    location?: string;
  }
): ValidationResult {
  const errors:
    ValidationError[] = [];

  const coordinates =
    input.coordinates;

  if (coordinates) {
    if (
      !Number.isFinite(
        coordinates.latitude
      ) ||
      coordinates.latitude < -90 ||
      coordinates.latitude > 90
    ) {
      errors.push({
        field:
          "tracking.coordinates.latitude",

        code:
          ValidationErrorCode.OUT_OF_RANGE,

        message:
          "Latitude must be a finite number between -90 and 90.",
      });
    }

    if (
      !Number.isFinite(
        coordinates.longitude
      ) ||
      coordinates.longitude < -180 ||
      coordinates.longitude > 180
    ) {
      errors.push({
        field:
          "tracking.coordinates.longitude",

        code:
          ValidationErrorCode.OUT_OF_RANGE,

        message:
          "Longitude must be a finite number between -180 and 180.",
      });
    }
  }

  if (
    input.estimatedArrival !==
      undefined &&
    Number.isNaN(
      new Date(
        input.estimatedArrival
      ).getTime()
    )
  ) {
    errors.push({
      field:
        "tracking.estimatedArrival",

      code:
        ValidationErrorCode.INVALID_VALUE,

      message:
        "Estimated arrival must contain a valid date and time.",
    });
  }

  if (
    input.actualArrival !==
      undefined &&
    Number.isNaN(
      new Date(
        input.actualArrival
      ).getTime()
    )
  ) {
    errors.push({
      field:
        "tracking.actualArrival",

      code:
        ValidationErrorCode.INVALID_VALUE,

      message:
        "Actual arrival must contain a valid date and time.",
    });
  }



  if (
    input.photoUrl !==
      undefined &&
    !isValidTrackingUrl(
      input.photoUrl
    )
  ) {
    errors.push({
      field:
        "tracking.photoUrl",

      code:
        ValidationErrorCode.INVALID_FORMAT,

      message:
        "Photo URL must be a valid HTTP or HTTPS URL.",
    });
  }

  if (
    input.signatureUrl !==
      undefined &&
    !isValidTrackingUrl(
      input.signatureUrl
    )
  ) {
    errors.push({
      field:
        "tracking.signatureUrl",

      code:
        ValidationErrorCode.INVALID_FORMAT,

      message:
        "Signature URL must be a valid HTTP or HTTPS URL.",
    });
  }

  return errors.length > 0
    ? failure(
        errors
      )
    : success();
}
/* -------------------------------------------------------------------------- */
/*                            ADDRESS VALIDATION                              */
/* -------------------------------------------------------------------------- */

export function validateAddress(
  address: BookingAddress,
  expectedType: AddressType,
  fieldPrefix: string
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!address) {
    return failure([
      requiredError(fieldPrefix, `${fieldPrefix} is required.`),
    ]);
  }

  if (address.type !== expectedType) {
    errors.push(
      invalidError(
        `${fieldPrefix}.type`,
        `Address type must be ${expectedType}.`
      )
    );
  }

  if (isEmpty(address.addressLine1)) {
    errors.push(
      requiredError(
        `${fieldPrefix}.addressLine1`,
        "Address line 1 is required."
      )
    );
  }

  if (isEmpty(address.city)) {
    errors.push(
      requiredError(`${fieldPrefix}.city`, "City is required.")
    );
  }

  if (isEmpty(address.state)) {
    errors.push(
      requiredError(`${fieldPrefix}.state`, "State is required.")
    );
  }

  if (isEmpty(address.postalCode)) {
    errors.push(
      requiredError(
        `${fieldPrefix}.postalCode`,
        "Postal code is required."
      )
    );
  } else if (!/^\d{6}$/.test(address.postalCode.trim())) {
    errors.push({
      field: `${fieldPrefix}.postalCode`,
      code: ValidationErrorCode.INVALID_FORMAT,
      message: "Postal code must contain exactly 6 digits.",
    });
  }

  if (isEmpty(address.country)) {
    errors.push(
      requiredError(`${fieldPrefix}.country`, "Country is required.")
    );
  }

  if (
    address.digipin !== undefined &&
    address.digipin.trim().length === 0
  ) {
    errors.push({
      field:
        `${fieldPrefix}.digipin`,

      code:
        ValidationErrorCode
          .INVALID_FORMAT,

      message:
        "DIGIPIN cannot be blank when provided.",
    });
  }

  if (
    address.floorNumber !== undefined &&
    (!Number.isInteger(address.floorNumber) || address.floorNumber < 0)
  ) {
    errors.push({
      field: `${fieldPrefix}.floorNumber`,
      code: ValidationErrorCode.OUT_OF_RANGE,
      message: "Floor number must be a non-negative whole number.",
    });
  }

  if (
    address.totalFloors !== undefined &&
    (!Number.isInteger(address.totalFloors) || address.totalFloors < 0)
  ) {
    errors.push({
      field: `${fieldPrefix}.totalFloors`,
      code: ValidationErrorCode.OUT_OF_RANGE,
      message: "Total floors must be a non-negative whole number.",
    });
  }

  if (
    address.floorNumber !== undefined &&
    address.totalFloors !== undefined &&
    address.floorNumber > address.totalFloors
  ) {
    errors.push({
      field: `${fieldPrefix}.floorNumber`,
      code: ValidationErrorCode.BUSINESS_RULE,
      message: "Floor number cannot be greater than total floors.",
    });
  }

  if (
    address.walkingDistanceMeters !== undefined &&
    address.walkingDistanceMeters < 0
  ) {
    errors.push({
      field: `${fieldPrefix}.walkingDistanceMeters`,
      code: ValidationErrorCode.OUT_OF_RANGE,
      message: "Walking distance cannot be negative.",
    });
  }

  if (address.coordinates) {
    const {
      latitude,
      longitude,
    } =
      address.coordinates;

    if (
      !Number.isFinite(
        latitude
      ) ||
      latitude < -90 ||
      latitude > 90
    ) {
      errors.push({
        field:
          `${fieldPrefix}.coordinates.latitude`,

        code:
          ValidationErrorCode
            .OUT_OF_RANGE,

        message:
          "Latitude must be a finite number between -90 and 90.",
      });
    }

    if (
      !Number.isFinite(
        longitude
      ) ||
      longitude < -180 ||
      longitude > 180
    ) {
      errors.push({
        field:
          `${fieldPrefix}.coordinates.longitude`,

        code:
          ValidationErrorCode
            .OUT_OF_RANGE,

        message:
          "Longitude must be a finite number between -180 and 180.",
      });
    }
  }

  return errors.length > 0
    ? failure(errors)
    : success();
}

/* -------------------------------------------------------------------------- */
/*                             CONTACT VALIDATION                             */
/* -------------------------------------------------------------------------- */

export function validateContact(
  contact: BookingContact
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!contact) {
    return failure([
      requiredError("contact", "Booking contact is required."),
    ]);
  }

  if (isEmpty(contact.fullName)) {
    errors.push(
      requiredError("contact.fullName", "Customer name is required.")
    );
  } else if (contact.fullName.trim().length < 2) {
    errors.push({
      field: "contact.fullName",
      code: ValidationErrorCode.INVALID_LENGTH,
      message: "Customer name must contain at least 2 characters.",
    });
  }

  if (isEmpty(contact.mobileNumber)) {
    errors.push(
      requiredError(
        "contact.mobileNumber",
        "Mobile number is required."
      )
    );
  } else if (!isValidMobile(contact.mobileNumber.trim())) {
    errors.push({
      field: "contact.mobileNumber",
      code: ValidationErrorCode.INVALID_FORMAT,
      message: "Enter a valid 10-digit Indian mobile number.",
    });
  }

  if (
    contact.alternateMobileNumber &&
    !isValidMobile(contact.alternateMobileNumber.trim())
  ) {
    errors.push({
      field: "contact.alternateMobileNumber",
      code: ValidationErrorCode.INVALID_FORMAT,
      message: "Enter a valid alternate 10-digit mobile number.",
    });
  }

  if (
    contact.alternateMobileNumber &&
    contact.alternateMobileNumber.trim() ===
      contact.mobileNumber.trim()
  ) {
    errors.push({
      field: "contact.alternateMobileNumber",
      code: ValidationErrorCode.DUPLICATE,
      message:
        "Alternate mobile number must differ from the primary number.",
    });
  }

  if (contact.email && !isValidEmail(contact.email.trim())) {
    errors.push({
      field: "contact.email",
      code: ValidationErrorCode.INVALID_FORMAT,
      message: "Enter a valid email address.",
    });
  }

  return errors.length > 0 ? failure(errors) : success();
}

/* -------------------------------------------------------------------------- */
/*                            INVENTORY VALIDATION                            */
/* -------------------------------------------------------------------------- */

export function validateInventory(
  inventory: InventoryItem[]
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!Array.isArray(inventory) || inventory.length === 0) {
    return failure([
      requiredError(
        "inventory",
        "At least one inventory item is required."
      ),
    ]);
  }

  const itemIds = new Set<string>();

  inventory.forEach((item, index) => {
    const fieldPrefix = `inventory.${index}`;

    if (isEmpty(item.itemId)) {
      errors.push(
        requiredError(
          `${fieldPrefix}.itemId`,
          "Inventory item ID is required."
        )
      );
    } else if (itemIds.has(item.itemId)) {
      errors.push({
        field: `${fieldPrefix}.itemId`,
        code: ValidationErrorCode.DUPLICATE,
        message: "Inventory item IDs must be unique.",
      });
    } else {
      itemIds.add(item.itemId);
    }

    if (isEmpty(item.name)) {
      errors.push(
        requiredError(
          `${fieldPrefix}.name`,
          "Inventory item name is required."
        )
      );
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      errors.push({
        field: `${fieldPrefix}.quantity`,
        code: ValidationErrorCode.OUT_OF_RANGE,
        message: "Quantity must be a positive whole number.",
      });
    }

    if (
      item.estimatedWeightKg !== undefined &&
      item.estimatedWeightKg < 0
    ) {
      errors.push({
        field: `${fieldPrefix}.estimatedWeightKg`,
        code: ValidationErrorCode.OUT_OF_RANGE,
        message: "Estimated weight cannot be negative.",
      });
    }

    if (
      item.estimatedVolumeCubicFeet !== undefined &&
      item.estimatedVolumeCubicFeet < 0
    ) {
      errors.push({
        field: `${fieldPrefix}.estimatedVolumeCubicFeet`,
        code: ValidationErrorCode.OUT_OF_RANGE,
        message: "Estimated volume cannot be negative.",
      });
    }

    if (
      item.declaredValue !== undefined &&
      item.declaredValue < 0
    ) {
      errors.push({
        field: `${fieldPrefix}.declaredValue`,
        code: ValidationErrorCode.OUT_OF_RANGE,
        message: "Declared value cannot be negative.",
      });
    }
  });

  return errors.length > 0 ? failure(errors) : success();
}

/* -------------------------------------------------------------------------- */
/*                             SCHEDULE VALIDATION                            */
/* -------------------------------------------------------------------------- */

export function validateSchedule(
  schedule: BookingSchedule
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!schedule) {
    return failure([
      requiredError("schedule", "Booking schedule is required."),
    ]);
  }

  if (isEmpty(schedule.preferredMoveDate)) {
    errors.push(
      requiredError(
        "schedule.preferredMoveDate",
        "Preferred move date is required."
      )
    );
  } else if (!isFutureOrToday(schedule.preferredMoveDate)) {
    errors.push({
      field: "schedule.preferredMoveDate",
      code: ValidationErrorCode.INVALID_VALUE,
      message: "Preferred move date must be today or a future date.",
    });
  }

  if (schedule.alternateMoveDate) {
    if (!isFutureOrToday(schedule.alternateMoveDate)) {
      errors.push({
        field: "schedule.alternateMoveDate",
        code: ValidationErrorCode.INVALID_VALUE,
        message: "Alternate move date must be today or a future date.",
      });
    }

    const preferredDate = new Date(schedule.preferredMoveDate);
    const alternateDate = new Date(schedule.alternateMoveDate);

    if (
      !Number.isNaN(preferredDate.getTime()) &&
      !Number.isNaN(alternateDate.getTime()) &&
      preferredDate.getTime() === alternateDate.getTime()
    ) {
      errors.push({
        field: "schedule.alternateMoveDate",
        code: ValidationErrorCode.DUPLICATE,
        message:
          "Alternate move date must differ from the preferred date.",
      });
    }
  }

  if (
    schedule.surveyRequired &&
    isEmpty(schedule.surveyPreferredDate)
  ) {
    errors.push(
      requiredError(
        "schedule.surveyPreferredDate",
        "Survey date is required when a survey is requested."
      )
    );
  }

  if (
    schedule.surveyPreferredDate &&
    !isFutureOrToday(schedule.surveyPreferredDate)
  ) {
    errors.push({
      field: "schedule.surveyPreferredDate",
      code: ValidationErrorCode.INVALID_VALUE,
      message: "Survey date must be today or a future date.",
    });
  }

  return errors.length > 0 ? failure(errors) : success();
}



/* -------------------------------------------------------------------------- */
/*                              VALIDATION TYPES                              */
/* -------------------------------------------------------------------------- */

export enum ValidationErrorCode {
  REQUIRED = "REQUIRED",

  INVALID = "INVALID",

  INVALID_FORMAT = "INVALID_FORMAT",

  INVALID_LENGTH = "INVALID_LENGTH",

  INVALID_VALUE = "INVALID_VALUE",

  DUPLICATE = "DUPLICATE",

  OUT_OF_RANGE = "OUT_OF_RANGE",

  BUSINESS_RULE = "BUSINESS_RULE",
}

export interface ValidationError {
  field: string;

  code: ValidationErrorCode;

  message: string;
}

export interface ValidationResult {
  valid: boolean;

  errors: ValidationError[];
}

/* -------------------------------------------------------------------------- */
/*                           HELPER RESULT METHODS                            */
/* -------------------------------------------------------------------------- */

function success(): ValidationResult {
  return {
    valid: true,
    errors: [],
  };
}

function failure(errors: ValidationError[]): ValidationResult {
  return {
    valid: false,
    errors,
  };
}

function requiredError(
  field: string,
  message: string
): ValidationError {
  return {
    field,
    code: ValidationErrorCode.REQUIRED,
    message,
  };
}

function invalidError(
  field: string,
  message: string
): ValidationError {
  return {
    field,
    code: ValidationErrorCode.INVALID,
    message,
  };
}

/* -------------------------------------------------------------------------- */
/*                             COMMON VALIDATORS                              */
/* -------------------------------------------------------------------------- */

function isEmpty(value?: string | null): boolean {
  return !value || value.trim().length === 0;
}

function isValidMobile(mobile: string): boolean {
  return /^[6-9]\d{9}$/.test(mobile);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isFutureOrToday(date: string): boolean {
  const moveDate = new Date(date);

  if (Number.isNaN(moveDate.getTime())) {
    return false;
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);
  moveDate.setHours(0, 0, 0, 0);

  return moveDate >= today;
}
/* -------------------------------------------------------------------------- */
/*                         VALIDATION RESULT COMBINER                         */
/* -------------------------------------------------------------------------- */

/**
 * Combines multiple validation results into one result.
 */
function combineValidationResults(
  results: ValidationResult[]
): ValidationResult {
  const errors = results.flatMap((result) => result.errors);

  return errors.length > 0 ? failure(errors) : success();
}

/* -------------------------------------------------------------------------- */
/*                         BOOKING ADDRESS COMPARISON                         */
/* -------------------------------------------------------------------------- */

/**
 * Creates a normalized address value for comparison.
 *
 * This prevents identical pickup and drop addresses from being accepted
 * because of differences in letter case or additional spaces.
 */
function normalizeAddress(address: BookingAddress): string {
  return [
    address.addressLine1,
    address.addressLine2,
    address.landmark,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.trim().toLowerCase())
    .join("|");
}

/**
 * Checks whether pickup and drop locations represent the same address.
 */
function areAddressesSame(
  pickupAddress: BookingAddress,
  dropAddress: BookingAddress
): boolean {
  if (
    pickupAddress.coordinates &&
    dropAddress.coordinates
  ) {
    const latitudeDifference = Math.abs(
      pickupAddress.coordinates.latitude -
        dropAddress.coordinates.latitude
    );

    const longitudeDifference = Math.abs(
      pickupAddress.coordinates.longitude -
        dropAddress.coordinates.longitude
    );

    const coordinateTolerance = 0.00001;

    if (
      latitudeDifference <= coordinateTolerance &&
      longitudeDifference <= coordinateTolerance
    ) {
      return true;
    }
  }

  return (
    normalizeAddress(pickupAddress) ===
    normalizeAddress(dropAddress)
  );
}

/* -------------------------------------------------------------------------- */
/*                         COMPLETE BOOKING VALIDATION                        */
/* -------------------------------------------------------------------------- */

/**
 * Validates a complete booking business object.
 *
 * This function combines all individual validators and applies
 * booking-level business rules.
 */
export function validateBooking(
  booking: BookingRequest
): ValidationResult {
  const bookingErrors: ValidationError[] = [];

  if (isEmpty(booking.bookingId)) {
    bookingErrors.push(
      requiredError(
        "bookingId",
        "Booking ID is required."
      )
    );
  }

  if (isEmpty(booking.bookingCode)) {
    bookingErrors.push(
      requiredError(
        "bookingCode",
        "Booking code is required."
      )
    );
  }

  if (!booking.customer) {
    bookingErrors.push(
      requiredError(
        "customer",
        "Booking customer reference is required."
      )
    );
  } else {
    if (
      isEmpty(
        booking.customer.leadId
      )
    ) {
      bookingErrors.push(
        requiredError(
          "customer.leadId",
          "Lead ID is required."
        )
      );
    }

    if (
      isEmpty(
        booking.customer
          .leadReferenceId
      )
    ) {
      bookingErrors.push(
        requiredError(
          "customer.leadReferenceId",
          "Lead reference ID is required."
        )
      );
    }
  }

  if (!booking.serviceType) {
    bookingErrors.push(
      requiredError(
        "serviceType",
        "Service type is required."
      )
    );
  }

  if (!booking.moveType) {
    bookingErrors.push(
      requiredError(
        "moveType",
        "Move type is required."
      )
    );
  }

  if (!booking.status) {
    bookingErrors.push(
      requiredError(
        "status",
        "Booking status is required."
      )
    );
  }

  if (
    booking.pickupAddress &&
    booking.dropAddress &&
    areAddressesSame(
      booking.pickupAddress,
      booking.dropAddress
    )
  ) {
    bookingErrors.push({
      field: "dropAddress",
      code: ValidationErrorCode.BUSINESS_RULE,
      message:
        "Pickup and drop addresses must be different.",
    });
  }

  if (!booking.audit) {
    bookingErrors.push(
      requiredError(
        "audit",
        "Booking audit information is required."
      )
    );
  } else {
    if (isEmpty(booking.audit.createdAt)) {
      bookingErrors.push(
        requiredError(
          "audit.createdAt",
          "Booking creation date is required."
        )
      );
    }

    if (isEmpty(booking.audit.updatedAt)) {
      bookingErrors.push(
        requiredError(
          "audit.updatedAt",
          "Booking update date is required."
        )
      );
    }

    if (!booking.audit.source) {
      bookingErrors.push(
        requiredError(
          "audit.source",
          "Booking source is required."
        )
      );
    }

    const createdAt = new Date(booking.audit.createdAt);
    const updatedAt = new Date(booking.audit.updatedAt);

    if (Number.isNaN(createdAt.getTime())) {
      bookingErrors.push({
        field: "audit.createdAt",
        code: ValidationErrorCode.INVALID_FORMAT,
        message: "Booking creation date is invalid.",
      });
    }

    if (Number.isNaN(updatedAt.getTime())) {
      bookingErrors.push({
        field: "audit.updatedAt",
        code: ValidationErrorCode.INVALID_FORMAT,
        message: "Booking update date is invalid.",
      });
    }

    if (
      !Number.isNaN(createdAt.getTime()) &&
      !Number.isNaN(updatedAt.getTime()) &&
      updatedAt.getTime() < createdAt.getTime()
    ) {
      bookingErrors.push({
        field: "audit.updatedAt",
        code: ValidationErrorCode.BUSINESS_RULE,
        message:
          "Booking update date cannot be earlier than its creation date.",
      });
    }
  }

  const results: ValidationResult[] = [
    bookingErrors.length > 0
      ? failure(bookingErrors)
      : success(),

    validateAddress(
      booking.pickupAddress,
      AddressType.PICKUP,
      "pickupAddress"
    ),

    validateAddress(
      booking.dropAddress,
      AddressType.DROP,
      "dropAddress"
    ),

    validateContact(booking.contact),

    validateInventory(booking.inventory),

    validateSchedule(booking.schedule),
  ];

  return combineValidationResults(results);
}

/* -------------------------------------------------------------------------- */
/*                      BOOKING STATUS TRANSITION RULES                       */
/* -------------------------------------------------------------------------- */

/**
 * Status values are normalized so this validator works with either:
 *
 * DRAFT
 * or
 * draft
 *
 * enum values.
 */
function normalizeStatus(status: BookingStatus): string {
  return String(status).trim().toUpperCase();
}

/**
 * Allowed booking workflow transitions.
 *
 * Keep this map synchronized with the BookingStatus enum.
 */
const ALLOWED_STATUS_TRANSITIONS: Readonly<
  Record<string, readonly string[]>
> = {
  DRAFT: [
    "SUBMITTED",
    "CANCELLED",
  ],

  SUBMITTED: [
    "UNDER_REVIEW",
    "QUOTATION_PENDING",
    "CANCELLED",
  ],

  UNDER_REVIEW: [
    "QUOTATION_PENDING",
    "CANCELLED",
  ],

  QUOTATION_PENDING: [
    "QUOTATION_RECEIVED",
    "CANCELLED",
  ],

  QUOTATION_RECEIVED: [
    "VENDOR_SELECTED",
    "QUOTATION_PENDING",
    "CANCELLED",
  ],

  VENDOR_SELECTED: [
    "CONFIRMED",
    "QUOTATION_RECEIVED",
    "CANCELLED",
  ],

  CONFIRMED: [
    "IN_PROGRESS",
    "CANCELLED",
  ],

  IN_PROGRESS: [
    "COMPLETED",
    "CANCELLED",
  ],

  COMPLETED: [],

  CANCELLED: [],
};

/**
 * Validates whether a booking can move from its current status
 * to the requested status.
 */
export function validateStatusTransition(
  currentStatus: BookingStatus,
  nextStatus: BookingStatus
): ValidationResult {
  const errors: ValidationError[] = [];

  const current = normalizeStatus(currentStatus);
  const next = normalizeStatus(nextStatus);

  if (current === next) {
    errors.push({
      field: "status",
      code: ValidationErrorCode.DUPLICATE,
      message:
        "The booking is already in the requested status.",
    });

    return failure(errors);
  }

  const allowedNextStatuses =
    ALLOWED_STATUS_TRANSITIONS[current];

  if (!allowedNextStatuses) {
    errors.push({
      field: "status",
      code: ValidationErrorCode.INVALID_VALUE,
      message: `Unknown current booking status: ${currentStatus}.`,
    });

    return failure(errors);
  }

  if (!allowedNextStatuses.includes(next)) {
    errors.push({
      field: "status",
      code: ValidationErrorCode.BUSINESS_RULE,
      message:
        `Booking status cannot change from ${currentStatus} ` +
        `to ${nextStatus}.`,
    });
  }

  return errors.length > 0
    ? failure(errors)
    : success();
}

/* -------------------------------------------------------------------------- */
/*                     BOOKING TRACKING TRANSITION RULES                      */
/* -------------------------------------------------------------------------- */

/**
 * Allowed operational tracking transitions.
 *
 * Tracking is intentionally stricter than Booking status.
 * Normal movement should progress forward through the operational lifecycle.
 */
const ALLOWED_TRACKING_TRANSITIONS: Readonly<
  Record<
    BookingTrackingStage,
    readonly BookingTrackingStage[]
  >
> = {
  [BookingTrackingStage.NOT_STARTED]: [
    BookingTrackingStage.BOOKING_CONFIRMED,
    BookingTrackingStage.CANCELLED,
  ],

  [BookingTrackingStage.BOOKING_CONFIRMED]: [
    BookingTrackingStage.VENDOR_ASSIGNED,
    BookingTrackingStage.CANCELLED,
  ],

  [BookingTrackingStage.VENDOR_ASSIGNED]: [
    BookingTrackingStage.SURVEY_SCHEDULED,
    BookingTrackingStage.PACKING_STARTED,
    BookingTrackingStage.CANCELLED,
  ],

  [BookingTrackingStage.SURVEY_SCHEDULED]: [
    BookingTrackingStage.SURVEY_COMPLETED,
    BookingTrackingStage.CANCELLED,
  ],

  [BookingTrackingStage.SURVEY_COMPLETED]: [
    BookingTrackingStage.PACKING_STARTED,
    BookingTrackingStage.CANCELLED,
  ],

  [BookingTrackingStage.PACKING_STARTED]: [
    BookingTrackingStage.PACKING_COMPLETED,
    BookingTrackingStage.CANCELLED,
  ],

  [BookingTrackingStage.PACKING_COMPLETED]: [
    BookingTrackingStage.LOADED,
    BookingTrackingStage.CANCELLED,
  ],

  [BookingTrackingStage.LOADED]: [
    BookingTrackingStage.IN_TRANSIT,
    BookingTrackingStage.CANCELLED,
  ],

  [BookingTrackingStage.IN_TRANSIT]: [
    BookingTrackingStage.ARRIVED_AT_DESTINATION,
    BookingTrackingStage.CANCELLED,
  ],

  [BookingTrackingStage.ARRIVED_AT_DESTINATION]: [
    BookingTrackingStage.UNLOADING_STARTED,
    BookingTrackingStage.CANCELLED,
  ],

  [BookingTrackingStage.UNLOADING_STARTED]: [
    BookingTrackingStage.UNLOADING_COMPLETED,
    BookingTrackingStage.CANCELLED,
  ],

  [BookingTrackingStage.UNLOADING_COMPLETED]: [
    BookingTrackingStage.DELIVERY_COMPLETED,
    BookingTrackingStage.CANCELLED,
  ],

  [BookingTrackingStage.DELIVERY_COMPLETED]: [],

  [BookingTrackingStage.CANCELLED]: [],
};

/**
 * Validates one operational tracking-stage transition.
 *
 * Replaying the same stage is treated as idempotent and therefore valid.
 * The service can later decide whether persistence/history work is required.
 */
export function validateTrackingTransition(
  currentStage:
    BookingTrackingStage,
  nextStage:
    BookingTrackingStage
): ValidationResult {
  if (
    currentStage ===
    nextStage
  ) {
    return success();
  }

  const allowedNextStages =
    ALLOWED_TRACKING_TRANSITIONS[
      currentStage
    ];

  if (
    !allowedNextStages
  ) {
    return failure([
      {
        field:
          "tracking.currentStage",

        code:
          ValidationErrorCode
            .INVALID_VALUE,

        message:
          `Unknown current tracking stage: ${currentStage}.`,
      },
    ]);
  }

  if (
    !allowedNextStages.includes(
      nextStage
    )
  ) {
    return failure([
      {
        field:
          "tracking.currentStage",

        code:
          ValidationErrorCode
            .BUSINESS_RULE,

        message:
          `Booking tracking cannot change from ${currentStage} to ${nextStage}.`,
      },
    ]);
  }

  return success();
}
/* -------------------------------------------------------------------------- */
/*                      VENDOR ASSIGNMENT VALIDATION                          */
/* -------------------------------------------------------------------------- */

/**
 * Validates whether a vendor can be assigned at the current
 * stage of the booking workflow.
 */
export function validateVendorAssignment(
  booking: BookingRequest
): ValidationResult {
  const errors: ValidationError[] = [];

  const currentStatus =
    normalizeStatus(
      booking.status
    );

  const assignableStatuses = [
    "QUOTATION_RECEIVED",
    "VENDOR_SELECTED",
  ];

  if (
    !assignableStatuses.includes(
      currentStatus
    )
  ) {
    errors.push({
      field:
        "status",

      code:
        ValidationErrorCode
          .BUSINESS_RULE,

      message:
        "A Vendor can only be assigned after quotations have been received.",
    });
  }

  if (
    !booking.quotation
      ?.selectedQuotationId
  ) {
    errors.push({
      field:
        "quotation.selectedQuotationId",

      code:
        ValidationErrorCode
          .BUSINESS_RULE,

      message:
        "A quotation must be selected before assigning a Vendor.",
    });
  }

  return errors.length > 0
    ? failure(errors)
    : success();
}

/* -------------------------------------------------------------------------- */
/*                         CANCELLATION VALIDATION                            */
/* -------------------------------------------------------------------------- */

/**
 * Validates whether a booking may be cancelled.
 */
export function validateBookingCancellation(
  booking: BookingRequest,
  cancellationReason: string
): ValidationResult {
  const errors: ValidationError[] = [];

  const currentStatus =
    normalizeStatus(
      booking.status
    );

  const currentTrackingStage =
  String(
    booking.tracking
      ?.currentStage ??
    ""
  )
    .trim()
    .toUpperCase()
    .replace(
      /[\s-]+/g,
      "_"
    );

  /* ------------------------------------------------------------------------
   * Terminal Booking protection
   * ------------------------------------------------------------------------
   */

  if (
    currentStatus ===
    "COMPLETED"
  ) {
    errors.push({
      field:
        "status",

      code:
        ValidationErrorCode
          .BUSINESS_RULE,

      message:
        "A completed booking cannot be cancelled.",
    });
  }

  if (
    currentStatus ===
    "CANCELLED"
  ) {
    errors.push({
      field:
        "status",

      code:
        ValidationErrorCode
          .DUPLICATE,

      message:
        "The booking has already been cancelled.",
    });
  }

  /* ------------------------------------------------------------------------
   * Terminal Tracking protection
   * ------------------------------------------------------------------------
   *
   * A Booking whose operational tracking has already reached delivery
   * completion must not be cancellable even when the Booking status itself
   * is stale or inconsistent.
   * ------------------------------------------------------------------------
   */

  if (
    currentTrackingStage ===
      "DELIVERY_COMPLETED" &&
    currentStatus !==
      "COMPLETED" &&
    currentStatus !==
      "CANCELLED"
  ) {
    errors.push({
      field:
        "tracking.currentStage",

      code:
        ValidationErrorCode
          .BUSINESS_RULE,

      message:
        "A booking with completed delivery tracking cannot be cancelled.",
    });
  }

  /* ------------------------------------------------------------------------
   * Cancellation reason
   * ------------------------------------------------------------------------
   */

  if (
    isEmpty(
      cancellationReason
    )
  ) {
    errors.push(
      requiredError(
        "cancellationReason",
        "A cancellation reason is required."
      )
    );
  } else if (
    cancellationReason
      .trim()
      .length <
    5
  ) {
    errors.push({
      field:
        "cancellationReason",

      code:
        ValidationErrorCode
          .INVALID_LENGTH,

      message:
        "Cancellation reason must contain at least 5 characters.",
    });
  }

  return errors.length > 0
    ? failure(
        errors
      )
    : success();
}

/* -------------------------------------------------------------------------- */
/*                         CREATE BOOKING VALIDATION                          */
/* -------------------------------------------------------------------------- */

/**
 * Validates the Lead-linked data required to create a Booking.
 *
 * System-generated fields are intentionally not validated here.
 */
export function validateCreateBookingInput(
  input: CreateBookingInput
): ValidationResult {
  const errors: ValidationError[] = [];

  if (
    isEmpty(
      input.leadId
    )
  ) {
    errors.push(
      requiredError(
        "leadId",
        "Lead ID is required."
      )
    );
  }

  if (
    isEmpty(
      input.leadReferenceId
    )
  ) {
    errors.push(
      requiredError(
        "leadReferenceId",
        "Lead reference ID is required."
      )
    );
  }

  if (!input.serviceType) {
    errors.push(
      requiredError(
        "serviceType",
        "Service type is required."
      )
    );
  }

  if (!input.moveType) {
    errors.push(
      requiredError(
        "moveType",
        "Move type is required."
      )
    );
  }

  if (!input.source) {
    errors.push(
      requiredError(
        "source",
        "Booking source is required."
      )
    );
  }

  if (
    input.pickupAddress &&
    input.dropAddress &&
    areAddressesSame(
      input.pickupAddress,
      input.dropAddress
    )
  ) {
    errors.push({
      field: "dropAddress",
      code: ValidationErrorCode.BUSINESS_RULE,
      message:
        "Pickup and drop addresses must be different.",
    });
  }

  const results: ValidationResult[] = [
    errors.length > 0
      ? failure(errors)
      : success(),

    validateAddress(
      input.pickupAddress,
      AddressType.PICKUP,
      "pickupAddress"
    ),

    validateAddress(
      input.dropAddress,
      AddressType.DROP,
      "dropAddress"
    ),

    validateContact(input.contact),

    validateInventory(input.inventory),

    validateSchedule(input.schedule),
  ];

  return combineValidationResults(results);
}

/* -------------------------------------------------------------------------- */
/*                         UPDATE BOOKING VALIDATION                          */
/* -------------------------------------------------------------------------- */

/**
 * Checks whether an update request contains at least one editable field.
 */
function hasBookingUpdateFields(
  input: UpdateBookingInput
): boolean {
  return (
    input.contact !== undefined ||
    input.pickupAddress !== undefined ||
    input.dropAddress !== undefined ||
    input.schedule !== undefined ||
    input.inventory !== undefined ||
    input.inventorySummary !== undefined ||
    input.services !== undefined ||
    input.requirements !== undefined
  );
}

/**
 * Validates only those fields that are present in an update request.
 *
 * This allows partial booking updates without requiring the entire
 * booking object to be submitted again.
 */
export function validateUpdateBookingInput(
  input: UpdateBookingInput,
  existingBooking?: BookingRequest
): ValidationResult {
  const results: ValidationResult[] = [];
  const errors: ValidationError[] = [];

  if (!hasBookingUpdateFields(input)) {
    errors.push({
      field: "booking",
      code: ValidationErrorCode.REQUIRED,
      message:
        "At least one editable booking field must be provided.",
    });
  }

  if (input.contact !== undefined) {
    results.push(
      validateContact(input.contact)
    );
  }

  if (input.pickupAddress !== undefined) {
    results.push(
      validateAddress(
        input.pickupAddress,
        AddressType.PICKUP,
        "pickupAddress"
      )
    );
  }

  if (input.dropAddress !== undefined) {
    results.push(
      validateAddress(
        input.dropAddress,
        AddressType.DROP,
        "dropAddress"
      )
    );
  }

  if (input.schedule !== undefined) {
    results.push(
      validateSchedule(input.schedule)
    );
  }

  if (input.inventory !== undefined) {
    results.push(
      validateInventory(input.inventory)
    );
  }

  /*
   * Compare the resulting pickup and drop addresses.
   *
   * When only one address is being updated, the other address is taken
   * from the existing booking.
   */
  if (existingBooking) {
    const resultingPickupAddress =
      input.pickupAddress ??
      existingBooking.pickupAddress;

    const resultingDropAddress =
      input.dropAddress ??
      existingBooking.dropAddress;

    if (
      areAddressesSame(
        resultingPickupAddress,
        resultingDropAddress
      )
    ) {
      errors.push({
        field: "dropAddress",
        code: ValidationErrorCode.BUSINESS_RULE,
        message:
          "Pickup and drop addresses must be different.",
      });
    }
  } else if (
    input.pickupAddress &&
    input.dropAddress &&
    areAddressesSame(
      input.pickupAddress,
      input.dropAddress
    )
  ) {
    errors.push({
      field: "dropAddress",
      code: ValidationErrorCode.BUSINESS_RULE,
      message:
        "Pickup and drop addresses must be different.",
    });
  }

  if (errors.length > 0) {
    results.unshift(failure(errors));
  }

  return results.length > 0
    ? combineValidationResults(results)
    : success();
}

/* -------------------------------------------------------------------------- */
/*                     EDITABILITY BUSINESS VALIDATION                       */
/* -------------------------------------------------------------------------- */

/**
 * Validates whether customer-editable booking details may still be changed.
 */
export function validateBookingEditability(
  booking: BookingRequest
): ValidationResult {
  const editableStatuses = [
    "DRAFT",
    "SUBMITTED",
    "UNDER_REVIEW",
    "QUOTATION_PENDING",
    "QUOTATION_RECEIVED",
  ];

  const currentStatus = normalizeStatus(
    booking.status
  );

  if (!editableStatuses.includes(currentStatus)) {
    return failure([
      {
        field: "status",
        code: ValidationErrorCode.BUSINESS_RULE,
        message:
          `Booking details cannot be edited while the booking ` +
          `status is ${booking.status}.`,
      },
    ]);
  }

  return success();
}

/* -------------------------------------------------------------------------- */
/*                     UPDATE STATUS INPUT VALIDATION                         */
/* -------------------------------------------------------------------------- */

/**
 * Validates the status-update command and its transition.
 */
export function validateUpdateBookingStatusInput(
  input: UpdateBookingStatusInput,
  currentStatus: BookingStatus
): ValidationResult {
  const errors: ValidationError[] = [];

  if (isEmpty(input.bookingId)) {
    errors.push(
      requiredError(
        "bookingId",
        "Booking ID is required."
      )
    );
  }

  if (!input.status) {
    errors.push(
      requiredError(
        "status",
        "New booking status is required."
      )
    );
  }

  if (isEmpty(input.changedBy)) {
    errors.push(
      requiredError(
        "changedBy",
        "The user changing the status is required."
      )
    );
  }

  const results: ValidationResult[] = [
    errors.length > 0
      ? failure(errors)
      : success(),
  ];

  if (input.status) {
    results.push(
      validateStatusTransition(
        currentStatus,
        input.status
      )
    );
  }

  return combineValidationResults(results);
}
/* -------------------------------------------------------------------------- */
/*                     QUOTATION SUMMARY VALIDATION                           */
/* -------------------------------------------------------------------------- */

/**
 * Validates a Booking quotation summary before it is persisted.
 *
 * Ensures:
 * - quotation counts are valid;
 * - quotation amounts are non-negative;
 * - lowest/highest quote ranges are consistent;
 * - selected quotation data is internally consistent;
 * - a selected quotation cannot exist when no quotations are available.
 */
export function validateBookingQuotationSummary(
  quotation: BookingQuotationSummary
): ValidationResult {
  const errors:
    ValidationError[] = [];

  /* ------------------------------------------------------------------------
   * Total quotations
   * ------------------------------------------------------------------------
   */

  if (
    !Number.isInteger(
      quotation.totalQuotations
    ) ||
    quotation.totalQuotations < 0
  ) {
    errors.push({
      field:
        "totalQuotations",

      code:
        ValidationErrorCode
          .INVALID_VALUE,

      message:
        "Total quotations must be a non-negative integer.",
    });
  }

  /* ------------------------------------------------------------------------
   * Quote amounts
   * ------------------------------------------------------------------------
   */

  if (
    quotation.lowestQuote !==
      undefined &&
    (
      !Number.isFinite(
        quotation.lowestQuote
      ) ||
      quotation.lowestQuote < 0
    )
  ) {
    errors.push({
      field:
        "lowestQuote",

      code:
        ValidationErrorCode
          .INVALID_VALUE,

      message:
        "Lowest quote must be a non-negative finite number.",
    });
  }

  if (
    quotation.highestQuote !==
      undefined &&
    (
      !Number.isFinite(
        quotation.highestQuote
      ) ||
      quotation.highestQuote < 0
    )
  ) {
    errors.push({
      field:
        "highestQuote",

      code:
        ValidationErrorCode
          .INVALID_VALUE,

      message:
        "Highest quote must be a non-negative finite number.",
    });
  }

  if (
    quotation.selectedQuoteAmount !==
      undefined &&
    (
      !Number.isFinite(
        quotation.selectedQuoteAmount
      ) ||
      quotation.selectedQuoteAmount <
        0
    )
  ) {
    errors.push({
      field:
        "selectedQuoteAmount",

      code:
        ValidationErrorCode
          .INVALID_VALUE,

      message:
        "Selected quote amount must be a non-negative finite number.",
    });
  }

  /* ------------------------------------------------------------------------
   * Lowest / highest consistency
   * ------------------------------------------------------------------------
   */

  if (
    quotation.lowestQuote !==
      undefined &&
    quotation.highestQuote !==
      undefined &&
    quotation.lowestQuote >
      quotation.highestQuote
  ) {
    errors.push({
      field:
        "lowestQuote",

      code:
        ValidationErrorCode
          .BUSINESS_RULE,

      message:
        "Lowest quote cannot be greater than highest quote.",
    });
  }

  /* ------------------------------------------------------------------------
   * Empty quotation state
   * ------------------------------------------------------------------------
   */

  if (
    quotation.totalQuotations === 0
  ) {
    if (
      quotation.selectedQuotationId
    ) {
      errors.push({
        field:
          "selectedQuotationId",

        code:
          ValidationErrorCode
            .BUSINESS_RULE,

        message:
          "A quotation cannot be selected when no quotations are available.",
      });
    }

    if (
      quotation.selectedQuoteAmount !==
      undefined
    ) {
      errors.push({
        field:
          "selectedQuoteAmount",

        code:
          ValidationErrorCode
            .BUSINESS_RULE,

        message:
          "A selected quote amount cannot exist when no quotations are available.",
      });
    }
  }

  /* ------------------------------------------------------------------------
   * Selected quotation consistency
   * ------------------------------------------------------------------------
   */

  const hasSelectedQuotation =
    !isEmpty(
      quotation
        .selectedQuotationId
    );

  const hasSelectedAmount =
    quotation.selectedQuoteAmount !==
    undefined;

  if (
    hasSelectedQuotation &&
    !hasSelectedAmount
  ) {
    errors.push({
      field:
        "selectedQuoteAmount",

      code:
        ValidationErrorCode
          .BUSINESS_RULE,

      message:
        "Selected quote amount is required when a quotation is selected.",
    });
  }

  if (
    !hasSelectedQuotation &&
    hasSelectedAmount
  ) {
    errors.push({
      field:
        "selectedQuotationId",

      code:
        ValidationErrorCode
          .BUSINESS_RULE,

      message:
        "Selected quotation ID is required when a selected quote amount is provided.",
    });
  }

  /* ------------------------------------------------------------------------
   * Selected amount must remain inside quotation range
   * ------------------------------------------------------------------------
   */

  if (
    quotation.selectedQuoteAmount !==
      undefined &&
    quotation.lowestQuote !==
      undefined &&
    quotation.selectedQuoteAmount <
      quotation.lowestQuote
  ) {
    errors.push({
      field:
        "selectedQuoteAmount",

      code:
        ValidationErrorCode
          .BUSINESS_RULE,

      message:
        "Selected quote amount cannot be lower than the lowest quotation.",
    });
  }

  if (
    quotation.selectedQuoteAmount !==
      undefined &&
    quotation.highestQuote !==
      undefined &&
    quotation.selectedQuoteAmount >
      quotation.highestQuote
  ) {
    errors.push({
      field:
        "selectedQuoteAmount",

      code:
        ValidationErrorCode
          .BUSINESS_RULE,

      message:
        "Selected quote amount cannot be higher than the highest quotation.",
    });
  }

  return errors.length > 0
    ? failure(
        errors
      )
    : success();
}
/* -------------------------------------------------------------------------- */
/*                       ASSIGN VENDOR INPUT VALIDATION                       */
/* -------------------------------------------------------------------------- */

/**
 * Validates the vendor-assignment command.
 */
export function validateAssignVendorInput(
  input: AssignVendorInput,
  booking: BookingRequest
): ValidationResult {
  const errors: ValidationError[] = [];

  if (isEmpty(input.bookingId)) {
    errors.push(
      requiredError(
        "bookingId",
        "Booking ID is required."
      )
    );
  }

  if (isEmpty(input.vendorId)) {
    errors.push(
      requiredError(
        "vendorId",
        "Vendor ID is required."
      )
    );
  }

  if (isEmpty(input.assignedBy)) {
    errors.push(
      requiredError(
        "assignedBy",
        "The user assigning the vendor is required."
      )
    );
  }

  if (
    input.bookingId &&
    input.bookingId !== booking.bookingId
  ) {
    errors.push({
      field: "bookingId",
      code: ValidationErrorCode.INVALID_VALUE,
      message:
        "Vendor assignment booking ID does not match the booking.",
    });
  }

 if (
  booking.vendor?.vendorId
) {
  if (
    booking.vendor.vendorId ===
    input.vendorId
  ) {
    errors.push({
      field:
        "vendorId",

      code:
        ValidationErrorCode
          .DUPLICATE,

      message:
        "This Vendor is already assigned to the Booking.",
    });
  } else {
    errors.push({
      field:
        "vendorId",

      code:
        ValidationErrorCode
          .BUSINESS_RULE,

      message:
        "A different Vendor is already assigned to the Booking. Unassign the existing Vendor before assigning another Vendor.",
    });
  }
}

  const results: ValidationResult[] = [
    errors.length > 0
      ? failure(errors)
      : success(),

    validateVendorAssignment(booking),
  ];

  return combineValidationResults(results);
}
/* -------------------------------------------------------------------------- */
/*              BOOKING CONFIRMATION FROM QUOTATION VALIDATION                */
/* -------------------------------------------------------------------------- */

/**
 * Validates the command that confirms a Booking from an accepted quotation.
 */
export function validateConfirmBookingFromQuotationInput(
  input:
    ConfirmBookingFromQuotationInput,
  booking:
    BookingRequest
): ValidationResult {
  const errors:
    ValidationError[] = [];

  /* ------------------------------------------------------------------------
   * Required identifiers
   * ------------------------------------------------------------------------
   */

  if (
    isEmpty(
      input.bookingId
    )
  ) {
    errors.push(
      requiredError(
        "bookingId",
        "Booking ID is required."
      )
    );
  }

  if (
    isEmpty(
      input.quotationId
    )
  ) {
    errors.push(
      requiredError(
        "quotationId",
        "Quotation ID is required."
      )
    );
  }

  if (
    isEmpty(
      input.vendorId
    )
  ) {
    errors.push(
      requiredError(
        "vendorId",
        "Vendor ID is required."
      )
    );
  }

  if (
    isEmpty(
      input.confirmedBy
    )
  ) {
    errors.push(
      requiredError(
        "confirmedBy",
        "The user confirming the booking is required."
      )
    );
  }

  if (
    isEmpty(
      input.currency
    )
  ) {
    errors.push(
      requiredError(
        "currency",
        "Quotation currency is required."
      )
    );
  }

  /* ------------------------------------------------------------------------
   * Booking identity
   * ------------------------------------------------------------------------
   */

  if (
    input.bookingId &&
    input.bookingId !==
      booking.bookingId
  ) {
    errors.push({
      field:
        "bookingId",

      code:
        ValidationErrorCode
          .INVALID_VALUE,

      message:
        "Confirmation booking ID does not match the booking.",
    });
  }

  /* ------------------------------------------------------------------------
   * Commercial values
   * ------------------------------------------------------------------------
   */

  if (
    !Number.isInteger(
      input.totalQuotations
    ) ||
    input.totalQuotations <=
      0
  ) {
    errors.push({
      field:
        "totalQuotations",

      code:
        ValidationErrorCode
          .OUT_OF_RANGE,

      message:
        "Total quotations must be a positive whole number.",
    });
  }

  if (
    !Number.isFinite(
      input.selectedQuoteAmount
    ) ||
    input.selectedQuoteAmount <=
      0
  ) {
    errors.push({
      field:
        "selectedQuoteAmount",

      code:
        ValidationErrorCode
          .OUT_OF_RANGE,

      message:
        "Selected quotation amount must be greater than zero.",
    });
  }

  /* ------------------------------------------------------------------------
   * Currency
   * ------------------------------------------------------------------------
   */

  if (
    input.currency &&
    input.currency
      .trim()
      .toUpperCase() !==
        "INR"
  ) {
    errors.push({
      field:
        "currency",

      code:
        ValidationErrorCode
          .BUSINESS_RULE,

      message:
        "Only INR quotations can currently confirm an EasyMovers booking.",
    });
  }

  /* ------------------------------------------------------------------------
   * Optional quotation expiry
   * ------------------------------------------------------------------------
   */

  if (
    input.quotationExpiryDate
  ) {
    const expiryDate =
      new Date(
        input
          .quotationExpiryDate
      );

    if (
      Number.isNaN(
        expiryDate.getTime()
      )
    ) {
      errors.push({
        field:
          "quotationExpiryDate",

        code:
          ValidationErrorCode
            .INVALID_VALUE,

        message:
          "Quotation expiry date must be a valid date.",
      });
    }
  }

  /* ------------------------------------------------------------------------
   * Terminal Booking protection
   * ------------------------------------------------------------------------
   */

  const currentStatus =
    normalizeStatus(
      booking.status
    );

  if (
    currentStatus ===
      "CANCELLED"
  ) {
    errors.push({
      field:
        "status",

      code:
        ValidationErrorCode
          .BUSINESS_RULE,

      message:
        "A cancelled booking cannot be confirmed from a quotation.",
    });
  }

  if (
    currentStatus ===
      "COMPLETED"
  ) {
    errors.push({
      field:
        "status",

      code:
        ValidationErrorCode
          .BUSINESS_RULE,

      message:
        "A completed booking cannot be confirmed from a quotation.",
    });
  }

  /* ------------------------------------------------------------------------
   * Conflicting quotation protection
   * ------------------------------------------------------------------------
   */

  const existingQuotationId =
    booking.quotation
      ?.selectedQuotationId;

  if (
    existingQuotationId &&
    existingQuotationId !==
      input.quotationId
  ) {
    errors.push({
      field:
        "quotationId",

      code:
        ValidationErrorCode
          .BUSINESS_RULE,

      message:
        "Booking already contains a different selected quotation.",
    });
  }

  /* ------------------------------------------------------------------------
   * Conflicting Vendor protection
   * ------------------------------------------------------------------------
   */

  const existingVendorId =
    booking.vendor
      ?.vendorId;

  if (
    existingVendorId &&
    existingVendorId !==
      input.vendorId
  ) {
    errors.push({
      field:
        "vendorId",

      code:
        ValidationErrorCode
          .BUSINESS_RULE,

      message:
        "Booking already contains a different assigned vendor.",
    });
  }

  /* ------------------------------------------------------------------------
   * Idempotent confirmation compatibility
   * ------------------------------------------------------------------------
   *
   * A Booking that is already CONFIRMED is allowed through validation only
   * when its existing quotation/vendor do not conflict with this command.
   *
   * The service will later decide whether this is an idempotent no-op.
   * ------------------------------------------------------------------------
   */

  return errors.length >
    0
    ? failure(
        errors
      )
    : success();
}
/**
 * Validates vendor unassignment.
 */
export function validateUnassignVendorInput(
  input: UnassignVendorInput,
  booking: BookingRequest
): ValidationResult {
  const errors:
    ValidationError[] = [];

  if (
    isEmpty(
      input.bookingId
    )
  ) {
    errors.push(
      requiredError(
        "bookingId",
        "Booking ID is required."
      )
    );
  }

  if (
    isEmpty(
      input.unassignedBy
    )
  ) {
    errors.push(
      requiredError(
        "unassignedBy",
        "The user removing the vendor is required."
      )
    );
  }

  if (
    isEmpty(
      input.reason
    )
  ) {
    errors.push(
      requiredError(
        "reason",
        "Reason for vendor removal is required."
      )
    );
  }

  if (
    input.bookingId &&
    input.bookingId !==
      booking.bookingId
  ) {
    errors.push({
      field:
        "bookingId",

      code:
        ValidationErrorCode
          .INVALID_VALUE,

      message:
        "Vendor unassignment booking ID does not match the booking.",
    });
  }

  if (
    !booking.vendor
  ) {
    errors.push({
      field:
        "vendor",

      code:
        ValidationErrorCode
          .BUSINESS_RULE,

      message:
        "No vendor is currently assigned to this booking.",
    });
  }

  const currentStatus =
    normalizeStatus(
      booking.status
    );

  const unassignableStatuses =
    [
      "QUOTATION_RECEIVED",
      "VENDOR_SELECTED",
    ];

  if (
    !unassignableStatuses.includes(
      currentStatus
    )
  ) {
    errors.push({
      field:
        "status",

      code:
        ValidationErrorCode
          .BUSINESS_RULE,

      message:
        "A Vendor can only be unassigned before the Booking is confirmed.",
    });
  }

  const currentTrackingStage =
    booking.tracking
      ?.currentStage ??
    BookingTrackingStage
      .NOT_STARTED;

  const unassignableTrackingStages:
    readonly BookingTrackingStage[] =
    [
      BookingTrackingStage
        .NOT_STARTED,
    ];

  if (
    !unassignableTrackingStages
      .includes(
        currentTrackingStage
      )
  ) {
    errors.push({
      field:
        "tracking.currentStage",

      code:
        ValidationErrorCode
          .BUSINESS_RULE,

      message:
        "A Vendor cannot be unassigned after the operational tracking lifecycle has started.",
    });
  }

  return errors.length >
    0
    ? failure(
        errors
      )
    : success();
}
/* -------------------------------------------------------------------------- */
/*                        CANCELLATION INPUT VALIDATION                       */
/* -------------------------------------------------------------------------- */

/**
 * Validates the cancellation command and booking cancellation rules.
 */
export function validateCancelBookingInput(
  input: CancelBookingInput,
  booking: BookingRequest
): ValidationResult {
  const errors: ValidationError[] = [];

  if (isEmpty(input.bookingId)) {
    errors.push(
      requiredError(
        "bookingId",
        "Booking ID is required."
      )
    );
  }

  if (isEmpty(input.cancelledBy)) {
    errors.push(
      requiredError(
        "cancelledBy",
        "The user cancelling the booking is required."
      )
    );
  }

  if (
    input.bookingId &&
    input.bookingId !== booking.bookingId
  ) {
    errors.push({
      field: "bookingId",
      code: ValidationErrorCode.INVALID_VALUE,
      message:
        "Cancellation booking ID does not match the booking.",
    });
  }

  const results: ValidationResult[] = [
    errors.length > 0
      ? failure(errors)
      : success(),

    validateBookingCancellation(
      booking,
      input.cancellationReason
    ),
  ];

  return combineValidationResults(results);
}