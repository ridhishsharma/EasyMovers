import assert from "node:assert/strict";
import { PrismaClient, PaymentProvider } from "@prisma/client";

// B4.4A read-only financial reconciliation audit.
// Isolated test DB ONLY. No writes, no external gateway calls, no secrets in output.
assert.equal(process.env.PAYMENT_INTEGRATION_TEST, "1", "Use payment integration runner");
assert.ok(process.env.DATABASE_URL);
assert.equal(process.env.DATABASE_URL, process.env.TEST_DATABASE_URL);
const url = new URL(process.env.DATABASE_URL);
assert.ok(["postgres:", "postgresql:"].includes(url.protocol));
assert.equal(url.hostname, "127.0.0.1");
assert.equal(url.port, "5432");
assert.equal(url.pathname, "/easymovers_payment_test");
assert.equal(decodeURIComponent(url.username), "easymovers_test_user");
assert.ok(url.password);
assert.deepEqual([...url.searchParams.entries()], [["schema", "public"]]);
assert.equal(url.hash, "");

const prisma = new PrismaClient();
type Finding = { check: string; count: number; examples: string[] };
const findings: Finding[] = [];
function report(check: string, ids: string[]) {
  findings.push({ check, count: ids.length, examples: ids.slice(0, 5) });
}
try {
  const payments = await prisma.payment.findMany({
    select: { id: true, bookingId: true, totalAmount: true, paidAmount: true,
      balanceAmount: true, currency: true },
  });
  const transactions = await prisma.paymentTransaction.findMany({
    where: { status: "SUCCESS" },
    select: { id: true, paymentId: true, amount: true, transactionType: true,
      gatewayOrderId: true, gatewayPaymentId: true, provider: true },
  });
  const orders = await prisma.paymentGatewayOrder.findMany({
    where: { provider: PaymentProvider.RAZORPAY },
    select: { paymentId: true, gatewayOrderId: true, amount: true, status: true },
  });
  const receipts = await prisma.paymentWebhook.findMany({
    where: { provider: PaymentProvider.RAZORPAY, eventType: "payment.captured" },
    select: { id: true, paymentId: true, gatewayPaymentId: true,
      gatewayOrderId: true, processed: true, providerEventId: true },
  });
  const syncs = await prisma.paymentBookingSync.findMany({
    select: { paymentId: true, bookingId: true, status: true },
  });
  const paymentById = new Map(payments.map(p => [p.id, p]));
  const transactionByGatewayId = new Map(transactions.filter(t => t.gatewayPaymentId)
    .map(t => [t.gatewayPaymentId, t]));
  const orderByGatewayId = new Map(orders.map(o => [o.gatewayOrderId, o]));
  const syncByPaymentId = new Map(syncs.map(s => [s.paymentId, s]));
  const cents = (value: {mul: (v: number) => {toFixed: (digits: number) => string}}) =>
    Number(value.mul(100).toFixed(0));
  report("invalid payment balances", payments.filter(p =>
    cents(p.paidAmount) < 0 || cents(p.balanceAmount) < 0 ||
    cents(p.totalAmount) !== cents(p.paidAmount) + cents(p.balanceAmount)).map(p => p.id));
  report("successful transactions missing payment", transactions.filter(t =>
    !paymentById.has(t.paymentId)).map(t => t.id));
  report("Razorpay successful transactions missing/mismatched order", transactions.filter(t => {
    if (t.provider !== PaymentProvider.RAZORPAY) return false;
    const order = t.gatewayOrderId ? orderByGatewayId.get(t.gatewayOrderId) : undefined;
    return !order || order.paymentId !== t.paymentId ||
      cents(order.amount) !== cents(t.amount);
  }).map(t => t.id));
  report("processed capture receipts without matching successful transaction", receipts.filter(r => {
    if (!r.processed) return false;
    const txn = r.gatewayPaymentId ? transactionByGatewayId.get(r.gatewayPaymentId) : undefined;
    return !txn || txn.paymentId !== r.paymentId || txn.gatewayOrderId !== r.gatewayOrderId;
  }).map(r => r.id));
  report("pending capture receipts", receipts.filter(r => !r.processed).map(r => r.id));
  report("successful gateway collections without booking sync", transactions.filter(t =>
    t.provider === PaymentProvider.RAZORPAY &&
    !syncByPaymentId.has(t.paymentId)).map(t => t.id));
  report("booking sync pointing to different booking", syncs.filter(s => {
    const payment = paymentById.get(s.paymentId);
    return !payment || payment.bookingId !== s.bookingId;
  }).map(s => s.paymentId));
  report("non-synchronized booking projections", syncs.filter(s =>
    s.status !== "SYNCHRONIZED").map(s => s.paymentId));
  console.log(JSON.stringify({
    audit: "B4.4A_READ_ONLY_LOCAL_POSTGRES",
    totals: { payments: payments.length, successfulTransactions: transactions.length,
      razorpayOrders: orders.length, capturedReceipts: receipts.length, bookingSyncs: syncs.length },
    findings,
  }, null, 2));
  const critical = findings.filter(f => f.check !== "pending capture receipts" &&
    f.check !== "non-synchronized booking projections");
  assert.equal(critical.reduce((sum, f) => sum + f.count, 0), 0,
    "Critical reconciliation inconsistencies found; inspect report, do not deploy");
} finally {
  await prisma.$disconnect();
}
