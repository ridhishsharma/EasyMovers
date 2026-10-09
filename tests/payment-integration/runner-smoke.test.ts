import assert from "node:assert/strict";
import { test } from "node:test";

test("payment integration runner uses only the approved local test database", () => {
  assert.equal(process.env.PAYMENT_INTEGRATION_TEST, "1");
  assert.equal(process.env.DATABASE_URL, process.env.TEST_DATABASE_URL);

  const raw = process.env.DATABASE_URL;
  assert.ok(raw, "DATABASE_URL must be present");
  const url = new URL(raw);
  assert.ok(["postgresql:", "postgres:"].includes(url.protocol));
  assert.equal(url.hostname, "127.0.0.1");
  assert.equal(url.port, "5432");
  assert.equal(url.pathname, "/easymovers_payment_test");
  assert.equal(decodeURIComponent(url.username), "easymovers_test_user");
  assert.equal(url.searchParams.get("schema"), "public");
});

test("payment integration runner cannot silently select production tests", () => {
  assert.equal(process.env.PAYMENT_INTEGRATION_TEST, "1");
});
