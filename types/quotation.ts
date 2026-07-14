
export interface Quotation {

  id?: string

  referenceId: string

  baseAmount: number

  packingCharges: number

  loadingCharges: number

  unloadingCharges: number

  transportationCharges: number

  insuranceCharges: number

  gst: number

  discount: number

  grandTotal: number

  status:

    | "PENDING"

    | "APPROVED"

    | "REJECTED"

}
 
