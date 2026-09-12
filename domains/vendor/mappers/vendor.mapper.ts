/**
 * ============================================================
 * EasyMovers
 * Vendor Domain Mappers
 * ============================================================
 *
 * File
 * ----
 * vendor.mapper.ts
 *
 * Part A
 * ------
 * - Shared mapper utilities
 * - Vendor business-details mapping
 * - Vendor owner-details mapping
 * - Vendor contact mapping
 * - Vendor address mapping
 *
 * Purpose
 * -------
 * Converts incoming or persisted vendor data into clean,
 * normalized vendor-domain objects.
 * ============================================================
 */
import type {
  AddVendorPricingInput,
  AddVendorServiceAreaInput,
  UpdateVendorServiceAreaInput,
  UpsertVendorServiceInput,
  VendorAddress,
  VendorBusinessDetails,
  VendorContact,
  VendorOwnerDetails,
  VendorPricing,
  VendorService,
  VendorServiceArea,
AddVendorDocumentInput,
AddVendorVehicleInput,
ReviewVendorDocumentInput,
UpdateVendorBankDetailsInput,
VendorBankDetails,
VendorDocument,
VendorVehicle,
} from "../models/vendor.model";

import {
  VendorBusinessType,
} from "../models/vendor.model";
/**
 * Input shape accepted by mapper functions.
 *
 * This permits partial, nullable, or unclean data coming from:
 *
 * - API request bodies
 * - Database records
 * - External integrations
 * - Form submissions
 */
export type VendorMapperInput<T> = {
  [K in keyof T]?: T[K] | null;
};

/**
 * Removes leading and trailing whitespace.
 *
 * Returns an empty string when the input is null,
 * undefined, or not a string.
 */
function mapRequiredString(
  value: unknown
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

/**
 * Maps an optional string.
 *
 * Empty strings are converted to undefined.
 */
function mapOptionalString(
  value: unknown
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();

  return normalized.length > 0
    ? normalized
    : undefined;
}

/**
 * Converts a string to uppercase.
 *
 * Empty values are converted to undefined.
 */
function mapOptionalUppercaseString(
  value: unknown
): string | undefined {
  const normalized =
    mapOptionalString(value);

  return normalized?.toUpperCase();
}

/**
 * Converts a string to lowercase.
 *
 * Empty values are converted to undefined.
 */
function mapOptionalLowercaseString(
  value: unknown
): string | undefined {
  const normalized =
    mapOptionalString(value);

  return normalized?.toLowerCase();
}

/**
 * Maps a finite number.
 *
 * Invalid numbers are converted to undefined.
 */
function mapOptionalNumber(
  value: unknown
): number | undefined {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim().length > 0
  ) {
    const parsedValue = Number(value);

    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return undefined;
}

/**
 * Maps an integer.
 *
 * Decimal values are converted to undefined.
 */
function mapOptionalInteger(
  value: unknown
): number | undefined {
  const mappedValue =
    mapOptionalNumber(value);

  return (
    mappedValue !== undefined &&
    Number.isInteger(mappedValue)
  )
    ? mappedValue
    : undefined;
}

/**
 * Maps a boolean value.
 *
 * Supports boolean values and common string forms.
 */
function mapOptionalBoolean(
  value: unknown
): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized =
      value.trim().toLowerCase();

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return undefined;
}

/**
 * Normalizes an Indian phone number.
 *
 * Accepted examples:
 *
 * 9876543210
 * 91 9876543210
 * +91-9876543210
 *
 * Output:
 *
 * +919876543210
 */
function mapIndianPhoneNumber(
  value: unknown
): string {
  const originalValue =
    mapRequiredString(value);

  if (!originalValue) {
    return "";
  }

  const digits =
    originalValue.replace(/\D/g, "");

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

  return originalValue;
}

/**
 * Maps an optional Indian phone number.
 */
function mapOptionalIndianPhoneNumber(
  value: unknown
): string | undefined {
  const mappedValue =
    mapIndianPhoneNumber(value);

  return mappedValue.length > 0
    ? mappedValue
    : undefined;
}

/**
 * Normalizes a PAN number.
 */
function mapPANNumber(
  value: unknown
): string | undefined {
  return mapOptionalUppercaseString(
    value
  );
}

/**
 * Normalizes a GST number.
 */
function mapGSTNumber(
  value: unknown
): string | undefined {
  return mapOptionalUppercaseString(
    value
  );
}

/**
 * Normalizes an Aadhaar number by removing spaces
 * and hyphens.
 */
function mapAadhaarNumber(
  value: unknown
): string | undefined {
  const normalized =
    mapOptionalString(value);

  if (!normalized) {
    return undefined;
  }

  return normalized.replace(
    /[\s-]/g,
    ""
  );
}

/**
 * Maps a date value to an ISO date string.
 *
 * Invalid values are converted to undefined.
 */
function mapOptionalDateString(
  value: unknown
): string | undefined {
  if (value instanceof Date) {
    if (
      Number.isNaN(value.getTime())
    ) {
      return undefined;
    }

    return value
      .toISOString()
      .slice(0, 10);
  }

  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    return undefined;
  }

  const parsedDate =
    new Date(value);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return undefined;
  }

  return parsedDate
    .toISOString()
    .slice(0, 10);
}

