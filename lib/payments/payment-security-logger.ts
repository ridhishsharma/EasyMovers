/** B4.4D.3B.1B — Deliberately minimal, structured, non-sensitive payment logging.
 * Never serialize unknown Error objects or third-party responses here.
 */
export type PaymentSecurityOperation =
  | "RAZORPAY_WEBHOOK_RECONCILIATION"
  | "RAZORPAY_ORDER_CREATE"
  | "RAZORPAY_ADVANCE_VERIFY";

export function logPaymentSecurityFailure(
  operation: PaymentSecurityOperation,
  requestId: string,
): void {
  // Only a fixed operation identifier and a generated UUID reach logs.
  // Do not add the caught error, its message, stack, cause, or request body.
  console.error(JSON.stringify({
    level: "error",
    component: "payment-security",
    operation,
    requestId: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)
      ? requestId
      : "invalid-request-id",
    code: "UNEXPECTED_PAYMENT_FAILURE",
  }));
}
