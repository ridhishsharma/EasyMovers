import { timingSafeEqual } from "node:crypto";

type TestOtpConfig = {
  allowedOrigin: string;
  code: string;
  phones: Set<string>;
};

function normalizePhone(value: string) {
  return value.trim().replace(/^\+/, "");
}

export function customerTestOtpConfig(request: Request): TestOtpConfig | null {
  if (process.env.ENABLE_CUSTOMER_TEST_OTP !== "true") return null;

  const rawOrigin = process.env.CUSTOMER_TEST_OTP_ALLOWED_ORIGIN?.trim();
  const code = process.env.CUSTOMER_TEST_OTP?.trim() || "";
  const phones = new Set(
    (process.env.CUSTOMER_TEST_OTP_PHONES || "")
      .split(",")
      .map(normalizePhone)
      .filter((phone) => /^91[6-9]\d{9}$/.test(phone)),
  );
  if (!rawOrigin || !/^\d{6}$/.test(code) || phones.size === 0) return null;

  let allowed: URL;
  try {
    allowed = new URL(rawOrigin);
  } catch {
    return null;
  }
  const isStaging =
    allowed.protocol === "https:" && allowed.hostname.startsWith("staging.");
  const isLocalDevelopment =
    process.env.NODE_ENV !== "production" &&
    ["localhost", "127.0.0.1"].includes(allowed.hostname);
  if (!isStaging && !isLocalDevelopment) return null;

  // Railway terminates TLS at its public edge and may forward the request to
  // Next.js with an internal service URL. The browser Origin header remains
  // the authoritative public origin and is already protected by checkOrigin
  // in the route, so do not compare it with the proxy-rewritten request URL.
  if (request.headers.get("origin") !== allowed.origin) return null;

  return { allowedOrigin: allowed.origin, code, phones };
}

export function isAllowedCustomerTestPhone(
  config: TestOtpConfig,
  mobile: string,
) {
  return config.phones.has(`91${mobile}`);
}

export function matchesCustomerTestOtp(config: TestOtpConfig, supplied: string) {
  const expected = Buffer.from(config.code);
  const actual = Buffer.from(supplied);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
