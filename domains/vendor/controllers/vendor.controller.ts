/**
 * ============================================================
 * EasyMovers
 * Vendor Controller
 * ============================================================
 *
 * File
 * ----
 * vendor.controller.ts
 *
 * Part A
 * ------
 * - Framework-independent HTTP contracts
 * - Controller request and response types
 * - API response helpers
 * - Query and parameter normalization
 * - Service-result to HTTP-response conversion
 * - Controller dependencies
 *
 * Responsibilities
 * ----------------
 * The controller layer:
 *
 * - Reads route parameters
 * - Reads query parameters
 * - Reads request bodies
 * - Calls the vendor service layer
 * - Converts service results into HTTP responses
 *
 * The controller must not:
 *
 * - Query the database directly
 * - Contain Prisma logic
 * - Implement domain validation rules
 * - Contain repository operations
 * - Duplicate service-layer business logic
 * ============================================================
 */

import type {
  CompleteVendorServiceCollection,
  CreateVendorServiceInput,
  DeleteVendorServiceInput,
  ListVendorsServiceInput,
  ListVendorSummariesServiceInput,
  SetVendorActiveStatusServiceInput,
  UpdateVendorServiceInput,
  VendorNestedOperationsService,
  VendorService,
  VendorServiceErrorCode,
  VendorServiceFailureResult,
  VendorServiceMutationContext,
  VendorServiceResult,
AddVendorDomainServiceInput,
AddVendorServiceAreaServiceInput,
DeleteVendorDomainServiceInput,
DeleteVendorServiceAreaServiceInput,
GetVendorNestedRecordsInput,
UpdateVendorDomainServiceInput,
UpdateVendorServiceAreaServiceInput,
AddVendorPricingServiceInput,
AddVendorVehicleServiceInput,
DeleteVendorPricingServiceInput,
DeleteVendorVehicleServiceInput,
UpdateVendorPricingServiceInput,
RestoreVendorServiceInput,
UpdateVendorVehicleServiceInput,
AddVendorDocumentServiceInput,
DeleteVendorBankDetailsServiceInput,
DeleteVendorDocumentServiceInput,
ReviewVendorDocumentServiceInput,
UpdateVendorBankDetailsServiceInput,
VerifyVendorBankDetailsServiceInput,
} from "../services/vendor.service";

import type {
  VendorRepositoryFilter,
  VendorRepositorySort,
  VendorRepositorySortDirection,
  VendorRepositorySortField,
} from "../repositories/vendor.repository";

import type {
  AddVendorServiceAreaInput,
  UpdateVendorServiceAreaInput,
  UpsertVendorServiceInput,
AddVendorPricingInput,
AddVendorVehicleInput,
AddVendorDocumentInput,
ReviewVendorDocumentInput,
UpdateVendorBankDetailsInput,
} from "../models/vendor.model";
/**
 * Generic unknown request record.
 */
export type VendorControllerRecord =
  Record<string, unknown>;

/**
 * Framework-independent controller request.
 *
 * An Express, Fastify, Hono, or Next.js adapter can convert
 * its native request object into this structure.
 */
export interface VendorControllerRequest<
  TBody = unknown,
  TParams extends VendorControllerRecord =
    VendorControllerRecord,
  TQuery extends VendorControllerRecord =
    VendorControllerRecord
> {
  body?: TBody;

  params?: TParams;

  query?: TQuery;

  headers?:
    Record<
      string,
      string | string[] | undefined
    >;

  method?: string;

  path?: string;

  requestId?: string;

  ipAddress?: string;

  userAgent?: string;

  authenticatedUserId?: string;
}

/**
 * Standard controller response.
 */
export interface VendorControllerResponse<
  TData = unknown
> {
  status: number;

  body:
    VendorControllerResponseBody<TData>;

  headers?:
    Record<string, string>;
}

/**
 * Standard API-response body.
 */
export interface VendorControllerResponseBody<
  TData = unknown
> {
  success: boolean;

  data?: TData;

  error?: VendorControllerErrorResponse;

  meta?:
    VendorControllerResponseMetadata;
}

/**
 * API error information.
 */
export interface VendorControllerErrorResponse {
  code: string;

  message: string;

  details?: unknown;
}

/**
 * Optional response metadata.
 */
export interface VendorControllerResponseMetadata {
  requestId?: string;

  timestamp: string;

  pagination?: unknown;
}

/**
 * Controller dependency contract.
 */
export interface VendorControllerDependencies {
  /**
   * Aggregate-level vendor operations.
   */
  vendorService:
    VendorService;

  /**
   * Nested vendor operations.
   */
  nestedOperationsService:
    VendorNestedOperationsService;
}

/**
 * Alternative dependency input using the complete service
 * collection factory result.
 */
export interface VendorControllerCollectionDependencies {
  services:
    CompleteVendorServiceCollection;
}

/**
 * Common route-parameter structure.
 */
export interface VendorIdRouteParams
  extends VendorControllerRecord {
  vendorId?: unknown;
}

/**
 * Route parameters containing vendor code.
 */
export interface VendorCodeRouteParams
  extends VendorControllerRecord {
  vendorCode?: unknown;
}

/**
 * Route parameters containing vendor and nested entity IDs.
 */
export interface VendorNestedEntityRouteParams
  extends VendorIdRouteParams {
  entityId?: unknown;

  serviceAreaId?: unknown;

  serviceId?: unknown;

  pricingId?: unknown;

  vehicleId?: unknown;

  documentId?: unknown;
}

/**
 * Common vendor-list query parameters.
 */
export interface VendorListQueryParams
  extends VendorControllerRecord {
  search?: unknown;

  vendorCode?: unknown;

  companyName?: unknown;

  ownerName?: unknown;

  email?: unknown;

  phone?: unknown;

  city?: unknown;

  state?: unknown;

  postalCode?: unknown;

  active?: unknown;

  hasBankDetails?: unknown;

  hasVehicles?: unknown;

  hasVerifiedDocuments?: unknown;

  serviceType?: unknown;

  serviceAreaScope?: unknown;

  vehicleType?: unknown;

  documentType?: unknown;

  createdFrom?: unknown;

  createdUntil?: unknown;

  updatedFrom?: unknown;

  updatedUntil?: unknown;

  page?: unknown;

  pageSize?: unknown;

  sortField?: unknown;

  sortDirection?: unknown;
}

/**
 * Vendor-create controller body.
 */
export type CreateVendorControllerBody =
  CreateVendorServiceInput;

/**
 * Vendor-update controller body.
 */
export type UpdateVendorControllerBody =
  UpdateVendorServiceInput["changes"];

/**
 * Vendor deletion controller query.
 */
export interface DeleteVendorControllerQuery
  extends VendorControllerRecord {
  softDelete?: unknown;

  reason?: unknown;
}

/**
 * Vendor active-status controller body.
 */
export interface SetVendorActiveStatusControllerBody {
  active?: unknown;
}

/**
 * Supported HTTP status codes used by this controller.
 */
