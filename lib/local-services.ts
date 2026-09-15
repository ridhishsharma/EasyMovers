// Pilot service coverage is independent of prices and real-time vehicle availability.
export const localServiceCities = ["Bhopal, Madhya Pradesh"];
export const localVehicles = [
  { code: "TWO_WHEELER", label: "Two-wheeler" },
  { code: "THREE_WHEELER_CARGO", label: "Three-wheeler cargo" },
  { code: "MINI_TRUCK", label: "Mini truck" },
  { code: "PICKUP", label: "Pickup" },
  { code: "SMALL_COMMERCIAL", label: "Small commercial vehicle" },
  { code: "TRUCK_8_FT", label: "8-ft truck" },
  { code: "TRUCK_14_FT_OPEN", label: "14-ft open truck" },
  { code: "TRUCK_14_FT_CLOSED", label: "14-ft closed truck" },
  { code: "TRUCK_17_FT_OPEN", label: "17-ft open truck" },
  { code: "TRUCK_17_FT_CLOSED", label: "17-ft closed truck" },
];

export function isSupportedLocalSelection(city: string, vehicle: string) {
  return localServiceCities.includes(city) && localVehicles.some(item => item.code === vehicle);
}
