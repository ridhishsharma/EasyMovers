/**
 * ============================================================
 * EasyMovers
 * Vendor Application Service
 * ============================================================
 *
 * File:
 * domains/vendor/services/vendor.service.ts
 *
 * Rebuilt against:
 * - vendor.controller.ts
 * - vendor.module.ts
 * - vendor.validator.ts
 * - vendor.model.ts
 * - vendor.mapper.ts
 * - vendor.repository.ts
 *
 * This file intentionally exposes the exact types and methods
 * consumed by the current Vendor controller and module.
 * ============================================================
 */

import {
  VendorDocumentStatus,
  VendorVehicleStatus,
} from "../models/vendor.model";

import {
  isVendorRepositoryError,
} from "../repositories/vendor.repository";

import type * as VendorDomain
  from "../models/vendor.model";

import type * as VendorMapper
  from "../mappers/vendor.mapper";

import type * as VendorRepository
  from "../repositories/vendor.repository";

import type * as VendorValidator
  from "../validators/vendor.validator";

import * as VendorValidators
  from "../validators/vendor.validator";

/* ============================================================
 * Shared service contracts
 * ============================================================
 */

export interface VendorServiceDependencies {
  repository:
    VendorRepository.VendorRepositoryPort;

  transactionManager?:
    VendorRepository
      .VendorRepositoryPortTransactionManager;
}

export interface VendorServiceMutationContext {
  performedBy?: string;
  requestId?: string;
  source?: string;
  ipAddress?: string;
  userAgent?: string;
  performedAt?: Date;
}

export type VendorServiceErrorCode =
  | "INVALID_VENDOR_INPUT"
  | "VENDOR_VALIDATION_FAILED"
  | "VENDOR_NOT_FOUND"
  | "VENDOR_ALREADY_EXISTS"
  | "DUPLICATE_VENDOR_CODE"
  | "DUPLICATE_COMPANY_NAME"
  | "DUPLICATE_EMAIL"
  | "DUPLICATE_PHONE"
  | "DUPLICATE_GST_NUMBER"
  | "DUPLICATE_PAN_NUMBER"
  | "VENDOR_OPERATION_NOT_ALLOWED"
  | "VENDOR_SERVICE_UNAVAILABLE"
  | "VENDOR_CREATE_FAILED"
  | "VENDOR_UPDATE_FAILED"
  | "VENDOR_DELETE_FAILED"
  | "VENDOR_LOOKUP_FAILED"
  | "VENDOR_LIST_FAILED"
  | "VENDOR_TRANSACTION_FAILED"
  | "UNKNOWN_VENDOR_SERVICE_ERROR";

export interface VendorServiceSuccessResult<T> {
  success: true;
  data: T;
}

export interface VendorServiceFailureResult {
  success: false;
  errorCode:
    VendorServiceErrorCode;
  errorMessage: string;
  validationErrors?:
    VendorValidator.VendorValidationError[];
}

export type VendorServiceResult<T> =
  | VendorServiceSuccessResult<T>
  | VendorServiceFailureResult;

export function createVendorServiceSuccess<T>(
  data: T
): VendorServiceSuccessResult<T> {
  return {
    success: true,
    data,
  };
}

export function createVendorServiceFailure(
  errorCode:
    VendorServiceErrorCode,
  errorMessage: string,
  validationErrors?:
    VendorValidator.VendorValidationError[]
): VendorServiceFailureResult {
  return {
    success: false,
    errorCode,
    errorMessage,
    validationErrors,
  };
}

export function createVendorServiceFailureFromError(
  error: unknown,
  fallbackCode:
    VendorServiceErrorCode,
  fallbackMessage: string
): VendorServiceFailureResult {
  if (
    isVendorRepositoryError(
      error
    )
  ) {
    switch (error.code) {
      case "VENDOR_NOT_FOUND":
      case "SERVICE_AREA_NOT_FOUND":
      case "SERVICE_NOT_FOUND":
      case "PRICING_NOT_FOUND":
      case "VEHICLE_NOT_FOUND":
      case "DOCUMENT_NOT_FOUND":
      case "BANK_DETAILS_NOT_FOUND":
        return createVendorServiceFailure(
          "VENDOR_NOT_FOUND",
          error.message
        );

      case "DUPLICATE_EMAIL":
        return createVendorServiceFailure(
          "DUPLICATE_EMAIL",
          error.message
        );

      case "DUPLICATE_PHONE":
        return createVendorServiceFailure(
          "DUPLICATE_PHONE",
          error.message
        );

      case "DUPLICATE_GST_NUMBER":
        return createVendorServiceFailure(
          "DUPLICATE_GST_NUMBER",
          error.message
        );

      case "DUPLICATE_PAN_NUMBER":
        return createVendorServiceFailure(
          "DUPLICATE_PAN_NUMBER",
          error.message
        );

      case "DUPLICATE_VENDOR":
      case "DUPLICATE_REGISTRATION_NUMBER":
      case "DUPLICATE_BANK_ACCOUNT":
      case "DUPLICATE_UPI_ID":
        return createVendorServiceFailure(
          "VENDOR_ALREADY_EXISTS",
          error.message
        );

      case "INVALID_REPOSITORY_INPUT":
        return createVendorServiceFailure(
          "INVALID_VENDOR_INPUT",
          error.message
        );

      case "TRANSACTION_FAILED":
        return createVendorServiceFailure(
          "VENDOR_TRANSACTION_FAILED",
          error.message
        );

      case "DATABASE_ERROR":
        return createVendorServiceFailure(
          "VENDOR_SERVICE_UNAVAILABLE",
          error.message
        );

      default:
        return createVendorServiceFailure(
          fallbackCode,
          error.message ||
            fallbackMessage
        );
    }
  }

  return createVendorServiceFailure(
    fallbackCode,
    error instanceof Error
      ? error.message
      : fallbackMessage
  );
}

