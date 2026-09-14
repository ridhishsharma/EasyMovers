import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as crypto from "node:crypto";
function harness(
  prisma = {},
  fetchImpl = () => {
    throw Error("No provider expected");
  },
  auth = {},
  supabase = {},
) {
  const env = {
    ENQUIRY_SESSION_SECRET:
      "qa-private-secret-longer-than-thirty-two-characters",
    SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "publishable-test-key",
    GOOGLE_MAPS_SERVER_KEY: "server-test-key",
  };
  const cache = new Map();
  function load(path) {
    if (cache.has(path)) return cache.get(path);
    const source = readFileSync(
      new URL(`../../${path}`, import.meta.url),
      "utf8",
    );
    const compiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    const exports = {};
    cache.set(path, exports);
    vm.runInNewContext(compiled, {
      exports,
      Buffer,
      FormData,
      File,
      Request,
      Response,
      URL,
      Date,
      Number,
      AbortSignal,
      process: { env },
      fetch: fetchImpl,
      require(name) {
        if (name === "node:crypto") return crypto;
        if (name === "next/server")
          return {
            NextResponse: {
              json: (body, options) => Response.json(body, options),
            },
          };
        if (name === "@/lib/prisma") return { prisma };
        if (name === "@/lib/auth")
          return { resolveApplicationAuthentication: async () => auth };
        if (name === "@supabase/supabase-js")
          return {
            createClient: () => ({ auth: { getUser: async () => supabase } }),
          };
        if (name.startsWith("@/")) return load(`${name.slice(2)}.ts`);
        if (name.startsWith("./"))
          return load(
            `${path.slice(0, path.lastIndexOf("/") + 1)}${name.slice(2)}.ts`,
          );
        throw Error(name);
      },
    });
    return exports;
  }
  return { load, env };
}
function request(method, body, cookie) {
  return new Request(
    "https://staging.easymovers.in/api/public/moving-enquiry",
    {
      method,
      headers: {
        Origin: "https://staging.easymovers.in",
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
  );
}
const initial = {
  requestId: "12345678-1234-4123-8123-123456789012",
  mode: "LOCAL",
  mobile: "9000091301",
  consent: true,
  from: { city: "Bhopal, Madhya Pradesh", address: "MP Nagar pickup" },
  to: { city: "Bhopal, Madhya Pradesh", address: "Arera Colony drop" },
};
const reference = "EM-AB12-CD34-EF56-7890",
  version = "2026-09-14T00:00:00.000Z";
const details = {
  reference,
  version,
  action: "SAVE",
  name: "Test Owner",
  shiftingType: "Goods",
  pickupAddress: "Pickup address",
  destinationAddress: "Drop address",
  items: [{ itemName: "Sofa", quantity: 1 }],
};
test("initial local lead and inventory are atomic, reference readable, private session HttpOnly", async () => {
  let leadInput, inventoryInput;
  const h = harness({
    $transaction: async (callback) =>
      callback({
        lead: {
          upsert: async (input) => {
            leadInput = input;
            return {
              id: "private-lead",
              referenceId: input.create.referenceId,
            };
          },
        },
        inventory: {
          upsert: async (input) => {
            inventoryInput = input;
            return {};
          },
        },
      }),
  });
  const route = h.load("app/api/public/moving-enquiry/route.ts");
  const response = await route.POST(request("POST", initial));
  const data = await response.json();
  assert.equal(response.status, 201);
  assert.match(data.reference, /^EM-(?:[A-F0-9]{4}-){3}[A-F0-9]{4}$/);
  assert.equal(data.leadId, undefined);
  assert.equal(data.enquiryToken, undefined);
  assert.equal(leadInput.create.destinationCity, "Bhopal");
  assert.equal(inventoryInput.create.status, "DRAFT");
  assert.match(
    response.headers.get("set-cookie"),
    /HttpOnly; SameSite=Lax; Path=\/api; Max-Age=2592000; Secure/,
  );
});
test("duplicate initial retry uses one unique reference and does not overwrite data", async () => {
  const inputs = [];
  const h = harness({
    $transaction: async (callback) =>
      callback({
        lead: {
          upsert: async (input) => {
            inputs.push(input);
            return {
              id: "private-lead",
              referenceId: input.create.referenceId,
            };
          },
        },
        inventory: { upsert: async () => ({}) },
      }),
  });
  const route = h.load("app/api/public/moving-enquiry/route.ts");
  await route.POST(request("POST", initial));
  await route.POST(request("POST", initial));
  assert.equal(inputs[0].where.referenceId, inputs[1].where.referenceId);
  assert.equal(Object.keys(inputs[1].update).length, 0);
});
test("country/city validation rejects arbitrary text and local routes across cities before writes", async () => {
  let writes = 0;
  const h = harness({
    $transaction: () => {
      writes++;
    },
  });
  const route = h.load("app/api/public/moving-enquiry/route.ts");
  for (const change of [
    { from: { city: "Paris, France", address: "Road" } },
    { to: { city: "Indore, Madhya Pradesh", address: "Road in Indore" } },
    { mobile: "111" },
    { consent: false },
  ])
    assert.equal(
      (await route.POST(request("POST", { ...initial, ...change }))).status,
      400,
    );
  assert.equal(writes, 0);
});
test("Google place IDs are verified on server, including country and city types", async () => {
  let fetches = 0;
  const h = harness({}, async () => {
    fetches++;
    return Response.json({
      id: "place1",
      formattedAddress: "Paris",
      addressComponents: [
        { types: ["country"], shortText: "FR" },
        { types: ["locality"], longText: "Paris" },
      ],
      types: ["locality"],
    });
  });
  const location = h.load("lib/verified-indian-location.ts");
  await assert.rejects(
    () =>
      location.verifyIndianLocation(
        { placeId: "place1", city: "Bhopal, Madhya Pradesh" },
        true,
      ),
    /India/,
  );
  assert.equal(fetches, 1);
});
test("valid Google selection supplies canonical city and coordinates; street is not intercity city", async () => {
  const h = harness({}, async () =>
    Response.json({
      id: "place1",
      formattedAddress: "MP Nagar, Bhopal",
      addressComponents: [
        { types: ["country"], shortText: "IN" },
        { types: ["locality"], longText: "Bhopal" },
        { types: ["administrative_area_level_1"], longText: "Madhya Pradesh" },
      ],
      location: { latitude: 23.2, longitude: 77.4 },
      types: ["street_address"],
    }),
  );
  const location = h.load("lib/verified-indian-location.ts");
  const result = await location.verifyIndianLocation(
    { placeId: "place1" },
    true,
  );
  assert.equal(result.city, "Bhopal");
  assert.equal(result.latitude, 23.2);
  await assert.rejects(
    () => location.verifyIndianLocation({ placeId: "place1" }, false),
    /city/,
  );
});
test("unlisted intercity PIN requires a genuine matching Indian postal locality", async () => {
  const h = harness({}, async () =>
    Response.json([
      {
        Status: "Success",
        PostOffice: [
          {
            Name: "Test locality",
            District: "Test district",
            State: "Madhya Pradesh",
            Country: "India",
          },
        ],
      },
    ]),
  );
  const location = h.load("lib/verified-indian-location.ts");
  const result = await location.verifyIndianLocation(
    { pin: "462011", locality: "Test locality" },
    false,
  );
  assert.equal(result.pin, "462011");
  await assert.rejects(
    () =>
      location.verifyIndianLocation(
        { pin: "462011", locality: "Invented" },
        false,
      ),
    /valid/,
  );
});
test("reference alone, forged and expired cookie never return draft contact data", async () => {
  let reads = 0;
  const h = harness({
    lead: {
      findUnique: () => {
        reads++;
      },
    },
  });
  const route = h.load("app/api/public/moving-enquiry/route.ts");
  for (const cookie of [undefined, "forged=value"]) {
    const response = await route.GET(
      new Request(
        `https://staging.easymovers.in/api/public/moving-enquiry?reference=${reference}`,
        { headers: cookie ? { Cookie: cookie } : {} },
      ),
    );
    assert.equal(response.status, 401);
  }
  const session = h.load("lib/enquiry-session.ts");
  const payload = Buffer.from(
    JSON.stringify({ id: "a", reference, expires: Date.now() - 1 }),
  ).toString("base64url");
  const cookie = `${session.draftCookieName(reference)}=${payload}.${session.draftSignature(payload)}`;
  assert.equal(
    (
      await route.GET(
        new Request(
          `https://staging.easymovers.in/api/public/moving-enquiry?reference=${reference}`,
          { headers: { Cookie: cookie } },
        ),
      )
    ).status,
    401,
  );
  assert.equal(reads, 0);
});
test("draft save writes inventory and lead together and retains draft status and consent", async () => {
  let inventoryUpdate, leadUpdate, created;
  const h = harness({
    $transaction: async (callback) =>
      callback({
        lead: {
          findUnique: async () => ({
            notes: JSON.stringify({ contactConsent: true, mode: "LOCAL" }),
          }),
          update: async (input) => {
            leadUpdate = input;
          },
        },
        inventory: {
          updateMany: async (input) => {
            inventoryUpdate = input;
            return { count: 1 };
          },
          findUniqueOrThrow: async () => ({
            id: "inventory-a",
            updatedAt: new Date(version),
          }),
        },
        inventoryItem: {
          deleteMany: async () => {},
          createMany: async (input) => {
            created = input;
          },
        },
      }),
  });
  const route = h.load("app/api/public/moving-enquiry/route.ts"),
    session = h.load("lib/enquiry-session.ts");
  const response = await route.PATCH(
    request(
      "PATCH",
      { ...details, id: "wrong-lead", mobile: "111", userId: "attacker" },
      session.draftCookie("lead-a", reference, true),
    ),
  );
  assert.equal(response.status, 200);
  assert.equal(inventoryUpdate.where.status, "DRAFT");
  assert.equal(inventoryUpdate.data.status, "DRAFT");
  assert.equal(leadUpdate.where.id, "lead-a");
  assert.equal(leadUpdate.data.mobile, undefined);
  assert.equal(leadUpdate.data.userId, undefined);
  assert.equal(JSON.parse(leadUpdate.data.notes).stage, "DRAFT");
  assert.equal(JSON.parse(leadUpdate.data.notes).contactConsent, true);
  assert.equal(created.data[0].inventoryId, "inventory-a");
});
test("submit validates name, date and items before writing, then records quotation request", async () => {
  let queries = 0,
    leadUpdate;
  const h = harness({
    $transaction: async (callback) => {
      queries++;
      return callback({
        lead: {
          findUnique: async () => ({ notes: "{}" }),
          update: async (input) => {
            leadUpdate = input;
          },
        },
        inventory: {
          updateMany: async () => ({ count: 1 }),
          findUniqueOrThrow: async () => ({
            id: "inventory-a",
            updatedAt: new Date(version),
          }),
        },
        inventoryItem: {
          deleteMany: async () => {},
          createMany: async () => {},
        },
      });
    },
  });
  const route = h.load("app/api/public/moving-enquiry/route.ts"),
    session = h.load("lib/enquiry-session.ts");
  const cookie = session.draftCookie("lead-a", reference, true);
  for (const change of [
    { name: "" },
    { items: [] },
    { shiftingDate: "2029-02-31" },
  ])
    assert.equal(
      (
        await route.PATCH(
          request(
            "PATCH",
            {
              ...details,
              action: "SUBMIT",
              shiftingDate: "2029-09-30",
              ...change,
            },
            cookie,
          ),
        )
      ).status,
      400,
    );
  assert.equal(queries, 0);
  const response = await route.PATCH(
    request(
      "PATCH",
      { ...details, action: "SUBMIT", shiftingDate: "2029-09-30" },
      cookie,
    ),
  );
  assert.equal(response.status, 200);
  assert.equal(JSON.parse(leadUpdate.data.notes).stage, "QUOTATION_REQUESTED");
});
test("stale or submitted draft returns conflict and does not replace items", async () => {
  let deletions = 0;
  const h = harness({
    $transaction: async (callback) =>
      callback({
        lead: { findUnique: async () => ({ notes: "{}" }) },
        inventory: { updateMany: async () => ({ count: 0 }) },
        inventoryItem: {
          deleteMany: () => {
            deletions++;
          },
        },
      }),
  });
  const route = h.load("app/api/public/moving-enquiry/route.ts"),
    session = h.load("lib/enquiry-session.ts");
  assert.equal(
    (
      await route.PATCH(
        request(
          "PATCH",
          details,
          session.draftCookie("lead-a", reference, true),
        ),
      )
    ).status,
    409,
  );
  assert.equal(deletions, 0);
});
test("OTP resume requires verified matching phone and ignores client identity claims", async () => {
  let query;
  const h = harness(
    {
      lead: {
        findFirst: async (input) => {
          query = input;
          return { id: "lead-a", referenceId: reference };
        },
      },
    },
    undefined,
    {},
    {
      data: { user: { phone: "919000091301", phone_confirmed_at: version } },
      error: null,
    },
  );
  const route = h.load("app/api/public/draft-resume/route.ts");
  const req = request("POST", { reference, mobile: "other", id: "wrong" });
  req.headers.set("authorization", "Bearer verified-token");
  const response = await route.POST(req);
  assert.equal(response.status, 200);
  assert.equal(query.where.mobile, "9000091301");
  assert.match(response.headers.get("set-cookie"), /HttpOnly/);
});
test("OTP resume rejects unverified phone before querying draft", async () => {
  let reads = 0;
  const h = harness(
    {
      lead: {
        findFirst: () => {
          reads++;
        },
      },
    },
    undefined,
    {},
    { data: { user: { phone: "919000091301" } }, error: null },
  );
  const route = h.load("app/api/public/draft-resume/route.ts");
  const req = request("POST", { reference });
  req.headers.set("authorization", "Bearer token");
  assert.equal((await route.POST(req)).status, 401);
  assert.equal(reads, 0);
});
test("legacy inventory endpoint does not expose a new draft by reference alone", async () => {
  const h = harness({}, undefined, { authenticated: false });
  const route = h.load("app/api/inventory/route.ts");
  assert.equal(
    (
      await route.GET(
        new Request(
          `https://staging.easymovers.in/api/inventory?referenceId=${reference}`,
        ),
      )
    ).status,
    401,
  );
});

test("assistance requires a private draft session before database access",async()=>{const h=harness();const endpoint=h.load("app/api/public/draft-assistance/route.ts");assert.equal((await endpoint.POST(request("POST",{reference,version,slot:"2099-01-01T12:00+05:30"}))).status,401);assert.equal((await endpoint.GET(new Request(`https://staging.easymovers.in/api/public/draft-assistance?reference=${reference}`))).status,401)});
test("callback rejects past slots and stale versions; valid callback keeps inventory draft",async()=>{let updated,leadUpdate;const tx={inventory:{updateMany:async input=>{updated=input;return {count:1}},findUniqueOrThrow:async()=>({updatedAt:new Date(version)})},lead:{update:async input=>{leadUpdate=input}}};const h=harness({inventory:{findFirst:async()=>({id:"inventory",_count:{photos:0}})},$transaction:async callback=>callback(tx)});const endpoint=h.load("app/api/public/draft-assistance/route.ts");const cookie=h.load("lib/enquiry-session.ts").draftCookie("lead-a",reference,true);assert.equal((await endpoint.POST(request("POST",{reference,version,slot:"2000-01-01T12:00+05:30"},cookie))).status,400);const slot=new Date(Date.now()+86400000+330*60000).toISOString().slice(0,16)+"+05:30";assert.equal((await endpoint.POST(request("POST",{reference,version,slot},cookie))).status,200);assert.equal(updated.where.status,"DRAFT");assert.equal(updated.data.callbackRequested,true);assert.equal(leadUpdate.data.status,"INVENTORY_PENDING");tx.inventory.updateMany=async()=>({count:0});assert.equal((await endpoint.POST(request("POST",{reference,version,slot},cookie))).status,409)});
test("fare endpoint rejects missing session and unavailable tariffs",async()=>{const h=harness();const endpoint=h.load("app/api/public/local-fare/route.ts");assert.equal((await endpoint.POST(request("POST",{reference}))).status,401);const cookie=h.load("lib/enquiry-session.ts").draftCookie("lead-a",reference,true);assert.equal((await endpoint.POST(request("POST",{reference},cookie))).status,503)});
test("photo uploads reject disguised files before storage and enforce saved-photo limit",async()=>{let count=0;const h=harness({inventory:{findFirst:async()=>({id:"inventory",_count:{photos:count}})}});const endpoint=h.load("app/api/public/draft-assistance/route.ts");const cookie=h.load("lib/enquiry-session.ts").draftCookie("lead-a",reference,true);function upload(){const form=new FormData();form.set("reference",reference);form.set("version",version);form.set("file",new File(["not a genuine image"],"fake.jpg",{type:"image/jpeg"}));return new Request("https://staging.easymovers.in/api/public/draft-assistance",{method:"POST",headers:{Origin:"https://staging.easymovers.in",Cookie:cookie},body:form})}assert.equal((await endpoint.POST(upload())).status,400);count=10;assert.equal((await endpoint.POST(upload())).status,400)});