export function mapVendorBusinessType(
  value: unknown
): VendorBusinessType {
  if (value === undefined || value === null) {
    return VendorBusinessType.UNSPECIFIED;
  }

  if (typeof value !== "string") {
    throw new Error("Vendor business type must be a string.");
  }

  const normalized = value.trim().toUpperCase();

  switch (normalized) {
    case VendorBusinessType.UNSPECIFIED:
      return VendorBusinessType.UNSPECIFIED;
    case VendorBusinessType.INDIVIDUAL_OWNER_DRIVER:
      return VendorBusinessType.INDIVIDUAL_OWNER_DRIVER;
    case VendorBusinessType.SOLE_PROPRIETOR:
      return VendorBusinessType.SOLE_PROPRIETOR;
    case VendorBusinessType.REGISTERED_BUSINESS:
      return VendorBusinessType.REGISTERED_BUSINESS;
    default:
      throw new Error("Vendor business type is invalid.");
  }
}
/**
 * Maps vendor business details.
 */
export function mapVendorBusinessDetails(
  input: VendorMapperInput<VendorBusinessDetails>
): VendorBusinessDetails {
  return {
    companyName: mapRequiredString(
      input.companyName
    ),

    legalName: mapOptionalString(
      input.legalName
    ),

    tradeName: mapOptionalString(
      input.tradeName
    ),

    registrationNumber:
      mapOptionalUppercaseString(
        input.registrationNumber
      ),

    gstNumber: mapGSTNumber(
      input.gstNumber
    ),

    panNumber: mapPANNumber(
      input.panNumber
    ),

    establishedYear:
      mapOptionalInteger(
        input.establishedYear
      ),

    category:
      input.category as VendorBusinessDetails["category"],
    businessType: mapVendorBusinessType(
      input.businessType
    ),
  };
}

/**
 * Maps vendor owner details.
 */
export function mapVendorOwnerDetails(
  input: VendorMapperInput<VendorOwnerDetails>
): VendorOwnerDetails {
  return {
    fullName: mapRequiredString(
      input.fullName
    ),

    fatherName: mapOptionalString(
      input.fatherName
    ),

    dateOfBirth:
      mapOptionalDateString(
        input.dateOfBirth
      ),

    aadhaarNumber:
      mapAadhaarNumber(
        input.aadhaarNumber
      ),

    panNumber: mapPANNumber(
      input.panNumber
    ),

    phone: mapIndianPhoneNumber(
      input.phone
    ),

    email:
      mapOptionalLowercaseString(
        input.email
      ),
  };
}

/**
 * Maps vendor contact details.
 */
export function mapVendorContact(
  input: VendorMapperInput<VendorContact>
): VendorContact {
  return {
    primaryPhone:
      mapIndianPhoneNumber(
        input.primaryPhone
      ),

    alternatePhone:
      mapOptionalIndianPhoneNumber(
        input.alternatePhone
      ),

    landline: mapOptionalString(
      input.landline
    ),

    email:
      mapRequiredString(
        input.email
      ).toLowerCase(),

    website: mapOptionalString(
      input.website
    ),

    whatsappNumber:
      mapOptionalIndianPhoneNumber(
        input.whatsappNumber
      ),
  };
}

/**
 * Maps a vendor address.
 */
export function mapVendorAddress(
  input: VendorMapperInput<VendorAddress>
): VendorAddress {
  return {
    addressLine1:
      mapRequiredString(
        input.addressLine1
      ),

    addressLine2:
      mapOptionalString(
        input.addressLine2
      ),

    landmark:
      mapOptionalString(
        input.landmark
      ),

    city: mapRequiredString(
      input.city
    ),

    district:
      mapOptionalString(
        input.district
      ),

    state: mapRequiredString(
      input.state
    ),

    postalCode:
      mapRequiredString(
        input.postalCode
      ),

    country:
      mapRequiredString(
        input.country
      ) || "India",

    latitude:
      mapOptionalNumber(
        input.latitude
      ),

    longitude:
      mapOptionalNumber(
        input.longitude
      ),
  };
}

/**
 * Maps an optional vendor address.
 */
export function mapOptionalVendorAddress(
  input:
    | VendorMapperInput<VendorAddress>
    | null
    | undefined
): VendorAddress | undefined {
  if (!input) {
    return undefined;
  }

  const hasAddressData =
    Object.values(input).some(
      (value) =>
        value !== undefined &&
        value !== null &&
        value !== ""
    );

  if (!hasAddressData) {
    return undefined;
  }

  return mapVendorAddress(input);
}

/**
 * Creates a defensive copy of vendor business details.
 */
export function cloneVendorBusinessDetails(
  business: VendorBusinessDetails
): VendorBusinessDetails {
  return mapVendorBusinessDetails(
    business
  );
}

/**
 * Creates a defensive copy of vendor owner details.
 */
export function cloneVendorOwnerDetails(
  owner: VendorOwnerDetails
): VendorOwnerDetails {
  return mapVendorOwnerDetails(owner);
}

/**
 * Creates a defensive copy of vendor contact details.
 */
export function cloneVendorContact(
  contact: VendorContact
): VendorContact {
  return mapVendorContact(contact);
}

/**
 * Creates a defensive copy of a vendor address.
 */
export function cloneVendorAddress(
  address: VendorAddress
): VendorAddress {
  return mapVendorAddress(address);
}
/**
 * ============================================================
 * Part B
 * ============================================================
 *
 * - Shared date mapping
 * - String-array mapping
 * - Vendor service-area mapping
 * - Vendor service mapping
 * - Vendor pricing mapping
 * ============================================================
 */

/**
 * Maps a value into a valid Date instance.
 *
 * Invalid or empty values are converted to undefined.
 */
function mapOptionalDate(
  value: unknown
): Date | undefined {
  if (value instanceof Date) {
    return Number.isNaN(
      value.getTime()
    )
      ? undefined
      : new Date(value.getTime());
  }

  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return undefined;
  }

  if (
    typeof value === "string" &&
    value.trim().length === 0
  ) {
    return undefined;
  }

  const mappedDate = new Date(value);

  return Number.isNaN(
    mappedDate.getTime()
  )
    ? undefined
    : mappedDate;
}