export const VENDOR_HTTP_STATUS = {
  OK: 200,

  CREATED: 201,

  NO_CONTENT: 204,

  BAD_REQUEST: 400,

  UNAUTHORIZED: 401,

  FORBIDDEN: 403,

  NOT_FOUND: 404,

  CONFLICT: 409,

  UNPROCESSABLE_ENTITY: 422,

  INTERNAL_SERVER_ERROR: 500,

  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Creates controller response metadata.
 */
export function createVendorControllerMetadata(
  requestId?: string,
  pagination?: unknown
): VendorControllerResponseMetadata {
  return {
    requestId:
      normalizeVendorControllerOptionalString(
        requestId
      ),

    timestamp:
      new Date().toISOString(),

    pagination,
  };
}

/**
 * Creates a successful controller response.
 */
export function createVendorControllerSuccess<
  TData
>(
  status: number,
  data: TData,
  requestId?: string,
  pagination?: unknown
): VendorControllerResponse<TData> {
  return {
    status,

    body: {
      success: true,

      data,

      meta:
        createVendorControllerMetadata(
          requestId,
          pagination
        ),
    },
  };
}

/**
 * Creates a failed controller response.
 */
export function createVendorControllerFailure(
  status: number,
  code: string,
  message: string,
  requestId?: string,
  details?: unknown
): VendorControllerResponse<never> {
  return {
    status,

    body: {
      success: false,

      error: {
        code,

        message,

        details,
      },

      meta:
        createVendorControllerMetadata(
          requestId
        ),
    },
  };
}

/**
 * Creates an HTTP 200 response.
 */
export function createVendorControllerOk<
  TData
>(
  data: TData,
  requestId?: string,
  pagination?: unknown
): VendorControllerResponse<TData> {
  return createVendorControllerSuccess(
    VENDOR_HTTP_STATUS.OK,
    data,
    requestId,
    pagination
  );
}

/**
 * Creates an HTTP 201 response.
 */
export function createVendorControllerCreated<
  TData
>(
  data: TData,
  requestId?: string
): VendorControllerResponse<TData> {
  return createVendorControllerSuccess(
    VENDOR_HTTP_STATUS.CREATED,
    data,
    requestId
  );
}

/**
 * Creates an HTTP 400 response.
 */
export function createVendorControllerBadRequest(
  code: string,
  message: string,
  requestId?: string,
  details?: unknown
): VendorControllerResponse<never> {
  return createVendorControllerFailure(
    VENDOR_HTTP_STATUS.BAD_REQUEST,
    code,
    message,
    requestId,
    details
  );
}

/**
 * Creates an HTTP 404 response.
 */
export function createVendorControllerNotFound(
  code: string,
  message: string,
  requestId?: string,
  details?: unknown
): VendorControllerResponse<never> {
  return createVendorControllerFailure(
    VENDOR_HTTP_STATUS.NOT_FOUND,
    code,
    message,
    requestId,
    details
  );
}

/**
 * Creates an HTTP 409 response.
 */
export function createVendorControllerConflict(
  code: string,
  message: string,
  requestId?: string,
  details?: unknown
): VendorControllerResponse<never> {
  return createVendorControllerFailure(
    VENDOR_HTTP_STATUS.CONFLICT,
    code,
    message,
    requestId,
    details
  );
}

/**
 * Creates an HTTP 422 response.
 */
export function createVendorControllerUnprocessable(
  code: string,
  message: string,
  requestId?: string,
  details?: unknown
): VendorControllerResponse<never> {
  return createVendorControllerFailure(
    VENDOR_HTTP_STATUS
      .UNPROCESSABLE_ENTITY,
    code,
    message,
    requestId,
    details
  );
}

/**
 * Creates an HTTP 500 response.
 */
export function createVendorControllerInternalError(
  code: string,
  message: string,
  requestId?: string,
  details?: unknown
): VendorControllerResponse<never> {
  return createVendorControllerFailure(
    VENDOR_HTTP_STATUS
      .INTERNAL_SERVER_ERROR,
    code,
    message,
    requestId,
    details
  );
}

/**
 * Creates an HTTP 503 response.
 */
export function createVendorControllerUnavailable(
  code: string,
  message: string,
  requestId?: string,
  details?: unknown
): VendorControllerResponse<never> {
  return createVendorControllerFailure(
    VENDOR_HTTP_STATUS
      .SERVICE_UNAVAILABLE,
    code,
    message,
    requestId,
    details
  );
}

/**
 * Normalizes a required string.
 */
export function normalizeVendorControllerString(
  value: unknown
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

/**
 * Normalizes an optional string.
 */
export function normalizeVendorControllerOptionalString(
  value: unknown
): string | undefined {
  const normalized =
    normalizeVendorControllerString(
      value
    );

  return normalized.length > 0
    ? normalized
    : undefined;
}

/**
 * Normalizes an optional integer.
 */
export function normalizeVendorControllerInteger(
  value: unknown
): number | undefined {
  if (
    typeof value === "number" &&
    Number.isInteger(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim().length > 0
  ) {
    const parsedValue =
      Number(value);

    if (
      Number.isInteger(parsedValue)
    ) {
      return parsedValue;
    }
  }

  return undefined;
}

/**
 * Normalizes an optional positive integer.
 */
export function normalizeVendorControllerPositiveInteger(
  value: unknown
): number | undefined {
  const normalized =
    normalizeVendorControllerInteger(
      value
    );

  return (
    normalized !== undefined &&
    normalized > 0
  )
    ? normalized
    : undefined;
}

/**
 * Normalizes an optional boolean.
 *
 * Accepted values:
 *
 * - true
 * - false
 * - "true"
 * - "false"
 * - "1"
 * - "0"
 */
export function normalizeVendorControllerBoolean(
  value: unknown
): boolean | undefined {
  if (typeof value === "boolean") {
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
  }

  if (
    typeof value !== "string"
  ) {
    return undefined;
  }

  const normalized =
    value.trim().toLowerCase();

  if (
    normalized === "true" ||
    normalized === "1"
  ) {
    return true;
  }

  if (
    normalized === "false" ||
    normalized === "0"
  ) {
    return false;
  }

  return undefined;
}

/**
 * Normalizes an optional Date.
 */
export function normalizeVendorControllerDate(
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
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    return undefined;
  }

  const parsedDate =
    new Date(value);

  return Number.isNaN(
    parsedDate.getTime()
  )
    ? undefined
    : parsedDate;
}

/**
 * Reads a request header without depending on header-case.
 */
export function getVendorControllerHeader(
  request:
    VendorControllerRequest,
  headerName: string
): string | undefined {
  const headers =
    request.headers;

  if (!headers) {
    return undefined;
  }

  const normalizedHeaderName =
    headerName.toLowerCase();

  for (
    const [key, value]
    of Object.entries(headers)
  ) {
    if (
      key.toLowerCase() !==
      normalizedHeaderName
    ) {
      continue;
    }

    if (
      typeof value === "string"
    ) {
      return value;
    }

    if (
      Array.isArray(value)
    ) {
      return value[0];
    }
  }

  return undefined;
}

/**
 * Creates service mutation context from a controller request.
 */
export function createVendorControllerMutationContext(
  request:
    VendorControllerRequest
): VendorServiceMutationContext {
  return {
    performedBy:
      normalizeVendorControllerOptionalString(
        request.authenticatedUserId
      ),

    requestId:
      normalizeVendorControllerOptionalString(
        request.requestId
      ) ??
      getVendorControllerHeader(
        request,
        "x-request-id"
      ),

    source:
      "vendor-controller",

    ipAddress:
      normalizeVendorControllerOptionalString(
        request.ipAddress
      ),

    userAgent:
      normalizeVendorControllerOptionalString(
        request.userAgent
      ) ??
      getVendorControllerHeader(
        request,
        "user-agent"
      ),

    performedAt:
      new Date(),
  };
}

/**
 * Maps service errors to HTTP status codes.
 */
export function mapVendorServiceErrorCodeToHttpStatus(
  errorCode:
    VendorServiceErrorCode
): number {
  switch (errorCode) {
    case "INVALID_VENDOR_INPUT":
      return VENDOR_HTTP_STATUS
        .BAD_REQUEST;

    case "VENDOR_VALIDATION_FAILED":
      return VENDOR_HTTP_STATUS
        .UNPROCESSABLE_ENTITY;

    case "VENDOR_NOT_FOUND":
      return VENDOR_HTTP_STATUS
        .NOT_FOUND;

    case "VENDOR_ALREADY_EXISTS":
    case "DUPLICATE_VENDOR_CODE":
    case "DUPLICATE_COMPANY_NAME":
    case "DUPLICATE_EMAIL":
    case "DUPLICATE_PHONE":
    case "DUPLICATE_GST_NUMBER":
    case "DUPLICATE_PAN_NUMBER":
      return VENDOR_HTTP_STATUS
        .CONFLICT;

    case "VENDOR_OPERATION_NOT_ALLOWED":
      return VENDOR_HTTP_STATUS
        .FORBIDDEN;

    case "VENDOR_SERVICE_UNAVAILABLE":
      return VENDOR_HTTP_STATUS
        .SERVICE_UNAVAILABLE;

    case "VENDOR_CREATE_FAILED":
    case "VENDOR_UPDATE_FAILED":
    case "VENDOR_DELETE_FAILED":
    case "VENDOR_LOOKUP_FAILED":
    case "VENDOR_LIST_FAILED":
    case "VENDOR_TRANSACTION_FAILED":
    case "UNKNOWN_VENDOR_SERVICE_ERROR":
    default:
      return VENDOR_HTTP_STATUS
        .INTERNAL_SERVER_ERROR;
  }
}

/**
 * Converts a failed service result into a controller
 * response.
 */
export function mapVendorServiceFailureToControllerResponse(
  result:
    VendorServiceFailureResult,
  requestId?: string
): VendorControllerResponse<never> {
  return createVendorControllerFailure(
    mapVendorServiceErrorCodeToHttpStatus(
      result.errorCode
    ),

    result.errorCode,

    result.errorMessage,

    requestId,

    result.validationErrors
      ? {
          validationErrors:
            result.validationErrors,
        }
      : undefined
  );
}

/**
 * Converts a generic service result into a controller
 * response.
 */
export function mapVendorServiceResultToControllerResponse<
  TData
>(
  result:
    VendorServiceResult<TData>,
  successStatus: number =
    VENDOR_HTTP_STATUS.OK,
  requestId?: string
): VendorControllerResponse<TData> {
  if (
    !result.success ||
    result.data === undefined
  ) {
    return mapVendorServiceFailureToControllerResponse(
      result as
        VendorServiceFailureResult,
      requestId
    );
  }

  return createVendorControllerSuccess(
    successStatus,
    result.data,
    requestId
  );
}

/**
 * Extracts the vendor ID from route parameters.
 */
export function getVendorIdFromRequest(
  request:
    VendorControllerRequest<
      unknown,
      VendorIdRouteParams
    >
): string {
  return normalizeVendorControllerString(
    request.params?.vendorId
  );
}

/**
 * Extracts the vendor code from route parameters.
 */
export function getVendorCodeFromRequest(
  request:
    VendorControllerRequest<
      unknown,
      VendorCodeRouteParams
    >
): string {
  return normalizeVendorControllerString(
    request.params?.vendorCode
  ).toUpperCase();
}

/**
 * Extracts a nested entity ID using a preferred field name.
 */
export function getVendorNestedEntityIdFromRequest(
  request:
    VendorControllerRequest<
      unknown,
      VendorNestedEntityRouteParams
    >,
  field:
    | "entityId"
    | "serviceAreaId"
    | "serviceId"
    | "pricingId"
    | "vehicleId"
    | "documentId"
): string {
  return normalizeVendorControllerString(
    request.params?.[field]
  );
}

/**
 * Normalizes sorting configuration.
 */
export function createVendorControllerSort(
  query:
    VendorListQueryParams
): VendorRepositorySort | undefined {
  const sortField =
    normalizeVendorControllerOptionalString(
      query.sortField
    ) as
      | VendorRepositorySortField
      | undefined;

  const sortDirection =
    normalizeVendorControllerOptionalString(
      query.sortDirection
    )?.toLowerCase() as
      | VendorRepositorySortDirection
      | undefined;

  if (
    !sortField ||
    !sortDirection
  ) {
    return undefined;
  }

  const validFields:
    VendorRepositorySortField[] = [
      "createdAt",
      "updatedAt",
      "companyName",
      "vendorCode",
      "city",
      "state",
    ];

  const validDirections:
    VendorRepositorySortDirection[] = [
      "asc",
      "desc",
    ];

  if (
    !validFields.includes(
      sortField
    ) ||
    !validDirections.includes(
      sortDirection
    )
  ) {
    return undefined;
  }

  return {
    field: sortField,

    direction:
      sortDirection,
  };
}

/**
 * Converts controller list-query parameters into repository
 * filters.
 */
export function createVendorControllerFilter(
  query:
    VendorListQueryParams
): VendorRepositoryFilter {
  return {
    search:
      normalizeVendorControllerOptionalString(
        query.search
      ),

    vendorCode:
      normalizeVendorControllerOptionalString(
        query.vendorCode
      )?.toUpperCase(),

    companyName:
      normalizeVendorControllerOptionalString(
        query.companyName
      ),

    ownerName:
      normalizeVendorControllerOptionalString(
        query.ownerName
      ),

    email:
      normalizeVendorControllerOptionalString(
        query.email
      )?.toLowerCase(),

    phone:
      normalizeVendorControllerOptionalString(
        query.phone
      ),

    city:
      normalizeVendorControllerOptionalString(
        query.city
      ),

    state:
      normalizeVendorControllerOptionalString(
        query.state
      ),

    postalCode:
      normalizeVendorControllerOptionalString(
        query.postalCode
      ),

    active:
      normalizeVendorControllerBoolean(
        query.active
      ),

    hasBankDetails:
      normalizeVendorControllerBoolean(
        query.hasBankDetails
      ),

    hasVehicles:
      normalizeVendorControllerBoolean(
        query.hasVehicles
      ),

    hasVerifiedDocuments:
      normalizeVendorControllerBoolean(
        query.hasVerifiedDocuments
      ),

    serviceType:
      normalizeVendorControllerOptionalString(
        query.serviceType
      ) as VendorRepositoryFilter["serviceType"],

    serviceAreaScope:
      normalizeVendorControllerOptionalString(
        query.serviceAreaScope
      ) as VendorRepositoryFilter["serviceAreaScope"],

    vehicleType:
      normalizeVendorControllerOptionalString(
        query.vehicleType
      ) as VendorRepositoryFilter["vehicleType"],

    documentType:
      normalizeVendorControllerOptionalString(
        query.documentType
      ) as VendorRepositoryFilter["documentType"],

    createdFrom:
      normalizeVendorControllerDate(
        query.createdFrom
      ),

    createdUntil:
      normalizeVendorControllerDate(
        query.createdUntil
      ),

    updatedFrom:
      normalizeVendorControllerDate(
        query.updatedFrom
      ),

    updatedUntil:
      normalizeVendorControllerDate(
        query.updatedUntil
      ),
  };
}

/**
 * Converts list-query parameters into service input.
 */
export function createListVendorsControllerInput(
  query?:
    VendorListQueryParams
): ListVendorsServiceInput {
  const safeQuery =
    query ?? {};

  return {
    filter:
      createVendorControllerFilter(
        safeQuery
      ),

    page:
      normalizeVendorControllerPositiveInteger(
        safeQuery.page
      ),

    pageSize:
      normalizeVendorControllerPositiveInteger(
        safeQuery.pageSize
      ),

    sort:
      createVendorControllerSort(
        safeQuery
      ),
  };
}

/**
 * Converts list-query parameters into summary-list input.
 */
export function createListVendorSummariesControllerInput(
  query?:
    VendorListQueryParams
): ListVendorSummariesServiceInput {
  return createListVendorsControllerInput(
    query
  );
}

/**
 * Creates controller dependencies from a complete service
 * collection.
 */
export function createVendorControllerDependencies(
  input:
    VendorControllerCollectionDependencies
): VendorControllerDependencies {
  return {
    vendorService:
      input.services.vendors,

    nestedOperationsService:
      input.services.operations,
  };
}

/**
 * Aggregate-level vendor controller contract.
 *
 * Endpoint implementations will be added in Part B.
 */
export interface VendorController {
  createVendor(
    request:
      VendorControllerRequest<
        CreateVendorControllerBody
      >
  ): Promise<
    VendorControllerResponse
  >;

  getVendor(
    request:
      VendorControllerRequest<
        unknown,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  >;

  getVendorByCode(
    request:
      VendorControllerRequest<
        unknown,
        VendorCodeRouteParams
      >
  ): Promise<
    VendorControllerResponse
  >;

  listVendors(
    request:
      VendorControllerRequest<
        unknown,
        VendorControllerRecord,
        VendorListQueryParams
      >
  ): Promise<
    VendorControllerResponse
  >;

  listVendorSummaries(
    request:
      VendorControllerRequest<
        unknown,
        VendorControllerRecord,
        VendorListQueryParams
      >
  ): Promise<
    VendorControllerResponse
  >;

  updateVendor(
    request:
      VendorControllerRequest<
        UpdateVendorControllerBody,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  >;

  deleteVendor(
    request:
      VendorControllerRequest<
        unknown,
        VendorIdRouteParams,
        DeleteVendorControllerQuery
      >
  ): Promise<
    VendorControllerResponse
  >;
  restoreVendor(
    request: VendorControllerRequest<
      unknown,
      VendorIdRouteParams
    >
  ): Promise<VendorControllerResponse>;

  setVendorActiveStatus(
    request:
      VendorControllerRequest<
        SetVendorActiveStatusControllerBody,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  >;

  getVendorStatistics(
    request:
      VendorControllerRequest
  ): Promise<
    VendorControllerResponse
  >;
}

/**
 * ============================================================
 * End of Vendor Controller Part A
 * ============================================================
 */
/**
 * ============================================================
 * Vendor Controller
 * Part B
 * ============================================================
 *
 * Aggregate vendor endpoint implementation:
 *
 * - Create vendor
 * - Get vendor
 * - Get vendor by code
 * - List vendors
 * - List vendor summaries
 * - Update vendor
 * - Delete vendor
 * - Activate or deactivate vendor
 * - Vendor statistics
 * ============================================================
 */

/**
 * Default aggregate-level vendor controller.
 */
export class DefaultVendorController
  implements VendorController {
  private readonly vendorService:
    VendorService;

  constructor(
    dependencies:
      VendorControllerDependencies
  ) {
    this.vendorService =
      dependencies.vendorService;
  }

  /**
   * Creates a vendor.
   */
  async createVendor(
    request:
      VendorControllerRequest<
        CreateVendorControllerBody
      >
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      createVendorControllerMutationContext(
        request
      ).requestId;

    try {
      if (
        !request.body ||
        typeof request.body !==
          "object"
      ) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor creation body is required.",
          requestId
        );
      }

      const input:
        CreateVendorServiceInput = {
        ...request.body,

        context:
          createVendorControllerMutationContext(
            request
          ),
      };

      const result =
        await this.vendorService
          .createVendor(input);

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.CREATED,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_CREATE_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to create vendor.",
        requestId
      );
    }
  }

  /**
   * Returns one vendor using its internal ID.
   */
  async getVendor(
    request:
      VendorControllerRequest<
        unknown,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      );

    try {
      const vendorId =
        getVendorIdFromRequest(
          request
        );

      if (!vendorId) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor ID is required.",
          requestId
        );
      }

      const result =
        await this.vendorService
          .getVendor({
            vendorId,
          });

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.OK,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_LOOKUP_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to retrieve vendor.",
        requestId
      );
    }
  }

  /**
   * Returns one vendor using its public vendor code.
   */
  async getVendorByCode(
    request:
      VendorControllerRequest<
        unknown,
        VendorCodeRouteParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      );

    try {
      const vendorCode =
        getVendorCodeFromRequest(
          request
        );

      if (!vendorCode) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor code is required.",
          requestId
        );
      }

      const result =
        await this.vendorService
          .getVendorByCode({
            vendorCode,
          });

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.OK,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_LOOKUP_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to retrieve vendor.",
        requestId
      );
    }
  }

  /**
   * Returns a paginated list of complete vendors.
   */
  async listVendors(
    request:
      VendorControllerRequest<
        unknown,
        VendorControllerRecord,
        VendorListQueryParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      );

    try {
      const input =
        createListVendorsControllerInput(
          request.query
        );

      const result =
        await this.vendorService
          .listVendors(input);

      if (
        !result.success ||
        result.data === undefined
      ) {
        return mapVendorServiceFailureToControllerResponse(
          result as
            VendorServiceFailureResult,
          requestId
        );
      }

      return createVendorControllerOk(
        result.data.items,
        requestId,
        result.data.pagination
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_LIST_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to list vendors.",
        requestId
      );
    }
  }

  /**
   * Returns a paginated list of vendor summaries.
   */
  async listVendorSummaries(
    request:
      VendorControllerRequest<
        unknown,
        VendorControllerRecord,
        VendorListQueryParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      );

    try {
      const input =
        createListVendorSummariesControllerInput(
          request.query
        );

      const result =
        await this.vendorService
          .listVendorSummaries(
            input
          );

      if (
        !result.success ||
        result.data === undefined
      ) {
        return mapVendorServiceFailureToControllerResponse(
          result as
            VendorServiceFailureResult,
          requestId
        );
      }

      return createVendorControllerOk(
        result.data.items,
        requestId,
        result.data.pagination
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_LIST_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to list vendor summaries.",
        requestId
      );
    }
  }

  /**
   * Updates top-level vendor details.
   */
  async updateVendor(
    request:
      VendorControllerRequest<
        UpdateVendorControllerBody,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const context =
      createVendorControllerMutationContext(
        request
      );

    const requestId =
      context.requestId;

    try {
      const vendorId =
        getVendorIdFromRequest(
          request
        );

      if (!vendorId) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor ID is required.",
          requestId
        );
      }

      if (
        !request.body ||
        typeof request.body !==
          "object"
      ) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor update body is required.",
          requestId
        );
      }

      const input:
        UpdateVendorServiceInput = {
        vendorId,

        changes:
          request.body,

        context,
      };

      const result =
        await this.vendorService
          .updateVendor(input);

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.OK,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_UPDATE_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to update vendor.",
        requestId
      );
    }
  }

  /**
   * Deletes or soft-deletes a vendor.
   */
  async deleteVendor(
    request:
      VendorControllerRequest<
        unknown,
        VendorIdRouteParams,
        DeleteVendorControllerQuery
      >
  ): Promise<
    VendorControllerResponse
  > {
    const context =
      createVendorControllerMutationContext(
        request
      );

    const requestId =
      context.requestId;

    try {
      const vendorId =
        getVendorIdFromRequest(
          request
        );

      if (!vendorId) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor ID is required.",
          requestId
        );
      }

      const softDelete =
        normalizeVendorControllerBoolean(
          request.query?.softDelete
        );

      const reason =
        normalizeVendorControllerOptionalString(
          request.query?.reason
        );

      const input:
        DeleteVendorServiceInput = {
        vendorId,

        softDelete,

        reason,

        context,
      };

      const result =
        await this.vendorService
          .deleteVendor(input);

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.OK,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_DELETE_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to delete vendor.",
        requestId
      );
    }
  }
  async restoreVendor(
    request: VendorControllerRequest<
      unknown,
      VendorIdRouteParams
    >
  ): Promise<VendorControllerResponse> {
    const context =
      createVendorControllerMutationContext(request);

    const requestId = context.requestId;

    try {
      const vendorId = getVendorIdFromRequest(request);

      if (!vendorId) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor ID is required.",
          requestId
        );
      }

      const input: RestoreVendorServiceInput = {
        vendorId,
        context,
      };

      const result =
        await this.vendorService.restoreVendor(input);

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.OK,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_RESTORE_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to restore vendor.",
        requestId
      );
    }
  }
  /**
   * Activates or deactivates a vendor.
   */
  async setVendorActiveStatus(
    request:
      VendorControllerRequest<
        SetVendorActiveStatusControllerBody,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const context =
      createVendorControllerMutationContext(
        request
      );

    const requestId =
      context.requestId;

    try {
      const vendorId =
        getVendorIdFromRequest(
          request
        );

      if (!vendorId) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor ID is required.",
          requestId
        );
      }

      const active =
        normalizeVendorControllerBoolean(
          request.body?.active
        );

      if (
        active === undefined
      ) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor active status must be a boolean.",
          requestId
        );
      }

      const input:
        SetVendorActiveStatusServiceInput =
        {
          vendorId,

          active,

          context,
        };

      const result =
        await this.vendorService
          .setVendorActiveStatus(
            input
          );

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.OK,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_UPDATE_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to update vendor status.",
        requestId
      );
    }
  }

  /**
   * Returns vendor statistics.
   */
  async getVendorStatistics(
    request:
      VendorControllerRequest
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      );

    try {
      const result =
        await this.vendorService
          .getVendorStatistics();

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.OK,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_LOOKUP_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to retrieve vendor statistics.",
        requestId
      );
    }
  }
}

