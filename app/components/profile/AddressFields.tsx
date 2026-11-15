import { toast } from "sonner";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import type { IAddress } from "~/types/user";
import { NG_COUNTRY_CODE, NG_COUNTRY_NAME, NG_STATES, normalizeNgState } from "~/utils/nigeria";
import PlaceSearch from "./PlaceSearch";

export type AddressFieldKey = "state" | "city" | "addressLine" | "country";
export type AddressErrors = Partial<Record<AddressFieldKey, string>>;

/** Google-only data; dropped when the user edits the location by hand. */
interface GooglePlaceData {
    formattedAddress?: string;
    placeId?: string;
    latitude?: number;
    longitude?: number;
}

export interface AddressFormValue {
    state: string;
    city: string;
    addressLine: string;
    google: GooglePlaceData;
}

export const toAddressFormValue = (address?: IAddress | null): AddressFormValue => ({
    state: normalizeNgState(address?.state) ?? "",
    city: address?.city ?? "",
    addressLine: address?.addressLine ?? "",
    google: {
        formattedAddress: address?.formattedAddress,
        placeId: address?.placeId,
        latitude: address?.latitude,
        longitude: address?.longitude,
    },
});

/**
 * Builds the address body for PATCH /user/{id}/profile. Empty strings clear
 * optional fields; without coordinates, `placeId: ""` tells the API to drop any
 * stored Google data so stale coordinates can't outlive a hand-edited address.
 */
export const toAddressPayload = (value: AddressFormValue): IAddress => {
    const { latitude, longitude, placeId, formattedAddress } = value.google;
    const hasCoordinates = latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null;
    return {
        country: NG_COUNTRY_CODE,
        state: value.state,
        city: value.city.trim(),
        addressLine: value.addressLine.trim(),
        ...(hasCoordinates
            ? { latitude, longitude, placeId: placeId ?? "", formattedAddress: formattedAddress ?? "" }
            : { placeId: "", formattedAddress: "" }),
    };
};

export const validateAddress = (value: AddressFormValue): AddressErrors => {
    const errors: AddressErrors = {};
    if (!value.state) errors.state = "State is required";
    if (!value.city.trim()) errors.city = "City is required";
    return errors;
};

/** Picks `address.*` messages out of an API `errors` map. */
export const pickAddressErrors = (fieldErrors: Record<string, string>): AddressErrors => {
    const errors: AddressErrors = {};
    (["state", "city", "addressLine", "country"] as const).forEach((key) => {
        const message = fieldErrors[`address.${key}`];
        if (message) errors[key] = message;
    });
    return errors;
};

interface AddressFieldsProps {
    value: AddressFormValue;
    onChange: (value: AddressFormValue) => void;
    errors?: AddressErrors;
    onClearError?: (key: AddressFieldKey) => void;
}

/** Google search (when a key is configured) + Nigeria / state / city / private street address. */
const AddressFields = ({ value, onChange, errors = {}, onClearError }: AddressFieldsProps) => {
    const update = (patch: Partial<AddressFormValue>, clear?: AddressFieldKey) => {
        onChange({ ...value, ...patch });
        if (clear) onClearError?.(clear);
    };

    const handlePlaceSelect = (address: IAddress) => {
        if (address.country && address.country !== NG_COUNTRY_CODE) {
            toast.error("Rebooked is only available in Nigeria for now.");
            return;
        }
        onChange({
            state: address.state ?? value.state,
            city: address.city ?? value.city,
            addressLine: address.addressLine ?? "",
            google: {
                formattedAddress: address.formattedAddress,
                placeId: address.placeId,
                latitude: address.latitude,
                longitude: address.longitude,
            },
        });
        (["state", "city", "addressLine", "country"] as const).forEach((key) => onClearError?.(key));
        if (!address.state || !address.city) {
            toast("We filled what we could — please check your state and city.");
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <PlaceSearch onSelect={handlePlaceSelect} />

            <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" value={NG_COUNTRY_NAME} readOnly disabled aria-invalid={!!errors.country} />
                    {errors.country && <span className="text-sm text-destructive">{errors.country}</span>}
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="state">State</Label>
                    <select
                        id="state"
                        name="state"
                        value={value.state}
                        // Coordinates from Google no longer match a hand-picked state.
                        onChange={(event) => update({ state: event.target.value, google: {} }, "state")}
                        aria-invalid={!!errors.state}
                        className={cn(
                            "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2 py-1 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm",
                            !value.state && "text-muted-foreground",
                        )}
                    >
                        <option value="" disabled>
                            Select a state
                        </option>
                        {NG_STATES.map((name) => (
                            <option key={name} value={name} className="text-foreground">
                                {name}
                            </option>
                        ))}
                    </select>
                    {errors.state && <span className="text-sm text-destructive">{errors.state}</span>}
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="city">City or town</Label>
                <Input
                    id="city"
                    name="city"
                    placeholder="Ikeja"
                    value={value.city}
                    onChange={(event) => update({ city: event.target.value }, "city")}
                    aria-invalid={!!errors.city}
                />
                {errors.city && <span className="text-sm text-destructive">{errors.city}</span>}
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="addressLine">
                    Street address <span className="font-normal text-foreground/50">(optional)</span>
                </Label>
                <Input
                    id="addressLine"
                    name="addressLine"
                    placeholder="12 Allen Avenue"
                    value={value.addressLine}
                    onChange={(event) => update({ addressLine: event.target.value }, "addressLine")}
                    aria-invalid={!!errors.addressLine}
                    autoComplete="street-address"
                />
                {errors.addressLine ? (
                    <span className="text-sm text-destructive">{errors.addressLine}</span>
                ) : (
                    <span className="text-sm text-foreground/50">Private — never shown on your listings.</span>
                )}
            </div>
        </div>
    );
};

export default AddressFields;
