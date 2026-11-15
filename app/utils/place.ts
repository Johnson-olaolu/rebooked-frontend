import type { IAddress } from "~/types/user";
import { normalizeNgState } from "./nigeria";

type AddressComponent = google.maps.places.AddressComponent;

const find = (components: AddressComponent[], ...types: string[]) => {
  for (const type of types) {
    const match = components.find((component) => component.types.includes(type));
    if (match) return match;
  }
  return undefined;
};

/** Fields fetched for a selected place; keep in sync with parsePlace. */
export const PLACE_FIELDS = ["addressComponents", "formattedAddress", "location", "id"];

/** Turns a Google Place (Places API New) into our structured address. */
export const parsePlace = (place: google.maps.places.Place): IAddress => {
  const components = place.addressComponents ?? [];

  const country = find(components, "country")?.shortText ?? undefined;
  const stateName = find(components, "administrative_area_level_1")?.longText;
  const city = find(components, "locality", "postal_town", "sublocality_level_1", "sublocality", "administrative_area_level_2")
    ?.longText;

  const streetNumber = find(components, "street_number")?.longText;
  const route = find(components, "route")?.longText;
  const street = [streetNumber, route].filter(Boolean).join(" ");
  const addressLine = street || find(components, "premise", "neighborhood", "sublocality_level_2")?.longText || undefined;

  return {
    country: country ?? undefined,
    state: normalizeNgState(stateName) ?? undefined,
    city: city ?? undefined,
    addressLine,
    formattedAddress: place.formattedAddress ?? undefined,
    placeId: place.id,
    latitude: place.location?.lat(),
    longitude: place.location?.lng(),
  };
};