export function createValidationFailure(
  validation:
    VendorValidator.VendorValidationResult,
  message:
    string
): VendorServiceFailureResult {
  return createVendorServiceFailure(
    "VENDOR_VALIDATION_FAILED",
    message,
    validation.errors
  );
}

export function toRepositoryMutationContext(
  context?:
    VendorServiceMutationContext
): VendorRepository
  .VendorRepositoryMutationContext |
  undefined {
  if (!context) {
    return undefined;
  }

  return {
    audit: {
      performedBy:
        context.performedBy,
      requestId:
        context.requestId,
      source:
        context.source,
      ipAddress:
        context.ipAddress,
      userAgent:
        context.userAgent,
      performedAt:
        context.performedAt
          ? new Date(
              context
                .performedAt
                .getTime()
            )
          : new Date(),
    },
  };
}

function requireServiceString(
  value: string,
  field: string
): string {
  const normalized =
    value.trim();

  if (!normalized) {
    throw new Error(
      `${field} is required.`
    );
  }

  return normalized;
}

function createRepositoryListQuery(
  input:
    ListVendorsServiceInput
): VendorRepository
  .VendorRepositoryListQuery {
  return {
    filter:
      input.filter,

    pagination:
      input.page ||
      input.pageSize
        ? {
            page:
              input.page ??
              1,
            pageSize:
              input.pageSize ??
              20,
          }
        : undefined,

    sort:
      input.sort,
  };
}

/* ============================================================
 * Aggregate-level inputs
 * ============================================================
 */

export interface CreateVendorServiceInput {
  vendor:
    VendorValidator
      .CompleteVendorOnboardingInput;

  /** Optional externally supplied public Vendor code. */
  vendorCode?: string;

  /** Initial persisted active state. */
  active?: boolean;

  context?:
    VendorServiceMutationContext;
}

export interface UpdateVendorServiceInput {
  vendorId: string;

  changes:
    VendorRepository
      .UpdateVendorRepositoryInput;

  context?:
    VendorServiceMutationContext;
}

export interface DeleteVendorServiceInput {
  vendorId: string;
  softDelete?: boolean;
  reason?: string;
  context?:
    VendorServiceMutationContext;
}

export interface SetVendorActiveStatusServiceInput {
  vendorId: string;
  active: boolean;
  context?:
    VendorServiceMutationContext;
}

export interface ListVendorsServiceInput {
  filter?:
    VendorRepository
      .VendorRepositoryFilter;

  page?: number;
  pageSize?: number;

  sort?:
    VendorRepository
      .VendorRepositorySort;
}

export type ListVendorSummariesServiceInput =
  ListVendorsServiceInput;

/* ============================================================
 * Nested-operation inputs expected by vendor.controller.ts
 * ============================================================
 */

export interface GetVendorNestedRecordsInput {
  vendorId: string;
}

export interface AddVendorServiceAreaServiceInput {
  vendorId: string;
  serviceArea:
    VendorDomain
      .AddVendorServiceAreaInput;
}

export interface UpdateVendorServiceAreaServiceInput {
  vendorId: string;
  serviceAreaId: string;
  changes:
    VendorDomain
      .UpdateVendorServiceAreaInput;
}

export interface DeleteVendorServiceAreaServiceInput {
  vendorId: string;
  serviceAreaId: string;
}

export interface AddVendorDomainServiceInput {
  vendorId: string;
  service:
    VendorDomain
      .UpsertVendorServiceInput;
}

export interface UpdateVendorDomainServiceInput {
  vendorId: string;
  serviceId: string;
  changes:
    VendorDomain
      .UpsertVendorServiceInput;
}

export interface DeleteVendorDomainServiceInput {
  vendorId: string;
  serviceId: string;
}

export interface AddVendorPricingServiceInput {
  vendorId: string;
  pricing:
    VendorDomain
      .AddVendorPricingInput;
}

export interface UpdateVendorPricingServiceInput {
  vendorId: string;
  pricingId: string;
  changes:
    VendorDomain
      .AddVendorPricingInput;
}

export interface DeleteVendorPricingServiceInput {
  vendorId: string;
  pricingId: string;
}

export interface AddVendorVehicleServiceInput {
  vendorId: string;
  vehicle:
    VendorDomain
      .AddVendorVehicleInput;
}

export interface UpdateVendorVehicleServiceInput {
  vendorId: string;
  vehicleId: string;
  changes:
    VendorDomain
      .AddVendorVehicleInput;
}

export interface DeleteVendorVehicleServiceInput {
  vendorId: string;
  vehicleId: string;
}

export interface AddVendorDocumentServiceInput {
  vendorId: string;
  document:
    VendorDomain
      .AddVendorDocumentInput;
}

export interface DeleteVendorDocumentServiceInput {
  vendorId: string;
  documentId: string;
}