/**
 * Creates the aggregate vendor controller.
 */
export function createVendorController(
  dependencies:
    VendorControllerDependencies
): VendorController {
  return new DefaultVendorController(
    dependencies
  );
}

/**
 * Creates the aggregate vendor controller using the complete
 * vendor-service collection.
 */
export function createVendorControllerFromServiceCollection(
  input:
    VendorControllerCollectionDependencies
): VendorController {
  return createVendorController(
    createVendorControllerDependencies(
      input
    )
  );
}

/**
 * ============================================================
 * End of Vendor Controller Part B
 * ============================================================
 */
/**
 * ============================================================
 * Vendor Controller
 * Part C1
 * ============================================================
 *
 * Nested vendor endpoint implementation:
 *
 * - Vendor service areas
 * - Vendor services
 * ============================================================
 */

/**
 * Body used to create a vendor service area.
 */
export type AddVendorServiceAreaControllerBody =
  AddVendorServiceAreaInput;

/**
 * Body used to update a vendor service area.
 */
export type UpdateVendorServiceAreaControllerBody =
  UpdateVendorServiceAreaInput;

/**
 * Body used to create or update a vendor service.
 */
export type UpsertVendorDomainServiceControllerBody =
  UpsertVendorServiceInput;

/**
 * Service-area controller contract.
 */
