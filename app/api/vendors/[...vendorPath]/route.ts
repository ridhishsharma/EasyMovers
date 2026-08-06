/**
 * ============================================================
 * EasyMovers
 * Vendor API Catch-All Route
 * ============================================================
 *
 * File
 * ----
 * app/api/vendors/[...vendorPath]/route.ts
 *
 * Responsibilities
 * ----------------
 * - Expose Next.js App Router handlers
 * - Delegate all work to the Vendor application module
 *
 * This file must remain thin.
 * ============================================================
 */

import type {
  VendorCatchAllRouteContext,
} from "../../../../domains/vendor/routes/vendor.routes";

import {
  executeVendorModuleDelete,
  executeVendorModuleGet,
  executeVendorModulePatch,
  executeVendorModulePost,
  executeVendorModulePut,
} from "../../../../domains/vendor/vendor.module";

/**
 * Handles vendor GET requests.
 */
export async function GET(
  request: Request,
  context:
    VendorCatchAllRouteContext
): Promise<Response> {
  return executeVendorModuleGet(
    request,
    context
  );
}

/**
 * Handles vendor POST requests.
 */
export async function POST(
  request: Request,
  context:
    VendorCatchAllRouteContext
): Promise<Response> {
  return executeVendorModulePost(
    request,
    context
  );
}

/**
 * Handles vendor PUT requests.
 */
export async function PUT(
  request: Request,
  context:
    VendorCatchAllRouteContext
): Promise<Response> {
  return executeVendorModulePut(
    request,
    context
  );
}

/**
 * Handles vendor PATCH requests.
 */
export async function PATCH(
  request: Request,
  context:
    VendorCatchAllRouteContext
): Promise<Response> {
  return executeVendorModulePatch(
    request,
    context
  );
}

/**
 * Handles vendor DELETE requests.
 */
export async function DELETE(
  request: Request,
  context:
    VendorCatchAllRouteContext
): Promise<Response> {
  return executeVendorModuleDelete(
    request,
    context
  );
}

/**
 * Vendor API requests depend on authentication and mutable
 * database state.
 */
export const dynamic =
  "force-dynamic";

/**
 * Prevents route caching.
 */
export const revalidate =
  0;

/**
 * Prisma requires the Node.js runtime.
 */
export const runtime =
  "nodejs";