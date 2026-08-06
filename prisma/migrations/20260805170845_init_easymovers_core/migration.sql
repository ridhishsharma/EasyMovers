/*
  Warnings:

  - You are about to drop the column `propertyType` on the `Lead` table. All the data in the column will be lost.
  - The `status` column on the `Lead` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `lastUpdatedAt` to the `Lead` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'INVENTORY_PENDING', 'QUOTATION_REQUESTED', 'QUOTATION_RECEIVED', 'BOOKING_CREATED', 'CONVERTED', 'LOST', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."LeadSource" AS ENUM ('WEBSITE', 'MOBILE_APP', 'WHATSAPP', 'CALL_CENTER', 'CORPORATE', 'REFERRAL', 'FRANCHISE', 'ADMIN', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."QuotationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVISED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('CUSTOMER', 'VENDOR', 'CORPORATE', 'FRANCHISE', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'BOOKING', 'QUOTATION', 'PAYMENT', 'PROMOTION', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH');

-- CreateEnum
CREATE TYPE "public"."VendorDocumentType" AS ENUM ('GST', 'PAN', 'AADHAAR', 'DRIVING_LICENSE', 'VEHICLE_RC', 'VEHICLE_INSURANCE', 'GOODS_CARRIER_PERMIT', 'TRADE_LICENSE', 'COMPANY_REGISTRATION', 'MSME_CERTIFICATE', 'ISO_CERTIFICATE', 'BANK_CANCELLED_CHEQUE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "public"."RecommendationType" AS ENUM ('YES', 'NO');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('CASH', 'UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'NEFT', 'RTGS', 'IMPS', 'CHEQUE', 'WALLET', 'RAZORPAY');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'INITIATED', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIAL_REFUND');

-- CreateEnum
CREATE TYPE "public"."PaymentType" AS ENUM ('ADVANCE', 'PARTIAL', 'FINAL', 'REFUND');

-- CreateEnum
CREATE TYPE "public"."InvoiceType" AS ENUM ('PROFORMA', 'TAX', 'ADVANCE', 'FINAL', 'CREDIT_NOTE', 'DEBIT_NOTE');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('DRAFT', 'GENERATED', 'SENT', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."TrackingStatus" AS ENUM ('BOOKING_CONFIRMED', 'VENDOR_ASSIGNED', 'SURVEY_SCHEDULED', 'SURVEY_COMPLETED', 'PACKING_STARTED', 'PACKING_COMPLETED', 'LOADED', 'IN_TRANSIT', 'ARRIVED_AT_DESTINATION', 'UNLOADING_STARTED', 'UNLOADING_COMPLETED', 'DELIVERY_COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."OTPPurpose" AS ENUM ('LOGIN', 'REGISTER', 'MOBILE_VERIFICATION', 'EMAIL_VERIFICATION', 'PASSWORD_RESET', 'BOOKING_CONFIRMATION', 'PAYMENT_VERIFICATION');

-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'ASSIGN', 'PAYMENT', 'DOWNLOAD', 'EXPORT', 'IMPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."AuditEntity" AS ENUM ('USER', 'CUSTOMER', 'VENDOR', 'CORPORATE', 'FRANCHISE', 'QUOTATION', 'BOOKING', 'PAYMENT', 'INVOICE', 'INVENTORY', 'DOCUMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."VehicleType" AS ENUM ('PICKUP', 'TATA_ACE', 'BOLERO_PICKUP', 'MINI_TRUCK', 'LIGHT_TRUCK', 'MEDIUM_TRUCK', 'HEAVY_TRUCK', 'CONTAINER', 'TRAILER', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."VehicleOwnership" AS ENUM ('OWNED', 'HIRED', 'LEASED');

-- CreateEnum
CREATE TYPE "public"."VehicleStatus" AS ENUM ('AVAILABLE', 'BOOKED', 'IN_TRANSIT', 'MAINTENANCE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."BankAccountType" AS ENUM ('SAVINGS', 'CURRENT', 'CASH_CREDIT', 'OVERDRAFT');

-- CreateEnum
CREATE TYPE "public"."NotificationFrequency" AS ENUM ('IMMEDIATE', 'DAILY', 'WEEKLY', 'NEVER');

-- CreateEnum
CREATE TYPE "public"."CustomerDocumentType" AS ENUM ('AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID', 'RENT_AGREEMENT', 'ELECTRICITY_BILL', 'GAS_CONNECTION', 'COMPANY_ID', 'OTHER');

-- AlterTable
ALTER TABLE "public"."Lead" DROP COLUMN "propertyType",
ADD COLUMN     "bikeCount" INTEGER,
ADD COLUMN     "carCount" INTEGER,
ADD COLUMN     "destinationDigipin" TEXT,
ADD COLUMN     "destinationInput" TEXT,
ADD COLUMN     "destinationLatitude" DECIMAL(10,7),
ADD COLUMN     "destinationLongitude" DECIMAL(10,7),
ADD COLUMN     "destinationPincode" TEXT,
ADD COLUMN     "destinationState" TEXT,
ADD COLUMN     "houseType" TEXT,
ADD COLUMN     "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "officeSize" TEXT,
ADD COLUMN     "pickupDigipin" TEXT,
ADD COLUMN     "pickupLatitude" DECIMAL(10,7),
ADD COLUMN     "pickupLongitude" DECIMAL(10,7),
ADD COLUMN     "pickupPincode" TEXT,
ADD COLUMN     "pickupState" TEXT,
ADD COLUMN     "plantsIncluded" BOOLEAN,
ADD COLUMN     "shiftingDate" TEXT,
ADD COLUMN     "source" "public"."LeadSource" NOT NULL DEFAULT 'WEBSITE',
ADD COLUMN     "userId" TEXT,
ADD COLUMN     "vehicleCount" INTEGER,
ADD COLUMN     "vehicleType" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."LeadStatus" NOT NULL DEFAULT 'NEW';

-- CreateTable
CREATE TABLE "public"."Vendor" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "gstNumber" TEXT,
    "serviceCities" TEXT NOT NULL,
    "householdService" BOOLEAN NOT NULL DEFAULT false,
    "officeService" BOOLEAN NOT NULL DEFAULT false,
    "vehicleService" BOOLEAN NOT NULL DEFAULT false,
    "experienceYears" INTEGER,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "companyLogo" TEXT,
    "completedMoves" INTEGER NOT NULL DEFAULT 0,
    "coordinatorEmail" TEXT,
    "coordinatorMobile" TEXT,
    "coordinatorName" TEXT,
    "insuranceAvailable" BOOLEAN NOT NULL DEFAULT false,
    "ownerEmail" TEXT,
    "ownerMobile" TEXT NOT NULL,
    "panNumber" TEXT,
    "pincode" TEXT,
    "quotationContactEmail" TEXT,
    "quotationContactMobile" TEXT,
    "quotationContactName" TEXT,
    "remarks" TEXT,
    "state" TEXT,
    "totalLabours" INTEGER,
    "totalVehicles" INTEGER,
    "vendorCode" TEXT NOT NULL,
    "website" TEXT,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Quotation" (
    "id" TEXT NOT NULL,
    "quotationNumber" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "userId" TEXT,
    "transportationCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "packingCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "unpackingCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "labourCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "insuranceCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otherCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "pickupDate" TIMESTAMP(3),
    "deliveryDate" TIMESTAMP(3),
    "transitDays" INTEGER,
    "status" "public"."QuotationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "validUntil" TIMESTAMP(3),
    "pricingBreakdown" JSONB,
    "termsJson" JSONB,
    "inclusionsJson" JSONB,
    "exclusionsJson" JSONB,
    "remarks" TEXT,
    "internalRemarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryItem" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "fragile" BOOLEAN NOT NULL DEFAULT false,
    "requiresPacking" BOOLEAN NOT NULL DEFAULT true,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryPhoto" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "roomType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Inventory" (
    "id" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "completionPercentage" INTEGER NOT NULL DEFAULT 0,
    "moveReadinessScore" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "additionalServices" JSONB,
    "packingType" TEXT DEFAULT 'STANDARD',
    "specialHandling" JSONB,
    "preMoveServices" JSONB,
    "callbackRequested" BOOLEAN NOT NULL DEFAULT false,
    "callbackSlot" TEXT,
    "destinationFloor" INTEGER,
    "destinationLiftAvailable" BOOLEAN NOT NULL DEFAULT false,
    "destinationParkingDistance" TEXT,
    "destinationPropertyType" TEXT,
    "destinationSame" BOOLEAN NOT NULL DEFAULT true,
    "dismantlingServices" JSONB,
    "installationServices" JSONB,
    "packingServices" JSONB,
    "photoInventoryRequested" BOOLEAN NOT NULL DEFAULT false,
    "photoInventoryUrls" JSONB,
    "pickupFloor" INTEGER,
    "pickupLiftAvailable" BOOLEAN NOT NULL DEFAULT false,
    "pickupParkingDistance" TEXT,
    "pickupPropertyType" TEXT,
    "postMoveServices" JSONB,
    "surveyType" TEXT DEFAULT 'MANUAL',

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DestinationDetails" (
    "id" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "propertyType" TEXT,
    "floorNumber" INTEGER,
    "liftAvailable" BOOLEAN,
    "parkingDistance" TEXT,
    "installationServices" JSONB,
    "additionalServices" JSONB,
    "specialInstructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DestinationDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Booking" (
    "id" TEXT NOT NULL,
    "bookingNumber" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "leadReferenceId" TEXT NOT NULL,
    "userId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerMobile" TEXT NOT NULL,
    "customerEmail" TEXT,
    "serviceType" TEXT NOT NULL,
    "moveType" TEXT NOT NULL,
    "moveDate" TIMESTAMP(3) NOT NULL,
    "deliveryDate" TIMESTAMP(3),
    "pickupCity" TEXT NOT NULL,
    "pickupState" TEXT NOT NULL,
    "pickupPincode" TEXT NOT NULL,
    "pickupDigipin" TEXT,
    "pickupLatitude" DECIMAL(10,7),
    "pickupLongitude" DECIMAL(10,7),
    "dropCity" TEXT NOT NULL,
    "dropState" TEXT NOT NULL,
    "dropPincode" TEXT NOT NULL,
    "dropDigipin" TEXT,
    "dropLatitude" DECIMAL(10,7),
    "dropLongitude" DECIMAL(10,7),
    "pickupAddress" TEXT NOT NULL,
    "dropAddress" TEXT NOT NULL,
    "contactJson" JSONB NOT NULL,
    "pickupAddressJson" JSONB NOT NULL,
    "dropAddressJson" JSONB NOT NULL,
    "scheduleJson" JSONB NOT NULL,
    "inventoryJson" JSONB NOT NULL,
    "inventorySummaryJson" JSONB NOT NULL,
    "servicesJson" JSONB NOT NULL,
    "requirementsJson" JSONB,
    "aiAnalysisJson" JSONB,
    "vendorId" TEXT,
    "vendorName" TEXT,
    "assignedVendorCode" TEXT,
    "vendorJson" JSONB,
    "selectedQuotationId" TEXT,
    "quotationJson" JSONB,
    "paymentJson" JSONB,
    "trackingJson" JSONB,
    "timelineJson" JSONB NOT NULL,
    "auditJson" JSONB NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "bookingStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "trackingStatus" "public"."TrackingStatus" NOT NULL DEFAULT 'BOOKING_CONFIRMED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CallbackRequest" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "city" TEXT,
    "serviceType" TEXT,
    "preferredTime" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "CallbackRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "mobile" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "mobileVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vendorId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Customer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alternateMobile" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "companyName" TEXT,
    "gstNumber" TEXT,
    "panNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Corporate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "legalName" TEXT,
    "registrationNumber" TEXT,
    "gstNumber" TEXT,
    "panNumber" TEXT,
    "contactPerson" TEXT NOT NULL,
    "designation" TEXT,
    "alternateMobile" TEXT,
    "landline" TEXT,
    "website" TEXT,
    "email" TEXT,
    "industry" TEXT,
    "employeeStrength" INTEGER,
    "annualRelocations" INTEGER,
    "billingAddress" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "country" TEXT DEFAULT 'India',
    "accountManager" TEXT,
    "contractStartDate" TIMESTAMP(3),
    "contractEndDate" TIMESTAMP(3),
    "creditLimit" DECIMAL(12,2),
    "paymentTerms" INTEGER DEFAULT 30,
    "preferredVendorId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Corporate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Franchise" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "franchiseCode" TEXT NOT NULL,
    "franchiseName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "businessName" TEXT,
    "gstNumber" TEXT,
    "panNumber" TEXT,
    "aadhaarNumber" TEXT,
    "email" TEXT,
    "mobile" TEXT NOT NULL,
    "alternateMobile" TEXT,
    "landline" TEXT,
    "website" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "operatingArea" TEXT,
    "territory" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "joiningDate" TIMESTAMP(3),
    "agreementExpiry" TIMESTAMP(3),
    "commissionPercent" DECIMAL(5,2),
    "securityDeposit" DECIMAL(12,2),
    "monthlyTarget" INTEGER,
    "yearlyTarget" INTEGER,
    "achievedBookings" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION DEFAULT 0,
    "totalRevenue" DECIMAL(14,2),
    "bankName" TEXT,
    "accountHolderName" TEXT,
    "accountNumber" TEXT,
    "ifscCode" TEXT,
    "branchName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Franchise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "channel" "public"."NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "referenceId" TEXT,
    "referenceType" TEXT,
    "actionUrl" TEXT,
    "icon" TEXT,
    "image" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VendorDocument" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "documentType" "public"."VendorDocumentType" NOT NULL,
    "documentNumber" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "issuedBy" TEXT,
    "issuedDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "verificationStatus" "public"."VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "remarks" TEXT,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VendorRating" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "averageRating" DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "rating5" INTEGER NOT NULL DEFAULT 0,
    "rating4" INTEGER NOT NULL DEFAULT 0,
    "rating3" INTEGER NOT NULL DEFAULT 0,
    "rating2" INTEGER NOT NULL DEFAULT 0,
    "rating1" INTEGER NOT NULL DEFAULT 0,
    "onTimeDeliveryScore" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "packingQualityScore" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "staffBehaviourScore" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "communicationScore" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "pricingScore" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "complaintCount" INTEGER NOT NULL DEFAULT 0,
    "resolvedComplaints" INTEGER NOT NULL DEFAULT 0,
    "cancellationCount" INTEGER NOT NULL DEFAULT 0,
    "completedBookings" INTEGER NOT NULL DEFAULT 0,
    "repeatCustomers" INTEGER NOT NULL DEFAULT 0,
    "recommendationRate" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VendorReview" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "customerId" TEXT,
    "bookingId" TEXT,
    "quotationId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerMobile" TEXT,
    "customerEmail" TEXT,
    "overallRating" DECIMAL(3,2) NOT NULL,
    "packingRating" DECIMAL(3,2),
    "deliveryRating" DECIMAL(3,2),
    "behaviourRating" DECIMAL(3,2),
    "communicationRating" DECIMAL(3,2),
    "pricingRating" DECIMAL(3,2),
    "title" TEXT,
    "review" TEXT NOT NULL,
    "recommendation" "public"."RecommendationType" NOT NULL DEFAULT 'YES',
    "verifiedBooking" BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "reportedCount" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "adminRemarks" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "quotationId" TEXT,
    "userId" TEXT,
    "vendorId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "paymentMethod" "public"."PaymentMethod" NOT NULL,
    "paymentType" "public"."PaymentType" NOT NULL,
    "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "gatewayTransactionId" TEXT,
    "gatewayOrderId" TEXT,
    "gatewayPaymentId" TEXT,
    "gatewaySignature" TEXT,
    "bankReference" TEXT,
    "remarks" TEXT,
    "paidAt" TIMESTAMP(3),
    "refundAmount" DECIMAL(12,2),
    "refundReason" TEXT,
    "refundedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "bookingId" TEXT,
    "quotationId" TEXT,
    "paymentId" TEXT,
    "customerId" TEXT,
    "vendorId" TEXT,
    "invoiceType" "public"."InvoiceType" NOT NULL,
    "invoiceStatus" "public"."InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "taxableAmount" DECIMAL(12,2) NOT NULL,
    "cgst" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sgst" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "igst" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cess" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balanceAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "billingName" TEXT NOT NULL,
    "billingAddress" TEXT NOT NULL,
    "billingGST" TEXT,
    "placeOfSupply" TEXT,
    "pdfUrl" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BookingTracking" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "trackingStatus" "public"."TrackingStatus" NOT NULL,
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "remarks" TEXT,
    "updatedBy" TEXT,
    "updatedByRole" TEXT,
    "estimatedArrival" TIMESTAMP(3),
    "actualArrival" TIMESTAMP(3),
    "photoUrl" TEXT,
    "signatureUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OTP" (
    "id" TEXT NOT NULL,
    "mobile" TEXT,
    "email" TEXT,
    "otpCode" TEXT NOT NULL,
    "purpose" "public"."OTPPurpose" NOT NULL,
    "userId" TEXT,
    "bookingId" TEXT,
    "quotationId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "deviceInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OTP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "public"."AuditAction" NOT NULL,
    "entity" "public"."AuditEntity" NOT NULL,
    "entityId" TEXT,
    "description" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "deviceInfo" TEXT,
    "browser" TEXT,
    "operatingSystem" TEXT,
    "requestMethod" TEXT,
    "requestUrl" TEXT,
    "responseCode" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VendorVehicle" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "vehicleType" "public"."VehicleType" NOT NULL,
    "ownership" "public"."VehicleOwnership" NOT NULL DEFAULT 'OWNED',
    "status" "public"."VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "brand" TEXT,
    "model" TEXT,
    "manufacturingYear" INTEGER,
    "color" TEXT,
    "fuelType" TEXT,
    "carryingCapacityKg" INTEGER,
    "volumeCapacityCft" INTEGER,
    "lengthFt" DOUBLE PRECISION,
    "widthFt" DOUBLE PRECISION,
    "heightFt" DOUBLE PRECISION,
    "driverName" TEXT,
    "driverMobile" TEXT,
    "driverLicenseNumber" TEXT,
    "insuranceNumber" TEXT,
    "insuranceExpiry" TIMESTAMP(3),
    "permitNumber" TEXT,
    "permitExpiry" TIMESTAMP(3),
    "fitnessExpiry" TIMESTAMP(3),
    "pollutionExpiry" TIMESTAMP(3),
    "gpsInstalled" BOOLEAN NOT NULL DEFAULT false,
    "gpsDeviceId" TEXT,
    "currentCity" TEXT,
    "currentLatitude" DOUBLE PRECISION,
    "currentLongitude" DOUBLE PRECISION,
    "remarks" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VendorBankAccount" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "branchName" TEXT,
    "accountNumber" TEXT NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "swiftCode" TEXT,
    "upiId" TEXT,
    "accountType" "public"."BankAccountType" NOT NULL,
    "cancelledChequeUrl" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorBankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "bookingUpdates" BOOLEAN NOT NULL DEFAULT true,
    "quotationUpdates" BOOLEAN NOT NULL DEFAULT true,
    "paymentUpdates" BOOLEAN NOT NULL DEFAULT true,
    "vendorUpdates" BOOLEAN NOT NULL DEFAULT true,
    "promotionalMessages" BOOLEAN NOT NULL DEFAULT false,
    "newsletter" BOOLEAN NOT NULL DEFAULT false,
    "reminderNotifications" BOOLEAN NOT NULL DEFAULT true,
    "frequency" "public"."NotificationFrequency" NOT NULL DEFAULT 'IMMEDIATE',
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomerDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentType" "public"."CustomerDocumentType" NOT NULL,
    "documentNumber" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "issuedBy" TEXT,
    "issuedDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "verificationStatus" "public"."VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "remarks" TEXT,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_ownerMobile_key" ON "public"."Vendor"("ownerMobile");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_vendorCode_key" ON "public"."Vendor"("vendorCode");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_quotationNumber_key" ON "public"."Quotation"("quotationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_referenceId_key" ON "public"."Quotation"("referenceId");

-- CreateIndex
CREATE INDEX "Quotation_quotationNumber_idx" ON "public"."Quotation"("quotationNumber");

-- CreateIndex
CREATE INDEX "Quotation_referenceId_idx" ON "public"."Quotation"("referenceId");

-- CreateIndex
CREATE INDEX "Quotation_leadId_idx" ON "public"."Quotation"("leadId");

-- CreateIndex
CREATE INDEX "Quotation_bookingId_idx" ON "public"."Quotation"("bookingId");

-- CreateIndex
CREATE INDEX "Quotation_vendorId_idx" ON "public"."Quotation"("vendorId");

-- CreateIndex
CREATE INDEX "Quotation_userId_idx" ON "public"."Quotation"("userId");

-- CreateIndex
CREATE INDEX "Quotation_status_idx" ON "public"."Quotation"("status");

-- CreateIndex
CREATE INDEX "Quotation_validUntil_idx" ON "public"."Quotation"("validUntil");

-- CreateIndex
CREATE INDEX "Quotation_createdAt_idx" ON "public"."Quotation"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_referenceId_key" ON "public"."Inventory"("referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_leadId_key" ON "public"."Inventory"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "DestinationDetails_referenceId_key" ON "public"."DestinationDetails"("referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingNumber_key" ON "public"."Booking"("bookingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_selectedQuotationId_key" ON "public"."Booking"("selectedQuotationId");

-- CreateIndex
CREATE INDEX "Booking_bookingNumber_idx" ON "public"."Booking"("bookingNumber");

-- CreateIndex
CREATE INDEX "Booking_leadId_idx" ON "public"."Booking"("leadId");

-- CreateIndex
CREATE INDEX "Booking_leadReferenceId_idx" ON "public"."Booking"("leadReferenceId");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "public"."Booking"("userId");

-- CreateIndex
CREATE INDEX "Booking_vendorId_idx" ON "public"."Booking"("vendorId");

-- CreateIndex
CREATE INDEX "Booking_selectedQuotationId_idx" ON "public"."Booking"("selectedQuotationId");

-- CreateIndex
CREATE INDEX "Booking_bookingStatus_idx" ON "public"."Booking"("bookingStatus");

-- CreateIndex
CREATE INDEX "Booking_paymentStatus_idx" ON "public"."Booking"("paymentStatus");

-- CreateIndex
CREATE INDEX "Booking_trackingStatus_idx" ON "public"."Booking"("trackingStatus");

-- CreateIndex
CREATE INDEX "Booking_customerMobile_idx" ON "public"."Booking"("customerMobile");

-- CreateIndex
CREATE INDEX "Booking_moveDate_idx" ON "public"."Booking"("moveDate");

-- CreateIndex
CREATE INDEX "Booking_serviceType_idx" ON "public"."Booking"("serviceType");

-- CreateIndex
CREATE INDEX "Booking_moveType_idx" ON "public"."Booking"("moveType");

-- CreateIndex
CREATE INDEX "Booking_pickupCity_idx" ON "public"."Booking"("pickupCity");

-- CreateIndex
CREATE INDEX "Booking_pickupState_idx" ON "public"."Booking"("pickupState");

-- CreateIndex
CREATE INDEX "Booking_pickupPincode_idx" ON "public"."Booking"("pickupPincode");

-- CreateIndex
CREATE INDEX "Booking_pickupDigipin_idx" ON "public"."Booking"("pickupDigipin");

-- CreateIndex
CREATE INDEX "Booking_dropCity_idx" ON "public"."Booking"("dropCity");

-- CreateIndex
CREATE INDEX "Booking_dropState_idx" ON "public"."Booking"("dropState");

-- CreateIndex
CREATE INDEX "Booking_dropPincode_idx" ON "public"."Booking"("dropPincode");

-- CreateIndex
CREATE INDEX "Booking_dropDigipin_idx" ON "public"."Booking"("dropDigipin");

-- CreateIndex
CREATE INDEX "Booking_createdAt_idx" ON "public"."Booking"("createdAt");

-- CreateIndex
CREATE INDEX "CallbackRequest_mobile_idx" ON "public"."CallbackRequest"("mobile");

-- CreateIndex
CREATE INDEX "CallbackRequest_status_idx" ON "public"."CallbackRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_key" ON "public"."User"("mobile");

-- CreateIndex
CREATE INDEX "User_mobile_idx" ON "public"."User"("mobile");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_userId_key" ON "public"."Customer"("userId");

-- CreateIndex
CREATE INDEX "Customer_companyName_idx" ON "public"."Customer"("companyName");

-- CreateIndex
CREATE UNIQUE INDEX "Corporate_userId_key" ON "public"."Corporate"("userId");

-- CreateIndex
CREATE INDEX "Corporate_companyName_idx" ON "public"."Corporate"("companyName");

-- CreateIndex
CREATE INDEX "Corporate_gstNumber_idx" ON "public"."Corporate"("gstNumber");

-- CreateIndex
CREATE INDEX "Corporate_city_idx" ON "public"."Corporate"("city");

-- CreateIndex
CREATE INDEX "Corporate_state_idx" ON "public"."Corporate"("state");

-- CreateIndex
CREATE UNIQUE INDEX "Franchise_userId_key" ON "public"."Franchise"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Franchise_franchiseCode_key" ON "public"."Franchise"("franchiseCode");

-- CreateIndex
CREATE INDEX "Franchise_franchiseCode_idx" ON "public"."Franchise"("franchiseCode");

-- CreateIndex
CREATE INDEX "Franchise_city_idx" ON "public"."Franchise"("city");

-- CreateIndex
CREATE INDEX "Franchise_state_idx" ON "public"."Franchise"("state");

-- CreateIndex
CREATE INDEX "Franchise_mobile_idx" ON "public"."Franchise"("mobile");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "public"."Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "public"."Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "public"."Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "public"."Notification"("createdAt");

-- CreateIndex
CREATE INDEX "VendorDocument_vendorId_idx" ON "public"."VendorDocument"("vendorId");

-- CreateIndex
CREATE INDEX "VendorDocument_documentType_idx" ON "public"."VendorDocument"("documentType");

-- CreateIndex
CREATE INDEX "VendorDocument_verificationStatus_idx" ON "public"."VendorDocument"("verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "VendorRating_vendorId_key" ON "public"."VendorRating"("vendorId");

-- CreateIndex
CREATE INDEX "VendorRating_averageRating_idx" ON "public"."VendorRating"("averageRating");

-- CreateIndex
CREATE INDEX "VendorRating_completedBookings_idx" ON "public"."VendorRating"("completedBookings");

-- CreateIndex
CREATE INDEX "VendorReview_vendorId_idx" ON "public"."VendorReview"("vendorId");

-- CreateIndex
CREATE INDEX "VendorReview_bookingId_idx" ON "public"."VendorReview"("bookingId");

-- CreateIndex
CREATE INDEX "VendorReview_quotationId_idx" ON "public"."VendorReview"("quotationId");

-- CreateIndex
CREATE INDEX "VendorReview_status_idx" ON "public"."VendorReview"("status");

-- CreateIndex
CREATE INDEX "VendorReview_overallRating_idx" ON "public"."VendorReview"("overallRating");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentNumber_key" ON "public"."Payment"("paymentNumber");

-- CreateIndex
CREATE INDEX "Payment_paymentNumber_idx" ON "public"."Payment"("paymentNumber");

-- CreateIndex
CREATE INDEX "Payment_bookingId_idx" ON "public"."Payment"("bookingId");

-- CreateIndex
CREATE INDEX "Payment_quotationId_idx" ON "public"."Payment"("quotationId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "public"."Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_vendorId_idx" ON "public"."Payment"("vendorId");

-- CreateIndex
CREATE INDEX "Payment_paymentStatus_idx" ON "public"."Payment"("paymentStatus");

-- CreateIndex
CREATE INDEX "Payment_paymentMethod_idx" ON "public"."Payment"("paymentMethod");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "public"."Payment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "public"."Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_bookingId_idx" ON "public"."Invoice"("bookingId");

-- CreateIndex
CREATE INDEX "Invoice_quotationId_idx" ON "public"."Invoice"("quotationId");

-- CreateIndex
CREATE INDEX "Invoice_paymentId_idx" ON "public"."Invoice"("paymentId");

-- CreateIndex
CREATE INDEX "Invoice_invoiceStatus_idx" ON "public"."Invoice"("invoiceStatus");

-- CreateIndex
CREATE INDEX "Invoice_invoiceDate_idx" ON "public"."Invoice"("invoiceDate");

-- CreateIndex
CREATE INDEX "BookingTracking_bookingId_idx" ON "public"."BookingTracking"("bookingId");

-- CreateIndex
CREATE INDEX "BookingTracking_trackingStatus_idx" ON "public"."BookingTracking"("trackingStatus");

-- CreateIndex
CREATE INDEX "BookingTracking_createdAt_idx" ON "public"."BookingTracking"("createdAt");

-- CreateIndex
CREATE INDEX "OTP_mobile_idx" ON "public"."OTP"("mobile");

-- CreateIndex
CREATE INDEX "OTP_email_idx" ON "public"."OTP"("email");

-- CreateIndex
CREATE INDEX "OTP_purpose_idx" ON "public"."OTP"("purpose");

-- CreateIndex
CREATE INDEX "OTP_expiresAt_idx" ON "public"."OTP"("expiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "public"."AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "public"."AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "public"."AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "public"."AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VendorVehicle_registrationNumber_key" ON "public"."VendorVehicle"("registrationNumber");

-- CreateIndex
CREATE INDEX "VendorVehicle_vendorId_idx" ON "public"."VendorVehicle"("vendorId");

-- CreateIndex
CREATE INDEX "VendorVehicle_vehicleType_idx" ON "public"."VendorVehicle"("vehicleType");

-- CreateIndex
CREATE INDEX "VendorVehicle_status_idx" ON "public"."VendorVehicle"("status");

-- CreateIndex
CREATE INDEX "VendorVehicle_registrationNumber_idx" ON "public"."VendorVehicle"("registrationNumber");

-- CreateIndex
CREATE INDEX "VendorBankAccount_vendorId_idx" ON "public"."VendorBankAccount"("vendorId");

-- CreateIndex
CREATE INDEX "VendorBankAccount_ifscCode_idx" ON "public"."VendorBankAccount"("ifscCode");

-- CreateIndex
CREATE INDEX "VendorBankAccount_accountNumber_idx" ON "public"."VendorBankAccount"("accountNumber");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "public"."NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "CustomerDocument_userId_idx" ON "public"."CustomerDocument"("userId");

-- CreateIndex
CREATE INDEX "CustomerDocument_documentType_idx" ON "public"."CustomerDocument"("documentType");

-- CreateIndex
CREATE INDEX "CustomerDocument_verificationStatus_idx" ON "public"."CustomerDocument"("verificationStatus");

-- CreateIndex
CREATE INDEX "Lead_referenceId_idx" ON "public"."Lead"("referenceId");

-- CreateIndex
CREATE INDEX "Lead_mobile_idx" ON "public"."Lead"("mobile");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "public"."Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "public"."Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_source_idx" ON "public"."Lead"("source");

-- CreateIndex
CREATE INDEX "Lead_pickupCity_idx" ON "public"."Lead"("pickupCity");

-- CreateIndex
CREATE INDEX "Lead_destinationCity_idx" ON "public"."Lead"("destinationCity");

-- CreateIndex
CREATE INDEX "Lead_pickupPincode_idx" ON "public"."Lead"("pickupPincode");

-- CreateIndex
CREATE INDEX "Lead_destinationPincode_idx" ON "public"."Lead"("destinationPincode");

-- CreateIndex
CREATE INDEX "Lead_pickupDigipin_idx" ON "public"."Lead"("pickupDigipin");

-- CreateIndex
CREATE INDEX "Lead_destinationDigipin_idx" ON "public"."Lead"("destinationDigipin");

-- CreateIndex
CREATE INDEX "Lead_userId_idx" ON "public"."Lead"("userId");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "public"."Lead"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."Lead" ADD CONSTRAINT "Lead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quotation" ADD CONSTRAINT "Quotation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quotation" ADD CONSTRAINT "Quotation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quotation" ADD CONSTRAINT "Quotation_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quotation" ADD CONSTRAINT "Quotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryItem" ADD CONSTRAINT "InventoryItem_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "public"."Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryPhoto" ADD CONSTRAINT "InventoryPhoto_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "public"."Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Inventory" ADD CONSTRAINT "Inventory_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_selectedQuotationId_fkey" FOREIGN KEY ("selectedQuotationId") REFERENCES "public"."Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CallbackRequest" ADD CONSTRAINT "CallbackRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Corporate" ADD CONSTRAINT "Corporate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Franchise" ADD CONSTRAINT "Franchise_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorDocument" ADD CONSTRAINT "VendorDocument_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorRating" ADD CONSTRAINT "VendorRating_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorReview" ADD CONSTRAINT "VendorReview_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "public"."Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingTracking" ADD CONSTRAINT "BookingTracking_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorVehicle" ADD CONSTRAINT "VendorVehicle_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorBankAccount" ADD CONSTRAINT "VendorBankAccount_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerDocument" ADD CONSTRAINT "CustomerDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