export interface VendorServiceAreaController {
  addServiceArea(
    request:
      VendorControllerRequest<
        AddVendorServiceAreaControllerBody,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  >;

  getServiceAreas(
    request:
      VendorControllerRequest<
        unknown,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  >;

  updateServiceArea(
    request:
      VendorControllerRequest<
        UpdateVendorServiceAreaControllerBody,
        VendorNestedEntityRouteParams
      >
  ): Promise<
    VendorControllerResponse
  >;

  deleteServiceArea(
    request:
      VendorControllerRequest<
        unknown,
        VendorNestedEntityRouteParams
      >
  ): Promise<
    VendorControllerResponse
  >;
}

/**
 * Vendor-domain service controller contract.
 *
 * This handles the services offered by a vendor and must not
 * be confused with the application service layer.
 */
export interface VendorDomainServiceController {
  addService(
    request:
      VendorControllerRequest<
        UpsertVendorDomainServiceControllerBody,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  >;

  getServices(
    request:
      VendorControllerRequest<
        unknown,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  >;

  updateService(
    request:
      VendorControllerRequest<
        UpsertVendorDomainServiceControllerBody,
        VendorNestedEntityRouteParams
      >
  ): Promise<
    VendorControllerResponse
  >;

  deleteService(
    request:
      VendorControllerRequest<
        unknown,
        VendorNestedEntityRouteParams
      >
  ): Promise<
    VendorControllerResponse
  >;
}

/**
 * Combined Part C1 controller contract.
 */
export interface VendorControllerPartC1
  extends
    VendorServiceAreaController,
    VendorDomainServiceController {}

/**
 * Default controller for vendor service areas and vendor
 * services.
 */
export class DefaultVendorControllerPartC1
  implements VendorControllerPartC1 {
  private readonly nestedOperationsService:
    VendorNestedOperationsService;

  constructor(
    dependencies:
      VendorControllerDependencies
  ) {
    this.nestedOperationsService =
      dependencies.nestedOperationsService;
  }

  /**
   * Creates a service area for a vendor.
   */
  async addServiceArea(
    request:
      VendorControllerRequest<
        AddVendorServiceAreaControllerBody,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      );

    try {
      const vendorId =
        getVendorIdFromRequest(
          request
        );

      if (!vendorId) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor ID is required.",
          requestId
        );
      }

      if (
        !request.body ||
        typeof request.body !==
          "object"
      ) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor service-area body is required.",
          requestId
        );
      }

      const input:
        AddVendorServiceAreaServiceInput =
        {
          vendorId,

          serviceArea:
            request.body,
        };

      const result =
        await this.nestedOperationsService
          .addServiceArea(input);

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.CREATED,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_UPDATE_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to add vendor service area.",
        requestId
      );
    }
  }

  /**
   * Returns all service areas belonging to a vendor.
   */
  async getServiceAreas(
    request:
      VendorControllerRequest<
        unknown,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      );

    try {
      const vendorId =
        getVendorIdFromRequest(
          request
        );

      if (!vendorId) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor ID is required.",
          requestId
        );
      }

      const input:
        GetVendorNestedRecordsInput =
        {
          vendorId,
        };

      const result =
        await this.nestedOperationsService
          .getServiceAreas(input);

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.OK,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_LOOKUP_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to retrieve vendor service areas.",
        requestId
      );
    }
  }

  /**
   * Updates one vendor service area.
   */
  async updateServiceArea(
    request:
      VendorControllerRequest<
        UpdateVendorServiceAreaControllerBody,
        VendorNestedEntityRouteParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      );

    try {
      const vendorId =
        getVendorIdFromRequest(
          request
        );

      const serviceAreaId =
        getVendorNestedEntityIdFromRequest(
          request,
          "serviceAreaId"
        );

      if (
        !vendorId ||
        !serviceAreaId
      ) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor ID and service-area ID are required.",
          requestId
        );
      }

      if (
        !request.body ||
        typeof request.body !==
          "object"
      ) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor service-area update body is required.",
          requestId
        );
      }

      const input:
        UpdateVendorServiceAreaServiceInput =
        {
          vendorId,

          serviceAreaId,

          changes:
            request.body,
        };

      const result =
        await this.nestedOperationsService
          .updateServiceArea(input);

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.OK,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_UPDATE_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to update vendor service area.",
        requestId
      );
    }
  }

  /**
   * Deletes one vendor service area.
   */
  async deleteServiceArea(
    request:
      VendorControllerRequest<
        unknown,
        VendorNestedEntityRouteParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      );

    try {
      const vendorId =
        getVendorIdFromRequest(
          request
        );

      const serviceAreaId =
        getVendorNestedEntityIdFromRequest(
          request,
          "serviceAreaId"
        );

      if (
        !vendorId ||
        !serviceAreaId
      ) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor ID and service-area ID are required.",
          requestId
        );
      }

      const input:
        DeleteVendorServiceAreaServiceInput =
        {
          vendorId,

          serviceAreaId,
        };

      const result =
        await this.nestedOperationsService
          .deleteServiceArea(input);

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.OK,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_DELETE_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to delete vendor service area.",
        requestId
      );
    }
  }

  /**
   * Adds a service offered by a vendor.
   */
  async addService(
    request:
      VendorControllerRequest<
        UpsertVendorDomainServiceControllerBody,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      );

    try {
      const vendorId =
        getVendorIdFromRequest(
          request
        );

      if (!vendorId) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor ID is required.",
          requestId
        );
      }

      if (
        !request.body ||
        typeof request.body !==
          "object"
      ) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor service body is required.",
          requestId
        );
      }

      const input:
        AddVendorDomainServiceInput =
        {
          vendorId,

          service:
            request.body,
        };

      const result =
        await this.nestedOperationsService
          .addService(input);

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.CREATED,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_UPDATE_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to add vendor service.",
        requestId
      );
    }
  }

  /**
   * Returns all services offered by a vendor.
   */
  async getServices(
    request:
      VendorControllerRequest<
        unknown,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      );

    try {
      const vendorId =
        getVendorIdFromRequest(
          request
        );

      if (!vendorId) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor ID is required.",
          requestId
        );
      }

      const input:
        GetVendorNestedRecordsInput =
        {
          vendorId,
        };

      const result =
        await this.nestedOperationsService
          .getServices(input);

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.OK,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_LOOKUP_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to retrieve vendor services.",
        requestId
      );
    }
  }

  /**
   * Updates one service offered by a vendor.
   */
  async updateService(
    request:
      VendorControllerRequest<
        UpsertVendorDomainServiceControllerBody,
        VendorNestedEntityRouteParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      );

    try {
      const vendorId =
        getVendorIdFromRequest(
          request
        );

      const serviceId =
        getVendorNestedEntityIdFromRequest(
          request,
          "serviceId"
        );

      if (
        !vendorId ||
        !serviceId
      ) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor ID and service ID are required.",
          requestId
        );
      }

      if (
        !request.body ||
        typeof request.body !==
          "object"
      ) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor service update body is required.",
          requestId
        );
      }

      const input:
        UpdateVendorDomainServiceInput =
        {
          vendorId,

          serviceId,

          changes:
            request.body,
        };

      const result =
        await this.nestedOperationsService
          .updateService(input);

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.OK,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_UPDATE_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to update vendor service.",
        requestId
      );
    }
  }

  /**
   * Deletes one service offered by a vendor.
   */
  async deleteService(
    request:
      VendorControllerRequest<
        unknown,
        VendorNestedEntityRouteParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      );

    try {
      const vendorId =
        getVendorIdFromRequest(
          request
        );

      const serviceId =
        getVendorNestedEntityIdFromRequest(
          request,
          "serviceId"
        );

      if (
        !vendorId ||
        !serviceId
      ) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor ID and service ID are required.",
          requestId
        );
      }

      const input:
        DeleteVendorDomainServiceInput =
        {
          vendorId,

          serviceId,
        };

      const result =
        await this.nestedOperationsService
          .deleteService(input);

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.OK,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_DELETE_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to delete vendor service.",
        requestId
      );
    }
  }
}

/**
 * Creates the Part C1 vendor controller.
 */
export function createVendorControllerPartC1(
  dependencies:
    VendorControllerDependencies
): VendorControllerPartC1 {
  return new DefaultVendorControllerPartC1(
    dependencies
  );
}

/**
 * Creates the Part C1 controller from a complete service
 * collection.
 */
export function createVendorControllerPartC1FromServiceCollection(
  input:
    VendorControllerCollectionDependencies
): VendorControllerPartC1 {
  return createVendorControllerPartC1(
    createVendorControllerDependencies(
      input
    )
  );
}

/**
 * Aggregate and Part C1 controller collection.
 */
export interface VendorControllerCollectionPartC1 {
  vendors:
    VendorController;

  serviceAreasAndServices:
    VendorControllerPartC1;
}

/**
 * Creates aggregate and Part C1 controllers.
 */
export function createVendorControllerCollectionPartC1(
  dependencies:
    VendorControllerDependencies
): VendorControllerCollectionPartC1 {
  return {
    vendors:
      createVendorController(
        dependencies
      ),

    serviceAreasAndServices:
      createVendorControllerPartC1(
        dependencies
      ),
  };
}

/**
 * ============================================================
 * End of Vendor Controller Part C1
 * ============================================================
 */
/**
 * ============================================================
 * Vendor Controller
 * Part C2
 * ============================================================
 *
 * Nested vendor endpoint implementation:
 *
 * - Vendor pricing
 * - Vendor vehicles
 * ============================================================
 */

