import assert from "node:assert/strict";
import { test } from "node:test";
import { Prisma, PrismaClient } from "@prisma/client";

function requireIsolatedDatabase(): void {
  assert.equal(process.env.PAYMENT_INTEGRATION_TEST, "1");
  const raw = process.env.DATABASE_URL;
  assert.ok(raw && raw === process.env.TEST_DATABASE_URL);
  const url = new URL(raw);
  assert.ok(["postgres:", "postgresql:"].includes(url.protocol));
  assert.equal(url.hostname, "127.0.0.1");
  assert.equal(url.port, "5432");
  assert.equal(url.pathname, "/easymovers_payment_test");
  assert.equal(decodeURIComponent(url.username), "easymovers_test_user");
  assert.equal(url.searchParams.get("schema"), "public");
  assert.deepEqual([...url.searchParams.keys()], ["schema"]);
}

// The test must never construct PrismaClient before validating its destination.
requireIsolatedDatabase();

test("PostgreSQL Serializable isolation prevents a lost update", async () => {
  const prisma = new PrismaClient();
  // Unique test-only table name; never touch Booking, Payment or real customer data.
  const table = `em_concurrency_${process.pid}_${Date.now()}`;
  assert.match(table, /^em_concurrency_[0-9]+_[0-9]+$/);
  try {
    await prisma.$executeRawUnsafe(`CREATE TABLE "${table}" (id integer PRIMARY KEY, balance integer NOT NULL)`);
    await prisma.$executeRawUnsafe(`INSERT INTO "${table}" (id, balance) VALUES (1, 0)`);

    let arrivals = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    async function increment() {
      return prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRawUnsafe<Array<{ balance: number }>>(`SELECT balance FROM "${table}" WHERE id = 1`);
        arrivals += 1;
        if (arrivals === 2) release();
        await gate;
        await tx.$executeRawUnsafe(`UPDATE "${table}" SET balance = $1 WHERE id = 1`, rows[0].balance + 1);
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10000, timeout: 15000 });
    }

    const results = await Promise.allSettled([increment(), increment()]);
    const committed = results.filter((result) => result.status === "fulfilled").length;
    const rejected = results.filter((result) => result.status === "rejected");
    assert.equal(committed, 1, "Exactly one conflicting transaction should commit without retries");
    assert.equal(rejected.length, 1, "One concurrent transaction must be aborted");
    const rows = await prisma.$queryRawUnsafe<Array<{ balance: number }>>(`SELECT balance FROM "${table}" WHERE id = 1`);
    assert.equal(rows[0].balance, 1, "No lost update or double commit");
  } finally {
    try { await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table}"`); }
    finally { await prisma.$disconnect(); }
  }
});