/**
 * Maps a required Date value.
 *
 * A new Date instance is always returned to prevent
 * accidental mutation of the source object.
 *
 * Validation should be performed after mapping.
 */
function mapRequiredDate(
  value: unknown
): Date {
  return (
    mapOptionalDate(value) ??
    new Date(Number.NaN)
  );
}

/**
 * Maps a string array.
 *
 * The mapper:
 *
 * - Removes non-string values
 * - Trims every value
 * - Removes empty values
 * - Removes duplicate values
 */
function mapStringArray(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalizedValues =
    value
      .filter(
        (item): item is string =>
          typeof item === "string"
      )
      .map((item) => item.trim())
      .filter(
        (item) => item.length > 0
      );

  return [
    ...new Set(normalizedValues),
  ];
}

/**
 * Maps an Indian postal-code array.
 *
 * Postal codes are retained as strings so leading
 * formatting is not lost.
 */
function mapPostalCodeArray(
  value: unknown
): string[] {
  return mapStringArray(value).map(
    (postalCode) =>
      postalCode.replace(/\s/g, "")
  );
}

/**
 * Maps a boolean with a fallback value.
 */
function mapBoolean(
  value: unknown,
  fallback: boolean
): boolean {
  return (
    mapOptionalBoolean(value) ??
    fallback
  );
}

/**
 * Maps a non-negative numeric value.
 *
 * Negative and invalid values are converted to undefined.
 */
function mapOptionalNonNegativeNumber(
  value: unknown
): number | undefined {
  const mappedValue =
    mapOptionalNumber(value);

  if (
    mappedValue === undefined ||
    mappedValue < 0
  ) {
    return undefined;
  }

  return mappedValue;
}

/**
 * Maps a percentage value.
 *
 * Values outside the range 0 to 100 are converted
 * to undefined.
 */
function mapOptionalPercentage(
  value: unknown
): number | undefined {
  const mappedValue =
    mapOptionalNumber(value);

  if (
    mappedValue === undefined ||
    mappedValue < 0 ||
    mappedValue > 100
  ) {
    return undefined;
  }

  return mappedValue;
}

/**
 * Maps a vendor service-area creation input.
 */
export function mapAddVendorServiceAreaInput(
  input: VendorMapperInput<AddVendorServiceAreaInput>
): AddVendorServiceAreaInput {
  return {
    scope:
      input.scope as AddVendorServiceAreaInput["scope"],

    originCity:
      mapOptionalString(
        input.originCity
      ),

    originState:
      mapOptionalString(
        input.originState
      ),

    destinationCity:
      mapOptionalString(
        input.destinationCity
      ),

    destinationState:
      mapOptionalString(
        input.destinationState
      ),

    serviceablePostalCodes:
      input.serviceablePostalCodes ===
      undefined
        ? undefined
        : mapPostalCodeArray(
            input.serviceablePostalCodes
          ),

    active:
      mapOptionalBoolean(
        input.active
      ),

    updatedBy:
      mapRequiredString(
        input.updatedBy
      ),
  };
}

/**
 * Maps a vendor service-area update input.
 *
 * Undefined fields remain undefined so that partial-update
 * semantics are preserved.
 */
export function mapUpdateVendorServiceAreaInput(
  input: VendorMapperInput<UpdateVendorServiceAreaInput>
): UpdateVendorServiceAreaInput {
  return {
    scope:
      input.scope as UpdateVendorServiceAreaInput["scope"],

    originCity:
      input.originCity === undefined
        ? undefined
        : mapOptionalString(
            input.originCity
          ),

    originState:
      input.originState === undefined
        ? undefined
        : mapOptionalString(
            input.originState
          ),

    destinationCity:
      input.destinationCity ===
      undefined
        ? undefined
        : mapOptionalString(
            input.destinationCity
          ),

    destinationState:
      input.destinationState ===
      undefined
        ? undefined
        : mapOptionalString(
            input.destinationState
          ),

    serviceablePostalCodes:
      input.serviceablePostalCodes ===
      undefined
        ? undefined
        : mapPostalCodeArray(
            input.serviceablePostalCodes
          ),

    active:
      mapOptionalBoolean(
        input.active
      ),

    updatedBy:
      mapRequiredString(
        input.updatedBy
      ),
  };
}

/**
 * Maps a stored vendor service-area entity.
 */
export function mapVendorServiceArea(
  input: VendorMapperInput<VendorServiceArea>
): VendorServiceArea {
  return {
    id: mapRequiredString(
      input.id
    ),

    scope:
      input.scope as VendorServiceArea["scope"],

    originCity:
      mapOptionalString(
        input.originCity
      ),

    originState:
      mapOptionalString(
        input.originState
      ),

    destinationCity:
      mapOptionalString(
        input.destinationCity
      ),

    destinationState:
      mapOptionalString(
        input.destinationState
      ),

    serviceablePostalCodes:
      mapPostalCodeArray(
        input.serviceablePostalCodes
      ),

    active: mapBoolean(
      input.active,
      true
    ),

    createdAt:
      mapRequiredDate(
        input.createdAt
      ),

    updatedAt:
      mapRequiredDate(
        input.updatedAt
      ),
  };
}

/**
 * Maps an array of vendor service areas.
 */
export function mapVendorServiceAreas(
  input:
    | Array<
        VendorMapperInput<VendorServiceArea>
      >
    | null
    | undefined
): VendorServiceArea[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map(
    mapVendorServiceArea
  );
}

/**
 * Maps input used to create or update a vendor service.
 */