/**
 * Body used to create or update vendor pricing.
 */
export type AddVendorPricingControllerBody =
  AddVendorPricingInput;

/**
 * Body used to create or update a vendor vehicle.
 */
export type AddVendorVehicleControllerBody =
  AddVendorVehicleInput;

/**
 * Vendor pricing controller contract.
 */
export interface VendorPricingController {
  addPricing(
    request:
      VendorControllerRequest<
        AddVendorPricingControllerBody,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  >;

  getPricing(
    request:
      VendorControllerRequest<
        unknown,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  >;

  updatePricing(
    request:
      VendorControllerRequest<
        AddVendorPricingControllerBody,
        VendorNestedEntityRouteParams
      >
  ): Promise<
    VendorControllerResponse
  >;

  deletePricing(
    request:
      VendorControllerRequest<
        unknown,
        VendorNestedEntityRouteParams
      >
  ): Promise<
    VendorControllerResponse
  >;
}

/**
 * Vendor vehicle controller contract.
 */
export interface VendorVehicleController {
  addVehicle(
    request:
      VendorControllerRequest<
        AddVendorVehicleControllerBody,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  >;

  getVehicles(
    request:
      VendorControllerRequest<
        unknown,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  >;

  updateVehicle(
    request:
      VendorControllerRequest<
        AddVendorVehicleControllerBody,
        VendorNestedEntityRouteParams
      >
  ): Promise<
    VendorControllerResponse
  >;

  deleteVehicle(
    request:
      VendorControllerRequest<
        unknown,
        VendorNestedEntityRouteParams
      >
  ): Promise<
    VendorControllerResponse
  >;
}

/**
 * Combined Part C2 controller contract.
 */
export interface VendorControllerPartC2
  extends
    VendorPricingController,
    VendorVehicleController {}

/**
 * Default controller for vendor pricing and vehicles.
 */
export class DefaultVendorControllerPartC2
  implements VendorControllerPartC2 {
  private readonly nestedOperationsService:
    VendorNestedOperationsService;

  constructor(
    dependencies:
      VendorControllerDependencies
  ) {
    this.nestedOperationsService =
      dependencies.nestedOperationsService;
  }

  /**
   * Adds vendor pricing.
   */
  async addPricing(
    request:
      VendorControllerRequest<
        AddVendorPricingControllerBody,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      );

    try {
      const vendorId =
        getVendorIdFromRequest(
          request
        );

      if (!vendorId) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor ID is required.",
          requestId
        );
      }

      if (
        !request.body ||
        typeof request.body !==
          "object"
      ) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor pricing body is required.",
          requestId
        );
      }

      const input:
        AddVendorPricingServiceInput =
        {
          vendorId,

          pricing:
            request.body,
        };

      const result =
        await this.nestedOperationsService
          .addPricing(input);

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.CREATED,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_UPDATE_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to add vendor pricing.",
        requestId
      );
    }
  }

  /**
   * Returns all pricing records belonging to a vendor.
   */
  async getPricing(
    request:
      VendorControllerRequest<
        unknown,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      );

    try {
      const vendorId =
        getVendorIdFromRequest(
          request
        );

      if (!vendorId) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor ID is required.",
          requestId
        );
      }

      const result =
        await this.nestedOperationsService
          .getPricing({
            vendorId,
          });

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.OK,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_LOOKUP_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to retrieve vendor pricing.",
        requestId
      );
    }
  }

  /**
   * Updates one vendor pricing record.
   */
  async updatePricing(
    request:
      VendorControllerRequest<
        AddVendorPricingControllerBody,
        VendorNestedEntityRouteParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      );

    try {
      const vendorId =
        getVendorIdFromRequest(
          request
        );

      const pricingId =
        getVendorNestedEntityIdFromRequest(
          request,
          "pricingId"
        );

      if (
        !vendorId ||
        !pricingId
      ) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor ID and pricing ID are required.",
          requestId
        );
      }

      if (
        !request.body ||
        typeof request.body !==
          "object"
      ) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor pricing update body is required.",
          requestId
        );
      }

      const input:
        UpdateVendorPricingServiceInput =
        {
          vendorId,

          pricingId,

          changes:
            request.body,
        };

      const result =
        await this.nestedOperationsService
          .updatePricing(input);

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.OK,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_UPDATE_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to update vendor pricing.",
        requestId
      );
    }
  }

  /**
   * Deletes one vendor pricing record.
   */
  async deletePricing(
    request:
      VendorControllerRequest<
        unknown,
        VendorNestedEntityRouteParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      );

    try {
      const vendorId =
        getVendorIdFromRequest(
          request
        );

      const pricingId =
        getVendorNestedEntityIdFromRequest(
          request,
          "pricingId"
        );

      if (
        !vendorId ||
        !pricingId
      ) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor ID and pricing ID are required.",
          requestId
        );
      }

      const input:
        DeleteVendorPricingServiceInput =
        {
          vendorId,

          pricingId,
        };

      const result =
        await this.nestedOperationsService
          .deletePricing(input);

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.OK,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_DELETE_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to delete vendor pricing.",
        requestId
      );
    }
  }

  /**
   * Adds a vehicle to a vendor.
   */
  async addVehicle(
    request:
      VendorControllerRequest<
        AddVendorVehicleControllerBody,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      );

    try {
      const vendorId =
        getVendorIdFromRequest(
          request
        );

      if (!vendorId) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor ID is required.",
          requestId
        );
      }

      if (
        !request.body ||
        typeof request.body !==
          "object"
      ) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor vehicle body is required.",
          requestId
        );
      }

      const input:
        AddVendorVehicleServiceInput =
        {
          vendorId,

          vehicle:
            request.body,
        };

      const result =
        await this.nestedOperationsService
          .addVehicle(input);

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.CREATED,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_UPDATE_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to add vendor vehicle.",
        requestId
      );
    }
  }

  /**
   * Returns all vehicles belonging to a vendor.
   */
  async getVehicles(
    request:
      VendorControllerRequest<
        unknown,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      );

    try {
      const vendorId =
        getVendorIdFromRequest(
          request
        );

      if (!vendorId) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor ID is required.",
          requestId
        );
      }

      const result =
        await this.nestedOperationsService
          .getVehicles({
            vendorId,
          });

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.OK,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_LOOKUP_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to retrieve vendor vehicles.",
        requestId
      );
    }
  }

  /**
   * Updates one vendor vehicle.
   */
  async updateVehicle(
    request:
      VendorControllerRequest<
        AddVendorVehicleControllerBody,
        VendorNestedEntityRouteParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      );

    try {
      const vendorId =
        getVendorIdFromRequest(
          request
        );

      const vehicleId =
        getVendorNestedEntityIdFromRequest(
          request,
          "vehicleId"
        );

      if (
        !vendorId ||
        !vehicleId
      ) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor ID and vehicle ID are required.",
          requestId
        );
      }

      if (
        !request.body ||
        typeof request.body !==
          "object"
      ) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor vehicle update body is required.",
          requestId
        );
      }

      const input:
        UpdateVendorVehicleServiceInput =
        {
          vendorId,

          vehicleId,

          changes:
            request.body,
        };

      const result =
        await this.nestedOperationsService
          .updateVehicle(input);

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.OK,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_UPDATE_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to update vendor vehicle.",
        requestId
      );
    }
  }

  /**
   * Deletes one vendor vehicle.
   */
  async deleteVehicle(
    request:
      VendorControllerRequest<
        unknown,
        VendorNestedEntityRouteParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      );

    try {
      const vendorId =
        getVendorIdFromRequest(
          request
        );

      const vehicleId =
        getVendorNestedEntityIdFromRequest(
          request,
          "vehicleId"
        );

      if (
        !vendorId ||
        !vehicleId
      ) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor ID and vehicle ID are required.",
          requestId
        );
      }

      const input:
        DeleteVendorVehicleServiceInput =
        {
          vendorId,

          vehicleId,
        };

      const result =
        await this.nestedOperationsService
          .deleteVehicle(input);

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.OK,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_DELETE_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to delete vendor vehicle.",
        requestId
      );
    }
  }
}

/**
 * Creates the Part C2 vendor controller.
 */
export function createVendorControllerPartC2(
  dependencies:
    VendorControllerDependencies
): VendorControllerPartC2 {
  return new DefaultVendorControllerPartC2(
    dependencies
  );
}

/**
 * Creates the Part C2 controller from a complete service
 * collection.
 */
export function createVendorControllerPartC2FromServiceCollection(
  input:
    VendorControllerCollectionDependencies
): VendorControllerPartC2 {
  return createVendorControllerPartC2(
    createVendorControllerDependencies(
      input
    )
  );
}

/**
 * Aggregate, C1, and C2 controller collection.
 */
export interface VendorControllerCollectionPartC2 {
  vendors:
    VendorController;

  serviceAreasAndServices:
    VendorControllerPartC1;

  pricingAndVehicles:
    VendorControllerPartC2;
}

/**
 * Creates aggregate, C1, and C2 controllers.
 */
export function createVendorControllerCollectionPartC2(
  dependencies:
    VendorControllerDependencies
): VendorControllerCollectionPartC2 {
  return {
    vendors:
      createVendorController(
        dependencies
      ),

    serviceAreasAndServices:
      createVendorControllerPartC1(
        dependencies
      ),

    pricingAndVehicles:
      createVendorControllerPartC2(
        dependencies
      ),
  };
}

/**
 * ============================================================
 * End of Vendor Controller Part C2
 * ============================================================
 */
/**
 * ============================================================
 * Vendor Controller
 * Part C3
 * ============================================================
 *
 * Nested vendor endpoint implementation:
 *
 * - Vendor documents
 * - Document review
 * - Vendor bank details
 * - Bank verification
 * ============================================================
 */

/**
 * Body used to add vendor document metadata.
 */
export type AddVendorDocumentControllerBody =
  AddVendorDocumentInput;

/**
 * Body used to review a vendor document.
 */
export type ReviewVendorDocumentControllerBody =
  ReviewVendorDocumentInput;

/**
 * Body used to add or replace vendor bank details.
 */
export type UpdateVendorBankDetailsControllerBody =
  UpdateVendorBankDetailsInput;

/**
 * Body used to update bank verification status.
 */
export interface VerifyVendorBankDetailsControllerBody {
  verified?: unknown;

  verifiedAt?: unknown;
}

/**
 * Vendor-document controller contract.
 */
