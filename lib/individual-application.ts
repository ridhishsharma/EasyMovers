import { localServiceCities, localVehicles } from "./local-services";

export const individualDraftKey = "em_individual_application_v1";
export const applicationDefaults = {
  fullName: "", mobile: "", email: "", serviceCity: localServiceCities[0], address: "",
  vehicleCategory: "", manufacturer: "", model: "", registrationNumber: "", payloadKg: "",
  licenceNumber: "", licenceIssuer: "", licenceExpiry: "",
  rcNumber: "", rcIssuer: "", rcExpiry: "",
  insuranceNumber: "", insuranceIssuer: "", insuranceExpiry: "",
  pollutionNumber: "", pollutionIssuer: "", pollutionExpiry: "",
  identityType: "PAN", identityLastFour: "", identityName: "",
  bankName: "", accountHolder: "", accountNumber: "", ifsc: "", upi: "",
};
export type IndividualApplication = typeof applicationDefaults;
const privateFields = ["licenceNumber", "rcNumber", "insuranceNumber", "pollutionNumber", "accountNumber", "upi"] as const;

export function serializableIndividualDraft(fields: IndividualApplication) {
  const draft = { ...fields };
  for (const field of privateFields) draft[field] = "";
  return { version: 1, status: "LOCAL_DRAFT", savedAt: new Date().toISOString(), fields: draft };
}

export function restoreIndividualDraft(raw: string): IndividualApplication {
  const parsed = JSON.parse(raw);
  if (parsed?.version !== 1 || parsed.status !== "LOCAL_DRAFT" || !parsed.fields || typeof parsed.fields !== "object") throw Error("Invalid draft");
  const fields = { ...applicationDefaults };
  for (const key of Object.keys(fields) as (keyof IndividualApplication)[]) {
    if (typeof parsed.fields[key] === "string" && parsed.fields[key].length <= 500) fields[key] = parsed.fields[key];
  }
  for (const field of privateFields) fields[field] = "";
  if (!localServiceCities.includes(fields.serviceCity)) fields.serviceCity = localServiceCities[0];
  if (!localVehicles.some(item => item.code === fields.vehicleCategory)) fields.vehicleCategory = "";
  return fields;
}
