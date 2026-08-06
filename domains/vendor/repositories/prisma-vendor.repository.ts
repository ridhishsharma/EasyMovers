/**
 * ============================================================
 * EasyMovers
 * Prisma Vendor Repository
 * ============================================================
 *
 * File
 * ----
 * domains/vendor/repositories/prisma-vendor.repository.ts
 *
 * Fresh Rebuild — Part A
 * ----------------------
 * - One consolidated import section for the complete file
 * - Prisma repository dependency types
 * - Capability and configuration contracts
 * - Shared normalization utilities
 * - Shared identifier/date helpers
 * - Shared unsupported-capability helper
 * - Shared Prisma error normalization
 *
 * IMPORTANT FOR PARTS B–E
 * -----------------------
 * Do not add any more import declarations in later parts.
 * Append later parts below this file and use the namespaces and
 * runtime imports declared here.
 * ============================================================
 */

/* ============================================================
 * Prisma runtime values
 * ============================================================
 */

import {
  BankAccountType as PrismaBankAccountType,
  Prisma,
  VehicleStatus as PrismaVehicleStatus,
  VehicleType as PrismaVehicleType,
  VendorDocumentType as PrismaVendorDocumentType,
  VerificationStatus as PrismaVerificationStatus,
} from "@prisma/client";

/* ============================================================
 * Prisma types
 * ============================================================
 */

import type {
  PrismaClient,
  Vendor as PrismaVendor,
  VendorBankAccount as PrismaVendorBankAccount,
  VendorDocument as PrismaVendorDocument,
  VendorVehicle as PrismaVendorVehicle,
} from "@prisma/client";

/* ============================================================
 * Vendor-domain runtime values
 * ============================================================
 */

import {
  VendorBankAccountType,
  VendorCategory,
  VendorDocumentStatus,
  VendorDocumentType,
  VendorPricingType,
  VendorServiceScope,
  VendorServiceType,
  VendorVehicleStatus,
  VendorVehicleType,
} from "../models/vendor.model";

/* ============================================================
 * Vendor-domain types
 *
 * A namespace import prevents repeated named type imports and
 * avoids collisions with Prisma model names.
 * ============================================================
 */

import type * as VendorDomain from "../models/vendor.model";

/* ============================================================
 * Vendor mapper runtime values
 * ============================================================
 */

import {
  mapVendorAggregate,
  mapVendorAggregateSummary,
} from "../mappers/vendor.mapper";

/* ============================================================
 * Vendor mapper types
 * ============================================================
 */

import type * as VendorMapperTypes from "../mappers/vendor.mapper";

/* ============================================================
 * Repository-contract runtime values
 * ============================================================
 */

import {
  DEFAULT_VENDOR_REPOSITORY_PAGE,
  DEFAULT_VENDOR_REPOSITORY_PAGE_SIZE,
  DEFAULT_VENDOR_REPOSITORY_SORT,
  VendorRepositoryError,
  calculateVendorRepositoryOffset,
  createEmptyDocumentReplacementResult,
  createEmptyPricingReplacementResult,
  createEmptyServiceAreaReplacementResult,
  createEmptyServiceReplacementResult,
  createEmptyVendorBulkDeleteResult,
  createEmptyVendorBulkLookupResult,
  createEmptyVendorStatusUpdateResult,
  createEmptyVehicleReplacementResult,
  createHealthyVendorRepositoryResult,
  createUnhealthyVendorRepositoryResult,
  createVendorPaginationMetadata,
  normalizeVendorRepositoryIds,
  normalizeVendorRepositoryPageSize,
} from "./vendor.repository";

/* ============================================================
 * Repository-contract types
 *
 * All contract types are accessed through this namespace.
 * Later parts must use forms such as:
 *
 * VendorRepositoryContracts.CreateVendorRepositoryInput
 * VendorRepositoryContracts.VendorRepositoryPort
 * ============================================================
 */

import type * as VendorRepositoryContracts from "./vendor.repository";

/**
 * Prisma client accepted by repository helper functions.
 *
 * Prisma.TransactionClient supports the delegates required by
 * repository operations while excluding connection methods.
 */
export type PrismaVendorRepositoryClient =
  | PrismaClient
  | Prisma.TransactionClient;

/**
 * Dependencies accepted by repository factories.
 */
export interface PrismaVendorRepositoryDependencies {
  prisma?: PrismaClient;
}

/**
 * Supported repository capability names.
 */
export type PrismaVendorRepositoryCapabilityName =
  | "CORE_VENDOR_READ"
  | "CORE_VENDOR_WRITE"
  | "VENDOR_LISTING"
  | "VENDOR_UNIQUENESS"
  | "VENDOR_STATISTICS"
  | "SERVICE_AREA_PERSISTENCE"
  | "SERVICE_PERSISTENCE"
  | "PRICING_PERSISTENCE"
  | "VEHICLE_PERSISTENCE"
  | "DOCUMENT_PERSISTENCE"
  | "BANK_DETAILS_PERSISTENCE"
  | "SOFT_DELETE"
  | "TRANSACTIONS"
  | "BULK_OPERATIONS";

/**
 * Describes one repository capability.
 */
export interface PrismaVendorRepositoryCapability {
  capability: PrismaVendorRepositoryCapabilityName;

  supported: boolean;

  message?: string;
}

/**
 * Complete repository capability report.
 */
export interface PrismaVendorRepositoryCapabilityReport {
  fullyOperational: boolean;

  capabilities:
    PrismaVendorRepositoryCapability[];
}

/**
 * Repository configuration-validation result.
 */
export interface PrismaVendorRepositoryConfigurationValidation {
  valid: boolean;

  errors: string[];

  warnings: string[];
}

/**
 * Current repository capability report.
 *
 * The current Prisma schema stores:
 *
 * - Core Vendor fields in a flat Vendor table
 * - Vehicles in VendorVehicle
 * - Documents in VendorDocument
 * - Bank details in VendorBankAccount
 *
 * It does not currently contain normalized tables for service
 * areas, service offerings, pricing or soft deletion.
 */
export const PRISMA_VENDOR_REPOSITORY_CAPABILITIES:
  PrismaVendorRepositoryCapabilityReport = {
  fullyOperational: false,

  capabilities: [
    {
      capability: "CORE_VENDOR_READ",
      supported: true,
    },
    {
      capability: "CORE_VENDOR_WRITE",
      supported: true,
    },
    {
      capability: "VENDOR_LISTING",
      supported: true,
    },
    {
      capability: "VENDOR_UNIQUENESS",
      supported: true,
    },
    {
      capability: "VENDOR_STATISTICS",
      supported: true,
    },
    {
      capability: "SERVICE_AREA_PERSISTENCE",
      supported: false,
      message:
        "Service areas are represented through the legacy Vendor.serviceCities field.",
    },
    {
      capability: "SERVICE_PERSISTENCE",
      supported: false,
      message:
        "Service offerings are represented through legacy Vendor boolean fields.",
    },
    {
      capability: "PRICING_PERSISTENCE",
      supported: false,
      message:
        "The current Prisma schema has no normalized VendorPricing model.",
    },
    {
      capability: "VEHICLE_PERSISTENCE",
      supported: true,
    },
    {
      capability: "DOCUMENT_PERSISTENCE",
      supported: true,
    },
    {
      capability: "BANK_DETAILS_PERSISTENCE",
      supported: true,
    },
    {
      capability: "SOFT_DELETE",
      supported: false,
      message:
        "The current Vendor model has no deletedAt field.",
    },
    {
      capability: "TRANSACTIONS",
      supported: true,
    },
    {
      capability: "BULK_OPERATIONS",
      supported: true,
    },
  ],
};

/**
 * Returns a defensive repository capability report.
 */
export function getPrismaVendorRepositoryCapabilityReport():
  PrismaVendorRepositoryCapabilityReport {
  return {
    fullyOperational:
      PRISMA_VENDOR_REPOSITORY_CAPABILITIES
        .fullyOperational,

    capabilities:
      PRISMA_VENDOR_REPOSITORY_CAPABILITIES
        .capabilities
        .map(
          (capability) => ({
            ...capability,
          })
        ),
  };
}

/**
 * Validates the known repository configuration.
 */
export function validatePrismaVendorRepositoryConfiguration():
  PrismaVendorRepositoryConfigurationValidation {
  const warnings =
    PRISMA_VENDOR_REPOSITORY_CAPABILITIES
      .capabilities
      .filter(
        (capability) =>
          !capability.supported
      )
      .map(
        (capability) =>
          capability.message ??
          `${capability.capability} is not supported.`
      );

  return {
    valid: true,
    errors: [],
    warnings,
  };
}

/**
 * Normalizes a required string.
 */
export function normalizePrismaVendorString(
  value: unknown
): string {
  if (
    typeof value === "string"
  ) {
    return value.trim();
  }

  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return String(value);
  }

  return "";
}

/**
 * Normalizes an optional string.
 */
export function normalizeOptionalPrismaVendorString(
  value: unknown
): string | undefined {
  const normalized =
    normalizePrismaVendorString(
      value
    );

  return normalized ||
    undefined;
}

/**
 * Normalizes an optional nullable string.
 */
export function normalizeNullablePrismaVendorString(
  value: unknown
): string | null {
  return (
    normalizeOptionalPrismaVendorString(
      value
    ) ??
    null
  );
}

/**
 * Normalizes a vendor code.
 */
export function normalizePrismaVendorCode(
  value: unknown
): string | undefined {
  return normalizeOptionalPrismaVendorString(
    value
  )?.toUpperCase();
}

/**
 * Generates a public vendor code.
 */
export function generatePrismaVendorCode():
  string {
  return [
    "EMV",
    Date.now()
      .toString(36)
      .toUpperCase(),
    Math.random()
      .toString(36)
      .slice(2, 7)
      .toUpperCase(),
  ].join("-");
}

/**
 * Normalizes an Indian phone number.
 */
export function normalizePrismaVendorPhone(
  value: unknown
): string {
  const original =
    normalizePrismaVendorString(
      value
    );

  if (!original) {
    return "";
  }

  const digits =
    original.replace(
      /\D/g,
      ""
    );

  if (
    digits.length === 10
  ) {
    return `+91${digits}`;
  }

  if (
    digits.length === 12 &&
    digits.startsWith("91")
  ) {
    return `+${digits}`;
  }

  return original;
}

/**
 * Normalizes an optional email.
 */
export function normalizePrismaVendorEmail(
  value: unknown
): string | undefined {
  return normalizeOptionalPrismaVendorString(
    value
  )?.toLowerCase();
}

/**
 * Normalizes a non-negative integer.
 */
export function normalizePrismaVendorInteger(
  value: unknown,
  fallback = 0
): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" &&
          value.trim()
        ? Number(value)
        : Number.NaN;

  if (
    !Number.isFinite(parsed)
  ) {
    return fallback;
  }

  return Math.max(
    Math.trunc(parsed),
    0
  );
}

/**
 * Returns a defensive valid Date.
 */
export function normalizePrismaVendorDate(
  value: unknown
): Date | undefined {
  if (
    value instanceof Date &&
    !Number.isNaN(
      value.getTime()
    )
  ) {
    return new Date(
      value.getTime()
    );
  }

  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return undefined;
  }

  const parsed =
    new Date(value);

  return Number.isNaN(
    parsed.getTime()
  )
    ? undefined
    : parsed;
}

/**
 * Requires a usable repository identifier.
 */
export function requirePrismaVendorIdentifier(
  value: string,
  field: string
): string {
  const normalized =
    normalizePrismaVendorString(
      value
    );

  if (!normalized) {
    throw new VendorRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      `${field} is required.`,
      {
        field,
        value,
      }
    );
  }

  return normalized;
}

/**
 * Splits the flat Vendor.serviceCities value.
 */
export function parsePrismaVendorServiceCities(
  value: unknown
): string[] {
  const rawValues =
    Array.isArray(value)
      ? value
      : typeof value === "string"
        ? value.split(
            /[,;\n]+/
          )
        : [];

  return [
    ...new Set(
      rawValues
        .map(
          (city) =>
            normalizePrismaVendorString(
              city
            )
        )
        .filter(Boolean)
    ),
  ];
}

/**
 * Serializes service cities for the flat Prisma Vendor model.
 */
export function serializePrismaVendorServiceCities(
  cities:
    readonly string[]
): string {
  return [
    ...new Set(
      cities
        .map(
          (city) =>
            normalizePrismaVendorString(
              city
            )
        )
        .filter(Boolean)
    ),
  ].join(",");
}

/**
 * Converts a flat Prisma status into an active flag.
 */
export function mapPrismaVendorStatusToActive(
  status: unknown
): boolean {
  return (
    normalizePrismaVendorString(
      status
    ).toUpperCase() ===
    "ACTIVE"
  );
}

/**
 * Converts an active flag into the current flat status.
 */
export function mapVendorActiveToPrismaStatus(
  active: boolean | undefined
): string {
  return active === false
    ? "INACTIVE"
    : "ACTIVE";
}

/**
 * Converts established year into legacy experience years.
 */
export function mapEstablishedYearToExperienceYears(
  establishedYear:
    number | undefined
): number | undefined {
  if (
    establishedYear ===
      undefined ||
    !Number.isInteger(
      establishedYear
    )
  ) {
    return undefined;
  }

  return Math.max(
    new Date()
      .getFullYear() -
      establishedYear,
    0
  );
}

/**
 * Converts legacy experience years into established year.
 */
export function mapExperienceYearsToEstablishedYear(
  experienceYears:
    number | null
): number | undefined {
  if (
    experienceYears === null ||
    !Number.isInteger(
      experienceYears
    ) ||
    experienceYears < 0
  ) {
    return undefined;
  }

  return (
    new Date()
      .getFullYear() -
    experienceYears
  );
}

/**
 * Normalizes a vehicle registration number.
 */
export function normalizePrismaVehicleRegistrationNumber(
  value: unknown
): string {
  return normalizePrismaVendorString(
    value
  )
    .replace(
      /[\s-]/g,
      ""
    )
    .toUpperCase();
}

/**
 * Normalizes a bank account number.
 */
export function normalizePrismaVendorBankAccountNumber(
  value: unknown
): string {
  return normalizePrismaVendorString(
    value
  ).replace(
    /[\s-]/g,
    ""
  );
}

/**
 * Creates an explicit unsupported-capability error.
 */
export function createUnsupportedPrismaVendorCapabilityError(
  capability: string
): VendorRepositoryError {
  return new VendorRepositoryError(
    "INVALID_REPOSITORY_INPUT",
    `${capability} is not supported by the current Prisma schema.`,
    {
      field:
        capability,
    }
  );
}

/**
 * Returns the unique target fields from a Prisma P2002 error.
 */
export function getPrismaVendorUniqueTarget(
  error:
    Prisma.PrismaClientKnownRequestError
): string[] {
  const target =
    error.meta?.target;

  if (
    Array.isArray(target)
  ) {
    return target.map(
      (field) =>
        String(field)
    );
  }

  if (
    typeof target === "string"
  ) {
    return [
      target,
    ];
  }

  return [];
}

/**
 * Converts Prisma and unknown errors into repository errors.
 */
export function normalizePrismaVendorRepositoryError(
  error: unknown
): VendorRepositoryError {
  if (
    error instanceof
    VendorRepositoryError
  ) {
    return error;
  }

  if (
    error instanceof
    Prisma.PrismaClientKnownRequestError
  ) {
    if (
      error.code === "P2002"
    ) {
      const target =
        getPrismaVendorUniqueTarget(
          error
        );

      if (
        target.includes(
          "ownerMobile"
        )
      ) {
        return new VendorRepositoryError(
          "DUPLICATE_PHONE",
          "A vendor with this phone number already exists.",
          {
            field:
              "ownerMobile",
            cause:
              error,
          }
        );
      }

      if (
        target.includes(
          "vendorCode"
        )
      ) {
        return new VendorRepositoryError(
          "DUPLICATE_VENDOR",
          "A vendor with this vendor code already exists.",
          {
            field:
              "vendorCode",
            cause:
              error,
          }
        );
      }

      if (
        target.includes(
          "registrationNumber"
        )
      ) {
        return new VendorRepositoryError(
          "DUPLICATE_REGISTRATION_NUMBER",
          "This vehicle registration number already exists.",
          {
            field:
              "registrationNumber",
            cause:
              error,
          }
        );
      }

      return new VendorRepositoryError(
        "DUPLICATE_VENDOR",
        "A vendor unique constraint was violated.",
        {
          value:
            target,
          cause:
            error,
        }
      );
    }

    if (
      error.code === "P2025"
    ) {
      return new VendorRepositoryError(
        "VENDOR_NOT_FOUND",
        "Vendor was not found.",
        {
          cause:
            error,
        }
      );
    }

    return new VendorRepositoryError(
      "DATABASE_ERROR",
      error.message,
      {
        cause:
          error,
      }
    );
  }

  if (
    error instanceof Error
  ) {
    return new VendorRepositoryError(
      "UNKNOWN_REPOSITORY_ERROR",
      error.message,
      {
        cause:
          error,
      }
    );
  }

  return new VendorRepositoryError(
    "UNKNOWN_REPOSITORY_ERROR",
    "An unknown Prisma Vendor repository error occurred.",
    {
      cause:
        error,
    }
  );
}

/**
 * ============================================================
 * End of Fresh Prisma Vendor Repository Part A
 * ============================================================
 */
/**
 * ============================================================
 * Fresh Prisma Vendor Repository
 * Part B
 * ============================================================
 *
 * Mapping and query-construction layer:
 *
 * - Legacy service-area reconstruction
 * - Legacy service reconstruction
 * - Prisma Vendor -> VendorAggregate
 * - Prisma Vendor -> VendorAggregateSummary
 * - Aggregate create-data mapping
 * - Aggregate update-data mapping
 * - Vendor filter builder
 * - Vendor order-by builder
 * - Vendor list-query normalization
 *
 * IMPORTANT
 * ---------
 * This part contains no import declarations.
 * Append it directly after Fresh Part A.
 * ============================================================
 */

/**
 * Flattens a structured domain address into the legacy
 * Vendor.address column.
 */
export function serializePrismaVendorAddress(
  address:
    VendorRepositoryContracts
      .CreateVendorRepositoryInput[
        "registeredAddress"
      ]
): string | undefined {
  const flattenedAddress = [
    address.addressLine1,
    address.addressLine2,
    address.landmark,
    address.district,
  ]
    .map(
      (part) =>
        normalizePrismaVendorString(
          part
        )
    )
    .filter(Boolean)
    .join(", ");

  return (
    flattenedAddress ||
    undefined
  );
}

