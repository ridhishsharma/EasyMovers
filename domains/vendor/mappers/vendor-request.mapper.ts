/**
 * ============================================================
 * EasyMovers
 * Vendor Request Mapper
 * ============================================================
 *
 * File
 * ----
 * domains/vendor/mappers/vendor-request.mapper.ts
 *
 * Part A
 * ------
 * - Legacy registration-payload contract
 * - Legacy and normalized payload detection
 * - Primitive normalization helpers
 * - Legacy service-area conversion
 * - Legacy vendor-service conversion
 * - CreateVendorServiceInput conversion
 * - Safe cloning of normalized input
 *
 * Purpose
 * -------
 * The original vendor-registration form sends a flat payload.
 *
 * The new Vendor service expects a structured payload.
 *
 * This mapper temporarily supports both formats while the
 * frontend is migrated.
 * ============================================================
 */

import {
  VendorCategory,
  VendorServiceScope,
  VendorServiceType,
} from "../models/vendor.model";

import type {
  VendorService,
  VendorServiceArea,
} from "../models/vendor.model";

import type {
  CreateVendorServiceInput,
} from "../services/vendor.service";

/**
 * Generic request object.
 */
export type VendorRequestRecord =
  Record<string, unknown>;

/**
 * Vendor onboarding input expected by the service layer.
 *
 * Deriving this directly from CreateVendorServiceInput keeps
 * this mapper synchronized with vendor.service.ts.
 */
export type VendorCreateOnboardingInput =
  CreateVendorServiceInput["vendor"];

/**
 * Payload formats accepted by this mapper.
 */
export type VendorRequestPayloadKind =
  | "legacy"
  | "normalized"
  | "unknown";

/**
 * Original flat vendor-registration payload.
 */
export interface LegacyVendorRegistrationPayload
  extends VendorRequestRecord {
  vendorCode?: unknown;

  companyName?: unknown;
  companyLogo?: unknown;

  gstNumber?: unknown;
  panNumber?: unknown;

  website?: unknown;

  address?: unknown;
  addressLine1?: unknown;
  addressLine2?: unknown;
  landmark?: unknown;

  city?: unknown;
  district?: unknown;
  state?: unknown;

  pincode?: unknown;
  postalCode?: unknown;
  country?: unknown;

  latitude?: unknown;
  longitude?: unknown;

  ownerName?: unknown;
  ownerFatherName?: unknown;
  ownerDateOfBirth?: unknown;
  ownerAadhaarNumber?: unknown;
  ownerMobile?: unknown;
  ownerEmail?: unknown;

  quotationContactName?: unknown;
  quotationContactMobile?: unknown;
  quotationContactEmail?: unknown;

  coordinatorName?: unknown;
  coordinatorMobile?: unknown;
  coordinatorEmail?: unknown;

  experienceYears?: unknown;
  establishedYear?: unknown;

  totalVehicles?: unknown;
  totalLabours?: unknown;

  serviceCities?: unknown;
  serviceStates?: unknown;

  serviceScope?: unknown;
  serviceScopes?: unknown;

  serviceType?: unknown;
  serviceTypes?: unknown;

  householdService?: unknown;
  officeService?: unknown;
  corporateService?: unknown;
  vehicleService?: unknown;
  commercialGoodsService?: unknown;
  warehousingService?: unknown;
  packingOnlyService?: unknown;
  loadingUnloadingService?: unknown;
  installationService?: unknown;

  insuranceAvailable?: unknown;

  active?: unknown;
  remarks?: unknown;

  acceptedTerms?: unknown;

  createdBy?: unknown;
  updatedBy?: unknown;
  submittedBy?: unknown;
}

/**
 * Non-fatal compatibility warning.
 */
export interface VendorRequestMappingWarning {
  field?: string;

  code: string;

  message: string;
}

/**
 * Successful mapping result.
 */
export interface VendorRequestMappingSuccess {
  success: true;

  kind:
    Exclude<
      VendorRequestPayloadKind,
      "unknown"
    >;

  input:
    CreateVendorServiceInput;

  warnings:
    VendorRequestMappingWarning[];
}

/**
 * Failed mapping result.
 */
export interface VendorRequestMappingFailure {
  success: false;

  kind:
    VendorRequestPayloadKind;

  error: {
    code: string;

    message: string;

    fields?: string[];
  };

