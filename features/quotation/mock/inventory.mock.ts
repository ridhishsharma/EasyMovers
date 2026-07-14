/* ============================================================
   Easy Movers Enterprise Platform

   Quotation Module

   Inventory Mock Data

   File: inventory.mock.ts

============================================================ */
import type {
  InventoryRoom,
  InventoryItem,
  InventorySummary,
} from "../types/inventory.types"

import {

  InventoryCategory,

  InventoryCondition,

  InventoryUnit,

  PackingType,

  RoomType,


} from "../types/inventory.types"

/* ============================================================
   Living Room
============================================================ */

export const MOCK_LIVING_ROOM: InventoryRoom = {

  id: "room-living",

  roomType: RoomType.LIVING_ROOM,

  items: [

    {

      id: "living-001",

      room: RoomType.LIVING_ROOM,

      category: InventoryCategory.FURNITURE,

      name: "3 Seater Sofa",

      quantity: 1,

      unit: InventoryUnit.PIECE,

      weightInKg: 65,

      volumeInCft: 40,

      condition: InventoryCondition.GOOD,

      packing: PackingType.PREMIUM,

      dismantlingRequired: false,

      assemblyRequired: false,

    },

    {

      id: "living-002",

      room: RoomType.LIVING_ROOM,

      category: InventoryCategory.ELECTRONICS,

      name: "55 Inch Smart TV",

      quantity: 1,

      unit: InventoryUnit.PIECE,

      weightInKg: 18,

      volumeInCft: 10,

      condition: InventoryCondition.FRAGILE,

      packing: PackingType.BUBBLE_WRAP,

      dismantlingRequired: false,

      assemblyRequired: true,

    },

    {

      id: "living-003",

      room: RoomType.LIVING_ROOM,

      category: InventoryCategory.FURNITURE,

      name: "Center Table",

      quantity: 1,

      unit: InventoryUnit.PIECE,

      weightInKg: 15,

      volumeInCft: 8,

      condition: InventoryCondition.GOOD,

      packing: PackingType.STANDARD,

      dismantlingRequired: false,

      assemblyRequired: false,

    },

  ],

}

/* ============================================================
   Bedroom
============================================================ */

export const MOCK_BEDROOM: InventoryRoom = {

  id: "room-bedroom",

  roomType: RoomType.BEDROOM,

  items: [

    {

      id: "bed-001",

      room: RoomType.BEDROOM,

      category: InventoryCategory.FURNITURE,

      name: "Queen Size Bed",

      quantity: 1,

      unit: InventoryUnit.SET,

      weightInKg: 95,

      volumeInCft: 55,

      condition: InventoryCondition.GOOD,

      packing: PackingType.STANDARD,

      dismantlingRequired: true,

      assemblyRequired: true,

    },

    {

      id: "bed-002",

      room: RoomType.BEDROOM,

      category: InventoryCategory.FURNITURE,

      name: "Wardrobe",

      quantity: 1,

      unit: InventoryUnit.PIECE,

      weightInKg: 75,

      volumeInCft: 48,

      condition: InventoryCondition.GOOD,

      packing: PackingType.STANDARD,

      dismantlingRequired: true,

      assemblyRequired: true,

    },

  ],

}

/* ============================================================
   Kitchen
============================================================ */

export const MOCK_KITCHEN: InventoryRoom = {

  id: "room-kitchen",

  roomType: RoomType.KITCHEN,

  items: [

    {

      id: "kitchen-001",

      room: RoomType.KITCHEN,

      category: InventoryCategory.APPLIANCES,

      name: "Double Door Refrigerator",

      quantity: 1,

      unit: InventoryUnit.PIECE,

      weightInKg: 72,

      volumeInCft: 36,

      condition: InventoryCondition.GOOD,

      packing: PackingType.PREMIUM,

      dismantlingRequired: false,

      assemblyRequired: false,

    },

    {

      id: "kitchen-002",

      room: RoomType.KITCHEN,

      category: InventoryCategory.APPLIANCES,

      name: "Microwave Oven",

      quantity: 1,

      unit: InventoryUnit.PIECE,

      weightInKg: 14,

      volumeInCft: 5,

      condition: InventoryCondition.GOOD,

      packing: PackingType.BUBBLE_WRAP,

      dismantlingRequired: false,

      assemblyRequired: false,

    },

    {

      id: "kitchen-003",

      room: RoomType.KITCHEN,

      category: InventoryCategory.KITCHENWARE,

      name: "Kitchen Utensil Boxes",

      quantity: 8,

      unit: InventoryUnit.BOX,

      weightInKg: 8,

      volumeInCft: 4,

      condition: InventoryCondition.GOOD,

      packing: PackingType.STANDARD,

      dismantlingRequired: false,

      assemblyRequired: false,

    },

  ],

}

