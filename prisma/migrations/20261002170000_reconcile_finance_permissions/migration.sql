-- Reconcile finance permissions for databases whose role seeds predate these workbenches.
INSERT INTO "public"."CrmRolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "public"."CrmRole" role
CROSS JOIN "public"."CrmPermission" permission
WHERE (
  role."code" IN ('SUPER_ADMIN', 'CRM_ADMINISTRATOR', 'FINANCE_MANAGER')
  AND permission."code" IN ('payment.read', 'payment.manage', 'settlement.approve', 'commission.approve')
) OR (
  role."code" = 'FINANCE_EXECUTIVE'
  AND permission."code" IN ('payment.read', 'payment.manage')
)
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
