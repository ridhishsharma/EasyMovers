import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
try {
const body = await req.json()


console.log("VENDOR RECEIVED =", body)

// Duplicate Mobile Check
const existingVendor = await prisma.vendor.findFirst({
  where: {
    ownerMobile: body.ownerMobile,
  },
})

if (existingVendor) {
  return NextResponse.json({
    success: false,
    message: "Vendor already registered with this mobile number",
  })
}

const vendor = await prisma.vendor.create({
  data: {
    vendorCode: body.vendorCode,

    // Company Information
    companyName: body.companyName,
    companyLogo: body.companyLogo || null,

    gstNumber: body.gstNumber || null,
    panNumber: body.panNumber || null,

    website: body.website || null,

    address: body.address || null,

    city: body.city || null,
    state: body.state || null,
    pincode: body.pincode || null,

    // Owner Information
    ownerName: body.ownerName,
    ownerMobile: body.ownerMobile,
    ownerEmail: body.ownerEmail || null,

    // Quotation Contact
    quotationContactName:
      body.quotationContactName || null,

    quotationContactMobile:
      body.quotationContactMobile || null,

    quotationContactEmail:
      body.quotationContactEmail || null,

    // Operations Coordinator
    coordinatorName:
      body.coordinatorName || null,

    coordinatorMobile:
      body.coordinatorMobile || null,

    coordinatorEmail:
      body.coordinatorEmail || null,

    // Business Information
    experienceYears:
      body.experienceYears
        ? Number(body.experienceYears)
        : null,

    totalVehicles:
      body.totalVehicles
        ? Number(body.totalVehicles)
        : null,

    totalLabours:
      body.totalLabours
        ? Number(body.totalLabours)
        : null,

    serviceCities:
      body.serviceCities || "",

    // Services
    householdService:
      body.householdService || false,

    officeService:
      body.officeService || false,

    vehicleService:
      body.vehicleService || false,

    // Compliance
    insuranceAvailable:
      body.insuranceAvailable || false,

    // Remarks
    remarks:
      body.remarks || null,

    status: "PENDING",
  },
})

return NextResponse.json({
  success: true,
  vendor,
})


} catch (error) {
console.error(error)


return NextResponse.json(
  {
    success: false,
    message: "Unable to save vendor",
  },
  { status: 500 }
)

}
}
