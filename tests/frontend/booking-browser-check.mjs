import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)(process.argv[2] || "playwright");

(async () => {
  await mkdir("coverage/booking-checks", { recursive: true });
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const viewports = process.argv[3] === "faults" ? [] : [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 740 }];
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport });
      page.setDefaultNavigationTimeout(120000);
      const errors = [];
      page.on("pageerror", () => errors.push("Browser runtime error"));
      await page.route("**/api/public/platform-summary", route => route.fulfill({ json: {
        configuration: "missing", successfulMoves: null, citiesCovered: null, verifiedVendors: null, rating: null, updatedAt: null,
      } }));
      let lookups = 0;
      await page.route("**/api/public/postal-lookup?*", route => {
        lookups++;
        return route.fulfill({ json: { locations: [{ locality: "Test locality", district: "Test district", state: "Madhya Pradesh" }] } });
      });
      let draft;
      await page.route("**/api/public/moving-enquiry", async route => {
        draft = route.request().postDataJSON();
        await route.fulfill({ status: 503, json: { success: false, message: "Test save intercepted" } });
      });
      await page.goto("http://localhost:3012", { waitUntil: "networkidle" });
      assert.equal(await page.locator('header img[src="/image/New_Logo_NBG.png"]').evaluate(image => image.complete && image.naturalWidth > 0), true);
      const form = page.locator("#move-form");
      assert.ok((await page.locator('header').boundingBox()).height <= 82);
      assert.equal(await page.getByText('Launching soon', { exact: true }).count(), 4);
      if (viewport.width >= 1100) {
        assert.deepEqual(await page.locator('#landing-navigation a').allTextContents(), ['Services', 'How it works', 'Routes', 'Track move', 'Partner']);
        for (const link of await page.locator('#landing-navigation a').all()) assert.ok((await link.boundingBox()).height <= 24);
        const strip = await page.locator('[aria-label="Platform figures"]').boundingBox();
        assert.ok(strip.y + strip.height <= viewport.height, 'Counter strip must fit in the initial desktop viewport');
      }
      await page.screenshot({ path: `coverage/booking-checks/initial-${viewport.width}.png` });
      assert.equal(await form.getByRole("link", { name: "Call EasyMover Expert" }).getAttribute("href"), "tel:+918959591603");
      await form.getByLabel("Service city").selectOption("Bhopal, Madhya Pradesh");
      await form.getByLabel("Pickup address", { exact: true }).fill("MP Nagar pickup");
      await form.getByLabel("Drop address", { exact: true }).fill("Arera Colony drop");
      assert.equal(await form.getByRole("combobox", { name: /^Vehicle/ }).locator('option').count(), 11);
      await form.getByRole("combobox", { name: /^Vehicle/ }).selectOption("MINI_TRUCK");
      await form.getByLabel("Mobile number").fill("9000091301");
      await form.getByRole("checkbox").check();
      await form.getByRole("button", { name: "Continue", exact: true }).click();
      await form.getByText("Test save intercepted").waitFor();
      assert.equal(draft.serviceCity, "Bhopal, Madhya Pradesh");
      assert.equal(draft.from.city, draft.serviceCity);
      assert.equal(draft.localVehicle, "MINI_TRUCK");
      await form.screenshot({ path: `coverage/booking-checks/local-${viewport.width}.png` });
      await form.getByLabel("Service city").selectOption("");
      await form.getByLabel("Service city").selectOption("Bhopal, Madhya Pradesh");
      assert.equal(await form.getByLabel("Pickup address", { exact: true }).inputValue(), "");
      assert.equal(await form.getByRole("combobox", { name: /^Vehicle/ }).inputValue(), "");
      await form.getByRole("button", { name: "Between Cities" }).click();
      await form.getByRole("button", { name: "Search origin by PIN" }).click();
      await form.getByLabel("Origin PIN", { exact: true }).fill("123");
      await form.getByRole("button", { name: "Find origin PIN" }).click();
      await form.getByText("Enter a valid six-digit PIN.").waitFor();
      assert.equal(lookups, 0);
      await form.getByLabel("Origin PIN", { exact: true }).fill("462011");
      await form.getByRole("button", { name: "Find origin PIN" }).click();
      await form.getByLabel("Origin locality").waitFor();
      await form.getByRole("button", { name: "Search destination by PIN" }).click();
      await form.getByLabel("Destination PIN", { exact: true }).fill("452001");
      await form.getByRole("button", { name: "Find destination PIN" }).click();
      await form.getByLabel("Destination locality").waitFor();
      await form.getByRole("button", { name: "Continue", exact: true }).click();
      await form.getByText("Test save intercepted").waitFor();
      assert.equal(draft.from.pin, "462011");
      assert.equal(draft.to.pin, "452001");
      await form.getByLabel("Origin PIN", { exact: true }).fill("462012");
      await form.getByRole("button", { name: "Continue", exact: true }).click();
      await form.getByText("Select both locations from the suggestions or validate their PINs.").waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.equal(await page.locator('[aria-label="Platform figures"]').getAttribute("data-status"), "missing");
      assert.deepEqual(errors, []);
      await page.screenshot({ path: `coverage/booking-checks/page-${viewport.width}.png`, fullPage: true });
      console.log(`PASS ${viewport.width}px: local selection, PIN validation, reset, expert action, counters, no overflow or runtime errors`);
      await page.close();
    }
    for (const [status, payload, expected] of [[503, {}, 'api_error'], [200, {}, 'invalid_response']]) {
      const page = await browser.newPage();
      await page.route('**/api/public/platform-summary', route => route.fulfill({ status, json: payload }));
      await page.route('**/image/New_Logo_NBG.png', route => route.abort());
      await page.goto('http://localhost:3012', { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.locator(`[aria-label="Platform figures"][data-status="${expected}"]`).waitFor();
      assert.equal(await page.locator('header [aria-label="EasyMovers"]').count(), 1);
      await page.close();
      console.log(`PASS counter ${expected} and missing-logo fallback`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
