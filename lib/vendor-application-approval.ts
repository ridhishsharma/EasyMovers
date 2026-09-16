import {
  VendorBusinessType,
  VendorCategory,
} from "@/domains/vendor/models/vendor.model";
import type {
  CompleteVendorOnboardingInput,
} from "@/domains/vendor/validators/vendor.validator";

export interface ApprovableVendorApplication {
  id: string;
  referenceId: string;
  companyName: string;
  businessType: string;
  operatingCategory: string;
  gstNumber: string | null;
  panNumber: string | null;
  contactName: string;
  mobile: string;
  email: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  consentAt: Date;
}

export class VendorApplicationApprovalMappingError extends Error {
  constructor(
    public readonly code:
      | "INVALID_APPLICATION_BUSINESS_TYPE"
      | "INVALID_APPLICATION_CATEGORY"
      | "APPLICATION_CONSENT_MISSING",
    message: string
  ) {
    super(message);
    this.name = "VendorApplicationApprovalMappingError";
  }
}

function parseBusinessType(value: string): VendorBusinessType {
  if (
    Object.values(VendorBusinessType).includes(
      value as VendorBusinessType
    )
  ) {
    return value as VendorBusinessType;
  }

  throw new VendorApplicationApprovalMappingError(
    "INVALID_APPLICATION_BUSINESS_TYPE",
    "The application business type cannot be converted to a Vendor."
  );
}

function parseCategory(value: string): VendorCategory {
  const normalized = value.trim().toUpperCase();

  if (
    Object.values(VendorCategory).includes(
      normalized as VendorCategory
    )
  ) {
    return normalized as VendorCategory;
  }

  throw new VendorApplicationApprovalMappingError(
    "INVALID_APPLICATION_CATEGORY",
    "The application operating category cannot be converted to a Vendor."
  );
}

function optional(value: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

export function mapVendorApplicationToOnboardingInput(
  application: ApprovableVendorApplication,
  administratorUserId: string
): CompleteVendorOnboardingInput {
  if (
    !(application.consentAt instanceof Date) ||
    !Number.isFinite(application.consentAt.getTime())
  ) {
    throw new VendorApplicationApprovalMappingError(
      "APPLICATION_CONSENT_MISSING",
      "Recorded Vendor terms consent is required before approval."
    );
  }

  const panNumber = optional(application.panNumber);

  return {
    business: {
      companyName: application.companyName.trim(),
      businessType: parseBusinessType(application.businessType),
      category: parseCategory(application.operatingCategory),
      gstNumber: optional(application.gstNumber),
      panNumber,
    },
    owner: {
      fullName: application.contactName.trim(),
      phone: application.mobile.trim(),
      email: application.email.trim(),
    },
    contact: {
      primaryPhone: application.mobile.trim(),
      email: application.email.trim(),
    },
    registeredAddress: {
      addressLine1: application.addressLine1.trim(),
      city: application.city.trim(),
      state: application.state.trim(),
      postalCode: application.postalCode.trim(),
      country: "India",
    },
    serviceAreas: [],
    services: [],
    pricing: [],
    vehicles: [],
    documents: [],
    acceptedTerms: true,
    submittedBy: administratorUserId,
  };
}
