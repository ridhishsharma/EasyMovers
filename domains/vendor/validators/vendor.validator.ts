/**
 * ============================================================
 * EasyMovers
 * Vendor Domain Validators
 * ============================================================
 *
 * Part 1
 * ------
 * - Validation result types
 * - Shared validation helpers
 * - Business details validation
 * - Owner details validation
 * - Contact validation
 * - Address validation
 * ============================================================
 */

import {
  VendorBankAccountType,
  VendorDocumentStatus,
  VendorDocumentType,
  VendorPricingType,
  VendorServiceScope,
  VendorServiceType,
  VendorVehicleStatus,
  VendorVehicleType,
  VendorBusinessType,
} from "../models/vendor.model";

import type {
  AddVendorDocumentInput,
  AddVendorPricingInput,
  AddVendorServiceAreaInput,
  AddVendorVehicleInput,
  ReviewVendorDocumentInput,
  UpdateVendorBankDetailsInput,
  UpdateVendorServiceAreaInput,
  UpsertVendorServiceInput,
  VendorAddress,
  VendorBankDetails,
  VendorBusinessDetails,
  VendorContact,
  VendorDocument,
  VendorOwnerDetails,
  VendorPricing,
  VendorService,
  VendorServiceArea,
  VendorVehicle,
} from "../models/vendor.model";
/**
 * Validation error returned by Vendor validators.
 */
export interface VendorValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Common validation result.
 */
export interface VendorValidationResult {
  valid: boolean;
  errors: VendorValidationError[];
}

/**
 * Creates a successful validation result.
 */
function validResult(): VendorValidationResult {
  return {
    valid: true,
    errors: [],
  };
}

/**
 * Creates a validation result from collected errors.
 */
