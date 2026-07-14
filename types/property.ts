
export interface PropertyDetails {

  id?: string

  referenceId: string

  propertyType:

    | "Apartment"

    | "Independent House"

    | "Villa"

    | "Office"

    | "Warehouse"

  floorNumber: number

  liftAvailable: boolean

  parkingDistance: string

  staircaseWidth?:

    | "Narrow"

    | "Medium"

    | "Wide"

  installationServices: string[]

  additionalServices: string[]

  specialInstructions?: string

}
 