export interface VendorDocumentController {
  addDocument(
    request:
      VendorControllerRequest<
        AddVendorDocumentControllerBody,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  >;

  getDocuments(
    request:
      VendorControllerRequest<
        unknown,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  >;

  reviewDocument(
    request:
      VendorControllerRequest<
        ReviewVendorDocumentControllerBody,
        VendorNestedEntityRouteParams
      >
  ): Promise<
    VendorControllerResponse
  >;

  deleteDocument(
    request:
      VendorControllerRequest<
        unknown,
        VendorNestedEntityRouteParams
      >
  ): Promise<
    VendorControllerResponse
  >;
}

/**
 * Vendor bank-details controller contract.
 */
export interface VendorBankDetailsController {
  updateBankDetails(
    request:
      VendorControllerRequest<
        UpdateVendorBankDetailsControllerBody,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  >;

  getBankDetails(
    request:
      VendorControllerRequest<
        unknown,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  >;

  verifyBankDetails(
    request:
      VendorControllerRequest<
        VerifyVendorBankDetailsControllerBody,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  >;

  deleteBankDetails(
    request:
      VendorControllerRequest<
        unknown,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  >;
}

/**
 * Combined Part C3 controller contract.
 */
export interface VendorControllerPartC3
  extends
    VendorDocumentController,
    VendorBankDetailsController {}

/**
 * Default controller for vendor documents and bank details.
 */
export class DefaultVendorControllerPartC3
  implements VendorControllerPartC3 {
  private readonly nestedOperationsService:
    VendorNestedOperationsService;

  constructor(
    dependencies:
      VendorControllerDependencies
  ) {
    this.nestedOperationsService =
      dependencies.nestedOperationsService;
  }

  /**
   * Adds document metadata for a vendor.
   */
  async addDocument(
    request:
      VendorControllerRequest<
        AddVendorDocumentControllerBody,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      );

    try {
      const vendorId =
        getVendorIdFromRequest(
          request
        );

      if (!vendorId) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor ID is required.",
          requestId
        );
      }

      if (
        !request.body ||
        typeof request.body !==
          "object"
      ) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor document body is required.",
          requestId
        );
      }

      const input:
        AddVendorDocumentServiceInput =
        {
          vendorId,

          document:
            request.body,
        };

      const result =
        await this.nestedOperationsService
          .addDocument(input);

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.CREATED,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_UPDATE_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to add vendor document.",
        requestId
      );
    }
  }

  /**
   * Returns all documents belonging to a vendor.
   */
  async getDocuments(
    request:
      VendorControllerRequest<
        unknown,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      );

    try {
      const vendorId =
        getVendorIdFromRequest(
          request
        );

      if (!vendorId) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor ID is required.",
          requestId
        );
      }

      const result =
        await this.nestedOperationsService
          .getDocuments({
            vendorId,
          });

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.OK,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_LOOKUP_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to retrieve vendor documents.",
        requestId
      );
    }
  }

  /**
   * Reviews or verifies a vendor document.
   */
  async reviewDocument(
    request:
      VendorControllerRequest<
        ReviewVendorDocumentControllerBody,
        VendorNestedEntityRouteParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      );

    try {
      const vendorId =
        getVendorIdFromRequest(
          request
        );

      const documentId =
        getVendorNestedEntityIdFromRequest(
          request,
          "documentId"
        );

      if (
        !vendorId ||
        !documentId
      ) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor ID and document ID are required.",
          requestId
        );
      }

      if (
        !request.body ||
        typeof request.body !==
          "object"
      ) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Document review body is required.",
          requestId
        );
      }

      const input:
        ReviewVendorDocumentServiceInput =
        {
          vendorId,

          documentId,

          review:
            request.body,
        };

      const result =
        await this.nestedOperationsService
          .reviewDocument(input);

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.OK,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_UPDATE_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to review vendor document.",
        requestId
      );
    }
  }

  /**
   * Deletes one vendor document.
   */
  async deleteDocument(
    request:
      VendorControllerRequest<
        unknown,
        VendorNestedEntityRouteParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      );

    try {
      const vendorId =
        getVendorIdFromRequest(
          request
        );

      const documentId =
        getVendorNestedEntityIdFromRequest(
          request,
          "documentId"
        );

      if (
        !vendorId ||
        !documentId
      ) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor ID and document ID are required.",
          requestId
        );
      }

      const input:
        DeleteVendorDocumentServiceInput =
        {
          vendorId,

          documentId,
        };

      const result =
        await this.nestedOperationsService
          .deleteDocument(input);

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.OK,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_DELETE_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to delete vendor document.",
        requestId
      );
    }
  }

  /**
   * Adds or replaces vendor bank details.
   */
  async updateBankDetails(
    request:
      VendorControllerRequest<
        UpdateVendorBankDetailsControllerBody,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      );

    try {
      const vendorId =
        getVendorIdFromRequest(
          request
        );

      if (!vendorId) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor ID is required.",
          requestId
        );
      }

      if (
        !request.body ||
        typeof request.body !==
          "object"
      ) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor bank-details body is required.",
          requestId
        );
      }

      const input:
        UpdateVendorBankDetailsServiceInput =
        {
          vendorId,

          bankDetails:
            request.body,
        };

      const result =
        await this.nestedOperationsService
          .updateBankDetails(input);

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.OK,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_UPDATE_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to update vendor bank details.",
        requestId
      );
    }
  }

  /**
   * Returns bank details belonging to a vendor.
   */
  async getBankDetails(
    request:
      VendorControllerRequest<
        unknown,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      );

    try {
      const vendorId =
        getVendorIdFromRequest(
          request
        );

      if (!vendorId) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor ID is required.",
          requestId
        );
      }

      const result =
        await this.nestedOperationsService
          .getBankDetails({
            vendorId,
          });

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.OK,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_LOOKUP_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to retrieve vendor bank details.",
        requestId
      );
    }
  }

  /**
   * Updates the vendor bank verification status.
   */
  async verifyBankDetails(
    request:
      VendorControllerRequest<
        VerifyVendorBankDetailsControllerBody,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      );

    try {
      const vendorId =
        getVendorIdFromRequest(
          request
        );

      if (!vendorId) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor ID is required.",
          requestId
        );
      }

      if (
        !request.body ||
        typeof request.body !==
          "object"
      ) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Bank verification body is required.",
          requestId
        );
      }

      const verified =
        normalizeVendorControllerBoolean(
          request.body.verified
        );

      if (verified === undefined) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Bank verification status must be a boolean.",
          requestId
        );
      }

      const rawVerifiedAt =
        request.body.verifiedAt;

      const verifiedAt =
        normalizeVendorControllerDate(
          rawVerifiedAt
        );

      if (
        rawVerifiedAt !== undefined &&
        verifiedAt === undefined
      ) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Bank verification date is invalid.",
          requestId
        );
      }

      const input:
        VerifyVendorBankDetailsServiceInput =
        {
          vendorId,

          verified,

          verifiedAt,
        };

      const result =
        await this.nestedOperationsService
          .verifyBankDetails(input);

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.OK,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_UPDATE_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to verify vendor bank details.",
        requestId
      );
    }
  }

  /**
   * Deletes vendor bank details.
   */
  async deleteBankDetails(
    request:
      VendorControllerRequest<
        unknown,
        VendorIdRouteParams
      >
  ): Promise<
    VendorControllerResponse
  > {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      );

    try {
      const vendorId =
        getVendorIdFromRequest(
          request
        );

      if (!vendorId) {
        return createVendorControllerBadRequest(
          "INVALID_VENDOR_INPUT",
          "Vendor ID is required.",
          requestId
        );
      }

      const input:
        DeleteVendorBankDetailsServiceInput =
        {
          vendorId,
        };

      const result =
        await this.nestedOperationsService
          .deleteBankDetails(input);

      return mapVendorServiceResultToControllerResponse(
        result,
        VENDOR_HTTP_STATUS.OK,
        requestId
      );
    } catch (error) {
      return createVendorControllerInternalError(
        "VENDOR_DELETE_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to delete vendor bank details.",
        requestId
      );
    }
  }
}

/**
 * Creates the Part C3 vendor controller.
 */
export function createVendorControllerPartC3(
  dependencies:
    VendorControllerDependencies
): VendorControllerPartC3 {
  return new DefaultVendorControllerPartC3(
    dependencies
  );
}

/**
 * Creates the Part C3 controller from a complete service
 * collection.
 */
export function createVendorControllerPartC3FromServiceCollection(
  input:
    VendorControllerCollectionDependencies
): VendorControllerPartC3 {
  return createVendorControllerPartC3(
    createVendorControllerDependencies(
      input
    )
  );
}

/**
 * Aggregate and nested controller collection.
 */
export interface CompleteVendorControllerCollection {
  vendors:
    VendorController;

  serviceAreasAndServices:
    VendorControllerPartC1;

  pricingAndVehicles:
    VendorControllerPartC2;

  documentsAndBankDetails:
    VendorControllerPartC3;
}

/**
 * Creates the complete controller collection developed
 * through Parts A, B, C1, C2, and C3.
 */
export function createCompleteVendorControllerCollection(
  dependencies:
    VendorControllerDependencies
): CompleteVendorControllerCollection {
  return {
    vendors:
      createVendorController(
        dependencies
      ),

    serviceAreasAndServices:
      createVendorControllerPartC1(
        dependencies
      ),

    pricingAndVehicles:
      createVendorControllerPartC2(
        dependencies
      ),

    documentsAndBankDetails:
      createVendorControllerPartC3(
        dependencies
      ),
  };
}

/**
 * Creates the complete controller collection from the
 * complete vendor-service collection.
 */
export function createCompleteVendorControllerCollectionFromServices(
  input:
    VendorControllerCollectionDependencies
): CompleteVendorControllerCollection {
  return createCompleteVendorControllerCollection(
    createVendorControllerDependencies(
      input
    )
  );
}

/**
 * ============================================================
 * End of Vendor Controller Part C3
 * ============================================================
 */
/**
 * ============================================================
 * Vendor Controller
 * Part D
 * ============================================================
 *
 * Final controller composition and adapter utilities:
 *
 * - Unified vendor controller contract
 * - Route metadata
 * - Controller-handler lookup
 * - Safe controller execution
 * - Framework adapter contracts
 * - Final controller factories
 * ============================================================
 */

/**
 * Supported vendor controller route names.
 *
 * These identifiers are framework-independent and can later
 * be mapped to:
 *
 * - Next.js route handlers
 * - Express routes
 * - Fastify routes
 * - Hono routes
 * - API documentation
 */
export type VendorControllerRouteName =
  | "createVendor"
  | "getVendor"
  | "getVendorByCode"
  | "listVendors"
  | "listVendorSummaries"
  | "updateVendor"
  | "deleteVendor"
  | "restoreVendor"
  | "setVendorActiveStatus"
  | "getVendorStatistics"
  | "addServiceArea"
  | "getServiceAreas"
  | "updateServiceArea"
  | "deleteServiceArea"
  | "addService"
  | "getServices"
  | "updateService"
  | "deleteService"
  | "addPricing"
  | "getPricing"
  | "updatePricing"
  | "deletePricing"
  | "addVehicle"
  | "getVehicles"
  | "updateVehicle"
  | "deleteVehicle"
  | "addDocument"
  | "getDocuments"
  | "reviewDocument"
  | "deleteDocument"
  | "updateBankDetails"
  | "getBankDetails"
  | "verifyBankDetails"
  | "deleteBankDetails";

