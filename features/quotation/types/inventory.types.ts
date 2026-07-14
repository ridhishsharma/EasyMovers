/* ============================================================
   Easy Movers Enterprise Platform

   Quotation Module

   Inventory Types

   File: inventory.types.ts

============================================================ */

/* ============================================================
   Room Types
============================================================ */

export enum RoomType {

  LIVING_ROOM = "living-room",

  BEDROOM = "bedroom",

  KITCHEN = "kitchen",

  DINING_ROOM = "dining-room",

  STUDY_ROOM = "study-room",

  STORE_ROOM = "store-room",

  BALCONY = "balcony",

  TERRACE = "terrace",

  OFFICE = "office",

  GARAGE = "garage",

  OTHER = "other",

}

/* ============================================================
   Inventory Category
============================================================ */

export enum InventoryCategory {

  FURNITURE = "FURNITURE",

  ELECTRONICS = "ELECTRONICS",

  APPLIANCES = "APPLIANCES",

  KITCHENWARE = "KITCHENWARE",

  DOCUMENTS = "DOCUMENTS",

  PERSONAL = "PERSONAL",

}
/* ============================================================
   Unit
============================================================ */

export enum InventoryUnit {

  PIECE = "piece",

  SET = "set",

  BOX = "box",

  BAG = "bag",

  CARTON = "carton",

}

/* ============================================================
   Condition
============================================================ */

export enum InventoryCondition {

  NEW = "new",

  GOOD = "good",

  USED = "used",

  FRAGILE = "fragile",

  HEAVY = "heavy",

}

/* ============================================================
   Packing Type
============================================================ */

export enum PackingType {

  STANDARD = "standard",

  PREMIUM = "premium",

  WOODEN_CRATE = "wooden-crate",

  BUBBLE_WRAP = "bubble-wrap",

  CUSTOM = "custom",

}

/* ============================================================
   Inventory Item
============================================================ */

export interface InventoryItem {

  id: string

  room: RoomType

  category: InventoryCategory

  name: string

  quantity: number

  unit: InventoryUnit

  weightInKg?: number

  volumeInCft?: number

  condition: InventoryCondition

  packing: PackingType

  dismantlingRequired: boolean

  assemblyRequired: boolean

  remarks?: string

}

/* ============================================================
   Furniture Item
============================================================ */

export interface FurnitureItem extends InventoryItem {

  material?: string

  foldable?: boolean

  dimensions?: string

}

/* ============================================================
   Electronic Item
============================================================ */

export interface ElectronicItem extends InventoryItem {

  brand?: string

  model?: string

  serialNumber?: string

  warrantyAvailable?: boolean

}

/* ============================================================
   Appliance Item
============================================================ */

export interface ApplianceItem extends InventoryItem {

  powerRating?: string

  installationRequired?: boolean

}

/* ============================================================
   Vehicle Item
============================================================ */

export interface VehicleItem extends InventoryItem {

  registrationNumber?: string

  vehicleType?: string

  runningCondition?: boolean

}

/* ============================================================
   Fragile Item
============================================================ */

export interface FragileItem extends InventoryItem {

  glassProtectionRequired: boolean

  insuranceRecommended: boolean

}

/* ============================================================
   Office Equipment
============================================================ */

export interface OfficeEquipment extends InventoryItem {

  assetTag?: string

  companyOwned?: boolean

}

/* ============================================================
   Inventory Room
============================================================ */

export interface InventoryRoom {

  id: string

  roomType: RoomType

  items: InventoryItem[]

}

/* ============================================================
   Inventory Weight
============================================================ */

export interface InventoryWeight {

  totalWeight: number

  totalVolume: number

  totalItems: number

}

/* ============================================================
   Inventory Summary
============================================================ */

export interface InventorySummary {

  rooms: number

  totalItems: number

  totalWeightInKg: number

  totalVolumeInCft: number

  fragileItems: number

  heavyItems: number

  dismantlingRequired: number

  assemblyRequired: number

}

/* ============================================================
   Inventory Estimation
============================================================ */

export interface InventoryEstimation {

  recommendedTruckSize: string

  estimatedLabours: number

  estimatedPackingHours: number

  estimatedLoadingHours: number

  estimatedUnloadingHours: number

}
/* ============================================================
   Packing Material
============================================================ */

export interface PackingMaterial {

  id: string

  name: string

  quantity: number

  unit: InventoryUnit

}

/* ============================================================
   Packing Estimation
============================================================ */

export interface PackingEstimation {

  materials: PackingMaterial[]

  estimatedBoxes: number

  estimatedBubbleWrapRolls: number

  estimatedTapeRolls: number

  estimatedWoodenCrates: number

}

/* ============================================================
   Truck Recommendation
============================================================ */

export interface TruckRecommendation {

  vehicleType: string

  capacityInKg: number

  capacityInCft: number

  quantity: number

}

/* ============================================================
   Labour Requirement
============================================================ */

export interface LabourRequirement {

  packers: number

  movers: number

  supervisors: number

}

/* ============================================================
   Inventory Template
============================================================ */

export interface InventoryTemplate {

  id: string

  name: string

  description?: string

  rooms: InventoryRoom[]

}

/* ============================================================
   Saved Inventory
============================================================ */

export interface SavedInventory {

  id: string

  name: string

  rooms: InventoryRoom[]

  summary: InventorySummary

  createdAt: Date

  updatedAt: Date

}

/* ============================================================
   Inventory Form State
============================================================ */

export interface InventoryFormState {

  rooms: InventoryRoom[]

  summary: InventorySummary

  loading: boolean

  dirty: boolean

  valid: boolean

}

/* ============================================================
   Inventory Request
============================================================ */

export interface InventoryCalculationRequest {

  rooms: InventoryRoom[]

}

/* ============================================================
   Inventory Response
============================================================ */

export interface InventoryCalculationResponse {

  success: boolean

  summary: InventorySummary

  estimation: InventoryEstimation

  packing: PackingEstimation

  trucks: TruckRecommendation[]

  labour: LabourRequirement

  message?: string

}