export interface ReviewVendorDocumentServiceInput {
  vendorId: string;
  documentId: string;
  review:
    VendorDomain
      .ReviewVendorDocumentInput;
}

export interface UpdateVendorBankDetailsServiceInput {
  vendorId: string;
  bankDetails:
    VendorDomain
      .UpdateVendorBankDetailsInput;
}

export interface VerifyVendorBankDetailsServiceInput {
  vendorId: string;
  verified: boolean;
  verifiedAt?: Date;
}

export interface DeleteVendorBankDetailsServiceInput {
  vendorId: string;
}

/* ============================================================
 * Mapping helpers
 * ============================================================
 */

export function createInitialVendorRepositoryInput(
  input:
    VendorValidator
      .CompleteVendorOnboardingInput,
  options: {
    vendorCode?: string;
    active?: boolean;
  } = {}
): VendorRepository
  .CreateVendorRepositoryInput {
  return {
    vendorCode:
      options.vendorCode
        ?.trim()
        .toUpperCase() ||
      undefined,

    businessDetails:
      input.business,

    ownerDetails:
      input.owner,

    contact:
      input.contact,

    registeredAddress:
      input.registeredAddress,

    operationalAddress:
      input.operationalAddress,

    serviceAreas:
      input.serviceAreas ??
      [],

    services:
      input.services ??
      [],

    pricing:
      input.pricing ??
      [],

    vehicles:
      input.vehicles ??
      [],

    documents:
      input.documents ??
      [],

    bankDetails:
      input.bankDetails,

    active:
      options.active ??
      true,
  };
}

function mapServiceAreaCreateInput(
  input:
    VendorDomain
      .AddVendorServiceAreaInput
): VendorRepository
  .CreateVendorServiceAreaRepositoryInput {
  return {
    scope:
      input.scope,
    originCity:
      input.originCity,
    originState:
      input.originState,
    destinationCity:
      input.destinationCity,
    destinationState:
      input.destinationState,
    serviceablePostalCodes:
      input.serviceablePostalCodes
        ? [
            ...input
              .serviceablePostalCodes,
          ]
        : undefined,
    active:
      input.active ??
      true,
    createdAt:
      new Date(),
    updatedAt:
      new Date(),
  };
}

function mapServiceAreaUpdateInput(
  input:
    VendorDomain
      .UpdateVendorServiceAreaInput
): VendorRepository
  .UpdateVendorServiceAreaRepositoryInput {
  return {
    scope:
      input.scope,
    originCity:
      input.originCity,
    originState:
      input.originState,
    destinationCity:
      input.destinationCity,
    destinationState:
      input.destinationState,
    serviceablePostalCodes:
      input.serviceablePostalCodes
        ? [
            ...input
              .serviceablePostalCodes,
          ]
        : undefined,
    active:
      input.active,
    updatedAt:
      new Date(),
  };
}

function mapVendorServiceCreateInput(
  input:
    VendorDomain
      .UpsertVendorServiceInput
): VendorRepository
  .CreateVendorServiceRepositoryInput {
  return {
    serviceType:
      input.serviceType,
    title:
      input.title.trim(),
    description:
      input.description
        ?.trim(),
    active:
      input.active ??
      true,
    createdAt:
      new Date(),
    updatedAt:
      new Date(),
  };
}

function mapPricingCreateInput(
  input:
    VendorDomain
      .AddVendorPricingInput
): VendorRepository
  .CreateVendorPricingRepositoryInput {
  return {
    serviceType:
      input.serviceType,
    pricingType:
      input.pricingType,
    basePrice:
      input.basePrice,
    minimumPrice:
      input.minimumPrice,
    pricePerKilometre:
      input.pricePerKilometre,
    pricePerKilogram:
      input.pricePerKilogram,
    pricePerItem:
      input.pricePerItem,
    labourCharge:
      input.labourCharge,
    packingCharge:
      input.packingCharge,
    loadingCharge:
      input.loadingCharge,
    unloadingCharge:
      input.unloadingCharge,
    insuranceChargePercentage:
      input.insuranceChargePercentage,
    taxPercentage:
      input.taxPercentage,
    currency:
      input.currency ??
      "INR",
    active:
      input.active ??
      true,
    effectiveFrom:
      input.effectiveFrom,
    effectiveUntil:
      input.effectiveUntil,
    createdAt:
      new Date(),
    updatedAt:
      new Date(),
  };
}

function mapVehicleCreateInput(
  input:
    VendorDomain
      .AddVendorVehicleInput
): VendorRepository
  .CreateVendorVehicleRepositoryInput {
  return {
    registrationNumber:
      input.registrationNumber,
    vehicleType:
      input.vehicleType,
    manufacturer:
      input.manufacturer,
    model:
      input.model,
    manufacturingYear:
      input.manufacturingYear,
    capacityInKilograms:
      input.capacityInKilograms,
    capacityInCubicFeet:
      input.capacityInCubicFeet,
    insuranceNumber:
      input.insuranceNumber,
    insuranceExpiryDate:
      input.insuranceExpiryDate,
    permitNumber:
      input.permitNumber,
    permitExpiryDate:
      input.permitExpiryDate,
    pollutionCertificateExpiryDate:
      input
        .pollutionCertificateExpiryDate,
    status:
      input.status ??
      VendorVehicleStatus.AVAILABLE,
    active:
      input.active ??
      true,
    createdAt:
      new Date(),
    updatedAt:
      new Date(),
  };
}