  warnings:
    VendorRequestMappingWarning[];
}

/**
 * Result returned by the request mapper.
 */
export type VendorRequestMappingResult =
  | VendorRequestMappingSuccess
  | VendorRequestMappingFailure;

/**
 * Determines whether a value is a plain object.
 */
export function isVendorRequestRecord(
  value: unknown
): value is VendorRequestRecord {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

/**
 * Determines whether a record owns a property.
 */
export function vendorRequestHasOwnProperty(
  record:
    VendorRequestRecord,
  propertyName: string
): boolean {
  return Object.prototype
    .hasOwnProperty
    .call(
      record,
      propertyName
    );
}

/**
 * Normalizes a required string.
 */
export function normalizeVendorRequestString(
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
export function normalizeOptionalVendorRequestString(
  value: unknown
): string | undefined {
  const normalized =
    normalizeVendorRequestString(
      value
    );

  return normalized ||
    undefined;
}

/**
 * Returns the first non-empty normalized string.
 */
export function firstVendorRequestString(
  ...values:
    unknown[]
): string {
  for (const value of values) {
    const normalized =
      normalizeVendorRequestString(
        value
      );

    if (normalized) {
      return normalized;
    }
  }

  return "";
}

/**
 * Returns the first non-empty optional string.
 */
export function firstOptionalVendorRequestString(
  ...values:
    unknown[]
): string | undefined {
  const normalized =
    firstVendorRequestString(
      ...values
    );

  return normalized ||
    undefined;
}

/**
 * Normalizes an optional email.
 */
export function normalizeVendorRequestEmail(
  value: unknown
): string | undefined {
  const normalized =
    normalizeOptionalVendorRequestString(
      value
    );

  return normalized
    ?.toLowerCase();
}

/**
 * Normalizes a phone number.
 *
 * Indian ten-digit numbers are converted to +91 format.
 * Other values are preserved for detailed validator checks.
 */
export function normalizeVendorRequestPhone(
  value: unknown
): string {
  const original =
    normalizeVendorRequestString(
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

  if (digits.length === 10) {
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
 * Normalizes an optional phone number.
 */
export function normalizeOptionalVendorRequestPhone(
  value: unknown
): string | undefined {
  const normalized =
    normalizeVendorRequestPhone(
      value
    );

  return normalized ||
    undefined;
}

/**
 * Normalizes an optional finite number.
 */
export function normalizeVendorRequestNumber(
  value: unknown
): number | undefined {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    return undefined;
  }

  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : undefined;
}

/**
 * Normalizes an optional integer.
 */
export function normalizeVendorRequestInteger(
  value: unknown
): number | undefined {
  const normalized =
    normalizeVendorRequestNumber(
      value
    );

  return (
    normalized !== undefined &&
    Number.isInteger(normalized)
  )
    ? normalized
    : undefined;
}

/**
 * Normalizes an optional boolean.
 */
export function normalizeVendorRequestBoolean(
  value: unknown
): boolean | undefined {
  if (
    typeof value === "boolean"
  ) {
    return value;
  }

  if (
    typeof value === "number"
  ) {
    if (value === 1) {
      return true;
    }

    if (value === 0) {
      return false;
    }

    return undefined;
  }

  if (
    typeof value !== "string"
  ) {
    return undefined;
  }

  const normalized =
    value.trim().toLowerCase();

  if (
    [
      "true",
      "1",
      "yes",
      "y",
      "on",
    ].includes(normalized)
  ) {
    return true;
  }

  if (
    [
      "false",
      "0",
      "no",
      "n",
      "off",
    ].includes(normalized)
  ) {
    return false;
  }

  return undefined;
}

/**
 * Normalizes an unknown date into a Date.
 */
export function normalizeVendorRequestDate(
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
    value.trim().length === 0
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
 * Normalizes a date to YYYY-MM-DD.
 */
export function normalizeVendorRequestDateString(
  value: unknown
): string | undefined {
  const parsed =
    normalizeVendorRequestDate(
      value
    );

  if (parsed) {
    return parsed
      .toISOString()
      .slice(0, 10);
  }

  return normalizeOptionalVendorRequestString(
    value
  );
}

/**
 * Normalizes arrays and delimited strings.
 */
export function normalizeVendorRequestStringList(
  value: unknown
): string[] {
  const values =
    Array.isArray(value)
      ? value
      : typeof value ===
          "string"
        ? value.split(
            /[,;\n]+/
          )
        : [];

  return [
    ...new Set(
      values
        .map(
          (item) =>
            normalizeVendorRequestString(
              item
            )
        )
        .filter(Boolean)
    ),
  ];
}

/**
 * Normalizes a public vendor code.
 */
export function normalizeVendorRequestCode(
  value: unknown
): string | undefined {
  return normalizeOptionalVendorRequestString(
    value
  )?.toUpperCase();
}

/**
 * Creates a stable compatibility identifier.
 */
export function createVendorRequestCompatibilityId(
  entityName: string,
  index: number
): string {
  return [
    "legacy",
    entityName,
    Date.now().toString(36),
    index + 1,
  ].join("-");
}

/**
 * Normalizes one legacy service scope.
 */
export function normalizeLegacyVendorServiceScope(
  value: unknown
): VendorServiceScope | undefined {
  const normalized =
    normalizeVendorRequestString(
      value
    )
      .toUpperCase()
      .replace(
        /[\s-]+/g,
        "_"
      );

  switch (normalized) {
    case "CITY":
    case "LOCAL":
    case "WITHIN_CITY":
      return VendorServiceScope
        .WITHIN_CITY;

    case "STATE":
    case "REGIONAL":
    case "WITHIN_STATE":
      return VendorServiceScope
        .WITHIN_STATE;

    case "NATIONAL":
    case "PANINDIA":
    case "PAN_INDIA":
    case "ALL_INDIA":
      return VendorServiceScope
        .PAN_INDIA;

    default:
      return undefined;
  }
}

/**
 * Resolves all legacy service scopes.
 */
export function normalizeLegacyVendorServiceScopes(
  payload:
    LegacyVendorRegistrationPayload
): VendorServiceScope[] {
  const sourceValues = [
    ...normalizeVendorRequestStringList(
      payload.serviceScopes
    ),

    ...normalizeVendorRequestStringList(
      payload.serviceScope
    ),
  ];

  const scopes =
    sourceValues
      .map(
        normalizeLegacyVendorServiceScope
      )
      .filter(
        (
          scope
        ): scope is VendorServiceScope =>
          scope !== undefined
      );

  if (scopes.length > 0) {
    return [
      ...new Set(scopes),
    ];
  }

  const cities =
    normalizeVendorRequestStringList(
      payload.serviceCities
    );

  const states =
    normalizeVendorRequestStringList(
      payload.serviceStates
    );

  if (states.length > 0) {
    return [
      VendorServiceScope
        .WITHIN_STATE,
    ];
  }

  if (cities.length > 0) {
    return [
      VendorServiceScope
        .WITHIN_CITY,
    ];
  }

  return [];
}

/**
 * Normalizes one vendor service type.
 */
export function normalizeLegacyVendorServiceType(
  value: unknown
): VendorServiceType | undefined {
  const normalized =
    normalizeVendorRequestString(
      value
    )
      .toUpperCase()
      .replace(
        /[\s-]+/g,
        "_"
      );

  switch (normalized) {
    case "HOUSEHOLD":
    case "HOME_RELOCATION":
    case "HOUSEHOLD_RELOCATION":
      return VendorServiceType
        .HOUSEHOLD_RELOCATION;

    case "OFFICE":
    case "OFFICE_RELOCATION":
      return VendorServiceType
        .OFFICE_RELOCATION;

    case "CORPORATE":
    case "CORPORATE_RELOCATION":
      return VendorServiceType
        .CORPORATE_RELOCATION;

    case "VEHICLE":
    case "VEHICLE_TRANSPORT":
    case "VEHICLE_TRANSPORTATION":
      return VendorServiceType
        .VEHICLE_TRANSPORT;

    case "COMMERCIAL":
    case "COMMERCIAL_GOODS":
      return VendorServiceType
        .COMMERCIAL_GOODS;

    case "WAREHOUSE":
    case "WAREHOUSING":
      return VendorServiceType
        .WAREHOUSING;

    case "PACKING":
    case "PACKING_ONLY":
      return VendorServiceType
        .PACKING_ONLY;

    case "LOADING":
    case "UNLOADING":
    case "LOADING_UNLOADING":
      return VendorServiceType
        .LOADING_UNLOADING;

    case "INSTALLATION":
    case "UNINSTALLATION":
    case "INSTALLATION_UNINSTALLATION":
      return VendorServiceType
        .INSTALLATION_UNINSTALLATION;

    default:
      return undefined;
  }
}

/**
 * Returns all vendor service types selected by the legacy
 * registration payload.
 */
export function mapLegacyVendorServiceTypes(
  payload:
    LegacyVendorRegistrationPayload
): VendorServiceType[] {
  const values =
    new Set<
      VendorServiceType
    >();

  const explicitValues = [
    ...normalizeVendorRequestStringList(
      payload.serviceTypes
    ),

    ...normalizeVendorRequestStringList(
      payload.serviceType
    ),
  ];

  for (
    const explicitValue
    of explicitValues
  ) {
    const normalized =
      normalizeLegacyVendorServiceType(
        explicitValue
      );

    if (normalized) {
      values.add(
        normalized
      );
    }
  }

  const flags:
    Array<{
      value: unknown;

      type:
        VendorServiceType;
    }> = [
      {
        value:
          payload.householdService,

        type:
          VendorServiceType
            .HOUSEHOLD_RELOCATION,
      },
      {
        value:
          payload.officeService,

        type:
          VendorServiceType
            .OFFICE_RELOCATION,
      },
      {
        value:
          payload.corporateService,

        type:
          VendorServiceType
            .CORPORATE_RELOCATION,
      },
      {
        value:
          payload.vehicleService,

        type:
          VendorServiceType
            .VEHICLE_TRANSPORT,
      },
      {
        value:
          payload
            .commercialGoodsService,

        type:
          VendorServiceType
            .COMMERCIAL_GOODS,
      },
      {
        value:
          payload.warehousingService,

        type:
          VendorServiceType
            .WAREHOUSING,
      },
      {
        value:
          payload.packingOnlyService,

        type:
          VendorServiceType
            .PACKING_ONLY,
      },
      {
        value:
          payload
            .loadingUnloadingService,

        type:
          VendorServiceType
            .LOADING_UNLOADING,
      },
      {
        value:
          payload.installationService,

        type:
          VendorServiceType
            .INSTALLATION_UNINSTALLATION,
      },
    ];

  for (const flag of flags) {
    if (
      normalizeVendorRequestBoolean(
        flag.value
      ) === true
    ) {
      values.add(
        flag.type
      );
    }
  }

  return [
    ...values,
  ];
}

/**
 * Returns a readable service title.
 */
export function getLegacyVendorServiceTitle(
  serviceType:
    VendorServiceType
): string {
  switch (serviceType) {
    case VendorServiceType
      .HOUSEHOLD_RELOCATION:
      return "Household Relocation";

    case VendorServiceType
      .OFFICE_RELOCATION:
      return "Office Relocation";

    case VendorServiceType
      .CORPORATE_RELOCATION:
      return "Corporate Relocation";

    case VendorServiceType
      .VEHICLE_TRANSPORT:
      return "Vehicle Transportation";

    case VendorServiceType
      .COMMERCIAL_GOODS:
      return "Commercial Goods Transportation";

    case VendorServiceType
      .WAREHOUSING:
      return "Warehousing";

    case VendorServiceType
      .PACKING_ONLY:
      return "Packing Services";

    case VendorServiceType
      .LOADING_UNLOADING:
      return "Loading and Unloading";

    case VendorServiceType
      .INSTALLATION_UNINSTALLATION:
      return "Installation and Uninstallation";
  }
}

/**
 * Resolves the vendor category from coverage.
 */
export function mapLegacyVendorCategory(
  scopes:
    readonly VendorServiceScope[],
  serviceStates:
    readonly string[]
): VendorCategory {
  if (
    scopes.includes(
      VendorServiceScope
        .PAN_INDIA
    )
  ) {
    return VendorCategory.NATIONAL;
  }

  if (
    scopes.includes(
      VendorServiceScope
        .WITHIN_STATE
    ) ||
    serviceStates.length > 1
  ) {
    return VendorCategory.REGIONAL;
  }

  return VendorCategory.LOCAL;
}

/**
 * Creates persisted service-area compatibility entities.
 */
export function mapLegacyVendorServiceAreas(
  payload:
    LegacyVendorRegistrationPayload,
  scopes:
    readonly VendorServiceScope[]
): VendorServiceArea[] {
  const cities =
    normalizeVendorRequestStringList(
      payload.serviceCities
    );

  const states =
    normalizeVendorRequestStringList(
      payload.serviceStates
    );

  const registeredCity =
    normalizeOptionalVendorRequestString(
      payload.city
    );

  const registeredState =
    normalizeOptionalVendorRequestString(
      payload.state
    );

  const active =
    normalizeVendorRequestBoolean(
      payload.active
    ) ??
    true;

  const now =
    new Date();

  const serviceAreas:
    VendorServiceArea[] = [];

  const appendServiceArea = (
    input:
      Omit<
        VendorServiceArea,
        | "id"
        | "createdAt"
        | "updatedAt"
      >
  ): void => {
    const index =
      serviceAreas.length;

    serviceAreas.push({
      id:
        createVendorRequestCompatibilityId(
          "service-area",
          index
        ),

      ...input,

      createdAt:
        new Date(
          now.getTime()
        ),

      updatedAt:
        new Date(
          now.getTime()
        ),
    });
  };

  if (
    scopes.includes(
      VendorServiceScope.PAN_INDIA
    )
  ) {
    appendServiceArea({
      scope:
        VendorServiceScope.PAN_INDIA,

      originCity:
        registeredCity,

      originState:
        registeredState,

      active,
    });

    return serviceAreas;
  }

  if (
    scopes.includes(
      VendorServiceScope.WITHIN_STATE
    )
  ) {
    if (cities.length > 0) {
      for (const city of cities) {
        appendServiceArea({
          scope:
            VendorServiceScope
              .WITHIN_STATE,

          originCity:
            registeredCity,

          originState:
            registeredState,

          destinationCity:
            city,

          destinationState:
            registeredState,

          active,
        });
      }

      return serviceAreas;
    }

    const destinationStates =
      states.length > 0
        ? states
        : registeredState
          ? [registeredState]
          : [];

    for (
      const destinationState
      of destinationStates
    ) {
      appendServiceArea({
        scope:
          VendorServiceScope
            .WITHIN_STATE,

        originCity:
          registeredCity,

        originState:
          registeredState,

        destinationState,

        active,
      });
    }

    return serviceAreas;
  }

  if (
    scopes.includes(
      VendorServiceScope.WITHIN_CITY
    )
  ) {
    const localCities =
      cities.length > 0
        ? cities
        : registeredCity
          ? [registeredCity]
          : [];

    for (const city of localCities) {
      appendServiceArea({
        scope:
          VendorServiceScope
            .WITHIN_CITY,

        originCity:
          city,

        originState:
          registeredState,

        destinationCity:
          city,

        destinationState:
          registeredState,

        active,
      });
    }

    return serviceAreas;
  }

  if (registeredCity) {
    appendServiceArea({
      scope:
        VendorServiceScope
          .WITHIN_CITY,

      originCity:
        registeredCity,

      originState:
        registeredState,

      destinationCity:
        registeredCity,

      destinationState:
        registeredState,

      active,
    });
  }

  return serviceAreas;
}

/**
 * Creates persisted vendor-service compatibility entities.
 */
export function mapLegacyVendorServices(
  payload:
    LegacyVendorRegistrationPayload
): VendorService[] {
  const active =
    normalizeVendorRequestBoolean(
      payload.active
    ) ??
    true;

  const now =
    new Date();

  return mapLegacyVendorServiceTypes(
    payload
  ).map(
    (
      serviceType,
      index
    ): VendorService => ({
      id:
        createVendorRequestCompatibilityId(
          "service",
          index
        ),

      serviceType,

      title:
        getLegacyVendorServiceTitle(
          serviceType
        ),

      active,

      createdAt:
        new Date(
          now.getTime()
        ),

      updatedAt:
        new Date(
          now.getTime()
        ),
    })
  );
}

/**
 * Detects the request payload format.
 */
export function detectVendorRequestPayloadKind(
  value: unknown
): VendorRequestPayloadKind {
  if (
    !isVendorRequestRecord(
      value
    )
  ) {
    return "unknown";
  }

  if (
    isVendorRequestRecord(
      value.vendor
    )
  ) {
    return "normalized";
  }

  const legacySignals = [
    "companyName",
    "ownerName",
    "ownerMobile",
    "quotationContactMobile",
    "serviceCities",
    "householdService",
    "officeService",
    "vehicleService",
  ];

  return legacySignals.some(
    (field) =>
      vendorRequestHasOwnProperty(
        value,
        field
      )
  )
    ? "legacy"
    : "unknown";
}

/**
 * Determines whether the payload is legacy.
 */
export function isLegacyVendorRegistrationPayload(
  value: unknown
): value is LegacyVendorRegistrationPayload {
  return (
    detectVendorRequestPayloadKind(
      value
    ) === "legacy"
  );
}

/**
 * Determines whether the payload is normalized.
 */
export function isNormalizedCreateVendorServiceInput(
  value: unknown
): value is CreateVendorServiceInput {
  return (
    detectVendorRequestPayloadKind(
      value
    ) === "normalized"
  );
}

/**
 * Resolves the actor submitting the legacy registration.
 */
export function resolveLegacyVendorRequestActor(
  payload:
    LegacyVendorRegistrationPayload
): string {
  return (
    firstOptionalVendorRequestString(
      payload.submittedBy,
      payload.updatedBy,
      payload.createdBy
    ) ??
    "legacy-vendor-registration"
  );
}

/**
 * Resolves an established year.
 */
export function resolveLegacyVendorEstablishedYear(
  payload:
    LegacyVendorRegistrationPayload
): number | undefined {
  const directYear =
    normalizeVendorRequestInteger(
      payload.establishedYear
    );

  if (directYear !== undefined) {
    return directYear;
  }

  const experienceYears =
    normalizeVendorRequestInteger(
      payload.experienceYears
    );

  if (
    experienceYears === undefined ||
    experienceYears < 0
  ) {
    return undefined;
  }

  return (
    new Date().getFullYear() -
    experienceYears
  );
}

/**
 * Maps the original flat vendor registration into the new
 * service input.
 */
export function mapLegacyVendorRegistrationPayload(
  payload:
    LegacyVendorRegistrationPayload
): VendorRequestMappingResult {
  const warnings:
    VendorRequestMappingWarning[] =
    [];

  const companyName =
    normalizeVendorRequestString(
      payload.companyName
    );

  const ownerName =
    firstVendorRequestString(
      payload.ownerName,
      payload
        .quotationContactName
    );

  const ownerPhone =
    normalizeVendorRequestPhone(
      payload.ownerMobile
    );

  const primaryPhone =
    normalizeVendorRequestPhone(
      firstVendorRequestString(
        payload
          .quotationContactMobile,
        payload.ownerMobile
      )
    );

  const city =
    normalizeVendorRequestString(
      payload.city
    );

  const state =
    normalizeVendorRequestString(
      payload.state
    );

  const postalCode =
    firstVendorRequestString(
      payload.postalCode,
      payload.pincode
    );

  const addressLine1 =
    firstVendorRequestString(
      payload.addressLine1,
      payload.address
    );

  const missingFields:
    string[] = [];

  if (!companyName) {
    missingFields.push(
      "companyName"
    );
  }

  if (!ownerName) {
    missingFields.push(
      "ownerName"
    );
  }

  if (!ownerPhone) {
    missingFields.push(
      "ownerMobile"
    );
  }

  if (!addressLine1) {
    missingFields.push(
      "address"
    );
  }

  if (!city) {
    missingFields.push(
      "city"
    );
  }

  if (!state) {
    missingFields.push(
      "state"
    );
  }

  if (!postalCode) {
    missingFields.push(
      "pincode"
    );
  }

  if (
    missingFields.length > 0
  ) {
    return {
      success: false,

      kind:
        "legacy",

      error: {
        code:
          "INVALID_LEGACY_VENDOR_REQUEST",

        message:
          "The legacy vendor-registration payload is missing required fields.",

        fields:
          missingFields,
      },

      warnings,
    };
  }

  const actor =
    resolveLegacyVendorRequestActor(
      payload
    );

  const scopes =
    normalizeLegacyVendorServiceScopes(
      payload
    );

  const serviceStates =
    normalizeVendorRequestStringList(
      payload.serviceStates
    );

  const serviceAreas =
    mapLegacyVendorServiceAreas(
      payload,
      scopes
    );

  const services =
    mapLegacyVendorServices(
      payload
    );

  if (
    serviceAreas.length === 0
  ) {
    warnings.push({
      field:
        "serviceCities",

      code:
        "NO_LEGACY_SERVICE_AREAS",

      message:
        "No service area could be derived from the legacy payload.",
    });
  }

  if (
    services.length === 0
  ) {
    warnings.push({
      field:
        "serviceTypes",

      code:
        "NO_LEGACY_VENDOR_SERVICES",

      message:
        "No vendor service was selected in the legacy payload.",
    });
  }

  const ownerEmail =
    normalizeVendorRequestEmail(
      payload.ownerEmail
    );

  const quotationEmail =
    normalizeVendorRequestEmail(
      payload
        .quotationContactEmail
    );

  const contactEmail =
    quotationEmail ??
    ownerEmail ??
    "";

  if (!contactEmail) {
    warnings.push({
      field:
        "ownerEmail",

      code:
        "MISSING_VENDOR_EMAIL",

      message:
        "The legacy registration does not contain an email address.",
    });
  }

  const acceptedTerms =
    normalizeVendorRequestBoolean(
      payload.acceptedTerms
    ) ??
    true;

  const onboardingInput:
    VendorCreateOnboardingInput = {
    business: {
      companyName,

      gstNumber:
        normalizeOptionalVendorRequestString(
          payload.gstNumber
        ),

      panNumber:
        normalizeOptionalVendorRequestString(
          payload.panNumber
        ),

      establishedYear:
        resolveLegacyVendorEstablishedYear(
          payload
        ),

      category:
        mapLegacyVendorCategory(
          scopes,
          serviceStates
        ),
    },

    owner: {
      fullName:
        ownerName,

      fatherName:
        normalizeOptionalVendorRequestString(
          payload
            .ownerFatherName
        ),

      dateOfBirth:
        normalizeVendorRequestDateString(
          payload
            .ownerDateOfBirth
        ),

      aadhaarNumber:
        normalizeOptionalVendorRequestString(
          payload
            .ownerAadhaarNumber
        ),

      panNumber:
        normalizeOptionalVendorRequestString(
          payload.panNumber
        ),

      phone:
        ownerPhone,

      email:
        ownerEmail,
    },

    contact: {
      primaryPhone:
        primaryPhone ||
        ownerPhone,

      alternatePhone:
        normalizeOptionalVendorRequestPhone(
          payload
            .coordinatorMobile
        ),

      email:
        contactEmail,

      website:
        normalizeOptionalVendorRequestString(
          payload.website
        ),

      whatsappNumber:
        primaryPhone ||
        ownerPhone,
    },

    registeredAddress: {
      addressLine1,

      addressLine2:
        normalizeOptionalVendorRequestString(
          payload.addressLine2
        ),

      landmark:
        normalizeOptionalVendorRequestString(
          payload.landmark
        ),

      city,

      district:
        normalizeOptionalVendorRequestString(
          payload.district
        ),

      state,

      postalCode,

      country:
        normalizeOptionalVendorRequestString(
          payload.country
        ) ??
        "India",

      latitude:
        normalizeVendorRequestNumber(
          payload.latitude
        ),

      longitude:
        normalizeVendorRequestNumber(
          payload.longitude
        ),
    },

    serviceAreas,

    services,

    pricing: [],

    vehicles: [],

    documents: [],

    bankDetails:
      undefined,

    acceptedTerms,

    submittedBy:
      actor,
  };

  const input:
    CreateVendorServiceInput = {
    vendor:
      onboardingInput,

    vendorCode:
      normalizeVendorRequestCode(
        payload.vendorCode
      ),

    active:
      normalizeVendorRequestBoolean(
        payload.active
      ) ??
      true,
  };

  return {
    success: true,

    kind:
      "legacy",

    input,

    warnings,
  };
}

/**
 * Safely clones a date-like field.
 */
function cloneVendorRequestDate(
  value: unknown
): Date | undefined {
  return normalizeVendorRequestDate(
    value
  );
}

/**
 * Creates a defensive copy of an already-normalized request.
 */
export function cloneNormalizedCreateVendorServiceInput(
  input:
    CreateVendorServiceInput
): CreateVendorServiceInput {
  const vendor =
    input.vendor;

  return {
    ...input,

    vendor: {
      ...vendor,

      business: {
        ...vendor.business,
      },

      owner: {
        ...vendor.owner,
      },

      contact: {
        ...vendor.contact,
      },

      registeredAddress: {
        ...vendor.registeredAddress,
      },

      operationalAddress:
        vendor.operationalAddress
          ? {
              ...vendor
                .operationalAddress,
            }
          : undefined,

      serviceAreas:
        (
          vendor.serviceAreas ??
          []
        ).map(
          (serviceArea) => ({
            ...serviceArea,

            serviceablePostalCodes:
              serviceArea
                .serviceablePostalCodes
                ? [
                    ...serviceArea
                      .serviceablePostalCodes,
                  ]
                : undefined,

            createdAt:
              cloneVendorRequestDate(
                serviceArea.createdAt
              ) ??
              new Date(),

            updatedAt:
              cloneVendorRequestDate(
                serviceArea.updatedAt
              ) ??
              new Date(),
          })
        ),

      services:
        (
          vendor.services ??
          []
        ).map(
          (service) => ({
            ...service,

            createdAt:
              cloneVendorRequestDate(
                service.createdAt
              ) ??
              new Date(),

            updatedAt:
              cloneVendorRequestDate(
                service.updatedAt
              ) ??
              new Date(),
          })
        ),

      pricing:
        (
          vendor.pricing ??
          []
        ).map(
          (pricing) => ({
            ...pricing,

            effectiveFrom:
              cloneVendorRequestDate(
                pricing.effectiveFrom
              ),

            effectiveUntil:
              cloneVendorRequestDate(
                pricing.effectiveUntil
              ),

            createdAt:
              cloneVendorRequestDate(
                pricing.createdAt
              ) ??
              new Date(),

            updatedAt:
              cloneVendorRequestDate(
                pricing.updatedAt
              ) ??
              new Date(),
          })
        ),

      vehicles:
        (
          vendor.vehicles ??
          []
        ).map(
          (vehicle) => ({
            ...vehicle,

            insuranceExpiryDate:
              cloneVendorRequestDate(
                vehicle
                  .insuranceExpiryDate
              ),

            permitExpiryDate:
              cloneVendorRequestDate(
                vehicle
                  .permitExpiryDate
              ),

            pollutionCertificateExpiryDate:
              cloneVendorRequestDate(
                vehicle
                  .pollutionCertificateExpiryDate
              ),

            createdAt:
              cloneVendorRequestDate(
                vehicle.createdAt
              ) ??
              new Date(),

            updatedAt:
              cloneVendorRequestDate(
                vehicle.updatedAt
              ) ??
              new Date(),
          })
        ),

      documents:
        (
          vendor.documents ??
          []
        ).map(
          (document) => ({
            ...document,

            issuedAt:
              cloneVendorRequestDate(
                document.issuedAt
              ),

            expiresAt:
              cloneVendorRequestDate(
                document.expiresAt
              ),

            verifiedAt:
              cloneVendorRequestDate(
                document.verifiedAt
              ),

            createdAt:
              cloneVendorRequestDate(
                document.createdAt
              ) ??
              new Date(),

            updatedAt:
              cloneVendorRequestDate(
                document.updatedAt
              ) ??
              new Date(),
          })
        ),

      bankDetails:
        vendor.bankDetails
          ? {
              ...vendor.bankDetails,

              verifiedAt:
                cloneVendorRequestDate(
                  vendor.bankDetails
                    .verifiedAt
                ),
            }
          : undefined,
    },
  };
}

/**
 * Maps either supported request format.
 */
export function mapVendorCreateRequestPayload(
  payload: unknown
): VendorRequestMappingResult {
  const kind =
    detectVendorRequestPayloadKind(
      payload
    );

  if (
    kind === "normalized" &&
    isNormalizedCreateVendorServiceInput(
      payload
    )
  ) {
    return {
      success: true,

      kind:
        "normalized",

      input:
        cloneNormalizedCreateVendorServiceInput(
          payload
        ),

      warnings: [],
    };
  }

  if (
    kind === "legacy" &&
    isLegacyVendorRegistrationPayload(
      payload
    )
  ) {
    return mapLegacyVendorRegistrationPayload(
      payload
    );
  }

  return {
    success: false,

    kind:
      "unknown",

    error: {
      code:
        "UNKNOWN_VENDOR_REQUEST_FORMAT",

      message:
        "The request does not match the legacy or normalized vendor payload structure.",
    },

    warnings: [],
  };
}

/**
 * ============================================================
 * End of Vendor Request Mapper Part A
 * ============================================================
 */