/**
 * Reconstructs service areas from the legacy serviceCities
 * field.
 */
export function mapPrismaVendorServiceAreas(
  vendor:
    PrismaVendor
): VendorDomain.VendorServiceArea[] {
  const serviceCities =
    parsePrismaVendorServiceCities(
      vendor.serviceCities
    );

  const registeredCity =
    normalizeOptionalPrismaVendorString(
      vendor.city
    );

  const registeredState =
    normalizeOptionalPrismaVendorString(
      vendor.state
    );

  const effectiveCities =
    serviceCities.length > 0
      ? serviceCities
      : registeredCity
        ? [registeredCity]
        : [];

  if (
    effectiveCities.length === 0
  ) {
    return [];
  }

  const withinState =
    effectiveCities.length > 1;

  return effectiveCities.map(
    (
      city,
      index
    ): VendorDomain.VendorServiceArea => ({
      id:
        `${vendor.id}-service-area-${index + 1}`,

      scope:
        withinState
          ? VendorServiceScope
              .WITHIN_STATE
          : VendorServiceScope
              .WITHIN_CITY,

      originCity:
        withinState
          ? registeredCity
          : city,

      originState:
        registeredState,

      destinationCity:
        city,

      destinationState:
        withinState
          ? registeredState
          : undefined,

      active:
        mapPrismaVendorStatusToActive(
          vendor.status
        ),

      createdAt:
        new Date(
          vendor.createdAt
        ),

      updatedAt:
        new Date(
          vendor.updatedAt
        ),
    })
  );
}

/**
 * Reconstructs normalized services from legacy Vendor boolean
 * service flags.
 */
export function mapPrismaVendorServices(
  vendor:
    PrismaVendor
): VendorDomain.VendorService[] {
  const candidates:
    Array<{
      enabled: boolean;

      serviceType:
        VendorServiceType;

      title: string;
    }> = [
      {
        enabled:
          vendor.householdService,

        serviceType:
          VendorServiceType
            .HOUSEHOLD_RELOCATION,

        title:
          "Household Relocation",
      },
      {
        enabled:
          vendor.officeService,

        serviceType:
          VendorServiceType
            .OFFICE_RELOCATION,

        title:
          "Office Relocation",
      },
      {
        enabled:
          vendor.vehicleService,

        serviceType:
          VendorServiceType
            .VEHICLE_TRANSPORT,

        title:
          "Vehicle Transportation",
      },
    ];

  return candidates
    .filter(
      (candidate) =>
        candidate.enabled
    )
    .map(
      (
        candidate,
        index
      ): VendorDomain.VendorService => ({
        id:
          `${vendor.id}-service-${index + 1}`,

        serviceType:
          candidate.serviceType,

        title:
          candidate.title,

        active:
          mapPrismaVendorStatusToActive(
            vendor.status
          ),

        createdAt:
          new Date(
            vendor.createdAt
          ),

        updatedAt:
          new Date(
            vendor.updatedAt
          ),
      })
    );
}

/**
 * Resolves the current domain category from the flat Vendor
 * record.
 */
export function resolvePrismaVendorCategory(
  vendor:
    PrismaVendor
): VendorCategory {
  const serviceCities =
    parsePrismaVendorServiceCities(
      vendor.serviceCities
    );

  return serviceCities.length > 1
    ? VendorCategory.REGIONAL
    : VendorCategory.LOCAL;
}

/**
 * Maps one flat Prisma Vendor record into the current
 * VendorAggregate contract.
 *
 * Dedicated vehicle, document and bank records are hydrated in
 * a later part.
 */
export function mapPrismaVendorToAggregate(
  vendor:
    PrismaVendor
): VendorMapperTypes.VendorAggregate {
  const ownerEmail =
    normalizePrismaVendorEmail(
      vendor.ownerEmail
    );

  const contactEmail =
    normalizePrismaVendorEmail(
      vendor
        .quotationContactEmail
    ) ??
    ownerEmail ??
    "";

  const ownerPhone =
    normalizePrismaVendorPhone(
      vendor.ownerMobile
    );

  const primaryPhone =
    normalizePrismaVendorPhone(
      vendor
        .quotationContactMobile
    ) ||
    ownerPhone;

  return mapVendorAggregate({
    id:
      vendor.id,

    vendorCode:
      vendor.vendorCode,

    businessDetails: {
      companyName:
        vendor.companyName,

      gstNumber:
        vendor.gstNumber ??
        undefined,

      panNumber:
        vendor.panNumber ??
        undefined,

      establishedYear:
        mapExperienceYearsToEstablishedYear(
          vendor.experienceYears
        ),

      category:
        resolvePrismaVendorCategory(
          vendor
        ),
    },

    ownerDetails: {
      fullName:
        vendor.ownerName,

      panNumber:
        vendor.panNumber ??
        undefined,

      phone:
        ownerPhone,

      email:
        ownerEmail,
    },

    contact: {
      primaryPhone,

      alternatePhone:
        normalizeOptionalPrismaVendorString(
          vendor.coordinatorMobile
        ),

      email:
        contactEmail,

      website:
        vendor.website ??
        undefined,

      whatsappNumber:
        primaryPhone ||
        undefined,
    },

    registeredAddress: {
      addressLine1:
        normalizePrismaVendorString(
          vendor.address
        ),

      city:
        normalizePrismaVendorString(
          vendor.city
        ),

      state:
        normalizePrismaVendorString(
          vendor.state
        ),

      postalCode:
        normalizePrismaVendorString(
          vendor.pincode
        ),

      country:
        "India",
    },

    serviceAreas:
      mapPrismaVendorServiceAreas(
        vendor
      ),

    services:
      mapPrismaVendorServices(
        vendor
      ),

    pricing:
      [],

    vehicles:
      [],

    documents:
      [],

    bankDetails:
      undefined,

    active:
      mapPrismaVendorStatusToActive(
        vendor.status
      ),

    createdAt:
      new Date(
        vendor.createdAt
      ),

    updatedAt:
      new Date(
        vendor.updatedAt
      ),
  });
}

/**
 * Maps one flat Prisma Vendor record into the lightweight
 * aggregate summary.
 */
export function mapPrismaVendorToSummary(
  vendor:
    PrismaVendor
): VendorMapperTypes.VendorAggregateSummary {
  return mapVendorAggregateSummary(
    mapPrismaVendorToAggregate(
      vendor
    )
  );
}

/**
 * Resolves flat service-city values from aggregate service
 * areas.
 */
export function resolvePrismaVendorServiceCities(
  input:
    VendorRepositoryContracts
      .CreateVendorRepositoryInput
): string[] {
  const mappedCities =
    input.serviceAreas
      .map(
        (serviceArea) =>
          serviceArea
            .destinationCity ??
          serviceArea.originCity
      )
      .map(
        (city) =>
          normalizePrismaVendorString(
            city
          )
      )
      .filter(Boolean);

  if (
    mappedCities.length > 0
  ) {
    return [
      ...new Set(
        mappedCities
      ),
    ];
  }

  const registeredCity =
    normalizePrismaVendorString(
      input.registeredAddress
        .city
    );

  return registeredCity
    ? [registeredCity]
    : [];
}

/**
 * Determines whether a service list contains one active
 * service type.
 */
export function hasPrismaVendorServiceType(
  services:
    readonly VendorDomain.VendorService[],
  serviceType:
    VendorServiceType
): boolean {
  return services.some(
    (service) =>
      service.active &&
      service.serviceType ===
        serviceType
  );
}

/**
 * Maps aggregate create input into the flat Prisma Vendor
 * create shape.
 */
export function mapVendorAggregateToPrismaCreateData(
  input:
    VendorRepositoryContracts
      .CreateVendorRepositoryInput
): Prisma.VendorUncheckedCreateInput {
  const companyName =
    normalizePrismaVendorString(
      input.businessDetails
        .companyName
    );

  const ownerName =
    normalizePrismaVendorString(
      input.ownerDetails
        .fullName
    );

  const ownerMobile =
    normalizePrismaVendorPhone(
      input.ownerDetails
        .phone
    );

  const primaryPhone =
    normalizePrismaVendorPhone(
      input.contact
        .primaryPhone
    ) ||
    ownerMobile;

  const ownerEmail =
    normalizePrismaVendorEmail(
      input.ownerDetails
        .email
    );

  const contactEmail =
    normalizePrismaVendorEmail(
      input.contact.email
    ) ??
    ownerEmail;

  const serviceCities =
    resolvePrismaVendorServiceCities(
      input
    );

  return {
    id:
      input.id,

    vendorCode:
      normalizePrismaVendorCode(
        input.vendorCode
      ) ??
      generatePrismaVendorCode(),

    companyName,

    companyLogo:
      null,

    gstNumber:
      normalizeNullablePrismaVendorString(
        input.businessDetails
          .gstNumber
      ),

    panNumber:
      normalizeNullablePrismaVendorString(
        input.businessDetails
          .panNumber ??
        input.ownerDetails
          .panNumber
      ),

    website:
      normalizeNullablePrismaVendorString(
        input.contact.website
      ),

    address:
      serializePrismaVendorAddress(
        input.registeredAddress
      ) ??
      null,

    city:
      normalizeNullablePrismaVendorString(
        input.registeredAddress
          .city
      ),

    state:
      normalizeNullablePrismaVendorString(
        input.registeredAddress
          .state
      ),

    pincode:
      normalizeNullablePrismaVendorString(
        input.registeredAddress
          .postalCode
      ),

    ownerName,

    ownerMobile,

    ownerEmail:
      ownerEmail ??
      null,

    quotationContactName:
      ownerName ||
      null,

    quotationContactMobile:
      primaryPhone ||
      null,

    quotationContactEmail:
      contactEmail ??
      null,

    coordinatorName:
      null,

    coordinatorMobile:
      normalizeNullablePrismaVendorString(
        input.contact
          .alternatePhone
      ),

    coordinatorEmail:
      null,

    experienceYears:
      mapEstablishedYearToExperienceYears(
        input.businessDetails
          .establishedYear
      ),

    totalVehicles:
      input.vehicles.length,

    totalLabours:
      null,

    serviceCities:
      serializePrismaVendorServiceCities(
        serviceCities
      ),

    householdService:
      hasPrismaVendorServiceType(
        input.services,
        VendorServiceType
          .HOUSEHOLD_RELOCATION
      ),

    officeService:
      hasPrismaVendorServiceType(
        input.services,
        VendorServiceType
          .OFFICE_RELOCATION
      ) ||
      hasPrismaVendorServiceType(
        input.services,
        VendorServiceType
          .CORPORATE_RELOCATION
      ),

    vehicleService:
      hasPrismaVendorServiceType(
        input.services,
        VendorServiceType
          .VEHICLE_TRANSPORT
      ),

    insuranceAvailable:
      input.vehicles.some(
        (vehicle) =>
          Boolean(
            vehicle.insuranceNumber
          )
      ),

    remarks:
      null,

    status:
      mapVendorActiveToPrismaStatus(
        input.active
      ),

    createdAt:
      input.createdAt,

    updatedAt:
      input.updatedAt,
  };
}

/**
 * Maps top-level aggregate update input into the flat Prisma
 * Vendor update shape.
 */
export function mapVendorUpdateToPrismaData(
  input:
    VendorRepositoryContracts
      .UpdateVendorRepositoryInput
): Prisma.VendorUncheckedUpdateInput {
  const data:
    Prisma.VendorUncheckedUpdateInput = {};

  if (
    input.vendorCode !==
      undefined
  ) {
    data.vendorCode =
      normalizePrismaVendorCode(
        input.vendorCode
      );
  }

  if (
    input.businessDetails !==
      undefined
  ) {
    data.companyName =
      normalizePrismaVendorString(
        input.businessDetails
          .companyName
      );

    data.gstNumber =
      normalizeNullablePrismaVendorString(
        input.businessDetails
          .gstNumber
      );

    data.panNumber =
      normalizeNullablePrismaVendorString(
        input.businessDetails
          .panNumber
      );

    data.experienceYears =
      mapEstablishedYearToExperienceYears(
        input.businessDetails
          .establishedYear
      );
  }

  if (
    input.ownerDetails !==
      undefined
  ) {
    data.ownerName =
      normalizePrismaVendorString(
        input.ownerDetails
          .fullName
      );

    data.ownerMobile =
      normalizePrismaVendorPhone(
        input.ownerDetails
          .phone
      );

    data.ownerEmail =
      normalizeNullablePrismaVendorString(
        normalizePrismaVendorEmail(
          input.ownerDetails
            .email
        )
      );

    if (
      input.ownerDetails
        .panNumber !==
      undefined
    ) {
      data.panNumber =
        normalizeNullablePrismaVendorString(
          input.ownerDetails
            .panNumber
        );
    }
  }

  if (
    input.contact !==
      undefined
  ) {
    data.quotationContactMobile =
      normalizeNullablePrismaVendorString(
        normalizePrismaVendorPhone(
          input.contact
            .primaryPhone
        )
      );

    data.quotationContactEmail =
      normalizeNullablePrismaVendorString(
        normalizePrismaVendorEmail(
          input.contact.email
        )
      );

    data.coordinatorMobile =
      normalizeNullablePrismaVendorString(
        input.contact
          .alternatePhone
      );

    data.website =
      normalizeNullablePrismaVendorString(
        input.contact.website
      );
  }

  if (
    input.registeredAddress !==
      undefined
  ) {
    data.address =
      serializePrismaVendorAddress(
        input.registeredAddress
      ) ??
      null;

    data.city =
      normalizeNullablePrismaVendorString(
        input.registeredAddress
          .city
      );

    data.state =
      normalizeNullablePrismaVendorString(
        input.registeredAddress
          .state
      );

    data.pincode =
      normalizeNullablePrismaVendorString(
        input.registeredAddress
          .postalCode
      );
  }

  if (
    input.active !==
      undefined
  ) {
    data.status =
      mapVendorActiveToPrismaStatus(
        input.active
      );
  }

  if (
    input.updatedAt !==
      undefined
  ) {
    data.updatedAt =
      new Date(
        input.updatedAt
      );
  }

  return data;
}

/**
 * Builds the Prisma Vendor filter.
 *
 * serviceAreaScope is not directly represented in the flat
 * schema. Supported serviceType filters map to legacy booleans.
 */
export function createPrismaVendorWhere(
  filter?:
    VendorRepositoryContracts
      .VendorRepositoryFilter
): Prisma.VendorWhereInput {
  if (!filter) {
    return {};
  }

  const conditions:
    Prisma.VendorWhereInput[] = [];

  const search =
    normalizePrismaVendorString(
      filter.search
    );

  if (search) {
    conditions.push({
      OR: [
        {
          vendorCode: {
            contains:
              search,

            mode:
              "insensitive",
          },
        },
        {
          companyName: {
            contains:
              search,

            mode:
              "insensitive",
          },
        },
        {
          ownerName: {
            contains:
              search,

            mode:
              "insensitive",
          },
        },
        {
          ownerMobile: {
            contains:
              search,
          },
        },
        {
          ownerEmail: {
            contains:
              search,

            mode:
              "insensitive",
          },
        },
        {
          quotationContactMobile: {
            contains:
              search,
          },
        },
        {
          quotationContactEmail: {
            contains:
              search,

            mode:
              "insensitive",
          },
        },
      ],
    });
  }

  const textFilters:
    Array<{
      field:
        | "vendorCode"
        | "companyName"
        | "ownerName"
        | "city"
        | "state"
        | "pincode";

      value:
        unknown;
    }> = [
      {
        field:
          "vendorCode",

        value:
          filter.vendorCode,
      },
      {
        field:
          "companyName",

        value:
          filter.companyName,
      },
      {
        field:
          "ownerName",

        value:
          filter.ownerName,
      },
      {
        field:
          "city",

        value:
          filter.city,
      },
      {
        field:
          "state",

        value:
          filter.state,
      },
      {
        field:
          "pincode",

        value:
          filter.postalCode,
      },
    ];

  for (
    const textFilter
    of textFilters
  ) {
    const value =
      normalizePrismaVendorString(
        textFilter.value
      );

    if (value) {
      conditions.push({
        [textFilter.field]: {
          contains:
            value,

          mode:
            "insensitive",
        },
      });
    }
  }

  const email =
    normalizePrismaVendorEmail(
      filter.email
    );

  if (email) {
    conditions.push({
      OR: [
        {
          ownerEmail: {
            equals:
              email,

            mode:
              "insensitive",
          },
        },
        {
          quotationContactEmail: {
            equals:
              email,

            mode:
              "insensitive",
          },
        },
        {
          coordinatorEmail: {
            equals:
              email,

            mode:
              "insensitive",
          },
        },
      ],
    });
  }

  const phone =
    normalizePrismaVendorPhone(
      filter.phone
    );

  if (phone) {
    conditions.push({
      OR: [
        {
          ownerMobile:
            phone,
        },
        {
          quotationContactMobile:
            phone,
        },
        {
          coordinatorMobile:
            phone,
        },
      ],
    });
  }

  if (
    filter.active !==
      undefined
  ) {
    conditions.push({
      status:
        mapVendorActiveToPrismaStatus(
          filter.active
        ),
    });
  }

  if (
    filter.hasBankDetails !==
      undefined
  ) {
    conditions.push({
      bankAccounts:
        filter.hasBankDetails
          ? {
              some: {},
            }
          : {
              none: {},
            },
    });
  }

  if (
    filter.hasVehicles !==
      undefined
  ) {
    conditions.push({
      vehicles:
        filter.hasVehicles
          ? {
              some: {},
            }
          : {
              none: {},
            },
    });
  }

  if (
    filter.hasVerifiedDocuments !==
      undefined
  ) {
    conditions.push({
      documents:
        filter.hasVerifiedDocuments
          ? {
              some: {
                verificationStatus:
                  PrismaVerificationStatus
                    .VERIFIED,
              },
            }
          : {
              none: {
                verificationStatus:
                  PrismaVerificationStatus
                    .VERIFIED,
              },
            },
    });
  }

  if (
    filter.serviceType ===
      VendorServiceType
        .HOUSEHOLD_RELOCATION
  ) {
    conditions.push({
      householdService:
        true,
    });
  }

  if (
    filter.serviceType ===
      VendorServiceType
        .OFFICE_RELOCATION ||
    filter.serviceType ===
      VendorServiceType
        .CORPORATE_RELOCATION
  ) {
    conditions.push({
      officeService:
        true,
    });
  }

  if (
    filter.serviceType ===
      VendorServiceType
        .VEHICLE_TRANSPORT
  ) {
    conditions.push({
      vehicleService:
        true,
    });
  }

  if (
    filter.createdFrom ||
    filter.createdUntil
  ) {
    conditions.push({
      createdAt: {
        gte:
          filter.createdFrom,

        lte:
          filter.createdUntil,
      },
    });
  }

  if (
    filter.updatedFrom ||
    filter.updatedUntil
  ) {
    conditions.push({
      updatedAt: {
        gte:
          filter.updatedFrom,

        lte:
          filter.updatedUntil,
      },
    });
  }

  return conditions.length > 0
    ? {
        AND:
          conditions,
      }
    : {};
}

