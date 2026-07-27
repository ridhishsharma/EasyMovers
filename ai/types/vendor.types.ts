/**
 * ============================================================
 * EasyMovers AI
 * Shared Vendor Types
 * ============================================================
 */

import type { Vendor } from "@prisma/client";

/**
 * Base Vendor type used throughout the AI layer.
 * This stays synchronized automatically with the Prisma schema.
 */
export type VendorSource = Vendor;