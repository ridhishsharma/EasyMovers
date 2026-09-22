import { indianCities } from "@/lib/indian-cities";

export const indianStates = [
  ["AN", "Andaman and Nicobar Islands"], ["AP", "Andhra Pradesh"], ["AR", "Arunachal Pradesh"],
  ["AS", "Assam"], ["BR", "Bihar"], ["CH", "Chandigarh"], ["CG", "Chhattisgarh"],
  ["DN", "Dadra and Nagar Haveli and Daman and Diu"], ["DL", "Delhi"], ["GA", "Goa"],
  ["GJ", "Gujarat"], ["HR", "Haryana"], ["HP", "Himachal Pradesh"], ["JK", "Jammu and Kashmir"],
  ["JH", "Jharkhand"], ["KA", "Karnataka"], ["KL", "Kerala"], ["LA", "Ladakh"],
  ["LD", "Lakshadweep"], ["MP", "Madhya Pradesh"], ["MH", "Maharashtra"], ["MN", "Manipur"],
  ["ML", "Meghalaya"], ["MZ", "Mizoram"], ["NL", "Nagaland"], ["OD", "Odisha"],
  ["PY", "Puducherry"], ["PB", "Punjab"], ["RJ", "Rajasthan"], ["SK", "Sikkim"],
  ["TN", "Tamil Nadu"], ["TS", "Telangana"], ["TR", "Tripura"], ["UP", "Uttar Pradesh"],
  ["UK", "Uttarakhand"], ["WB", "West Bengal"],
] as const;

const normalized = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");
const stateAliases: Record<string, string> = {
  "orissa": "Odisha", "uttaranchal": "Uttarakhand", "jammu & kashmir": "Jammu and Kashmir",
  "andaman & nicobar islands": "Andaman and Nicobar Islands",
  "dadra & nagar haveli": "Dadra and Nagar Haveli and Daman and Diu",
  "daman & diu": "Dadra and Nagar Haveli and Daman and Diu",
};

export function canonicalState(value: unknown) {
  if (typeof value !== "string") return null;
  const candidate = stateAliases[normalized(value)] ?? value.trim();
  const match = indianStates.find(([, name]) => normalized(name) === normalized(candidate));
  return match ? { code: match[0], name: match[1] } : null;
}

export function citiesForState(state: string) {
  const canonical = canonicalState(state);
  if (!canonical) return [];
  return indianCities
    .filter(item => normalized(item.state) === normalized(canonical.name))
    .map(item => ({ city: item.city, state: canonical.name, stateCode: canonical.code }))
    .sort((a, b) => a.city.localeCompare(b.city));
}

export function catalogLocation(city: unknown, state: unknown) {
  if (typeof city !== "string") return null;
  const canonical = canonicalState(state);
  if (!canonical) return null;
  const match = citiesForState(canonical.name).find(item => normalized(item.city) === normalized(city));
  return match ? { city: match.city, district: match.city, state: canonical.name, stateCode: canonical.code } : null;
}

type PostalOffice = { Name?: string; District?: string; State?: string; Pincode?: string; Country?: string; Block?: string; Division?: string };

export async function postalLocationCandidates(pin: string) {
  if (!/^[1-9][0-9]{5}$/.test(pin)) throw Error("INVALID_POSTAL_CODE");
  const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal: AbortSignal.timeout(8000), next: { revalidate: 86400 } });
  if (!response.ok) throw Error("POSTAL_LOOKUP_UNAVAILABLE");
  const payload = await response.json();
  const offices = payload?.[0]?.PostOffice;
  if (payload?.[0]?.Status !== "Success" || !Array.isArray(offices) || !offices.length) throw Error("POSTAL_CODE_NOT_FOUND");
  const candidates = (offices as PostalOffice[]).filter(office => office.Pincode === pin && (!office.Country || office.Country === "India")).map(office => {
    const state = canonicalState(office.State);
    if (!state || !office.District) return null;
    return { city: office.District.trim(), district: office.District.trim(), state: state.name, stateCode: state.code, locality: office.Name?.trim() || office.Block?.trim() || office.District.trim(), division: office.Division?.trim() || null, pin };
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const unique = new Map(candidates.map(item => [`${normalized(item.locality)}|${normalized(item.district)}|${item.stateCode}`, item]));
  if (!unique.size) throw Error("POSTAL_CODE_NOT_FOUND");
  return [...unique.values()].sort((a, b) => a.locality.localeCompare(b.locality));
}

export async function verifyPostalLocation(input: { pin: string; city: unknown; district: unknown; state: unknown }) {
  const candidates = await postalLocationCandidates(input.pin);
  const state = canonicalState(input.state);
  if (!state || typeof input.city !== "string" || typeof input.district !== "string") return null;
  const match = candidates.find(item => item.stateCode === state.code && normalized(item.city) === normalized(input.city as string) && normalized(item.district) === normalized(input.district as string));
  return match ? { city: match.city, district: match.district, state: match.state, stateCode: match.stateCode, pin: match.pin } : null;
}