/**
 * Supported HTTP methods.
 */
export type VendorControllerHttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE";

/**
 * Vendor route-access category.
 */
export type VendorControllerAccessLevel =
  | "PUBLIC"
  | "AUTHENTICATED"
  | "VENDOR"
  | "ADMIN";

/**
 * Vendor route metadata.
 */
export interface VendorControllerRouteDefinition {
  name:
    VendorControllerRouteName;

  method:
    VendorControllerHttpMethod;

  path: string;

  access:
    VendorControllerAccessLevel;

  description: string;
}

/**
 * Framework-independent handler function.
 */
export type VendorControllerHandler =
  (
    request:
      VendorControllerRequest
  ) => Promise<
    VendorControllerResponse
  >;

/**
 * Complete unified vendor controller contract.
 *
 * This combines aggregate and nested controller operations
 * into one object that route adapters can consume.
 */
export interface CompleteVendorController
  extends
    VendorController,
    VendorControllerPartC1,
    VendorControllerPartC2,
    VendorControllerPartC3 {}

/**
 * Complete vendor route definitions.
 *
 * Parameter names must remain aligned with the controller
 * contracts:
 *
 * - vendorId
 * - vendorCode
 * - serviceAreaId
 * - serviceId
 * - pricingId
 * - vehicleId
 * - documentId
 */
export const VENDOR_CONTROLLER_ROUTES:
  readonly VendorControllerRouteDefinition[] =
  [
    {
      name: "createVendor",
      method: "POST",
      path: "/vendors",
      access: "AUTHENTICATED",
      description:
        "Creates a complete vendor.",
    },
    {
      name: "listVendors",
      method: "GET",
      path: "/vendors",
      access: "ADMIN",
      description:
        "Returns a paginated vendor list.",
    },
    {
      name: "listVendorSummaries",
      method: "GET",
      path: "/vendors/summaries",
      access: "ADMIN",
      description:
        "Returns paginated vendor summaries.",
    },
    {
      name: "getVendorStatistics",
      method: "GET",
      path: "/vendors/statistics",
      access: "ADMIN",
      description:
        "Returns vendor statistics.",
    },
    {
      name: "getVendorByCode",
      method: "GET",
      path: "/vendors/code/:vendorCode",
      access: "AUTHENTICATED",
      description:
        "Returns a vendor using its public code.",
    },
    {
      name: "getVendor",
      method: "GET",
      path: "/vendors/:vendorId",
      access: "AUTHENTICATED",
      description:
        "Returns a vendor using its internal ID.",
    },
    {
      name: "updateVendor",
      method: "PUT",
      path: "/vendors/:vendorId",
      access: "VENDOR",
      description:
        "Updates top-level vendor information.",
    },
    {
      name: "deleteVendor",
      method: "DELETE",
      path: "/vendors/:vendorId",
      access: "ADMIN",
      description:
        "Deletes or soft-deletes a vendor.",
    },
    {
      name: "restoreVendor",
      method: "POST",
      path: "/vendors/:vendorId/restore",
      access: "ADMIN",
      description:
        "Restores a soft-deleted vendor without changing its status.",
    },
    {
      name: "setVendorActiveStatus",
      method: "PATCH",
      path: "/vendors/:vendorId/status",
      access: "ADMIN",
      description:
        "Activates or deactivates a vendor.",
    },

    {
      name: "addServiceArea",
      method: "POST",
      path:
        "/vendors/:vendorId/service-areas",
      access: "VENDOR",
      description:
        "Adds a vendor service area.",
    },
    {
      name: "getServiceAreas",
      method: "GET",
      path:
        "/vendors/:vendorId/service-areas",
      access: "AUTHENTICATED",
      description:
        "Returns vendor service areas.",
    },
    {
      name: "updateServiceArea",
      method: "PUT",
      path:
        "/vendors/:vendorId/service-areas/:serviceAreaId",
      access: "VENDOR",
      description:
        "Updates one vendor service area.",
    },
    {
      name: "deleteServiceArea",
      method: "DELETE",
      path:
        "/vendors/:vendorId/service-areas/:serviceAreaId",
      access: "VENDOR",
      description:
        "Deletes one vendor service area.",
    },

    {
      name: "addService",
      method: "POST",
      path:
        "/vendors/:vendorId/services",
      access: "VENDOR",
      description:
        "Adds a service offered by a vendor.",
    },
    {
      name: "getServices",
      method: "GET",
      path:
        "/vendors/:vendorId/services",
      access: "AUTHENTICATED",
      description:
        "Returns services offered by a vendor.",
    },
    {
      name: "updateService",
      method: "PUT",
      path:
        "/vendors/:vendorId/services/:serviceId",
      access: "VENDOR",
      description:
        "Updates a service offered by a vendor.",
    },
    {
      name: "deleteService",
      method: "DELETE",
      path:
        "/vendors/:vendorId/services/:serviceId",
      access: "VENDOR",
      description:
        "Deletes a service offered by a vendor.",
    },

    {
      name: "addPricing",
      method: "POST",
      path:
        "/vendors/:vendorId/pricing",
      access: "VENDOR",
      description:
        "Adds vendor pricing.",
    },
    {
      name: "getPricing",
      method: "GET",
      path:
        "/vendors/:vendorId/pricing",
      access: "AUTHENTICATED",
      description:
        "Returns vendor pricing.",
    },
    {
      name: "updatePricing",
      method: "PUT",
      path:
        "/vendors/:vendorId/pricing/:pricingId",
      access: "VENDOR",
      description:
        "Updates one vendor pricing record.",
    },
    {
      name: "deletePricing",
      method: "DELETE",
      path:
        "/vendors/:vendorId/pricing/:pricingId",
      access: "VENDOR",
      description:
        "Deletes one vendor pricing record.",
    },

    {
      name: "addVehicle",
      method: "POST",
      path:
        "/vendors/:vendorId/vehicles",
      access: "VENDOR",
      description:
        "Adds a vendor vehicle.",
    },
    {
      name: "getVehicles",
      method: "GET",
      path:
        "/vendors/:vendorId/vehicles",
      access: "AUTHENTICATED",
      description:
        "Returns vendor vehicles.",
    },
    {
      name: "updateVehicle",
      method: "PUT",
      path:
        "/vendors/:vendorId/vehicles/:vehicleId",
      access: "VENDOR",
      description:
        "Updates one vendor vehicle.",
    },
    {
      name: "deleteVehicle",
      method: "DELETE",
      path:
        "/vendors/:vendorId/vehicles/:vehicleId",
      access: "VENDOR",
      description:
        "Deletes one vendor vehicle.",
    },

    {
      name: "addDocument",
      method: "POST",
      path:
        "/vendors/:vendorId/documents",
      access: "VENDOR",
      description:
        "Adds vendor document metadata.",
    },
    {
      name: "getDocuments",
      method: "GET",
      path:
        "/vendors/:vendorId/documents",
      access: "AUTHENTICATED",
      description:
        "Returns vendor documents.",
    },
    {
      name: "reviewDocument",
      method: "PATCH",
      path:
        "/vendors/:vendorId/documents/:documentId/review",
      access: "ADMIN",
      description:
        "Reviews or verifies a vendor document.",
    },
    {
      name: "deleteDocument",
      method: "DELETE",
      path:
        "/vendors/:vendorId/documents/:documentId",
      access: "VENDOR",
      description:
        "Deletes one vendor document.",
    },

    {
      name: "updateBankDetails",
      method: "PUT",
      path:
        "/vendors/:vendorId/bank-details",
      access: "VENDOR",
      description:
        "Adds or replaces vendor bank details.",
    },
    {
      name: "getBankDetails",
      method: "GET",
      path:
        "/vendors/:vendorId/bank-details",
      access: "VENDOR",
      description:
        "Returns vendor bank details.",
    },
    {
      name: "verifyBankDetails",
      method: "PATCH",
      path:
        "/vendors/:vendorId/bank-details/verification",
      access: "ADMIN",
      description:
        "Updates bank-detail verification status.",
    },
    {
      name: "deleteBankDetails",
      method: "DELETE",
      path:
        "/vendors/:vendorId/bank-details",
      access: "VENDOR",
      description:
        "Deletes vendor bank details.",
    },
  ] as const;

/**
 * Combines separate controller implementations into one
 * complete controller object.
 */
