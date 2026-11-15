const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
const CALLBACK_NAME = "__rebookedGoogleMapsReady";

let placesPromise: Promise<google.maps.PlacesLibrary | null> | null = null;

export const hasGoogleMapsKey = () => !!GOOGLE_MAPS_API_KEY;

/**
 * Loads the Google Maps JS API once and returns the Places library.
 * Resolves to null when no key is configured or the script fails, so callers
 * can fall back to manual entry.
 */
export const loadPlaces = (): Promise<google.maps.PlacesLibrary | null> => {
  if (typeof window === "undefined" || !GOOGLE_MAPS_API_KEY) return Promise.resolve(null);
  if (placesPromise) return placesPromise;

  placesPromise = new Promise<void>((resolve, reject) => {
    if (typeof (window as { google?: typeof google }).google?.maps?.importLibrary === "function") {
      resolve();
      return;
    }
    (window as unknown as Record<string, () => void>)[CALLBACK_NAME] = () => resolve();
    const params = new URLSearchParams({
      key: GOOGLE_MAPS_API_KEY,
      v: "weekly",
      loading: "async",
      libraries: "places",
      callback: CALLBACK_NAME,
    });
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  })
    .then(() => google.maps.importLibrary("places") as Promise<google.maps.PlacesLibrary>)
    .catch((error) => {
      console.error(error);
      placesPromise = null;
      return null;
    });

  return placesPromise;
};