export function mapUpsertVendorServiceInput(
  input: VendorMapperInput<UpsertVendorServiceInput>
): UpsertVendorServiceInput {
  return {
    serviceType:
      input.serviceType as UpsertVendorServiceInput["serviceType"],

    title: mapRequiredString(
      input.title
    ),

    description:
      mapOptionalString(
        input.description
      ),

    active:
      mapOptionalBoolean(
        input.active
      ),

    updatedBy:
      mapRequiredString(
        input.updatedBy
      ),
  };
}

/**
 * Maps a stored vendor service entity.
 */
export function mapVendorService(
  input: VendorMapperInput<VendorService>
): VendorService {
  return {
    id: mapRequiredString(
      input.id
    ),

    serviceType:
      input.serviceType as VendorService["serviceType"],

    title: mapRequiredString(
      input.title
    ),

    description:
      mapOptionalString(
        input.description
      ),

    active: mapBoolean(
      input.active,
      true
    ),

    createdAt:
      mapRequiredDate(
        input.createdAt
      ),

    updatedAt:
      mapRequiredDate(
        input.updatedAt
      ),
  };
}

/**
 * Maps an array of vendor services.
 */
export function mapVendorServices(
  input:
    | Array<
        VendorMapperInput<VendorService>
      >
    | null
    | undefined
): VendorService[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map(
    mapVendorService
  );
}

/**
 * Maps shared vendor-pricing fields.
 */
function mapVendorPricingFields(
  input: VendorMapperInput<
    AddVendorPricingInput
  >
): Omit<
  AddVendorPricingInput,
  "updatedBy"
> {
  return {
    serviceType:
      input.serviceType as AddVendorPricingInput["serviceType"],

    pricingType:
      input.pricingType as AddVendorPricingInput["pricingType"],

    basePrice:
      mapOptionalNonNegativeNumber(
        input.basePrice
      ),

    minimumPrice:
      mapOptionalNonNegativeNumber(
        input.minimumPrice
      ),

    pricePerKilometre:
      mapOptionalNonNegativeNumber(
        input.pricePerKilometre
      ),

    pricePerKilogram:
      mapOptionalNonNegativeNumber(
        input.pricePerKilogram
      ),

    pricePerItem:
      mapOptionalNonNegativeNumber(
        input.pricePerItem
      ),

    labourCharge:
      mapOptionalNonNegativeNumber(
        input.labourCharge
      ),

    packingCharge:
      mapOptionalNonNegativeNumber(
        input.packingCharge
      ),

    loadingCharge:
      mapOptionalNonNegativeNumber(
        input.loadingCharge
      ),

    unloadingCharge:
      mapOptionalNonNegativeNumber(
        input.unloadingCharge
      ),

    insuranceChargePercentage:
      mapOptionalPercentage(
        input.insuranceChargePercentage
      ),

    taxPercentage:
      mapOptionalPercentage(
        input.taxPercentage
      ),

    currency:
      mapOptionalUppercaseString(
        input.currency
      ),

    active:
      mapOptionalBoolean(
        input.active
      ),

    effectiveFrom:
      mapOptionalDate(
        input.effectiveFrom
      ),

    effectiveUntil:
      mapOptionalDate(
        input.effectiveUntil
      ),
  };
}

/**
 * Maps input used to add vendor pricing.
 */
export function mapAddVendorPricingInput(
  input: VendorMapperInput<AddVendorPricingInput>
): AddVendorPricingInput {
  return {
    ...mapVendorPricingFields(
      input
    ),

    updatedBy:
      mapRequiredString(
        input.updatedBy
      ),
  };
}

/**
 * Maps a stored vendor-pricing entity.
 */
export function mapVendorPricing(
  input: VendorMapperInput<VendorPricing>
): VendorPricing {
  const mappedFields =
    mapVendorPricingFields(
      input as VendorMapperInput<
        AddVendorPricingInput
      >
    );

  return {
    id: mapRequiredString(
      input.id
    ),

    ...mappedFields,

    currency:
      mappedFields.currency ??
      "INR",

    active:
      mappedFields.active ??
      true,

    createdAt:
      mapRequiredDate(
        input.createdAt
      ),

    updatedAt:
      mapRequiredDate(
        input.updatedAt
      ),
  };
}

/**
 * Maps an array of vendor-pricing records.
 */
export function mapVendorPricingList(
  input:
    | Array<
        VendorMapperInput<VendorPricing>
      >
    | null
    | undefined
): VendorPricing[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map(
    mapVendorPricing
  );
}

/**
 * Creates a defensive copy of a vendor service area.
 */
export function cloneVendorServiceArea(
  serviceArea: VendorServiceArea
): VendorServiceArea {
  return mapVendorServiceArea(
    serviceArea
  );
}

/**
 * Creates a defensive copy of a vendor service.
 */
export function cloneVendorService(
  service: VendorService
): VendorService {
  return mapVendorService(service);
}

/**
 * Creates a defensive copy of vendor pricing.
 */
export function cloneVendorPricing(
  pricing: VendorPricing
): VendorPricing {
  return mapVendorPricing(pricing);
}
/**
 * ============================================================
 * Part C
 * ============================================================
 *
 * - Vendor vehicle mapping
 * - Vendor document mapping
 * - Document-review mapping
 * - Vendor bank-details mapping
 * ============================================================
 */

/**
 * Maps an optional uppercase alphanumeric identifier.
 *
 * Useful for:
 *
 * - Vehicle registration numbers
 * - Insurance policy numbers
 * - Permit numbers
 * - Document numbers
 * - IFSC codes
 */
function mapOptionalIdentifier(
  value: unknown
): string | undefined {
  const normalized =
    mapOptionalString(value);

  if (!normalized) {
    return undefined;
  }

  return normalized
    .replace(/\s+/g, "")
    .toUpperCase();
}

/**
 * Maps a required uppercase identifier.
 */
