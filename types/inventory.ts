
export interface InventoryItem {

  id?: string

  category: string

  itemName: string

  quantity: number

  remarks?: string

}

export interface Inventory {

  id?: string

  referenceId: string

  status:

    | "DRAFT"

    | "SUBMITTED"

    | "APPROVED"

  packingType?:

    | "STANDARD"

    | "PREMIUM"

    | "SELF"

  completionPercentage: number

  moveReadinessScore: number

  additionalServices: string[]

  specialHandling: string[]

  items: InventoryItem[]

}
 
