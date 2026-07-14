
export interface Lead {

  id: string

  referenceId: string

  customerName: string

  mobileNumber: string

  alternateMobile?: string

  email?: string

  moveType:

    | "Household"

    | "Office"

    | "Commercial"

    | "Vehicle"

  pickupAddress: string

  pickupCity: string

  pickupState: string

  destinationAddress: string

  destinationCity: string

  destinationState: string

  movingDate: Date | string

  enquirySource?:

    | "Website"

    | "WhatsApp"

    | "Phone"

    | "Google"

    | "Facebook"

    | "Instagram"

    | "Referral"

  status:

    | "DRAFT"

    | "SUBMITTED"

    | "QUOTED"

    | "BOOKED"

    | "COMPLETED"

    | "CANCELLED"

  createdAt: Date

  updatedAt: Date

}
 
