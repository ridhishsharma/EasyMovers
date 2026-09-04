const url =
  "http://localhost:3000/api/payments/PAY-POSTMAN-20260824-002/collections/success";

const requests = [
  {
    transactionId:
      "PTXN-TRUE-CONCURRENT-COLLECTION-A-20260901-001",

    amount:
      5000,

    currency:
      "INR",

    purpose:
      "BALANCE",

    method:
      "OTHER",

    provider:
      "OTHER",

    gateway: {
      provider:
        "OTHER",

      gatewayOrderId:
        "GW-ORDER-TRUE-CONCURRENT-A-20260901-001",

      gatewayPaymentId:
        "GW-PAYMENT-TRUE-CONCURRENT-A-20260901-001",

      gatewayReferenceId:
        "GW-REF-TRUE-CONCURRENT-A-20260901-001",
    },

    remarks:
      "True concurrent collection request A.",

    updatedBy:
      "NODE_PAYMENT_CONCURRENCY",
  },
  {
    transactionId:
      "PTXN-TRUE-CONCURRENT-COLLECTION-B-20260901-001",

    amount:
      5000,

    currency:
      "INR",

    purpose:
      "BALANCE",

    method:
      "OTHER",

    provider:
      "OTHER",

    gateway: {
      provider:
        "OTHER",

      gatewayOrderId:
        "GW-ORDER-TRUE-CONCURRENT-B-20260901-001",

      gatewayPaymentId:
        "GW-PAYMENT-TRUE-CONCURRENT-B-20260901-001",

      gatewayReferenceId:
        "GW-REF-TRUE-CONCURRENT-B-20260901-001",
    },

    remarks:
      "True concurrent collection request B.",

    updatedBy:
      "NODE_PAYMENT_CONCURRENCY",
  },
];

async function sendRequest(
  payload
) {
  const startedAt =
    new Date()
      .toISOString();

  const response =
    await fetch(
      url,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json",
        },

        body:
          JSON.stringify(
            payload
          ),
      }
    );

  return {
    transactionId:
      payload.transactionId,

    startedAt,

    completedAt:
      new Date()
        .toISOString(),

    httpStatus:
      response.status,

    body:
      await response
        .json(),
  };
}

const results =
  await Promise.all(
    requests.map(
      sendRequest
    )
  );

console.dir(
  results,
  {
    depth:
      null,

    colors:
      true,
  }
);