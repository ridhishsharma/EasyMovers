import assert from "node:assert/strict";
import test from "node:test";

import {
  createApplicationAuthenticationResolver,
  type ApplicationAuthDependencies,
  type ApplicationAuthUser,
} from "../../lib/auth";

function makeUser(
  changes: Partial<ApplicationAuthUser> = {}
): ApplicationAuthUser {
  return {
    id: "application-user-1",
    role: "CUSTOMER",
    isActive: true,
    vendorId: null,
    vendor: null,
    ...changes,
  };
}

function makeDependencies(
  changes: Partial<ApplicationAuthDependencies> = {}
): ApplicationAuthDependencies {
  return {
    async verifyAccessToken() {
      return {
        id: "verified-auth-id",
        emailConfirmed: true,
      };
    },
    async findApplicationUser() {
      return makeUser();
    },
    ...changes,
  };
}

function makeRequest(
  headers: Record<string, string> = {}
): Request {
  return new Request("https://example.invalid/api/vendors", {
    headers: {
      Authorization: "Bearer synthetic-test-token",
      ...headers,
    },
  });
}

test("Forged identity headers alone cannot authenticate", async () => {
  let calls = 0;

  const resolve = createApplicationAuthenticationResolver(
    makeDependencies({
      async verifyAccessToken() {
        calls += 1;
        throw new Error("Must not be called");
      },
      async findApplicationUser() {
        calls += 1;
        throw new Error("Must not be called");
      },
    })
  );

  const result = await resolve(
    new Request("https://example.invalid/api/vendors", {
      headers: {
        "x-authenticated": "true",
        "x-user-id": "forged-user",
        "x-user-roles": "ADMIN",
        "x-vendor-id": "forged-vendor",
      },
    })
  );

  assert.deepEqual(result, { authenticated: false });
  assert.equal(calls, 0);
});

test("Malformed authorization is rejected before verification", async () => {
  let calls = 0;

  const resolve = createApplicationAuthenticationResolver(
    makeDependencies({
      async verifyAccessToken() {
        calls += 1;
        return null;
      },
    })
  );

  for (const authorization of [
    "Basic synthetic",
    "Bearer",
    "Bearer token extra",
  ]) {
    assert.deepEqual(
      await resolve(makeRequest({ Authorization: authorization })),
      { authenticated: false }
    );
  }

  assert.equal(calls, 0);
});

test("Rejected token cannot trigger an application-user lookup", async () => {
  let lookups = 0;

  const resolve = createApplicationAuthenticationResolver(
    makeDependencies({
      async verifyAccessToken() {
        return null;
      },
      async findApplicationUser() {
        lookups += 1;
        return makeUser();
      },
    })
  );

  assert.deepEqual(await resolve(makeRequest()), {
    authenticated: false,
  });
  assert.equal(lookups, 0);
});

test("Unconfirmed email cannot authenticate", async () => {
  let lookups = 0;

  const resolve = createApplicationAuthenticationResolver(
    makeDependencies({
      async verifyAccessToken() {
        return {
          id: "verified-auth-id",
          emailConfirmed: false,
        };
      },
      async findApplicationUser() {
        lookups += 1;
        return makeUser();
      },
    })
  );

  assert.deepEqual(await resolve(makeRequest()), {
    authenticated: false,
  });
  assert.equal(lookups, 0);
});

test("Unlinked Auth identity cannot authenticate", async () => {
  const resolve = createApplicationAuthenticationResolver(
    makeDependencies({
      async findApplicationUser() {
        return null;
      },
    })
  );

  assert.deepEqual(await resolve(makeRequest()), {
    authenticated: false,
  });
});

test("Inactive application user cannot authenticate", async () => {
  const resolve = createApplicationAuthenticationResolver(
    makeDependencies({
      async findApplicationUser() {
        return makeUser({ isActive: false });
      },
    })
  );

  assert.deepEqual(await resolve(makeRequest()), {
    authenticated: false,
  });
});

test("Permissions come from the database, not forged headers", async () => {
  const resolve = createApplicationAuthenticationResolver(
    makeDependencies({
      async verifyAccessToken(token) {
        assert.equal(token, "synthetic-test-token");
        return {
          id: "verified-auth-id",
          emailConfirmed: true,
        };
      },
      async findApplicationUser(authId) {
        assert.equal(authId, "verified-auth-id");
        return makeUser();
      },
    })
  );

  const result = await resolve(
    makeRequest({
      "x-authenticated": "true",
      "x-user-id": "forged-user",
      "x-user-roles": "ADMIN",
      "x-vendor-id": "forged-vendor",
    })
  );

  assert.deepEqual(result, {
    authenticated: true,
    userId: "application-user-1",
    roles: ["CUSTOMER"],
  });
});

test("Linked administrator receives only the database role", async () => {
  const resolve = createApplicationAuthenticationResolver(
    makeDependencies({
      async findApplicationUser() {
        return makeUser({ role: "ADMIN" });
      },
    })
  );

  assert.deepEqual(await resolve(makeRequest()), {
    authenticated: true,
    userId: "application-user-1",
    roles: ["ADMIN"],
  });
});

test("Vendor ownership comes from the database", async () => {
  const resolve = createApplicationAuthenticationResolver(
    makeDependencies({
      async findApplicationUser() {
        return makeUser({
          role: "VENDOR",
          vendorId: "database-vendor",
          vendor: { deletedAt: null },
        });
      },
    })
  );

  assert.deepEqual(
    await resolve(makeRequest({ "x-vendor-id": "forged-vendor" })),
    {
      authenticated: true,
      userId: "application-user-1",
      roles: ["VENDOR"],
      vendorId: "database-vendor",
    }
  );
});

test("Vendor without a valid linkage cannot authenticate", async () => {
  const invalidUsers: ApplicationAuthUser[] = [
    makeUser({ role: "VENDOR" }),
    makeUser({
      role: "VENDOR",
      vendorId: "vendor-1",
      vendor: null,
    }),
    makeUser({
      role: "VENDOR",
      vendorId: null,
      vendor: { deletedAt: null },
    }),
  ];

  for (const user of invalidUsers) {
    const resolve = createApplicationAuthenticationResolver(
      makeDependencies({
        async findApplicationUser() {
          return user;
        },
      })
    );

    assert.deepEqual(await resolve(makeRequest()), {
      authenticated: false,
    });
  }
});

test("Soft-deleted vendor cannot authenticate", async () => {
  const resolve = createApplicationAuthenticationResolver(
    makeDependencies({
      async findApplicationUser() {
        return makeUser({
          role: "VENDOR",
          vendorId: "vendor-1",
          vendor: {
            deletedAt: new Date("2026-09-13T00:00:00.000Z"),
          },
        });
      },
    })
  );

  assert.deepEqual(await resolve(makeRequest()), {
    authenticated: false,
  });
});

test("Verification and database failures fail closed", async () => {
  const failingDependencies = [
    makeDependencies({
      async verifyAccessToken() {
        throw new Error("Synthetic verification failure");
      },
    }),
    makeDependencies({
      async findApplicationUser() {
        throw new Error("Synthetic database failure");
      },
    }),
  ];

  for (const dependencies of failingDependencies) {
    const resolve =
      createApplicationAuthenticationResolver(dependencies);

    assert.deepEqual(await resolve(makeRequest()), {
      authenticated: false,
    });
  }
});