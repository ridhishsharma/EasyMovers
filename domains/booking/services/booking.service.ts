/* -------------------------------------------------------------------------- */
/*                             Booking Service                                */
/* -------------------------------------------------------------------------- */

import {
  BookingRequest,
  BookingOperationResult,
  BookingSearchCriteria,
  PaginatedBookingResult,
  CreateBookingInput,
ConfirmBookingFromQuotationInput,
  UpdateBookingInput,
  UpdateBookingStatusInput,
  AssignVendorInput,
  UnassignVendorInput,
  CancelBookingInput,
  AIInventoryAnalysis,
  BookingQuotationSummary,
  BookingPaymentSummary,
  BookingTrackingSummary,
BookingQuotationSummaryProvider,
BookingListItem,
} from "../models/booking.model";

import {
  BookingStatus,
  BookingTrackingStage,
} from "../models/booking.model";

import { BookingRepository } from "../repositories/booking.repository";

import {
  buildNewBooking,
  applyBookingUpdate,
  applyBookingStatusUpdate,
  applyVendorAssignment,
  applyVendorUnassignment,
  applyBookingCancellation,
  applyAIAnalysis,
applyBookingConfirmationFromQuotation,
  applyQuotationSummary,
  applyPaymentSummary,
  applyTrackingSummary,
applyTrackingTransition,
} from "../builders/booking.builder";

import {
  validateCreateBookingInput,
  validateUpdateBookingInput,
  validateUpdateBookingStatusInput,
  validateAssignVendorInput,
validateConfirmBookingFromQuotationInput,
  validateCancelBookingInput,
    validateUnassignVendorInput,
validateTrackingTransition,
validateBookingTrackingUpdateInput,
validateBookingQuotationSummary,
} from "../validators/booking.validator";

import type {
  BookingTrackingUpdateRequest,
} from "../mappers/booking-request.mapper";

/**
 * Booking Service
 *
 * Responsible for:
 * - Business workflow orchestration
 * - Validation
 * - Builder invocation
 * - Repository interaction
 *
 * Does NOT contain persistence logic.
 */

function resolveBookingStatusFromTrackingStage(
  stage: BookingTrackingStage
): BookingStatus {
  switch (stage) {
    case BookingTrackingStage
      .DELIVERY_COMPLETED:
      return BookingStatus
        .COMPLETED;

    case BookingTrackingStage
      .CANCELLED:
      return BookingStatus
        .CANCELLED;

    case BookingTrackingStage
      .PACKING_STARTED:

    case BookingTrackingStage
      .PACKING_COMPLETED:

    case BookingTrackingStage
      .LOADED:

    case BookingTrackingStage
      .IN_TRANSIT:

    case BookingTrackingStage
      .ARRIVED_AT_DESTINATION:

    case BookingTrackingStage
      .UNLOADING_STARTED:

    case BookingTrackingStage
      .UNLOADING_COMPLETED:
      return BookingStatus
        .IN_PROGRESS;

    case BookingTrackingStage
      .NOT_STARTED:

    case BookingTrackingStage
      .BOOKING_CONFIRMED:

    case BookingTrackingStage
      .VENDOR_ASSIGNED:

    case BookingTrackingStage
      .SURVEY_SCHEDULED:

    case BookingTrackingStage
      .SURVEY_COMPLETED:

    default:
      return BookingStatus
        .CONFIRMED;
  }
}

export interface BookingSelectedQuotationProvider {
  getSelectedQuotationVendor(
    bookingId: string,
    quotationId: string
  ): Promise<{
    quotationId: string;
    vendorId: string;
  } | null>;
}
export class BookingService {
 constructor(
  private readonly repository:
    BookingRepository,

  private readonly quotationSummaryProvider?:
    BookingQuotationSummaryProvider,

  private readonly selectedQuotationProvider?:
    BookingSelectedQuotationProvider
) {}

