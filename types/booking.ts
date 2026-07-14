
export interface Booking {

  id?: string

  referenceId: string

  bookingDate: Date

  movingDate: Date

  vehicleAssigned?: string

  driverAssigned?: string

  vendorId?: string

  bookingStatus:

    | "CONFIRMED"

    | "IN_PROGRESS"

    | "COMPLETED"

    | "CANCELLED"

}
 
