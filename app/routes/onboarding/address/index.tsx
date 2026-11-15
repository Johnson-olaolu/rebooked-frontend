import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import AddressFields, {
    pickAddressErrors,
    toAddressFormValue,
    toAddressPayload,
    validateAddress,
    type AddressErrors,
    type AddressFieldKey,
} from "~/components/profile/AddressFields";
import { Button } from "~/components/ui/button";
import { useBaseStore } from "~/hooks/store";
import userService from "~/services/user.service";
import type { IUpdateProfilePayload } from "~/types/profile";
import { getErrorMessage, getFieldErrors } from "~/utils/https";

const OnboardingStepTwo = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const user = useBaseStore((state) => state.user);
    const setUser = useBaseStore((state) => state.setUser);
    const onboarding = useBaseStore((state) => state.onboarding);
    const resetOnboarding = useBaseStore((state) => state.resetOnboarding);

    const [address, setAddress] = useState(() => toAddressFormValue(user?.profile?.address));
    const [errors, setErrors] = useState<AddressErrors>({});

    const clearError = (key: AddressFieldKey) => setErrors(({ [key]: _removed, ...rest }) => rest);

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
            if (fieldErrors["address.location"]) {
                // Coordinates rejected: drop the Google data and let the user save without it.
                setAddress((current) => ({ ...current, google: {} }));
                toast.error(fieldErrors["address.location"]);
            }
            const addressErrors = pickAddressErrors(fieldErrors);
            if (Object.keys(addressErrors).length > 0) {
                setErrors(addressErrors);
                return;
            }
            if (!fieldErrors["address.location"]) {
                toast.error(getErrorMessage(error, "We couldn't save your location."));
            }
        },
    });

    const canSubmit = Object.keys(validateAddress(address)).length === 0 && !saveMutation.isPending;

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const nextErrors = validateAddress(address);
        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }
        if (!user) return;

        // Only send what step 1 collected; the backend keeps existing values for anything omitted.
        const payload: IUpdateProfilePayload = { address: toAddressPayload(address) };
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

            <AddressFields value={address} onChange={setAddress} errors={errors} onClearError={clearError} />

            <div className="mt-9 flex items-center gap-4">
                <Button
                    type="submit"
                    disabled={!canSubmit}
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
