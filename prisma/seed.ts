/**
 * ============================================================================
 * EasyMovers Development Seed
 * ============================================================================
 *
 * File:
 * prisma/seed.ts
 *
 * Purpose:
 * - Create repeatable development Leads
 * - Create Vendors across representative Indian cities and service scopes
 * - Create Vendor ratings, vehicles, and bank accounts
 *
 * Deliberately not seeded:
 * - Bookings
 * - Quotations
 * - Payments
 * - Tracking
 *
 * Those records should be created through Postman so the API workflow is
 * tested end-to-end.
 * ============================================================================
 */

import {
  BankAccountType,
  LeadSource,
  LeadStatus,
  Prisma,
  PrismaClient,
  VehicleOwnership,
  VehicleStatus,
  VehicleType,
} from "@prisma/client";

const prisma =
  new PrismaClient();

/* ============================================================================
 * Helpers
 * ============================================================================
 */

function addDays(
  days: number
): Date {
  const result =
    new Date();

  result.setDate(
    result.getDate() +
      days
  );

  result.setHours(
    10,
    0,
    0,
    0
  );

  return result;
}

function toDateOnly(
  date: Date
): string {
  return date
    .toISOString()
    .slice(
      0,
      10
    );
}

function decimal(
  value: number
): Prisma.Decimal {
  return new Prisma.Decimal(
    value
  );
}

/* ============================================================================
 * Lead seed data
 * ============================================================================
 */