function mapDocumentCreateInput(
  input:
    VendorDomain
      .AddVendorDocumentInput
): VendorRepository
  .CreateVendorDocumentRepositoryInput {
  return {
    documentType:
      input.documentType,
    documentNumber:
      input.documentNumber,
    documentUrl:
      input.documentUrl,
    fileName:
      input.fileName,
    mimeType:
      input.mimeType,
    status:
      VendorDocumentStatus.PENDING,
    issuedAt:
      input.issuedAt,
    expiresAt:
      input.expiresAt,
    createdAt:
      new Date(),
    updatedAt:
      new Date(),
  };
}

function mapBankDetailsInput(
  input:
    VendorDomain
      .UpdateVendorBankDetailsInput
): VendorRepository
  .UpsertVendorBankDetailsRepositoryInput {
  return {
    accountHolderName:
      input.accountHolderName
        .trim(),
    bankName:
      input.bankName.trim(),
    accountNumber:
      input.accountNumber
        .trim(),
    accountType:
      input.accountType,
    ifscCode:
      input.ifscCode
        .trim()
        .toUpperCase(),
    branchName:
      input.branchName
        ?.trim(),
    upiId:
      input.upiId
        ?.trim()
        .toLowerCase(),
  };
}

/* ============================================================
 * Aggregate Vendor service
 * ============================================================
 */

export class VendorService {
  protected readonly repository:
    VendorRepository
      .VendorRepositoryPort;

  protected readonly transactionManager?:
    VendorRepository
      .VendorRepositoryPortTransactionManager;

  constructor(
    dependencies:
      VendorServiceDependencies
  ) {
    this.repository =
      dependencies.repository;

    this.transactionManager =
      dependencies.transactionManager;
  }

  async createVendor(
    input:
      CreateVendorServiceInput
  ): Promise<
    VendorServiceResult<{
      vendor:
        VendorMapper.VendorAggregate;
      profileCompleteness:
        VendorValidator
          .VendorProfileCompletenessResult;
    }>
  > {
    try {
      const validation =
        VendorValidators
          .validateCompleteVendorOnboardingInput(
            input.vendor
          );

      if (!validation.valid) {
        return createValidationFailure(
          validation,
          "Vendor validation failed."
        );
      }

      const repositoryInput =
        createInitialVendorRepositoryInput(
          input.vendor,
          {
            vendorCode:
              input.vendorCode,

            active:
              input.active,
          }
        );

      const uniqueness =
        await this.repository
          .checkUniqueness({
            companyName:
              repositoryInput
                .businessDetails
                .companyName,
            email:
              repositoryInput
                .contact
                .email,
            phone:
              repositoryInput
                .ownerDetails
                .phone,
            gstNumber:
              repositoryInput
                .businessDetails
                .gstNumber,
            panNumber:
              repositoryInput
                .businessDetails
                .panNumber ??
              repositoryInput
                .ownerDetails
                .panNumber,
          });

      if (uniqueness.exists) {
        return createVendorServiceFailure(
          "VENDOR_ALREADY_EXISTS",
          "A Vendor already exists with the supplied unique details."
        );
      }

      const createOperation =
        (
          repository:
            VendorRepository
              .VendorRepositoryPort
        ) =>
          repository.create(
            repositoryInput
          );

      const vendor =
        this.transactionManager
          ? await this
              .transactionManager
              .runInTransaction(
                ({
                  repository,
                }) =>
                  createOperation(
                    repository
                  )
              )
          : await createOperation(
              this.repository
            );

      return createVendorServiceSuccess({
        vendor,
        profileCompleteness:
          VendorValidators
            .calculateVendorProfileCompleteness(
              input.vendor
            ),
      });
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_CREATE_FAILED",
        "Unable to create Vendor."
      );
    }
  }

  async getVendor(
    input: {
      vendorId: string;
    }
  ): Promise<
    VendorServiceResult<
      VendorMapper.VendorAggregate |
      null
    >
  > {
    try {
      return createVendorServiceSuccess(
        await this.repository
          .findById(
            requireServiceString(
              input.vendorId,
              "Vendor ID"
            )
          )
      );
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_LOOKUP_FAILED",
        "Unable to retrieve Vendor."
      );
    }
  }

  async getVendorByCode(
    input: {
      vendorCode: string;
    }
  ): Promise<
    VendorServiceResult<
      VendorMapper.VendorAggregate |
      null
    >
  > {
    try {
      return createVendorServiceSuccess(
        await this.repository
          .findByVendorCode(
            requireServiceString(
              input.vendorCode,
              "Vendor code"
            ).toUpperCase()
          )
      );
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_LOOKUP_FAILED",
        "Unable to retrieve Vendor."
      );
    }
  }

  async listVendors(
    input:
      ListVendorsServiceInput = {}
  ): Promise<
    VendorServiceResult<
      VendorRepository
        .VendorRepositoryPage<
          VendorMapper
            .VendorAggregate
        >
    >
  > {
    try {
      return createVendorServiceSuccess(
        await this.repository
          .findMany(
            createRepositoryListQuery(
              input
            )
          )
      );
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_LIST_FAILED",
        "Unable to list Vendors."
      );
    }
  }

  async listVendorSummaries(
    input:
      ListVendorSummariesServiceInput = {}
  ): Promise<
    VendorServiceResult<
      VendorRepository
        .VendorRepositoryPage<
          VendorMapper
            .VendorAggregateSummary
        >
    >
  > {
    try {
      return createVendorServiceSuccess(
        await this.repository
          .findSummaries(
            createRepositoryListQuery(
              input
            )
          )
      );
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_LIST_FAILED",
        "Unable to list Vendor summaries."
      );
    }
  }

  async updateVendor(
    input:
      UpdateVendorServiceInput
  ): Promise<
    VendorServiceResult<
      VendorMapper.VendorAggregate |
      null
    >
  > {
    try {
      const vendorId =
        requireServiceString(
          input.vendorId,
          "Vendor ID"
        );

      const updated =
        await this.repository
          .update(
            vendorId,
            {
              ...input.changes,
              updatedAt:
                new Date(),
            }
          );

      return createVendorServiceSuccess(
        updated
      );
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_UPDATE_FAILED",
        "Unable to update Vendor."
      );
    }
  }

  async deleteVendor(
    input:
      DeleteVendorServiceInput
  ): Promise<
    VendorServiceResult<
      VendorRepository
        .VendorRepositoryDeleteResult |
      VendorRepository
        .SoftDeleteVendorRepositoryResult
    >
  > {
    try {
      const vendorId =
        requireServiceString(
          input.vendorId,
          "Vendor ID"
        );

      if (
        input.softDelete ===
        true
      ) {
        return createVendorServiceSuccess(
          await this.repository
            .softDelete({
              vendorId,
              deletedBy:
                input.context
                  ?.performedBy,
              deletedAt:
                input.context
                  ?.performedAt ??
                new Date(),
              reason:
                input.reason,
            })
        );
      }

      return createVendorServiceSuccess(
        await this.repository
          .delete(
            vendorId
          )
      );
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_DELETE_FAILED",
        "Unable to delete Vendor."
      );
    }
  }

  async setVendorActiveStatus(
    input:
      SetVendorActiveStatusServiceInput
  ): Promise<
    VendorServiceResult<
      VendorMapper.VendorAggregate |
      null
    >
  > {
    try {
      const vendorId =
        requireServiceString(
          input.vendorId,
          "Vendor ID"
        );

      return createVendorServiceSuccess(
        await this.repository
          .update(
            vendorId,
            {
              active:
                input.active,
              updatedAt:
                new Date(),
            }
          )
      );
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_UPDATE_FAILED",
        "Unable to update Vendor status."
      );
    }
  }

  async getVendorStatistics():
    Promise<
      VendorServiceResult<
        VendorRepository
          .VendorRepositoryStatistics
      >
    > {
    try {
      return createVendorServiceSuccess(
        await this.repository
          .getStatistics()
      );
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_LOOKUP_FAILED",
        "Unable to retrieve Vendor statistics."
      );
    }
  }
}

