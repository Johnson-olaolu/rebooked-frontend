import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useBaseStore } from "~/hooks/store";
import { cn } from "~/lib/utils";
import userService from "~/services/user.service";
import type { IUpdateProfilePayload } from "~/types/profile";
import type { IAddress } from "~/types/user";
import { getErrorMessage, getFieldErrors } from "~/utils/https";
import { NG_COUNTRY_CODE, NG_COUNTRY_NAME, NG_STATES, normalizeNgState } from "~/utils/nigeria";
import PlaceSearch from "../components/PlaceSearch";

type FieldKey = "state" | "city" | "addressLine" | "country";

/** Google-only data that must be dropped if the user edits the location by hand. */
interface GooglePlaceData {
    formattedAddress?: string;
    placeId?: string;
    latitude?: number;
    longitude?: number;
}

const OnboardingStepTwo = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const user = useBaseStore((state) => state.user);
    const setUser = useBaseStore((state) => state.setUser);
    const onboarding = useBaseStore((state) => state.onboarding);
    const resetOnboarding = useBaseStore((state) => state.resetOnboarding);

    const saved = user?.profile?.address;
    const [state, setState] = useState<string>(normalizeNgState(saved?.state) ?? "");
    const [city, setCity] = useState(saved?.city ?? "");
    const [addressLine, setAddressLine] = useState(saved?.addressLine ?? "");
    const [google, setGoogle] = useState<GooglePlaceData>({
        formattedAddress: saved?.formattedAddress,
        placeId: saved?.placeId,
        latitude: saved?.latitude,
        longitude: saved?.longitude,
    });
    const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});

    const clearError = (key: FieldKey) => {
        if (errors[key]) setErrors(({ [key]: _removed, ...rest }) => rest);
    };

    const handlePlaceSelect = (address: IAddress) => {
        if (address.country && address.country !== NG_COUNTRY_CODE) {
            toast.error("Rebooked is only available in Nigeria for now.");
            return;
        }
        if (address.state) setState(address.state);
        if (address.city) setCity(address.city);
        setAddressLine(address.addressLine ?? "");
        setGoogle({
            formattedAddress: address.formattedAddress,
            placeId: address.placeId,
            latitude: address.latitude,
            longitude: address.longitude,
        });
        setErrors({});
        if (!address.state || !address.city) {
            toast("We filled what we could — please check your state and city.");
        }
    };

    const saveMutation = useMutation({
        mutationFn: (payload: IUpdateProfilePayload) => userService.updateProfile(user!.id, payload),
        onSuccess: ({ data }) => {
            setUser(data);
            queryClient.setQueryData(["user"], { data });
            resetOnboarding();
            toast.success("You're all set.");
            navigate("/dashboard", { replace: true });
        },
        onError: (error) => {
            const fieldErrors = getFieldErrors(error);
            if (fieldErrors.userName) {
                navigate("/onboarding/profile", { state: { userNameError: fieldErrors.userName } });
                return;
            }
            const addressErrors: Partial<Record<FieldKey, string>> = {};
            (["state", "city", "addressLine", "country"] as const).forEach((key) => {
                const message = fieldErrors[`address.${key}`];
                if (message) addressErrors[key] = message;
            });
            if (fieldErrors["address.location"]) {
                // Coordinates rejected: drop the Google data and let the user save without it.
                setGoogle({});
                toast.error(fieldErrors["address.location"]);
            }
            if (Object.keys(addressErrors).length > 0) {
                setErrors(addressErrors);
                return;
            }
            if (!fieldErrors["address.location"]) {
                toast.error(getErrorMessage(error, "We couldn't save your location."));
            }
        },
    });

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const nextErrors: Partial<Record<FieldKey, string>> = {};
        if (!state) nextErrors.state = "State is required";
        if (!city.trim()) nextErrors.city = "City is required";
        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }
        if (!user) return;

        const hasCoordinates = google.latitude !== undefined && google.longitude !== undefined;
        const address: IAddress = {
            country: NG_COUNTRY_CODE,
            state,
            city: city.trim(),
            addressLine: addressLine.trim() || undefined,
            formattedAddress: google.formattedAddress,
            placeId: google.placeId,
            ...(hasCoordinates ? { latitude: google.latitude, longitude: google.longitude } : {}),
        };

        // Only send what step 1 collected; the backend keeps existing values for anything omitted.
        const payload: IUpdateProfilePayload = { address };
        if (onboarding.userName) payload.userName = onboarding.userName;
        if (onboarding.profilePictureId) payload.profilePictureId = onboarding.profilePictureId;
        saveMutation.mutate(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col">
            <h1 className="mb-2 font-serif text-4xl leading-tight">Where are you handing books over?</h1>
            <p className="mb-7 leading-relaxed text-foreground/65">
                We use this to show your books to buyers nearby. Only your state and city are ever shown — never your
                street address.
            </p>

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
                            value={state}
                            onChange={(event) => {
                                setState(event.target.value);
                                // Coordinates from Google no longer match a hand-picked state.
                                setGoogle({});
                                clearError("state");
                            }}
                            aria-invalid={!!errors.state}
                            className={cn(
                                "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2 py-1 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm",
                                !state && "text-muted-foreground",
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
                        value={city}
                        onChange={(event) => {
                            setCity(event.target.value);
                            clearError("city");
                        }}
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
                        value={addressLine}
                        onChange={(event) => {
                            setAddressLine(event.target.value);
                            clearError("addressLine");
                        }}
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

            <div className="mt-9 flex items-center gap-4">
                <Button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="h-12 rounded-lg bg-primary px-7 text-base font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90"
                >
                    {saveMutation.isPending ? "Saving…" : "Take me to my dashboard"}
                </Button>
                <button
                    type="button"
                    onClick={() => navigate("/onboarding/profile")}
                    disabled={saveMutation.isPending}
                    className="text-foreground/55 hover:text-foreground"
                >
                    Back
                </button>
            </div>
        </form>
    );
};

export default OnboardingStepTwo;