function mapRequiredIdentifier(
  value: unknown
): string {
  return (
    mapOptionalIdentifier(value) ??
    ""
  );
}

/**
 * Maps a vehicle registration number.
 *
 * Spaces and hyphens are removed so values such as:
 *
 * MP 04 AB 1234
 * MP-04-AB-1234
 *
 * become:
 *
 * MP04AB1234
 */
function mapVehicleRegistrationNumber(
  value: unknown
): string {
  const normalized =
    mapRequiredString(value);

  return normalized
    .replace(/[\s-]+/g, "")
    .toUpperCase();
}

/**
 * Maps a bank-account number.
 *
 * Spaces and hyphens are removed while the value remains
 * a string to prevent precision loss.
 */
function mapBankAccountNumber(
  value: unknown
): string {
  return mapRequiredString(value).replace(
    /[\s-]+/g,
    ""
  );
}

/**
 * Maps an optional UPI ID.
 */
function mapOptionalUPIId(
  value: unknown
): string | undefined {
  return mapOptionalLowercaseString(
    value
  );
}

/**
 * Maps shared vehicle fields.
 */
function mapVendorVehicleFields(
  input: VendorMapperInput<
    AddVendorVehicleInput
  >
): Omit<
  AddVendorVehicleInput,
  "updatedBy"
> {
  return {
    registrationNumber:
      mapVehicleRegistrationNumber(
        input.registrationNumber
      ),

    vehicleType:
      input.vehicleType as AddVendorVehicleInput["vehicleType"],

    manufacturer:
      mapOptionalString(
        input.manufacturer
      ),

    model:
      mapOptionalString(
        input.model
      ),

    manufacturingYear:
      mapOptionalInteger(
        input.manufacturingYear
      ),

    capacityInKilograms:
      mapOptionalNonNegativeNumber(
        input.capacityInKilograms
      ),

    capacityInCubicFeet:
      mapOptionalNonNegativeNumber(
        input.capacityInCubicFeet
      ),

    insuranceNumber:
      mapOptionalIdentifier(
        input.insuranceNumber
      ),

    insuranceExpiryDate:
      mapOptionalDate(
        input.insuranceExpiryDate
      ),

    permitNumber:
      mapOptionalIdentifier(
        input.permitNumber
      ),

    permitExpiryDate:
      mapOptionalDate(
        input.permitExpiryDate
      ),

    pollutionCertificateExpiryDate:
      mapOptionalDate(
        input.pollutionCertificateExpiryDate
      ),

    status:
      input.status as AddVendorVehicleInput["status"],

    active:
      mapOptionalBoolean(
        input.active
      ),
  };
}

/**
 * Maps input used to add a vendor vehicle.
 */
export function mapAddVendorVehicleInput(
  input: VendorMapperInput<AddVendorVehicleInput>
): AddVendorVehicleInput {
  return {
    ...mapVendorVehicleFields(
      input
    ),

    updatedBy:
      mapRequiredString(
        input.updatedBy
      ),
  };
}

/**
 * Maps a stored vendor vehicle.
 */
export function mapVendorVehicle(
  input: VendorMapperInput<VendorVehicle>
): VendorVehicle {
  const mappedFields =
    mapVendorVehicleFields(
      input as VendorMapperInput<
        AddVendorVehicleInput
      >
    );

  return {
    ...input,

    id:
      mapRequiredString(
        input.id
      ),

    ...mappedFields,

    active:
      mappedFields.active ??
      true,

    createdAt:
      mapRequiredDate(
        input.createdAt
      ),

    updatedAt:
      mapRequiredDate(
        input.updatedAt
      ),
  } as VendorVehicle;
}

/**
 * Maps an array of vendor vehicles.
 */
export function mapVendorVehicles(
  input:
    | Array<
        VendorMapperInput<VendorVehicle>
      >
    | null
    | undefined
): VendorVehicle[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map(
    mapVendorVehicle
  );
}

/**
 * Creates a defensive copy of a vendor vehicle.
 */
export function cloneVendorVehicle(
  vehicle: VendorVehicle
): VendorVehicle {
  return mapVendorVehicle(vehicle);
}

/**
 * Maps shared vendor-document fields.
 */
function mapVendorDocumentFields(
  input: VendorMapperInput<
    AddVendorDocumentInput
  >
): Omit<
  AddVendorDocumentInput,
  "updatedBy"
> {
  return {
    documentType:
      input.documentType as AddVendorDocumentInput["documentType"],

    documentNumber:
      mapOptionalIdentifier(
        input.documentNumber
      ),

    documentUrl:
      mapRequiredString(
        input.documentUrl
      ),

    fileName:
      mapOptionalString(
        input.fileName
      ),

    mimeType:
      mapOptionalLowercaseString(
        input.mimeType
      ),

    issuedAt:
      mapOptionalDate(
        input.issuedAt
      ),

    expiresAt:
      mapOptionalDate(
        input.expiresAt
      ),
  };
}

/**
 * Maps input used to add vendor document metadata.
 */
export function mapAddVendorDocumentInput(
  input: VendorMapperInput<AddVendorDocumentInput>
): AddVendorDocumentInput {
  return {
    ...mapVendorDocumentFields(
      input
    ),

    updatedBy:
      mapRequiredString(
        input.updatedBy
      ),
  };
}

/**
 * Maps input used to review a vendor document.
 */
export function mapReviewVendorDocumentInput(
  input: VendorMapperInput<ReviewVendorDocumentInput>
): ReviewVendorDocumentInput {
  return {
    status:
      input.status as ReviewVendorDocumentInput["status"],

    rejectionReason:
      input.rejectionReason ===
      undefined
        ? undefined
        : mapOptionalString(
            input.rejectionReason
          ),

    verifiedBy:
      mapRequiredString(
        input.verifiedBy
      ),
  };
}

