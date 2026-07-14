/* ============================================================
   Easy Movers Enterprise Platform

   Quotation Module

   Address Mock Data

   File: address.mock.ts

============================================================ */

import {

  AddressType,

  LiftType,

  OwnershipType,

  PropertyType,

  type PickupAddress,

  type DropAddress,

} from "../types/address.types"

/* ============================================================
   Mock Pickup Address
============================================================ */

export const MOCK_PICKUP_ADDRESS: PickupAddress = {

  id: "pickup-001",

  type: AddressType.PICKUP,

  propertyType: PropertyType.APARTMENT,

  ownership: OwnershipType.OWNED,

  contact: {

    id: "contact-001",

    name: "Rahul Sharma",

    mobile: "9876543210",

    email: "rahul@example.com",

  },

  addressLine1: "Flat A-120, Tulsi Residency",

  addressLine2: "Near Metro Station",

  locality: "Indirapuram",

  city: "Ghaziabad",

  state: "Uttar Pradesh",

  country: "India",

  postalCode: "201014",

  floor: {

    floorNumber: 5,

    totalFloors: 12,

    lift: LiftType.AVAILABLE,

  },

  parking: {

    available: true,

    truckAccessible: true,

  },

  access: {

    truckAccessible: true,

    containerAccessible: false,

    loadingDockAvailable: false,

    securityGatePassRequired: true,

    societyPermissionRequired: true,

    craneRequired: false,

  },

}

/* ============================================================
   Mock Drop Address
============================================================ */

export const MOCK_DROP_ADDRESS: DropAddress = {

  id: "drop-001",

  type: AddressType.DROP,

  propertyType: PropertyType.INDEPENDENT_HOUSE,

  ownership: OwnershipType.OWNED,

  contact: {

    id: "contact-002",

    name: "Rahul Sharma",

    mobile: "9876543210",

    email: "rahul@example.com",

  },

  addressLine1: "45 Green Park",

  addressLine2: "Road No. 3",

  locality: "Banjara Hills",

  city: "Hyderabad",

  state: "Telangana",

  country: "India",

  postalCode: "500034",

  floor: {

    floorNumber: 0,

    totalFloors: 2,

    lift: LiftType.NOT_AVAILABLE,

  },

  parking: {

    available: true,

    truckAccessible: true,

  },

  access: {

    truckAccessible: true,

    containerAccessible: true,

    loadingDockAvailable: false,

    securityGatePassRequired: false,

    societyPermissionRequired: false,

    craneRequired: false,

  },

}
/* ============================================================
   Mock Local Pickup Address
============================================================ */

export const MOCK_LOCAL_PICKUP: PickupAddress = {

  ...MOCK_PICKUP_ADDRESS,

  id: "pickup-002",

  addressLine1: "B-45 Silver Heights",

  locality: "Vijay Nagar",

  city: "Indore",

  state: "Madhya Pradesh",

  postalCode: "452010",

}

/* ============================================================
   Mock Local Drop Address
============================================================ */

export const MOCK_LOCAL_DROP: DropAddress = {

  ...MOCK_DROP_ADDRESS,

  id: "drop-002",

  addressLine1: "C-120 Apollo DB City",

  locality: "Nipania",

  city: "Indore",

  state: "Madhya Pradesh",

  postalCode: "452016",

}

/* ============================================================
   Office Pickup
============================================================ */

export const MOCK_OFFICE_PICKUP: PickupAddress = {

  ...MOCK_PICKUP_ADDRESS,

  id: "pickup-office-001",

  propertyType: PropertyType.OFFICE,

  addressLine1: "Tech Park Tower 2",

  locality: "Cyber City",

  city: "Gurugram",

  state: "Haryana",

  postalCode: "122002",

}

/* ============================================================
   Office Drop
============================================================ */

export const MOCK_OFFICE_DROP: DropAddress = {

  ...MOCK_DROP_ADDRESS,

  id: "drop-office-001",

  propertyType: PropertyType.OFFICE,

  addressLine1: "Business Bay",

  locality: "Whitefield",

  city: "Bengaluru",

  state: "Karnataka",

  postalCode: "560066",

}

/* ============================================================
   Collections
============================================================ */

export const MOCK_PICKUP_ADDRESSES: PickupAddress[] = [

  MOCK_PICKUP_ADDRESS,

  MOCK_LOCAL_PICKUP,

  MOCK_OFFICE_PICKUP,

]

export const MOCK_DROP_ADDRESSES: DropAddress[] = [

  MOCK_DROP_ADDRESS,

  MOCK_LOCAL_DROP,

  MOCK_OFFICE_DROP,

]

export const MOCK_ADDRESS_PAIRS = [

  {

    id: "pair-001",

    pickup: MOCK_PICKUP_ADDRESS,

    drop: MOCK_DROP_ADDRESS,

  },

  {

    id: "pair-002",

    pickup: MOCK_LOCAL_PICKUP,

    drop: MOCK_LOCAL_DROP,

  },

  {

    id: "pair-003",

    pickup: MOCK_OFFICE_PICKUP,

    drop: MOCK_OFFICE_DROP,

  },

]

/* ============================================================
   End of File
============================================================ */