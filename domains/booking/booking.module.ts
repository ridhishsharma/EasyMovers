/**
 * ============================================================================
 * EasyMovers
 * Booking Module
 * ============================================================================
 *
 * File:
 * domains/booking/booking.module.ts
 *
 * Responsibilities:
 * - Compose Booking repository, service and controller
 * - Provide a single dependency graph for API routes
 * - Expose initialization and singleton helpers
 * - Support explicit dependency replacement in tests
 *
 * This file does not:
 * - Contain Booking business rules
 * - Access NextRequest or NextResponse
 * - Parse request payloads
 * - Implement Prisma queries
 * ============================================================================
 */

import type {
  BookingRepository,
} from "./repositories/booking.repository";

import {
  BookingPrismaRepository,
} from "./repositories/booking.prisma.repository";

import {
  BookingService,
} from "./services/booking.service";

import type {
  BookingControllerDependencies,
} from "./controllers/booking.controller";

import {
  BookingController,
  createBookingController,
} from "./controllers/booking.controller";

import type {
  BookingQuotationSummaryProvider,
} from "./models/booking.model";

import {
  QuotationBookingSummaryProvider,
} from "./providers/booking-quotation-summary.provider";
import {
  prisma,
} from "@/lib/prisma";

import {
  getOrCreateQuotationService,
} from "@/domains/quotation/quotation.module";

import type {
  BookingSelectedQuotationProvider,
} from "./services/booking.service";

/* ============================================================================
 * Module contracts
 * ============================================================================
 */

/**
 * Optional dependencies that may be supplied while composing the module.
 *
 * Production code normally uses BookingPrismaRepository.
 * Tests may provide a mock or in-memory BookingRepository.
 */
export interface BookingModuleDependencies {
  repository?:
    BookingRepository;

  quotationSummaryProvider?:
    BookingQuotationSummaryProvider;
}

/**
 * Booking module construction options.
 */
export interface BookingModuleOptions {
  dependencies?:
    BookingModuleDependencies;
}

/**
 * Complete Booking domain module.
 */
export interface BookingModule {
  repository:
    BookingRepository;

  service:
    BookingService;

  controller:
    BookingController;

  createdAt:
    Date;
}

/**
 * Safe module-construction result.
 */
export type CreateBookingModuleResult =
  | {
      success: true;

      module:
        BookingModule;
    }
  | {
      success: false;

      error: {
        code:
          "BOOKING_MODULE_CREATION_FAILED";

        message:
          string;
      };
    };

/* ============================================================================
 * Layer factories
 * ============================================================================
 */

/**
 * Creates the Booking repository.
 *
 * Uses an explicitly supplied repository when available.
 * Otherwise, it creates the Prisma repository.
 */
export function createBookingRepository(
  dependencies:
    BookingModuleDependencies = {}
): BookingRepository {
  return (
    dependencies.repository ??
    new BookingPrismaRepository()
  );
}

/**
 * Creates the Booking service.
 */
export function createBookingService(
  repository:
    BookingRepository,

  quotationSummaryProvider?:
    BookingQuotationSummaryProvider
): BookingService {
  const quotationService =
    getOrCreateQuotationService({
      prisma,
    });

  const selectedQuotationProvider:
    BookingSelectedQuotationProvider = {
    async getSelectedQuotationVendor(
      bookingId: string,
      quotationId: string
    ) {
      const result =
        await quotationService
          .getById(
            quotationId
          );

      if (!result.success) {
        return null;
      }

      const quotation =
        result.data;

      if (
        quotation.booking.bookingId !==
        bookingId
      ) {
        return null;
      }

      return {
        quotationId:
          quotation.quotationId,

        vendorId:
          quotation.vendor.vendorId,
      };
    },
  };

  return new BookingService(
    repository,
    quotationSummaryProvider,
    selectedQuotationProvider
  );
}

/**
 * Creates controller dependencies from the Booking service.
 */
export function createBookingControllerDependencies(
  service:
    BookingService
): BookingControllerDependencies {
  return {
    service,
  };
}

/**
 * Creates the Booking controller.
 */
export function createBookingModuleController(
  service:
    BookingService
): BookingController {
  return createBookingController(
    createBookingControllerDependencies(
      service
    )
  );
}

/* ============================================================================
 * Module composition
 * ============================================================================
 */

/**
 * Creates the complete Booking module.
 */
export function createBookingModule(
  options:
    BookingModuleOptions = {}
): BookingModule {
  const repository =
    createBookingRepository(
      options.dependencies
    );

  const quotationSummaryProvider =
    options.dependencies
      ?.quotationSummaryProvider ??
    new QuotationBookingSummaryProvider({
      prisma,
    });

  const service =
    createBookingService(
      repository,
      quotationSummaryProvider
    );

  const controller =
    createBookingModuleController(
      service
    );

  return {
    repository,
    service,
    controller,

    createdAt:
      new Date(),
  };
}
/**
 * Creates the Booking module without throwing.
 */
export function tryCreateBookingModule(
  options:
    BookingModuleOptions = {}
): CreateBookingModuleResult {
  try {
    return {
      success: true,

      module:
        createBookingModule(
          options
        ),
    };
  } catch (error) {
    return {
      success: false,

      error: {
        code:
          "BOOKING_MODULE_CREATION_FAILED",

        message:
          error instanceof Error
            ? error.message
            : "An unknown Booking module creation error occurred.",
      },
    };
  }
}

/* ============================================================================
 * Module singleton
 * ============================================================================
 */

/**
 * Shared Booking module instance.
 *
 * This prevents repository, service and controller objects from being
 * recreated separately by every route module.
 */
let bookingModuleSingleton:
  BookingModule |
  undefined;

/**
 * Returns the existing Booking module or creates it.
 */
export function getBookingModule(
  options:
    BookingModuleOptions = {}
): BookingModule {
  if (
    !bookingModuleSingleton
  ) {
    bookingModuleSingleton =
      createBookingModule(
        options
      );
  }

  return bookingModuleSingleton;
}

/**
 * Determines whether the Booking module has already been initialized.
 */
export function isBookingModuleInitialized():
  boolean {
  return (
    bookingModuleSingleton !==
    undefined
  );
}

/**
 * Returns the initialized module without creating it.
 */
export function peekBookingModule():
  BookingModule |
  undefined {
  return bookingModuleSingleton;
}

/**
 * Resets the shared Booking module.
 *
 * Intended primarily for automated tests and development dependency
 * replacement.
 */
export function resetBookingModule():
  void {
  bookingModuleSingleton =
    undefined;
}

/**
 * Explicit Booking module initialization options.
 */
export interface InitializeBookingModuleOptions
  extends BookingModuleOptions {
  forceReinitialize?:
    boolean;
}

/**
 * Explicitly initializes the Booking module.
 */
export function initializeBookingModule(
  options:
    InitializeBookingModuleOptions = {}
): BookingModule {
  if (
    options.forceReinitialize ===
    true
  ) {
    resetBookingModule();
  }

  return getBookingModule(
    options
  );
}

/* ============================================================================
 * Convenience accessors
 * ============================================================================
 */

/**
 * Returns the shared Booking repository.
 */
export function getBookingRepository():
  BookingRepository {
  return getBookingModule()
    .repository;
}

/**
 * Returns the shared Booking service.
 */
export function getBookingService():
  BookingService {
  return getBookingModule()
    .service;
}

/**
 * Returns the shared Booking controller.
 */
export function getBookingController():
  BookingController {
  return getBookingModule()
    .controller;
}
