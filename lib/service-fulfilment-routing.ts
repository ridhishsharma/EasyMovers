export type CustomerServiceProfile = {
  scope: "WITHIN_CITY" | "WITHIN_STATE" | "PAN_INDIA";
  serviceType: "HOUSEHOLD_RELOCATION" | "OFFICE_RELOCATION" | "CORPORATE_RELOCATION" | "VEHICLE_TRANSPORT" | "COMMERCIAL_GOODS" | "WAREHOUSING" | "PACKING_ONLY" | "LOADING_UNLOADING" | "INSTALLATION_UNINSTALLATION";
  surveyRequired: boolean;
  instantRateRequested: boolean;
};

export type FulfilmentRoute = "INSTANT_VERIFIED_FLEET" | "QUOTATION" | "SURVEY_QUOTATION";

const complexServices = new Set([
  "HOUSEHOLD_RELOCATION",
  "OFFICE_RELOCATION",
  "CORPORATE_RELOCATION",
  "COMMERCIAL_GOODS",
  "WAREHOUSING",
]);

export function resolveFulfilmentRoute(profile: CustomerServiceProfile): FulfilmentRoute {
  if (profile.surveyRequired || complexServices.has(profile.serviceType)) return "SURVEY_QUOTATION";
  if (profile.scope === "WITHIN_CITY" && profile.instantRateRequested) return "INSTANT_VERIFIED_FLEET";
  return "QUOTATION";
}

export function engagementModesForRoute(route: FulfilmentRoute) {
  return route === "INSTANT_VERIFIED_FLEET"
    ? ["INSTANT_RATE", "HYBRID"] as const
    : ["QUOTATION", "HYBRID"] as const;
}