const leadSeedData = [
  {
    referenceId:
      "EML-SEED-BPL-IND-001",

    name:
      "Amit Verma",

    mobile:
      "9876543210",

    email:
      "amit.verma.seed@example.com",

    source:
      LeadSource.WEBSITE,

    status:
      LeadStatus.QUALIFIED,

    shiftingType:
      "HOUSEHOLD_SHIFTING",

    pickupCity:
      "Bhopal",

    pickupState:
      "Madhya Pradesh",

    pickupPincode:
      "462011",

    pickupFloor:
      "2",

    liftAvailable:
      "AVAILABLE",

    pickupLatitude:
      decimal(
        23.2337
      ),

    pickupLongitude:
      decimal(
        77.4342
      ),

    destinationInput:
      "Vijay Nagar, Indore",

    destinationCity:
      "Indore",

    destinationState:
      "Madhya Pradesh",

    destinationPincode:
      "452010",

    destinationLatitude:
      decimal(
        22.7533
      ),

    destinationLongitude:
      decimal(
        75.8937
      ),

    shiftingDate:
      toDateOnly(
        addDays(
          14
        )
      ),

    houseType:
      "2_BHK",

    packingRequired:
      "YES",

    plantsIncluded:
      true,

    bikeCount:
      1,

    carCount:
      0,

    vehicleCount:
      1,

    vehicleType:
      "BIKE",

    notes:
      "Primary controlled test Lead for Bhopal to Indore Booking API testing.",
  },

  {
    referenceId:
      "EML-SEED-BPL-DEL-002",

    name:
      "Neha Sharma",

    mobile:
      "9876543211",

    email:
      "neha.sharma.seed@example.com",

    source:
      LeadSource.WHATSAPP,

    status:
      LeadStatus.QUALIFIED,

    shiftingType:
      "HOUSEHOLD_SHIFTING",

    pickupCity:
      "Bhopal",

    pickupState:
      "Madhya Pradesh",

    pickupPincode:
      "462016",

    pickupFloor:
      "1",

    liftAvailable:
      "NOT_REQUIRED",

    destinationInput:
      "Dwarka Sector 12, New Delhi",

    destinationCity:
      "New Delhi",

    destinationState:
      "Delhi",

    destinationPincode:
      "110078",

    shiftingDate:
      toDateOnly(
        addDays(
          21
        )
      ),

    houseType:
      "3_BHK",

    packingRequired:
      "YES",

    plantsIncluded:
      false,

    bikeCount:
      0,

    carCount:
      1,

    vehicleCount:
      1,

    vehicleType:
      "CAR",

    notes:
      "Interstate Lead for testing Pan-India Vendor eligibility.",
  },

  {
    referenceId:
      "EML-SEED-IND-PUN-003",

    name:
      "Rohit Jain",

    mobile:
      "9876543212",

    email:
      "rohit.jain.seed@example.com",

    source:
      LeadSource.CALL_CENTER,

    status:
      LeadStatus.NEW,

    shiftingType:
      "OFFICE_RELOCATION",

    pickupCity:
      "Indore",

    pickupState:
      "Madhya Pradesh",

    pickupPincode:
      "452001",

    pickupFloor:
      "3",

    liftAvailable:
      "AVAILABLE",

    destinationInput:
      "Hinjewadi Phase 1, Pune",

    destinationCity:
      "Pune",

    destinationState:
      "Maharashtra",

    destinationPincode:
      "411057",

    shiftingDate:
      toDateOnly(
        addDays(
          30
        )
      ),

    officeSize:
      "25_EMPLOYEES",

    packingRequired:
      "YES",

    plantsIncluded:
      true,

    vehicleCount:
      0,

    notes:
      "Office relocation Lead for interstate quotation testing.",
  },

  {
    referenceId:
      "EML-SEED-BPL-LOCAL-004",

    name:
      "Priya Tiwari",

    mobile:
      "9876543213",

    email:
      "priya.tiwari.seed@example.com",

    source:
      LeadSource.MOBILE_APP,

    status:
      LeadStatus.CONTACTED,

    shiftingType:
      "HOUSEHOLD_SHIFTING",

    pickupCity:
      "Bhopal",

    pickupState:
      "Madhya Pradesh",

    pickupPincode:
      "462003",

    pickupFloor:
      "0",

    liftAvailable:
      "NOT_REQUIRED",

    destinationInput:
      "Kolar Road, Bhopal",

    destinationCity:
      "Bhopal",

    destinationState:
      "Madhya Pradesh",

    destinationPincode:
      "462042",

    shiftingDate:
      toDateOnly(
        addDays(
          10
        )
      ),

    houseType:
      "1_BHK",

    packingRequired:
      "NO",

    plantsIncluded:
      false,

    vehicleCount:
      0,

    notes:
      "Within-city Lead for local move testing.",
  },

  {
    referenceId:
      "EML-SEED-MUM-BLR-005",

    name:
      "Sanjay Mehta",

    mobile:
      "9876543214",

    email:
      "sanjay.mehta.seed@example.com",

    source:
      LeadSource.CORPORATE,

    status:
      LeadStatus.QUALIFIED,

    shiftingType:
      "CORPORATE_RELOCATION",

    pickupCity:
      "Mumbai",

    pickupState:
      "Maharashtra",

    pickupPincode:
      "400076",

    pickupFloor:
      "8",

    liftAvailable:
      "AVAILABLE",

    destinationInput:
      "Whitefield, Bengaluru",

    destinationCity:
      "Bengaluru",

    destinationState:
      "Karnataka",

    destinationPincode:
      "560066",

    shiftingDate:
      toDateOnly(
        addDays(
          45
        )
      ),

    houseType:
      "3_BHK",

    packingRequired:
      "YES",

    plantsIncluded:
      true,

    bikeCount:
      1,

    carCount:
      1,

    vehicleCount:
      2,

    vehicleType:
      "BIKE_AND_CAR",

    notes:
      "Corporate interstate Lead for future corporate workflow testing.",
  },
] satisfies Prisma.LeadUncheckedCreateInput[];

/* ============================================================================
 * Vendor seed data
 * ============================================================================
 */

interface VendorSeed {
  vendor: Prisma.VendorUncheckedCreateInput;

  rating: {
    averageRating: number;
    totalReviews: number;
    completedBookings: number;
    recommendationRate: number;
  };

