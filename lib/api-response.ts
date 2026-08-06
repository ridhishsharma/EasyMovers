import { NextResponse } from "next/server";

/**
 * Standard structure returned by every EasyMovers API endpoint.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errorCode?: string;
  errors?: unknown;
  meta?: ApiResponseMeta;
}

/**
 * Optional pagination and response metadata.
 */
export interface ApiResponseMeta {
  page?: number;
  pageSize?: number;
  totalItems?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  requestId?: string;
  timestamp?: string;
}

/**
 * Additional options for a successful response.
 */
interface SuccessResponseOptions {
  status?: number;
  meta?: ApiResponseMeta;
  headers?: HeadersInit;
}

/**
 * Additional options for an error response.
 */
interface ErrorResponseOptions {
  status?: number;
  errorCode?: string;
  errors?: unknown;
  meta?: ApiResponseMeta;
  headers?: HeadersInit;
}

/**
 * Creates a successful JSON API response.
 *
 * Default HTTP status: 200
 */
export function apiSuccess<T>(
  data: T,
  message = "Request completed successfully.",
  options: SuccessResponseOptions = {}
): NextResponse<ApiResponse<T>> {
  const {
    status = 200,
    meta,
    headers,
  } = options;

  return NextResponse.json(
    {
      success: true,
      message,
      data,
      ...(meta ? { meta: withTimestamp(meta) } : {}),
    },
    {
      status,
      headers,
    }
  );
}

/**
 * Creates a successful response without a data payload.
 */
export function apiSuccessMessage(
  message: string,
  options: SuccessResponseOptions = {}
): NextResponse<ApiResponse<never>> {
  const {
    status = 200,
    meta,
    headers,
  } = options;

  return NextResponse.json(
    {
      success: true,
      message,
      ...(meta ? { meta: withTimestamp(meta) } : {}),
    },
    {
      status,
      headers,
    }
  );
}

/**
 * Creates an error JSON API response.
 *
 * Default HTTP status: 400
 */
export function apiError(
  message: string,
  options: ErrorResponseOptions = {}
): NextResponse<ApiResponse<never>> {
  const {
    status = 400,
    errorCode,
    errors,
    meta,
    headers,
  } = options;

  return NextResponse.json(
    {
      success: false,
      message,
      ...(errorCode ? { errorCode } : {}),
      ...(errors !== undefined ? { errors } : {}),
      meta: withTimestamp(meta),
    },
    {
      status,
      headers,
    }
  );
}

/**
 * Returns a 201 Created response.
 */
export function apiCreated<T>(
  data: T,
  message = "Resource created successfully."
): NextResponse<ApiResponse<T>> {
  return apiSuccess(data, message, {
    status: 201,
  });
}

/**
 * Returns a 204 response.
 *
 * A 204 response must not contain a JSON body.
 */
export function apiNoContent(): NextResponse {
  return new NextResponse(null, {
    status: 204,
  });
}

/**
 * Returns a 400 Bad Request response.
 */
export function apiBadRequest(
  message = "Invalid request.",
  errorCode = "BAD_REQUEST",
  errors?: unknown
): NextResponse<ApiResponse<never>> {
  return apiError(message, {
    status: 400,
    errorCode,
    errors,
  });
}

/**
 * Returns a 401 Unauthorized response.
 */
export function apiUnauthorized(
  message = "Authentication is required.",
  errorCode = "UNAUTHORIZED"
): NextResponse<ApiResponse<never>> {
  return apiError(message, {
    status: 401,
    errorCode,
  });
}

/**
 * Returns a 403 Forbidden response.
 */
export function apiForbidden(
  message = "You do not have permission to perform this action.",
  errorCode = "FORBIDDEN"
): NextResponse<ApiResponse<never>> {
  return apiError(message, {
    status: 403,
    errorCode,
  });
}

/**
 * Returns a 404 Not Found response.
 */
export function apiNotFound(
  message = "Resource not found.",
  errorCode = "NOT_FOUND"
): NextResponse<ApiResponse<never>> {
  return apiError(message, {
    status: 404,
    errorCode,
  });
}

/**
 * Returns a 409 Conflict response.
 */
export function apiConflict(
  message = "The request conflicts with the current resource state.",
  errorCode = "CONFLICT"
): NextResponse<ApiResponse<never>> {
  return apiError(message, {
    status: 409,
    errorCode,
  });
}

/**
 * Returns a 422 Unprocessable Entity response.
 */
export function apiValidationError(
  message = "Validation failed.",
  errors?: unknown,
  errorCode = "VALIDATION_ERROR"
): NextResponse<ApiResponse<never>> {
  return apiError(message, {
    status: 422,
    errorCode,
    errors,
  });
}

/**
 * Returns a 429 Too Many Requests response.
 */
export function apiTooManyRequests(
  message = "Too many requests. Please try again later.",
  errorCode = "TOO_MANY_REQUESTS"
): NextResponse<ApiResponse<never>> {
  return apiError(message, {
    status: 429,
    errorCode,
  });
}

/**
 * Returns a 500 Internal Server Error response.
 */
export function apiInternalServerError(
  message = "An unexpected server error occurred.",
  errorCode = "INTERNAL_SERVER_ERROR"
): NextResponse<ApiResponse<never>> {
  return apiError(message, {
    status: 500,
    errorCode,
  });
}

/**
 * Adds a timestamp to response metadata.
 */
function withTimestamp(
  meta: ApiResponseMeta = {}
): ApiResponseMeta {
  return {
    ...meta,
    timestamp: meta.timestamp ?? new Date().toISOString(),
  };
}