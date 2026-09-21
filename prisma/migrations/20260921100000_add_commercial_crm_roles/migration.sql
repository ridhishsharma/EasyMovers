-- Add least-privilege Sales, Marketing and Advertising CRM roles.
-- This migration adds authorization contracts only; operational screens can
-- adopt these permissions as their modules are introduced.
INSERT INTO "public"."CrmRole" ("id", "code", "name", "description", "isSystem") VALUES
('crm-role-sales-manager', 'SALES_MANAGER', 'Sales Manager', 'Lead allocation, sales pipeline oversight and sales reporting.', true),
('crm-role-sales-executive', 'SALES_EXECUTIVE', 'Sales Executive', 'Daily lead follow-up and sales pipeline updates.', true),
('crm-role-marketing-manager', 'MARKETING_MANAGER', 'Marketing Manager', 'Campaign planning, approval and marketing performance oversight.', true),
('crm-role-marketing-executive', 'MARKETING_EXECUTIVE', 'Marketing Executive', 'Campaign execution and marketing reporting.', true),
('crm-role-advertising-executive', 'ADVERTISING_EXECUTIVE', 'Advertising Executive', 'Advertising creative, channel and spend execution.', true)
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "isSystem" = true,
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "public"."CrmPermission" ("id", "code", "module", "name", "description") VALUES
('crm-permission-lead-read', 'lead.read', 'sales', 'View sales leads', 'View lead identity, source, owner and pipeline state.'),
('crm-permission-lead-manage', 'lead.manage', 'sales', 'Manage sales leads', 'Update lead follow-up and pipeline details.'),
('crm-permission-lead-assign', 'lead.assign', 'sales', 'Assign sales leads', 'Allocate and reallocate leads among sales users.'),
('crm-permission-sales-report-read', 'sales_report.read', 'sales', 'View sales reports', 'View sales team and conversion performance.'),
('crm-permission-campaign-read', 'campaign.read', 'marketing', 'View campaigns', 'View campaign plans and results.'),
('crm-permission-campaign-manage', 'campaign.manage', 'marketing', 'Manage campaigns', 'Create and update campaign plans and content.'),
('crm-permission-campaign-approve', 'campaign.approve', 'marketing', 'Approve campaigns', 'Approve campaign release and budget.'),
('crm-permission-advertising-read', 'advertising.read', 'advertising', 'View advertising', 'View advertising creative, channels and spend.'),
('crm-permission-advertising-manage', 'advertising.manage', 'advertising', 'Manage advertising', 'Manage advertising creative, channels and spend within approved plans.'),
('crm-permission-marketing-report-read', 'marketing_report.read', 'marketing', 'View marketing reports', 'View campaign, source and advertising performance.')
ON CONFLICT ("code") DO UPDATE SET
  "module" = EXCLUDED."module",
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP;

-- Platform administrators retain oversight of every newly introduced module.
INSERT INTO "public"."CrmRolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "public"."CrmRole" role
CROSS JOIN "public"."CrmPermission" permission
WHERE role."code" IN ('SUPER_ADMIN', 'CRM_ADMINISTRATOR')
  AND permission."code" IN (
    'lead.read', 'lead.manage', 'lead.assign', 'sales_report.read',
    'campaign.read', 'campaign.manage', 'campaign.approve',
    'advertising.read', 'advertising.manage', 'marketing_report.read'
  )
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Sales managers allocate work and see team reporting. They receive no
-- payment, refund, vendor-approval or campaign-approval permissions.
INSERT INTO "public"."CrmRolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "public"."CrmRole" role
CROSS JOIN "public"."CrmPermission" permission
WHERE role."code" = 'SALES_MANAGER'
  AND permission."code" IN (
    'dashboard.read', 'lead.read', 'lead.manage', 'lead.assign',
    'sales_report.read', 'booking.read', 'report.read'
  )
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

INSERT INTO "public"."CrmRolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "public"."CrmRole" role
CROSS JOIN "public"."CrmPermission" permission
WHERE role."code" = 'SALES_EXECUTIVE'
  AND permission."code" IN ('dashboard.read', 'lead.read', 'lead.manage', 'booking.read')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Marketing managers approve campaigns and budgets. Marketing executives can
-- prepare campaigns but cannot approve their own work.
INSERT INTO "public"."CrmRolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "public"."CrmRole" role
CROSS JOIN "public"."CrmPermission" permission
WHERE role."code" = 'MARKETING_MANAGER'
  AND permission."code" IN (
    'dashboard.read', 'lead.read', 'campaign.read', 'campaign.manage',
    'campaign.approve', 'advertising.read', 'advertising.manage',
    'marketing_report.read', 'report.read'
  )
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

INSERT INTO "public"."CrmRolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "public"."CrmRole" role
CROSS JOIN "public"."CrmPermission" permission
WHERE role."code" = 'MARKETING_EXECUTIVE'
  AND permission."code" IN (
    'dashboard.read', 'campaign.read', 'campaign.manage',
    'advertising.read', 'marketing_report.read'
  )
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Advertising executives execute approved activity but cannot approve budgets.
INSERT INTO "public"."CrmRolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "public"."CrmRole" role
CROSS JOIN "public"."CrmPermission" permission
WHERE role."code" = 'ADVERTISING_EXECUTIVE'
  AND permission."code" IN (
    'dashboard.read', 'campaign.read', 'advertising.read',
    'advertising.manage', 'marketing_report.read'
  )
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
