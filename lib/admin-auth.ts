import { resolveApplicationAuthentication } from "@/lib/auth";

export const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export interface AuthorizedAdministrator {
  authorized: true;
  userId: string;
  roles: string[];
}

export interface RejectedAdministrator {
  authorized: false;
  status: 401 | 403;
  code: "UNAUTHENTICATED" | "ADMIN_ACCESS_REQUIRED";
  message: string;
}

export type AdministratorAuthorization =
  | AuthorizedAdministrator
  | RejectedAdministrator;

export function isAdministratorRole(role: string): role is AdminRole {
  return ADMIN_ROLES.some(adminRole => adminRole === role);
}

export async function authorizeAdministrator(
  request: Request
): Promise<AdministratorAuthorization> {
  const authentication = await resolveApplicationAuthentication(request);

  if (!authentication.authenticated || !authentication.userId) {
    return {
      authorized: false,
      status: 401,
      code: "UNAUTHENTICATED",
      message: "Sign in with your linked EasyMovers administrator account.",
    };
  }

  const roles = authentication.roles ?? [];

  if (!roles.some(isAdministratorRole)) {
    return {
      authorized: false,
      status: 403,
      code: "ADMIN_ACCESS_REQUIRED",
      message: "Administrator access is required.",
    };
  }

  return {
    authorized: true,
    userId: authentication.userId,
    roles,
  };
}
