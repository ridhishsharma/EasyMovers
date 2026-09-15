import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.argv[2] || "playwright");

await mkdir('coverage/booking-checks', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const width of [1100, 1099, 1060, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto('http://localhost:3012', { waitUntil: 'networkidle', timeout: 120000 });
    assert.ok((await page.locator('header').boundingBox()).height <= 82);
    if (width < 1100) {
      const menu = page.getByRole('button', { name: 'Open navigation' });
      await menu.click();
      await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Partner', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Close navigation' }).click();
    } else assert.equal(await page.getByRole('button', { name: 'Open navigation' }).isVisible(), false);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `coverage/booking-checks/navbar-${width}.png` });
    await page.close();
  }
  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.setDefaultNavigationTimeout(120000);
    const mutations = [];
    page.on('request', request => { if (request.method() !== 'GET' && request.url().includes('/api/')) mutations.push(request.url()); });
    await page.goto('http://localhost:3012/partner', { waitUntil: 'networkidle' });
    assert.equal(await page.locator('form').count(), 0);
    await page.getByRole('heading', { name: 'Register Moving Company' }).waitFor();
    await page.getByRole('heading', { name: 'Register Individual Transporter' }).waitFor();
    await page.screenshot({ path: `coverage/booking-checks/partner-choices-${width}.png` });
    await page.getByRole('link', { name: /Register Individual Transporter/ }).click();
    await page.getByLabel(/^Full name/).fill('Test Driver');
    await page.getByLabel(/^Mobile number/).fill('9000091301');
    await page.getByRole('button', { name: /Continue/ }).click();
    await page.getByRole('radio', { name: '14-ft closed truck' }).check({ force: true });
    await page.getByRole('button', { name: /Continue/ }).click();
    await page.getByLabel(/^Commercial driving licence/).fill('MP04C12345');
    await page.getByLabel(/^Complete PAN number/).fill('ABCDE1234F');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /Save interest/ }).click();
    await page.getByRole('status').filter({ hasText: 'Interest saved on this device' }).waitFor();
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('status').filter({ hasText: 'Draft restored' }).waitFor();
    assert.equal(await page.getByLabel(/^Full name/).inputValue(), 'Test Driver');
    assert.deepEqual(mutations, []);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `coverage/booking-checks/individual-${width}.png`, fullPage: true });
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Clear' }).click();
    await page.getByRole('status').filter({ hasText: 'Local draft deleted' }).waitFor();
    await page.getByRole('link', { name: 'Partner options', exact: true }).click();
    await page.getByRole('link', { name: /Register Moving Company/ }).click();
    await page.getByLabel('Company / business name').waitFor();
    assert.deepEqual(mutations, []);
    await page.close();
    console.log(`PASS partner ${width}px: chooser, local save/restore/clear, company journey, no vendor submissions`);
  }
  console.log('PASS navbar at 1100, 1099, 1060 and 390px');
} finally { await browser.close(); }
