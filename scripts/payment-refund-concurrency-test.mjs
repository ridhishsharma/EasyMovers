const url =
  "http://localhost:3000/api/payments/PAY-AUTHORITY-POSITIVE-20260830-001/refunds/request";

const common = {
  amount:
    1500,

  currency:
    "INR",

  provider:
    "OTHER",

  recordedBy:
    "NODE_PAYMENT_CONCURRENCY",

  updatedBy:
    "NODE_PAYMENT_CONCURRENCY",
};

const requests = [
  {
    ...common,

    transactionId:
      "PTXN-CONCURRENCY-RETRY-FINAL-A-20260901-001",

    remarks:
      "Serializable retry final refund request A.",
  },
  {
    ...common,

    transactionId:
      "PTXN-CONCURRENCY-RETRY-FINAL-B-20260901-001",

    remarks:
      "Serializable retry final refund request B.",
  },
];

async function sendRequest(
  payload
) {
  const startedAt =
    new Date()
      .toISOString();

  try {
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

    const body =
      await response
        .json();

    return {
      transactionId:
        payload.transactionId,

      startedAt,

      completedAt:
        new Date()
          .toISOString(),

      httpStatus:
        response.status,

      body,
    };
  } catch (
    error
  ) {
    return {
      transactionId:
        payload.transactionId,

      startedAt,

      completedAt:
        new Date()
          .toISOString(),

      httpStatus:
        0,

      error:
        error instanceof
          Error
          ? error.message
          : String(
              error
            ),
    };
  }
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