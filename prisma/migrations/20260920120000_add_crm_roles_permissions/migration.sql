-- Add granular office CRM roles and permissions without changing the existing
-- customer/vendor UserRole contract.
CREATE TABLE "public"."CrmRole" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CrmRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."CrmPermission" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CrmPermission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."CrmRolePermission" (
  "roleId" TEXT NOT NULL,
  "permissionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CrmRolePermission_pkey" PRIMARY KEY ("roleId", "permissionId")
);

CREATE TABLE "public"."UserCrmRole" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "assignedByUserId" TEXT,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "revokedByUserId" TEXT,
  CONSTRAINT "UserCrmRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."CrmAuditLog" (
  "id" TEXT NOT NULL,
  "actorUserId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CrmAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CrmRole_code_key" ON "public"."CrmRole"("code");
CREATE INDEX "CrmRole_isActive_idx" ON "public"."CrmRole"("isActive");
CREATE UNIQUE INDEX "CrmPermission_code_key" ON "public"."CrmPermission"("code");
CREATE INDEX "CrmPermission_module_idx" ON "public"."CrmPermission"("module");
CREATE INDEX "CrmPermission_isActive_idx" ON "public"."CrmPermission"("isActive");
CREATE INDEX "CrmRolePermission_permissionId_idx" ON "public"."CrmRolePermission"("permissionId");
CREATE UNIQUE INDEX "UserCrmRole_userId_roleId_key" ON "public"."UserCrmRole"("userId", "roleId");
CREATE INDEX "UserCrmRole_roleId_idx" ON "public"."UserCrmRole"("roleId");
CREATE INDEX "UserCrmRole_userId_revokedAt_idx" ON "public"."UserCrmRole"("userId", "revokedAt");
CREATE INDEX "UserCrmRole_expiresAt_idx" ON "public"."UserCrmRole"("expiresAt");
CREATE INDEX "CrmAuditLog_actorUserId_idx" ON "public"."CrmAuditLog"("actorUserId");
CREATE INDEX "CrmAuditLog_entityType_entityId_idx" ON "public"."CrmAuditLog"("entityType", "entityId");
CREATE INDEX "CrmAuditLog_createdAt_idx" ON "public"."CrmAuditLog"("createdAt");

ALTER TABLE "public"."CrmRolePermission" ADD CONSTRAINT "CrmRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."CrmRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."CrmRolePermission" ADD CONSTRAINT "CrmRolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."CrmPermission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."UserCrmRole" ADD CONSTRAINT "UserCrmRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."UserCrmRole" ADD CONSTRAINT "UserCrmRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."CrmRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."CrmAuditLog" ADD CONSTRAINT "CrmAuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "public"."CrmRole" ("id", "code", "name", "description", "isSystem") VALUES
('crm-role-super-admin', 'SUPER_ADMIN', 'Super Administrator', 'Full CRM access including security configuration.', true),
('crm-role-administrator', 'CRM_ADMINISTRATOR', 'CRM Administrator', 'Office user and operational administration.', true),
('crm-role-vendor-manager', 'VENDOR_MANAGER', 'Vendor Manager', 'Vendor approval, activation and network operations.', true),
('crm-role-vendor-reviewer', 'VENDOR_REVIEWER', 'Vendor Reviewer', 'Vendor application and document review.', true),
('crm-role-operations-manager', 'OPERATIONS_MANAGER', 'Operations Manager', 'Booking and service-location management.', true),
('crm-role-operations-executive', 'OPERATIONS_EXECUTIVE', 'Operations Executive', 'Daily booking operations.', true),
('crm-role-finance-manager', 'FINANCE_MANAGER', 'Finance Manager', 'Payments, billing and approval controls.', true),
('crm-role-finance-executive', 'FINANCE_EXECUTIVE', 'Finance Executive', 'Payment and billing processing.', true),
('crm-role-customer-support', 'CUSTOMER_SUPPORT', 'Customer Support', 'Customer and booking support.', true),
('crm-role-auditor', 'AUDITOR', 'Management / Auditor', 'Read-only reporting and audit access.', true);

