/**
 * ============================================================
 * Easy Movers AI Platform
 * Vendor AI Prompt Templates
 * ============================================================
 *
 * File
 * ----
 * ai/vendor/vendor.prompt.ts
 *
 * Purpose
 * -------
 * Prompt templates for Vendor AI.
 *
 * Used By
 * -------
 * vendor-ai.service.ts
 *
 * ============================================================
 */

import {

  VendorAIRequest,

  VendorProfile,

  VendorExperience,

  VendorRatings,

  VendorPricing,

  VendorCompliance,

  VendorFleet,

  VendorPerformance,

} from "./vendor.model";

/**
 * ============================================================
 * Vendor System Prompt
 * ============================================================
 */

export const VENDOR_SYSTEM_PROMPT = `

You are the Vendor Intelligence Engine of Easy Movers.

Your responsibility is to evaluate Packers & Movers vendors.

Never create imaginary values.

Always calculate scores objectively.

Always return JSON.

Never return markdown.

Never return explanation outside JSON.

You must analyse

• Vendor Experience

• Customer Rating

• Vendor Documents

• Vendor Fleet

• Compliance

• Response Speed

• Price Competitiveness

Return trustworthy recommendation only.

`;

/**
 * ============================================================
 * Vendor Evaluation Prompt
 * ============================================================
 */

export function buildVendorEvaluationPrompt(

  request: VendorAIRequest,

  profile: VendorProfile,

  experience: VendorExperience,

  ratings: VendorRatings,

  pricing: VendorPricing,

  compliance: VendorCompliance,

  fleet: VendorFleet,

  performance: VendorPerformance

): string {

  return ` 

Evaluate the following moving company.

====================================================

Lead Reference

====================================================

Reference Id

${request.referenceId}

Lead Id

${request.leadId}

Vendor Id

${request.vendorId}

Customer City

${request.customerCity}

Destination City

${request.destinationCity}

Estimated Distance

${request.moveDistance} KM

Estimated Weight

${request.estimatedWeight} KG

Move Date

${request.moveDate}

====================================================

Vendor Profile

====================================================

Company

${profile.companyName}

Owner

${profile.ownerName}

City

${profile.city}

State

${profile.state}

Category

${profile.category}

Status

${profile.status}

Established

${profile.establishedYear}

====================================================

Vendor Experience

====================================================

Years

${experience.totalYears}

Bookings

${experience.totalBookings}

Successful

${experience.successfulBookings}

Cancelled

${experience.cancelledBookings}

Damage Claims

${experience.damagedClaims}

====================================================

Vendor Ratings

====================================================

Google Rating

${ratings.googleRating}

Platform Rating

${ratings.platformRating}

Customer Rating

${ratings.customerRating}

Reviews

${ratings.reviewCount}

====================================================

Vendor Pricing

====================================================

Average Quote

${pricing.averageQuotation}

Minimum Quote

${pricing.minimumQuotation}

Maximum Quote

${pricing.maximumQuotation}

Last Quote

${pricing.lastQuotation}
`;
/**
 * ============================================================
 * Vendor Compliance
 * ============================================================
 */

return `

GST Verified

${compliance.gstVerified}

Aadhaar Verified

${compliance.aadhaarVerified}

PAN Verified

${compliance.panVerified}

Insurance Available

${compliance.insuranceAvailable}

Police Verified

${compliance.policeVerified}

====================================================

Vendor Fleet

====================================================

Total Vehicles

${fleet.totalVehicles}

Mini Trucks

${fleet.miniTruck}

Pickup Trucks

${fleet.pickupTruck}

Container Trucks

${fleet.containerTruck}

Trailer Trucks

${fleet.trailerTruck}

====================================================

Vendor Performance

====================================================

Average Response Time

${performance.responseTimeHours} Hours

Average Delivery

${performance.averageDeliveryDays} Days

Complaint %

${performance.complaintPercentage}

Repeat Customer %

${performance.repeatCustomerPercentage}

====================================================

AI Evaluation Rules

====================================================

Calculate:

1. Trust Score (0-100)

2. Experience Score (0-100)

3. Pricing Score (0-100)

4. Fleet Score (0-100)

5. Compliance Score (0-100)

6. Customer Satisfaction Score (0-100)

7. Response Score (0-100)

8. Overall Score (0-100)

Rules

• More experience = Higher score

• Better customer rating = Higher score

• Police verification increases trust

• Insurance increases trust

• Lower cancellation increases score

• Lower complaint percentage increases score

• Competitive pricing increases score

• Larger fleet increases availability score

====================================================

Recommendation Rules

====================================================

Overall Score >= 90

HIGHLY_RECOMMENDED

Overall Score >= 75

RECOMMENDED

Overall Score >= 60

AVERAGE

Otherwise

NOT_RECOMMENDED

====================================================

Return ONLY JSON

====================================================

{

"trustScore":95,

"experienceScore":92,

"pricingScore":81,

"fleetScore":88,

"complianceScore":100,

"customerSatisfactionScore":94,

"responseScore":90,

"overallScore":91,

"recommendation":"HIGHLY_RECOMMENDED",

"strengths":[

"...",

"..."

],

"weaknesses":[

"...",

"..."

],

"riskFactors":[

"..."

]

}
`;
}

/**
 * ============================================================
 * Vendor Ranking Prompt
 * ============================================================
 */

export function buildVendorRankingPrompt(

vendors: VendorProfile[]

): string {

return `

Rank all vendors.

Ranking Factors

• Trust

• Customer Rating

• Pricing

• Experience

• Compliance

• Fleet

Return JSON only.

`;

}

/**
 * ============================================================
 * Fraud Detection Prompt
 * ============================================================
 */

export function buildVendorFraudPrompt(

profile: VendorProfile,

experience: VendorExperience,

compliance: VendorCompliance

): string {

return `

Detect fraud possibility.

Analyse

Registration

GST

PAN

Police Verification

Booking History

Damage Claims

Cancellation %

Return

{

"fraudRisk":12,

"confidence":93,

"remarks":""

}

`;

}