/**
 * Builds the Prisma Vendor order-by value.
 */
export function createPrismaVendorOrderBy(
  sort:
    VendorRepositoryContracts
      .VendorRepositorySort =
      DEFAULT_VENDOR_REPOSITORY_SORT
): Prisma.VendorOrderByWithRelationInput {
  switch (sort.field) {
    case "updatedAt":
      return {
        updatedAt:
          sort.direction,
      };

    case "companyName":
      return {
        companyName:
          sort.direction,
      };

    case "vendorCode":
      return {
        vendorCode:
          sort.direction,
      };

    case "city":
      return {
        city:
          sort.direction,
      };

    case "state":
      return {
        state:
          sort.direction,
      };

    case "createdAt":
    default:
      return {
        createdAt:
          sort.direction,
      };
  }
}

/**
 * Normalizes one Vendor list query for Prisma.
 */
export function normalizePrismaVendorListQuery(
  query:
    VendorRepositoryContracts
      .VendorRepositoryListQuery = {}
): {
  where:
    Prisma.VendorWhereInput;

  orderBy:
    Prisma.VendorOrderByWithRelationInput;

  skip:
    number;

  take:
    number;

  page:
    number;

  pageSize:
    number;
} {
  const page =
    query.pagination?.page &&
    query.pagination.page > 0
      ? query.pagination.page
      : DEFAULT_VENDOR_REPOSITORY_PAGE;

  const pageSize =
    normalizeVendorRepositoryPageSize(
      query.pagination
        ?.pageSize ??
      DEFAULT_VENDOR_REPOSITORY_PAGE_SIZE
    );

  return {
    where:
      createPrismaVendorWhere(
        query.filter
      ),

    orderBy:
      createPrismaVendorOrderBy(
        query.sort ??
        DEFAULT_VENDOR_REPOSITORY_SORT
      ),

    skip:
      calculateVendorRepositoryOffset({
        page,
        pageSize,
      }),

    take:
      pageSize,

    page,

    pageSize,
  };
}

/**
 * Validates the required flat create fields before Prisma is
 * invoked.
 */
export function validatePrismaVendorCreateData(
  data:
    Prisma.VendorUncheckedCreateInput
): void {
  const companyName =
    normalizePrismaVendorString(
      data.companyName
    );

  const ownerName =
    normalizePrismaVendorString(
      data.ownerName
    );

  const ownerMobile =
    normalizePrismaVendorPhone(
      data.ownerMobile
    );

  const vendorCode =
    normalizePrismaVendorCode(
      data.vendorCode
    );

  if (!companyName) {
    throw new VendorRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      "Company name cannot be empty before vendor persistence.",
      {
        field:
          "companyName",
      }
    );
  }

  if (!ownerName) {
    throw new VendorRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      "Owner name cannot be empty before vendor persistence.",
      {
        field:
          "ownerName",
      }
    );
  }

  if (!ownerMobile) {
    throw new VendorRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      "Owner mobile cannot be empty before vendor persistence.",
      {
        field:
          "ownerMobile",
      }
    );
  }

  if (!vendorCode) {
    throw new VendorRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      "Vendor code cannot be empty before vendor persistence.",
      {
        field:
          "vendorCode",
      }
    );
  }
}

/**
 * ============================================================
 * End of Fresh Prisma Vendor Repository Part B
 * ============================================================
 */
/**
 * ============================================================
 * Fresh Prisma Vendor Repository
 * Part C1
 * ============================================================
 *
 * Core Prisma read/create operations:
 *
 * - Create Vendor
 * - Find by ID
 * - Find by vendor code
 * - Find by email
 * - Find by phone
 * - Paginated Vendor listing
 * - Paginated Vendor summaries
 *
 * IMPORTANT
 * ---------
 * This part contains no import declarations.
 * Append it directly after Fresh Part B.
 * ============================================================
 */

/**
 * Creates one Vendor record.
 */
export async function createPrismaVendorRecord(
  prisma:
    PrismaVendorRepositoryClient,
  input:
    VendorRepositoryContracts
      .CreateVendorRepositoryInput
): Promise<
  VendorMapperTypes.VendorAggregate
