import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

test("track page starts blank and offers OTP recovery without trusting a booking number", async () => {
  const [page, tracker] = await Promise.all([read("app/track/page.tsx"), read("components/moving/reference-tracker.tsx")]);
  assert.doesNotMatch(page, /searchParams/);
  assert.doesNotMatch(tracker, /em_last_reference/);
  assert.match(tracker, /I forgot my EM reference/);
  assert.match(tracker, /A booking number alone cannot unlock customer details/);
  assert.match(tracker, /Verify & find my moves/);
});

test("move recovery requires verified mobile and short-lived signed selection", async () => {
  const [route, session] = await Promise.all([read("app/api/public/customer-move-recovery/route.ts"), read("lib/enquiry-session.ts")]);
  assert.match(route, /checkOrigin\(request\)/);
  assert.match(route, /phone_confirmed_at/);
  assert.match(route, /customerTestOtpConfig/);
  assert.match(route, /where: \{ mobile \}/);
  assert.match(route, /readCustomerRecoveryToken/);
  assert.match(route, /customerAccessCookie/);
  assert.match(session, /CUSTOMER_RECOVERY_SECONDS = 5 \* 60/);
  assert.match(session, /timingSafeEqual/);
});

test("selected quotation replaces the offer count with the next booking stage", async () => {
  const [ui, draft, enquiry, recovery, layout] = await Promise.all([
    read("components/moving/customer-quotation-comparison.tsx"),
    read("components/moving/draft-editor.tsx"),
    read("app/api/public/moving-enquiry/route.ts"),
    read("app/api/public/customer-move-recovery/route.ts"),
    read("components/moving/moving.module.css"),
  ]);
  assert.match(ui, /Quotation selected/);
  assert.match(ui, /Booking confirmation pending/);
  assert.match(ui, /data\?\.selection\.selectedQuotationId/);
  assert.match(enquiry, /selectedQuotationId: true/);
  assert.match(draft, /QUOTATION SELECTED/);
  assert.match(draft, /Continue booking/);
  assert.match(recovery, /lead\.bookings\[0\]\?\.selectedQuotationId/);
  assert.match(layout, /\.sidebar \{\s*position: static/);
});