/* ============================================================
   Dining Room
============================================================ */

export const MOCK_DINING_ROOM: InventoryRoom = {

  id: "room-dining",

  roomType: RoomType.DINING_ROOM,

  items: [

    {

      id: "dining-001",

      room: RoomType.DINING_ROOM,

      category: InventoryCategory.FURNITURE,

      name: "6 Seater Dining Table",

      quantity: 1,

      unit: InventoryUnit.SET,

      weightInKg: 55,

      volumeInCft: 28,

      condition: InventoryCondition.GOOD,

      packing: PackingType.STANDARD,

      dismantlingRequired: true,

      assemblyRequired: true,

    },

  ],

}

/* ============================================================
   Office Room
============================================================ */

export const MOCK_OFFICE_ROOM: InventoryRoom = {

  id: "room-office",

  roomType: RoomType.OFFICE,

  items: [

    {

      id: "office-001",

      room: RoomType.OFFICE,

      category: InventoryCategory.FURNITURE,

      name: "Office Desk",

      quantity: 2,

      unit: InventoryUnit.PIECE,

      weightInKg: 30,

      volumeInCft: 18,

      condition: InventoryCondition.GOOD,

      packing: PackingType.STANDARD,

      dismantlingRequired: true,

      assemblyRequired: true,

    },

    {

      id: "office-002",

      room: RoomType.OFFICE,

      category: InventoryCategory.ELECTRONICS,

      name: "Desktop Computer",

      quantity: 2,

      unit: InventoryUnit.PIECE,

      weightInKg: 12,

      volumeInCft: 4,

      condition: InventoryCondition.FRAGILE,

      packing: PackingType.BUBBLE_WRAP,

      dismantlingRequired: false,

      assemblyRequired: true,

    },

  ],

}
/* ============================================================
   1 BHK Inventory
============================================================ */

export const MOCK_1BHK_INVENTORY: InventoryRoom[] = [

  MOCK_LIVING_ROOM,

  MOCK_BEDROOM,

  MOCK_KITCHEN,

]

/* ============================================================
   2 BHK Inventory
============================================================ */

export const MOCK_2BHK_INVENTORY: InventoryRoom[] = [

  MOCK_LIVING_ROOM,

  MOCK_BEDROOM,

  {

    ...MOCK_BEDROOM,

    id: "room-bedroom-2",

  },

  MOCK_KITCHEN,

  MOCK_DINING_ROOM,

]

/* ============================================================
   3 BHK Inventory
============================================================ */

export const MOCK_3BHK_INVENTORY: InventoryRoom[] = [

  MOCK_LIVING_ROOM,

  MOCK_BEDROOM,

  {

    ...MOCK_BEDROOM,

    id: "room-bedroom-2",

  },

  {

    ...MOCK_BEDROOM,

    id: "room-bedroom-3",

  },

  MOCK_KITCHEN,

  MOCK_DINING_ROOM,

  MOCK_OFFICE_ROOM,

]

/* ============================================================
   Office Inventory
============================================================ */

export const MOCK_OFFICE_INVENTORY: InventoryRoom[] = [

  MOCK_OFFICE_ROOM,

]

/* ============================================================
   Master Inventory Rooms
============================================================ */

export const MOCK_INVENTORY_ROOMS: InventoryRoom[] = [

  MOCK_LIVING_ROOM,

  MOCK_BEDROOM,

  MOCK_KITCHEN,

  MOCK_DINING_ROOM,

  MOCK_OFFICE_ROOM,

]

/* ============================================================
   Inventory Summary
============================================================ */
export const MOCK_INVENTORY_SUMMARY: InventorySummary = {

  rooms: MOCK_INVENTORY_ROOMS.length,

  totalItems: MOCK_INVENTORY_ROOMS.reduce(
    (total, room) => total + room.items.length,
    0,
  ),

  totalWeightInKg: 1280,

  totalVolumeInCft: 245,

  fragileItems: 12,

  heavyItems: 18,

  dismantlingRequired: 4,

  assemblyRequired: 4,

}