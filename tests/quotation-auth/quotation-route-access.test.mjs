import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

const root = new URL("../../", import.meta.url);
const policySource = stripTypeScriptTypes(await readFile(new URL("lib/quotation-access.ts", root), "utf8"));
const policy = await import("data:text/javascript;base64," + Buffer.from(policySource).toString("base64"));

async function routes(directory) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
    if (entry.isDirectory()) found.push(...await routes(path));
    else if (entry.name === "route.ts") found.push(path);
  }
  return found;
}

// Run the real route handler with mocked identity and domain dependencies.
// No Supabase calls or database writes are made.
async function harness(path, identity) {
  const calls = [];
  const source = stripTypeScriptTypes(await readFile(path, "utf8"))
    .replace(/import[\s\S]*?from\s*["'][^"']+["'];?/g, "");
  const controller = new Proxy({}, {
    get: (_, operation) => async request => {
      calls.push({ operation, request });
      return { status: 200, body: { success: true } };
    },
  });
  const factory = new Function("NextResponse", "randomUUID", "prisma",
    "getOrCreateQuotationModule", "resolveApplicationAuthentication",
    "authorizeInternalQuotation",
    source.replace(/export /g, "") +
    ";return { " + [...source.matchAll(/export async function (\w+)/g)].map(m => m[1]).join(",") + " };");
  const handlers = factory(
    { json: (body, options) => Response.json(body, options) },
    () => "test-request", {},
    () => ({ controller }),
    async () => { if (identity instanceof Error) throw identity; return identity; },
    policy.authorizeInternalQuotation
  );
  return { handlers, calls };
}

const paths = await routes(new URL("app/api/quotations/", root));
const context = { params: Promise.resolve({ quotationId: "quotation-1" }) };
function request(method) {
  return new Request("https://example.invalid/api/quotations", {
    method,
    headers: { "Content-Type": "application/json", "x-user-id": "forged",
      "x-user-roles": "SUPER_ADMIN", "x-request-id": "test-request" },
    ...(method === "GET" ? {} : { body: "{}" }),
  });
}

test("All 11 internal quotation handlers deny unverified identity before domain calls", async () => {
  let count = 0;
  for (const path of paths) {
    const { handlers, calls } = await harness(path, { authenticated: false });
    for (const [method, handler] of Object.entries(handlers)) {
      const response = await handler(request(method), context);
      assert.equal(response.status, 401, path.pathname);
      assert.equal((await response.json()).error.code, "UNAUTHENTICATED");
      assert.equal(response.headers.get("x-request-id"), "test-request");
      count++;
    }
    assert.equal(calls.length, 0);
  }
  assert.equal(count, 11);
});

test("Every non-admin database role is denied despite forged admin headers", async () => {
  for (const role of ["CUSTOMER", "VENDOR", "CORPORATE", "FRANCHISE"]) {
    for (const path of paths) {
      const { handlers, calls } = await harness(path, { authenticated: true, userId: "user-1", roles: [role] });
      for (const [method, handler] of Object.entries(handlers)) {
        assert.equal((await handler(request(method), context)).status, 403);
      }
      assert.equal(calls.length, 0);
    }
  }
});

test("Verified admins reach the existing controller with trusted identity metadata", async () => {
  for (const role of ["ADMIN", "SUPER_ADMIN"]) {
    for (const path of paths) {
      const { handlers, calls } = await harness(path, { authenticated: true, userId: "verified-user", roles: [role] });
      for (const [method, handler] of Object.entries(handlers)) {
        assert.equal((await handler(request(method), context)).status, 200);
        const call = calls.at(-1);
        assert.ok(call);
        if (call.request?.authenticatedUserId !== undefined) {
          assert.equal(call.request.authenticatedUserId, "verified-user");
        }
      }
    }
  }
});

test("Resolver exceptions and incomplete identities fail closed", async () => {
  for (const identity of [new Error("verification failed"),
    { authenticated: true, roles: ["ADMIN"] },
    { authenticated: true, userId: "user-1" }]) {
    for (const path of paths) {
      const { handlers, calls } = await harness(path, identity);
      for (const [method, handler] of Object.entries(handlers)) {
        const response = await handler(request(method), context);
        assert.ok(response.status === 401 || response.status === 403);
      }
      assert.equal(calls.length, 0);
    }
  }
});