export function createUnifiedVendorController(
  collection:
    CompleteVendorControllerCollection
): CompleteVendorController {
  return {
    createVendor:
      collection.vendors
        .createVendor
        .bind(
          collection.vendors
        ),

    getVendor:
      collection.vendors
        .getVendor
        .bind(
          collection.vendors
        ),

    getVendorByCode:
      collection.vendors
        .getVendorByCode
        .bind(
          collection.vendors
        ),

    listVendors:
      collection.vendors
        .listVendors
        .bind(
          collection.vendors
        ),

    listVendorSummaries:
      collection.vendors
        .listVendorSummaries
        .bind(
          collection.vendors
        ),

    updateVendor:
      collection.vendors
        .updateVendor
        .bind(
          collection.vendors
        ),

    deleteVendor:
      collection.vendors
        .deleteVendor
        .bind(
          collection.vendors
        ),
    restoreVendor:
      collection.vendors.restoreVendor.bind(
        collection.vendors
      ),
    setVendorActiveStatus:
      collection.vendors
        .setVendorActiveStatus
        .bind(
          collection.vendors
        ),

    getVendorStatistics:
      collection.vendors
        .getVendorStatistics
        .bind(
          collection.vendors
        ),

    addServiceArea:
      collection
        .serviceAreasAndServices
        .addServiceArea
        .bind(
          collection
            .serviceAreasAndServices
        ),

    getServiceAreas:
      collection
        .serviceAreasAndServices
        .getServiceAreas
        .bind(
          collection
            .serviceAreasAndServices
        ),

    updateServiceArea:
      collection
        .serviceAreasAndServices
        .updateServiceArea
        .bind(
          collection
            .serviceAreasAndServices
        ),

    deleteServiceArea:
      collection
        .serviceAreasAndServices
        .deleteServiceArea
        .bind(
          collection
            .serviceAreasAndServices
        ),

    addService:
      collection
        .serviceAreasAndServices
        .addService
        .bind(
          collection
            .serviceAreasAndServices
        ),

    getServices:
      collection
        .serviceAreasAndServices
        .getServices
        .bind(
          collection
            .serviceAreasAndServices
        ),

    updateService:
      collection
        .serviceAreasAndServices
        .updateService
        .bind(
          collection
            .serviceAreasAndServices
        ),

    deleteService:
      collection
        .serviceAreasAndServices
        .deleteService
        .bind(
          collection
            .serviceAreasAndServices
        ),

    addPricing:
      collection
        .pricingAndVehicles
        .addPricing
        .bind(
          collection
            .pricingAndVehicles
        ),

    getPricing:
      collection
        .pricingAndVehicles
        .getPricing
        .bind(
          collection
            .pricingAndVehicles
        ),

    updatePricing:
      collection
        .pricingAndVehicles
        .updatePricing
        .bind(
          collection
            .pricingAndVehicles
        ),

    deletePricing:
      collection
        .pricingAndVehicles
        .deletePricing
        .bind(
          collection
            .pricingAndVehicles
        ),

    addVehicle:
      collection
        .pricingAndVehicles
        .addVehicle
        .bind(
          collection
            .pricingAndVehicles
        ),

    getVehicles:
      collection
        .pricingAndVehicles
        .getVehicles
        .bind(
          collection
            .pricingAndVehicles
        ),

    updateVehicle:
      collection
        .pricingAndVehicles
        .updateVehicle
        .bind(
          collection
            .pricingAndVehicles
        ),

    deleteVehicle:
      collection
        .pricingAndVehicles
        .deleteVehicle
        .bind(
          collection
            .pricingAndVehicles
        ),

    addDocument:
      collection
        .documentsAndBankDetails
        .addDocument
        .bind(
          collection
            .documentsAndBankDetails
        ),

    getDocuments:
      collection
        .documentsAndBankDetails
        .getDocuments
        .bind(
          collection
            .documentsAndBankDetails
        ),

    reviewDocument:
      collection
        .documentsAndBankDetails
        .reviewDocument
        .bind(
          collection
            .documentsAndBankDetails
        ),

    deleteDocument:
      collection
        .documentsAndBankDetails
        .deleteDocument
        .bind(
          collection
            .documentsAndBankDetails
        ),

    updateBankDetails:
      collection
        .documentsAndBankDetails
        .updateBankDetails
        .bind(
          collection
            .documentsAndBankDetails
        ),

    getBankDetails:
      collection
        .documentsAndBankDetails
        .getBankDetails
        .bind(
          collection
            .documentsAndBankDetails
        ),

    verifyBankDetails:
      collection
        .documentsAndBankDetails
        .verifyBankDetails
        .bind(
          collection
            .documentsAndBankDetails
        ),

    deleteBankDetails:
      collection
        .documentsAndBankDetails
        .deleteBankDetails
        .bind(
          collection
            .documentsAndBankDetails
        ),
  };
}

/**
 * Creates the final unified vendor controller directly from
 * controller dependencies.
 */
export function createCompleteVendorController(
  dependencies:
    VendorControllerDependencies
): CompleteVendorController {
  return createUnifiedVendorController(
    createCompleteVendorControllerCollection(
      dependencies
    )
  );
}

/**
 * Creates the final unified controller from the complete
 * vendor service collection.
 */
export function createCompleteVendorControllerFromServices(
  input:
    VendorControllerCollectionDependencies
): CompleteVendorController {
  return createCompleteVendorController(
    createVendorControllerDependencies(
      input
    )
  );
}

/**
 * Returns metadata for a named controller route.
 */
export function getVendorControllerRouteDefinition(
  routeName:
    VendorControllerRouteName
): VendorControllerRouteDefinition | undefined {
  return VENDOR_CONTROLLER_ROUTES.find(
    (route) =>
      route.name === routeName
  );
}

/**
 * Returns route definitions matching an HTTP method.
 */
export function getVendorControllerRoutesByMethod(
  method:
    VendorControllerHttpMethod
): VendorControllerRouteDefinition[] {
  return VENDOR_CONTROLLER_ROUTES
    .filter(
      (route) =>
        route.method === method
    )
    .map(
      (route) => ({
        ...route,
      })
    );
}

/**
 * Returns route definitions matching an access level.
 */
export function getVendorControllerRoutesByAccessLevel(
  access:
    VendorControllerAccessLevel
): VendorControllerRouteDefinition[] {
  return VENDOR_CONTROLLER_ROUTES
    .filter(
      (route) =>
        route.access === access
    )
    .map(
      (route) => ({
        ...route,
      })
    );
}

/**
 * Returns the correct handler from the complete controller.
 */
export function getVendorControllerHandler(
  controller:
    CompleteVendorController,
  routeName:
    VendorControllerRouteName
): VendorControllerHandler {
  const handler =
    controller[routeName];

  return handler.bind(
    controller
  ) as VendorControllerHandler;
}

/**
 * Determines whether a value is a supported vendor route
 * name.
 */
export function isVendorControllerRouteName(
  value: unknown
): value is VendorControllerRouteName {
  if (
    typeof value !== "string"
  ) {
    return false;
  }

  return VENDOR_CONTROLLER_ROUTES.some(
    (route) =>
      route.name === value
  );
}

/**
 * Executes a controller handler safely.
 *
 * This provides a final protection layer for framework
 * adapters. Individual controllers already catch expected
 * failures, but this prevents an unexpected escaped error
 * from crashing the route adapter.
 */
export async function executeVendorControllerHandler(
  handler:
    VendorControllerHandler,
  request:
    VendorControllerRequest
): Promise<
  VendorControllerResponse
> {
  try {
    return await handler(
      request
    );
  } catch (error) {
    const requestId =
      normalizeVendorControllerOptionalString(
        request.requestId
      ) ??
      getVendorControllerHeader(
        request,
        "x-request-id"
      );

    return createVendorControllerInternalError(
      "UNKNOWN_VENDOR_CONTROLLER_ERROR",
      error instanceof Error
        ? error.message
        : "An unexpected vendor controller error occurred.",
      requestId
    );
  }
}

/**
 * Executes a named route on the complete controller.
 */
export async function executeVendorControllerRoute(
  controller:
    CompleteVendorController,
  routeName:
    VendorControllerRouteName,
  request:
    VendorControllerRequest
): Promise<
  VendorControllerResponse
> {
  const handler =
    getVendorControllerHandler(
      controller,
      routeName
    );

  return executeVendorControllerHandler(
    handler,
    request
  );
}

/**
 * Generic framework response adapter.
 *
 * A framework integration supplies a function that converts
 * VendorControllerResponse into the framework's native
 * response type.
 */
export type VendorControllerResponseAdapter<
  TFrameworkResponse
> = (
  response:
    VendorControllerResponse
) => TFrameworkResponse
  | Promise<TFrameworkResponse>;

/**
 * Framework route-adapter input.
 */
export interface VendorFrameworkRouteAdapterInput<
  TFrameworkRequest,
  TFrameworkResponse
> {
  controller:
    CompleteVendorController;

  routeName:
    VendorControllerRouteName;

  mapRequest:
    (
      request:
        TFrameworkRequest
    ) =>
      VendorControllerRequest
      | Promise<
          VendorControllerRequest
        >;

  mapResponse:
    VendorControllerResponseAdapter<
      TFrameworkResponse
    >;
}

/**
 * Creates a framework-specific handler from the
 * framework-independent vendor controller.
 */
export function createVendorFrameworkRouteHandler<
  TFrameworkRequest,
  TFrameworkResponse
>(
  input:
    VendorFrameworkRouteAdapterInput<
      TFrameworkRequest,
      TFrameworkResponse
    >
): (
  request:
    TFrameworkRequest
) => Promise<
  TFrameworkResponse
> {
  return async (
    frameworkRequest:
      TFrameworkRequest
  ): Promise<
    TFrameworkResponse
  > => {
    const controllerRequest =
      await input.mapRequest(
        frameworkRequest
      );

    const controllerResponse =
      await executeVendorControllerRoute(
        input.controller,
        input.routeName,
        controllerRequest
      );

    return input.mapResponse(
      controllerResponse
    );
  };
}

/**
 * Adds a request ID to a controller request when one is not
 * already present.
 */
export function ensureVendorControllerRequestId<
  TBody,
  TParams extends VendorControllerRecord,
  TQuery extends VendorControllerRecord
>(
  request:
    VendorControllerRequest<
      TBody,
      TParams,
      TQuery
    >,
  generateRequestId:
    () => string
): VendorControllerRequest<
  TBody,
  TParams,
  TQuery
> {
  const existingRequestId =
    normalizeVendorControllerOptionalString(
      request.requestId
    ) ??
    getVendorControllerHeader(
      request,
      "x-request-id"
    );

  return {
    ...request,

    requestId:
      existingRequestId ??
      generateRequestId(),
  };
}

/**
 * Creates a simple fallback request ID.
 *
 * A production adapter may replace this with UUID generation
 * or an infrastructure request-ID provider.
 */
export function createVendorControllerRequestId():
  string {
  return [
    "vendor",
    Date.now().toString(36),
    Math.random()
      .toString(36)
      .slice(2, 10),
  ].join("-");
}

/**
 * Creates a defensive copy of a controller response.
 */
export function cloneVendorControllerResponse<
  TData
>(
  response:
    VendorControllerResponse<TData>
): VendorControllerResponse<TData> {
  return {
    ...response,

    headers:
      response.headers
        ? {
            ...response.headers,
          }
        : undefined,

    body: {
      ...response.body,

      error:
        response.body.error
          ? {
              ...response.body.error,
            }
          : undefined,

      meta:
        response.body.meta
          ? {
              ...response.body.meta,
            }
          : undefined,
    },
  };
}

/**
 * Final vendor controller module.
 *
 * This object is useful for dependency injection or
 * application composition.
 */
export interface VendorControllerModule {
  controller:
    CompleteVendorController;

  routes:
    readonly VendorControllerRouteDefinition[];

  execute:
    (
      routeName:
        VendorControllerRouteName,
      request:
        VendorControllerRequest
    ) => Promise<
      VendorControllerResponse
    >;
}

/**
 * Creates the final vendor controller module.
 */
export function createVendorControllerModule(
  dependencies:
    VendorControllerDependencies
): VendorControllerModule {
  const controller =
    createCompleteVendorController(
      dependencies
    );

  return {
    controller,

    routes:
      VENDOR_CONTROLLER_ROUTES,

    execute:
      (
        routeName,
        request
      ) =>
        executeVendorControllerRoute(
          controller,
          routeName,
          request
        ),
  };
}

/**
 * Creates the final controller module from the complete
 * vendor-service collection.
 */
export function createVendorControllerModuleFromServices(
  input:
    VendorControllerCollectionDependencies
): VendorControllerModule {
  return createVendorControllerModule(
    createVendorControllerDependencies(
      input
    )
  );
}

/**
 * ============================================================
 * End of Vendor Controller
 * ============================================================
 */