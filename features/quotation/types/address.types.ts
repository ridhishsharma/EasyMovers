/* ============================================================
   Easy Movers Enterprise Platform

   Quotation Module

   Address Types

   File: address.types.ts

============================================================ */

/* ============================================================
   Address Type
============================================================ */

export enum AddressType {

  PICKUP = "pickup",

  DROP = "drop",

  BILLING = "billing",

  OFFICE = "office",

  WAREHOUSE = "warehouse",

}

/* ============================================================
   Property Type
============================================================ */

export enum PropertyType {

  APARTMENT = "apartment",

  INDEPENDENT_HOUSE = "independent-house",

  VILLA = "villa",

  OFFICE = "office",

  SHOP = "shop",

  WAREHOUSE = "warehouse",

  INDUSTRIAL = "industrial",

  OTHER = "other",

}

/* ============================================================
   Ownership Type
============================================================ */

export enum OwnershipType {

  OWNED = "owned",

  RENTED = "rented",

  LEASED = "leased",

}

/* ============================================================
   Lift Availability
============================================================ */

export enum LiftType {

  AVAILABLE = "available",

  NOT_AVAILABLE = "not-available",

  SERVICE_LIFT = "service-lift",

}

/* ============================================================
   Contact Person
============================================================ */

export interface AddressContact {

  id: string

  name: string

  mobile: string

  alternateMobile?: string

  email?: string

  relation?: string

}

/* ============================================================
   Geo Location
============================================================ */

export interface GeoLocation {

  latitude: number

  longitude: number

  placeId?: string

  formattedAddress?: string

}

/* ============================================================
   Floor Details
============================================================ */

export interface FloorInformation {

  floorNumber: number

  totalFloors: number

  lift: LiftType

  staircaseWidth?: number

}

/* ============================================================
   Parking Information
============================================================ */

export interface ParkingInformation {

  available: boolean

  distanceFromEntrance?: number

  truckAccessible: boolean

  remarks?: string

}

/* ============================================================
   Address
============================================================ */

export interface Address {

  id: string

  type: AddressType

  propertyType: PropertyType

  ownership: OwnershipType

  contact: AddressContact

  addressLine1: string

  addressLine2?: string

  landmark?: string

  locality: string

  city: string

  district?: string

  state: string

  country: string

  postalCode: string

  geoLocation?: GeoLocation

  floor: FloorInformation

  parking: ParkingInformation

  remarks?: string

}

/* ============================================================
   Address Validation
============================================================ */

export interface AddressValidation {

  isValid: boolean

  validatedAt?: Date

  confidenceScore?: number

  validationProvider?: string

  message?: string

}

/* ============================================================
   Address Access Information
============================================================ */

export interface AddressAccess {

  truckAccessible: boolean

  containerAccessible: boolean

  loadingDockAvailable: boolean

  securityGatePassRequired: boolean

  societyPermissionRequired: boolean

  craneRequired: boolean

  remarks?: string

}

/* ============================================================
   Route Information
============================================================ */

export interface RouteInformation {

  distanceInKm: number

  estimatedDurationInMinutes: number

  tollCharges?: number

  fuelEstimate?: number

  routePolyline?: string

}

/* ============================================================
   Google Maps Information
============================================================ */

export interface GooglePlaceDetails {

  placeId: string

  formattedAddress: string

  plusCode?: string

  timezone?: string

}

/* ============================================================
   Pickup Address
============================================================ */

export interface PickupAddress extends Address {

  preferredPickupTime?: string

  pickupInstructions?: string

  access: AddressAccess

  validation?: AddressValidation

  googlePlace?: GooglePlaceDetails

}

/* ============================================================
   Drop Address
============================================================ */

export interface DropAddress extends Address {

  preferredDeliveryTime?: string

  deliveryInstructions?: string

  access: AddressAccess

  validation?: AddressValidation

  googlePlace?: GooglePlaceDetails

}

/* ============================================================
   Address Pair
============================================================ */

export interface AddressPair {

  pickup: PickupAddress

  drop: DropAddress

  route?: RouteInformation

}

/* ============================================================
   Address Summary
============================================================ */

export interface AddressSummary {

  pickupCity: string

  dropCity: string

  distanceInKm: number

  estimatedDuration: string

  interstateMove: boolean

  internationalMove: boolean

}

/* ============================================================
   Address Search Result
============================================================ */

export interface AddressSearchResult {

  id: string

  description: string

  placeId: string

  primaryText: string

  secondaryText: string

}

/* ============================================================
   Address Search Response
============================================================ */

export interface AddressSearchResponse {

  success: boolean

  results: AddressSearchResult[]

  message?: string

}

/* ============================================================
   Saved Address
============================================================ */

export interface SavedAddress {

  id: string

  label: string

  address: Address

  isDefault: boolean

  createdAt: Date

  updatedAt: Date

}

/* ============================================================
   Recent Address
============================================================ */

export interface RecentAddress {

  id: string

  address: Address

  lastUsedAt: Date

  usageCount: number

}

/* ============================================================
   Address Book
============================================================ */

export interface AddressBook {

  saved: SavedAddress[]

  recent: RecentAddress[]

}

/* ============================================================
   Address Form State
============================================================ */

export interface AddressFormState {

  pickup: PickupAddress

  drop: DropAddress

  loading: boolean

  validating: boolean

  dirty: boolean

  valid: boolean

}

/* ============================================================
   Address API Request
============================================================ */

export interface AddressValidationRequest {

  pickup: PickupAddress

  drop: DropAddress

}

/* ============================================================
   Address API Response
============================================================ */

export interface AddressValidationResponse {

  success: boolean

  pickup: AddressValidation

  drop: AddressValidation

  route?: RouteInformation

  message?: string

}

/* ============================================================
   Address Calculation Response
============================================================ */

export interface RouteCalculationResponse {

  success: boolean

  summary: AddressSummary

  route: RouteInformation

  message?: string

}

/* ============================================================
   End of File
============================================================ */