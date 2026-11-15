import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import AddressFields, {
    pickAddressErrors,
    toAddressFormValue,
    toAddressPayload,
    validateAddress,
    type AddressFieldKey,
    type AddressFormValue,
} from "~/components/profile/AddressFields";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import UserAvatar from "~/components/UserAvatar";
import { useBaseStore } from "~/hooks/store";
import fileService from "~/services/file.service";
import userService from "~/services/user.service";
import type { IUpdateProfilePayload } from "~/types/profile";
import type { IUser } from "~/types/user";
import { isValidEmail } from "~/utils/auth";
import { getErrorMessage, getFieldErrors } from "~/utils/https";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const BIO_MAX = 300;
const NG_PHONE = /^(\+234|0)[789][01]\d{8}$/;

type FieldKey = "fullName" | "userName" | "bio" | "contactEmail" | "contactPhone";

interface FormValues {
    fullName: string;
    userName: string;
    bio: string;
    contactEmail: string;
    contactPhone: string;
    address: AddressFormValue;
}

/** undefined = unchanged, "" = remove, otherwise the id of a newly uploaded file. */
type PhotoChange = { id: string; url: string } | "remove" | undefined;

const toFormValues = (user?: IUser): FormValues => ({
    fullName: user?.fullName ?? "",
    userName: user?.profile?.userName ?? "",
    bio: user?.profile?.bio ?? "",
    contactEmail: user?.profile?.contactEmail ?? "",
    contactPhone: user?.profile?.contactPhone ?? "",
    address: toAddressFormValue(user?.profile?.address),
});

const validate = (values: FormValues) => {
    const errors: Partial<Record<FieldKey, string>> = {};
    const fullName = values.fullName.trim();
    const userName = values.userName.trim();
    if (!fullName) errors.fullName = "Full name is required";
    else if (fullName.length > 80) errors.fullName = "Keep it under 80 characters";
    if (userName.length < 2) errors.userName = "Display name needs at least 2 characters";
    else if (userName.length > 40) errors.userName = "Keep it under 40 characters";
    if (values.bio.length > BIO_MAX) errors.bio = `Keep it under ${BIO_MAX} characters`;
    if (values.contactEmail.trim() && !isValidEmail(values.contactEmail)) errors.contactEmail = "Enter a valid email";
    if (values.contactPhone.trim() && !NG_PHONE.test(values.contactPhone.replace(/[\s-]/g, ""))) {
        errors.contactPhone = "Use a Nigerian number, e.g. 0803 123 4567 or +234 803 123 4567";
    }
    return errors;
};

const Section = ({ title, description, children }: { title: string; description?: string; children: ReactNode }) => (
    <section className="grid gap-5 rounded-lg border border-foreground/10 bg-card p-6 md:grid-cols-[220px_1fr] md:gap-8">
        <div>
            <h2 className="font-serif text-xl">{title}</h2>
            {description && <p className="mt-1 text-sm leading-relaxed text-foreground/55">{description}</p>}
        </div>
        <div className="flex flex-col gap-4">{children}</div>
    </section>
);

const FieldError = ({ message, hint }: { message?: string; hint?: ReactNode }) =>
    message ? (
        <span className="text-sm text-destructive">{message}</span>
    ) : hint ? (
        <span className="text-sm text-foreground/50">{hint}</span>
    ) : null;