  /**
   * Returns booking by id or throws an Error.
   */
 private async getExistingBooking(
  bookingId: string
): Promise<BookingRequest> {
  const booking = await this.repository.findById(bookingId);

  if (!booking) {
    throw new Error("Booking not found.");
  }

  return booking;
}

/**
 * Creates and stores a new booking.
 */
async createBooking(
  input: CreateBookingInput
): Promise<BookingOperationResult> {
  const validation = validateCreateBookingInput(input);

  if (!validation.valid) {
    return {
      success: false,
      message: validation.errors
        .map(error => error.message)
        .join(", "),
      errorCode: validation.errors[0]?.code,
    };
  }

  const booking = buildNewBooking(input);

  const bookingCodeExists =
    await this.repository.existsByBookingCode(
      booking.bookingCode
    );

  if (bookingCodeExists) {
    return {
      success: false,
      message: "Generated booking code already exists.",
      errorCode: "BOOKING_CODE_EXISTS",
    };
  }

  const createdBooking =
    await this.repository.create(booking);

  return {
    success: true,
    booking: createdBooking,
    message: "Booking created successfully.",
  };
}

/**
 * Updates an existing booking.
 */
async updateBooking(
  bookingId: string,
  input: UpdateBookingInput,
  updatedBy: string
): Promise<BookingOperationResult> {
  const booking =
    await this.getExistingBooking(
      bookingId
    );

  /* ------------------------------------------------------------------------
   * Terminal Booking protection
   * ------------------------------------------------------------------------
   *
   * Completed and cancelled Bookings are historical terminal records.
   * Generic Booking details must not be modified after reaching a
   * terminal state.
   * ------------------------------------------------------------------------
   */

  if (
    booking.status ===
    BookingStatus.COMPLETED
  ) {
    return {
      success: false,

      message:
        "Completed Booking details cannot be modified.",

      errorCode:
        "BOOKING_COMPLETED",
    };
  }

  if (
    booking.status ===
    BookingStatus.CANCELLED
  ) {
    return {
      success: false,

      message:
        "Cancelled Booking details cannot be modified.",

      errorCode:
        "BOOKING_CANCELLED",
    };
  }

  const validation =
    validateUpdateBookingInput(
      input,
      booking
    );

  if (!validation.valid) {
    return {
      success: false,

      message:
        validation.errors
          .map(
            (error) =>
              error.message
          )
          .join(", "),

      errorCode:
        validation.errors[0]
          ?.code,
    };
  }

  const updatedBooking =
    applyBookingUpdate(
      booking,
      input,
      updatedBy
    );

  const savedBooking =
    await this.repository.update(
      updatedBooking
    );

  return {
    success: true,

    booking:
      savedBooking,

    message:
      "Booking updated successfully.",
  };
}
/**
 * Changes the status of an existing booking.
 */
/**
 * Changes the status of an existing booking.
 */
async changeBookingStatus(
  bookingId: string,
  input: UpdateBookingStatusInput
): Promise<BookingOperationResult> {
  const booking = await this.getExistingBooking(bookingId);

  const validation =
    validateUpdateBookingStatusInput(
      input,
      booking.status
    );

  if (!validation.valid) {
    return {
      success: false,
      message: validation.errors
        .map((error) => error.message)
        .join(", "),
      errorCode: validation.errors[0]?.code,
    };
  }

  const updatedBooking =
    applyBookingStatusUpdate(
      booking,
      input
    );

  const savedBooking =
    await this.repository.update(updatedBooking);

  return {
    success: true,
    booking: savedBooking,
    message: "Booking status updated successfully.",
  };
}

/**
 * Assigns a vendor to a booking.
 */
async assignVendor(
  bookingId: string,
  input: AssignVendorInput
): Promise<BookingOperationResult> {
  const booking =
    await this.getExistingBooking(
      bookingId
    );

  const validation =
    validateAssignVendorInput(
      input,
      booking
    );

  if (!validation.valid) {
    return {
      success: false,

      message:
        validation.errors
          .map(
            error =>
              error.message
          )
          .join(", "),

      errorCode:
        validation.errors[0]
          ?.code,
    };
  }

  const selectedQuotationId =
    booking.quotation
      ?.selectedQuotationId;

  if (!selectedQuotationId) {
    return {
      success: false,

      message:
        "A quotation must be selected before assigning a Vendor.",

      errorCode:
        "BUSINESS_RULE",
    };
  }

  if (
    !this.selectedQuotationProvider
  ) {
    return {
      success: false,

      message:
        "Selected quotation validation is unavailable for Vendor assignment.",

      errorCode:
        "BUSINESS_RULE",
    };
  }

  const selectedQuotation =
    await this
      .selectedQuotationProvider
      .getSelectedQuotationVendor(
        booking.bookingId,
        selectedQuotationId
      );

  if (!selectedQuotation) {
    return {
      success: false,

      message:
        "The selected quotation could not be resolved for Vendor assignment.",

      errorCode:
        "BUSINESS_RULE",
    };
  }

  if (
    selectedQuotation.vendorId !==
    input.vendorId
  ) {
    return {
      success: false,

      message:
        "Assigned Vendor must match the Vendor of the selected quotation.",

      errorCode:
        "BUSINESS_RULE",
    };
  }

  const updatedBooking =
    applyVendorAssignment(
      booking,
      input
    );

  const savedBooking =
    await this.repository.update(
      updatedBooking
    );

  return {
    success: true,

    booking:
      savedBooking,

    message:
      "Vendor assigned successfully.",
  };
}

/**
 * Removes the assigned vendor from a booking.
 */
async unassignVendor(
  bookingId: string,
  input: UnassignVendorInput
): Promise<BookingOperationResult> {
  const booking =
    await this.getExistingBooking(bookingId);

  const validation =
    validateUnassignVendorInput(
      input,
      booking
    );

  if (!validation.valid) {
    return {
      success: false,
      message: validation.errors
        .map((error) => error.message)
        .join(", "),
      errorCode: validation.errors[0]?.code,
    };
  }

  const updatedBooking =
    applyVendorUnassignment(
      booking,
      input
    );

  const savedBooking =
    await this.repository.update(updatedBooking);

  return {
    success: true,
    booking: savedBooking,
    message: "Vendor unassigned successfully.",
  };
}
/**
 * Cancels an existing booking.
 */
async cancelBooking(
  bookingId: string,
  input: CancelBookingInput
): Promise<BookingOperationResult> {
  const booking =
    await this.getExistingBooking(bookingId);

  const validation =
    validateCancelBookingInput(
      input,
      booking
    );

  if (!validation.valid) {
    return {
      success: false,
      message: validation.errors
        .map((error) => error.message)
        .join(", "),
      errorCode: validation.errors[0]?.code,
    };
  }

  const previousStage =
  booking.tracking
    ?.currentStage ??
  BookingTrackingStage
    .NOT_STARTED;

const cancelledBooking =
  applyBookingCancellation(
    booking,
    input
  );

const savedTransition =
  await this.repository
    .saveTrackingTransition({
      booking:
        cancelledBooking,

      previousStage,

      nextStage:
        BookingTrackingStage
          .CANCELLED,

      updatedBy:
        input.cancelledBy,

      remarks:
        input.cancellationReason,
    });

return {
  success:
    true,

  booking:
    savedTransition.booking,

  message:
    "Booking cancelled successfully.",
};
}
/**
 * Applies AI inventory analysis to an existing booking.
 */
async applyAIInventoryAnalysis(
  bookingId: string,
  analysis: AIInventoryAnalysis,
  updatedBy: string
): Promise<BookingOperationResult> {
  const booking =
    await this.getExistingBooking(bookingId);

  if (!updatedBy.trim()) {
    return {
      success: false,
      message: "The user applying the AI analysis is required.",
      errorCode: "UPDATED_BY_REQUIRED",
    };
  }

  const updatedBooking =
    applyAIAnalysis(
      booking,
      analysis,
      updatedBy
    );

  const savedBooking =
    await this.repository.update(updatedBooking);

  return {
    success: true,
    booking: savedBooking,
    message: "AI inventory analysis applied successfully.",
  };
}
/**
 * Updates the quotation summary for a booking.
 */
async updateQuotation(
  bookingId: string,
  quotation: BookingQuotationSummary,
  updatedBy: string
): Promise<BookingOperationResult> {
  const booking =
    await this.getExistingBooking(bookingId);

  if (!updatedBy.trim()) {
    return {
      success: false,
      message: "The user updating the quotation is required.",
      errorCode: "UPDATED_BY_REQUIRED",
    };
  }
const quotationValidation =
  validateBookingQuotationSummary(
    quotation
  );

if (
  !quotationValidation.valid
) {
  return {
    success:
      false,

    message:
      quotationValidation.errors
        .map(
          (error) =>
            error.message
        )
        .join(
          ", "
        ),

    errorCode:
      quotationValidation.errors[0]
        ?.code,
  };
}
  const updatedBooking =
    applyQuotationSummary(
      booking,
      quotation,
      updatedBy
    );

  const savedBooking =
    await this.repository.update(updatedBooking);

  return {
    success: true,
    booking: savedBooking,
    message: "Quotation updated successfully.",
  };
}
/**
 * Confirms a Booking from an accepted quotation.
 *
 * This operation:
 * - validates the confirmation command
 * - protects against conflicting quotation/vendor assignments
 * - supports idempotent replay
 * - applies the complete confirmed Booking aggregate
 * - persists the Booking in one repository update
 */
async confirmFromQuotation(
  bookingId:
    string,
  input:
    ConfirmBookingFromQuotationInput
): Promise<
  BookingOperationResult
> {
  const booking =
    await this.getExistingBooking(
      bookingId
    );

  const validation =
    validateConfirmBookingFromQuotationInput(
      input,
      booking
    );

  if (
    !validation.valid
  ) {
    return {
      success:
        false,

      message:
        validation.errors
          .map(
            (
              error
            ) =>
              error.message
          )
          .join(
            ", "
          ),

      errorCode:
        validation.errors[0]
          ?.code,
    };
  }

  /* ------------------------------------------------------------------------
   * Idempotency
   * ------------------------------------------------------------------------
   *
   * If the Booking is already confirmed with the same quotation,
   * same Vendor and same amount, return the existing Booking without
   * writing another timeline event.
   * ------------------------------------------------------------------------
   */

  const sameQuotation =
    booking.quotation
      ?.selectedQuotationId ===
    input.quotationId;

  const sameVendor =
    booking.vendor
      ?.vendorId ===
    input.vendorId;

  const sameAmount =
    booking.quotation
      ?.selectedQuoteAmount ===
    input.selectedQuoteAmount;

  const alreadyConfirmed =
    booking.status ===
      BookingStatus.CONFIRMED &&
    sameQuotation &&
    sameVendor &&
    sameAmount;

  if (
    alreadyConfirmed
  ) {
    return {
      success:
        true,

      booking,

      message:
        "Booking is already confirmed from this quotation.",
    };
  }

  const confirmedBooking =
    applyBookingConfirmationFromQuotation(
      booking,
      input
    );

  const savedBooking =
    await this.repository.update(
      confirmedBooking
    );

  return {
    success:
      true,

    booking:
      savedBooking,

    message:
      "Booking confirmed successfully from accepted quotation.",
  };
}
/**
 * Updates the payment summary for a booking.
 */
/**
 * Updates the payment summary for a booking.
 *
 * Financial semantics:
 *
 * - paidAmount is the gross amount successfully collected.
 * - Refunds do NOT reduce paidAmount.
 * - refundedAmount is the amount successfully returned.
 * - refundPendingAmount is the amount requested for refund but not yet
 *   completed.
 * - balanceAmount/paymentPending represent collection balance only and are
 *   derived from totalAmount - paidAmount.
 */
async updatePayment(
  bookingId: string,
  payment: BookingPaymentSummary,
  updatedBy: string
): Promise<BookingOperationResult> {
  const booking =
    await this.getExistingBooking(
      bookingId
    );

  /* ------------------------------------------------------------------------
   * Actor validation
   * ------------------------------------------------------------------------
   */

  const normalizedUpdatedBy =
    updatedBy.trim();

  if (!normalizedUpdatedBy) {
    return {
      success:
        false,

      message:
        "The user updating the payment is required.",

      errorCode:
        "UPDATED_BY_REQUIRED",
    };
  }

  /* ------------------------------------------------------------------------
   * Resolve authoritative Booking amount
   * ------------------------------------------------------------------------
   *
   * The selected quotation / existing Booking payment amount is the source
   * of truth.
   *
   * A caller must not be able to change the commercial value of the Booking
   * through the payment synchronization endpoint.
   * ------------------------------------------------------------------------
   */

  const authoritativeTotalAmount =
    booking.quotation
      ?.selectedQuoteAmount ??
    booking.payment
      ?.totalAmount ??
    payment.totalAmount;

  if (
    authoritativeTotalAmount ===
      undefined ||
    !Number.isFinite(
      authoritativeTotalAmount
    ) ||
    authoritativeTotalAmount < 0
  ) {
    return {
      success:
        false,

      message:
        "A valid Booking total amount is required before payment can be updated.",

      errorCode:
        "PAYMENT_TOTAL_AMOUNT_INVALID",
    };
  }

  /* ------------------------------------------------------------------------
   * Prevent total amount manipulation
   * ------------------------------------------------------------------------
   */

  if (
    payment.totalAmount !==
      undefined &&
    (
      !Number.isFinite(
        payment.totalAmount
      ) ||
      payment.totalAmount < 0
    )
  ) {
    return {
      success:
        false,

      message:
        "totalAmount must be a valid non-negative number.",

      errorCode:
        "PAYMENT_TOTAL_AMOUNT_INVALID",
    };
  }

  if (
    payment.totalAmount !==
      undefined &&
    payment.totalAmount !==
      authoritativeTotalAmount
  ) {
    return {
      success:
        false,

      message:
        "Payment totalAmount must match the Booking total amount.",

      errorCode:
        "PAYMENT_TOTAL_AMOUNT_MISMATCH",
    };
  }

  /* ------------------------------------------------------------------------
   * Resolve gross paid amount
   * ------------------------------------------------------------------------
   *
   * paidAmount represents successful collections before refunds.
   *
   * IMPORTANT:
   *
   * A refund must never reduce paidAmount.
   * ------------------------------------------------------------------------
   */

  const paidAmount =
    payment.paidAmount ??
    booking.payment
      ?.paidAmount ??
    0;

  if (
    !Number.isFinite(
      paidAmount
    ) ||
    paidAmount < 0
  ) {
    return {
      success:
        false,

      message:
        "paidAmount must be a valid non-negative number.",

      errorCode:
        "PAYMENT_PAID_AMOUNT_INVALID",
    };
  }

  if (
    paidAmount >
      authoritativeTotalAmount
  ) {
    return {
      success:
        false,

      message:
        "paidAmount cannot exceed the Booking total amount.",

      errorCode:
        "PAYMENT_OVERPAYMENT_NOT_ALLOWED",
    };
  }

  /* ------------------------------------------------------------------------
   * Resolve advance amount
   * ------------------------------------------------------------------------
   */

  const advanceAmount =
    payment.advanceAmount ??
    booking.payment
      ?.advanceAmount ??
    0;

  if (
    !Number.isFinite(
      advanceAmount
    ) ||
    advanceAmount < 0
  ) {
    return {
      success:
        false,

      message:
        "advanceAmount must be a valid non-negative number.",

      errorCode:
        "PAYMENT_ADVANCE_AMOUNT_INVALID",
    };
  }

  if (
    advanceAmount >
      paidAmount
  ) {
    return {
      success:
        false,

      message:
        "advanceAmount cannot exceed paidAmount.",

      errorCode:
        "PAYMENT_ADVANCE_EXCEEDS_PAID_AMOUNT",
    };
  }

  /* ------------------------------------------------------------------------
   * Resolve successfully refunded amount
   * ------------------------------------------------------------------------
   *
   * Backward compatibility:
   *
   * Existing Booking records may not yet contain refundedAmount.
   * Missing refund values therefore normalize to zero.
   * ------------------------------------------------------------------------
   */

  const refundedAmount =
    payment.refundedAmount ??
    booking.payment
      ?.refundedAmount ??
    0;

  if (
    !Number.isFinite(
      refundedAmount
    ) ||
    refundedAmount < 0
  ) {
    return {
      success:
        false,

      message:
        "refundedAmount must be a valid non-negative number.",

      errorCode:
        "PAYMENT_REFUNDED_AMOUNT_INVALID",
    };
  }

  if (
    refundedAmount >
      paidAmount
  ) {
    return {
      success:
        false,

      message:
        "refundedAmount cannot exceed paidAmount.",

      errorCode:
        "PAYMENT_REFUNDED_AMOUNT_EXCEEDS_PAID",
    };
  }

  /* ------------------------------------------------------------------------
   * Resolve pending refund amount
   * ------------------------------------------------------------------------
   */

  const refundPendingAmount =
    payment.refundPendingAmount ??
    booking.payment
      ?.refundPendingAmount ??
    0;

  if (
    !Number.isFinite(
      refundPendingAmount
    ) ||
    refundPendingAmount < 0
  ) {
    return {
      success:
        false,

      message:
        "refundPendingAmount must be a valid non-negative number.",

      errorCode:
        "PAYMENT_REFUND_PENDING_AMOUNT_INVALID",
    };
  }

  /* ------------------------------------------------------------------------
   * Refund exposure protection
   * ------------------------------------------------------------------------
   *
   * The amount already refunded plus the amount still pending refund must
   * never exceed gross successful collections.
   *
   * Example:
   *
   * paidAmount          = 23,364
   * refundedAmount      =  5,000
   * refundPendingAmount = 18,364
   *
   * is valid.
   *
   * Any larger refund exposure would exceed money actually collected.
   * ------------------------------------------------------------------------
   */

  if (
    refundedAmount +
      refundPendingAmount >
    paidAmount
  ) {
    return {
      success:
        false,

      message:
        "refundedAmount plus refundPendingAmount cannot exceed paidAmount.",

      errorCode:
        "PAYMENT_REFUND_EXCEEDS_PAID_AMOUNT",
    };
  }

  /* ------------------------------------------------------------------------
   * Derive collection financial values
   * ------------------------------------------------------------------------
   *
   * Do not trust balanceAmount or paymentPending supplied by the caller.
   *
   * Collection balance is independent from refund state:
   *
   * balanceAmount =
   *   totalAmount - gross paidAmount
   *
   * Example:
   *
   * totalAmount    = 23,364
   * paidAmount     = 23,364
   * refundedAmount =  5,000
   *
   * balanceAmount remains 0 because the full commercial amount was collected.
   *
   * Refund state is represented separately.
   * ------------------------------------------------------------------------
   */

  const balanceAmount =
    Math.max(
      0,
      authoritativeTotalAmount -
        paidAmount
    );

  /* ------------------------------------------------------------------------
   * Build normalized Booking payment projection
   * ------------------------------------------------------------------------
   */

  const normalizedPayment:
    BookingPaymentSummary = {
      totalAmount:
        authoritativeTotalAmount,

      advanceAmount,

      paidAmount,

      balanceAmount,

      paymentPending:
        balanceAmount,

      refundedAmount,

      refundPendingAmount,
    };

  /* ------------------------------------------------------------------------
   * Idempotency / no-op protection
   * ------------------------------------------------------------------------
   *
   * Do not persist another PAYMENT_UPDATED timeline event when every
   * normalized financial field is already identical.
   * ------------------------------------------------------------------------
   */

  const currentPayment =
    booking.payment;

  const currentRefundedAmount =
    currentPayment
      ?.refundedAmount ??
    0;

  const currentRefundPendingAmount =
    currentPayment
      ?.refundPendingAmount ??
    0;

  const paymentUnchanged =
    currentPayment?.totalAmount ===
      normalizedPayment.totalAmount &&
    (
      currentPayment
        ?.advanceAmount ??
      0
    ) ===
      (
        normalizedPayment
          .advanceAmount ??
        0
      ) &&
    (
      currentPayment
        ?.paidAmount ??
      0
    ) ===
      (
        normalizedPayment
          .paidAmount ??
        0
      ) &&
    (
      currentPayment
        ?.balanceAmount ??
      0
    ) ===
      (
        normalizedPayment
          .balanceAmount ??
        0
      ) &&
    (
      currentPayment
        ?.paymentPending ??
      0
    ) ===
      (
        normalizedPayment
          .paymentPending ??
        0
      ) &&
    currentRefundedAmount ===
      refundedAmount &&
    currentRefundPendingAmount ===
      refundPendingAmount;

  if (
    paymentUnchanged
  ) {
    return {
      success:
        true,

      booking,

      message:
        "Payment information is already up to date.",
    };
  }

  /* ------------------------------------------------------------------------
   * Persist
   * ------------------------------------------------------------------------
   */

  const updatedBooking =
    applyPaymentSummary(
      booking,
      normalizedPayment,
      normalizedUpdatedBy
    );

  const savedBooking =
    await this.repository.update(
      updatedBooking
    );

  return {
    success:
      true,

    booking:
      savedBooking,

    message:
      "Payment updated successfully.",
  };
}
/**
 * Updates the tracking summary for a booking.
 */
async updateTracking(
  bookingId: string,
  tracking:
  BookingTrackingUpdateRequest,
  updatedBy: string
): Promise<
  BookingOperationResult
> {
  const booking =
  await this.getExistingBooking(
    bookingId
  );

/* ------------------------------------------------------------------------
 * Terminal Booking protection
 * ------------------------------------------------------------------------
 *
 * A completed or cancelled Booking must not be reopened indirectly by
 * updating its tracking stage.
 *
 * Tracking-stage synchronization can otherwise map stages such as
 * VENDOR_ASSIGNED back to CONFIRMED.
 * ------------------------------------------------------------------------
 */

if (
  booking.status ===
    BookingStatus.COMPLETED
) {
  return {
    success:
      false,

    message:
      "Tracking cannot be updated for a completed booking.",

    errorCode:
      "BOOKING_COMPLETED",
  };
}

if (
  booking.status ===
    BookingStatus.CANCELLED
) {
  return {
    success:
      false,

    message:
      "Tracking cannot be updated for a cancelled booking.",

    errorCode:
      "BOOKING_CANCELLED",
  };
}

const normalizedUpdatedBy =
  updatedBy.trim();
  if (!normalizedUpdatedBy) {
    return {
      success:
        false,

      message:
        "The user updating the tracking is required.",

      errorCode:
        "UPDATED_BY_REQUIRED",
    };
  }
  const trackingValidation =
    validateBookingTrackingUpdateInput(
      tracking
    );

  if (
    !trackingValidation.valid
  ) {
    return {
      success: false,
      message:
        trackingValidation.errors
          .map(
            (error) =>
              error.message
          )
          .join(" "),
      errorCode:
        "TRACKING_VALIDATION_FAILED",
    };
  }
  const currentStage =
    booking.tracking
      ?.currentStage ??
    BookingTrackingStage
      .NOT_STARTED;

  const nextStage =
    tracking.currentStage;

  if (!nextStage) {
    return {
      success:
        false,

      message:
        "The next tracking stage is required.",

      errorCode:
        "TRACKING_STAGE_REQUIRED",
    };
  }

  const transitionValidation =
    validateTrackingTransition(
      currentStage,
      nextStage
    );

  if (
    !transitionValidation.valid
  ) {
    return {
      success:
        false,

      message:
        transitionValidation
          .errors[0]
          ?.message ??
        "The requested tracking transition is not allowed.",

      errorCode:
        "TRACKING_TRANSITION_INVALID",
    };
  }

  if (
    currentStage ===
    nextStage
  ) {
    return {
      success:
        true,

      booking,

      message:
        "Booking is already in the requested tracking stage.",
    };
  }

  const trackingUpdatedBooking =
  applyTrackingTransition(
    booking,
    nextStage,
    normalizedUpdatedBy,
    {
      expectedPickupTime:
        tracking
          .expectedPickupTime,

      expectedDeliveryTime:
        tracking
          .expectedDeliveryTime,

      liveTrackingEnabled:
        tracking
          .liveTrackingEnabled,
    }
  );

const synchronizedStatus =
  resolveBookingStatusFromTrackingStage(
    nextStage
  );

const updatedBooking = {
  ...trackingUpdatedBooking,

  status:
    synchronizedStatus,
};

const savedTransition =
  await this.repository
    .saveTrackingTransition({
      booking:
        updatedBooking,
      previousStage:
        currentStage,

      nextStage,

      updatedBy:
        normalizedUpdatedBy,

      updatedByRole:
        tracking.updatedByRole,

      remarks:
        tracking.remarks,

      location:
        tracking.location,

latitude:
  tracking.coordinates
    ?.latitude,

longitude:
  tracking.coordinates
    ?.longitude,

      estimatedArrival:
        tracking.estimatedArrival,

      actualArrival:
        tracking.actualArrival,

      photoUrl:
        tracking.photoUrl,

      signatureUrl:
        tracking.signatureUrl,
    });

return {
  success:
    true,

  booking:
    savedTransition.booking,

  message:
    "Tracking updated successfully.",
};
}
/**
 * Returns a booking by its internal ID.
 */
async getBooking(
  bookingId: string
): Promise<BookingRequest | null> {
  const booking =
    await this.repository
      .findById(
        bookingId
      );

  if (!booking) {
    return null;
  }

  if (
    !this.quotationSummaryProvider
  ) {
    return booking;
  }

  const quotationSummary =
    await this
      .quotationSummaryProvider
      .getBookingQuotationSummary(
        bookingId
      );

  return {
    ...booking,

    quotation: {
      ...booking.quotation,
      ...quotationSummary,
    },
  };
}
/**
 * Returns a booking by its public booking code.
 */
async getBookingByCode(
  bookingCode: string
): Promise<BookingRequest | null> {
  const booking =
    await this.repository
      .findByBookingCode(
        bookingCode
      );

  if (!booking) {
    return null;
  }

  if (
    !this.quotationSummaryProvider
  ) {
    return booking;
  }

  const quotationSummary =
    await this
      .quotationSummaryProvider
      .getBookingQuotationSummary(
        booking.bookingId
      );

  return {
    ...booking,

    quotation: {
      ...booking.quotation,
      ...quotationSummary,
    },
  };
}
/**
 * Searches bookings using the supplied criteria.
 */
async searchBookings(
  criteria: BookingSearchCriteria
): Promise<PaginatedBookingResult> {
  return this.repository.search(criteria);
}
/**
 * Returns a paginated list of recent bookings.
 */
async listBookings(
  page = 1,
  pageSize = 20
): Promise<BookingListItem[]> {
  const safePage =
    Number.isInteger(page) && page > 0
      ? page
      : 1;

  const safePageSize =
    Number.isInteger(pageSize) &&
    pageSize > 0 &&
    pageSize <= 100
      ? pageSize
      : 20;

  return this.repository.list(
    safePage,
    safePageSize
  );
}
/**
 * Returns the total number of bookings.
 */
async countBookings(): Promise<number> {
  return this.repository.count();
}

} // closes BookingService