  vehicle: {
    registrationNumber: string;
    vehicleType: VehicleType;
    ownership: VehicleOwnership;
    status: VehicleStatus;
    carryingCapacityKg: number;
    volumeCapacityCft: number;
    currentCity: string;
  };

  bankAccount: {
    accountHolderName: string;
    bankName: string;
    branchName: string;
    accountNumber: string;
    ifscCode: string;
    accountType: BankAccountType;
    upiId: string;
  };
}

const vendorSeedData:
  VendorSeed[] = [
  {
    vendor: {
      vendorCode:
        "EMV-SEED-BPL-001",

      companyName:
        "Bhopal Safe Movers",

      ownerName:
        "Ramesh Sharma",

      ownerMobile:
        "9123456701",

      ownerEmail:
        "ramesh.bhopal.seed@example.com",

      serviceCities:
        "Bhopal, Indore, Ujjain, Jabalpur",

      householdService:
        true,

      officeService:
        true,

      vehicleService:
        true,

      experienceYears:
        12,

      rating:
        4.6,

      reviewCount:
        128,

      status:
        "ACTIVE",

      address:
        "Plot 10, MP Nagar Zone 1",

      city:
        "Bhopal",

      state:
        "Madhya Pradesh",

      pincode:
        "462011",

      coordinatorName:
        "Anil Verma",

      coordinatorMobile:
        "9123456711",

      coordinatorEmail:
        "operations.bpl.seed@example.com",

      quotationContactName:
        "Quotation Desk Bhopal",

      quotationContactMobile:
        "9123456721",

      quotationContactEmail:
        "quotes.bpl.seed@example.com",

      insuranceAvailable:
        true,

      totalLabours:
        28,

      totalVehicles:
        8,

      completedMoves:
        860,

      remarks:
        "Seed Vendor: Bhopal origin and Madhya Pradesh coverage.",
    },

    rating: {
      averageRating:
        4.6,

      totalReviews:
        128,

      completedBookings:
        860,

      recommendationRate:
        92,
    },

    vehicle: {
      registrationNumber:
        "MP04-SEED-1001",

      vehicleType:
        VehicleType
          .MEDIUM_TRUCK,

      ownership:
        VehicleOwnership.OWNED,

      status:
        VehicleStatus.AVAILABLE,

      carryingCapacityKg:
        7500,

      volumeCapacityCft:
        1300,

      currentCity:
        "Bhopal",
    },

    bankAccount: {
      accountHolderName:
        "Bhopal Safe Movers",

      bankName:
        "State Bank of India",

      branchName:
        "MP Nagar Bhopal",

      accountNumber:
        "100000000001",

      ifscCode:
        "SBIN0000001",

      accountType:
        BankAccountType.CURRENT,

      upiId:
        "bhopalsafemovers@upi",
    },
  },

  {
    vendor: {
      vendorCode:
        "EMV-SEED-IND-002",

      companyName:
        "Indore Express Packers",

      ownerName:
        "Vikas Patel",

      ownerMobile:
        "9123456702",

      ownerEmail:
        "vikas.indore.seed@example.com",

      serviceCities:
        "Indore, Bhopal, Ujjain, Dewas, Pune",

      householdService:
        true,

      officeService:
        false,

      vehicleService:
        true,

      experienceYears:
        9,

      rating:
        4.3,

      reviewCount:
        84,

      status:
        "ACTIVE",

      address:
        "Scheme 54, Vijay Nagar",

      city:
        "Indore",

      state:
        "Madhya Pradesh",

      pincode:
        "452010",

      coordinatorName:
        "Kunal Jain",

      coordinatorMobile:
        "9123456712",

      coordinatorEmail:
        "operations.ind.seed@example.com",

      quotationContactName:
        "Quotation Desk Indore",

      quotationContactMobile:
        "9123456722",

      quotationContactEmail:
        "quotes.ind.seed@example.com",

      insuranceAvailable:
        true,

      totalLabours:
        20,

      totalVehicles:
        6,

      completedMoves:
        540,

      remarks:
        "Seed Vendor: Indore base with Madhya Pradesh and Pune coverage.",
    },

    rating: {
      averageRating:
        4.3,

      totalReviews:
        84,

      completedBookings:
        540,

      recommendationRate:
        87,
    },

    vehicle: {
      registrationNumber:
        "MP09-SEED-2002",

      vehicleType:
        VehicleType
          .LIGHT_TRUCK,

      ownership:
        VehicleOwnership.OWNED,

      status:
        VehicleStatus.AVAILABLE,

      carryingCapacityKg:
        4500,

      volumeCapacityCft:
        900,

      currentCity:
        "Indore",
    },

    bankAccount: {
      accountHolderName:
        "Indore Express Packers",

      bankName:
        "HDFC Bank",

      branchName:
        "Vijay Nagar Indore",

      accountNumber:
        "100000000002",

      ifscCode:
        "HDFC0000002",

      accountType:
        BankAccountType.CURRENT,

      upiId:
        "indoreexpress@upi",
    },
  },

  {
    vendor: {
      vendorCode:
        "EMV-SEED-DEL-003",

      companyName:
        "National Move Logistics",

      ownerName:
        "Arvind Khanna",

      ownerMobile:
        "9123456703",

      ownerEmail:
        "arvind.delhi.seed@example.com",

      serviceCities:
        "PAN_INDIA",

      householdService:
        true,

      officeService:
        true,

      vehicleService:
        true,

      experienceYears:
        18,

      rating:
        4.7,

      reviewCount:
        342,

      status:
        "ACTIVE",

      address:
        "Transport Nagar, Punjabi Bagh",

      city:
        "New Delhi",

      state:
        "Delhi",

      pincode:
        "110035",

      coordinatorName:
        "Deepak Sethi",

      coordinatorMobile:
        "9123456713",

      coordinatorEmail:
        "operations.del.seed@example.com",

      quotationContactName:
        "National Quotation Desk",

      quotationContactMobile:
        "9123456723",

      quotationContactEmail:
        "quotes.del.seed@example.com",

      insuranceAvailable:
        true,

      totalLabours:
        75,

      totalVehicles:
        32,

      completedMoves:
        3250,

      remarks:
        "Seed Vendor: Pan-India fallback and interstate coverage.",
    },

    rating: {
      averageRating:
        4.7,

      totalReviews:
        342,

      completedBookings:
        3250,

      recommendationRate:
        95,
    },

    vehicle: {
      registrationNumber:
        "DL01-SEED-3003",

      vehicleType:
        VehicleType.CONTAINER,

      ownership:
        VehicleOwnership.OWNED,

      status:
        VehicleStatus.AVAILABLE,

      carryingCapacityKg:
        16000,

      volumeCapacityCft:
        2400,

      currentCity:
        "New Delhi",
    },

    bankAccount: {
      accountHolderName:
        "National Move Logistics",

      bankName:
        "ICICI Bank",

      branchName:
        "Punjabi Bagh Delhi",

      accountNumber:
        "100000000003",

      ifscCode:
        "ICIC0000003",

      accountType:
        BankAccountType.CURRENT,

      upiId:
        "nationalmovelogistics@upi",
    },
  },

  {
    vendor: {
      vendorCode:
        "EMV-SEED-MUM-004",

      companyName:
        "Mumbai Metro Relocations",

      ownerName:
        "Nitin Desai",

      ownerMobile:
        "9123456704",

      ownerEmail:
        "nitin.mumbai.seed@example.com",

      serviceCities:
        "Mumbai, Navi Mumbai, Thane, Pune, Bengaluru",

      householdService:
        true,

      officeService:
        true,

      vehicleService:
        true,

      experienceYears:
        14,

      rating:
        4.5,

      reviewCount:
        211,

      status:
        "ACTIVE",

      address:
        "Saki Vihar Road, Andheri East",

      city:
        "Mumbai",

      state:
        "Maharashtra",

      pincode:
        "400072",

      coordinatorName:
        "Sameer Sawant",

      coordinatorMobile:
        "9123456714",

      coordinatorEmail:
        "operations.mum.seed@example.com",

      quotationContactName:
        "Quotation Desk Mumbai",

      quotationContactMobile:
        "9123456724",

      quotationContactEmail:
        "quotes.mum.seed@example.com",

      insuranceAvailable:
        true,

      totalLabours:
        48,

      totalVehicles:
        18,

      completedMoves:
        1740,

      remarks:
        "Seed Vendor: Mumbai, Pune, and Bengaluru corridor.",
    },

    rating: {
      averageRating:
        4.5,

      totalReviews:
        211,

      completedBookings:
        1740,

      recommendationRate:
        91,
    },

    vehicle: {
      registrationNumber:
        "MH02-SEED-4004",

      vehicleType:
        VehicleType.HEAVY_TRUCK,

      ownership:
        VehicleOwnership.LEASED,

      status:
        VehicleStatus.AVAILABLE,

      carryingCapacityKg:
        12000,

      volumeCapacityCft:
        2000,

      currentCity:
        "Mumbai",
    },

    bankAccount: {
      accountHolderName:
        "Mumbai Metro Relocations",

      bankName:
        "Axis Bank",

      branchName:
        "Andheri East Mumbai",

      accountNumber:
        "100000000004",

      ifscCode:
        "UTIB0000004",

      accountType:
        BankAccountType.CURRENT,

      upiId:
        "mumbaimetrorelocations@upi",
    },
  },

  {
    vendor: {
      vendorCode:
        "EMV-SEED-BLR-005",

      companyName:
        "Bengaluru Smart Movers",

      ownerName:
        "Karthik Rao",

      ownerMobile:
        "9123456705",

      ownerEmail:
        "karthik.blr.seed@example.com",

      serviceCities:
        "Bengaluru, Mysuru, Hyderabad, Chennai, Mumbai",

      householdService:
        true,

      officeService:
        true,

      vehicleService:
        false,

      experienceYears:
        11,

      rating:
        4.4,

      reviewCount:
        167,

      status:
        "ACTIVE",

      address:
        "Whitefield Main Road",

      city:
        "Bengaluru",

      state:
        "Karnataka",

      pincode:
        "560066",

      coordinatorName:
        "Ravi Kumar",

      coordinatorMobile:
        "9123456715",

      coordinatorEmail:
        "operations.blr.seed@example.com",

      quotationContactName:
        "Quotation Desk Bengaluru",

      quotationContactMobile:
        "9123456725",

      quotationContactEmail:
        "quotes.blr.seed@example.com",

      insuranceAvailable:
        true,

      totalLabours:
        36,

      totalVehicles:
        12,

      completedMoves:
        1180,

      remarks:
        "Seed Vendor: Bengaluru and South India relocation coverage.",
    },

    rating: {
      averageRating:
        4.4,

      totalReviews:
        167,

      completedBookings:
        1180,

      recommendationRate:
        89,
    },

    vehicle: {
      registrationNumber:
        "KA01-SEED-5005",

      vehicleType:
        VehicleType
          .MEDIUM_TRUCK,

      ownership:
        VehicleOwnership.HIRED,

      status:
        VehicleStatus.AVAILABLE,

      carryingCapacityKg:
        7000,

      volumeCapacityCft:
        1250,

      currentCity:
        "Bengaluru",
    },

    bankAccount: {
      accountHolderName:
        "Bengaluru Smart Movers",

      bankName:
        "Kotak Mahindra Bank",

      branchName:
        "Whitefield Bengaluru",

      accountNumber:
        "100000000005",

      ifscCode:
        "KKBK0000005",

      accountType:
        BankAccountType.CURRENT,

      upiId:
        "bengalurusmartmovers@upi",
    },
  },

  {
    vendor: {
      vendorCode:
        "EMV-SEED-JBP-006",

      companyName:
        "Jabalpur Reliable Packers",

      ownerName:
        "Manish Gupta",

      ownerMobile:
        "9123456706",

      ownerEmail:
        "manish.jabalpur.seed@example.com",

      serviceCities:
        "Jabalpur, Bhopal, Katni, Satna, Rewa",

      householdService:
        true,

      officeService:
        false,

      vehicleService:
        true,

      experienceYears:
        7,

      rating:
        4.1,

      reviewCount:
        56,

      status:
        "ACTIVE",

      address:
        "Vijay Nagar, Jabalpur",

      city:
        "Jabalpur",

      state:
        "Madhya Pradesh",

      pincode:
        "482002",

      coordinatorName:
        "Rahul Mishra",

      coordinatorMobile:
        "9123456716",

      coordinatorEmail:
        "operations.jbp.seed@example.com",

      quotationContactName:
        "Quotation Desk Jabalpur",

      quotationContactMobile:
        "9123456726",

      quotationContactEmail:
        "quotes.jbp.seed@example.com",

      insuranceAvailable:
        false,

      totalLabours:
        15,

      totalVehicles:
        4,

      completedMoves:
        315,

      remarks:
        "Seed Vendor: Eastern Madhya Pradesh coverage.",
    },

    rating: {
      averageRating:
        4.1,

      totalReviews:
        56,

      completedBookings:
        315,

      recommendationRate:
        82,
    },

    vehicle: {
      registrationNumber:
        "MP20-SEED-6006",

      vehicleType:
        VehicleType.MINI_TRUCK,

      ownership:
        VehicleOwnership.OWNED,

      status:
        VehicleStatus.AVAILABLE,

      carryingCapacityKg:
        2800,

      volumeCapacityCft:
        600,

      currentCity:
        "Jabalpur",
    },

    bankAccount: {
      accountHolderName:
        "Jabalpur Reliable Packers",

      bankName:
        "Bank of Baroda",

      branchName:
        "Vijay Nagar Jabalpur",

      accountNumber:
        "100000000006",

      ifscCode:
        "BARB0000006",

      accountType:
        BankAccountType.CURRENT,

      upiId:
        "jabalpurreliable@upi",
    },
  },
];