/**
 * Maps a stored vendor document.
 */
export function mapVendorDocument(
  input: VendorMapperInput<VendorDocument>
): VendorDocument {
  const mappedFields =
    mapVendorDocumentFields(
      input as VendorMapperInput<
        AddVendorDocumentInput
      >
    );

  return {
    ...input,

    id:
      mapRequiredString(
        input.id
      ),

    ...mappedFields,

    status:
      input.status as VendorDocument["status"],

    rejectionReason:
      mapOptionalString(
        input.rejectionReason
      ),

    verifiedAt:
      mapOptionalDate(
        input.verifiedAt
      ),

    verifiedBy:
      mapOptionalString(
        input.verifiedBy
      ),

    createdAt:
      mapRequiredDate(
        input.createdAt
      ),

    updatedAt:
      mapRequiredDate(
        input.updatedAt
      ),
  } as VendorDocument;
}

/**
 * Maps an array of vendor documents.
 */
export function mapVendorDocuments(
  input:
    | Array<
        VendorMapperInput<VendorDocument>
      >
    | null
    | undefined
): VendorDocument[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map(
    mapVendorDocument
  );
}

/**
 * Creates a defensive copy of a vendor document.
 */
export function cloneVendorDocument(
  document: VendorDocument
): VendorDocument {
  return mapVendorDocument(document);
}

/**
 * Maps shared bank-detail fields.
 */
function mapVendorBankDetailFields(
  input: VendorMapperInput<
    UpdateVendorBankDetailsInput
  >
): Omit<
  UpdateVendorBankDetailsInput,
  "updatedBy"
> {
  return {
    accountHolderName:
      mapRequiredString(
        input.accountHolderName
      ),

    bankName:
      mapRequiredString(
        input.bankName
      ),

    accountNumber:
      mapBankAccountNumber(
        input.accountNumber
      ),

    accountType:
      input.accountType as UpdateVendorBankDetailsInput["accountType"],

    ifscCode:
      mapRequiredIdentifier(
        input.ifscCode
      ),

    branchName:
      mapOptionalString(
        input.branchName
      ),

    upiId:
      mapOptionalUPIId(
        input.upiId
      ),
  };
}

/**
 * Maps input used to add or replace vendor bank details.
 */
export function mapUpdateVendorBankDetailsInput(
  input: VendorMapperInput<UpdateVendorBankDetailsInput>
): UpdateVendorBankDetailsInput {
  return {
    ...mapVendorBankDetailFields(
      input
    ),

    updatedBy:
      mapRequiredString(
        input.updatedBy
      ),
  };
}

/**
 * Maps a stored vendor bank-details object.
 */
/**
 * Maps a stored vendor bank-details object.
 */
/**
 * Maps a stored vendor bank-details object.
 */
export function mapVendorBankDetails(
  input: VendorMapperInput<VendorBankDetails>
): VendorBankDetails {
  const mappedFields =
    mapVendorBankDetailFields(
      input as VendorMapperInput<
        UpdateVendorBankDetailsInput
      >
    );

  return {
    ...input,

    ...mappedFields,

    verified:
      mapBoolean(
        input.verified,
        false
      ),

    verifiedAt:
      mapOptionalDate(
        input.verifiedAt
      ),
  } as VendorBankDetails;
}
/**
 * Maps optional vendor bank details.
 */
export function mapOptionalVendorBankDetails(
  input:
    | VendorMapperInput<VendorBankDetails>
    | null
    | undefined
): VendorBankDetails | undefined {
  if (!input) {
    return undefined;
  }

  const hasBankData =
    Object.values(input).some(
      (value) =>
        value !== undefined &&
        value !== null &&
        value !== ""
    );

  if (!hasBankData) {
    return undefined;
  }

  return mapVendorBankDetails(input);
}

/**
 * Creates a defensive copy of vendor bank details.
 */
export function cloneVendorBankDetails(
  bankDetails: VendorBankDetails
): VendorBankDetails {
  return mapVendorBankDetails(
    bankDetails
  );
}
/**
 * ============================================================
 * Part 4
 * ============================================================
 *
 * Complete Vendor Aggregate Mapping
 *
 * Responsibilities
 * ----------------
 * - Map the complete vendor profile
 * - Map optional vendor sections safely
 * - Map arrays through their dedicated mappers
 * - Create defensive aggregate copies
 * - Provide reusable collection utilities
 *
 * Important
 * ---------
 * This section uses a local aggregate interface so that it
 * does not depend on an unknown or future Vendor aggregate
 * model.
 *
 * The interface can later be moved into vendor.model.ts when
 * the repository and service contracts are finalized.
 * ============================================================
 */

/**
 * Complete vendor aggregate handled by this mapper.
 *
 * This combines the domain sections implemented in Parts
 * A, B, and C.
 */
export interface VendorAggregate {
  id: string;

  vendorCode?: string;

  businessDetails:
    VendorBusinessDetails;

  ownerDetails:
    VendorOwnerDetails;

  contact:
    VendorContact;

  registeredAddress:
    VendorAddress;

  operationalAddress?:
    VendorAddress;

  serviceAreas:
    VendorServiceArea[];

  services:
    VendorService[];

  pricing:
    VendorPricing[];

  vehicles:
    VendorVehicle[];

  documents:
    VendorDocument[];

  bankDetails?:
    VendorBankDetails;

  active?: boolean;

  createdAt?: Date;

  updatedAt?: Date;
}

/**
 * Partial aggregate input accepted by the mapper.
 *
 * Required domain sections remain required at the output,
 * but incoming values may be incomplete or nullable.
 */
export interface VendorAggregateMapperInput {
  id?: unknown;