/* ============================================================
 * Nested Vendor operations service
 * ============================================================
 */

export class VendorNestedOperationsService {
  protected readonly repository:
    VendorRepository
      .VendorRepositoryPort;

  constructor(
    dependencies:
      VendorServiceDependencies
  ) {
    this.repository =
      dependencies.repository;
  }

  async addServiceArea(
    input:
      AddVendorServiceAreaServiceInput
  ): Promise<
    VendorServiceResult<
      VendorDomain.VendorServiceArea
    >
  > {
    const validation =
      VendorValidators
        .validateAddVendorServiceAreaInput(
          input.serviceArea
        );

    if (!validation.valid) {
      return createValidationFailure(
        validation,
        "Vendor service-area validation failed."
      );
    }

    try {
      return createVendorServiceSuccess(
        await this.repository
          .createServiceArea(
            requireServiceString(
              input.vendorId,
              "Vendor ID"
            ),
            mapServiceAreaCreateInput(
              input.serviceArea
            )
          )
      );
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_UPDATE_FAILED",
        "Unable to add Vendor service area."
      );
    }
  }

  async getServiceAreas(
    input:
      GetVendorNestedRecordsInput
  ): Promise<
    VendorServiceResult<
      VendorDomain
        .VendorServiceArea[]
    >
  > {
    try {
      return createVendorServiceSuccess(
        await this.repository
          .findServiceAreasByVendorId(
            requireServiceString(
              input.vendorId,
              "Vendor ID"
            )
          )
      );
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_LOOKUP_FAILED",
        "Unable to retrieve Vendor service areas."
      );
    }
  }

  async updateServiceArea(
    input:
      UpdateVendorServiceAreaServiceInput
  ): Promise<
    VendorServiceResult<
      VendorDomain.VendorServiceArea |
      null
    >
  > {
    const validation =
      VendorValidators
        .validateUpdateVendorServiceAreaInput(
          input.changes
        );

    if (!validation.valid) {
      return createValidationFailure(
        validation,
        "Vendor service-area validation failed."
      );
    }

    try {
      return createVendorServiceSuccess(
        await this.repository
          .updateServiceArea(
            requireServiceString(
              input.vendorId,
              "Vendor ID"
            ),
            requireServiceString(
              input.serviceAreaId,
              "Service-area ID"
            ),
            mapServiceAreaUpdateInput(
              input.changes
            )
          )
      );
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_UPDATE_FAILED",
        "Unable to update Vendor service area."
      );
    }
  }

  async deleteServiceArea(
    input:
      DeleteVendorServiceAreaServiceInput
  ): Promise<
    VendorServiceResult<{
      deleted: boolean;
    }>
  > {
    try {
      return createVendorServiceSuccess({
        deleted:
          await this.repository
            .deleteServiceArea(
              requireServiceString(
                input.vendorId,
                "Vendor ID"
              ),
              requireServiceString(
                input.serviceAreaId,
                "Service-area ID"
              )
            ),
      });
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_DELETE_FAILED",
        "Unable to delete Vendor service area."
      );
    }
  }

  async addService(
    input:
      AddVendorDomainServiceInput
  ): Promise<
    VendorServiceResult<
      VendorDomain.VendorService
    >
  > {
    const validation =
      VendorValidators
        .validateUpsertVendorServiceInput(
          input.service
        );

    if (!validation.valid) {
      return createValidationFailure(
        validation,
        "Vendor service validation failed."
      );
    }

    try {
      return createVendorServiceSuccess(
        await this.repository
          .createService(
            requireServiceString(
              input.vendorId,
              "Vendor ID"
            ),
            mapVendorServiceCreateInput(
              input.service
            )
          )
      );
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_UPDATE_FAILED",
        "Unable to add Vendor service."
      );
    }
  }

  async getServices(
    input:
      GetVendorNestedRecordsInput
  ): Promise<
    VendorServiceResult<
      VendorDomain.VendorService[]
    >
  > {
    try {
      return createVendorServiceSuccess(
        await this.repository
          .findServicesByVendorId(
            requireServiceString(
              input.vendorId,
              "Vendor ID"
            )
          )
      );
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_LOOKUP_FAILED",
        "Unable to retrieve Vendor services."
      );
    }
  }

  async updateService(
    input:
      UpdateVendorDomainServiceInput
  ): Promise<
    VendorServiceResult<
      VendorDomain.VendorService |
      null
    >
  > {
    const validation =
      VendorValidators
        .validateUpsertVendorServiceInput(
          input.changes
        );

    if (!validation.valid) {
      return createValidationFailure(
        validation,
        "Vendor service validation failed."
      );
    }

    try {
      return createVendorServiceSuccess(
        await this.repository
          .updateService(
            requireServiceString(
              input.vendorId,
              "Vendor ID"
            ),
            requireServiceString(
              input.serviceId,
              "Service ID"
            ),
            {
              ...mapVendorServiceCreateInput(
                input.changes
              ),
              updatedAt:
                new Date(),
            }
          )
      );
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_UPDATE_FAILED",
        "Unable to update Vendor service."
      );
    }
  }

  async deleteService(
    input:
      DeleteVendorDomainServiceInput
  ): Promise<
    VendorServiceResult<{
      deleted: boolean;
    }>
  > {
    try {
      return createVendorServiceSuccess({
        deleted:
          await this.repository
            .deleteService(
              requireServiceString(
                input.vendorId,
                "Vendor ID"
              ),
              requireServiceString(
                input.serviceId,
                "Service ID"
              )
            ),
      });
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_DELETE_FAILED",
        "Unable to delete Vendor service."
      );
    }
  }

  async addPricing(
    input:
      AddVendorPricingServiceInput
  ): Promise<
    VendorServiceResult<
      VendorDomain.VendorPricing
    >
  > {
    const validation =
      VendorValidators
        .validateAddVendorPricingInput(
          input.pricing
        );

    if (!validation.valid) {
      return createValidationFailure(
        validation,
        "Vendor pricing validation failed."
      );
    }

    try {
      return createVendorServiceSuccess(
        await this.repository
          .createPricing(
            requireServiceString(
              input.vendorId,
              "Vendor ID"
            ),
            mapPricingCreateInput(
              input.pricing
            )
          )
      );
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_UPDATE_FAILED",
        "Unable to add Vendor pricing."
      );
    }
  }

  async getPricing(
    input:
      GetVendorNestedRecordsInput
  ): Promise<
    VendorServiceResult<
      VendorDomain.VendorPricing[]
    >
  > {
    try {
      return createVendorServiceSuccess(
        await this.repository
          .findPricingByVendorId(
            requireServiceString(
              input.vendorId,
              "Vendor ID"
            )
          )
      );
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_LOOKUP_FAILED",
        "Unable to retrieve Vendor pricing."
      );
    }
  }

  async updatePricing(
    input:
      UpdateVendorPricingServiceInput
  ): Promise<
    VendorServiceResult<
      VendorDomain.VendorPricing |
      null
    >
  > {
    const validation =
      VendorValidators
        .validateAddVendorPricingInput(
          input.changes
        );

    if (!validation.valid) {
      return createValidationFailure(
        validation,
        "Vendor pricing validation failed."
      );
    }

    try {
      return createVendorServiceSuccess(
        await this.repository
          .updatePricing(
            requireServiceString(
              input.vendorId,
              "Vendor ID"
            ),
            requireServiceString(
              input.pricingId,
              "Pricing ID"
            ),
            {
              ...mapPricingCreateInput(
                input.changes
              ),
              updatedAt:
                new Date(),
            }
          )
      );
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_UPDATE_FAILED",
        "Unable to update Vendor pricing."
      );
    }
  }

  async deletePricing(
    input:
      DeleteVendorPricingServiceInput
  ): Promise<
    VendorServiceResult<{
      deleted: boolean;
    }>
  > {
    try {
      return createVendorServiceSuccess({
        deleted:
          await this.repository
            .deletePricing(
              requireServiceString(
                input.vendorId,
                "Vendor ID"
              ),
              requireServiceString(
                input.pricingId,
                "Pricing ID"
              )
            ),
      });
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_DELETE_FAILED",
        "Unable to delete Vendor pricing."
      );
    }
  }

  async addVehicle(
    input:
      AddVendorVehicleServiceInput
  ): Promise<
    VendorServiceResult<
      VendorDomain.VendorVehicle
    >
  > {
    const validation =
      VendorValidators
        .validateAddVendorVehicleInput(
          input.vehicle
        );

    if (!validation.valid) {
      return createValidationFailure(
        validation,
        "Vendor vehicle validation failed."
      );
    }

    try {
      const duplicate =
        await this.repository
          .vehicleRegistrationExists(
            input.vehicle
              .registrationNumber
          );

      if (duplicate) {
        return createVendorServiceFailure(
          "VENDOR_ALREADY_EXISTS",
          "A vehicle with this registration number already exists."
        );
      }

      return createVendorServiceSuccess(
        await this.repository
          .createVehicle(
            requireServiceString(
              input.vendorId,
              "Vendor ID"
            ),
            mapVehicleCreateInput(
              input.vehicle
            )
          )
      );
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_UPDATE_FAILED",
        "Unable to add Vendor vehicle."
      );
    }
  }

  async getVehicles(
    input:
      GetVendorNestedRecordsInput
  ): Promise<
    VendorServiceResult<
      VendorDomain.VendorVehicle[]
    >
  > {
    try {
      return createVendorServiceSuccess(
        await this.repository
          .findVehiclesByVendorId(
            requireServiceString(
              input.vendorId,
              "Vendor ID"
            )
          )
      );
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_LOOKUP_FAILED",
        "Unable to retrieve Vendor vehicles."
      );
    }
  }

  async updateVehicle(
    input:
      UpdateVendorVehicleServiceInput
  ): Promise<
    VendorServiceResult<
      VendorDomain.VendorVehicle |
      null
    >
  > {
    const validation =
      VendorValidators
        .validateAddVendorVehicleInput(
          input.changes
        );

    if (!validation.valid) {
      return createValidationFailure(
        validation,
        "Vendor vehicle validation failed."
      );
    }

    try {
      const duplicate =
        await this.repository
          .vehicleRegistrationExists(
            input.changes
              .registrationNumber,
            input.vehicleId
          );

      if (duplicate) {
        return createVendorServiceFailure(
          "VENDOR_ALREADY_EXISTS",
          "Another vehicle already uses this registration number."
        );
      }

      return createVendorServiceSuccess(
        await this.repository
          .updateVehicle(
            requireServiceString(
              input.vendorId,
              "Vendor ID"
            ),
            requireServiceString(
              input.vehicleId,
              "Vehicle ID"
            ),
            {
              ...mapVehicleCreateInput(
                input.changes
              ),
              updatedAt:
                new Date(),
            }
          )
      );
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_UPDATE_FAILED",
        "Unable to update Vendor vehicle."
      );
    }
  }

  async deleteVehicle(
    input:
      DeleteVendorVehicleServiceInput
  ): Promise<
    VendorServiceResult<{
      deleted: boolean;
    }>
  > {
    try {
      return createVendorServiceSuccess({
        deleted:
          await this.repository
            .deleteVehicle(
              requireServiceString(
                input.vendorId,
                "Vendor ID"
              ),
              requireServiceString(
                input.vehicleId,
                "Vehicle ID"
              )
            ),
      });
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_DELETE_FAILED",
        "Unable to delete Vendor vehicle."
      );
    }
  }

  async addDocument(
    input:
      AddVendorDocumentServiceInput
  ): Promise<
    VendorServiceResult<
      VendorDomain.VendorDocument
    >
  > {
    const validation =
      VendorValidators
        .validateAddVendorDocumentInput(
          input.document
        );

    if (!validation.valid) {
      return createValidationFailure(
        validation,
        "Vendor document validation failed."
      );
    }

    try {
      return createVendorServiceSuccess(
        await this.repository
          .createDocument(
            requireServiceString(
              input.vendorId,
              "Vendor ID"
            ),
            mapDocumentCreateInput(
              input.document
            )
          )
      );
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_UPDATE_FAILED",
        "Unable to add Vendor document."
      );
    }
  }

  async getDocuments(
    input:
      GetVendorNestedRecordsInput
  ): Promise<
    VendorServiceResult<
      VendorDomain.VendorDocument[]
    >
  > {
    try {
      return createVendorServiceSuccess(
        await this.repository
          .findDocumentsByVendorId(
            requireServiceString(
              input.vendorId,
              "Vendor ID"
            )
          )
      );
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_LOOKUP_FAILED",
        "Unable to retrieve Vendor documents."
      );
    }
  }

  async reviewDocument(
    input:
      ReviewVendorDocumentServiceInput
  ): Promise<
    VendorServiceResult<
      VendorDomain.VendorDocument |
      null
    >
  > {
    const validation =
      VendorValidators
        .validateReviewVendorDocumentInput(
          input.review
        );

    if (!validation.valid) {
      return createValidationFailure(
        validation,
        "Vendor document-review validation failed."
      );
    }

    try {
      return createVendorServiceSuccess(
        await this.repository
          .reviewDocument(
            requireServiceString(
              input.vendorId,
              "Vendor ID"
            ),
            requireServiceString(
              input.documentId,
              "Document ID"
            ),
            {
              status:
                input.review.status,
              rejectionReason:
                input.review
                  .rejectionReason,
              verifiedBy:
                input.review
                  .verifiedBy,
              verifiedAt:
                new Date(),
              updatedAt:
                new Date(),
            }
          )
      );
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_UPDATE_FAILED",
        "Unable to review Vendor document."
      );
    }
  }

  async deleteDocument(
    input:
      DeleteVendorDocumentServiceInput
  ): Promise<
    VendorServiceResult<{
      deleted: boolean;
    }>
  > {
    try {
      return createVendorServiceSuccess({
        deleted:
          await this.repository
            .deleteDocument(
              requireServiceString(
                input.vendorId,
                "Vendor ID"
              ),
              requireServiceString(
                input.documentId,
                "Document ID"
              )
            ),
      });
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_DELETE_FAILED",
        "Unable to delete Vendor document."
      );
    }
  }

  async updateBankDetails(
    input:
      UpdateVendorBankDetailsServiceInput
  ): Promise<
    VendorServiceResult<
      VendorDomain.VendorBankDetails
    >
  > {
    const validation =
      VendorValidators
        .validateUpdateVendorBankDetailsInput(
          input.bankDetails
        );

    if (!validation.valid) {
      return createValidationFailure(
        validation,
        "Vendor bank-details validation failed."
      );
    }

    try {
      const duplicateAccount =
        await this.repository
          .bankAccountExists(
            input.bankDetails
              .accountNumber,
            input.vendorId
          );

      if (duplicateAccount) {
        return createVendorServiceFailure(
          "VENDOR_ALREADY_EXISTS",
          "Another Vendor already uses this bank account."
        );
      }

      if (
        input.bankDetails
          .upiId
      ) {
        const duplicateUpi =
          await this.repository
            .upiIdExists(
              input.bankDetails
                .upiId,
              input.vendorId
            );

        if (duplicateUpi) {
          return createVendorServiceFailure(
            "VENDOR_ALREADY_EXISTS",
            "Another Vendor already uses this UPI ID."
          );
        }
      }

      return createVendorServiceSuccess(
        await this.repository
          .upsertBankDetails(
            requireServiceString(
              input.vendorId,
              "Vendor ID"
            ),
            mapBankDetailsInput(
              input.bankDetails
            )
          )
      );
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_UPDATE_FAILED",
        "Unable to update Vendor bank details."
      );
    }
  }

  async getBankDetails(
    input:
      GetVendorNestedRecordsInput
  ): Promise<
    VendorServiceResult<
      VendorDomain.VendorBankDetails |
      null
    >
  > {
    try {
      return createVendorServiceSuccess(
        await this.repository
          .findBankDetailsByVendorId(
            requireServiceString(
              input.vendorId,
              "Vendor ID"
            )
          )
      );
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_LOOKUP_FAILED",
        "Unable to retrieve Vendor bank details."
      );
    }
  }

  async verifyBankDetails(
    input:
      VerifyVendorBankDetailsServiceInput
  ): Promise<
    VendorServiceResult<
      VendorDomain.VendorBankDetails |
      null
    >
  > {
    try {
      return createVendorServiceSuccess(
        await this.repository
          .verifyBankDetails(
            requireServiceString(
              input.vendorId,
              "Vendor ID"
            ),
            {
              verified:
                input.verified,
              verifiedAt:
                input.verifiedAt ??
                (
                  input.verified
                    ? new Date()
                    : undefined
                ),
            }
          )
      );
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_UPDATE_FAILED",
        "Unable to verify Vendor bank details."
      );
    }
  }

  async deleteBankDetails(
    input:
      DeleteVendorBankDetailsServiceInput
  ): Promise<
    VendorServiceResult<
      VendorRepository
        .DeleteVendorBankDetailsRepositoryResult
    >
  > {
    try {
      return createVendorServiceSuccess(
        await this.repository
          .deleteBankDetails(
            requireServiceString(
              input.vendorId,
              "Vendor ID"
            )
          )
      );
    } catch (error) {
      return createVendorServiceFailureFromError(
        error,
        "VENDOR_DELETE_FAILED",
        "Unable to delete Vendor bank details."
      );
    }
  }
}

/* ============================================================
 * Complete service collection and factories
 * ============================================================
 */

export interface CompleteVendorServiceCollection {
  vendors:
    VendorService;

  operations:
    VendorNestedOperationsService;
}

export function createVendorService(
  dependencies:
    VendorServiceDependencies
): VendorService {
  return new VendorService(
    dependencies
  );
}

export function createVendorNestedOperationsService(
  dependencies:
    VendorServiceDependencies
): VendorNestedOperationsService {
  return new VendorNestedOperationsService(
    dependencies
  );
}

export function createCompleteVendorServiceCollection(
  dependencies:
    VendorServiceDependencies
): CompleteVendorServiceCollection {
  return {
    vendors:
      createVendorService(
        dependencies
      ),

    operations:
      createVendorNestedOperationsService(
        dependencies
      ),
  };
}