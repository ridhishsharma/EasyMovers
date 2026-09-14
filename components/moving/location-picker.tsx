"use client";
import { useEffect, useRef, useState } from "react";
import { SearchSuggestions } from "./search-suggestions";
import { indianCities } from "@/lib/indian-cities";
import styles from "./moving.module.css";
export type LocationChoice = {
  placeId?: string;
  city?: string;
  address?: string;
  pin?: string;
  locality?: string;
  label: string;
  latitude?: number;
  longitude?: number;
};
declare global {
  interface Window {
    google: any;
    emMapsReady?: () => void;
    emMapsPromise?: Promise<void>;
  }
}
function loadMaps(key: string) {
  if (window.google?.maps?.importLibrary) return Promise.resolve();
  if (window.emMapsPromise) return window.emMapsPromise;
  window.emMapsPromise = new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      window.emMapsPromise = undefined;
      reject(Error("Maps unavailable"));
    }, 12000);
    window.emMapsReady = () => {
      clearTimeout(timeout);
      resolve();
    };
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&libraries=places&callback=emMapsReady&v=weekly`;
    script.onerror = () => {
      clearTimeout(timeout);
      window.emMapsPromise = undefined;
      reject(Error("Maps unavailable"));
    };
    document.head.appendChild(script);
  });
  return window.emMapsPromise;
}
export function LocationPicker({
  label,
  local,
  value,
  onChange,
}: {
  label: string;
  local: boolean;
  value: LocationChoice | null;
  onChange: (value: LocationChoice | null) => void;
}) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_PLACES_KEY;
  const host = useRef<HTMLDivElement>(null),
    mapHost = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(!key),
    [error, setError] = useState(""),
    [open, setOpen] = useState(false),
    [pending, setPending] = useState<LocationChoice | null>(null);
  const [city, setCity] = useState(""),
    [address, setAddress] = useState("");
  useEffect(() => {
    if (!key || !host.current) return;
    let active = true;
    let widget: any;
    let selected: EventListener;
    loadMaps(key)
      .then(async () => {
        const { PlaceAutocompleteElement } =
          await window.google.maps.importLibrary("places");
        if (!active || !host.current) return;
        widget = new PlaceAutocompleteElement({
          includedRegionCodes: ["in"],
          ...(local
            ? {}
            : {
                includedPrimaryTypes: [
                  "locality",
                  "postal_town",
                  "administrative_area_level_3",
                ],
              }),
        });
        widget.description = label;
        widget.placeholder = local
          ? `Search ${label.toLowerCase()} address`
          : `Search Indian ${label.toLowerCase()} city`;
        selected = (async (event: any) => {
          try {
            const place = event.placePrediction.toPlace();
            await place.fetchFields({
              fields: [
                "id",
                "formattedAddress",
                "location",
                "addressComponents",
              ],
            });
            if (!active) return;
            if (
              !place.addressComponents?.some(
                (item: any) =>
                  item.types.includes("country") && item.shortText === "IN",
              )
            )
              throw Error("Choose a location in India.");
            onChange({
              placeId: place.id,
              label: place.formattedAddress,
              latitude: place.location?.lat(),
              longitude: place.location?.lng(),
            });
            setError("");
          } catch {
            if (active) {
              onChange(null);
              setError(
                "Please choose a valid Indian location from the suggestions.",
              );
            }
          }
        }) as EventListener;
        widget.addEventListener("gmp-select", selected);
        widget.addEventListener("input", () => onChange(null));
        host.current.replaceChildren(widget);
      })
      .catch(() => {
        if (active) {
          setFallback(true);
          setError(
            "Map search is unavailable. Enter your full address or select an Indian city.",
          );
        }
      });
    return () => {
      active = false;
      if (widget && selected)
        widget.removeEventListener("gmp-select", selected);
      widget?.remove();
    };
    // Location selection is owned by the parent; each widget is recreated only for a route-type change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, local]);
  useEffect(() => {
    if (!open || !mapHost.current || !key) return;
    let active = true;
    let listener: any;
    let marker: any;
    loadMaps(key)
      .then(async () => {
        const { Map } = await window.google.maps.importLibrary("maps");
        if (!active || !mapHost.current) return;
        const map = new Map(mapHost.current, {
          center: {
            lat: value?.latitude || 23.2599,
            lng: value?.longitude || 77.4126,
          },
          zoom: 13,
          streetViewControl: false,
          mapTypeControl: false,
        });
        const geocoder = new window.google.maps.Geocoder();
        listener = map.addListener("click", async (event: any) => {
          try {
            const { results } = await geocoder.geocode({
              location: event.latLng,
            });
            if (!active) return;
            const result = results.find((item: any) =>
              item.address_components.some(
                (component: any) =>
                  component.types.includes("country") &&
                  component.short_name === "IN",
              ),
            );
            if (!result) throw Error("Select a point in India.");
            marker?.setMap(null);
            marker = new window.google.maps.Marker({
              map,
              position: event.latLng,
            });
            setPending({
              placeId: result.place_id,
              label: result.formatted_address,
              latitude: event.latLng.lat(),
              longitude: event.latLng.lng(),
            });
            setError("");
          } catch {
            if (active)
              setError(
                "Could not identify this address. Try another point or search the address.",
              );
          }
        });
      })
      .catch(() => setError("Map unavailable. Use address search."));
    return () => {
      active = false;
      listener?.remove();
      marker?.setMap(null);
    };
  }, [open, key, value?.latitude, value?.longitude]);
  function manual(nextCity: string, nextAddress: string) {
    setCity(nextCity);
    setAddress(nextAddress);
    onChange(
      nextCity && (!local || nextAddress)
        ? {
            city: nextCity,
            address: nextAddress,
            label: local ? `${nextAddress}, ${nextCity}` : nextCity,
          }
        : null,
    );
  }
  return (
    <div className={styles.location}>
      <label className={styles.label}>{label}</label>
      {!fallback && <div ref={host} className={styles.placesHost} />}
      {fallback && (local ? <><input aria-label={`${label} address`} placeholder="Street, building, locality and city" maxLength={300} value={address} onChange={e=>{setAddress(e.target.value);onChange(e.target.value.trim()?{address:e.target.value,label:e.target.value}:null)}}/><p className={styles.muted}>Enter a full address, or enable map search to select the exact point.</p></> : <SearchSuggestions label={`Search Indian ${label.toLowerCase()} city`} value={city} options={indianCities.map(item=>item.label)} onChange={next=>manual(next, "")} onSelect={next=>manual(next, "")}/>)}
      {local && label === "From" && <button type="button" className={styles.smallLink} onClick={async()=>{setError("");if(!key){setError("Current location needs map search enabled. Enter the full pickup address instead.");return}if(!navigator.geolocation){setError("Location is unavailable on this device.");return}try{await loadMaps(key);navigator.geolocation.getCurrentPosition(async position=>{try{const {results}=await new window.google.maps.Geocoder().geocode({location:{lat:position.coords.latitude,lng:position.coords.longitude}});const result=results.find((item:any)=>item.address_components.some((part:any)=>part.types.includes("country")&&part.short_name==="IN"));if(!result)throw Error();onChange({placeId:result.place_id,label:result.formatted_address,latitude:position.coords.latitude,longitude:position.coords.longitude});setAddress(result.formatted_address)}catch{setError("Could not identify your pickup address. Search or choose it on the map.")}},()=>setError("Location access was declined or unavailable. Enter your pickup address."),{timeout:10000,maximumAge:0,enableHighAccuracy:true})}catch{setError("Map search is unavailable. Enter your pickup address.")}}}>◎ Use current location</button>}
      {value && <p className={styles.selectedLocation}>✓ {value.label}</p>}
      {local && !fallback && (
        <button
          type="button"
          className={styles.smallLink}
          onClick={() => {
            setOpen(true);
            setPending(null);
          }}
        >
          Choose on map
        </button>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {open && (
        <div className={styles.modalBackdrop}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label={`Choose ${label} on map`}
            className={styles.mapDialog}
          >
            <div className={styles.dialogTop}>
              <h3>Choose {label.toLowerCase()}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close map"
              >
                ×
              </button>
            </div>
            <p>Tap the map to select an address in India.</p>
            <div ref={mapHost} className={styles.map} />
            <p>{pending?.label || "Select a pickup or drop point."}</p>
            <button
              type="button"
              className={styles.primary}
              disabled={!pending}
              onClick={() => {
                if (pending) onChange(pending);
                setOpen(false);
              }}
            >
              Use this location
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
