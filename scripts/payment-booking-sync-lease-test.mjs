const endpoint =
  "http://localhost:3000/api/payments/reconciliation/booking-sync-retries";

const retrySecret =
  "EASYMOVERS_PAYMENT_SYNC_RETRY_20260903";

const dueAt =
  new Date()
    .toISOString();

async function executeWorker(
  workerName
) {
  const startedAt =
    new Date()
      .toISOString();

  const response =
    await fetch(
      endpoint,
      {
        method:
          "POST",

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/json",

          "x-payment-sync-retry-secret":
            retrySecret,

          "x-user-id":
            workerName,
        },

        body:
          JSON.stringify({
            processedBy:
              workerName,

            dueAt,

            batchSize:
              25,
          }),
      }
    );

  const body =
    await response
      .json();

  return {
    worker:
      workerName,

    startedAt,

    completedAt:
      new Date()
        .toISOString(),

    httpStatus:
      response.status,

    body,
  };
}

async function main() {
  const results =
    await Promise.all([
      executeWorker(
        "NODE_PAYMENT_SYNC_WORKER_A"
      ),

      executeWorker(
        "NODE_PAYMENT_SYNC_WORKER_B"
      ),
    ]);

  console.dir(
    results,
    {
      depth:
        null,

      colors:
        true,
    }
  );
}

main()
  .catch(
    (
      error
    ) => {
      console.error(
        "Payment Booking synchronization lease test failed.",
        error
      );

      process.exitCode =
        1;
    }
  );