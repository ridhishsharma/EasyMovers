import { findIndianCity } from "./indian-cities";
export type VerifiedLocation = {
  city: string;
  state: string;
  address: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  pin?: string;
};
export async function verifyIndianLocation(
  input: unknown,
  local: boolean,
): Promise<VerifiedLocation> {
  if (!input || typeof input !== "object") throw Error("Choose a location.");
  const data = input as Record<string, unknown>;
  if (typeof data.placeId === "string") {
    const key = process.env.GOOGLE_MAPS_SERVER_KEY;
    if (!key)
      throw Error(
        "Map location validation is unavailable. Use the city list instead.",
      );
    if (!/^[A-Za-z0-9_-]{5,250}$/.test(data.placeId))
      throw Error("Invalid map location.");
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(data.placeId)}`,
      {
        headers: {
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask":
            "id,formattedAddress,addressComponents,location,types",
        },
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      },
    );
    if (!response.ok)
      throw Error("Could not validate the location. Please select it again.");
    const place = await response.json();
    const components = place.addressComponents || [];
    const component = (type: string) =>
      components.find((item: { types?: string[] }) =>
        item.types?.includes(type),
      );
    if (component("country")?.shortText !== "IN")
      throw Error("Please choose a location in India.");
    const city =
      component("locality")?.longText ||
      component("postal_town")?.longText ||
      component("administrative_area_level_3")?.longText;
    if (!city)
      throw Error(
        "Choose a location with a recognised Indian city or district.",
      );
    if (
      !local &&
      !place.types?.some((type: string) =>
        ["locality", "postal_town", "administrative_area_level_3"].includes(
          type,
        ),
      )
    )
      throw Error("Choose an Indian city rather than a street address.");
    return {
      city,
      state: component("administrative_area_level_1")?.longText || "",
      address: place.formattedAddress,
      latitude: place.location?.latitude,
      longitude: place.location?.longitude,
      placeId: place.id,
    };
  }
  if (local && !data.city && typeof data.address === "string") {
    const key=process.env.GOOGLE_MAPS_SERVER_KEY;
    if(!key)throw Error("Address verification is not configured. Please contact EasyMovers to arrange this local move.");
    if(data.address.trim().length<10 || data.address.length>300)throw Error("Enter a full pickup/drop address including locality and city.");
    const response=await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(data.address)}&components=country:IN&key=${encodeURIComponent(key)}`,{cache:"no-store",signal:AbortSignal.timeout(8000)});
    if(!response.ok)throw Error("Address verification is unavailable. Please try map search.");
    const body=await response.json(); const result=body.results?.[0];
    if(body.status!=="OK" || body.results.length!==1 || result.partial_match)throw Error("This address is ambiguous. Select the exact pickup/drop point using map search.");
    return verifyIndianLocation({placeId:result.place_id},true);
  }
  if (!local && typeof data.pin === "string") {
    if (!/^[1-9]\d{5}$/.test(data.pin))
      throw Error("Enter a valid six-digit PIN.");
    const response = await fetch(
      `https://api.postalpincode.in/pincode/${data.pin}`,
      { signal: AbortSignal.timeout(8000), cache: "no-store" },
    );
    if (!response.ok)
      throw Error("PIN validation is unavailable. Choose a city instead.");
    const result = (await response.json())?.[0];
    const office = result?.PostOffice?.find(
      (item: { Name: string }) => item.Name === data.locality,
    );
    if (result?.Status !== "Success" || !office || office.Country !== "India")
      throw Error("Choose a valid Indian postal locality.");
    return {
      city: office.District,
      state: office.State,
      address: `${office.Name}, ${office.District}, ${office.State}`,
      pin: data.pin,
    };
  }
  if (typeof data.city !== "string")
    throw Error("Choose a city from the suggestions.");
  const city = findIndianCity(data.city);
  if (!city) throw Error("Choose a valid Indian city from the suggestions.");
  const address = typeof data.address === "string" ? data.address.trim() : "";
  if (local && (address.length < 5 || address.length > 300))
    throw Error("Enter the pickup/drop address and select its city.");
  return {
    city: city.city,
    state: city.state,
    address: local ? address : city.label,
  };
}
