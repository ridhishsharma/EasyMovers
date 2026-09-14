import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(path, dependencies = {}, environment = {}) {
  const source = readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, require(name) { if (name === 'next/server') return { NextResponse: { json: (body, options = {}) => Response.json(body, options) } }; if (name in dependencies) return dependencies[name]; throw Error(`Unexpected module ${name}`); }, Request, Response, URL, Date, Number, AbortSignal, process: { env: environment }, fetch: dependencies.fetch });
  return exports;
}
const trackingPath = 'app/api/customer/move-status/route.ts';
function tracking(auth, findFirst) { return load(trackingPath, { '@/lib/auth': { resolveApplicationAuthentication: async () => auth }, '@/lib/prisma': { prisma: { booking: { findFirst } } } }); }

test('unauthenticated tracking rejects before reading database', async () => {
  const route = tracking({ authenticated: false }, () => { throw Error('Must not query'); });
  assert.equal((await route.GET(new Request('https://example.com?bookingNumber=EM1'))).status, 401);
});
test('customer lookup restricts ownership and returns only selected status fields', async () => {
  let query;
  const route = tracking({ authenticated: true, userId: 'customer1', roles: ['CUSTOMER'] }, async input => { query = input; return { bookingNumber: 'EM1', bookingStatus: 'CONFIRMED', trackingStatus: 'IN_TRANSIT', updatedAt: new Date(), pickupCity: 'Bhopal', dropCity: 'Indore' }; });
  const response = await route.GET(new Request('https://example.com?bookingNumber=EM1'));
  assert.equal(query.where.userId, 'customer1');
  assert.equal(query.select.customerMobile, undefined);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal((await response.json()).locationTracking, false);
});
test('vendor is limited to assigned bookings; administrator may check any booking', async () => {
  for (const auth of [{ authenticated: true, userId: 'vendor-user', vendorId: 'vendor1', roles: ['VENDOR'] }, { authenticated: true, userId: 'admin1', roles: ['ADMIN'] }]) {
    let query;
    const route = tracking(auth, async input => { query = input; return null; });
    assert.equal((await route.GET(new Request('https://example.com?bookingNumber=EM1'))).status, 404);
    assert.equal(query.where.vendorId, auth.vendorId);
    assert.equal(query.where.userId, undefined);
  }
});
test('tracking rejects invalid identifiers and handles database outage', async () => {
  const route = tracking({ authenticated: true, userId: 'customer1' }, async () => { throw Error('Private connector details'); });
  assert.equal((await route.GET(new Request('https://example.com'))).status, 400);
  const response = await route.GET(new Request('https://example.com?bookingNumber=EM1'));
  assert.equal(response.status, 503);
  assert.ok(!(await response.text()).includes('Private connector'));
});
test('metrics preserve zero, reject invalid counts and never invent a rating', async () => {
  const route = load('app/api/public/platform-summary/route.ts', {}, { PUBLIC_SUCCESSFUL_MOVES: '0', PUBLIC_CITIES_COVERED: '-1', PUBLIC_VERIFIED_VENDORS: '2.5', PUBLIC_CUSTOMER_RATING: '7' });
  const data = await (await route.GET()).json();
  assert.equal(data.successfulMoves, 0); assert.equal(data.citiesCovered, null); assert.equal(data.verifiedVendors, null); assert.equal(data.rating, null);
});
test('PIN validation rejects malformed input before provider call', async () => {
  const route = load('app/api/public/postal-lookup/route.ts', { fetch() { throw Error('Must not fetch'); } });
  assert.equal((await route.GET(new Request('https://example.com?pin=abc123'))).status, 400);
});
test('PIN lookup returns locality choices without implying vendor availability', async () => {
  const route = load('app/api/public/postal-lookup/route.ts', { fetch: async () => Response.json([{ Status: 'Success', PostOffice: [{ Name: 'MP Nagar', District: 'Bhopal', State: 'Madhya Pradesh', Pincode: '462011' }] }]) });
  const data = await (await route.GET(new Request('https://example.com?pin=462011'))).json();
  assert.equal(data.locations[0].district, 'Bhopal'); assert.equal(data.locations[0].locality, 'MP Nagar'); assert.equal(data.serviceable, undefined);
});
test('PIN provider outage returns a manual-entry recovery message', async () => {
  const route = load('app/api/public/postal-lookup/route.ts', { fetch: async () => { throw Error('Timeout'); } });
  const response = await route.GET(new Request('https://example.com?pin=462011'));
  assert.equal(response.status, 503); assert.match((await response.json()).message, /manually/);
});