INSERT INTO "public"."CrmPermission" ("id", "code", "module", "name") VALUES
('crm-permission-dashboard-read', 'dashboard.read', 'dashboard', 'View CRM dashboard'),
('crm-permission-crm-user-read', 'crm_user.read', 'user_management', 'View office users'),
('crm-permission-crm-user-manage', 'crm_user.manage', 'user_management', 'Manage office users and roles'),
('crm-permission-vendor-application-read', 'vendor_application.read', 'vendor_applications', 'View Vendor applications'),
('crm-permission-vendor-application-review', 'vendor_application.review', 'vendor_applications', 'Review Vendor applications'),
('crm-permission-vendor-application-approve', 'vendor_application.approve', 'vendor_applications', 'Approve Vendor applications'),
('crm-permission-vendor-read', 'vendor.read', 'vendors', 'View vendors'),
('crm-permission-vendor-manage', 'vendor.manage', 'vendors', 'Manage vendors'),
('crm-permission-vendor-activate', 'vendor.activate', 'vendors', 'Activate or suspend vendors'),
('crm-permission-service-location-read', 'service_location.read', 'service_locations', 'View service locations'),
('crm-permission-service-location-manage', 'service_location.manage', 'service_locations', 'Configure service locations'),
('crm-permission-service-location-activate', 'service_location.activate', 'service_locations', 'Activate or suspend service locations'),
('crm-permission-booking-read', 'booking.read', 'bookings', 'View bookings'),
('crm-permission-booking-manage', 'booking.manage', 'bookings', 'Manage bookings'),
('crm-permission-booking-assign', 'booking.assign', 'bookings', 'Assign vendors to bookings'),
('crm-permission-payment-read', 'payment.read', 'finance', 'View payments'),
('crm-permission-payment-manage', 'payment.manage', 'finance', 'Process payments and reconciliation'),
('crm-permission-refund-approve', 'refund.approve', 'finance', 'Approve refunds'),
('crm-permission-billing-read', 'billing.read', 'billing', 'View bills and settlements'),
('crm-permission-billing-manage', 'billing.manage', 'billing', 'Process bills and settlements'),
('crm-permission-report-read', 'report.read', 'reports', 'View management reports'),
('crm-permission-audit-read', 'audit.read', 'audit', 'View CRM audit history'),
('crm-permission-system-manage', 'system.manage', 'system', 'Manage protected system configuration');

-- Super Administrators receive every permission.
INSERT INTO "public"."CrmRolePermission" ("roleId", "permissionId")
SELECT 'crm-role-super-admin', "id" FROM "public"."CrmPermission";

-- Existing ADMIN users retain broad operational access, while system security remains Super Admin-only.
INSERT INTO "public"."CrmRolePermission" ("roleId", "permissionId")
SELECT 'crm-role-administrator', "id" FROM "public"."CrmPermission"
WHERE "code" <> 'system.manage';

INSERT INTO "public"."CrmRolePermission" ("roleId", "permissionId")
SELECT 'crm-role-vendor-manager', "id" FROM "public"."CrmPermission"
WHERE "code" IN ('dashboard.read','vendor_application.read','vendor_application.review','vendor_application.approve','vendor.read','vendor.manage','vendor.activate','service_location.read');

INSERT INTO "public"."CrmRolePermission" ("roleId", "permissionId")
SELECT 'crm-role-vendor-reviewer', "id" FROM "public"."CrmPermission"
WHERE "code" IN ('dashboard.read','vendor_application.read','vendor_application.review','vendor.read');

INSERT INTO "public"."CrmRolePermission" ("roleId", "permissionId")
SELECT 'crm-role-operations-manager', "id" FROM "public"."CrmPermission"
WHERE "code" IN ('dashboard.read','booking.read','booking.manage','booking.assign','vendor.read','service_location.read','service_location.manage','service_location.activate');

INSERT INTO "public"."CrmRolePermission" ("roleId", "permissionId")
SELECT 'crm-role-operations-executive', "id" FROM "public"."CrmPermission"
WHERE "code" IN ('dashboard.read','booking.read','booking.manage','vendor.read','service_location.read');

INSERT INTO "public"."CrmRolePermission" ("roleId", "permissionId")
SELECT 'crm-role-finance-manager', "id" FROM "public"."CrmPermission"
WHERE "code" IN ('dashboard.read','payment.read','payment.manage','refund.approve','billing.read','billing.manage','report.read');

INSERT INTO "public"."CrmRolePermission" ("roleId", "permissionId")
SELECT 'crm-role-finance-executive', "id" FROM "public"."CrmPermission"
WHERE "code" IN ('dashboard.read','payment.read','payment.manage','billing.read','billing.manage');

INSERT INTO "public"."CrmRolePermission" ("roleId", "permissionId")
SELECT 'crm-role-customer-support', "id" FROM "public"."CrmPermission"
WHERE "code" IN ('dashboard.read','booking.read','vendor.read');

INSERT INTO "public"."CrmRolePermission" ("roleId", "permissionId")
SELECT 'crm-role-auditor', "id" FROM "public"."CrmPermission"
WHERE "code" IN ('dashboard.read','crm_user.read','vendor_application.read','vendor.read','service_location.read','booking.read','payment.read','billing.read','report.read','audit.read');

-- Preserve current office access during migration.
INSERT INTO "public"."UserCrmRole" ("id", "userId", "roleId")
SELECT 'ucr-' || md5("id" || ':SUPER_ADMIN'), "id", 'crm-role-super-admin'
FROM "public"."User" WHERE "role" = 'SUPER_ADMIN';

INSERT INTO "public"."UserCrmRole" ("id", "userId", "roleId")
SELECT 'ucr-' || md5("id" || ':CRM_ADMINISTRATOR'), "id", 'crm-role-administrator'
FROM "public"."User" WHERE "role" = 'ADMIN';