  vendorCode?: unknown;

  businessDetails?:
    VendorMapperInput<VendorBusinessDetails>
    | null;

  ownerDetails?:
    VendorMapperInput<VendorOwnerDetails>
    | null;

  contact?:
    VendorMapperInput<VendorContact>
    | null;

  registeredAddress?:
    VendorMapperInput<VendorAddress>
    | null;

  operationalAddress?:
    VendorMapperInput<VendorAddress>
    | null;

  serviceAreas?:
    Array<
      VendorMapperInput<VendorServiceArea>
    >
    | null;

  services?:
    Array<
      VendorMapperInput<VendorService>
    >
    | null;

  pricing?:
    Array<
      VendorMapperInput<VendorPricing>
    >
    | null;

  vehicles?:
    Array<
      VendorMapperInput<VendorVehicle>
    >
    | null;

  documents?:
    Array<
      VendorMapperInput<VendorDocument>
    >
    | null;

  bankDetails?:
    VendorMapperInput<VendorBankDetails>
    | null;

  active?: unknown;

  createdAt?: unknown;

  updatedAt?: unknown;
}

/**
 * Maps the complete vendor aggregate.
 *
 * Missing required nested objects are mapped from empty
 * objects. The validator should be called after mapping to
 * report any required-field errors.
 */
export function mapVendorAggregate(
  input: VendorAggregateMapperInput
): VendorAggregate {
  return {
    id:
      mapRequiredString(
        input.id
      ),

    vendorCode:
      mapOptionalUppercaseString(
        input.vendorCode
      ),

    businessDetails:
      mapVendorBusinessDetails(
        input.businessDetails ?? {}
      ),

    ownerDetails:
      mapVendorOwnerDetails(
        input.ownerDetails ?? {}
      ),

    contact:
      mapVendorContact(
        input.contact ?? {}
      ),

    registeredAddress:
      mapVendorAddress(
        input.registeredAddress ?? {}
      ),

    operationalAddress:
      mapOptionalVendorAddress(
        input.operationalAddress
      ),

    serviceAreas:
      mapVendorServiceAreas(
        input.serviceAreas
      ),

    services:
      mapVendorServices(
        input.services
      ),

    pricing:
      mapVendorPricingList(
        input.pricing
      ),

    vehicles:
      mapVendorVehicles(
        input.vehicles
      ),

    documents:
      mapVendorDocuments(
        input.documents
      ),

    bankDetails:
      mapOptionalVendorBankDetails(
        input.bankDetails
      ),

    active:
      mapOptionalBoolean(
        input.active
      ),

    createdAt:
      mapOptionalDate(
        input.createdAt
      ),

    updatedAt:
      mapOptionalDate(
        input.updatedAt
      ),
  };
}

/**
 * Maps multiple complete vendor aggregates.
 */
export function mapVendorAggregates(
  input:
    | VendorAggregateMapperInput[]
    | null
    | undefined
): VendorAggregate[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map(
    mapVendorAggregate
  );
}

/**
 * Creates a deep defensive copy of a complete vendor
 * aggregate.
 *
 * Every nested object, array, and Date value is recreated
 * through its dedicated mapper.
 */
export function cloneVendorAggregate(
  vendor: VendorAggregate
): VendorAggregate {
  return mapVendorAggregate(
    vendor
  );
}

/**
 * Creates defensive copies of multiple vendor aggregates.
 */
export function cloneVendorAggregates(
  vendors:
    | VendorAggregate[]
    | null
    | undefined
): VendorAggregate[] {
  if (!Array.isArray(vendors)) {
    return [];
  }

  return vendors.map(
    cloneVendorAggregate
  );
}

/**
 * Determines whether the aggregate contains bank details.
 */
export function hasVendorBankDetails(
  vendor: VendorAggregate
): boolean {
  return vendor.bankDetails !== undefined;
}

/**
 * Determines whether registered and operational addresses
 * are available separately.
 */
export function hasSeparateOperationalAddress(
  vendor: VendorAggregate
): boolean {
  return (
    vendor.operationalAddress !==
    undefined
  );
}

/**
 * Returns only active service areas.
 */
export function getActiveVendorServiceAreas(
  vendor: VendorAggregate
): VendorServiceArea[] {
  return vendor.serviceAreas
    .filter(
      (serviceArea) =>
        serviceArea.active
    )
    .map(
      cloneVendorServiceArea
    );
}

/**
 * Returns only active services.
 */
export function getActiveVendorServices(
  vendor: VendorAggregate
): VendorService[] {
  return vendor.services
    .filter(
      (service) =>
        service.active
    )
    .map(
      cloneVendorService
    );
}

/**
 * Returns only active pricing records.
 */
export function getActiveVendorPricing(
  vendor: VendorAggregate
): VendorPricing[] {
  return vendor.pricing
    .filter(
      (pricing) =>
        pricing.active
    )
    .map(
      cloneVendorPricing
    );
}

/**
 * Returns only active vehicles.
 */
export function getActiveVendorVehicles(
  vendor: VendorAggregate
): VendorVehicle[] {
  return vendor.vehicles
    .filter(
      (vehicle) =>
        vehicle.active
    )
    .map(
      cloneVendorVehicle
    );
}

/**
 * Returns documents that have completed verification.
 *
 * The exact enum value is not assumed here. This keeps the
 * mapper independent from runtime enum imports.
 */
export function getVerifiedVendorDocuments(
  vendor: VendorAggregate
): VendorDocument[] {
  return vendor.documents
    .filter(
      (document) =>
        String(
          document.status
        ).toUpperCase() ===
        "VERIFIED"
    )
    .map(
      cloneVendorDocument
    );
}

/**
 * Returns documents rejected during verification.
 */