function resultFromErrors(
  errors: VendorValidationError[]
): VendorValidationResult {
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Adds a validation error.
 */
function addError(
  errors: VendorValidationError[],
  field: string,
  message: string,
  code: string
): void {
  errors.push({
    field,
    message,
    code,
  });
}

/**
 * Checks whether a value is a non-empty string.
 */
function isNonEmptyString(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

/**
 * Checks whether a value is a valid optional string.
 */
function isOptionalString(
  value: unknown
): value is string | undefined {
  return (
    value === undefined ||
    typeof value === "string"
  );
}

/**
 * Normalises a string for validation.
 */
function normalizeString(
  value: string | undefined
): string {
  return value?.trim() ?? "";
}

/**
 * Checks whether a number is finite.
 */
function isFiniteNumber(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

/**
 * Checks whether a number is non-negative.
 */
function isNonNegativeNumber(
  value: unknown
): value is number {
  return (
    isFiniteNumber(value) &&
    value >= 0
  );
}

/**
 * Checks whether a value is a valid percentage.
 */
function isPercentage(
  value: unknown
): value is number {
  return (
    isFiniteNumber(value) &&
    value >= 0 &&
    value <= 100
  );
}

/**
 * Checks whether a value is a valid email address.
 */
function isValidEmail(
  value: string
): boolean {
  const email = value.trim();

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

/**
 * Checks whether a value is a valid Indian mobile number.
 *
 * Accepted examples:
 * 9876543210
 * +919876543210
 * 919876543210
 */
function isValidIndianMobileNumber(
  value: string
): boolean {
  const normalized = value.replace(
    /[\s\-()]/g,
    ""
  );

  return /^(?:\+91|91)?[6-9]\d{9}$/.test(
    normalized
  );
}

/**
 * Checks whether a value is a reasonable landline number.
 */
function isValidLandlineNumber(
  value: string
): boolean {
  const normalized = value.replace(
    /[\s\-()]/g,
    ""
  );

  return /^(?:\+91|91)?0?\d{7,11}$/.test(
    normalized
  );
}

/**
 * Checks whether a value is a valid postal code.
 */
function isValidIndianPostalCode(
  value: string
): boolean {
  return /^[1-9][0-9]{5}$/.test(
    value.trim()
  );
}

/**
 * Checks whether a value is a valid GST number.
 */
function isValidGSTNumber(
  value: string
): boolean {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i.test(
    value.trim()
  );
}

/**
 * Checks whether a value is a valid PAN number.
 */
function isValidPANNumber(
  value: string
): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(
    value.trim()
  );
}

/**
 * Checks whether a value is a valid Aadhaar number.
 *
 * This validates only the basic 12-digit format.
 * Verhoeff checksum validation may be added later.
 */
function isValidAadhaarNumber(
  value: string
): boolean {
  const normalized = value.replace(
    /[\s-]/g,
    ""
  );

  return /^[2-9][0-9]{11}$/.test(
    normalized
  );
}

/**
 * Checks whether a year is within a reasonable range.
 */
function isValidEstablishedYear(
  value: number
): boolean {
  const currentYear =
    new Date().getFullYear();

  return (
    Number.isInteger(value) &&
    value >= 1800 &&
    value <= currentYear
  );
}

/**
 * Checks whether a date string is valid.
 */
function isValidDateString(
  value: string
): boolean {
  const timestamp = Date.parse(value);

  return !Number.isNaN(timestamp);
}

/**
 * Checks whether latitude is valid.
 */
function isValidLatitude(
  value: number
): boolean {
  return value >= -90 && value <= 90;
}

/**
 * Checks whether longitude is valid.
 */
function isValidLongitude(
  value: number
): boolean {
  return value >= -180 && value <= 180;
}

/**
 * Validates VendorBusinessDetails.
 */
export function validateVendorBusinessDetails(
  business: VendorBusinessDetails
): VendorValidationResult {
  const errors: VendorValidationError[] = [];

  if (!business) {
    addError(
      errors,
      "business",
      "Vendor business details are required.",
      "BUSINESS_DETAILS_REQUIRED"
    );

    return resultFromErrors(errors);
  }

  if (
    !isNonEmptyString(
      business.companyName
    )
  ) {
    addError(
      errors,
      "business.companyName",
      "Company name is required.",
      "COMPANY_NAME_REQUIRED"
    );
  } else if (
    business.companyName.trim().length < 2
  ) {
    addError(
      errors,
      "business.companyName",
      "Company name must contain at least 2 characters.",
      "COMPANY_NAME_TOO_SHORT"
    );
  } else if (
    business.companyName.trim().length > 150
  ) {
    addError(
      errors,
      "business.companyName",
      "Company name cannot exceed 150 characters.",
      "COMPANY_NAME_TOO_LONG"
    );
  }

  if (
    business.legalName !== undefined &&
    !isNonEmptyString(business.legalName)
  ) {
    addError(
      errors,
      "business.legalName",
      "Legal name cannot be empty when provided.",
      "INVALID_LEGAL_NAME"
    );
  }

  if (
    business.tradeName !== undefined &&
    !isNonEmptyString(business.tradeName)
  ) {
    addError(
      errors,
      "business.tradeName",
      "Trade name cannot be empty when provided.",
      "INVALID_TRADE_NAME"
    );
  }

  if (
    business.registrationNumber !==
      undefined &&
    !isNonEmptyString(
      business.registrationNumber
    )
  ) {
    addError(
      errors,
      "business.registrationNumber",
      "Registration number cannot be empty when provided.",
      "INVALID_REGISTRATION_NUMBER"
    );
  }

  if (
    business.gstNumber !== undefined
  ) {
    if (
      !isNonEmptyString(
        business.gstNumber
      )
    ) {
      addError(
        errors,
        "business.gstNumber",
        "GST number cannot be empty when provided.",
        "INVALID_GST_NUMBER"
      );
    } else if (
      !isValidGSTNumber(
        business.gstNumber
      )
    ) {
      addError(
        errors,
        "business.gstNumber",
        "GST number format is invalid.",
        "INVALID_GST_NUMBER"
      );
    }
  }

  if (
    business.panNumber !== undefined
  ) {
    if (
      !isNonEmptyString(
        business.panNumber
      )
    ) {
      addError(
        errors,
        "business.panNumber",
        "PAN number cannot be empty when provided.",
        "INVALID_PAN_NUMBER"
      );
    } else if (
      !isValidPANNumber(
        business.panNumber
      )
    ) {
      addError(
        errors,
        "business.panNumber",
        "PAN number format is invalid.",
        "INVALID_PAN_NUMBER"
      );
    }
  }

  if (
    business.establishedYear !==
      undefined &&
    !isValidEstablishedYear(
      business.establishedYear
    )
  ) {
    addError(
      errors,
      "business.establishedYear",
      "Established year is invalid.",
      "INVALID_ESTABLISHED_YEAR"
    );
  }

  if (!business.category) {
    addError(
      errors,
      "business.category",
      "Vendor category is required.",
      "VENDOR_CATEGORY_REQUIRED"
    );
  }
  if (
    business.businessType !== undefined &&
    !isEnumValue(VendorBusinessType, business.businessType)
  ) {
    addError(
      errors,
      "business.businessType",
      "Vendor business type is invalid.",
      "INVALID_VENDOR_BUSINESS_TYPE"
    );
  }
  return resultFromErrors(errors);
}

/**
 * Validates VendorOwnerDetails.
 */
export function validateVendorOwnerDetails(
  owner: VendorOwnerDetails
): VendorValidationResult {
  const errors: VendorValidationError[] = [];

  if (!owner) {
    addError(
      errors,
      "owner",
      "Vendor owner details are required.",
      "OWNER_DETAILS_REQUIRED"
    );

    return resultFromErrors(errors);
  }

  if (
    !isNonEmptyString(owner.fullName)
  ) {
    addError(
      errors,
      "owner.fullName",
      "Owner name is required.",
      "OWNER_NAME_REQUIRED"
    );
  } else if (
    owner.fullName.trim().length < 2
  ) {
    addError(
      errors,
      "owner.fullName",
      "Owner name must contain at least 2 characters.",
      "OWNER_NAME_TOO_SHORT"
    );
  } else if (
    owner.fullName.trim().length > 120
  ) {
    addError(
      errors,
      "owner.fullName",
      "Owner name cannot exceed 120 characters.",
      "OWNER_NAME_TOO_LONG"
    );
  }

  if (
    owner.fatherName !== undefined &&
    !isNonEmptyString(owner.fatherName)
  ) {
    addError(
      errors,
      "owner.fatherName",
      "Father's name cannot be empty when provided.",
      "INVALID_FATHER_NAME"
    );
  }

  if (
    owner.dateOfBirth !== undefined
  ) {
    if (
      !isNonEmptyString(
        owner.dateOfBirth
      ) ||
      !isValidDateString(
        owner.dateOfBirth
      )
    ) {
      addError(
        errors,
        "owner.dateOfBirth",
        "Owner date of birth is invalid.",
        "INVALID_OWNER_DATE_OF_BIRTH"
      );
    } else {
      const dateOfBirth = new Date(
        owner.dateOfBirth
      );

      const today = new Date();

      if (dateOfBirth > today) {
        addError(
          errors,
          "owner.dateOfBirth",
          "Owner date of birth cannot be in the future.",
          "FUTURE_OWNER_DATE_OF_BIRTH"
        );
      }
    }
  }

  if (
    owner.aadhaarNumber !== undefined
  ) {
    if (
      !isNonEmptyString(
        owner.aadhaarNumber
      ) ||
      !isValidAadhaarNumber(
        owner.aadhaarNumber
      )
    ) {
      addError(
        errors,
        "owner.aadhaarNumber",
        "Aadhaar number format is invalid.",
        "INVALID_AADHAAR_NUMBER"
      );
    }
  }

  if (
    owner.panNumber !== undefined
  ) {
    if (
      !isNonEmptyString(
        owner.panNumber
      ) ||
      !isValidPANNumber(
        owner.panNumber
      )
    ) {
      addError(
        errors,
        "owner.panNumber",
        "Owner PAN number format is invalid.",
        "INVALID_OWNER_PAN_NUMBER"
      );
    }
  }

  if (!isNonEmptyString(owner.phone)) {
    addError(
      errors,
      "owner.phone",
      "Owner phone number is required.",
      "OWNER_PHONE_REQUIRED"
    );
  } else if (
    !isValidIndianMobileNumber(
      owner.phone
    )
  ) {
    addError(
      errors,
      "owner.phone",
      "Owner phone number is invalid.",
      "INVALID_OWNER_PHONE"
    );
  }

  if (owner.email !== undefined) {
    if (
      !isNonEmptyString(owner.email)
    ) {
      addError(
        errors,
        "owner.email",
        "Owner email cannot be empty when provided.",
        "INVALID_OWNER_EMAIL"
      );
    } else if (
      !isValidEmail(owner.email)
    ) {
      addError(
        errors,
        "owner.email",
        "Owner email address is invalid.",
        "INVALID_OWNER_EMAIL"
      );
    }
  }

  return resultFromErrors(errors);
}

/**
 * Validates VendorContact.
 */
export function validateVendorContact(
  contact: VendorContact
): VendorValidationResult {
  const errors: VendorValidationError[] = [];

  if (!contact) {
    addError(
      errors,
      "contact",
      "Vendor contact details are required.",
      "CONTACT_DETAILS_REQUIRED"
    );

    return resultFromErrors(errors);
  }

  if (
    !isNonEmptyString(
      contact.primaryPhone
    )
  ) {
    addError(
      errors,
      "contact.primaryPhone",
      "Primary phone number is required.",
      "PRIMARY_PHONE_REQUIRED"
    );
  } else if (
    !isValidIndianMobileNumber(
      contact.primaryPhone
    )
  ) {
    addError(
      errors,
      "contact.primaryPhone",
      "Primary phone number is invalid.",
      "INVALID_PRIMARY_PHONE"
    );
  }

  if (
    contact.alternatePhone !== undefined
  ) {
    if (
      !isNonEmptyString(
        contact.alternatePhone
      ) ||
      !isValidIndianMobileNumber(
        contact.alternatePhone
      )
    ) {
      addError(
        errors,
        "contact.alternatePhone",
        "Alternate phone number is invalid.",
        "INVALID_ALTERNATE_PHONE"
      );
    } else if (
      contact.alternatePhone.replace(
        /\D/g,
        ""
      ) ===
      contact.primaryPhone.replace(
        /\D/g,
        ""
      )
    ) {
      addError(
        errors,
        "contact.alternatePhone",
        "Alternate phone number must be different from the primary phone number.",
        "DUPLICATE_CONTACT_PHONE"
      );
    }
  }

  if (contact.landline !== undefined) {
    if (
      !isNonEmptyString(
        contact.landline
      ) ||
      !isValidLandlineNumber(
        contact.landline
      )
    ) {
      addError(
        errors,
        "contact.landline",
        "Landline number is invalid.",
        "INVALID_LANDLINE_NUMBER"
      );
    }
  }

  if (!isNonEmptyString(contact.email)) {
    addError(
      errors,
      "contact.email",
      "Vendor email address is required.",
      "VENDOR_EMAIL_REQUIRED"
    );
  } else if (
    !isValidEmail(contact.email)
  ) {
    addError(
      errors,
      "contact.email",
      "Vendor email address is invalid.",
      "INVALID_VENDOR_EMAIL"
    );
  }

  if (contact.website !== undefined) {
    if (
      !isNonEmptyString(
        contact.website
      )
    ) {
      addError(
        errors,
        "contact.website",
        "Website cannot be empty when provided.",
        "INVALID_WEBSITE"
      );
    } else {
      try {
        const websiteUrl = new URL(
          contact.website
        );

        if (
          websiteUrl.protocol !== "http:" &&
          websiteUrl.protocol !== "https:"
        ) {
          addError(
            errors,
            "contact.website",
            "Website must use HTTP or HTTPS.",
            "INVALID_WEBSITE_PROTOCOL"
          );
        }
      } catch {
        addError(
          errors,
          "contact.website",
          "Website URL is invalid.",
          "INVALID_WEBSITE"
        );
      }
    }
  }

  if (
    contact.whatsappNumber !== undefined
  ) {
    if (
      !isNonEmptyString(
        contact.whatsappNumber
      ) ||
      !isValidIndianMobileNumber(
        contact.whatsappNumber
      )
    ) {
      addError(
        errors,
        "contact.whatsappNumber",
        "WhatsApp number is invalid.",
        "INVALID_WHATSAPP_NUMBER"
      );
    }
  }

  return resultFromErrors(errors);
}

/**
 * Validates VendorAddress.
 */
export function validateVendorAddress(
  address: VendorAddress,
  fieldPrefix = "address"
): VendorValidationResult {
  const errors: VendorValidationError[] = [];

  if (!address) {
    addError(
      errors,
      fieldPrefix,
      "Vendor address is required.",
      "ADDRESS_REQUIRED"
    );

    return resultFromErrors(errors);
  }

  if (
    !isNonEmptyString(
      address.addressLine1
    )
  ) {
    addError(
      errors,
      `${fieldPrefix}.addressLine1`,
      "Address line 1 is required.",
      "ADDRESS_LINE_1_REQUIRED"
    );
  } else if (
    address.addressLine1.trim().length >
    250
  ) {
    addError(
      errors,
      `${fieldPrefix}.addressLine1`,
      "Address line 1 cannot exceed 250 characters.",
      "ADDRESS_LINE_1_TOO_LONG"
    );
  }

  if (
    address.addressLine2 !== undefined &&
    !isNonEmptyString(
      address.addressLine2
    )
  ) {
    addError(
      errors,
      `${fieldPrefix}.addressLine2`,
      "Address line 2 cannot be empty when provided.",
      "INVALID_ADDRESS_LINE_2"
    );
  }

  if (
    address.landmark !== undefined &&
    !isNonEmptyString(
      address.landmark
    )
  ) {
    addError(
      errors,
      `${fieldPrefix}.landmark`,
      "Landmark cannot be empty when provided.",
      "INVALID_LANDMARK"
    );
  }

  if (!isNonEmptyString(address.city)) {
    addError(
      errors,
      `${fieldPrefix}.city`,
      "City is required.",
      "CITY_REQUIRED"
    );
  }

  if (
    address.district !== undefined &&
    !isNonEmptyString(
      address.district
    )
  ) {
    addError(
      errors,
      `${fieldPrefix}.district`,
      "District cannot be empty when provided.",
      "INVALID_DISTRICT"
    );
  }

  if (!isNonEmptyString(address.state)) {
    addError(
      errors,
      `${fieldPrefix}.state`,
      "State is required.",
      "STATE_REQUIRED"
    );
  }

  if (
    !isNonEmptyString(
      address.postalCode
    )
  ) {
    addError(
      errors,
      `${fieldPrefix}.postalCode`,
      "Postal code is required.",
      "POSTAL_CODE_REQUIRED"
    );
  } else if (
    !isValidIndianPostalCode(
      address.postalCode
    )
  ) {
    addError(
      errors,
      `${fieldPrefix}.postalCode`,
      "Postal code must be a valid 6-digit Indian PIN code.",
      "INVALID_POSTAL_CODE"
    );
  }

  if (
    !isNonEmptyString(address.country)
  ) {
    addError(
      errors,
      `${fieldPrefix}.country`,
      "Country is required.",
      "COUNTRY_REQUIRED"
    );
  }

  if (address.latitude !== undefined) {
    if (
      !isFiniteNumber(
        address.latitude
      ) ||
      !isValidLatitude(
        address.latitude
      )
    ) {
      addError(
        errors,
        `${fieldPrefix}.latitude`,
        "Latitude must be between -90 and 90.",
        "INVALID_LATITUDE"
      );
    }
  }

  if (address.longitude !== undefined) {
    if (
      !isFiniteNumber(
        address.longitude
      ) ||
      !isValidLongitude(
        address.longitude
      )
    ) {
      addError(
        errors,
        `${fieldPrefix}.longitude`,
        "Longitude must be between -180 and 180.",
        "INVALID_LONGITUDE"
      );
    }
  }

  if (
    (address.latitude === undefined) !==
    (address.longitude === undefined)
  ) {
    addError(
      errors,
      fieldPrefix,
      "Latitude and longitude must be provided together.",
      "INCOMPLETE_COORDINATES"
    );
  }

  return resultFromErrors(errors);
}


/**
 * Combines multiple validation results.
 */
export function combineVendorValidationResults(
  ...results: VendorValidationResult[]
): VendorValidationResult {
  if (results.length === 0) {
    return validResult();
  }

  const errors = results.flatMap(
    (result) => result.errors
  );

  return resultFromErrors(errors);
}

/**
 * ============================================================
 * Part 2
 * ============================================================
 *
 * - Service area validation
 * - Vendor service validation
 * - Vendor pricing validation
 * ============================================================
 */

/**
 * Checks whether a value belongs to an enum.
 */
function isEnumValue<T extends object>(
  enumObject: T,
  value: unknown
): value is T[keyof T] {
  return Object.values(enumObject).includes(
    value as T[keyof T]
  );
}

/**
 * Checks whether a string array contains only
 * non-empty values.
 */
function containsOnlyNonEmptyStrings(
  values: string[]
): boolean {
  return values.every(
    (value) => isNonEmptyString(value)
  );
}

/**
 * Checks whether a postal code array contains
 * only valid Indian PIN codes.
 */
function containsOnlyValidPostalCodes(
  postalCodes: string[]
): boolean {
  return postalCodes.every(
    (postalCode) =>
      isValidIndianPostalCode(postalCode)
  );
}

/**
 * Checks whether a date value is valid.
 */
function isValidDateValue(
  value: unknown
): value is Date {
  return (
    value instanceof Date &&
    !Number.isNaN(value.getTime())
  );
}

/**
 * Validates service-area business rules.
 */
function validateServiceAreaFields(
  input: {
    scope?: VendorServiceScope;
    originCity?: string;
    originState?: string;
    destinationCity?: string;
    destinationState?: string;
    serviceablePostalCodes?: string[];
    active?: boolean;
  },
  requireScope: boolean
): VendorValidationResult {
  const errors: VendorValidationError[] = [];

  if (requireScope && !input.scope) {
    addError(
      errors,
      "scope",
      "Vendor service scope is required.",
      "SERVICE_SCOPE_REQUIRED"
    );
  }

  if (
    input.scope !== undefined &&
    !isEnumValue(
      VendorServiceScope,
      input.scope
    )
  ) {
    addError(
      errors,
      "scope",
      "Vendor service scope is invalid.",
      "INVALID_SERVICE_SCOPE"
    );
  }

  if (
    input.originCity !== undefined &&
    !isNonEmptyString(input.originCity)
  ) {
    addError(
      errors,
      "originCity",
      "Origin city cannot be empty when provided.",
      "INVALID_ORIGIN_CITY"
    );
  }

  if (
    input.originState !== undefined &&
    !isNonEmptyString(input.originState)
  ) {
    addError(
      errors,
      "originState",
      "Origin state cannot be empty when provided.",
      "INVALID_ORIGIN_STATE"
    );
  }

  if (
    input.destinationCity !== undefined &&
    !isNonEmptyString(
      input.destinationCity
    )
  ) {
    addError(
      errors,
      "destinationCity",
      "Destination city cannot be empty when provided.",
      "INVALID_DESTINATION_CITY"
    );
  }

  if (
    input.destinationState !== undefined &&
    !isNonEmptyString(
      input.destinationState
    )
  ) {
    addError(
      errors,
      "destinationState",
      "Destination state cannot be empty when provided.",
      "INVALID_DESTINATION_STATE"
    );
  }

  if (
    input.serviceablePostalCodes !==
    undefined
  ) {
    if (
      !Array.isArray(
        input.serviceablePostalCodes
      )
    ) {
      addError(
        errors,
        "serviceablePostalCodes",
        "Serviceable postal codes must be an array.",
        "INVALID_POSTAL_CODE_LIST"
      );
    } else if (
      !containsOnlyNonEmptyStrings(
        input.serviceablePostalCodes
      )
    ) {
      addError(
        errors,
        "serviceablePostalCodes",
        "Serviceable postal codes cannot contain empty values.",
        "EMPTY_POSTAL_CODE"
      );
    } else if (
      !containsOnlyValidPostalCodes(
        input.serviceablePostalCodes
      )
    ) {
      addError(
        errors,
        "serviceablePostalCodes",
        "One or more serviceable postal codes are invalid.",
        "INVALID_SERVICEABLE_POSTAL_CODE"
      );
    } else {
      const uniquePostalCodes = new Set(
        input.serviceablePostalCodes.map(
          (postalCode) =>
            postalCode.trim()
        )
      );

      if (
        uniquePostalCodes.size !==
        input.serviceablePostalCodes.length
      ) {
        addError(
          errors,
          "serviceablePostalCodes",
          "Serviceable postal codes cannot contain duplicates.",
          "DUPLICATE_POSTAL_CODE"
        );
      }
    }
  }

  if (
    input.active !== undefined &&
    typeof input.active !== "boolean"
  ) {
    addError(
      errors,
      "active",
      "Service-area active status must be a boolean.",
      "INVALID_SERVICE_AREA_ACTIVE_STATUS"
    );
  }

  if (
    input.scope ===
      VendorServiceScope.WITHIN_CITY &&
    !isNonEmptyString(input.originCity)
  ) {
    addError(
      errors,
      "originCity",
      "Origin city is required for within-city service.",
      "ORIGIN_CITY_REQUIRED"
    );
  }

  if (
    input.scope ===
      VendorServiceScope.WITHIN_STATE &&
    !isNonEmptyString(input.originState)
  ) {
    addError(
      errors,
      "originState",
      "Origin state is required for within-state service.",
      "ORIGIN_STATE_REQUIRED"
    );
  }

  if (
    input.scope ===
      VendorServiceScope.WITHIN_CITY &&
    isNonEmptyString(input.originCity) &&
    isNonEmptyString(
      input.destinationCity
    ) &&
    normalizeString(
      input.originCity
    ).toLowerCase() !==
      normalizeString(
        input.destinationCity
      ).toLowerCase()
  ) {
    addError(
      errors,
      "destinationCity",
      "Origin and destination cities must match for within-city service.",
      "WITHIN_CITY_DESTINATION_MISMATCH"
    );
  }

  if (
    input.scope ===
      VendorServiceScope.WITHIN_STATE &&
    isNonEmptyString(
      input.originState
    ) &&
    isNonEmptyString(
      input.destinationState
    ) &&
    normalizeString(
      input.originState
    ).toLowerCase() !==
      normalizeString(
        input.destinationState
      ).toLowerCase()
  ) {
    addError(
      errors,
      "destinationState",
      "Origin and destination states must match for within-state service.",
      "WITHIN_STATE_DESTINATION_MISMATCH"
    );
  }

  return resultFromErrors(errors);
}

/**
 * Validates input used to add a service area.
 */
export function validateAddVendorServiceAreaInput(
  input: AddVendorServiceAreaInput
): VendorValidationResult {
  const errors: VendorValidationError[] = [];

  if (!input) {
    addError(
      errors,
      "serviceArea",
      "Vendor service-area input is required.",
      "SERVICE_AREA_INPUT_REQUIRED"
    );

    return resultFromErrors(errors);
  }

  const fieldValidation =
    validateServiceAreaFields(
      input,
      true
    );

  errors.push(...fieldValidation.errors);

  if (!isNonEmptyString(input.updatedBy)) {
    addError(
      errors,
      "updatedBy",
      "The user adding the service area is required.",
      "UPDATED_BY_REQUIRED"
    );
  }

  return resultFromErrors(errors);
}

/**
 * Validates input used to update a service area.
 */
export function validateUpdateVendorServiceAreaInput(
  input: UpdateVendorServiceAreaInput
): VendorValidationResult {
  const errors: VendorValidationError[] = [];

  if (!input) {
    addError(
      errors,
      "serviceArea",
      "Vendor service-area update input is required.",
      "SERVICE_AREA_UPDATE_REQUIRED"
    );

    return resultFromErrors(errors);
  }

  const fieldValidation =
    validateServiceAreaFields(
      input,
      false
    );

  errors.push(...fieldValidation.errors);

  if (!isNonEmptyString(input.updatedBy)) {
    addError(
      errors,
      "updatedBy",
      "The user updating the service area is required.",
      "UPDATED_BY_REQUIRED"
    );
  }

  const hasUpdate =
    input.scope !== undefined ||
    input.originCity !== undefined ||
    input.originState !== undefined ||
    input.destinationCity !== undefined ||
    input.destinationState !== undefined ||
    input.serviceablePostalCodes !==
      undefined ||
    input.active !== undefined;

  if (!hasUpdate) {
    addError(
      errors,
      "serviceArea",
      "At least one service-area field must be provided for update.",
      "NO_SERVICE_AREA_CHANGES"
    );
  }

  return resultFromErrors(errors);
}

/**
 * Validates a stored VendorServiceArea.
 */
export function validateVendorServiceArea(
  serviceArea: VendorServiceArea
): VendorValidationResult {
  const errors: VendorValidationError[] = [];

  if (!serviceArea) {
    addError(
      errors,
      "serviceArea",
      "Vendor service area is required.",
      "SERVICE_AREA_REQUIRED"
    );

    return resultFromErrors(errors);
  }

  if (!isNonEmptyString(serviceArea.id)) {
    addError(
      errors,
      "serviceArea.id",
      "Service-area ID is required.",
      "SERVICE_AREA_ID_REQUIRED"
    );
  }

  const fieldValidation =
    validateServiceAreaFields(
      serviceArea,
      true
    );

  errors.push(...fieldValidation.errors);

  if (
    !isValidDateValue(
      serviceArea.createdAt
    )
  ) {
    addError(
      errors,
      "serviceArea.createdAt",
      "Service-area creation date is invalid.",
      "INVALID_SERVICE_AREA_CREATED_AT"
    );
  }

  if (
    !isValidDateValue(
      serviceArea.updatedAt
    )
  ) {
    addError(
      errors,
      "serviceArea.updatedAt",
      "Service-area update date is invalid.",
      "INVALID_SERVICE_AREA_UPDATED_AT"
    );
  }

  return resultFromErrors(errors);
}

/**
 * Validates input used to add or update
 * a vendor service.
 */
export function validateUpsertVendorServiceInput(
  input: UpsertVendorServiceInput
): VendorValidationResult {
  const errors: VendorValidationError[] = [];

  if (!input) {
    addError(
      errors,
      "service",
      "Vendor service input is required.",
      "VENDOR_SERVICE_INPUT_REQUIRED"
    );

    return resultFromErrors(errors);
  }

  if (!input.serviceType) {
    addError(
      errors,
      "serviceType",
      "Vendor service type is required.",
      "SERVICE_TYPE_REQUIRED"
    );
  } else if (
    !isEnumValue(
      VendorServiceType,
      input.serviceType
    )
  ) {
    addError(
      errors,
      "serviceType",
      "Vendor service type is invalid.",
      "INVALID_SERVICE_TYPE"
    );
  }

  if (!isNonEmptyString(input.title)) {
    addError(
      errors,
      "title",
      "Vendor service title is required.",
      "SERVICE_TITLE_REQUIRED"
    );
  } else if (
    input.title.trim().length < 2
  ) {
    addError(
      errors,
      "title",
      "Vendor service title must contain at least 2 characters.",
      "SERVICE_TITLE_TOO_SHORT"
    );
  } else if (
    input.title.trim().length > 150
  ) {
    addError(
      errors,
      "title",
      "Vendor service title cannot exceed 150 characters.",
      "SERVICE_TITLE_TOO_LONG"
    );
  }

  if (
    input.description !== undefined &&
    !isNonEmptyString(
      input.description
    )
  ) {
    addError(
      errors,
      "description",
      "Service description cannot be empty when provided.",
      "INVALID_SERVICE_DESCRIPTION"
    );
  } else if (
    input.description !== undefined &&
    input.description.trim().length > 1000
  ) {
    addError(
      errors,
      "description",
      "Service description cannot exceed 1000 characters.",
      "SERVICE_DESCRIPTION_TOO_LONG"
    );
  }

  if (
    input.active !== undefined &&
    typeof input.active !== "boolean"
  ) {
    addError(
      errors,
      "active",
      "Vendor service active status must be a boolean.",
      "INVALID_SERVICE_ACTIVE_STATUS"
    );
  }

  if (!isNonEmptyString(input.updatedBy)) {
    addError(
      errors,
      "updatedBy",
      "The user updating the vendor service is required.",
      "UPDATED_BY_REQUIRED"
    );
  }

  return resultFromErrors(errors);
}

/**
 * Validates a stored VendorService.
 */
export function validateVendorService(
  service: VendorService
): VendorValidationResult {
  const errors: VendorValidationError[] = [];

  if (!service) {
    addError(
      errors,
      "service",
      "Vendor service is required.",
      "VENDOR_SERVICE_REQUIRED"
    );

    return resultFromErrors(errors);
  }

  if (!isNonEmptyString(service.id)) {
    addError(
      errors,
      "service.id",
      "Vendor service ID is required.",
      "VENDOR_SERVICE_ID_REQUIRED"
    );
  }

  const inputValidation =
    validateUpsertVendorServiceInput({
      serviceType: service.serviceType,
      title: service.title,
      description: service.description,
      active: service.active,
      updatedBy: "system-validation",
    });

  errors.push(
    ...inputValidation.errors.filter(
      (error) =>
        error.field !== "updatedBy"
    )
  );

  if (
    !isValidDateValue(service.createdAt)
  ) {
    addError(
      errors,
      "service.createdAt",
      "Vendor service creation date is invalid.",
      "INVALID_SERVICE_CREATED_AT"
    );
  }

  if (
    !isValidDateValue(service.updatedAt)
  ) {
    addError(
      errors,
      "service.updatedAt",
      "Vendor service update date is invalid.",
      "INVALID_SERVICE_UPDATED_AT"
    );
  }

  return resultFromErrors(errors);
}

/**
 * Validates common vendor pricing fields.
 */
function validateVendorPricingFields(
  input: {
    serviceType?: VendorServiceType;
    pricingType?: VendorPricingType;
    basePrice?: number;
    minimumPrice?: number;
    pricePerKilometre?: number;
    pricePerKilogram?: number;
    pricePerItem?: number;
    labourCharge?: number;
    packingCharge?: number;
    loadingCharge?: number;
    unloadingCharge?: number;
    insuranceChargePercentage?: number;
    taxPercentage?: number;
    currency?: string;
    active?: boolean;
    effectiveFrom?: Date;
    effectiveUntil?: Date;
  }
): VendorValidationResult {
  const errors: VendorValidationError[] = [];

  if (!input.serviceType) {
    addError(
      errors,
      "serviceType",
      "Pricing service type is required.",
      "PRICING_SERVICE_TYPE_REQUIRED"
    );
  } else if (
    !isEnumValue(
      VendorServiceType,
      input.serviceType
    )
  ) {
    addError(
      errors,
      "serviceType",
      "Pricing service type is invalid.",
      "INVALID_PRICING_SERVICE_TYPE"
    );
  }

  if (!input.pricingType) {
    addError(
      errors,
      "pricingType",
      "Pricing type is required.",
      "PRICING_TYPE_REQUIRED"
    );
  } else if (
    !isEnumValue(
      VendorPricingType,
      input.pricingType
    )
  ) {
    addError(
      errors,
      "pricingType",
      "Pricing type is invalid.",
      "INVALID_PRICING_TYPE"
    );
  }

  const monetaryFields: Array<{
    field: string;
    value: number | undefined;
  }> = [
    {
      field: "basePrice",
      value: input.basePrice,
    },
    {
      field: "minimumPrice",
      value: input.minimumPrice,
    },
    {
      field: "pricePerKilometre",
      value: input.pricePerKilometre,
    },
    {
      field: "pricePerKilogram",
      value: input.pricePerKilogram,
    },
    {
      field: "pricePerItem",
      value: input.pricePerItem,
    },
    {
      field: "labourCharge",
      value: input.labourCharge,
    },
    {
      field: "packingCharge",
      value: input.packingCharge,
    },
    {
      field: "loadingCharge",
      value: input.loadingCharge,
    },
    {
      field: "unloadingCharge",
      value: input.unloadingCharge,
    },
  ];

  for (const monetaryField of monetaryFields) {
    if (
      monetaryField.value !== undefined &&
      !isNonNegativeNumber(
        monetaryField.value
      )
    ) {
      addError(
        errors,
        monetaryField.field,
        `${monetaryField.field} must be a non-negative number.`,
        "INVALID_PRICING_AMOUNT"
      );
    }
  }

  if (
    input.insuranceChargePercentage !==
      undefined &&
    !isPercentage(
      input.insuranceChargePercentage
    )
  ) {
    addError(
      errors,
      "insuranceChargePercentage",
      "Insurance charge percentage must be between 0 and 100.",
      "INVALID_INSURANCE_PERCENTAGE"
    );
  }

  if (
    input.taxPercentage !== undefined &&
    !isPercentage(input.taxPercentage)
  ) {
    addError(
      errors,
      "taxPercentage",
      "Tax percentage must be between 0 and 100.",
      "INVALID_TAX_PERCENTAGE"
    );
  }

  if (
    input.currency !== undefined &&
    !isNonEmptyString(input.currency)
  ) {
    addError(
      errors,
      "currency",
      "Currency cannot be empty.",
      "INVALID_CURRENCY"
    );
  } else if (
    input.currency !== undefined &&
    !/^[A-Z]{3}$/i.test(
      input.currency.trim()
    )
  ) {
    addError(
      errors,
      "currency",
      "Currency must use a valid three-letter code.",
      "INVALID_CURRENCY_CODE"
    );
  }

  if (
    input.active !== undefined &&
    typeof input.active !== "boolean"
  ) {
    addError(
      errors,
      "active",
      "Pricing active status must be a boolean.",
      "INVALID_PRICING_ACTIVE_STATUS"
    );
  }

  if (
    input.effectiveFrom !== undefined &&
    !isValidDateValue(
      input.effectiveFrom
    )
  ) {
    addError(
      errors,
      "effectiveFrom",
      "Pricing effective-from date is invalid.",
      "INVALID_EFFECTIVE_FROM"
    );
  }

  if (
    input.effectiveUntil !== undefined &&
    !isValidDateValue(
      input.effectiveUntil
    )
  ) {
    addError(
      errors,
      "effectiveUntil",
      "Pricing effective-until date is invalid.",
      "INVALID_EFFECTIVE_UNTIL"
    );
  }

  if (
    isValidDateValue(
      input.effectiveFrom
    ) &&
    isValidDateValue(
      input.effectiveUntil
    ) &&
    input.effectiveUntil <=
      input.effectiveFrom
  ) {
    addError(
      errors,
      "effectiveUntil",
      "Pricing effective-until date must be later than the effective-from date.",
      "INVALID_PRICING_DATE_RANGE"
    );
  }

  if (
    input.pricingType ===
      VendorPricingType.FIXED &&
    !isNonNegativeNumber(
      input.basePrice
    )
  ) {
    addError(
      errors,
      "basePrice",
      "Base price is required for fixed pricing.",
      "FIXED_BASE_PRICE_REQUIRED"
    );
  }

  if (
    input.pricingType ===
      VendorPricingType.PER_KILOMETRE &&
    !isNonNegativeNumber(
      input.pricePerKilometre
    )
  ) {
    addError(
      errors,
      "pricePerKilometre",
      "Price per kilometre is required for per-kilometre pricing.",
      "PRICE_PER_KILOMETRE_REQUIRED"
    );
  }

  if (
    input.pricingType ===
      VendorPricingType.PER_KILOGRAM &&
    !isNonNegativeNumber(
      input.pricePerKilogram
    )
  ) {
    addError(
      errors,
      "pricePerKilogram",
      "Price per kilogram is required for per-kilogram pricing.",
      "PRICE_PER_KILOGRAM_REQUIRED"
    );
  }

  if (
    input.pricingType ===
      VendorPricingType.PER_ITEM &&
    !isNonNegativeNumber(
      input.pricePerItem
    )
  ) {
    addError(
      errors,
      "pricePerItem",
      "Price per item is required for per-item pricing.",
      "PRICE_PER_ITEM_REQUIRED"
    );
  }

  if (
    isNonNegativeNumber(
      input.basePrice
    ) &&
    isNonNegativeNumber(
      input.minimumPrice
    ) &&
    input.minimumPrice >
      input.basePrice &&
    input.pricingType ===
      VendorPricingType.FIXED
  ) {
    addError(
      errors,
      "minimumPrice",
      "Minimum price cannot exceed the fixed base price.",
      "MINIMUM_PRICE_EXCEEDS_BASE_PRICE"
    );
  }

  return resultFromErrors(errors);
}

/**
 * Validates input used to add vendor pricing.
 */
export function validateAddVendorPricingInput(
  input: AddVendorPricingInput
): VendorValidationResult {
  const errors: VendorValidationError[] = [];

  if (!input) {
    addError(
      errors,
      "pricing",
      "Vendor pricing input is required.",
      "VENDOR_PRICING_INPUT_REQUIRED"
    );

    return resultFromErrors(errors);
  }

  const fieldValidation =
    validateVendorPricingFields(input);

  errors.push(...fieldValidation.errors);

  if (!isNonEmptyString(input.updatedBy)) {
    addError(
      errors,
      "updatedBy",
      "The user adding vendor pricing is required.",
      "UPDATED_BY_REQUIRED"
    );
  }

  return resultFromErrors(errors);
}

/**
 * Validates a stored VendorPricing record.
 */
export function validateVendorPricing(
  pricing: VendorPricing
): VendorValidationResult {
  const errors: VendorValidationError[] = [];

  if (!pricing) {
    addError(
      errors,
      "pricing",
      "Vendor pricing is required.",
      "VENDOR_PRICING_REQUIRED"
    );

    return resultFromErrors(errors);
  }

  if (!isNonEmptyString(pricing.id)) {
    addError(
      errors,
      "pricing.id",
      "Vendor pricing ID is required.",
      "VENDOR_PRICING_ID_REQUIRED"
    );
  }

  const fieldValidation =
    validateVendorPricingFields(pricing);

  errors.push(...fieldValidation.errors);

  if (
    !isNonEmptyString(pricing.currency)
  ) {
    addError(
      errors,
      "pricing.currency",
      "Vendor pricing currency is required.",
      "PRICING_CURRENCY_REQUIRED"
    );
  }

  if (
    !isValidDateValue(pricing.createdAt)
  ) {
    addError(
      errors,
      "pricing.createdAt",
      "Vendor pricing creation date is invalid.",
      "INVALID_PRICING_CREATED_AT"
    );
  }

  if (
    !isValidDateValue(pricing.updatedAt)
  ) {
    addError(
      errors,
      "pricing.updatedAt",
      "Vendor pricing update date is invalid.",
      "INVALID_PRICING_UPDATED_AT"
    );
  }

  return resultFromErrors(errors);
}
/**
 * ============================================================
 * Part 3A
 * ============================================================
 *
 * Fleet & Vehicle Validation
 * ============================================================
 */

/**
 * Validates vehicle registration number.
 */
function isValidVehicleRegistrationNumber(
  registrationNumber: string
): boolean {
  const normalized = registrationNumber
    .trim()
    .toUpperCase();

  return /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/.test(
    normalized
  );
}
/**
 * ============================================================
 * Part 4
 * ============================================================
 *
 * - Complete vendor onboarding validation
 * - Cross-section business-rule validation
 * - Vendor profile completeness calculation
 * - Final validation utilities
 * ============================================================
 */

/**
 * Complete vendor onboarding payload.
 *
 * This local validation shape combines the vendor-domain
 * sections already supported by this validator.
 *
 * A matching exported model interface may be added later to
 * vendor.model.ts if this payload needs to be shared across
 * services, repositories, or API routes.
 */
export interface CompleteVendorOnboardingInput {
  business: VendorBusinessDetails;
  owner: VendorOwnerDetails;
  contact: VendorContact;
  registeredAddress: VendorAddress;

  operationalAddress?: VendorAddress;

  serviceAreas?: VendorServiceArea[];
  services?: VendorService[];
  pricing?: VendorPricing[];
  vehicles?: VendorVehicle[];
  documents?: VendorDocument[];

  bankDetails?: VendorBankDetails;

  acceptedTerms: boolean;
  submittedBy: string;
}

/**
 * Result returned by vendor-profile completeness validation.
 */
export interface VendorProfileCompletenessResult {
  percentage: number;
  completedSections: string[];
  incompleteSections: string[];
}

/**
 * Adds errors from a nested validation result while applying
 * a field prefix.
 */
function appendPrefixedErrors(
  errors: VendorValidationError[],
  validation: VendorValidationResult,
  fieldPrefix: string
): void {
  for (const error of validation.errors) {
    const nestedField =
      error.field.length > 0
        ? `${fieldPrefix}.${error.field}`
        : fieldPrefix;

    addError(
      errors,
      nestedField,
      error.message,
      error.code
    );
  }
}

/**
 * Checks whether two normalized strings are equal.
 */
function areNormalizedStringsEqual(
  firstValue: string | undefined,
  secondValue: string | undefined
): boolean {
  return (
    normalizeString(firstValue).toLowerCase() ===
    normalizeString(secondValue).toLowerCase()
  );
}

/**
 * Checks whether two addresses are substantially identical.
 *
 * This is used to detect an unnecessarily duplicated
 * operational address.
 */
function areAddressesEqual(
  firstAddress: VendorAddress,
  secondAddress: VendorAddress
): boolean {
  return (
    areNormalizedStringsEqual(
      firstAddress.addressLine1,
      secondAddress.addressLine1
    ) &&
    areNormalizedStringsEqual(
      firstAddress.addressLine2,
      secondAddress.addressLine2
    ) &&
    areNormalizedStringsEqual(
      firstAddress.landmark,
      secondAddress.landmark
    ) &&
    areNormalizedStringsEqual(
      firstAddress.city,
      secondAddress.city
    ) &&
    areNormalizedStringsEqual(
      firstAddress.district,
      secondAddress.district
    ) &&
    areNormalizedStringsEqual(
      firstAddress.state,
      secondAddress.state
    ) &&
    areNormalizedStringsEqual(
      firstAddress.postalCode,
      secondAddress.postalCode
    ) &&
    areNormalizedStringsEqual(
      firstAddress.country,
      secondAddress.country
    )
  );
}

/**
 * Normalizes an Indian phone number for comparison.
 */
function normalizeIndianPhoneNumber(
  phoneNumber: string
): string {
  const digits = phoneNumber.replace(
    /\D/g,
    ""
  );

  if (
    digits.length === 12 &&
    digits.startsWith("91")
  ) {
    return digits.slice(2);
  }

  return digits;
}

/**
 * Validates duplicate service-area records.
 */
function validateDuplicateServiceAreas(
  serviceAreas: VendorServiceArea[]
): VendorValidationResult {
  const errors: VendorValidationError[] = [];
  const serviceAreaKeys = new Set<string>();

  serviceAreas.forEach(
    (serviceArea, index) => {
      const key = [
        serviceArea.scope,
        normalizeString(
          serviceArea.originCity
        ).toLowerCase(),
        normalizeString(
          serviceArea.originState
        ).toLowerCase(),
        normalizeString(
          serviceArea.destinationCity
        ).toLowerCase(),
        normalizeString(
          serviceArea.destinationState
        ).toLowerCase(),
      ].join("|");

      if (serviceAreaKeys.has(key)) {
        addError(
          errors,
          `serviceAreas[${index}]`,
          "A duplicate vendor service area has been provided.",
          "DUPLICATE_VENDOR_SERVICE_AREA"
        );
      } else {
        serviceAreaKeys.add(key);
      }
    }
  );

  return resultFromErrors(errors);
}

/**
 * Validates duplicate service records.
 */
function validateDuplicateVendorServices(
  services: VendorService[]
): VendorValidationResult {
  const errors: VendorValidationError[] = [];
  const serviceTypes =
    new Set<VendorServiceType>();

  services.forEach((service, index) => {
    if (
      serviceTypes.has(
        service.serviceType
      )
    ) {
      addError(
        errors,
        `services[${index}].serviceType`,
        "The same vendor service type cannot be added more than once.",
        "DUPLICATE_VENDOR_SERVICE_TYPE"
      );
    } else {
      serviceTypes.add(
        service.serviceType
      );
    }
  });

  return resultFromErrors(errors);
}

/**
 * Validates duplicate pricing records.
 */
function validateDuplicateVendorPricing(
  pricingRecords: VendorPricing[]
): VendorValidationResult {
  const errors: VendorValidationError[] = [];
  const pricingKeys = new Set<string>();

  pricingRecords.forEach(
    (pricing, index) => {
      const key = [
        pricing.serviceType,
        pricing.pricingType,
        pricing.currency
          .trim()
          .toUpperCase(),
      ].join("|");

      if (pricingKeys.has(key)) {
        addError(
          errors,
          `pricing[${index}]`,
          "Duplicate pricing exists for the same service, pricing type, and currency.",
          "DUPLICATE_VENDOR_PRICING"
        );
      } else {
        pricingKeys.add(key);
      }
    }
  );

  return resultFromErrors(errors);
}

/**
 * Validates duplicate vehicle registration numbers.
 */
function validateDuplicateVendorVehicles(
  vehicles: VendorVehicle[]
): VendorValidationResult {
  const errors: VendorValidationError[] = [];
  const registrationNumbers =
    new Set<string>();

  vehicles.forEach((vehicle, index) => {
    const registrationNumber =
      vehicle.registrationNumber
        .replace(/[\s-]/g, "")
        .toUpperCase();

    if (
      registrationNumbers.has(
        registrationNumber
      )
    ) {
      addError(
        errors,
        `vehicles[${index}].registrationNumber`,
        "Vehicle registration number has already been added.",
        "DUPLICATE_VEHICLE_REGISTRATION"
      );
    } else {
      registrationNumbers.add(
        registrationNumber
      );
    }
  });

  return resultFromErrors(errors);
}

/**
 * Validates duplicate document records.
 */
function validateDuplicateVendorDocuments(
  documents: VendorDocument[]
): VendorValidationResult {
  const errors: VendorValidationError[] = [];
  const documentKeys = new Set<string>();

  documents.forEach((document, index) => {
    const documentNumber =
      normalizeString(
        document.documentNumber
      ).toUpperCase();

    const key = [
      document.documentType,
      documentNumber ||
        normalizeString(
          document.documentUrl
        ).toLowerCase(),
    ].join("|");

    if (documentKeys.has(key)) {
      addError(
        errors,
        `documents[${index}]`,
        "The same vendor document has been added more than once.",
        "DUPLICATE_VENDOR_DOCUMENT"
      );
    } else {
      documentKeys.add(key);
    }
  });

  return resultFromErrors(errors);
}

/**
 * Validates cross-section vendor business rules.
 */
function validateVendorCrossSectionRules(
  input: CompleteVendorOnboardingInput
): VendorValidationResult {
  const errors: VendorValidationError[] = [];

  if (
    isNonEmptyString(
      input.owner.phone
    ) &&
    isNonEmptyString(
      input.contact.primaryPhone
    ) &&
    normalizeIndianPhoneNumber(
      input.owner.phone
    ) !==
      normalizeIndianPhoneNumber(
        input.contact.primaryPhone
      )
  ) {
    addError(
      errors,
      "contact.primaryPhone",
      "The primary contact number should match the owner phone number during initial onboarding.",
      "OWNER_CONTACT_PHONE_MISMATCH"
    );
  }

  if (
    isNonEmptyString(
      input.owner.email
    ) &&
    isNonEmptyString(
      input.contact.email
    ) &&
    !areNormalizedStringsEqual(
      input.owner.email,
      input.contact.email
    )
  ) {
    addError(
      errors,
      "contact.email",
      "The primary vendor email should match the owner email during initial onboarding.",
      "OWNER_CONTACT_EMAIL_MISMATCH"
    );
  }

  if (
    input.operationalAddress &&
    areAddressesEqual(
      input.registeredAddress,
      input.operationalAddress
    )
  ) {
    addError(
      errors,
      "operationalAddress",
      "Operational address should be omitted when it is the same as the registered address.",
      "DUPLICATE_OPERATIONAL_ADDRESS"
    );
  }

  if (
    input.services &&
    input.services.length > 0 &&
    (
      !input.serviceAreas ||
      input.serviceAreas.length === 0
    )
  ) {
    addError(
      errors,
      "serviceAreas",
      "At least one service area is required when vendor services are provided.",
      "SERVICE_AREA_REQUIRED_FOR_SERVICES"
    );
  }

  if (
    input.pricing &&
    input.pricing.length > 0 &&
    (
      !input.services ||
      input.services.length === 0
    )
  ) {
    addError(
      errors,
      "services",
      "At least one vendor service is required before pricing can be added.",
      "SERVICE_REQUIRED_FOR_PRICING"
    );
  }

  if (
    input.pricing &&
    input.services &&
    input.pricing.length > 0 &&
    input.services.length > 0
  ) {
    const activeServiceTypes =
      new Set(
        input.services
          .filter(
            (service) =>
              service.active
          )
          .map(
            (service) =>
              service.serviceType
          )
      );

    input.pricing.forEach(
      (pricing, index) => {
        if (
          pricing.active &&
          !activeServiceTypes.has(
            pricing.serviceType
          )
        ) {
          addError(
            errors,
            `pricing[${index}].serviceType`,
            "Active pricing must reference an active vendor service.",
            "PRICING_SERVICE_NOT_ACTIVE"
          );
        }
      }
    );
  }

  if (
    input.vehicles &&
    input.vehicles.length > 0 &&
    !input.vehicles.some(
      (vehicle) =>
        vehicle.active &&
        vehicle.status ===
          VendorVehicleStatus.AVAILABLE
    )
  ) {
    addError(
      errors,
      "vehicles",
      "At least one active and available vehicle is required when fleet details are provided.",
      "NO_AVAILABLE_VENDOR_VEHICLE"
    );
  }

  return resultFromErrors(errors);
}

/**
 * Validates the complete vendor onboarding payload.
 */
export function validateCompleteVendorOnboardingInput(
  input: CompleteVendorOnboardingInput
): VendorValidationResult {
  const errors: VendorValidationError[] = [];

  if (!input) {
    addError(
      errors,
      "vendor",
      "Complete vendor onboarding information is required.",
      "VENDOR_ONBOARDING_INPUT_REQUIRED"
    );

    return resultFromErrors(errors);
  }

  appendPrefixedErrors(
    errors,
    validateVendorBusinessDetails(
      input.business
    ),
    "business"
  );

  appendPrefixedErrors(
    errors,
    validateVendorOwnerDetails(
      input.owner
    ),
    "owner"
  );

  appendPrefixedErrors(
    errors,
    validateVendorContact(
      input.contact
    ),
    "contact"
  );

  appendPrefixedErrors(
    errors,
    validateVendorAddress(
      input.registeredAddress,
      "registeredAddress"
    ),
    ""
  );

  if (input.operationalAddress) {
    appendPrefixedErrors(
      errors,
      validateVendorAddress(
        input.operationalAddress,
        "operationalAddress"
      ),
      ""
    );
  }

  if (
    input.serviceAreas !== undefined
  ) {
    if (
      !Array.isArray(
        input.serviceAreas
      )
    ) {
      addError(
        errors,
        "serviceAreas",
        "Vendor service areas must be an array.",
        "INVALID_VENDOR_SERVICE_AREAS"
      );
    } else {
      input.serviceAreas.forEach(
        (serviceArea, index) => {
          appendPrefixedErrors(
            errors,
            validateVendorServiceArea(
              serviceArea
            ),
            `serviceAreas[${index}]`
          );
        }
      );

      errors.push(
        ...validateDuplicateServiceAreas(
          input.serviceAreas
        ).errors
      );
    }
  }

  if (input.services !== undefined) {
    if (!Array.isArray(input.services)) {
      addError(
        errors,
        "services",
        "Vendor services must be an array.",
        "INVALID_VENDOR_SERVICES"
      );
    } else {
      input.services.forEach(
        (service, index) => {
          appendPrefixedErrors(
            errors,
            validateVendorService(
              service
            ),
            `services[${index}]`
          );
        }
      );

      errors.push(
        ...validateDuplicateVendorServices(
          input.services
        ).errors
      );
    }
  }

  if (input.pricing !== undefined) {
    if (!Array.isArray(input.pricing)) {
      addError(
        errors,
        "pricing",
        "Vendor pricing must be an array.",
        "INVALID_VENDOR_PRICING"
      );
    } else {
      input.pricing.forEach(
        (pricing, index) => {
          appendPrefixedErrors(
            errors,
            validateVendorPricing(
              pricing
            ),
            `pricing[${index}]`
          );
        }
      );

      errors.push(
        ...validateDuplicateVendorPricing(
          input.pricing
        ).errors
      );
    }
  }

  if (input.vehicles !== undefined) {
    if (!Array.isArray(input.vehicles)) {
      addError(
        errors,
        "vehicles",
        "Vendor vehicles must be an array.",
        "INVALID_VENDOR_VEHICLES"
      );
    } else {
      input.vehicles.forEach(
        (vehicle, index) => {
          appendPrefixedErrors(
            errors,
            validateVendorVehicle(
              vehicle
            ),
            `vehicles[${index}]`
          );
        }
      );

      errors.push(
        ...validateDuplicateVendorVehicles(
          input.vehicles
        ).errors
      );
    }
  }

  if (input.documents !== undefined) {
    if (
      !Array.isArray(input.documents)
    ) {
      addError(
        errors,
        "documents",
        "Vendor documents must be an array.",
        "INVALID_VENDOR_DOCUMENTS"
      );
    } else {
      input.documents.forEach(
        (document, index) => {
          appendPrefixedErrors(
            errors,
            validateVendorDocument(
              document
            ),
            `documents[${index}]`
          );
        }
      );

      errors.push(
        ...validateDuplicateVendorDocuments(
          input.documents
        ).errors
      );
    }
  }

  if (input.bankDetails !== undefined) {
    appendPrefixedErrors(
      errors,
      validateVendorBankDetails(
        input.bankDetails
      ),
      "bankDetails"
    );
  }

  if (
    typeof input.acceptedTerms !==
    "boolean"
  ) {
    addError(
      errors,
      "acceptedTerms",
      "Terms acceptance must be a boolean.",
      "INVALID_TERMS_ACCEPTANCE"
    );
  } else if (!input.acceptedTerms) {
    addError(
      errors,
      "acceptedTerms",
      "Vendor must accept the platform terms and conditions.",
      "VENDOR_TERMS_NOT_ACCEPTED"
    );
  }

  if (
    !isNonEmptyString(
      input.submittedBy
    )
  ) {
    addError(
      errors,
      "submittedBy",
      "The user submitting vendor onboarding is required.",
      "SUBMITTED_BY_REQUIRED"
    );
  }

  const crossSectionValidation =
    validateVendorCrossSectionRules(
      input
    );

  errors.push(
    ...crossSectionValidation.errors
  );

  return resultFromErrors(errors);
}

/**
 * Calculates vendor-profile completion percentage.
 *
 * Completion is informational and does not replace the
 * complete onboarding validator.
 */
export function calculateVendorProfileCompleteness(
  input: Partial<CompleteVendorOnboardingInput>
): VendorProfileCompletenessResult {
  const completedSections: string[] = [];
  const incompleteSections: string[] = [];

  const sections: Array<{
    name: string;
    completed: boolean;
  }> = [
    {
      name: "business",
      completed:
        input.business !== undefined &&
        validateVendorBusinessDetails(
          input.business
        ).valid,
    },
    {
      name: "owner",
      completed:
        input.owner !== undefined &&
        validateVendorOwnerDetails(
          input.owner
        ).valid,
    },
    {
      name: "contact",
      completed:
        input.contact !== undefined &&
        validateVendorContact(
          input.contact
        ).valid,
    },
    {
      name: "registeredAddress",
      completed:
        input.registeredAddress !==
          undefined &&
        validateVendorAddress(
          input.registeredAddress,
          "registeredAddress"
        ).valid,
    },
    {
      name: "serviceAreas",
      completed:
        Array.isArray(
          input.serviceAreas
        ) &&
        input.serviceAreas.length > 0 &&
        input.serviceAreas.every(
          (serviceArea) =>
            validateVendorServiceArea(
              serviceArea
            ).valid
        ),
    },
    {
      name: "services",
      completed:
        Array.isArray(input.services) &&
        input.services.length > 0 &&
        input.services.every(
          (service) =>
            validateVendorService(
              service
            ).valid
        ),
    },
    {
      name: "pricing",
      completed:
        Array.isArray(input.pricing) &&
        input.pricing.length > 0 &&
        input.pricing.every(
          (pricing) =>
            validateVendorPricing(
              pricing
            ).valid
        ),
    },
    {
      name: "vehicles",
      completed:
        Array.isArray(input.vehicles) &&
        input.vehicles.length > 0 &&
        input.vehicles.every(
          (vehicle) =>
            validateVendorVehicle(
              vehicle
            ).valid
        ),
    },
    {
      name: "documents",
      completed:
        Array.isArray(
          input.documents
        ) &&
        input.documents.length > 0 &&
        input.documents.every(
          (document) =>
            validateVendorDocument(
              document
            ).valid
        ),
    },
    {
      name: "bankDetails",
      completed:
        input.bankDetails !== undefined &&
        validateVendorBankDetails(
          input.bankDetails
        ).valid,
    },
    {
      name: "terms",
      completed:
        input.acceptedTerms === true,
    },
  ];

  for (const section of sections) {
    if (section.completed) {
      completedSections.push(
        section.name
      );
    } else {
      incompleteSections.push(
        section.name
      );
    }
  }

  const percentage = Math.round(
    (
      completedSections.length /
      sections.length
    ) * 100
  );

  return {
    percentage,
    completedSections,
    incompleteSections,
  };
}

/**
 * Returns true when a validation result contains a specific
 * validation code.
 */
export function hasVendorValidationErrorCode(
  result: VendorValidationResult,
  code: string
): boolean {
  return result.errors.some(
    (error) =>
      error.code === code
  );
}

/**
 * Returns validation errors belonging to a field or nested
 * field path.
 */
export function getVendorValidationErrorsForField(
  result: VendorValidationResult,
  field: string
): VendorValidationError[] {
  return result.errors.filter(
    (error) =>
      error.field === field ||
      error.field.startsWith(
        `${field}.`
      ) ||
      error.field.startsWith(
        `${field}[`
      )
  );
}

/**
 * Returns the first vendor validation error, when present.
 */
export function getFirstVendorValidationError(
  result: VendorValidationResult
): VendorValidationError | undefined {
  return result.errors[0];
}

/**
 * Validates IFSC format.
 */
function isValidIFSC(
  ifsc: string
): boolean {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(
    ifsc.trim()
  );
}

/**
 * Validates vehicle manufacturing year.
 */
function isValidVehicleManufacturingYear(
  year: number
): boolean {
  const currentYear =
    new Date().getFullYear();

  return (
    Number.isInteger(year) &&
    year >= 1980 &&
    year <= currentYear + 1
  );
}

/**
 * Validates AddVendorVehicleInput.
 */
export function validateAddVendorVehicleInput(
  input: AddVendorVehicleInput
): VendorValidationResult {

  const errors: VendorValidationError[] =
    [];

  if (!input) {

    addError(
      errors,
      "vehicle",
      "Vehicle information is required.",
      "VEHICLE_REQUIRED"
    );

    return resultFromErrors(errors);
  }

  if (
    !isNonEmptyString(
      input.registrationNumber
    )
  ) {
    addError(
      errors,
      "registrationNumber",
      "Vehicle registration number is required.",
      "REGISTRATION_REQUIRED"
    );
  } else if (
    !isValidVehicleRegistrationNumber(
      input.registrationNumber
    )
  ) {
    addError(
      errors,
      "registrationNumber",
      "Vehicle registration number format is invalid.",
      "INVALID_REGISTRATION"
    );
  }

  if (
    !input.vehicleType
  ) {
    addError(
      errors,
      "vehicleType",
      "Vehicle type is required.",
      "VEHICLE_TYPE_REQUIRED"
    );
  } else if (
    !isEnumValue(
      VendorVehicleType,
      input.vehicleType
    )
  ) {
    addError(
      errors,
      "vehicleType",
      "Vehicle type is invalid.",
      "INVALID_VEHICLE_TYPE"
    );
  }

  if (
    input.manufacturer !== undefined &&
    !isNonEmptyString(
      input.manufacturer
    )
  ) {
    addError(
      errors,
      "manufacturer",
      "Manufacturer cannot be empty.",
      "INVALID_MANUFACTURER"
    );
  }

  if (
    input.model !== undefined &&
    !isNonEmptyString(
      input.model
    )
  ) {
    addError(
      errors,
      "model",
      "Vehicle model cannot be empty.",
      "INVALID_MODEL"
    );
  }

  if (
    input.manufacturingYear !==
      undefined &&
    !isValidVehicleManufacturingYear(
      input.manufacturingYear
    )
  ) {
    addError(
      errors,
      "manufacturingYear",
      "Vehicle manufacturing year is invalid.",
      "INVALID_MANUFACTURING_YEAR"
    );
  }

  if (
    input.capacityInKilograms !==
      undefined &&
    !isNonNegativeNumber(
      input.capacityInKilograms
    )
  ) {
    addError(
      errors,
      "capacityInKilograms",
      "Vehicle capacity must be a non-negative number.",
      "INVALID_CAPACITY_KG"
    );
  }

  if (
    input.capacityInCubicFeet !==
      undefined &&
    !isNonNegativeNumber(
      input.capacityInCubicFeet
    )
  ) {
    addError(
      errors,
      "capacityInCubicFeet",
      "Vehicle cubic capacity must be a non-negative number.",
      "INVALID_CAPACITY_CFT"
    );
  }

  if (
    input.insuranceExpiryDate &&
    !isValidDateValue(
      input.insuranceExpiryDate
    )
  ) {
    addError(
      errors,
      "insuranceExpiryDate",
      "Insurance expiry date is invalid.",
      "INVALID_INSURANCE_EXPIRY"
    );
  }

  if (
    input.permitExpiryDate &&
    !isValidDateValue(
      input.permitExpiryDate
    )
  ) {
    addError(
      errors,
      "permitExpiryDate",
      "Permit expiry date is invalid.",
      "INVALID_PERMIT_EXPIRY"
    );
  }

  if (
    input.pollutionCertificateExpiryDate &&
    !isValidDateValue(
      input.pollutionCertificateExpiryDate
    )
  ) {
    addError(
      errors,
      "pollutionCertificateExpiryDate",
      "Pollution certificate expiry date is invalid.",
      "INVALID_PUC_EXPIRY"
    );
  }

  if (
    input.status !== undefined &&
    !isEnumValue(
      VendorVehicleStatus,
      input.status
    )
  ) {
    addError(
      errors,
      "status",
      "Vehicle status is invalid.",
      "INVALID_VEHICLE_STATUS"
    );
  }

  if (
    input.active !== undefined &&
    typeof input.active !==
      "boolean"
  ) {
    addError(
      errors,
      "active",
      "Vehicle active flag must be boolean.",
      "INVALID_ACTIVE_FLAG"
    );
  }

  if (
    !isNonEmptyString(
      input.updatedBy
    )
  ) {
    addError(
      errors,
      "updatedBy",
      "Updated By is required.",
      "UPDATED_BY_REQUIRED"
    );
  }

  return resultFromErrors(errors);
}

/**
 * Validates VendorVehicle entity.
 */
export function validateVendorVehicle(
  vehicle: VendorVehicle
): VendorValidationResult {

  const errors: VendorValidationError[] =
    [];

  if (!vehicle) {

    addError(
      errors,
      "vehicle",
      "Vendor vehicle is required.",
      "VEHICLE_REQUIRED"
    );

    return resultFromErrors(errors);
  }

  if (
    !isNonEmptyString(vehicle.id)
  ) {
    addError(
      errors,
      "id",
      "Vehicle ID is required.",
      "VEHICLE_ID_REQUIRED"
    );
  }

  const inputValidation =
    validateAddVendorVehicleInput({
      registrationNumber:
        vehicle.registrationNumber,
      vehicleType:
        vehicle.vehicleType,
      manufacturer:
        vehicle.manufacturer,
      model: vehicle.model,
      manufacturingYear:
        vehicle.manufacturingYear,
      capacityInKilograms:
        vehicle.capacityInKilograms,
      capacityInCubicFeet:
        vehicle.capacityInCubicFeet,
      insuranceNumber:
        vehicle.insuranceNumber,
      insuranceExpiryDate:
        vehicle.insuranceExpiryDate,
      permitNumber:
        vehicle.permitNumber,
      permitExpiryDate:
        vehicle.permitExpiryDate,
      pollutionCertificateExpiryDate:
        vehicle.pollutionCertificateExpiryDate,
      status: vehicle.status,
      active: vehicle.active,
      updatedBy:
        "system-validation",
    });

  errors.push(
    ...inputValidation.errors.filter(
      e =>
        e.field !==
        "updatedBy"
    )
  );

  if (
    !isValidDateValue(
      vehicle.createdAt
    )
  ) {
    addError(
      errors,
      "createdAt",
      "Created date is invalid.",
      "INVALID_CREATED_DATE"
    );
  }

  if (
    !isValidDateValue(
      vehicle.updatedAt
    )
  ) {
    addError(
      errors,
      "updatedAt",
      "Updated date is invalid.",
      "INVALID_UPDATED_DATE"
    );
  }

  if (
    vehicle.insuranceExpiryDate &&
    vehicle.insuranceExpiryDate <
      new Date()
  ) {
    addError(
      errors,
      "insuranceExpiryDate",
      "Vehicle insurance has expired.",
      "INSURANCE_EXPIRED"
    );
  }

  if (
    vehicle.permitExpiryDate &&
    vehicle.permitExpiryDate <
      new Date()
  ) {
    addError(
      errors,
      "permitExpiryDate",
      "Vehicle permit has expired.",
      "PERMIT_EXPIRED"
    );
  }

  if (
    vehicle.pollutionCertificateExpiryDate &&
    vehicle
      .pollutionCertificateExpiryDate <
      new Date()
  ) {
    addError(
      errors,
      "pollutionCertificateExpiryDate",
      "Pollution certificate has expired.",
      "PUC_EXPIRED"
    );
  }

  return resultFromErrors(errors);
}
/**
 * ============================================================
 * Part 3B
 * ============================================================
 *
 * - Vendor document validation
 * - Document review validation
 * - Vendor bank-details validation
 * ============================================================
 */

/**
 * Checks whether a value has an HTTP or HTTPS URL format.
 */
function isValidHttpUrl(
  value: string
): boolean {
  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

/**
 * Checks whether a file name has a supported document
 * extension.
 */
function hasSupportedDocumentExtension(
  fileName: string
): boolean {
  return /\.(pdf|png|jpg|jpeg|webp)$/i.test(
    fileName.trim()
  );
}

/**
 * Checks whether a MIME type is supported for vendor
 * documents.
 */
function isSupportedDocumentMimeType(
  mimeType: string
): boolean {
  const supportedMimeTypes = new Set([
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
  ]);

  return supportedMimeTypes.has(
    mimeType.trim().toLowerCase()
  );
}

/**
 * Checks whether a document number has a reasonable format.
 *
 * Exact document-number rules can be added later for
 * individual document types.
 */
function isValidDocumentNumber(
  documentNumber: string
): boolean {
  const normalized =
    documentNumber.trim();

  return (
    normalized.length >= 3 &&
    normalized.length <= 100 &&
    /^[A-Z0-9\-\/_.]+$/i.test(normalized)
  );
}

/**
 * Checks whether a bank account number has a reasonable
 * Indian banking format.
 */
function isValidBankAccountNumber(
  accountNumber: string
): boolean {
  const normalized =
    accountNumber.replace(/\s|-/g, "");

  return /^[0-9]{9,18}$/.test(normalized);
}

/**
 * Checks whether a UPI ID has a valid basic format.
 */
function isValidUPIId(
  upiId: string
): boolean {
  return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(
    upiId.trim()
  );
}

/**
 * Checks whether a Date occurs in the future.
 */
function isFutureDate(
  value: Date
): boolean {
  return value.getTime() > Date.now();
}

/**
 * Checks whether a Date occurs after another Date.
 */
function isDateAfter(
  laterDate: Date,
  earlierDate: Date
): boolean {
  return (
    laterDate.getTime() >
    earlierDate.getTime()
  );
}

/**
 * Validates common document fields.
 */
function validateVendorDocumentFields(
  input: {
    documentType?: VendorDocumentType;
    documentNumber?: string;
    documentUrl?: string;
    fileName?: string;
    mimeType?: string;
    issuedAt?: Date;
    expiresAt?: Date;
  }
): VendorValidationResult {
  const errors: VendorValidationError[] = [];

  if (!input.documentType) {
    addError(
      errors,
      "documentType",
      "Vendor document type is required.",
      "DOCUMENT_TYPE_REQUIRED"
    );
  } else if (
    !isEnumValue(
      VendorDocumentType,
      input.documentType
    )
  ) {
    addError(
      errors,
      "documentType",
      "Vendor document type is invalid.",
      "INVALID_DOCUMENT_TYPE"
    );
  }

  if (
    input.documentNumber !== undefined
  ) {
    if (
      !isNonEmptyString(
        input.documentNumber
      )
    ) {
      addError(
        errors,
        "documentNumber",
        "Document number cannot be empty when provided.",
        "INVALID_DOCUMENT_NUMBER"
      );
    } else if (
      !isValidDocumentNumber(
        input.documentNumber
      )
    ) {
      addError(
        errors,
        "documentNumber",
        "Document number format is invalid.",
        "INVALID_DOCUMENT_NUMBER"
      );
    }
  }

  if (
    !isNonEmptyString(input.documentUrl)
  ) {
    addError(
      errors,
      "documentUrl",
      "Document URL is required.",
      "DOCUMENT_URL_REQUIRED"
    );
  } else if (
    !isValidHttpUrl(input.documentUrl)
  ) {
    addError(
      errors,
      "documentUrl",
      "Document URL must be a valid HTTP or HTTPS URL.",
      "INVALID_DOCUMENT_URL"
    );
  }

  if (input.fileName !== undefined) {
    if (
      !isNonEmptyString(input.fileName)
    ) {
      addError(
        errors,
        "fileName",
        "File name cannot be empty when provided.",
        "INVALID_FILE_NAME"
      );
    } else if (
      input.fileName.trim().length > 255
    ) {
      addError(
        errors,
        "fileName",
        "File name cannot exceed 255 characters.",
        "FILE_NAME_TOO_LONG"
      );
    } else if (
      !hasSupportedDocumentExtension(
        input.fileName
      )
    ) {
      addError(
        errors,
        "fileName",
        "Document file must be PDF, PNG, JPG, JPEG, or WEBP.",
        "UNSUPPORTED_DOCUMENT_EXTENSION"
      );
    }
  }

  if (input.mimeType !== undefined) {
    if (
      !isNonEmptyString(input.mimeType)
    ) {
      addError(
        errors,
        "mimeType",
        "MIME type cannot be empty when provided.",
        "INVALID_MIME_TYPE"
      );
    } else if (
      !isSupportedDocumentMimeType(
        input.mimeType
      )
    ) {
      addError(
        errors,
        "mimeType",
        "Document MIME type is not supported.",
        "UNSUPPORTED_DOCUMENT_MIME_TYPE"
      );
    }
  }

  if (
    input.issuedAt !== undefined &&
    !isValidDateValue(input.issuedAt)
  ) {
    addError(
      errors,
      "issuedAt",
      "Document issue date is invalid.",
      "INVALID_DOCUMENT_ISSUED_AT"
    );
  }

  if (
    isValidDateValue(input.issuedAt) &&
    isFutureDate(input.issuedAt)
  ) {
    addError(
      errors,
      "issuedAt",
      "Document issue date cannot be in the future.",
      "FUTURE_DOCUMENT_ISSUED_AT"
    );
  }

  if (
    input.expiresAt !== undefined &&
    !isValidDateValue(input.expiresAt)
  ) {
    addError(
      errors,
      "expiresAt",
      "Document expiry date is invalid.",
      "INVALID_DOCUMENT_EXPIRES_AT"
    );
  }

  if (
    isValidDateValue(input.issuedAt) &&
    isValidDateValue(input.expiresAt) &&
    !isDateAfter(
      input.expiresAt,
      input.issuedAt
    )
  ) {
    addError(
      errors,
      "expiresAt",
      "Document expiry date must be later than the issue date.",
      "INVALID_DOCUMENT_DATE_RANGE"
    );
  }

  return resultFromErrors(errors);
}

/**
 * Validates document-specific number requirements.
 */
function validateDocumentTypeRules(
  input: {
    documentType?: VendorDocumentType;
    documentNumber?: string;
    expiresAt?: Date;
  }
): VendorValidationResult {
  const errors: VendorValidationError[] = [];

  if (
    input.documentType ===
      VendorDocumentType.GST_CERTIFICATE &&
    !isNonEmptyString(input.documentNumber)
  ) {
    addError(
      errors,
      "documentNumber",
      "GST number is required for a GST certificate.",
      "GST_DOCUMENT_NUMBER_REQUIRED"
    );
  }

  if (
    input.documentType ===
      VendorDocumentType.GST_CERTIFICATE &&
    isNonEmptyString(input.documentNumber) &&
    !isValidGSTNumber(input.documentNumber)
  ) {
    addError(
      errors,
      "documentNumber",
      "GST certificate number format is invalid.",
      "INVALID_GST_DOCUMENT_NUMBER"
    );
  }

  if (
    input.documentType ===
      VendorDocumentType.PAN_CARD &&
    !isNonEmptyString(input.documentNumber)
  ) {
    addError(
      errors,
      "documentNumber",
      "PAN number is required for a PAN card.",
      "PAN_DOCUMENT_NUMBER_REQUIRED"
    );
  }

  if (
    input.documentType ===
      VendorDocumentType.PAN_CARD &&
    isNonEmptyString(input.documentNumber) &&
    !isValidPANNumber(input.documentNumber)
  ) {
    addError(
      errors,
      "documentNumber",
      "PAN card number format is invalid.",
      "INVALID_PAN_DOCUMENT_NUMBER"
    );
  }

  if (
    input.documentType ===
      VendorDocumentType.AADHAAR_CARD &&
    !isNonEmptyString(input.documentNumber)
  ) {
    addError(
      errors,
      "documentNumber",
      "Aadhaar number is required for an Aadhaar card.",
      "AADHAAR_DOCUMENT_NUMBER_REQUIRED"
    );
  }

  if (
    input.documentType ===
      VendorDocumentType.AADHAAR_CARD &&
    isNonEmptyString(input.documentNumber) &&
    !isValidAadhaarNumber(
      input.documentNumber
    )
  ) {
    addError(
      errors,
      "documentNumber",
      "Aadhaar card number format is invalid.",
      "INVALID_AADHAAR_DOCUMENT_NUMBER"
    );
  }

  const expiryRequiredDocumentTypes =
    new Set<VendorDocumentType>([
      VendorDocumentType.INSURANCE_POLICY,
      VendorDocumentType.DRIVING_LICENSE,
      VendorDocumentType.VEHICLE_REGISTRATION,
    ]);

  if (
    input.documentType &&
    expiryRequiredDocumentTypes.has(
      input.documentType
    ) &&
    input.expiresAt === undefined
  ) {
    addError(
      errors,
      "expiresAt",
      "Expiry date is required for this document type.",
      "DOCUMENT_EXPIRY_DATE_REQUIRED"
    );
  }

  return resultFromErrors(errors);
}

/**
 * Validates input used to upload vendor document metadata.
 */
export function validateAddVendorDocumentInput(
  input: AddVendorDocumentInput
): VendorValidationResult {
  const errors: VendorValidationError[] = [];

  if (!input) {
    addError(
      errors,
      "document",
      "Vendor document input is required.",
      "VENDOR_DOCUMENT_INPUT_REQUIRED"
    );

    return resultFromErrors(errors);
  }

  const fieldValidation =
    validateVendorDocumentFields(input);

  const typeRuleValidation =
    validateDocumentTypeRules(input);

  errors.push(
    ...fieldValidation.errors,
    ...typeRuleValidation.errors
  );

  if (!isNonEmptyString(input.updatedBy)) {
    addError(
      errors,
      "updatedBy",
      "The user uploading the vendor document is required.",
      "UPDATED_BY_REQUIRED"
    );
  }

  return resultFromErrors(errors);
}

/**
 * Validates input used to review a vendor document.
 */
export function validateReviewVendorDocumentInput(
  input: ReviewVendorDocumentInput
): VendorValidationResult {
  const errors: VendorValidationError[] = [];

  if (!input) {
    addError(
      errors,
      "documentReview",
      "Vendor document review input is required.",
      "DOCUMENT_REVIEW_INPUT_REQUIRED"
    );

    return resultFromErrors(errors);
  }

  if (!input.status) {
    addError(
      errors,
      "status",
      "Document review status is required.",
      "DOCUMENT_REVIEW_STATUS_REQUIRED"
    );
  } else if (
    !isEnumValue(
      VendorDocumentStatus,
      input.status
    )
  ) {
    addError(
      errors,
      "status",
      "Document review status is invalid.",
      "INVALID_DOCUMENT_REVIEW_STATUS"
    );
  }

  if (
    input.status ===
      VendorDocumentStatus.PENDING
  ) {
    addError(
      errors,
      "status",
      "A reviewed document cannot be returned to pending status through this operation.",
      "INVALID_DOCUMENT_REVIEW_TRANSITION"
    );
  }

  if (
    input.status ===
      VendorDocumentStatus.REJECTED &&
    !isNonEmptyString(
      input.rejectionReason
    )
  ) {
    addError(
      errors,
      "rejectionReason",
      "Rejection reason is required when rejecting a document.",
      "DOCUMENT_REJECTION_REASON_REQUIRED"
    );
  }

  if (
    input.status !==
      VendorDocumentStatus.REJECTED &&
    input.rejectionReason !== undefined
  ) {
    addError(
      errors,
      "rejectionReason",
      "Rejection reason can only be provided for rejected documents.",
      "UNEXPECTED_DOCUMENT_REJECTION_REASON"
    );
  }

  if (
    input.rejectionReason !== undefined &&
    isNonEmptyString(
      input.rejectionReason
    ) &&
    input.rejectionReason.trim().length >
      1000
  ) {
    addError(
      errors,
      "rejectionReason",
      "Document rejection reason cannot exceed 1000 characters.",
      "DOCUMENT_REJECTION_REASON_TOO_LONG"
    );
  }

  if (
    !isNonEmptyString(input.verifiedBy)
  ) {
    addError(
      errors,
      "verifiedBy",
      "The document reviewer is required.",
      "DOCUMENT_REVIEWER_REQUIRED"
    );
  }

  return resultFromErrors(errors);
}

/**
 * Validates a stored VendorDocument entity.
 */
export function validateVendorDocument(
  document: VendorDocument
): VendorValidationResult {
  const errors: VendorValidationError[] = [];

  if (!document) {
    addError(
      errors,
      "document",
      "Vendor document is required.",
      "VENDOR_DOCUMENT_REQUIRED"
    );

    return resultFromErrors(errors);
  }

  if (!isNonEmptyString(document.id)) {
    addError(
      errors,
      "document.id",
      "Vendor document ID is required.",
      "VENDOR_DOCUMENT_ID_REQUIRED"
    );
  }

  const fieldValidation =
    validateVendorDocumentFields(document);

  const typeRuleValidation =
    validateDocumentTypeRules(document);

  errors.push(
    ...fieldValidation.errors,
    ...typeRuleValidation.errors
  );

  if (!document.status) {
    addError(
      errors,
      "document.status",
      "Vendor document status is required.",
      "VENDOR_DOCUMENT_STATUS_REQUIRED"
    );
  } else if (
    !isEnumValue(
      VendorDocumentStatus,
      document.status
    )
  ) {
    addError(
      errors,
      "document.status",
      "Vendor document status is invalid.",
      "INVALID_VENDOR_DOCUMENT_STATUS"
    );
  }

  if (
    document.status ===
      VendorDocumentStatus.REJECTED &&
    !isNonEmptyString(
      document.rejectionReason
    )
  ) {
    addError(
      errors,
      "document.rejectionReason",
      "Rejection reason is required for a rejected document.",
      "DOCUMENT_REJECTION_REASON_REQUIRED"
    );
  }

  if (
    document.status ===
      VendorDocumentStatus.VERIFIED &&
    !isValidDateValue(
      document.verifiedAt
    )
  ) {
    addError(
      errors,
      "document.verifiedAt",
      "Verification date is required for a verified document.",
      "DOCUMENT_VERIFIED_AT_REQUIRED"
    );
  }

  if (
    document.status ===
      VendorDocumentStatus.VERIFIED &&
    !isNonEmptyString(
      document.verifiedBy
    )
  ) {
    addError(
      errors,
      "document.verifiedBy",
      "Verifier identity is required for a verified document.",
      "DOCUMENT_VERIFIED_BY_REQUIRED"
    );
  }

  if (
    document.verifiedAt !== undefined &&
    !isValidDateValue(
      document.verifiedAt
    )
  ) {
    addError(
      errors,
      "document.verifiedAt",
      "Document verification date is invalid.",
      "INVALID_DOCUMENT_VERIFIED_AT"
    );
  }

  if (
    isValidDateValue(document.expiresAt) &&
    document.expiresAt.getTime() <
      Date.now() &&
    document.status !==
      VendorDocumentStatus.EXPIRED
  ) {
    addError(
      errors,
      "document.status",
      "An expired document must have EXPIRED status.",
      "DOCUMENT_STATUS_EXPIRY_MISMATCH"
    );
  }

  if (
    !isValidDateValue(document.createdAt)
  ) {
    addError(
      errors,
      "document.createdAt",
      "Vendor document creation date is invalid.",
      "INVALID_DOCUMENT_CREATED_AT"
    );
  }

  if (
    !isValidDateValue(document.updatedAt)
  ) {
    addError(
      errors,
      "document.updatedAt",
      "Vendor document update date is invalid.",
      "INVALID_DOCUMENT_UPDATED_AT"
    );
  }

  return resultFromErrors(errors);
}

/**
 * Validates input used to add or replace vendor bank
 * details.
 */
export function validateUpdateVendorBankDetailsInput(
  input: UpdateVendorBankDetailsInput
): VendorValidationResult {
  const errors: VendorValidationError[] = [];

  if (!input) {
    addError(
      errors,
      "bankDetails",
      "Vendor bank details are required.",
      "BANK_DETAILS_REQUIRED"
    );

    return resultFromErrors(errors);
  }

  if (
    !isNonEmptyString(
      input.accountHolderName
    )
  ) {
    addError(
      errors,
      "accountHolderName",
      "Account holder name is required.",
      "ACCOUNT_HOLDER_NAME_REQUIRED"
    );
  } else if (
    input.accountHolderName.trim().length <
      2
  ) {
    addError(
      errors,
      "accountHolderName",
      "Account holder name must contain at least 2 characters.",
      "ACCOUNT_HOLDER_NAME_TOO_SHORT"
    );
  } else if (
    input.accountHolderName.trim().length >
      150
  ) {
    addError(
      errors,
      "accountHolderName",
      "Account holder name cannot exceed 150 characters.",
      "ACCOUNT_HOLDER_NAME_TOO_LONG"
    );
  }

  if (!isNonEmptyString(input.bankName)) {
    addError(
      errors,
      "bankName",
      "Bank name is required.",
      "BANK_NAME_REQUIRED"
    );
  } else if (
    input.bankName.trim().length > 150
  ) {
    addError(
      errors,
      "bankName",
      "Bank name cannot exceed 150 characters.",
      "BANK_NAME_TOO_LONG"
    );
  }

  if (
    !isNonEmptyString(
      input.accountNumber
    )
  ) {
    addError(
      errors,
      "accountNumber",
      "Bank account number is required.",
      "ACCOUNT_NUMBER_REQUIRED"
    );
  } else if (
    !isValidBankAccountNumber(
      input.accountNumber
    )
  ) {
    addError(
      errors,
      "accountNumber",
      "Bank account number must contain between 9 and 18 digits.",
      "INVALID_ACCOUNT_NUMBER"
    );
  }

  if (!input.accountType) {
    addError(
      errors,
      "accountType",
      "Bank account type is required.",
      "ACCOUNT_TYPE_REQUIRED"
    );
  } else if (
    !isEnumValue(
      VendorBankAccountType,
      input.accountType
    )
  ) {
    addError(
      errors,
      "accountType",
      "Bank account type is invalid.",
      "INVALID_ACCOUNT_TYPE"
    );
  }

  if (!isNonEmptyString(input.ifscCode)) {
    addError(
      errors,
      "ifscCode",
      "IFSC code is required.",
      "IFSC_CODE_REQUIRED"
    );
  } else if (
    !isValidIFSC(input.ifscCode)
  ) {
    addError(
      errors,
      "ifscCode",
      "IFSC code format is invalid.",
      "INVALID_IFSC_CODE"
    );
  }

  if (
    input.branchName !== undefined &&
    !isNonEmptyString(
      input.branchName
    )
  ) {
    addError(
      errors,
      "branchName",
      "Branch name cannot be empty when provided.",
      "INVALID_BRANCH_NAME"
    );
  } else if (
    input.branchName !== undefined &&
    input.branchName.trim().length > 150
  ) {
    addError(
      errors,
      "branchName",
      "Branch name cannot exceed 150 characters.",
      "BRANCH_NAME_TOO_LONG"
    );
  }

  if (input.upiId !== undefined) {
    if (!isNonEmptyString(input.upiId)) {
      addError(
        errors,
        "upiId",
        "UPI ID cannot be empty when provided.",
        "INVALID_UPI_ID"
      );
    } else if (
      !isValidUPIId(input.upiId)
    ) {
      addError(
        errors,
        "upiId",
        "UPI ID format is invalid.",
        "INVALID_UPI_ID"
      );
    }
  }

  if (!isNonEmptyString(input.updatedBy)) {
    addError(
      errors,
      "updatedBy",
      "The user updating the bank details is required.",
      "UPDATED_BY_REQUIRED"
    );
  }

  return resultFromErrors(errors);
}

/**
 * Validates a stored VendorBankDetails object.
 */
export function validateVendorBankDetails(
  bankDetails: VendorBankDetails
): VendorValidationResult {
  const errors: VendorValidationError[] = [];

  if (!bankDetails) {
    addError(
      errors,
      "bankDetails",
      "Vendor bank details are required.",
      "BANK_DETAILS_REQUIRED"
    );

    return resultFromErrors(errors);
  }

  const inputValidation =
    validateUpdateVendorBankDetailsInput({
      accountHolderName:
        bankDetails.accountHolderName,
      bankName: bankDetails.bankName,
      accountNumber:
        bankDetails.accountNumber,
      accountType:
        bankDetails.accountType,
      ifscCode: bankDetails.ifscCode,
      branchName:
        bankDetails.branchName,
      upiId: bankDetails.upiId,
      updatedBy: "system-validation",
    });

  errors.push(
    ...inputValidation.errors.filter(
      (error) =>
        error.field !== "updatedBy"
    )
  );

  if (
    typeof bankDetails.verified !==
    "boolean"
  ) {
    addError(
      errors,
      "bankDetails.verified",
      "Bank verification status must be a boolean.",
      "INVALID_BANK_VERIFICATION_STATUS"
    );
  }

  if (
    bankDetails.verified &&
    !isValidDateValue(
      bankDetails.verifiedAt
    )
  ) {
    addError(
      errors,
      "bankDetails.verifiedAt",
      "Bank verification date is required for verified bank details.",
      "BANK_VERIFIED_AT_REQUIRED"
    );
  }

  if (
    bankDetails.verifiedAt !== undefined &&
    !isValidDateValue(
      bankDetails.verifiedAt
    )
  ) {
    addError(
      errors,
      "bankDetails.verifiedAt",
      "Bank verification date is invalid.",
      "INVALID_BANK_VERIFIED_AT"
    );
  }

  if (
    isValidDateValue(
      bankDetails.verifiedAt
    ) &&
    isFutureDate(
      bankDetails.verifiedAt
    )
  ) {
    addError(
      errors,
      "bankDetails.verifiedAt",
      "Bank verification date cannot be in the future.",
      "FUTURE_BANK_VERIFIED_AT"
    );
  }

  return resultFromErrors(errors);
}