const SettingsPage = () => {
    const queryClient = useQueryClient();
    const user = useBaseStore((state) => state.user);
    const setUser = useBaseStore((state) => state.setUser);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const initial = useMemo(() => toFormValues(user), [user]);
    const [values, setValues] = useState<FormValues>(initial);
    const [photo, setPhoto] = useState<PhotoChange>(undefined);
    const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
    const [addressErrors, setAddressErrors] = useState<Partial<Record<AddressFieldKey, string>>>({});

    // When fresh user data arrives (e.g. /user/me), refresh the form unless the user has started editing.
    const lastInitial = useRef(initial);
    useEffect(() => {
        const previous = JSON.stringify(lastInitial.current);
        setValues((current) => (JSON.stringify(current) === previous ? initial : current));
        lastInitial.current = initial;
    }, [initial]);

    const dirty = photo !== undefined || JSON.stringify(values) !== JSON.stringify(initial);

    const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
        setValues((current) => ({ ...current, [key]: value }));
        if (key in errors) setErrors(({ [key as FieldKey]: _removed, ...rest }) => rest);
    };

    const reset = () => {
        setValues(initial);
        setPhoto(undefined);
        setErrors({});
        setAddressErrors({});
    };

    const uploadMutation = useMutation({
        mutationFn: (file: File) => fileService.upload(file),
        onSuccess: ({ data }) => setPhoto({ id: data.id, url: data.url }),
        onError: (error) => toast.error(getErrorMessage(error, "We couldn't upload that photo.")),
    });

    const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        if (!file.type.startsWith("image/")) return void toast.error("Please choose an image file.");
        if (file.size > MAX_PHOTO_BYTES) return void toast.error("That photo is over 10MB. Please choose a smaller one.");
        uploadMutation.mutate(file);
    };

    const saveMutation = useMutation({
        mutationFn: async (next: FormValues) => {
            if (!user) throw new Error("Not logged in");
            const profile: IUpdateProfilePayload = {
                userName: next.userName.trim(),
                bio: next.bio.trim(),
                contactEmail: next.contactEmail.trim(),
                contactPhone: next.contactPhone.replace(/[\s-]/g, ""),
                address: toAddressPayload(next.address),
            };
            if (photo === "remove") profile.profilePictureId = "";
            else if (photo) profile.profilePictureId = photo.id;

            const saved = await userService.updateProfile(user.id, profile);
            const fullName = next.fullName.trim();
            if (fullName !== user.fullName) {
                await userService.updateUser(user.id, { fullName });
            }
            // The profile response predates the name change, so apply it here.
            return { ...saved.data, fullName };
        },
        onSuccess: (saved) => {
            setUser(saved);
            // Show the values as the server stored them (e.g. normalised phone number).
            setValues(toFormValues(saved));
            setPhoto(undefined);
            // Refetch so the stored user reflects both updates (incl. the full name).
            queryClient.invalidateQueries({ queryKey: ["user"] });
            toast.success("Profile saved.");
        },
        onError: (error) => {
            const fieldErrors = getFieldErrors(error);
            const mine: Partial<Record<FieldKey, string>> = {};
            (["fullName", "userName", "bio", "contactEmail", "contactPhone"] as const).forEach((key) => {
                if (fieldErrors[key]) mine[key] = fieldErrors[key];
            });
            setErrors(mine);
            setAddressErrors(pickAddressErrors(fieldErrors));
            if (fieldErrors["address.location"]) set("address", { ...values.address, google: {} });
            toast.error(getErrorMessage(error, "We couldn't save your profile."));
        },
    });

    // Once something changes, show rule breaks as you type (Save stays disabled until they're fixed).
    const liveErrors = dirty ? validate(values) : {};
    const liveAddressErrors = dirty ? validateAddress(values.address) : {};
    const shownErrors = { ...liveErrors, ...errors };
    const shownAddressErrors = { ...liveAddressErrors, ...addressErrors };
    const valid = Object.keys(liveErrors).length === 0 && Object.keys(liveAddressErrors).length === 0;

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const nextErrors = validate(values);
        const nextAddressErrors = validateAddress(values.address);
        setErrors(nextErrors);
        setAddressErrors(nextAddressErrors);
        // Save is disabled until this passes; this only guards against odd submits.
        if (Object.keys(nextErrors).length > 0 || Object.keys(nextAddressErrors).length > 0) return;
        saveMutation.mutate(values);
    };

    if (!user) return null;

    const previewUser: IUser =
        photo === undefined
            ? user
            : {
                  ...user,
                  profile: {
                      ...user.profile!,
                      profilePictureUrl: photo === "remove" ? null : photo.url,
                  },
              };
    const hasPhoto = !!previewUser.profile?.profilePictureUrl;
    const saving = saveMutation.isPending;

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
                <h1 className="font-serif text-3xl md:text-4xl">Profile settings</h1>
                <p className="mt-1.5 text-foreground/60">This is what buyers see on your shelf and in messages.</p>
            </div>

            <Section title="Profile" description="Your photo and display name appear on your shelf.">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <UserAvatar user={previewUser} className="size-20 text-2xl" />
                        {uploadMutation.isPending && (
                            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70 text-xs">
                                Uploading…
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={uploadMutation.isPending || saving}
                            onClick={() => fileInputRef.current?.click()}
                            className="h-10 rounded-md px-4 font-semibold"
                        >
                            {hasPhoto ? "Change photo" : "Upload a photo"}
                        </Button>
                        {hasPhoto && (
                            <Button
                                type="button"
                                variant="ghost"
                                disabled={uploadMutation.isPending || saving}
                                onClick={() => setPhoto(user.profile?.profilePictureUrl ? "remove" : undefined)}
                                className="h-10 rounded-md px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                                Remove
                            </Button>
                        )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="userName">Display name</Label>
                    <Input
                        id="userName"
                        value={values.userName}
                        onChange={(event) => set("userName", event.target.value)}
                        aria-invalid={!!shownErrors.userName}
                        maxLength={40}
                    />
                    <FieldError message={shownErrors.userName} hint="Shown on your shelf and in conversations." />
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="bio">
                        Bio <span className="font-normal text-foreground/50">(optional)</span>
                    </Label>
                    <textarea
                        id="bio"
                        rows={4}
                        value={values.bio}
                        onChange={(event) => set("bio", event.target.value)}
                        aria-invalid={!!shownErrors.bio}
                        placeholder="Mostly textbooks and Nigerian fiction. Happy to meet around Yaba."
                        className="w-full min-w-0 resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm"
                    />
                    <FieldError message={shownErrors.bio} hint={`${values.bio.length}/${BIO_MAX}`} />
                </div>
            </Section>

            <Section title="Account" description="Your login details.">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input
                        id="fullName"
                        value={values.fullName}
                        onChange={(event) => set("fullName", event.target.value)}
                        aria-invalid={!!shownErrors.fullName}
                        maxLength={80}
                        autoComplete="name"
                    />
                    <FieldError message={shownErrors.fullName} />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user.email} readOnly disabled />
                    <FieldError hint="Changing your login email isn't available yet." />
                </div>
            </Section>

            <Section title="Contact details" description="Optional ways for buyers to reach you.">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="contactEmail">
                        Contact email <span className="font-normal text-foreground/50">(optional)</span>
                    </Label>
                    <Input
                        id="contactEmail"
                        type="email"
                        value={values.contactEmail}
                        onChange={(event) => set("contactEmail", event.target.value)}
                        aria-invalid={!!shownErrors.contactEmail}
                        placeholder="you@example.com"
                    />
                    <FieldError message={shownErrors.contactEmail} />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="contactPhone">
                        Phone number <span className="font-normal text-foreground/50">(optional)</span>
                    </Label>
                    <Input
                        id="contactPhone"
                        type="tel"
                        value={values.contactPhone}
                        onChange={(event) => set("contactPhone", event.target.value)}
                        aria-invalid={!!shownErrors.contactPhone}
                        placeholder="0803 123 4567"
                        autoComplete="tel"
                    />
                    <FieldError message={shownErrors.contactPhone} />
                </div>
            </Section>

            <Section title="Location" description="Only your state and city are shown to buyers.">
                <AddressFields
                    value={values.address}
                    onChange={(address) => set("address", address)}
                    errors={shownAddressErrors}
                    onClearError={(key) => setAddressErrors(({ [key]: _removed, ...rest }) => rest)}
                />
            </Section>

            <div className="sticky bottom-20 z-10 flex items-center justify-end gap-3 rounded-lg border border-foreground/10 bg-card/95 p-3 backdrop-blur md:bottom-4">
                {dirty && <span className="mr-auto pl-2 text-sm text-foreground/60">You have unsaved changes</span>}
                <Button
                    type="button"
                    variant="ghost"
                    disabled={!dirty || saving}
                    onClick={reset}
                    className="h-11 rounded-md px-4"
                >
                    Discard
                </Button>
                <Button
                    type="submit"
                    disabled={!dirty || !valid || saving || uploadMutation.isPending}
                    className="h-11 rounded-md bg-primary px-6 text-[15px] font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90"
                >
                    {saving ? "Saving…" : "Save changes"}
                </Button>
            </div>
        </form>
    );
};

export default SettingsPage;