export function getRejectedVendorDocuments(
  vendor: VendorAggregate
): VendorDocument[] {
  return vendor.documents
    .filter(
      (document) =>
        String(
          document.status
        ).toUpperCase() ===
        "REJECTED"
    )
    .map(
      cloneVendorDocument
    );
}

/**
 * Finds a vendor service by service type.
 */
export function findVendorServiceByType(
  vendor: VendorAggregate,
  serviceType:
    VendorService["serviceType"]
): VendorService | undefined {
  const service =
    vendor.services.find(
      (item) =>
        item.serviceType ===
        serviceType
    );

  return service
    ? cloneVendorService(service)
    : undefined;
}

/**
 * Finds the first pricing record for a service type.
 */
export function findVendorPricingByServiceType(
  vendor: VendorAggregate,
  serviceType:
    VendorPricing["serviceType"]
): VendorPricing | undefined {
  const pricing =
    vendor.pricing.find(
      (item) =>
        item.serviceType ===
        serviceType
    );

  return pricing
    ? cloneVendorPricing(pricing)
    : undefined;
}

/**
 * Finds a vehicle using its normalized registration number.
 */
export function findVendorVehicleByRegistrationNumber(
  vendor: VendorAggregate,
  registrationNumber: string
): VendorVehicle | undefined {
  const normalizedRegistration =
    mapVehicleRegistrationNumber(
      registrationNumber
    );

  const vehicle =
    vendor.vehicles.find(
      (item) =>
        mapVehicleRegistrationNumber(
          item.registrationNumber
        ) ===
        normalizedRegistration
    );

  return vehicle
    ? cloneVendorVehicle(vehicle)
    : undefined;
}

/**
 * Finds a vendor document by document type.
 */
export function findVendorDocumentByType(
  vendor: VendorAggregate,
  documentType:
    VendorDocument["documentType"]
): VendorDocument | undefined {
  const document =
    vendor.documents.find(
      (item) =>
        item.documentType ===
        documentType
    );

  return document
    ? cloneVendorDocument(document)
    : undefined;
}

/**
 * Returns a compact aggregate summary.
 */
export interface VendorAggregateSummary {
  id: string;

  vendorCode?: string;

  companyName: string;

  ownerName: string;

  primaryPhone: string;

  email: string;

  city: string;

  state: string;

  serviceAreaCount: number;

  serviceCount: number;

  pricingCount: number;

  vehicleCount: number;

  documentCount: number;

  hasBankDetails: boolean;

  active?: boolean;
}

/**
 * Maps a vendor aggregate to a compact summary.
 *
 * This is suitable for:
 *
 * - Admin vendor lists
 * - Search results
 * - Dashboard tables
 * - Internal dropdowns
 */
export function mapVendorAggregateSummary(
  vendor: VendorAggregate
): VendorAggregateSummary {
  return {
    id:
      vendor.id,

    vendorCode:
      vendor.vendorCode,

    companyName:
      vendor.businessDetails
        .companyName,

    ownerName:
      vendor.ownerDetails
        .fullName,

    primaryPhone:
      vendor.contact
        .primaryPhone,

    email:
      vendor.contact
        .email,

    city:
      vendor.registeredAddress
        .city,

    state:
      vendor.registeredAddress
        .state,

    serviceAreaCount:
      vendor.serviceAreas.length,

    serviceCount:
      vendor.services.length,

    pricingCount:
      vendor.pricing.length,

    vehicleCount:
      vendor.vehicles.length,

    documentCount:
      vendor.documents.length,

    hasBankDetails:
      hasVendorBankDetails(
        vendor
      ),

    active:
      vendor.active,
  };
}

/**
 * Maps multiple vendor aggregates to compact summaries.
 */
export function mapVendorAggregateSummaries(
  vendors:
    | VendorAggregate[]
    | null
    | undefined
): VendorAggregateSummary[] {
  if (!Array.isArray(vendors)) {
    return [];
  }

  return vendors.map(
    mapVendorAggregateSummary
  );
}

/**
 * Removes duplicate vendor aggregates using vendor ID.
 *
 * The first matching aggregate is retained.
 */
export function removeDuplicateVendorAggregates(
  vendors:
    | VendorAggregate[]
    | null
    | undefined
): VendorAggregate[] {
  if (!Array.isArray(vendors)) {
    return [];
  }

  const uniqueVendors =
    new Map<
      string,
      VendorAggregate
    >();

  for (const vendor of vendors) {
    if (
      !uniqueVendors.has(
        vendor.id
      )
    ) {
      uniqueVendors.set(
        vendor.id,
        cloneVendorAggregate(
          vendor
        )
      );
    }
  }

  return [
    ...uniqueVendors.values(),
  ];
}

/**
 * Sorts vendors alphabetically by company name.
 *
 * The source array is not mutated.
 */
export function sortVendorsByCompanyName(
  vendors:
    | VendorAggregate[]
    | null
    | undefined
): VendorAggregate[] {
  return cloneVendorAggregates(
    vendors
  ).sort(
    (firstVendor, secondVendor) =>
      firstVendor.businessDetails
        .companyName.localeCompare(
          secondVendor
            .businessDetails
            .companyName,
          undefined,
          {
            sensitivity: "base",
          }
        )
  );
}

/**
 * Returns only active vendor aggregates.
 */
export function getActiveVendorAggregates(
  vendors:
    | VendorAggregate[]
    | null
    | undefined
): VendorAggregate[] {
  if (!Array.isArray(vendors)) {
    return [];
  }

  return vendors
    .filter(
      (vendor) =>
        vendor.active === true
    )
    .map(
      cloneVendorAggregate
    );
}

/**
 * ============================================================
 * End of Vendor Mapper
 * ============================================================
 */