import { createClient } from "@supabase/supabase-js";
import type { UserRole } from "@prisma/client";
import { prisma } from "./prisma";

export interface ApplicationAuthentication {
  authenticated: boolean;
  userId?: string;
  roles?: string[];
  vendorId?: string;
}

export interface VerifiedAuthIdentity {
  id: string;
  emailConfirmed: boolean;
}

export interface ApplicationAuthUser {
  id: string;
  role: UserRole;
  isActive: boolean;
  vendorId: string | null;
  vendor: {
    deletedAt: Date | null;
  } | null;
}

export interface ApplicationAuthDependencies {
  verifyAccessToken(
    token: string
  ): Promise<VerifiedAuthIdentity | null>;

  findApplicationUser(
    authId: string
  ): Promise<ApplicationAuthUser | null>;
}

/**
 * Dependencies are supplied by server code, never by the request.
 */
export function createApplicationAuthenticationResolver(
  dependencies: ApplicationAuthDependencies
): (
  request: Request
) => Promise<ApplicationAuthentication> {
  return async (
    request: Request
  ): Promise<ApplicationAuthentication> => {
    const authorization =
      request.headers.get("authorization")?.trim();

    const match =
      authorization?.match(/^Bearer\s+(\S+)$/i);

    if (!match) {
      return { authenticated: false };
    }

    try {
      const identity =
        await dependencies.verifyAccessToken(match[1]);

      if (!identity?.id || !identity.emailConfirmed) {
        return { authenticated: false };
      }

      const user =
        await dependencies.findApplicationUser(identity.id);

      if (!user?.isActive) {
        return { authenticated: false };
      }

      if (
        user.role === "VENDOR" &&
        (
          !user.vendorId ||
          !user.vendor ||
          user.vendor.deletedAt !== null
        )
      ) {
        return { authenticated: false };
      }

      return {
        authenticated: true,
        userId: user.id,
        roles: [user.role],
        ...(user.role === "VENDOR" && user.vendorId
          ? { vendorId: user.vendorId }
          : {}),
      };
    } catch {
      return { authenticated: false };
    }
  };
}

/**
 * Production dependencies:
 * verify with Supabase, then load permissions from PostgreSQL.
 */
export const resolveApplicationAuthentication =
  createApplicationAuthenticationResolver({
    async verifyAccessToken(
      token: string
    ): Promise<VerifiedAuthIdentity | null> {
      const url =
        process.env.SUPABASE_URL?.trim();

      const key =
        process.env.SUPABASE_PUBLISHABLE_KEY?.trim();

      if (!url || !key) {
        return null;
      }

      const supabase = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        return null;
      }

      return {
        id: user.id,
        emailConfirmed: Boolean(user.email_confirmed_at),
      };
    },

    async findApplicationUser(
      authId: string
    ): Promise<ApplicationAuthUser | null> {
      return prisma.user.findUnique({
        where: {
          supabaseAuthId: authId,
        },
        select: {
          id: true,
          role: true,
          isActive: true,
          vendorId: true,
          vendor: {
            select: {
              deletedAt: true,
            },
          },
        },
      });
    },
  });