import assert from "node:assert/strict";
import test from "node:test";

import {
  VendorPricingType,
  VendorServiceScope,
  VendorServiceType,
} from "../../domains/vendor/models/vendor.model";

import {
  createPrismaVendorServiceArea,
  createPrismaVendorService,
  createPrismaVendorPricing,
  createPrismaVendorWhere,
  deletePrismaVendorRecord,
  findPrismaVendorPricing,
  findPrismaVendorServiceAreas,
  findPrismaVendorServices,
  prismaVendorExists,
  replacePrismaVendorPricing,
  replacePrismaVendorServiceAreas,
PrismaVendorRepositoryTransactionManager,
  replacePrismaVendorServices,
} from "../../domains/vendor/repositories/prisma-vendor.repository";

interface VendorRecord {
  id: string;
  serviceCities: string;
  householdService: boolean;
  officeService: boolean;
  vehicleService: boolean;
  status: string;
  deletedAt: Date | null;
}

interface ServiceAreaRecord {
  id: string;
  vendorId: string;
  scope: string;
  originCity: string | null;
  originState: string | null;
  destinationCity: string | null;
  destinationState: string | null;
  serviceablePostalCodes: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ServiceRecord {
  id: string;
  vendorId: string;
  serviceType: string;
  title: string;
  description: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PricingRecord {
  id: string;
  vendorId: string;
  serviceType: string;
  pricingType: string;
  basePrice: number | null;
  minimumPrice: number | null;
  pricePerKilometre: number | null;
  pricePerKilogram: number | null;
  pricePerItem: number | null;
  labourCharge: number | null;
  packingCharge: number | null;
  loadingCharge: number | null;
  unloadingCharge: number | null;
  insuranceChargePercentage: number | null;
  taxPercentage: number | null;
  currency: string;
  active: boolean;
  effectiveFrom: Date | null;
  effectiveUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function createMemoryPrisma() {
  const now = new Date("2026-09-11T08:00:00.000Z");

  const vendors = new Map<string, VendorRecord>([
    [
      "vendor-1",
      {
        id: "vendor-1",
        serviceCities: "",
        householdService: false,
        officeService: false,
        vehicleService: false,
        status: "ACTIVE",
        deletedAt: null,
      },
    ],
  ]);

  let idSequence = 0;
  let serviceAreas: ServiceAreaRecord[] = [];
  let services: ServiceRecord[] = [];
  let pricingRecords: PricingRecord[] = [];

  const nextId = (prefix: string) => {
    idSequence += 1;
    return `${prefix}-${idSequence}`;
  };

  const matchesVendorWhere = (
    vendor: VendorRecord,
    where: Record<string, unknown> | undefined
  ) => {
    if (!where) return true;
    if (where.id !== undefined && vendor.id !== where.id) return false;
    if (where.deletedAt === null && vendor.deletedAt !== null) return false;
    return true;
  };

  const prisma: any = {
    $transaction: async (operation: (transaction: any) => Promise<unknown>) =>
      operation(prisma),

    vendor: {
      findFirst: async ({ where }: any) =>
        [...vendors.values()].find((vendor) =>
          matchesVendorWhere(vendor, where)
        ) ?? null,

      findUnique: async ({ where }: any) =>
        vendors.get(where.id) ?? null,

      update: async ({ where, data }: any) => {
        const current = vendors.get(where.id);
        if (!current) throw new Error("Vendor not found");
        const updated = { ...current, ...data };
        vendors.set(where.id, updated);
        return updated;
      },
    },

    vendorServiceArea: {
      create: async ({ data }: any) => {
        const record: ServiceAreaRecord = {
          id: data.id ?? nextId("area"),
          vendorId: data.vendorId,
          scope: data.scope,
          originCity: data.originCity ?? null,
          originState: data.originState ?? null,
          destinationCity: data.destinationCity ?? null,
          destinationState: data.destinationState ?? null,
          serviceablePostalCodes: data.serviceablePostalCodes ?? [],
          active: data.active,
          createdAt: data.createdAt ?? now,
          updatedAt: data.updatedAt ?? now,
        };
        serviceAreas.push(record);
        return record;
      },

      findMany: async ({ where }: any) =>
        serviceAreas.filter((record) =>
          !where?.vendorId || record.vendorId === where.vendorId
        ),

      findFirst: async ({ where }: any) =>
        serviceAreas.find((record) =>
          record.id === where.id && record.vendorId === where.vendorId
        ) ?? null,

      update: async ({ where, data }: any) => {
        const index = serviceAreas.findIndex((record) => record.id === where.id);
        if (index < 0) throw new Error("Service area not found");
        serviceAreas[index] = { ...serviceAreas[index], ...data };
        return serviceAreas[index];
      },

      deleteMany: async ({ where }: any) => {
        const before = serviceAreas.length;
        serviceAreas = serviceAreas.filter((record) => {
          const vendorMatches = !where.vendorId || record.vendorId === where.vendorId;
          const idMatches = !where.id || record.id === where.id;
          return !(vendorMatches && idMatches);
        });
        return { count: before - serviceAreas.length };
      },
    },

    vendorServiceOffering: {
      findMany: async ({ where }: any) =>
        services.filter((record) => record.vendorId === where.vendorId),

      findFirst: async ({ where }: any) =>
        services.find((record) =>
          record.id === where.id && record.vendorId === where.vendorId
        ) ?? null,

      findUnique: async ({ where }: any) => {
        const key = where.vendorId_serviceType;
        return services.find((record) =>
          record.vendorId === key.vendorId && record.serviceType === key.serviceType
        ) ?? null;
      },

      create: async ({ data }: any) => {
        const record: ServiceRecord = {
          id: data.id ?? nextId("service"),
          vendorId: data.vendorId,
          serviceType: data.serviceType,
          title: data.title,
          description: data.description ?? null,
          active: data.active,
          createdAt: data.createdAt ?? now,
          updatedAt: data.updatedAt ?? now,
        };
        services.push(record);
        return record;
      },

      upsert: async ({ where, create, update }: any) => {
        const key = where.vendorId_serviceType;
        const index = services.findIndex((record) =>
          record.vendorId === key.vendorId && record.serviceType === key.serviceType
        );
        if (index >= 0) {
          services[index] = { ...services[index], ...update };
          return services[index];
        }
        return prisma.vendorServiceOffering.create({ data: create });
      },

      update: async ({ where, data }: any) => {
        const index = services.findIndex((record) => record.id === where.id);
        if (index < 0) throw new Error("Service not found");
        services[index] = { ...services[index], ...data };
        return services[index];
      },

      deleteMany: async ({ where }: any) => {
        const before = services.length;
        services = services.filter((record) => {
          const vendorMatches = !where.vendorId || record.vendorId === where.vendorId;
          const idMatches = !where.id || record.id === where.id;
          return !(vendorMatches && idMatches);
        });
        return { count: before - services.length };
      },
    },

    vendorPricing: {
      create: async ({ data }: any) => {
        const record: PricingRecord = {
          id: data.id ?? nextId("pricing"),
          vendorId: data.vendorId,
          serviceType: data.serviceType,
          pricingType: data.pricingType,
          basePrice: data.basePrice ?? null,
          minimumPrice: data.minimumPrice ?? null,
          pricePerKilometre: data.pricePerKilometre ?? null,
          pricePerKilogram: data.pricePerKilogram ?? null,
          pricePerItem: data.pricePerItem ?? null,
          labourCharge: data.labourCharge ?? null,
          packingCharge: data.packingCharge ?? null,
          loadingCharge: data.loadingCharge ?? null,
          unloadingCharge: data.unloadingCharge ?? null,
          insuranceChargePercentage: data.insuranceChargePercentage ?? null,
          taxPercentage: data.taxPercentage ?? null,
          currency: data.currency,
          active: data.active,
          effectiveFrom: data.effectiveFrom ?? null,
          effectiveUntil: data.effectiveUntil ?? null,
          createdAt: data.createdAt ?? now,
          updatedAt: data.updatedAt ?? now,
        };
        pricingRecords.push(record);
        return record;
      },

      findMany: async ({ where }: any) =>
        pricingRecords.filter((record) =>
          record.vendorId === where.vendorId &&
          (!where.serviceType || record.serviceType === where.serviceType)
        ),

      findFirst: async ({ where }: any) =>
        pricingRecords.find((record) =>
          record.id === where.id && record.vendorId === where.vendorId
        ) ?? null,

      update: async ({ where, data }: any) => {
        const index = pricingRecords.findIndex((record) => record.id === where.id);
        if (index < 0) throw new Error("Pricing not found");
        pricingRecords[index] = { ...pricingRecords[index], ...data };
        return pricingRecords[index];
      },

      deleteMany: async ({ where }: any) => {
        const before = pricingRecords.length;
        pricingRecords = pricingRecords.filter((record) => {
          const vendorMatches = !where.vendorId || record.vendorId === where.vendorId;
          const idMatches = !where.id || record.id === where.id;
          return !(vendorMatches && idMatches);
        });
        return { count: before - pricingRecords.length };
      },
    },
  };

  return {
    prisma,
    vendors,
    getServiceAreas: () => serviceAreas,
    getServices: () => services,
    getPricing: () => pricingRecords,
  };
}

test("Service-area persistence stores normalized fields and updates the legacy city mirror", async () => {
  const memory = createMemoryPrisma();

  const created = await createPrismaVendorServiceArea(
    memory.prisma,
    "vendor-1",
    {
      id: "area-bhopal",
      scope: VendorServiceScope.WITHIN_CITY,
      originCity: "Bhopal",
      originState: "Madhya Pradesh",
      destinationCity: "Bhopal",
      destinationState: "Madhya Pradesh",
      serviceablePostalCodes: ["462011", "462011", " 462016 "],
      active: true,
    }
  );

  assert.equal(created.id, "area-bhopal");
  assert.deepEqual(created.serviceablePostalCodes, ["462011", "462016"]);
  assert.equal(memory.vendors.get("vendor-1")?.serviceCities, "Bhopal");
  assert.equal((await findPrismaVendorServiceAreas(memory.prisma, "vendor-1")).length, 1);
});

test("Replacing service areas removes obsolete records and synchronizes all service cities", async () => {
  const memory = createMemoryPrisma();

  const result = await replacePrismaVendorServiceAreas(memory.prisma, {
    vendorId: "vendor-1",
    serviceAreas: [
      {
        scope: VendorServiceScope.WITHIN_STATE,
        originCity: "Bhopal",
        originState: "Madhya Pradesh",
        destinationCity: "Indore",
        destinationState: "Madhya Pradesh",
        serviceablePostalCodes: [],
        active: true,
      },
      {
        scope: VendorServiceScope.WITHIN_STATE,
        originCity: "Bhopal",
        originState: "Madhya Pradesh",
        destinationCity: "Jabalpur",
        destinationState: "Madhya Pradesh",
        serviceablePostalCodes: [],
        active: true,
      },
    ],
  });

  assert.equal(result.replacedCount, 2);
  assert.equal(memory.getServiceAreas().length, 2);
  assert.equal(memory.vendors.get("vendor-1")?.serviceCities, "Indore,Jabalpur");
});

test("Service offerings persist every normalized type and maintain legacy Boolean mirrors", async () => {
  const memory = createMemoryPrisma();

  await createPrismaVendorService(memory.prisma, "vendor-1", {
    serviceType: VendorServiceType.HOUSEHOLD_RELOCATION,
    title: "Household Relocation",
    active: true,
  });

  await createPrismaVendorService(memory.prisma, "vendor-1", {
    serviceType: VendorServiceType.WAREHOUSING,
    title: "Warehousing",
    active: true,
  });

  assert.equal(memory.getServices().length, 2);
  assert.equal(memory.vendors.get("vendor-1")?.householdService, true);
  assert.equal(memory.vendors.get("vendor-1")?.officeService, false);
  assert.equal(memory.vendors.get("vendor-1")?.vehicleService, false);
  assert.deepEqual(
    (await findPrismaVendorServices(memory.prisma, "vendor-1"))
      .map((service) => service.serviceType),
    [VendorServiceType.HOUSEHOLD_RELOCATION, VendorServiceType.WAREHOUSING]
  );
});

test("Replacing services updates normalized records and all legacy flags", async () => {
  const memory = createMemoryPrisma();

  const result = await replacePrismaVendorServices(memory.prisma, {
    vendorId: "vendor-1",
    services: [
      {
        serviceType: VendorServiceType.CORPORATE_RELOCATION,
        title: "Corporate Relocation",
        active: true,
      },
      {
        serviceType: VendorServiceType.VEHICLE_TRANSPORT,
        title: "Vehicle Transport",
        active: true,
      },
    ],
  });

  assert.equal(result.replacedCount, 2);
  assert.equal(memory.vendors.get("vendor-1")?.householdService, false);
  assert.equal(memory.vendors.get("vendor-1")?.officeService, true);
  assert.equal(memory.vendors.get("vendor-1")?.vehicleService, true);
});

test("Pricing persistence preserves commercial values and effective dates", async () => {
  const memory = createMemoryPrisma();

  const created = await createPrismaVendorPricing(memory.prisma, "vendor-1", {
    id: "pricing-local",
    serviceType: VendorServiceType.LOADING_UNLOADING,
    pricingType: VendorPricingType.FIXED,
    basePrice: 1500,
    labourCharge: 500,
    taxPercentage: 18,
    currency: "INR",
    active: true,
    effectiveFrom: new Date("2026-09-11T00:00:00.000Z"),
  });

  assert.equal(created.basePrice, 1500);
  assert.equal(created.labourCharge, 500);
  assert.equal(created.taxPercentage, 18);
  assert.equal(created.effectiveFrom?.toISOString(), "2026-09-11T00:00:00.000Z");
  assert.equal((await findPrismaVendorPricing(memory.prisma, "vendor-1")).length, 1);
});

test("Replacing pricing is authoritative for the vendor", async () => {
  const memory = createMemoryPrisma();

  await createPrismaVendorPricing(memory.prisma, "vendor-1", {
    serviceType: VendorServiceType.PACKING_ONLY,
    pricingType: VendorPricingType.FIXED,
    basePrice: 1000,
    currency: "INR",
    active: true,
  });

  const result = await replacePrismaVendorPricing(memory.prisma, {
    vendorId: "vendor-1",
    pricing: [
      {
        serviceType: VendorServiceType.VEHICLE_TRANSPORT,
        pricingType: VendorPricingType.PER_KILOMETRE,
        pricePerKilometre: 25,
        minimumPrice: 800,
        currency: "INR",
        active: true,
      },
    ],
  });

  assert.equal(result.replacedCount, 1);
  assert.equal(memory.getPricing().length, 1);
  assert.equal(result.pricing[0]?.pricePerKilometre, 25);
});

test("Operational Vendor filters always exclude soft-deleted records", () => {
  assert.deepEqual(createPrismaVendorWhere(), { deletedAt: null });

  const where = createPrismaVendorWhere({ active: true });
  assert.deepEqual(where, {
    AND: [
      { deletedAt: null },
      { status: "ACTIVE" },
    ],
  });
});

test("Vendor deletion is soft, idempotent, and removes the Vendor from existence checks", async () => {
  const memory = createMemoryPrisma();

  assert.equal(await prismaVendorExists(memory.prisma, "vendor-1"), true);

  const first = await deletePrismaVendorRecord(memory.prisma, "vendor-1");
  const second = await deletePrismaVendorRecord(memory.prisma, "vendor-1");

  assert.deepEqual(first, { vendorId: "vendor-1", deleted: true });
  assert.deepEqual(second, { vendorId: "vendor-1", deleted: false });
  assert.equal(await prismaVendorExists(memory.prisma, "vendor-1"), false);
  assert.equal(memory.vendors.get("vendor-1")?.status, "INACTIVE");
  assert.ok(memory.vendors.get("vendor-1")?.deletedAt instanceof Date);
});
test(
  "Vendor transaction manager provides sufficient remote-database timing limits",
  async () => {
    let receivedOptions:
      {
        maxWait?: number;
        timeout?: number;
      } | undefined;

    const prisma = {
      $transaction: async (
        operation:
          (
            transaction: unknown
          ) => Promise<string>,
        options?:
          {
            maxWait?: number;
            timeout?: number;
          }
      ) => {
        receivedOptions =
          options;

        return operation({});
      },
    };

    const transactionManager =
      new PrismaVendorRepositoryTransactionManager(
        prisma as never
      );

    const result =
      await transactionManager
        .runInTransaction(
          async ({
            repository,
          }) => {
            assert.ok(
              repository
            );

            return "completed";
          }
        );

    assert.equal(
      result,
      "completed"
    );

    assert.deepEqual(
      receivedOptions,
      {
        maxWait:
          10_000,

        timeout:
          30_000,
      }
    );
  }
);