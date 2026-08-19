import type {
  BookingQuotationSummary,
  BookingQuotationSummaryProvider,
} from "../models/booking.model";

import type {
  QuotationModuleDependencies,
} from "../../quotation/quotation.module";

import {
  getOrCreateQuotationModule,
  getQuotationModuleService,
} from "../../quotation/quotation.module";

export class QuotationBookingSummaryProvider
  implements BookingQuotationSummaryProvider
{
  constructor(
    private readonly dependencies:
      QuotationModuleDependencies
  ) {}

  async getBookingQuotationSummary(
    bookingId: string
  ): Promise<BookingQuotationSummary> {
    const quotationModule =
      getOrCreateQuotationModule(
        this.dependencies
      );

    const quotationService =
      getQuotationModuleService(
        quotationModule
      );

    const result =
      await quotationService
        .getBookingSummary({
          bookingId,
        });

    if (
      !result.success
    ) {
      throw new Error(
        result.error?.message ??
          "Unable to load booking quotation summary."
      );
    }

    const summary =
      result.data;

    return {
      totalQuotations:
        summary.totalQuotations,

      ...(summary.lowestAmount !==
      undefined
        ? {
            lowestQuote:
              summary.lowestAmount,
          }
        : {}),

      ...(summary.highestAmount !==
      undefined
        ? {
            highestQuote:
              summary.highestAmount,
          }
        : {}),

      ...(summary.selectedQuotationId
        ? {
            selectedQuotationId:
              summary.selectedQuotationId,
          }
        : {}),

      ...(summary.selectedAmount !==
      undefined
        ? {
            selectedQuoteAmount:
              summary.selectedAmount,
          }
        : {}),
    };
  }
}