> {
  try {
    const mappedData =
      mapVendorAggregateToPrismaCreateData(
        input
      );

    validatePrismaVendorCreateData(
      mappedData
    );

    const data:
      Prisma.VendorUncheckedCreateInput = {
      ...mappedData,

      vendorCode:
        normalizePrismaVendorCode(
          mappedData.vendorCode
        ) ??
        generatePrismaVendorCode(),

      companyName:
        normalizePrismaVendorString(
          mappedData.companyName
        ),

      ownerName:
        normalizePrismaVendorString(
          mappedData.ownerName
        ),

      ownerMobile:
        normalizePrismaVendorPhone(
          mappedData.ownerMobile
        ),
    };

    const record =
      await prisma.vendor.create({
        data,
      });

    return mapPrismaVendorToAggregate(
      record
    );
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Returns one Vendor by internal ID.
 */
export async function findPrismaVendorById(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string
): Promise<
  VendorMapperTypes.VendorAggregate |
  null
> {
  const normalizedVendorId =
    requirePrismaVendorIdentifier(
      vendorId,
      "vendorId"
    );

  try {
    const record =
      await prisma.vendor.findUnique({
        where: {
          id:
            normalizedVendorId,
        },
      });

    return record
      ? mapPrismaVendorToAggregate(
          record
        )
      : null;
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Returns one Vendor by public vendor code.
 */
export async function findPrismaVendorByCode(
  prisma:
    PrismaVendorRepositoryClient,
  vendorCode: string
): Promise<
  VendorMapperTypes.VendorAggregate |
  null
> {
  const normalizedVendorCode =
    normalizePrismaVendorCode(
      vendorCode
    );

  if (!normalizedVendorCode) {
    throw new VendorRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      "Vendor code is required.",
      {
        field:
          "vendorCode",

        value:
          vendorCode,
      }
    );
  }

  try {
    const record =
      await prisma.vendor.findUnique({
        where: {
          vendorCode:
            normalizedVendorCode,
        },
      });

    return record
      ? mapPrismaVendorToAggregate(
          record
        )
      : null;
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Returns one Vendor matching any stored email field.
 */
export async function findPrismaVendorByEmail(
  prisma:
    PrismaVendorRepositoryClient,
  email: string
): Promise<
  VendorMapperTypes.VendorAggregate |
  null
> {
  const normalizedEmail =
    normalizePrismaVendorEmail(
      email
    );

  if (!normalizedEmail) {
    throw new VendorRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      "Vendor email is required.",
      {
        field:
          "email",

        value:
          email,
      }
    );
  }

  try {
    const record =
      await prisma.vendor.findFirst({
        where: {
          OR: [
            {
              ownerEmail: {
                equals:
                  normalizedEmail,

                mode:
                  "insensitive",
              },
            },
            {
              quotationContactEmail: {
                equals:
                  normalizedEmail,

                mode:
                  "insensitive",
              },
            },
            {
              coordinatorEmail: {
                equals:
                  normalizedEmail,

                mode:
                  "insensitive",
              },
            },
          ],
        },

        orderBy: {
          createdAt:
            "asc",
        },
      });

    return record
      ? mapPrismaVendorToAggregate(
          record
        )
      : null;
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Returns one Vendor matching any stored phone field.
 */
export async function findPrismaVendorByPhone(
  prisma:
    PrismaVendorRepositoryClient,
  phone: string
): Promise<
  VendorMapperTypes.VendorAggregate |
  null
> {
  const normalizedPhone =
    normalizePrismaVendorPhone(
      phone
    );

  if (!normalizedPhone) {
    throw new VendorRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      "Vendor phone number is required.",
      {
        field:
          "phone",

        value:
          phone,
      }
    );
  }

  try {
    const record =
      await prisma.vendor.findFirst({
        where: {
          OR: [
            {
              ownerMobile:
                normalizedPhone,
            },
            {
              quotationContactMobile:
                normalizedPhone,
            },
            {
              coordinatorMobile:
                normalizedPhone,
            },
          ],
        },

        orderBy: {
          createdAt:
            "asc",
        },
      });

    return record
      ? mapPrismaVendorToAggregate(
          record
        )
      : null;
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Returns a paginated Vendor aggregate list.
 */
export async function findManyPrismaVendors(
  prisma:
    PrismaVendorRepositoryClient,
  query:
    VendorRepositoryContracts
      .VendorRepositoryListQuery = {}
): Promise<
  VendorRepositoryContracts
    .VendorRepositoryPage<
      VendorMapperTypes
        .VendorAggregate
    >
> {
  const normalizedQuery =
    normalizePrismaVendorListQuery(
      query
    );

  try {
    const [
      records,
      totalRecords,
    ] = await Promise.all([
      prisma.vendor.findMany({
        where:
          normalizedQuery.where,

        orderBy:
          normalizedQuery.orderBy,

        skip:
          normalizedQuery.skip,

        take:
          normalizedQuery.take,
      }),

      prisma.vendor.count({
        where:
          normalizedQuery.where,
      }),
    ]);

    return {
      items:
        records.map(
          (
            record
          ) =>
            mapPrismaVendorToAggregate(
              record
            )
        ),

      pagination:
        createVendorPaginationMetadata(
          normalizedQuery.page,
          normalizedQuery.pageSize,
          totalRecords
        ),
    };
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Returns a paginated lightweight Vendor summary list.
 */
export async function findPrismaVendorSummaries(
  prisma:
    PrismaVendorRepositoryClient,
  query:
    VendorRepositoryContracts
      .VendorRepositoryListQuery = {}
): Promise<
  VendorRepositoryContracts
    .VendorRepositoryPage<
      VendorMapperTypes
        .VendorAggregateSummary
    >
> {
  const normalizedQuery =
    normalizePrismaVendorListQuery(
      query
    );

  try {
    const [
      records,
      totalRecords,
    ] = await Promise.all([
      prisma.vendor.findMany({
        where:
          normalizedQuery.where,

        orderBy:
          normalizedQuery.orderBy,

        skip:
          normalizedQuery.skip,

        take:
          normalizedQuery.take,
      }),

      prisma.vendor.count({
        where:
          normalizedQuery.where,
      }),
    ]);

    return {
      items:
        records.map(
          (
            record
          ) =>
            mapPrismaVendorToSummary(
              record
            )
        ),

      pagination:
        createVendorPaginationMetadata(
          normalizedQuery.page,
          normalizedQuery.pageSize,
          totalRecords
        ),
    };
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * ============================================================
 * End of Fresh Prisma Vendor Repository Part C1
 * ============================================================
 */
/**
 * ============================================================
 * Fresh Prisma Vendor Repository
 * Part C2
 * ============================================================
 *
 * Core Prisma mutation and query operations:
 *
 * - Update Vendor
 * - Delete Vendor
 * - Vendor existence
 * - Uniqueness checks
 * - Vendor statistics
 * - Count Vendors
 * - Any Vendor match
 *
 * IMPORTANT
 * ---------
 * This part contains no import declarations.
 * Append it directly after Fresh Part C1.
 * ============================================================
 */

/**
 * Updates one Vendor record.
 */
export async function updatePrismaVendorRecord(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  input:
    VendorRepositoryContracts
      .UpdateVendorRepositoryInput
): Promise<
  VendorMapperTypes.VendorAggregate |
  null
> {
  const normalizedVendorId =
    requirePrismaVendorIdentifier(
      vendorId,
      "vendorId"
    );

  try {
    const existing =
      await prisma.vendor.findUnique({
        where: {
          id:
            normalizedVendorId,
        },

        select: {
          id:
            true,
        },
      });

    if (!existing) {
      return null;
    }

    const data =
      mapVendorUpdateToPrismaData(
        input
      );

    const record =
      await prisma.vendor.update({
        where: {
          id:
            normalizedVendorId,
        },

        data,
      });

    return mapPrismaVendorToAggregate(
      record
    );
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Physically deletes one Vendor record.
 */
export async function deletePrismaVendorRecord(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string
): Promise<
  VendorRepositoryContracts
    .VendorRepositoryDeleteResult
> {
  const normalizedVendorId =
    requirePrismaVendorIdentifier(
      vendorId,
      "vendorId"
    );

  try {
    const existing =
      await prisma.vendor.findUnique({
        where: {
          id:
            normalizedVendorId,
        },

        select: {
          id:
            true,
        },
      });

    if (!existing) {
      return {
        vendorId:
          normalizedVendorId,

        deleted:
          false,
      };
    }

    await prisma.vendor.delete({
      where: {
        id:
          normalizedVendorId,
      },
    });

    return {
      vendorId:
        normalizedVendorId,

      deleted:
        true,
    };
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Determines whether one Vendor exists.
 */
export async function prismaVendorExists(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string
): Promise<boolean> {
  const normalizedVendorId =
    normalizePrismaVendorString(
      vendorId
    );

  if (!normalizedVendorId) {
    return false;
  }

  try {
    const record =
      await prisma.vendor.findUnique({
        where: {
          id:
            normalizedVendorId,
        },

        select: {
          id:
            true,
        },
      });

    return Boolean(record);
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Builds uniqueness-check conditions in a deterministic order.
 */
export function createPrismaVendorUniquenessConditions(
  query:
    VendorRepositoryContracts
      .VendorRepositoryUniquenessQuery
): Array<{
  field:
    NonNullable<
      VendorRepositoryContracts
        .VendorRepositoryUniquenessResult[
          "matchedField"
        ]
    >;

  where:
    Prisma.VendorWhereInput;
}> {
  const conditions:
    Array<{
      field:
        NonNullable<
          VendorRepositoryContracts
            .VendorRepositoryUniquenessResult[
              "matchedField"
            ]
        >;

      where:
        Prisma.VendorWhereInput;
    }> = [];

  const vendorCode =
    normalizePrismaVendorCode(
      query.vendorCode
    );

  if (vendorCode) {
    conditions.push({
      field:
        "vendorCode",

      where: {
        vendorCode,
      },
    });
  }

  const companyName =
    normalizePrismaVendorString(
      query.companyName
    );

  if (companyName) {
    conditions.push({
      field:
        "companyName",

      where: {
        companyName: {
          equals:
            companyName,

          mode:
            "insensitive",
        },
      },
    });
  }

  const email =
    normalizePrismaVendorEmail(
      query.email
    );

  if (email) {
    conditions.push({
      field:
        "email",

      where: {
        OR: [
          {
            ownerEmail: {
              equals:
                email,

              mode:
                "insensitive",
            },
          },
          {
            quotationContactEmail: {
              equals:
                email,

              mode:
                "insensitive",
            },
          },
          {
            coordinatorEmail: {
              equals:
                email,

              mode:
                "insensitive",
            },
          },
        ],
      },
    });
  }

  const phone =
    normalizePrismaVendorPhone(
      query.phone
    );

  if (phone) {
    conditions.push({
      field:
        "phone",

      where: {
        OR: [
          {
            ownerMobile:
              phone,
          },
          {
            quotationContactMobile:
              phone,
          },
          {
            coordinatorMobile:
              phone,
          },
        ],
      },
    });
  }

  const gstNumber =
    normalizePrismaVendorString(
      query.gstNumber
    );

  if (gstNumber) {
    conditions.push({
      field:
        "gstNumber",

      where: {
        gstNumber: {
          equals:
            gstNumber,

          mode:
            "insensitive",
        },
      },
    });
  }

  const panNumber =
    normalizePrismaVendorString(
      query.panNumber
    );

  if (panNumber) {
    conditions.push({
      field:
        "panNumber",

      where: {
        panNumber: {
          equals:
            panNumber,

          mode:
            "insensitive",
        },
      },
    });
  }

  const registrationNumber =
    normalizePrismaVehicleRegistrationNumber(
      query.registrationNumber
    );

  if (registrationNumber) {
    conditions.push({
      field:
        "registrationNumber",

      where: {
        vehicles: {
          some: {
            registrationNumber,
          },
        },
      },
    });
  }

  return conditions;
}

/**
 * Checks fields that should remain unique.
 */
export async function checkPrismaVendorUniqueness(
  prisma:
    PrismaVendorRepositoryClient,
  query:
    VendorRepositoryContracts
      .VendorRepositoryUniquenessQuery
): Promise<
  VendorRepositoryContracts
    .VendorRepositoryUniquenessResult
> {
  const conditions =
    createPrismaVendorUniquenessConditions(
      query
    );

  const excludedVendorId =
    normalizeOptionalPrismaVendorString(
      query.excludeVendorId
    );

  try {
    for (
      const condition
      of conditions
    ) {
      const record =
        await prisma.vendor.findFirst({
          where: {
            AND: [
              condition.where,

              ...(excludedVendorId
                ? [
                    {
                      id: {
                        not:
                          excludedVendorId,
                      },
                    },
                  ]
                : []),
            ],
          },

          select: {
            id:
              true,
          },
        });

      if (record) {
        return {
          exists:
            true,

          vendorId:
            record.id,

          matchedField:
            condition.field,
        };
      }
    }

    return {
      exists:
        false,
    };
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Returns Vendor dashboard statistics supported by the current
 * Prisma schema.
 */
export async function getPrismaVendorStatistics(
  prisma:
    PrismaVendorRepositoryClient
): Promise<
  VendorRepositoryContracts
    .VendorRepositoryStatistics
> {
  try {
    const [
      totalVendors,
      activeVendors,
      vendorsWithBankDetails,
      vendorsWithVehicles,
      vendorsWithVerifiedDocuments,
    ] = await Promise.all([
      prisma.vendor.count(),

      prisma.vendor.count({
        where: {
          status:
            "ACTIVE",
        },
      }),

      prisma.vendor.count({
        where: {
          bankAccounts: {
            some: {},
          },
        },
      }),

      prisma.vendor.count({
        where: {
          vehicles: {
            some: {},
          },
        },
      }),

      prisma.vendor.count({
        where: {
          documents: {
            some: {
              verificationStatus:
                PrismaVerificationStatus
                  .VERIFIED,
            },
          },
        },
      }),
    ]);

    return {
      totalVendors,

      activeVendors,

      inactiveVendors:
        Math.max(
          totalVendors -
            activeVendors,
          0
        ),

      vendorsWithBankDetails,

      vendorsWithVehicles,

      vendorsWithVerifiedDocuments,
    };
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Counts Vendors matching repository filters.
 */
export async function countPrismaVendors(
  prisma:
    PrismaVendorRepositoryClient,
  filter?:
    VendorRepositoryContracts
      .VendorRepositoryFilter
): Promise<number> {
  try {
    return await prisma.vendor.count({
      where:
        createPrismaVendorWhere(
          filter
        ),
    });
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Determines whether any Vendor matches repository filters.
 */
export async function anyPrismaVendor(
  prisma:
    PrismaVendorRepositoryClient,
  filter?:
    VendorRepositoryContracts
      .VendorRepositoryFilter
): Promise<boolean> {
  try {
    const record =
      await prisma.vendor.findFirst({
        where:
          createPrismaVendorWhere(
            filter
          ),

        select: {
          id:
            true,
        },
      });

    return Boolean(record);
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * ============================================================
 * End of Fresh Prisma Vendor Repository Part C2
 * ============================================================
 */
/**
 * ============================================================
 * Fresh Prisma Vendor Repository
 * Part D1
 * ============================================================
 *
 * Nested compatibility operations:
 *
 * - Vendor existence guard
 * - Legacy service-area persistence
 * - Legacy service persistence
 * - Explicit pricing capability boundary
 *
 * IMPORTANT
 * ---------
 * This part contains no import declarations.
 * Append it directly after Fresh Part C2.
 * ============================================================
 */

/**
 * Ensures that a Vendor exists before a nested mutation.
 */
export async function requireExistingPrismaVendor(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string
): Promise<string> {
  const normalizedVendorId =
    requirePrismaVendorIdentifier(
      vendorId,
      "vendorId"
    );

  const exists =
    await prismaVendorExists(
      prisma,
      normalizedVendorId
    );

  if (!exists) {
    throw new VendorRepositoryError(
      "VENDOR_NOT_FOUND",
      "Vendor was not found.",
      {
        vendorId:
          normalizedVendorId,
      }
    );
  }

  return normalizedVendorId;
}

/**
 * Resolves the city represented by a service-area input.
 */
export function resolvePrismaServiceAreaCity(
  input:
    Pick<
      VendorRepositoryContracts
        .CreateVendorServiceAreaRepositoryInput,
      | "originCity"
      | "destinationCity"
    >
): string | undefined {
  return (
    normalizeOptionalPrismaVendorString(
      input.destinationCity
    ) ??
    normalizeOptionalPrismaVendorString(
      input.originCity
    )
  );
}

/**
 * Persists the flat serviceCities field and returns the
 * reconstructed domain service areas.
 */
export async function savePrismaVendorServiceCities(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  cities:
    readonly string[]
): Promise<
  VendorDomain.VendorServiceArea[]
> {
  const normalizedVendorId =
    await requireExistingPrismaVendor(
      prisma,
      vendorId
    );

  try {
    const record =
      await prisma.vendor.update({
        where: {
          id:
            normalizedVendorId,
        },

        data: {
          serviceCities:
            serializePrismaVendorServiceCities(
              cities
            ),
        },
      });

    return mapPrismaVendorServiceAreas(
      record
    );
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Creates one legacy-compatible service area.
 */
export async function createPrismaVendorServiceArea(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  input:
    VendorRepositoryContracts
      .CreateVendorServiceAreaRepositoryInput
): Promise<
  VendorDomain.VendorServiceArea
> {
  const normalizedVendorId =
    await requireExistingPrismaVendor(
      prisma,
      vendorId
    );

  const record =
    await prisma.vendor.findUnique({
      where: {
        id:
          normalizedVendorId,
      },
    });

  if (!record) {
    throw new VendorRepositoryError(
      "VENDOR_NOT_FOUND",
      "Vendor was not found.",
      {
        vendorId:
          normalizedVendorId,
      }
    );
  }

  const city =
    resolvePrismaServiceAreaCity(
      input
    );

  if (!city) {
    throw new VendorRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      "A service-area origin or destination city is required.",
      {
        field:
          "serviceArea.city",
      }
    );
  }

  const currentCities =
    parsePrismaVendorServiceCities(
      record.serviceCities
    );

  const nextCities = [
    ...currentCities,
    city,
  ];

  const serviceAreas =
    await savePrismaVendorServiceCities(
      prisma,
      normalizedVendorId,
      nextCities
    );

  const normalizedCity =
    city.toLowerCase();

  const created =
    serviceAreas.find(
      (serviceArea) =>
        normalizePrismaVendorString(
          serviceArea.destinationCity ??
          serviceArea.originCity
        ).toLowerCase() ===
        normalizedCity
    );

  if (!created) {
    throw new VendorRepositoryError(
      "DATABASE_ERROR",
      "The service area could not be reconstructed after persistence.",
      {
        vendorId:
          normalizedVendorId,
      }
    );
  }

  return created;
}

/**
 * Returns all reconstructed Vendor service areas.
 */
export async function findPrismaVendorServiceAreas(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string
): Promise<
  VendorDomain.VendorServiceArea[]
> {
  const normalizedVendorId =
    requirePrismaVendorIdentifier(
      vendorId,
      "vendorId"
    );

  try {
    const record =
      await prisma.vendor.findUnique({
        where: {
          id:
            normalizedVendorId,
        },
      });

    return record
      ? mapPrismaVendorServiceAreas(
          record
        )
      : [];
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Returns one reconstructed service area by generated ID.
 */
export async function findPrismaVendorServiceAreaById(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  serviceAreaId: string
): Promise<
  VendorDomain.VendorServiceArea |
  null
> {
  const normalizedServiceAreaId =
    requirePrismaVendorIdentifier(
      serviceAreaId,
      "serviceAreaId"
    );

  const serviceAreas =
    await findPrismaVendorServiceAreas(
      prisma,
      vendorId
    );

  return (
    serviceAreas.find(
      (serviceArea) =>
        serviceArea.id ===
        normalizedServiceAreaId
    ) ??
    null
  );
}

/**
 * Updates one reconstructed service area.
 */
export async function updatePrismaVendorServiceArea(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  serviceAreaId: string,
  input:
    VendorRepositoryContracts
      .UpdateVendorServiceAreaRepositoryInput
): Promise<
  VendorDomain.VendorServiceArea |
  null
> {
  const normalizedServiceAreaId =
    requirePrismaVendorIdentifier(
      serviceAreaId,
      "serviceAreaId"
    );

  const serviceAreas =
    await findPrismaVendorServiceAreas(
      prisma,
      vendorId
    );

  const index =
    serviceAreas.findIndex(
      (serviceArea) =>
        serviceArea.id ===
        normalizedServiceAreaId
    );

  if (index < 0) {
    return null;
  }

  const current =
    serviceAreas[index];

  const nextCity =
    normalizeOptionalPrismaVendorString(
      input.destinationCity
    ) ??
    normalizeOptionalPrismaVendorString(
      input.originCity
    ) ??
    normalizeOptionalPrismaVendorString(
      current.destinationCity
    ) ??
    normalizeOptionalPrismaVendorString(
      current.originCity
    );

  if (!nextCity) {
    throw new VendorRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      "A service-area city is required.",
      {
        field:
          "serviceArea.city",
      }
    );
  }

  const cities =
    serviceAreas.map(
      (
        serviceArea,
        serviceAreaIndex
      ) =>
        serviceAreaIndex === index
          ? nextCity
          : normalizePrismaVendorString(
              serviceArea.destinationCity ??
              serviceArea.originCity
            )
    );

  const updatedAreas =
    await savePrismaVendorServiceCities(
      prisma,
      vendorId,
      cities
    );

  return (
    updatedAreas[index] ??
    null
  );
}

/**
 * Deletes one reconstructed service area.
 */
export async function deletePrismaVendorServiceArea(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  serviceAreaId: string
): Promise<boolean> {
  const normalizedServiceAreaId =
    requirePrismaVendorIdentifier(
      serviceAreaId,
      "serviceAreaId"
    );

  const serviceAreas =
    await findPrismaVendorServiceAreas(
      prisma,
      vendorId
    );

  const index =
    serviceAreas.findIndex(
      (serviceArea) =>
        serviceArea.id ===
        normalizedServiceAreaId
    );

  if (index < 0) {
    return false;
  }

  const remainingCities =
    serviceAreas
      .filter(
        (
          _serviceArea,
          serviceAreaIndex
        ) =>
          serviceAreaIndex !==
          index
      )
      .map(
        (serviceArea) =>
          normalizePrismaVendorString(
            serviceArea.destinationCity ??
            serviceArea.originCity
          )
      )
      .filter(Boolean);

  await savePrismaVendorServiceCities(
    prisma,
    vendorId,
    remainingCities
  );

  return true;
}

/**
 * Replaces all legacy-compatible service areas.
 */
export async function replacePrismaVendorServiceAreas(
  prisma:
    PrismaVendorRepositoryClient,
  input:
    VendorRepositoryContracts
      .ReplaceVendorServiceAreasRepositoryInput
): Promise<
  VendorRepositoryContracts
    .ReplaceVendorServiceAreasRepositoryResult
> {
  const vendorId =
    await requireExistingPrismaVendor(
      prisma,
      input.vendorId
    );

  if (
    input.serviceAreas.length ===
      0
  ) {
    await savePrismaVendorServiceCities(
      prisma,
      vendorId,
      []
    );

    return createEmptyServiceAreaReplacementResult(
      vendorId
    );
  }

  const cities =
    input.serviceAreas.map(
      resolvePrismaServiceAreaCity
    );

  if (
    cities.some(
      (city) =>
        !city
    )
  ) {
    throw new VendorRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      "Every service area must provide an origin or destination city.",
      {
        field:
          "serviceAreas",
      }
    );
  }

  const persistedServiceAreas =
    await savePrismaVendorServiceCities(
      prisma,
      vendorId,
      cities as string[]
    );

  return {
    vendorId,

    serviceAreas:
      persistedServiceAreas,

    replacedCount:
      persistedServiceAreas.length,
  };
}

/**
 * Determines whether one reconstructed service area exists.
 */
export async function prismaVendorServiceAreaExists(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  serviceAreaId: string
): Promise<boolean> {
  return Boolean(
    await findPrismaVendorServiceAreaById(
      prisma,
      vendorId,
      serviceAreaId
    )
  );
}

/**
 * Maps domain services into the three legacy Vendor service
 * flags.
 */
export function mapPrismaVendorServiceFlags(
  services:
    readonly Pick<
      VendorDomain.VendorService,
      | "serviceType"
      | "active"
    >[]
): Pick<
  Prisma.VendorUncheckedUpdateInput,
  | "householdService"
  | "officeService"
  | "vehicleService"
> {
  return {
    householdService:
      services.some(
        (service) =>
          service.active &&
          service.serviceType ===
            VendorServiceType
              .HOUSEHOLD_RELOCATION
      ),

    officeService:
      services.some(
        (service) =>
          service.active &&
          (
            service.serviceType ===
              VendorServiceType
                .OFFICE_RELOCATION ||
            service.serviceType ===
              VendorServiceType
                .CORPORATE_RELOCATION
          )
      ),

    vehicleService:
      services.some(
        (service) =>
          service.active &&
          service.serviceType ===
            VendorServiceType
              .VEHICLE_TRANSPORT
      ),
  };
}

/**
 * Persists legacy service flags and returns reconstructed
 * services.
 */
export async function savePrismaVendorServices(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  services:
    readonly Pick<
      VendorDomain.VendorService,
      | "serviceType"
      | "active"
    >[]
): Promise<
  VendorDomain.VendorService[]
> {
  const normalizedVendorId =
    await requireExistingPrismaVendor(
      prisma,
      vendorId
    );

  try {
    const record =
      await prisma.vendor.update({
        where: {
          id:
            normalizedVendorId,
        },

        data:
          mapPrismaVendorServiceFlags(
            services
          ),
      });

    return mapPrismaVendorServices(
      record
    );
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Returns all reconstructed Vendor services.
 */
export async function findPrismaVendorServices(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string
): Promise<
  VendorDomain.VendorService[]
> {
  const normalizedVendorId =
    requirePrismaVendorIdentifier(
      vendorId,
      "vendorId"
    );

  try {
    const record =
      await prisma.vendor.findUnique({
        where: {
          id:
            normalizedVendorId,
        },
      });

    return record
      ? mapPrismaVendorServices(
          record
        )
      : [];
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Returns one reconstructed service by generated ID.
 */
export async function findPrismaVendorServiceById(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  serviceId: string
): Promise<
  VendorDomain.VendorService |
  null
> {
  const normalizedServiceId =
    requirePrismaVendorIdentifier(
      serviceId,
      "serviceId"
    );

  const services =
    await findPrismaVendorServices(
      prisma,
      vendorId
    );

  return (
    services.find(
      (service) =>
        service.id ===
        normalizedServiceId
    ) ??
    null
  );
}

/**
 * Returns one reconstructed service by service type.
 */
export async function findPrismaVendorServiceByType(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  serviceType:
    VendorServiceType
): Promise<
  VendorDomain.VendorService |
  null
> {
  const services =
    await findPrismaVendorServices(
      prisma,
      vendorId
    );

  return (
    services.find(
      (service) =>
        service.serviceType ===
        serviceType
    ) ??
    null
  );
}

/**
 * Returns whether a service type can be represented by the
 * current flat Vendor schema.
 */
export function isPrismaVendorServiceTypeSupported(
  serviceType:
    VendorServiceType
): boolean {
  return [
    VendorServiceType
      .HOUSEHOLD_RELOCATION,

    VendorServiceType
      .OFFICE_RELOCATION,

    VendorServiceType
      .CORPORATE_RELOCATION,

    VendorServiceType
      .VEHICLE_TRANSPORT,
  ].includes(
    serviceType
  );
}

/**
 * Creates or enables one supported Vendor service.
 */
export async function createPrismaVendorService(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  input:
    VendorRepositoryContracts
      .CreateVendorServiceRepositoryInput
): Promise<
  VendorDomain.VendorService
> {
  if (
    !isPrismaVendorServiceTypeSupported(
      input.serviceType
    )
  ) {
    throw createUnsupportedPrismaVendorCapabilityError(
      `serviceType.${input.serviceType}`
    );
  }

  const currentServices =
    await findPrismaVendorServices(
      prisma,
      vendorId
    );

  const nextService:
    VendorDomain.VendorService = {
    id:
      input.id ??
      `${vendorId}-service-new`,

    serviceType:
      input.serviceType,

    title:
      input.title,

    description:
      input.description,

    active:
      input.active,

    createdAt:
      input.createdAt ??
      new Date(),

    updatedAt:
      input.updatedAt ??
      new Date(),
  };

  const services =
    await savePrismaVendorServices(
      prisma,
      vendorId,
      [
        ...currentServices.filter(
          (service) =>
            service.serviceType !==
            input.serviceType
        ),

        nextService,
      ]
    );

  const created =
    services.find(
      (service) =>
        service.serviceType ===
        input.serviceType
    );

  if (!created) {
    throw new VendorRepositoryError(
      "DATABASE_ERROR",
      "The Vendor service could not be reconstructed after persistence.",
      {
        vendorId,
      }
    );
  }

  return created;
}

/**
 * Updates one reconstructed Vendor service.
 */
export async function updatePrismaVendorService(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  serviceId: string,
  input:
    VendorRepositoryContracts
      .UpdateVendorServiceRepositoryInput
): Promise<
  VendorDomain.VendorService |
  null
> {
  const normalizedServiceId =
    requirePrismaVendorIdentifier(
      serviceId,
      "serviceId"
    );

  const services =
    await findPrismaVendorServices(
      prisma,
      vendorId
    );

  const index =
    services.findIndex(
      (service) =>
        service.id ===
        normalizedServiceId
    );

  if (index < 0) {
    return null;
  }

  const current =
    services[index];

  const next:
    VendorDomain.VendorService = {
    ...current,
    ...input,

    updatedAt:
      input.updatedAt ??
      new Date(),
  };

  if (
    !isPrismaVendorServiceTypeSupported(
      next.serviceType
    )
  ) {
    throw createUnsupportedPrismaVendorCapabilityError(
      `serviceType.${next.serviceType}`
    );
  }

  const updatedServices = [
    ...services,
  ];

  updatedServices[index] =
    next;

  const persistedServices =
    await savePrismaVendorServices(
      prisma,
      vendorId,
      updatedServices
    );

  return (
    persistedServices.find(
      (service) =>
        service.serviceType ===
        next.serviceType
    ) ??
    null
  );
}

/**
 * Deletes or disables one reconstructed Vendor service.
 */
export async function deletePrismaVendorService(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  serviceId: string
): Promise<boolean> {
  const normalizedServiceId =
    requirePrismaVendorIdentifier(
      serviceId,
      "serviceId"
    );

  const services =
    await findPrismaVendorServices(
      prisma,
      vendorId
    );

  const remainingServices =
    services.filter(
      (service) =>
        service.id !==
        normalizedServiceId
    );

  if (
    remainingServices.length ===
    services.length
  ) {
    return false;
  }

  await savePrismaVendorServices(
    prisma,
    vendorId,
    remainingServices
  );

  return true;
}

/**
 * Replaces all representable Vendor services.
 */
export async function replacePrismaVendorServices(
  prisma:
    PrismaVendorRepositoryClient,
  input:
    VendorRepositoryContracts
      .ReplaceVendorServicesRepositoryInput
): Promise<
  VendorRepositoryContracts
    .ReplaceVendorServicesRepositoryResult
> {
  const vendorId =
    await requireExistingPrismaVendor(
      prisma,
      input.vendorId
    );

  if (
    input.services.length ===
      0
  ) {
    await savePrismaVendorServices(
      prisma,
      vendorId,
      []
    );

    return createEmptyServiceReplacementResult(
      vendorId
    );
  }

  const unsupportedService =
    input.services.find(
      (service) =>
        !isPrismaVendorServiceTypeSupported(
          service.serviceType
        )
    );

  if (unsupportedService) {
    throw createUnsupportedPrismaVendorCapabilityError(
      `serviceType.${unsupportedService.serviceType}`
    );
  }

  const services =
    await savePrismaVendorServices(
      prisma,
      vendorId,
      input.services.map(
        (
          service,
          index
        ): VendorDomain.VendorService => ({
          id:
            service.id ??
            `${vendorId}-service-input-${index + 1}`,

          serviceType:
            service.serviceType,

          title:
            service.title,

          description:
            service.description,

          active:
            service.active,

          createdAt:
            service.createdAt ??
            new Date(),

          updatedAt:
            service.updatedAt ??
            new Date(),
        })
      )
    );

  return {
    vendorId,

    services,

    replacedCount:
      services.length,
  };
}

/**
 * Determines whether one reconstructed service exists.
 */
export async function prismaVendorServiceExists(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  serviceId: string
): Promise<boolean> {
  return Boolean(
    await findPrismaVendorServiceById(
      prisma,
      vendorId,
      serviceId
    )
  );
}

/**
 * Pricing writes are unsupported by the current Prisma schema.
 */
export async function createPrismaVendorPricing(
  _prisma:
    PrismaVendorRepositoryClient,
  _vendorId: string,
  _input:
    VendorRepositoryContracts
      .CreateVendorPricingRepositoryInput
): Promise<
  VendorDomain.VendorPricing
> {
  throw createUnsupportedPrismaVendorCapabilityError(
    "VendorPricing"
  );
}

/**
 * Returns no pricing record because the current schema has no
 * normalized pricing table.
 */
export async function findPrismaVendorPricingById(
  _prisma:
    PrismaVendorRepositoryClient,
  _vendorId: string,
  _pricingId: string
): Promise<
  VendorDomain.VendorPricing |
  null
> {
  return null;
}

/**
 * Returns an empty pricing list for the current schema.
 */
export async function findPrismaVendorPricing(
  _prisma:
    PrismaVendorRepositoryClient,
  _vendorId: string
): Promise<
  VendorDomain.VendorPricing[]
> {
  return [];
}

/**
 * Returns an empty pricing list for one service type.
 */
export async function findPrismaVendorPricingByServiceType(
  _prisma:
    PrismaVendorRepositoryClient,
  _vendorId: string,
  _serviceType:
    VendorServiceType
): Promise<
  VendorDomain.VendorPricing[]
> {
  return [];
}

/**
 * Pricing updates are unsupported by the current schema.
 */
export async function updatePrismaVendorPricing(
  _prisma:
    PrismaVendorRepositoryClient,
  _vendorId: string,
  _pricingId: string,
  _input:
    VendorRepositoryContracts
      .UpdateVendorPricingRepositoryInput
): Promise<
  VendorDomain.VendorPricing |
  null
> {
  throw createUnsupportedPrismaVendorCapabilityError(
    "VendorPricing"
  );
}

/**
 * Pricing deletion has no persisted record to remove.
 */
export async function deletePrismaVendorPricing(
  _prisma:
    PrismaVendorRepositoryClient,
  _vendorId: string,
  _pricingId: string
): Promise<boolean> {
  return false;
}

/**
 * Replaces pricing only when the requested replacement is
 * empty; non-empty writes are rejected explicitly.
 */
export async function replacePrismaVendorPricing(
  _prisma:
    PrismaVendorRepositoryClient,
  input:
    VendorRepositoryContracts
      .ReplaceVendorPricingRepositoryInput
): Promise<
  VendorRepositoryContracts
    .ReplaceVendorPricingRepositoryResult
> {
  if (
    input.pricing.length ===
      0
  ) {
    return createEmptyPricingReplacementResult(
      input.vendorId
    );
  }

  throw createUnsupportedPrismaVendorCapabilityError(
    "VendorPricing"
  );
}

/**
 * Pricing records cannot exist in the current schema.
 */
export async function prismaVendorPricingExists(
  _prisma:
    PrismaVendorRepositoryClient,
  _vendorId: string,
  _pricingId: string
): Promise<boolean> {
  return false;
}

/**
 * ============================================================
 * End of Fresh Prisma Vendor Repository Part D1
 * ============================================================
 */
/**
 * ============================================================
 * Fresh Prisma Vendor Repository
 * Part D2
 * ============================================================
 *
 * Dedicated nested persistence:
 *
 * - VendorVehicle mappings and CRUD
 * - VendorDocument mappings and CRUD
 * - VendorBankAccount mappings and CRUD
 *
 * IMPORTANT
 * ---------
 * This part contains no import declarations.
 * Append it directly after Fresh Part D1.
 * ============================================================
 */

/**
 * Maps the domain vehicle type to Prisma.
 */
export function mapVendorVehicleTypeToPrisma(
  value:
    VendorVehicleType
): PrismaVehicleType {
  switch (value) {
    case VendorVehicleType.PICKUP_TRUCK:
      return PrismaVehicleType.PICKUP;

    case VendorVehicleType.MINI_TRUCK:
      return PrismaVehicleType.MINI_TRUCK;

    case VendorVehicleType.CONTAINER_TRUCK:
      return PrismaVehicleType.CONTAINER;

    case VendorVehicleType.LARGE_TRUCK:
      return PrismaVehicleType.HEAVY_TRUCK;

    case VendorVehicleType.TRAILER:
      return PrismaVehicleType.TRAILER;

    case VendorVehicleType.TWO_WHEELER:
    case VendorVehicleType.THREE_WHEELER:
    case VendorVehicleType.OTHER:
    default:
      return PrismaVehicleType.OTHER;
  }
}

/**
 * Maps the Prisma vehicle type to the domain.
 */
export function mapPrismaVehicleTypeToDomain(
  value:
    PrismaVehicleType
): VendorVehicleType {
  switch (value) {
    case PrismaVehicleType.PICKUP:
    case PrismaVehicleType.TATA_ACE:
    case PrismaVehicleType.BOLERO_PICKUP:
      return VendorVehicleType.PICKUP_TRUCK;

    case PrismaVehicleType.MINI_TRUCK:
    case PrismaVehicleType.LIGHT_TRUCK:
      return VendorVehicleType.MINI_TRUCK;

    case PrismaVehicleType.CONTAINER:
      return VendorVehicleType.CONTAINER_TRUCK;

    case PrismaVehicleType.MEDIUM_TRUCK:
    case PrismaVehicleType.HEAVY_TRUCK:
      return VendorVehicleType.LARGE_TRUCK;

    case PrismaVehicleType.TRAILER:
      return VendorVehicleType.TRAILER;

    case PrismaVehicleType.OTHER:
    default:
      return VendorVehicleType.OTHER;
  }
}

/**
 * Maps the domain vehicle status to Prisma.
 */
export function mapVendorVehicleStatusToPrisma(
  value:
    VendorVehicleStatus
): PrismaVehicleStatus {
  switch (value) {
    case VendorVehicleStatus.ASSIGNED:
      return PrismaVehicleStatus.BOOKED;

    case VendorVehicleStatus.MAINTENANCE:
      return PrismaVehicleStatus.MAINTENANCE;

    case VendorVehicleStatus.INACTIVE:
      return PrismaVehicleStatus.INACTIVE;

    case VendorVehicleStatus.AVAILABLE:
    default:
      return PrismaVehicleStatus.AVAILABLE;
  }
}

/**
 * Maps the Prisma vehicle status to the domain.
 */
export function mapPrismaVehicleStatusToDomain(
  value:
    PrismaVehicleStatus
): VendorVehicleStatus {
  switch (value) {
    case PrismaVehicleStatus.BOOKED:
    case PrismaVehicleStatus.IN_TRANSIT:
      return VendorVehicleStatus.ASSIGNED;

    case PrismaVehicleStatus.MAINTENANCE:
      return VendorVehicleStatus.MAINTENANCE;

    case PrismaVehicleStatus.INACTIVE:
      return VendorVehicleStatus.INACTIVE;

    case PrismaVehicleStatus.AVAILABLE:
    default:
      return VendorVehicleStatus.AVAILABLE;
  }
}

/**
 * Maps one Prisma VendorVehicle record to the domain.
 */
export function mapPrismaVendorVehicleToDomain(
  vehicle:
    PrismaVendorVehicle
): VendorDomain.VendorVehicle {
  return {
    id:
      vehicle.id,

    registrationNumber:
      vehicle.registrationNumber,

    vehicleType:
      mapPrismaVehicleTypeToDomain(
        vehicle.vehicleType
      ),

    manufacturer:
      vehicle.brand ??
      undefined,

    model:
      vehicle.model ??
      undefined,

    manufacturingYear:
      vehicle.manufacturingYear ??
      undefined,

    capacityInKilograms:
      vehicle.carryingCapacityKg ??
      undefined,

    capacityInCubicFeet:
      vehicle.volumeCapacityCft ??
      undefined,

    insuranceNumber:
      vehicle.insuranceNumber ??
      undefined,

    insuranceExpiryDate:
      vehicle.insuranceExpiry ??
      undefined,

    permitNumber:
      vehicle.permitNumber ??
      undefined,

    permitExpiryDate:
      vehicle.permitExpiry ??
      undefined,

    pollutionCertificateExpiryDate:
      vehicle.pollutionExpiry ??
      undefined,

    status:
      mapPrismaVehicleStatusToDomain(
        vehicle.status
      ),

    active:
      vehicle.isActive,

    createdAt:
      new Date(
        vehicle.createdAt
      ),

    updatedAt:
      new Date(
        vehicle.updatedAt
      ),
  };
}

/**
 * Maps vehicle-create input to Prisma.
 */
export function mapVendorVehicleCreateToPrisma(
  vendorId: string,
  input:
    VendorRepositoryContracts
      .CreateVendorVehicleRepositoryInput
): Prisma.VendorVehicleUncheckedCreateInput {
  return {
    id:
      input.id,

    vendorId,

    registrationNumber:
      normalizePrismaVehicleRegistrationNumber(
        input.registrationNumber
      ),

    vehicleType:
      mapVendorVehicleTypeToPrisma(
        input.vehicleType
      ),

    status:
      mapVendorVehicleStatusToPrisma(
        input.status
      ),

    brand:
      normalizeNullablePrismaVendorString(
        input.manufacturer
      ),

    model:
      normalizeNullablePrismaVendorString(
        input.model
      ),

    manufacturingYear:
      input.manufacturingYear,

    carryingCapacityKg:
      input.capacityInKilograms ===
        undefined
        ? undefined
        : Math.round(
            input.capacityInKilograms
          ),

    volumeCapacityCft:
      input.capacityInCubicFeet ===
        undefined
        ? undefined
        : Math.round(
            input.capacityInCubicFeet
          ),

    insuranceNumber:
      normalizeNullablePrismaVendorString(
        input.insuranceNumber
      ),

    insuranceExpiry:
      input.insuranceExpiryDate,

    permitNumber:
      normalizeNullablePrismaVendorString(
        input.permitNumber
      ),

    permitExpiry:
      input.permitExpiryDate,

    pollutionExpiry:
      input.pollutionCertificateExpiryDate,

    isActive:
      input.active,

    createdAt:
      input.createdAt,

    updatedAt:
      input.updatedAt,
  };
}

/**
 * Maps vehicle-update input to Prisma.
 */
export function mapVendorVehicleUpdateToPrisma(
  input:
    VendorRepositoryContracts
      .UpdateVendorVehicleRepositoryInput
): Prisma.VendorVehicleUncheckedUpdateInput {
  const data:
    Prisma.VendorVehicleUncheckedUpdateInput = {};

  if (
    input.registrationNumber !==
      undefined
  ) {
    data.registrationNumber =
      normalizePrismaVehicleRegistrationNumber(
        input.registrationNumber
      );
  }

  if (
    input.vehicleType !==
      undefined
  ) {
    data.vehicleType =
      mapVendorVehicleTypeToPrisma(
        input.vehicleType
      );
  }

  if (
    input.status !==
      undefined
  ) {
    data.status =
      mapVendorVehicleStatusToPrisma(
        input.status
      );
  }

  if (
    input.manufacturer !==
      undefined
  ) {
    data.brand =
      normalizeNullablePrismaVendorString(
        input.manufacturer
      );
  }

  if (
    input.model !==
      undefined
  ) {
    data.model =
      normalizeNullablePrismaVendorString(
        input.model
      );
  }

  if (
    input.manufacturingYear !==
      undefined
  ) {
    data.manufacturingYear =
      input.manufacturingYear;
  }

  if (
    input.capacityInKilograms !==
      undefined
  ) {
    data.carryingCapacityKg =
      Math.round(
        input.capacityInKilograms
      );
  }

  if (
    input.capacityInCubicFeet !==
      undefined
  ) {
    data.volumeCapacityCft =
      Math.round(
        input.capacityInCubicFeet
      );
  }

  if (
    input.insuranceNumber !==
      undefined
  ) {
    data.insuranceNumber =
      normalizeNullablePrismaVendorString(
        input.insuranceNumber
      );
  }

  if (
    input.insuranceExpiryDate !==
      undefined
  ) {
    data.insuranceExpiry =
      input.insuranceExpiryDate;
  }

  if (
    input.permitNumber !==
      undefined
  ) {
    data.permitNumber =
      normalizeNullablePrismaVendorString(
        input.permitNumber
      );
  }

  if (
    input.permitExpiryDate !==
      undefined
  ) {
    data.permitExpiry =
      input.permitExpiryDate;
  }

  if (
    input.pollutionCertificateExpiryDate !==
      undefined
  ) {
    data.pollutionExpiry =
      input.pollutionCertificateExpiryDate;
  }

  if (
    input.active !==
      undefined
  ) {
    data.isActive =
      input.active;
  }

  if (
    input.updatedAt !==
      undefined
  ) {
    data.updatedAt =
      input.updatedAt;
  }

  return data;
}

/**
 * Creates one VendorVehicle.
 */
export async function createPrismaVendorVehicle(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  input:
    VendorRepositoryContracts
      .CreateVendorVehicleRepositoryInput
): Promise<
  VendorDomain.VendorVehicle
> {
  const normalizedVendorId =
    await requireExistingPrismaVendor(
      prisma,
      vendorId
    );

  try {
    const record =
      await prisma.vendorVehicle.create({
        data:
          mapVendorVehicleCreateToPrisma(
            normalizedVendorId,
            input
          ),
      });

    return mapPrismaVendorVehicleToDomain(
      record
    );
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Returns one VendorVehicle by ID.
 */
export async function findPrismaVendorVehicleById(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  vehicleId: string
): Promise<
  VendorDomain.VendorVehicle |
  null
> {
  try {
    const record =
      await prisma.vendorVehicle.findFirst({
        where: {
          id:
            vehicleId.trim(),

          vendorId:
            vendorId.trim(),
        },
      });

    return record
      ? mapPrismaVendorVehicleToDomain(
          record
        )
      : null;
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Returns one VendorVehicle by registration number.
 */
export async function findPrismaVendorVehicleByRegistrationNumber(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  registrationNumber: string
): Promise<
  VendorDomain.VendorVehicle |
  null
> {
  const normalizedRegistrationNumber =
    normalizePrismaVehicleRegistrationNumber(
      registrationNumber
    );

  try {
    const record =
      await prisma.vendorVehicle.findFirst({
        where: {
          vendorId:
            vendorId.trim(),

          registrationNumber:
            normalizedRegistrationNumber,
        },
      });

    return record
      ? mapPrismaVendorVehicleToDomain(
          record
        )
      : null;
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Returns all vehicles belonging to a Vendor.
 */
export async function findPrismaVendorVehicles(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string
): Promise<
  VendorDomain.VendorVehicle[]
> {
  try {
    const records =
      await prisma.vendorVehicle.findMany({
        where: {
          vendorId:
            vendorId.trim(),
        },

        orderBy: {
          createdAt:
            "asc",
        },
      });

    return records.map(
      (record) =>
        mapPrismaVendorVehicleToDomain(
          record
        )
    );
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Updates one VendorVehicle.
 */
export async function updatePrismaVendorVehicle(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  vehicleId: string,
  input:
    VendorRepositoryContracts
      .UpdateVendorVehicleRepositoryInput
): Promise<
  VendorDomain.VendorVehicle |
  null
> {
  const existing =
    await prisma.vendorVehicle.findFirst({
      where: {
        id:
          vehicleId.trim(),

        vendorId:
          vendorId.trim(),
      },

      select: {
        id:
          true,
      },
    });

  if (!existing) {
    return null;
  }

  try {
    const record =
      await prisma.vendorVehicle.update({
        where: {
          id:
            existing.id,
        },

        data:
          mapVendorVehicleUpdateToPrisma(
            input
          ),
      });

    return mapPrismaVendorVehicleToDomain(
      record
    );
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Deletes one VendorVehicle.
 */
export async function deletePrismaVendorVehicle(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  vehicleId: string
): Promise<boolean> {
  try {
    const result =
      await prisma.vendorVehicle.deleteMany({
        where: {
          id:
            vehicleId.trim(),

          vendorId:
            vendorId.trim(),
        },
      });

    return result.count > 0;
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Replaces all vehicles belonging to a Vendor.
 */
export async function replacePrismaVendorVehicles(
  prisma:
    PrismaVendorRepositoryClient,
  input:
    VendorRepositoryContracts
      .ReplaceVendorVehiclesRepositoryInput
): Promise<
  VendorRepositoryContracts
    .ReplaceVendorVehiclesRepositoryResult
> {
  const vendorId =
    await requireExistingPrismaVendor(
      prisma,
      input.vendorId
    );

  try {
    await prisma.vendorVehicle.deleteMany({
      where: {
        vendorId,
      },
    });

    if (
      input.vehicles.length ===
        0
    ) {
      return createEmptyVehicleReplacementResult(
        vendorId
      );
    }

    await prisma.vendorVehicle.createMany({
      data:
        input.vehicles.map(
          (vehicle) =>
            mapVendorVehicleCreateToPrisma(
              vendorId,
              vehicle
            )
        ),
    });

    const vehicles =
      await findPrismaVendorVehicles(
        prisma,
        vendorId
      );

    return {
      vendorId,

      vehicles,

      replacedCount:
        vehicles.length,
    };
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Determines whether one vehicle exists.
 */
export async function prismaVendorVehicleExists(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  vehicleId: string
): Promise<boolean> {
  return Boolean(
    await findPrismaVendorVehicleById(
      prisma,
      vendorId,
      vehicleId
    )
  );
}

/**
 * Determines whether a registration number already exists.
 */
export async function prismaVendorVehicleRegistrationExists(
  prisma:
    PrismaVendorRepositoryClient,
  registrationNumber: string,
  excludeVehicleId?: string
): Promise<boolean> {
  const normalizedRegistrationNumber =
    normalizePrismaVehicleRegistrationNumber(
      registrationNumber
    );

  if (!normalizedRegistrationNumber) {
    return false;
  }

  try {
    const record =
      await prisma.vendorVehicle.findFirst({
        where: {
          registrationNumber:
            normalizedRegistrationNumber,

          ...(excludeVehicleId
            ? {
                id: {
                  not:
                    excludeVehicleId.trim(),
                },
              }
            : {}),
        },

        select: {
          id:
            true,
        },
      });

    return Boolean(record);
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Maps the domain document type to Prisma.
 */
export function mapVendorDocumentTypeToPrisma(
  value:
    VendorDocumentType
): PrismaVendorDocumentType {
  switch (value) {
    case VendorDocumentType.GST_CERTIFICATE:
      return PrismaVendorDocumentType.GST;

    case VendorDocumentType.PAN_CARD:
      return PrismaVendorDocumentType.PAN;

    case VendorDocumentType.AADHAAR_CARD:
      return PrismaVendorDocumentType.AADHAAR;

    case VendorDocumentType.BUSINESS_REGISTRATION:
      return PrismaVendorDocumentType.COMPANY_REGISTRATION;

    case VendorDocumentType.SHOP_ESTABLISHMENT:
      return PrismaVendorDocumentType.TRADE_LICENSE;

    case VendorDocumentType.INSURANCE_POLICY:
      return PrismaVendorDocumentType.VEHICLE_INSURANCE;

    case VendorDocumentType.CANCELLED_CHEQUE:
      return PrismaVendorDocumentType.BANK_CANCELLED_CHEQUE;

    case VendorDocumentType.VEHICLE_REGISTRATION:
      return PrismaVendorDocumentType.VEHICLE_RC;

    case VendorDocumentType.DRIVING_LICENSE:
      return PrismaVendorDocumentType.DRIVING_LICENSE;

    case VendorDocumentType.POLICE_VERIFICATION:
    case VendorDocumentType.BANK_STATEMENT:
    case VendorDocumentType.OTHER:
    default:
      return PrismaVendorDocumentType.OTHER;
  }
}

/**
 * Maps the Prisma document type to the domain.
 */
export function mapPrismaDocumentTypeToDomain(
  value:
    PrismaVendorDocumentType
): VendorDocumentType {
  switch (value) {
    case PrismaVendorDocumentType.GST:
      return VendorDocumentType.GST_CERTIFICATE;

    case PrismaVendorDocumentType.PAN:
      return VendorDocumentType.PAN_CARD;

    case PrismaVendorDocumentType.AADHAAR:
      return VendorDocumentType.AADHAAR_CARD;

    case PrismaVendorDocumentType.COMPANY_REGISTRATION:
    case PrismaVendorDocumentType.MSME_CERTIFICATE:
      return VendorDocumentType.BUSINESS_REGISTRATION;

    case PrismaVendorDocumentType.TRADE_LICENSE:
      return VendorDocumentType.SHOP_ESTABLISHMENT;

    case PrismaVendorDocumentType.VEHICLE_INSURANCE:
      return VendorDocumentType.INSURANCE_POLICY;

    case PrismaVendorDocumentType.BANK_CANCELLED_CHEQUE:
      return VendorDocumentType.CANCELLED_CHEQUE;

    case PrismaVendorDocumentType.VEHICLE_RC:
      return VendorDocumentType.VEHICLE_REGISTRATION;

    case PrismaVendorDocumentType.DRIVING_LICENSE:
      return VendorDocumentType.DRIVING_LICENSE;

    case PrismaVendorDocumentType.GOODS_CARRIER_PERMIT:
    case PrismaVendorDocumentType.ISO_CERTIFICATE:
    case PrismaVendorDocumentType.OTHER:
    default:
      return VendorDocumentType.OTHER;
  }
}

/**
 * Maps the domain document status to Prisma.
 */
export function mapVendorDocumentStatusToPrisma(
  value:
    VendorDocumentStatus
): PrismaVerificationStatus {
  switch (value) {
    case VendorDocumentStatus.VERIFIED:
      return PrismaVerificationStatus.VERIFIED;

    case VendorDocumentStatus.REJECTED:
    case VendorDocumentStatus.EXPIRED:
      return PrismaVerificationStatus.REJECTED;

    case VendorDocumentStatus.PENDING:
    default:
      return PrismaVerificationStatus.PENDING;
  }
}

/**
 * Maps the Prisma verification state to the domain.
 */
export function mapPrismaDocumentStatusToDomain(
  value:
    PrismaVerificationStatus,
  expiryDate:
    Date | null
): VendorDocumentStatus {
  if (
    expiryDate &&
    expiryDate.getTime() <
      Date.now()
  ) {
    return VendorDocumentStatus.EXPIRED;
  }

  switch (value) {
    case PrismaVerificationStatus.VERIFIED:
      return VendorDocumentStatus.VERIFIED;

    case PrismaVerificationStatus.REJECTED:
      return VendorDocumentStatus.REJECTED;

    case PrismaVerificationStatus.PENDING:
    default:
      return VendorDocumentStatus.PENDING;
  }
}

/**
 * Maps one Prisma VendorDocument record to the domain.
 */
export function mapPrismaVendorDocumentToDomain(
  document:
    PrismaVendorDocument
): VendorDomain.VendorDocument {
  return {
    id:
      document.id,

    documentType:
      mapPrismaDocumentTypeToDomain(
        document.documentType
      ),

    documentNumber:
      document.documentNumber ??
      undefined,

    documentUrl:
      document.fileUrl,

    fileName:
      document.fileName,

    mimeType:
      document.mimeType ??
      undefined,

    status:
      mapPrismaDocumentStatusToDomain(
        document.verificationStatus,
        document.expiryDate
      ),

    issuedAt:
      document.issuedDate ??
      undefined,

    expiresAt:
      document.expiryDate ??
      undefined,

    rejectionReason:
      document.rejectionReason ??
      undefined,

    verifiedAt:
      document.verifiedAt ??
      undefined,

    verifiedBy:
      document.verifiedBy ??
      undefined,

    createdAt:
      new Date(
        document.createdAt
      ),

    updatedAt:
      new Date(
        document.updatedAt
      ),
  };
}

/**
 * Resolves a required file name from explicit input or URL.
 */
export function resolvePrismaVendorDocumentFileName(
  fileName:
    string | undefined,
  documentUrl: string
): string {
  const explicit =
    normalizeOptionalPrismaVendorString(
      fileName
    );

  if (explicit) {
    return explicit;
  }

  try {
    const url =
      new URL(
        documentUrl
      );

    return (
      normalizeOptionalPrismaVendorString(
        url.pathname
          .split("/")
          .filter(Boolean)
          .at(-1)
      ) ??
      "vendor-document"
    );
  } catch {
    return "vendor-document";
  }
}

/**
 * Maps document-create input to Prisma.
 */
export function mapVendorDocumentCreateToPrisma(
  vendorId: string,
  input:
    VendorRepositoryContracts
      .CreateVendorDocumentRepositoryInput
): Prisma.VendorDocumentUncheckedCreateInput {
  return {
    id:
      input.id,

    vendorId,

    documentType:
      mapVendorDocumentTypeToPrisma(
        input.documentType
      ),

    documentNumber:
      normalizeNullablePrismaVendorString(
        input.documentNumber
      ),

    fileName:
      resolvePrismaVendorDocumentFileName(
        input.fileName,
        input.documentUrl
      ),

    fileUrl:
      input.documentUrl,

    mimeType:
      normalizeNullablePrismaVendorString(
        input.mimeType
      ),

    issuedDate:
      input.issuedAt,

    expiryDate:
      input.expiresAt,

    verificationStatus:
      mapVendorDocumentStatusToPrisma(
        input.status ??
        VendorDocumentStatus.PENDING
      ),

    verifiedBy:
      normalizeNullablePrismaVendorString(
        input.verifiedBy
      ),

    verifiedAt:
      input.verifiedAt,

    rejectionReason:
      normalizeNullablePrismaVendorString(
        input.rejectionReason
      ),

    createdAt:
      input.createdAt,

    updatedAt:
      input.updatedAt,
  };
}

/**
 * Maps document-update input to Prisma.
 */
export function mapVendorDocumentUpdateToPrisma(
  input:
    VendorRepositoryContracts
      .UpdateVendorDocumentRepositoryInput
): Prisma.VendorDocumentUncheckedUpdateInput {
  const data:
    Prisma.VendorDocumentUncheckedUpdateInput = {};

  if (
    input.documentType !==
      undefined
  ) {
    data.documentType =
      mapVendorDocumentTypeToPrisma(
        input.documentType
      );
  }

  if (
    input.documentNumber !==
      undefined
  ) {
    data.documentNumber =
      normalizeNullablePrismaVendorString(
        input.documentNumber
      );
  }

  if (
    input.documentUrl !==
      undefined
  ) {
    data.fileUrl =
      input.documentUrl;
  }

  if (
    input.fileName !==
      undefined
  ) {
    data.fileName =
      input.fileName;
  }

  if (
    input.mimeType !==
      undefined
  ) {
    data.mimeType =
      normalizeNullablePrismaVendorString(
        input.mimeType
      );
  }

  if (
    input.status !==
      undefined
  ) {
    data.verificationStatus =
      mapVendorDocumentStatusToPrisma(
        input.status
      );
  }

  if (
    input.issuedAt !==
      undefined
  ) {
    data.issuedDate =
      input.issuedAt;
  }

  if (
    input.expiresAt !==
      undefined
  ) {
    data.expiryDate =
      input.expiresAt;
  }

  if (
    input.rejectionReason !==
      undefined
  ) {
    data.rejectionReason =
      normalizeNullablePrismaVendorString(
        input.rejectionReason
      );
  }

  if (
    input.verifiedAt !==
      undefined
  ) {
    data.verifiedAt =
      input.verifiedAt;
  }

  if (
    input.verifiedBy !==
      undefined
  ) {
    data.verifiedBy =
      normalizeNullablePrismaVendorString(
        input.verifiedBy
      );
  }

  if (
    input.updatedAt !==
      undefined
  ) {
    data.updatedAt =
      input.updatedAt;
  }

  return data;
}

/**
 * Creates one VendorDocument.
 */
export async function createPrismaVendorDocument(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  input:
    VendorRepositoryContracts
      .CreateVendorDocumentRepositoryInput
): Promise<
  VendorDomain.VendorDocument
> {
  const normalizedVendorId =
    await requireExistingPrismaVendor(
      prisma,
      vendorId
    );

  try {
    const record =
      await prisma.vendorDocument.create({
        data:
          mapVendorDocumentCreateToPrisma(
            normalizedVendorId,
            input
          ),
      });

    return mapPrismaVendorDocumentToDomain(
      record
    );
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Returns one VendorDocument by ID.
 */
export async function findPrismaVendorDocumentById(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  documentId: string
): Promise<
  VendorDomain.VendorDocument |
  null
> {
  try {
    const record =
      await prisma.vendorDocument.findFirst({
        where: {
          id:
            documentId.trim(),

          vendorId:
            vendorId.trim(),
        },
      });

    return record
      ? mapPrismaVendorDocumentToDomain(
          record
        )
      : null;
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Returns all VendorDocument records.
 */
export async function findPrismaVendorDocuments(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string
): Promise<
  VendorDomain.VendorDocument[]
> {
  try {
    const records =
      await prisma.vendorDocument.findMany({
        where: {
          vendorId:
            vendorId.trim(),
        },

        orderBy: {
          createdAt:
            "asc",
        },
      });

    return records.map(
      (record) =>
        mapPrismaVendorDocumentToDomain(
          record
        )
    );
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Returns VendorDocument records by domain type.
 */
export async function findPrismaVendorDocumentsByType(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  documentType:
    VendorDocumentType
): Promise<
  VendorDomain.VendorDocument[]
> {
  try {
    const records =
      await prisma.vendorDocument.findMany({
        where: {
          vendorId:
            vendorId.trim(),

          documentType:
            mapVendorDocumentTypeToPrisma(
              documentType
            ),
        },

        orderBy: {
          createdAt:
            "asc",
        },
      });

    return records.map(
      (record) =>
        mapPrismaVendorDocumentToDomain(
          record
        )
    );
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Returns VendorDocument records by domain status.
 */
export async function findPrismaVendorDocumentsByStatus(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  status:
    VendorDocumentStatus
): Promise<
  VendorDomain.VendorDocument[]
> {
  try {
    const records =
      await prisma.vendorDocument.findMany({
        where: {
          vendorId:
            vendorId.trim(),

          verificationStatus:
            mapVendorDocumentStatusToPrisma(
              status
            ),
        },

        orderBy: {
          createdAt:
            "asc",
        },
      });

    return records
      .map(
        (record) =>
          mapPrismaVendorDocumentToDomain(
            record
          )
      )
      .filter(
        (document) =>
          document.status ===
          status
      );
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Updates one VendorDocument.
 */
export async function updatePrismaVendorDocument(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  documentId: string,
  input:
    VendorRepositoryContracts
      .UpdateVendorDocumentRepositoryInput
): Promise<
  VendorDomain.VendorDocument |
  null
> {
  const existing =
    await prisma.vendorDocument.findFirst({
      where: {
        id:
          documentId.trim(),

        vendorId:
          vendorId.trim(),
      },

      select: {
        id:
          true,
      },
    });

  if (!existing) {
    return null;
  }

  try {
    const record =
      await prisma.vendorDocument.update({
        where: {
          id:
            existing.id,
        },

        data:
          mapVendorDocumentUpdateToPrisma(
            input
          ),
      });

    return mapPrismaVendorDocumentToDomain(
      record
    );
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Reviews one VendorDocument.
 */
export async function reviewPrismaVendorDocument(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  documentId: string,
  input:
    VendorRepositoryContracts
      .ReviewVendorDocumentRepositoryInput
): Promise<
  VendorDomain.VendorDocument |
  null
> {
  return updatePrismaVendorDocument(
    prisma,
    vendorId,
    documentId,
    {
      status:
        input.status,

      rejectionReason:
        input.rejectionReason,

      verifiedAt:
        input.verifiedAt ??
        new Date(),

      verifiedBy:
        input.verifiedBy,

      updatedAt:
        input.updatedAt ??
        new Date(),
    }
  );
}

/**
 * Deletes one VendorDocument.
 */
export async function deletePrismaVendorDocument(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  documentId: string
): Promise<boolean> {
  try {
    const result =
      await prisma.vendorDocument.deleteMany({
        where: {
          id:
            documentId.trim(),

          vendorId:
            vendorId.trim(),
        },
      });

    return result.count > 0;
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Replaces all VendorDocument records.
 */
export async function replacePrismaVendorDocuments(
  prisma:
    PrismaVendorRepositoryClient,
  input:
    VendorRepositoryContracts
      .ReplaceVendorDocumentsRepositoryInput
): Promise<
  VendorRepositoryContracts
    .ReplaceVendorDocumentsRepositoryResult
> {
  const vendorId =
    await requireExistingPrismaVendor(
      prisma,
      input.vendorId
    );

  try {
    await prisma.vendorDocument.deleteMany({
      where: {
        vendorId,
      },
    });

    if (
      input.documents.length ===
        0
    ) {
      return createEmptyDocumentReplacementResult(
        vendorId
      );
    }

    await prisma.vendorDocument.createMany({
      data:
        input.documents.map(
          (document) =>
            mapVendorDocumentCreateToPrisma(
              vendorId,
              document
            )
        ),
    });

    const documents =
      await findPrismaVendorDocuments(
        prisma,
        vendorId
      );

    return {
      vendorId,

      documents,

      replacedCount:
        documents.length,
    };
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Determines whether one document exists.
 */
export async function prismaVendorDocumentExists(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  documentId: string
): Promise<boolean> {
  return Boolean(
    await findPrismaVendorDocumentById(
      prisma,
      vendorId,
      documentId
    )
  );
}

/**
 * Maps the Prisma bank-account type to the domain.
 */
export function mapPrismaBankAccountTypeToDomain(
  value:
    PrismaBankAccountType
): VendorBankAccountType {
  return value ===
    PrismaBankAccountType.SAVINGS
    ? VendorBankAccountType.SAVINGS
    : VendorBankAccountType.CURRENT;
}

/**
 * Maps the domain bank-account type to Prisma.
 */
export function mapVendorBankAccountTypeToPrisma(
  value:
    VendorBankAccountType
): PrismaBankAccountType {
  return value ===
    VendorBankAccountType.SAVINGS
    ? PrismaBankAccountType.SAVINGS
    : PrismaBankAccountType.CURRENT;
}

/**
 * Maps one Prisma VendorBankAccount record to the domain.
 */
export function mapPrismaVendorBankDetailsToDomain(
  account:
    PrismaVendorBankAccount
): VendorDomain.VendorBankDetails {
  return {
    accountHolderName:
      account.accountHolderName,

    bankName:
      account.bankName,

    accountNumber:
      account.accountNumber,

    accountType:
      mapPrismaBankAccountTypeToDomain(
        account.accountType
      ),

    ifscCode:
      account.ifscCode,

    branchName:
      account.branchName ??
      undefined,

    upiId:
      account.upiId ??
      undefined,

    verified:
      account.verified,

    verifiedAt:
      account.verifiedAt ??
      undefined,
  };
}

/**
 * Returns the primary active Vendor bank account.
 */
export async function findPrismaVendorBankDetails(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string
): Promise<
  VendorDomain.VendorBankDetails |
  null
> {
  try {
    const account =
      await prisma.vendorBankAccount.findFirst({
        where: {
          vendorId:
            vendorId.trim(),

          isActive:
            true,
        },

        orderBy: [
          {
            isPrimary:
              "desc",
          },
          {
            createdAt:
              "asc",
          },
        ],
      });

    return account
      ? mapPrismaVendorBankDetailsToDomain(
          account
        )
      : null;
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Creates or replaces the primary Vendor bank account.
 */
export async function upsertPrismaVendorBankDetails(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  input:
    VendorRepositoryContracts
      .UpsertVendorBankDetailsRepositoryInput
): Promise<
  VendorDomain.VendorBankDetails
> {
  const normalizedVendorId =
    await requireExistingPrismaVendor(
      prisma,
      vendorId
    );

  const existing =
    await prisma.vendorBankAccount.findFirst({
      where: {
        vendorId:
          normalizedVendorId,

        isPrimary:
          true,
      },

      select: {
        id:
          true,
      },
    });

  const data = {
    accountHolderName:
      input.accountHolderName,

    bankName:
      input.bankName,

    branchName:
      input.branchName ??
      null,

    accountNumber:
      normalizePrismaVendorBankAccountNumber(
        input.accountNumber
      ),

    ifscCode:
      input.ifscCode
        .trim()
        .toUpperCase(),

    upiId:
      input.upiId ??
      null,

    accountType:
      mapVendorBankAccountTypeToPrisma(
        input.accountType
      ),

    verified:
      input.verified ??
      false,

    verifiedAt:
      input.verifiedAt ??
      null,

    isPrimary:
      true,

    isActive:
      true,
  };

  try {
    const account =
      existing
        ? await prisma.vendorBankAccount.update({
            where: {
              id:
                existing.id,
            },

            data,
          })
        : await prisma.vendorBankAccount.create({
            data: {
              ...data,

              vendorId:
                normalizedVendorId,
            },
          });

    return mapPrismaVendorBankDetailsToDomain(
      account
    );
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Updates bank-detail verification state.
 */
export async function verifyPrismaVendorBankDetails(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string,
  input:
    VendorRepositoryContracts
      .VerifyVendorBankDetailsRepositoryInput
): Promise<
  VendorDomain.VendorBankDetails |
  null
> {
  const existing =
    await prisma.vendorBankAccount.findFirst({
      where: {
        vendorId:
          vendorId.trim(),

        isPrimary:
          true,

        isActive:
          true,
      },

      select: {
        id:
          true,
      },
    });

  if (!existing) {
    return null;
  }

  try {
    const account =
      await prisma.vendorBankAccount.update({
        where: {
          id:
            existing.id,
        },

        data: {
          verified:
            input.verified,

          verifiedAt:
            input.verified
              ? input.verifiedAt ??
                new Date()
              : null,
        },
      });

    return mapPrismaVendorBankDetailsToDomain(
      account
    );
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Deletes all bank accounts belonging to a Vendor.
 */
export async function deletePrismaVendorBankDetails(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string
): Promise<
  VendorRepositoryContracts
    .DeleteVendorBankDetailsRepositoryResult
> {
  const normalizedVendorId =
    requirePrismaVendorIdentifier(
      vendorId,
      "vendorId"
    );

  try {
    const result =
      await prisma.vendorBankAccount.deleteMany({
        where: {
          vendorId:
            normalizedVendorId,
        },
      });

    return {
      vendorId:
        normalizedVendorId,

      deleted:
        result.count > 0,
    };
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Determines whether Vendor bank details exist.
 */
export async function prismaVendorBankDetailsExist(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string
): Promise<boolean> {
  try {
    const count =
      await prisma.vendorBankAccount.count({
        where: {
          vendorId:
            vendorId.trim(),

          isActive:
            true,
        },
      });

    return count > 0;
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Determines whether an account number belongs to another
 * Vendor.
 */
export async function prismaVendorBankAccountExists(
  prisma:
    PrismaVendorRepositoryClient,
  accountNumber: string,
  excludeVendorId?: string
): Promise<boolean> {
  const normalizedAccountNumber =
    normalizePrismaVendorBankAccountNumber(
      accountNumber
    );

  if (!normalizedAccountNumber) {
    return false;
  }

  try {
    const account =
      await prisma.vendorBankAccount.findFirst({
        where: {
          accountNumber:
            normalizedAccountNumber,

          ...(excludeVendorId
            ? {
                vendorId: {
                  not:
                    excludeVendorId.trim(),
                },
              }
            : {}),
        },

        select: {
          id:
            true,
        },
      });

    return Boolean(account);
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Determines whether a UPI ID belongs to another Vendor.
 */
export async function prismaVendorUpiIdExists(
  prisma:
    PrismaVendorRepositoryClient,
  upiId: string,
  excludeVendorId?: string
): Promise<boolean> {
  const normalizedUpiId =
    normalizePrismaVendorString(
      upiId
    ).toLowerCase();

  if (!normalizedUpiId) {
    return false;
  }

  try {
    const account =
      await prisma.vendorBankAccount.findFirst({
        where: {
          upiId: {
            equals:
              normalizedUpiId,

            mode:
              "insensitive",
          },

          ...(excludeVendorId
            ? {
                vendorId: {
                  not:
                    excludeVendorId.trim(),
                },
              }
            : {}),
        },

        select: {
          id:
            true,
        },
      });

    return Boolean(account);
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * ============================================================
 * End of Fresh Prisma Vendor Repository Part D2
 * ============================================================
 */
/**
 * ============================================================
 * Fresh Prisma Vendor Repository
 * Final Part E
 * ============================================================
 *
 * Final composition:
 *
 * - Aggregate hydration
 * - Bulk operations
 * - Health check
 * - Repository class
 * - Transaction managers
 * - Repository factories
 * - Compatibility module factory
 *
 * IMPORTANT
 * ---------
 * This part contains no import declarations.
 * Append it directly after Fresh Part D2.
 * ============================================================
 */

/**
 * Hydrates separately persisted vehicles, documents and bank
 * details into one base Vendor aggregate.
 */
export async function hydratePrismaVendorAggregate(
  prisma:
    PrismaVendorRepositoryClient,
  aggregate:
    VendorMapperTypes.VendorAggregate
): Promise<
  VendorMapperTypes.VendorAggregate
> {
  const [
    vehicles,
    documents,
    bankDetails,
  ] = await Promise.all([
    findPrismaVendorVehicles(
      prisma,
      aggregate.id
    ),

    findPrismaVendorDocuments(
      prisma,
      aggregate.id
    ),

    findPrismaVendorBankDetails(
      prisma,
      aggregate.id
    ),
  ]);

  return {
    ...aggregate,

    vehicles,

    documents,

    bankDetails:
      bankDetails ??
      undefined,
  };
}

/**
 * Finds and hydrates one Vendor by internal ID.
 */
export async function findHydratedPrismaVendorById(
  prisma:
    PrismaVendorRepositoryClient,
  vendorId: string
): Promise<
  VendorMapperTypes.VendorAggregate |
  null
> {
  const aggregate =
    await findPrismaVendorById(
      prisma,
      vendorId
    );

  return aggregate
    ? hydratePrismaVendorAggregate(
        prisma,
        aggregate
      )
    : null;
}

/**
 * Finds and hydrates one Vendor by public code.
 */
export async function findHydratedPrismaVendorByCode(
  prisma:
    PrismaVendorRepositoryClient,
  vendorCode: string
): Promise<
  VendorMapperTypes.VendorAggregate |
  null
> {
  const aggregate =
    await findPrismaVendorByCode(
      prisma,
      vendorCode
    );

  return aggregate
    ? hydratePrismaVendorAggregate(
        prisma,
        aggregate
      )
    : null;
}

/**
 * Finds and hydrates one Vendor by email.
 */
export async function findHydratedPrismaVendorByEmail(
  prisma:
    PrismaVendorRepositoryClient,
  email: string
): Promise<
  VendorMapperTypes.VendorAggregate |
  null
> {
  const aggregate =
    await findPrismaVendorByEmail(
      prisma,
      email
    );

  return aggregate
    ? hydratePrismaVendorAggregate(
        prisma,
        aggregate
      )
    : null;
}

/**
 * Finds and hydrates one Vendor by phone.
 */
export async function findHydratedPrismaVendorByPhone(
  prisma:
    PrismaVendorRepositoryClient,
  phone: string
): Promise<
  VendorMapperTypes.VendorAggregate |
  null
> {
  const aggregate =
    await findPrismaVendorByPhone(
      prisma,
      phone
    );

  return aggregate
    ? hydratePrismaVendorAggregate(
        prisma,
        aggregate
      )
    : null;
}

/**
 * Returns multiple Vendors and reports missing IDs.
 */
export async function findPrismaVendorsByIds(
  prisma:
    PrismaVendorRepositoryClient,
  vendorIds: string[]
): Promise<
  VendorRepositoryContracts
    .VendorRepositoryBulkLookupResult
> {
  const normalizedIds =
    normalizeVendorRepositoryIds(
      vendorIds
    );

  if (
    normalizedIds.length ===
      0
  ) {
    return createEmptyVendorBulkLookupResult();
  }

  try {
    const records =
      await prisma.vendor.findMany({
        where: {
          id: {
            in:
              normalizedIds,
          },
        },
      });

    const vendors =
      await Promise.all(
        records.map(
          (record) =>
            hydratePrismaVendorAggregate(
              prisma,
              mapPrismaVendorToAggregate(
                record
              )
            )
        )
      );

    const foundIds =
      new Set(
        vendors.map(
          (vendor) =>
            vendor.id
        )
      );

    return {
      vendors,

      missingVendorIds:
        normalizedIds.filter(
          (vendorId) =>
            !foundIds.has(
              vendorId
            )
        ),
    };
  } catch (error) {
    throw normalizePrismaVendorRepositoryError(
      error
    );
  }
}

/**
 * Converts one unknown bulk error into a repository failure.
 */
export function createPrismaVendorBulkFailure(
  vendorId: string,
  error: unknown
): VendorRepositoryContracts
  .VendorRepositoryBulkFailure {
  const repositoryError =
    normalizePrismaVendorRepositoryError(
      error
    );

  return {
    vendorId,

    errorCode:
      repositoryError.code,

    errorMessage:
      repositoryError.message,
  };
}

/**
 * Updates active status for multiple Vendors.
 */
export async function updatePrismaVendorStatuses(
  prisma:
    PrismaVendorRepositoryClient,
  input:
    VendorRepositoryContracts
      .BulkVendorStatusUpdateRepositoryInput
): Promise<
  VendorRepositoryContracts
    .BulkVendorStatusUpdateRepositoryResult
> {
  if (
    input.vendors.length ===
      0
  ) {
    return createEmptyVendorStatusUpdateResult();
  }

  const result:
    VendorRepositoryContracts
      .BulkVendorStatusUpdateRepositoryResult = {
    requestedCount:
      input.vendors.length,

    updatedCount:
      0,

    failedCount:
      0,

    updatedVendorIds:
      [],

    failures:
      [],
  };

  for (
    const item
    of input.vendors
  ) {
    const vendorId =
      normalizePrismaVendorString(
        item.vendorId
      );

    if (!vendorId) {
      result.failures.push({
        vendorId:
          item.vendorId,

        errorCode:
          "INVALID_REPOSITORY_INPUT",

        errorMessage:
          "Vendor ID is required.",
      });

      continue;
    }

    try {
      const updateResult =
        await prisma.vendor.updateMany({
          where: {
            id:
              vendorId,
          },

          data: {
            status:
              mapVendorActiveToPrismaStatus(
                item.active
              ),
          },
        });

      if (
        updateResult.count ===
          0
      ) {
        result.failures.push({
          vendorId,

          errorCode:
            "VENDOR_NOT_FOUND",

          errorMessage:
            "Vendor was not found.",
        });
      } else {
        result.updatedVendorIds.push(
          vendorId
        );
      }
    } catch (error) {
      result.failures.push(
        createPrismaVendorBulkFailure(
          vendorId,
          error
        )
      );
    }
  }

  result.updatedCount =
    result.updatedVendorIds.length;

  result.failedCount =
    result.failures.length;

  return result;
}

/**
 * Deletes multiple Vendors.
 *
 * Soft deletion is unsupported by the current Prisma model.
 */
export async function deleteManyPrismaVendors(
  prisma:
    PrismaVendorRepositoryClient,
  input:
    VendorRepositoryContracts
      .BulkDeleteVendorsRepositoryInput
): Promise<
  VendorRepositoryContracts
    .BulkDeleteVendorsRepositoryResult
> {
  const vendorIds =
    normalizeVendorRepositoryIds(
      input.vendorIds
    );

  if (
    vendorIds.length ===
      0
  ) {
    return createEmptyVendorBulkDeleteResult();
  }

  if (
    input.softDelete ===
      true
  ) {
    throw createUnsupportedPrismaVendorCapabilityError(
      "VendorSoftDelete"
    );
  }

  const result:
    VendorRepositoryContracts
      .BulkDeleteVendorsRepositoryResult = {
    requestedCount:
      vendorIds.length,

    deletedCount:
      0,

    failedCount:
      0,

    deletedVendorIds:
      [],

    failures:
      [],
  };

  for (
    const vendorId
    of vendorIds
  ) {
    try {
      const deletion =
        await deletePrismaVendorRecord(
          prisma,
          vendorId
        );

      if (
        deletion.deleted
      ) {
        result.deletedVendorIds.push(
          vendorId
        );
      } else {
        result.failures.push({
          vendorId,

          errorCode:
            "VENDOR_NOT_FOUND",

          errorMessage:
            "Vendor was not found.",
        });
      }
    } catch (error) {
      result.failures.push(
        createPrismaVendorBulkFailure(
          vendorId,
          error
        )
      );
    }
  }

  result.deletedCount =
    result.deletedVendorIds.length;

  result.failedCount =
    result.failures.length;

  return result;
}

/**
 * Checks database availability for the Vendor repository.
 */
export async function checkPrismaVendorRepositoryHealth(
  prisma:
    PrismaVendorRepositoryClient
): Promise<
  VendorRepositoryContracts
    .VendorRepositoryHealthResult
> {
  const startedAt =
    Date.now();

  try {
    await prisma.vendor.count();

    return createHealthyVendorRepositoryResult(
      Date.now() -
        startedAt
    );
  } catch (error) {
    return createUnhealthyVendorRepositoryResult(
      error instanceof Error
        ? error.message
        : "The Vendor repository health check failed.",

      Date.now() -
        startedAt
    );
  }
}

/**
 * Complete Prisma implementation of VendorRepositoryPort.
 */
export class PrismaVendorRepository
  implements
    VendorRepositoryContracts
      .VendorRepositoryPort {
  constructor(
    private readonly prisma:
      PrismaVendorRepositoryClient
  ) {}

  async create(
    input:
      VendorRepositoryContracts
        .CreateVendorRepositoryInput
  ): Promise<
    VendorMapperTypes.VendorAggregate
  > {
    const aggregate =
      await createPrismaVendorRecord(
        this.prisma,
        input
      );

    if (
      input.vehicles.length >
        0
    ) {
      await replacePrismaVendorVehicles(
        this.prisma,
        {
          vendorId:
            aggregate.id,

          vehicles:
            input.vehicles,
        }
      );
    }

    if (
      input.documents.length >
        0
    ) {
      await replacePrismaVendorDocuments(
        this.prisma,
        {
          vendorId:
            aggregate.id,

          documents:
            input.documents,
        }
      );
    }

    if (
      input.bankDetails
    ) {
      await upsertPrismaVendorBankDetails(
        this.prisma,
        aggregate.id,
        input.bankDetails
      );
    }

    return (
      await findHydratedPrismaVendorById(
        this.prisma,
        aggregate.id
      )
    ) ??
      aggregate;
  }

  findById(
    vendorId: string
  ): Promise<
    VendorMapperTypes.VendorAggregate |
    null
  > {
    return findHydratedPrismaVendorById(
      this.prisma,
      vendorId
    );
  }

  findByVendorCode(
    vendorCode: string
  ): Promise<
    VendorMapperTypes.VendorAggregate |
    null
  > {
    return findHydratedPrismaVendorByCode(
      this.prisma,
      vendorCode
    );
  }

  findByEmail(
    email: string
  ): Promise<
    VendorMapperTypes.VendorAggregate |
    null
  > {
    return findHydratedPrismaVendorByEmail(
      this.prisma,
      email
    );
  }

  findByPhone(
    phone: string
  ): Promise<
    VendorMapperTypes.VendorAggregate |
    null
  > {
    return findHydratedPrismaVendorByPhone(
      this.prisma,
      phone
    );
  }

  async findMany(
    query?:
      VendorRepositoryContracts
        .VendorRepositoryListQuery
  ): Promise<
    VendorRepositoryContracts
      .VendorRepositoryPage<
        VendorMapperTypes
          .VendorAggregate
      >
  > {
    const page =
      await findManyPrismaVendors(
        this.prisma,
        query
      );

    return {
      ...page,

      items:
        await Promise.all(
          page.items.map(
            (aggregate) =>
              hydratePrismaVendorAggregate(
                this.prisma,
                aggregate
              )
          )
        ),
    };
  }

  findSummaries(
    query?:
      VendorRepositoryContracts
        .VendorRepositoryListQuery
  ): Promise<
    VendorRepositoryContracts
      .VendorRepositoryPage<
        VendorMapperTypes
          .VendorAggregateSummary
      >
  > {
    return findPrismaVendorSummaries(
      this.prisma,
      query
    );
  }

  async update(
    vendorId: string,
    input:
      VendorRepositoryContracts
        .UpdateVendorRepositoryInput
  ): Promise<
    VendorMapperTypes.VendorAggregate |
    null
  > {
    const updated =
      await updatePrismaVendorRecord(
        this.prisma,
        vendorId,
        input
      );

    return updated
      ? hydratePrismaVendorAggregate(
          this.prisma,
          updated
        )
      : null;
  }

  delete(
    vendorId: string
  ): Promise<
    VendorRepositoryContracts
      .VendorRepositoryDeleteResult
  > {
    return deletePrismaVendorRecord(
      this.prisma,
      vendorId
    );
  }

  exists(
    vendorId: string
  ): Promise<boolean> {
    return prismaVendorExists(
      this.prisma,
      vendorId
    );
  }

  checkUniqueness(
    query:
      VendorRepositoryContracts
        .VendorRepositoryUniquenessQuery
  ): Promise<
    VendorRepositoryContracts
      .VendorRepositoryUniquenessResult
  > {
    return checkPrismaVendorUniqueness(
      this.prisma,
      query
    );
  }

  getStatistics():
    Promise<
      VendorRepositoryContracts
        .VendorRepositoryStatistics
    > {
    return getPrismaVendorStatistics(
      this.prisma
    );
  }

  createServiceArea(
    vendorId: string,
    input:
      VendorRepositoryContracts
        .CreateVendorServiceAreaRepositoryInput
  ): Promise<
    VendorDomain.VendorServiceArea
  > {
    return createPrismaVendorServiceArea(
      this.prisma,
      vendorId,
      input
    );
  }

  findServiceAreaById(
    vendorId: string,
    serviceAreaId: string
  ): Promise<
    VendorDomain.VendorServiceArea |
    null
  > {
    return findPrismaVendorServiceAreaById(
      this.prisma,
      vendorId,
      serviceAreaId
    );
  }

  findServiceAreasByVendorId(
    vendorId: string
  ): Promise<
    VendorDomain.VendorServiceArea[]
  > {
    return findPrismaVendorServiceAreas(
      this.prisma,
      vendorId
    );
  }

  updateServiceArea(
    vendorId: string,
    serviceAreaId: string,
    input:
      VendorRepositoryContracts
        .UpdateVendorServiceAreaRepositoryInput
  ): Promise<
    VendorDomain.VendorServiceArea |
    null
  > {
    return updatePrismaVendorServiceArea(
      this.prisma,
      vendorId,
      serviceAreaId,
      input
    );
  }

  deleteServiceArea(
    vendorId: string,
    serviceAreaId: string
  ): Promise<boolean> {
    return deletePrismaVendorServiceArea(
      this.prisma,
      vendorId,
      serviceAreaId
    );
  }

  replaceServiceAreas(
    input:
      VendorRepositoryContracts
        .ReplaceVendorServiceAreasRepositoryInput
  ): Promise<
    VendorRepositoryContracts
      .ReplaceVendorServiceAreasRepositoryResult
  > {
    return replacePrismaVendorServiceAreas(
      this.prisma,
      input
    );
  }

  serviceAreaExists(
    vendorId: string,
    serviceAreaId: string
  ): Promise<boolean> {
    return prismaVendorServiceAreaExists(
      this.prisma,
      vendorId,
      serviceAreaId
    );
  }

  createService(
    vendorId: string,
    input:
      VendorRepositoryContracts
        .CreateVendorServiceRepositoryInput
  ): Promise<
    VendorDomain.VendorService
  > {
    return createPrismaVendorService(
      this.prisma,
      vendorId,
      input
    );
  }

  findServiceById(
    vendorId: string,
    serviceId: string
  ): Promise<
    VendorDomain.VendorService |
    null
  > {
    return findPrismaVendorServiceById(
      this.prisma,
      vendorId,
      serviceId
    );
  }

  findServicesByVendorId(
    vendorId: string
  ): Promise<
    VendorDomain.VendorService[]
  > {
    return findPrismaVendorServices(
      this.prisma,
      vendorId
    );
  }

  findServiceByType(
    vendorId: string,
    serviceType:
      VendorDomain.VendorService[
        "serviceType"
      ]
  ): Promise<
    VendorDomain.VendorService |
    null
  > {
    return findPrismaVendorServiceByType(
      this.prisma,
      vendorId,
      serviceType
    );
  }

  updateService(
    vendorId: string,
    serviceId: string,
    input:
      VendorRepositoryContracts
        .UpdateVendorServiceRepositoryInput
  ): Promise<
    VendorDomain.VendorService |
    null
  > {
    return updatePrismaVendorService(
      this.prisma,
      vendorId,
      serviceId,
      input
    );
  }

  deleteService(
    vendorId: string,
    serviceId: string
  ): Promise<boolean> {
    return deletePrismaVendorService(
      this.prisma,
      vendorId,
      serviceId
    );
  }

  replaceServices(
    input:
      VendorRepositoryContracts
        .ReplaceVendorServicesRepositoryInput
  ): Promise<
    VendorRepositoryContracts
      .ReplaceVendorServicesRepositoryResult
  > {
    return replacePrismaVendorServices(
      this.prisma,
      input
    );
  }

  serviceExists(
    vendorId: string,
    serviceId: string
  ): Promise<boolean> {
    return prismaVendorServiceExists(
      this.prisma,
      vendorId,
      serviceId
    );
  }

  createPricing(
    vendorId: string,
    input:
      VendorRepositoryContracts
        .CreateVendorPricingRepositoryInput
  ): Promise<
    VendorDomain.VendorPricing
  > {
    return createPrismaVendorPricing(
      this.prisma,
      vendorId,
      input
    );
  }

  findPricingById(
    vendorId: string,
    pricingId: string
  ): Promise<
    VendorDomain.VendorPricing |
    null
  > {
    return findPrismaVendorPricingById(
      this.prisma,
      vendorId,
      pricingId
    );
  }

  findPricingByVendorId(
    vendorId: string
  ): Promise<
    VendorDomain.VendorPricing[]
  > {
    return findPrismaVendorPricing(
      this.prisma,
      vendorId
    );
  }

  findPricingByServiceType(
    vendorId: string,
    serviceType:
      VendorDomain.VendorPricing[
        "serviceType"
      ]
  ): Promise<
    VendorDomain.VendorPricing[]
  > {
    return findPrismaVendorPricingByServiceType(
      this.prisma,
      vendorId,
      serviceType
    );
  }

  updatePricing(
    vendorId: string,
    pricingId: string,
    input:
      VendorRepositoryContracts
        .UpdateVendorPricingRepositoryInput
  ): Promise<
    VendorDomain.VendorPricing |
    null
  > {
    return updatePrismaVendorPricing(
      this.prisma,
      vendorId,
      pricingId,
      input
    );
  }

  deletePricing(
    vendorId: string,
    pricingId: string
  ): Promise<boolean> {
    return deletePrismaVendorPricing(
      this.prisma,
      vendorId,
      pricingId
    );
  }

  replacePricing(
    input:
      VendorRepositoryContracts
        .ReplaceVendorPricingRepositoryInput
  ): Promise<
    VendorRepositoryContracts
      .ReplaceVendorPricingRepositoryResult
  > {
    return replacePrismaVendorPricing(
      this.prisma,
      input
    );
  }

  pricingExists(
    vendorId: string,
    pricingId: string
  ): Promise<boolean> {
    return prismaVendorPricingExists(
      this.prisma,
      vendorId,
      pricingId
    );
  }

  createVehicle(
    vendorId: string,
    input:
      VendorRepositoryContracts
        .CreateVendorVehicleRepositoryInput
  ): Promise<
    VendorDomain.VendorVehicle
  > {
    return createPrismaVendorVehicle(
      this.prisma,
      vendorId,
      input
    );
  }

  findVehicleById(
    vendorId: string,
    vehicleId: string
  ): Promise<
    VendorDomain.VendorVehicle |
    null
  > {
    return findPrismaVendorVehicleById(
      this.prisma,
      vendorId,
      vehicleId
    );
  }

  findVehicleByRegistrationNumber(
    vendorId: string,
    registrationNumber: string
  ): Promise<
    VendorDomain.VendorVehicle |
    null
  > {
    return findPrismaVendorVehicleByRegistrationNumber(
      this.prisma,
      vendorId,
      registrationNumber
    );
  }

  findVehiclesByVendorId(
    vendorId: string
  ): Promise<
    VendorDomain.VendorVehicle[]
  > {
    return findPrismaVendorVehicles(
      this.prisma,
      vendorId
    );
  }

  updateVehicle(
    vendorId: string,
    vehicleId: string,
    input:
      VendorRepositoryContracts
        .UpdateVendorVehicleRepositoryInput
  ): Promise<
    VendorDomain.VendorVehicle |
    null
  > {
    return updatePrismaVendorVehicle(
      this.prisma,
      vendorId,
      vehicleId,
      input
    );
  }

  deleteVehicle(
    vendorId: string,
    vehicleId: string
  ): Promise<boolean> {
    return deletePrismaVendorVehicle(
      this.prisma,
      vendorId,
      vehicleId
    );
  }

  replaceVehicles(
    input:
      VendorRepositoryContracts
        .ReplaceVendorVehiclesRepositoryInput
  ): Promise<
    VendorRepositoryContracts
      .ReplaceVendorVehiclesRepositoryResult
  > {
    return replacePrismaVendorVehicles(
      this.prisma,
      input
    );
  }

  vehicleExists(
    vendorId: string,
    vehicleId: string
  ): Promise<boolean> {
    return prismaVendorVehicleExists(
      this.prisma,
      vendorId,
      vehicleId
    );
  }

  vehicleRegistrationExists(
    registrationNumber: string,
    excludeVehicleId?: string
  ): Promise<boolean> {
    return prismaVendorVehicleRegistrationExists(
      this.prisma,
      registrationNumber,
      excludeVehicleId
    );
  }

  createDocument(
    vendorId: string,
    input:
      VendorRepositoryContracts
        .CreateVendorDocumentRepositoryInput
  ): Promise<
    VendorDomain.VendorDocument
  > {
    return createPrismaVendorDocument(
      this.prisma,
      vendorId,
      input
    );
  }

  findDocumentById(
    vendorId: string,
    documentId: string
  ): Promise<
    VendorDomain.VendorDocument |
    null
  > {
    return findPrismaVendorDocumentById(
      this.prisma,
      vendorId,
      documentId
    );
  }

  findDocumentsByVendorId(
    vendorId: string
  ): Promise<
    VendorDomain.VendorDocument[]
  > {
    return findPrismaVendorDocuments(
      this.prisma,
      vendorId
    );
  }

  findDocumentsByType(
    vendorId: string,
    documentType:
      VendorDomain.VendorDocument[
        "documentType"
      ]
  ): Promise<
    VendorDomain.VendorDocument[]
  > {
    return findPrismaVendorDocumentsByType(
      this.prisma,
      vendorId,
      documentType
    );
  }

  findDocumentsByStatus(
    vendorId: string,
    status:
      VendorDomain.VendorDocument[
        "status"
      ]
  ): Promise<
    VendorDomain.VendorDocument[]
  > {
    return findPrismaVendorDocumentsByStatus(
      this.prisma,
      vendorId,
      status
    );
  }

  updateDocument(
    vendorId: string,
    documentId: string,
    input:
      VendorRepositoryContracts
        .UpdateVendorDocumentRepositoryInput
  ): Promise<
    VendorDomain.VendorDocument |
    null
  > {
    return updatePrismaVendorDocument(
      this.prisma,
      vendorId,
      documentId,
      input
    );
  }

  reviewDocument(
    vendorId: string,
    documentId: string,
    input:
      VendorRepositoryContracts
        .ReviewVendorDocumentRepositoryInput
  ): Promise<
    VendorDomain.VendorDocument |
    null
  > {
    return reviewPrismaVendorDocument(
      this.prisma,
      vendorId,
      documentId,
      input
    );
  }

  deleteDocument(
    vendorId: string,
    documentId: string
  ): Promise<boolean> {
    return deletePrismaVendorDocument(
      this.prisma,
      vendorId,
      documentId
    );
  }

  replaceDocuments(
    input:
      VendorRepositoryContracts
        .ReplaceVendorDocumentsRepositoryInput
  ): Promise<
    VendorRepositoryContracts
      .ReplaceVendorDocumentsRepositoryResult
  > {
    return replacePrismaVendorDocuments(
      this.prisma,
      input
    );
  }

  documentExists(
    vendorId: string,
    documentId: string
  ): Promise<boolean> {
    return prismaVendorDocumentExists(
      this.prisma,
      vendorId,
      documentId
    );
  }

  findBankDetailsByVendorId(
    vendorId: string
  ): Promise<
    VendorDomain.VendorBankDetails |
    null
  > {
    return findPrismaVendorBankDetails(
      this.prisma,
      vendorId
    );
  }

  upsertBankDetails(
    vendorId: string,
    input:
      VendorRepositoryContracts
        .UpsertVendorBankDetailsRepositoryInput
  ): Promise<
    VendorDomain.VendorBankDetails
  > {
    return upsertPrismaVendorBankDetails(
      this.prisma,
      vendorId,
      input
    );
  }

  verifyBankDetails(
    vendorId: string,
    input:
      VendorRepositoryContracts
        .VerifyVendorBankDetailsRepositoryInput
  ): Promise<
    VendorDomain.VendorBankDetails |
    null
  > {
    return verifyPrismaVendorBankDetails(
      this.prisma,
      vendorId,
      input
    );
  }

  deleteBankDetails(
    vendorId: string
  ): Promise<
    VendorRepositoryContracts
      .DeleteVendorBankDetailsRepositoryResult
  > {
    return deletePrismaVendorBankDetails(
      this.prisma,
      vendorId
    );
  }

  bankDetailsExist(
    vendorId: string
  ): Promise<boolean> {
    return prismaVendorBankDetailsExist(
      this.prisma,
      vendorId
    );
  }

  bankAccountExists(
    accountNumber: string,
    excludeVendorId?: string
  ): Promise<boolean> {
    return prismaVendorBankAccountExists(
      this.prisma,
      accountNumber,
      excludeVendorId
    );
  }

  upiIdExists(
    upiId: string,
    excludeVendorId?: string
  ): Promise<boolean> {
    return prismaVendorUpiIdExists(
      this.prisma,
      upiId,
      excludeVendorId
    );
  }

  findByIds(
    vendorIds: string[]
  ): Promise<
    VendorRepositoryContracts
      .VendorRepositoryBulkLookupResult
  > {
    return findPrismaVendorsByIds(
      this.prisma,
      vendorIds
    );
  }

  updateStatuses(
    input:
      VendorRepositoryContracts
        .BulkVendorStatusUpdateRepositoryInput
  ): Promise<
    VendorRepositoryContracts
      .BulkVendorStatusUpdateRepositoryResult
  > {
    return updatePrismaVendorStatuses(
      this.prisma,
      input
    );
  }

  deleteMany(
    input:
      VendorRepositoryContracts
        .BulkDeleteVendorsRepositoryInput
  ): Promise<
    VendorRepositoryContracts
      .BulkDeleteVendorsRepositoryResult
  > {
    return deleteManyPrismaVendors(
      this.prisma,
      input
    );
  }

  async softDelete(
    _input:
      VendorRepositoryContracts
        .SoftDeleteVendorRepositoryInput
  ): Promise<
    VendorRepositoryContracts
      .SoftDeleteVendorRepositoryResult
  > {
    throw createUnsupportedPrismaVendorCapabilityError(
      "VendorSoftDelete"
    );
  }

  async restore(
    _vendorId: string,
    _context?:
      VendorRepositoryContracts
        .VendorRepositoryMutationContext
  ): Promise<
    VendorRepositoryContracts
      .RestoreVendorRepositoryResult
  > {
    throw createUnsupportedPrismaVendorCapabilityError(
      "VendorRestore"
    );
  }

  async isDeleted(
    _vendorId: string
  ): Promise<boolean> {
    return false;
  }

  checkHealth():
    Promise<
      VendorRepositoryContracts
        .VendorRepositoryHealthResult
    > {
    return checkPrismaVendorRepositoryHealth(
      this.prisma
    );
  }

  count(
    query?:
      VendorRepositoryContracts
        .VendorRepositoryCountQuery
  ): Promise<number> {
    return countPrismaVendors(
      this.prisma,
      query?.filter
    );
  }

  any(
    filter?:
      VendorRepositoryContracts
        .VendorRepositoryFilter
  ): Promise<boolean> {
    return anyPrismaVendor(
      this.prisma,
      filter
    );
  }
}

/**
 * Full Vendor repository transaction manager.
 */
export class PrismaVendorRepositoryTransactionManager
  implements
    VendorRepositoryContracts
      .VendorRepositoryPortTransactionManager {
  constructor(
    private readonly prisma:
      PrismaClient
  ) {}

  async runInTransaction<T>(
    callback:
      VendorRepositoryContracts
        .VendorRepositoryPortTransactionCallback<T>
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(
        async (
          transaction
        ) =>
          callback({
            repository:
              new PrismaVendorRepository(
                transaction
              ),
          })
      );
    } catch (error) {
      const normalizedError =
        normalizePrismaVendorRepositoryError(
          error
        );

      throw new VendorRepositoryError(
        "TRANSACTION_FAILED",
        normalizedError.message,
        {
          cause:
            error,
        }
      );
    }
  }
}

/**
 * Compatibility transaction manager for the earlier complete
 * repository transaction contract.
 */
export class PrismaCompleteVendorRepositoryTransactionManager
  implements
    VendorRepositoryContracts
      .CompleteVendorRepositoryTransactionManager {
  constructor(
    private readonly prisma:
      PrismaClient
  ) {}

  async runInTransaction<T>(
    callback:
      VendorRepositoryContracts
        .CompleteVendorRepositoryTransactionCallback<T>
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(
        async (
          transaction
        ) =>
          callback({
            repository:
              new PrismaVendorRepository(
                transaction
              ),
          })
      );
    } catch (error) {
      const normalizedError =
        normalizePrismaVendorRepositoryError(
          error
        );

      throw new VendorRepositoryError(
        "TRANSACTION_FAILED",
        normalizedError.message,
        {
          cause:
            error,
        }
      );
    }
  }
}

/**
 * Requires the Prisma client needed by repository factories.
 */
export function requirePrismaVendorRepositoryClient(
  dependencies:
    PrismaVendorRepositoryDependencies
): PrismaClient {
  if (
    !dependencies.prisma
  ) {
    throw new VendorRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      "A PrismaClient instance is required to create the Vendor repository.",
      {
        field:
          "prisma",
      }
    );
  }

  return dependencies.prisma;
}

/**
 * Creates the full Prisma Vendor repository.
 */
export function createPrismaVendorRepository(
  dependencies:
    PrismaVendorRepositoryDependencies
): VendorRepositoryContracts
  .VendorRepositoryPort {
  return new PrismaVendorRepository(
    requirePrismaVendorRepositoryClient(
      dependencies
    )
  );
}

/**
 * Creates the full repository transaction manager.
 */
export function createPrismaVendorRepositoryTransactionManager(
  dependencies:
    PrismaVendorRepositoryDependencies
): VendorRepositoryContracts
  .VendorRepositoryPortTransactionManager {
  return new PrismaVendorRepositoryTransactionManager(
    requirePrismaVendorRepositoryClient(
      dependencies
    )
  );
}

/**
 * Creates the compatibility transaction manager.
 */
export function createPrismaCompleteVendorRepositoryTransactionManager(
  dependencies:
    PrismaVendorRepositoryDependencies
): VendorRepositoryContracts
  .CompleteVendorRepositoryTransactionManager {
  return new PrismaCompleteVendorRepositoryTransactionManager(
    requirePrismaVendorRepositoryClient(
      dependencies
    )
  );
}

/**
 * Module-factory result used by vendor.module.ts.
 */
export interface PrismaVendorRepositoryModule {
  repository:
    VendorRepositoryContracts
      .VendorRepositoryPort;

  transactionManager:
    VendorRepositoryContracts
      .VendorRepositoryPortTransactionManager;

  compatibilityTransactionManager:
    VendorRepositoryContracts
      .CompleteVendorRepositoryTransactionManager;

  capabilityReport:
    PrismaVendorRepositoryCapabilityReport;

  configuration:
    PrismaVendorRepositoryConfigurationValidation;
}

/**
 * Compatibility module factory required by vendor.module.ts.
 */
export function createPrismaVendorRepositoryModule(
  dependencies:
    PrismaVendorRepositoryDependencies
): PrismaVendorRepositoryModule {
  const prisma =
    requirePrismaVendorRepositoryClient(
      dependencies
    );

  return {
    repository:
      new PrismaVendorRepository(
        prisma
      ),

    transactionManager:
      new PrismaVendorRepositoryTransactionManager(
        prisma
      ),

    compatibilityTransactionManager:
      new PrismaCompleteVendorRepositoryTransactionManager(
        prisma
      ),

    capabilityReport:
      getPrismaVendorRepositoryCapabilityReport(),

    configuration:
      validatePrismaVendorRepositoryConfiguration(),
  };
}

/**
 * Compatibility factory alias.
 */
export const createVendorPrismaRepository =
  createPrismaVendorRepository;

/**
 * ============================================================
 * End of Fresh Prisma Vendor Repository
 * ============================================================
 */