/* ============================================================================
 * Seed operations
 * ============================================================================
 */

async function seedLeads():
  Promise<void> {
  console.log(
    "Seeding Leads..."
  );

  for (
    const lead of
    leadSeedData
  ) {
    await prisma.lead.upsert({
      where: {
        referenceId:
          lead.referenceId,
      },

      update: {
        ...lead,
      },

      create: {
        ...lead,
      },
    });
  }

  console.log(
    `Seeded ${leadSeedData.length} Leads.`
  );
}

async function seedVendors():
  Promise<void> {
  console.log(
    "Seeding Vendors..."
  );

  for (
    const item of
    vendorSeedData
  ) {
    const vendor =
      await prisma.vendor.upsert({
        where: {
          vendorCode:
            item.vendor
              .vendorCode,
        },

        update: {
          ...item.vendor,
        },

        create: {
          ...item.vendor,
        },
      });

    await prisma.vendorRating.upsert({
      where: {
        vendorId:
          vendor.id,
      },

      update: {
        averageRating:
          decimal(
            item.rating
              .averageRating
          ),

        totalReviews:
          item.rating
            .totalReviews,

        completedBookings:
          item.rating
            .completedBookings,

        recommendationRate:
          decimal(
            item.rating
              .recommendationRate
          ),

        lastReviewedAt:
          new Date(),
      },

      create: {
        vendorId:
          vendor.id,

        averageRating:
          decimal(
            item.rating
              .averageRating
          ),

        totalReviews:
          item.rating
            .totalReviews,

        completedBookings:
          item.rating
            .completedBookings,

        recommendationRate:
          decimal(
            item.rating
              .recommendationRate
          ),

        lastReviewedAt:
          new Date(),
      },
    });

    await prisma.vendorVehicle.upsert({
      where: {
        registrationNumber:
          item.vehicle
            .registrationNumber,
      },

      update: {
        vendorId:
          vendor.id,

        vehicleType:
          item.vehicle
            .vehicleType,

        ownership:
          item.vehicle
            .ownership,

        status:
          item.vehicle.status,

        carryingCapacityKg:
          item.vehicle
            .carryingCapacityKg,

        volumeCapacityCft:
          item.vehicle
            .volumeCapacityCft,

        currentCity:
          item.vehicle
            .currentCity,

        gpsInstalled:
          true,

        isActive:
          true,
      },

      create: {
        vendorId:
          vendor.id,

        registrationNumber:
          item.vehicle
            .registrationNumber,

        vehicleType:
          item.vehicle
            .vehicleType,

        ownership:
          item.vehicle
            .ownership,

        status:
          item.vehicle.status,

        carryingCapacityKg:
          item.vehicle
            .carryingCapacityKg,

        volumeCapacityCft:
          item.vehicle
            .volumeCapacityCft,

        currentCity:
          item.vehicle
            .currentCity,

        gpsInstalled:
          true,

        isActive:
          true,
      },
    });

    /**
     * VendorBankAccount has no unique business key in the current schema.
     * Delete only development seed accounts for this Vendor, then recreate
     * one deterministic primary account.
     */
    await prisma.vendorBankAccount.deleteMany({
      where: {
        vendorId:
          vendor.id,

        remarks:
          "EASYMOVERS_DEVELOPMENT_SEED",
      },
    });

    await prisma.vendorBankAccount.create({
      data: {
        vendorId:
          vendor.id,

        accountHolderName:
          item.bankAccount
            .accountHolderName,

        bankName:
          item.bankAccount
            .bankName,

        branchName:
          item.bankAccount
            .branchName,

        accountNumber:
          item.bankAccount
            .accountNumber,

        ifscCode:
          item.bankAccount
            .ifscCode,

        upiId:
          item.bankAccount
            .upiId,

        accountType:
          item.bankAccount
            .accountType,

        verified:
          true,

        verifiedBy:
          "DEVELOPMENT_SEED",

        verifiedAt:
          new Date(),

        isPrimary:
          true,

        isActive:
          true,

        remarks:
          "EASYMOVERS_DEVELOPMENT_SEED",
      },
    });
  }

  console.log(
    `Seeded ${vendorSeedData.length} Vendors with ratings, vehicles, and bank accounts.`
  );
}

/* ============================================================================
 * Entry point
 * ============================================================================
 */

async function main():
  Promise<void> {
  console.log(
    "Starting EasyMovers development seed..."
  );

  await seedLeads();

  await seedVendors();

  const [
    leadCount,
    vendorCount,
    vehicleCount,
    bankAccountCount,
  ] =
    await Promise.all([
      prisma.lead.count(),
      prisma.vendor.count(),
      prisma.vendorVehicle.count(),
      prisma.vendorBankAccount.count(),
    ]);

  console.log(
    "EasyMovers development seed completed successfully."
  );

  console.table({
    leads:
      leadCount,

    vendors:
      vendorCount,

    vendorVehicles:
      vehicleCount,

    vendorBankAccounts:
      bankAccountCount,
  });
}

main()
  .catch(
    (error: unknown) => {
      console.error(
        "EasyMovers development seed failed."
      );

      console.error(
        error
      );

      process.exitCode =
        1;
    }
  )
  .finally(
    async () => {
      await prisma.$disconnect();
    }
  );
