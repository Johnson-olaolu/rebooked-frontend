import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Search } from "lucide-react";
import { Input } from "~/components/ui/input";
import { hasGoogleMapsKey, loadPlaces } from "~/lib/google-maps";
import type { IAddress } from "~/types/user";
import { parsePlace, PLACE_FIELDS } from "~/utils/place";

interface PlaceSearchProps {
    onSelect: (address: IAddress) => void;
}

interface Suggestion {
    id: string;
    main: string;
    secondary: string;
    prediction: google.maps.places.PlacePrediction;
}

const DEBOUNCE_MS = 250;

/**
 * Google Places (New) autocomplete restricted to Nigeria. Renders nothing when
 * no API key is configured, so the manual fields still work on their own.
 */
const PlaceSearch = ({ onSelect }: PlaceSearchProps) => {
    const listId = useId();
    const [places, setPlaces] = useState<google.maps.PlacesLibrary | null>(null);
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const [loading, setLoading] = useState(false);
    const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
    const skipNextFetch = useRef(false);

    useEffect(() => {
        let cancelled = false;
        loadPlaces().then((library) => {
            if (!cancelled) setPlaces(library);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!places) return;
        if (skipNextFetch.current) {
            skipNextFetch.current = false;
            return;
        }
        const input = query.trim();
        if (input.length < 2) {
            setSuggestions([]);
            return;
        }

        let cancelled = false;
        const timer = setTimeout(async () => {
            sessionToken.current ??= new places.AutocompleteSessionToken();
            try {
                const { suggestions: results } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
                    input,
                    sessionToken: sessionToken.current,
                    includedRegionCodes: ["ng"],
                });
                if (cancelled) return;
                setSuggestions(
                    results
                        .map((result) => result.placePrediction)
                        .filter((prediction): prediction is google.maps.places.PlacePrediction => !!prediction)
                        .map((prediction) => ({
                            id: prediction.placeId,
                            main: prediction.mainText?.text ?? prediction.text.text,
                            secondary: prediction.secondaryText?.text ?? "",
                            prediction,
                        })),
                );
                setActive(-1);
                setOpen(true);
            } catch (error) {
                console.error(error);
                if (!cancelled) setSuggestions([]);
            }
        }, DEBOUNCE_MS);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [query, places]);

    const choose = async (suggestion: Suggestion) => {
        setOpen(false);
        setLoading(true);
        skipNextFetch.current = true;
        setQuery(suggestion.main + (suggestion.secondary ? `, ${suggestion.secondary}` : ""));
        try {
            const place = suggestion.prediction.toPlace();
            await place.fetchFields({ fields: PLACE_FIELDS });
            onSelect(parsePlace(place));
        } catch (error) {
            console.error(error);
        } finally {
            // A session ends when a place's details are fetched.
            sessionToken.current = null;
            setLoading(false);
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (!open || suggestions.length === 0) return;
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((index) => (index + 1) % suggestions.length);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
        } else if (event.key === "Enter" && active >= 0) {
            event.preventDefault();
            choose(suggestions[active]);
        } else if (event.key === "Escape") {
            setOpen(false);
        }
    };

    if (!hasGoogleMapsKey() || !places) return null;

    return (
        <div className="relative flex flex-col gap-2">
            <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-foreground/40" />
                <Input
                    role="combobox"
                    aria-expanded={open && suggestions.length > 0}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
                    aria-label="Search for your area or street"
                    placeholder="Search for your area or street"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => suggestions.length > 0 && setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                    className="h-11 pl-9"
                    autoComplete="off"
                />
                {loading && (
                    <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-foreground/50">Loading…</span>
                )}
            </div>

            {open && suggestions.length > 0 && (
                <ul
                    id={listId}
                    role="listbox"
                    className="absolute top-full z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-[0_14px_34px_rgba(74,45,24,0.12)]"
                >
                    {suggestions.map((suggestion, index) => (
                        <li
                            key={suggestion.id}
                            id={`${listId}-${index}`}
                            role="option"
                            aria-selected={index === active}
                            onMouseDown={(event) => {
                                event.preventDefault();
                                choose(suggestion);
                            }}
                            onMouseEnter={() => setActive(index)}
                            className={`cursor-pointer px-3.5 py-2.5 text-sm ${index === active ? "bg-secondary" : ""}`}
                        >
                            <span className="font-semibold">{suggestion.main}</span>
                            {suggestion.secondary && <span className="text-foreground/55"> · {suggestion.secondary}</span>}
                        </li>
                    ))}
                    <li className="px-3.5 py-1.5 text-right text-[11px] text-foreground/40">Powered by Google</li>
                </ul>
            )}
        </div>
    );
};

export default PlaceSearch;
