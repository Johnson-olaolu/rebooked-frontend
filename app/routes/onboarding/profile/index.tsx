import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useBaseStore } from "~/hooks/store";
import fileService from "~/services/file.service";
import { getErrorMessage } from "~/utils/https";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

const OnboardingStepOne = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = useBaseStore((state) => state.user);
    const onboarding = useBaseStore((state) => state.onboarding);
    const setOnboarding = useBaseStore((state) => state.setOnboarding);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Error passed back from step 2 when the API rejects the display name.
    const returnedError = (location.state as { userNameError?: string } | null)?.userNameError;
    const [userName, setUserName] = useState(onboarding.userName || user?.profile?.userName || "");
    const [userNameError, setUserNameError] = useState(returnedError ?? "");
    const [preview, setPreview] = useState(onboarding.profilePictureUrl || user?.profile?.profilePictureUrl || "");

    const firstName = user?.fullName?.split(" ")[0];

    const uploadMutation = useMutation({
        mutationFn: (file: File) => fileService.upload(file),
        onSuccess: ({ data }) => {
            setOnboarding({ profilePictureId: data.id, profilePictureUrl: data.url });
            setPreview(data.url);
            toast.success("Photo uploaded.");
        },
        onError: (error) => {
            setPreview(onboarding.profilePictureUrl || "");
            toast.error(getErrorMessage(error, "We couldn't upload that photo."));
        },
    });

    const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Please choose an image file.");
            return;
        }
        if (file.size > MAX_PHOTO_BYTES) {
            toast.error("That photo is over 10MB. Please choose a smaller one.");
            return;
        }
        setPreview(URL.createObjectURL(file));
        uploadMutation.mutate(file);
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!userName.trim()) {
            setUserNameError("Display name is required");
            return;
        }
        setOnboarding({ userName: userName.trim() });
        navigate("/onboarding/address");
    };

    const handleSkip = () => {
        setOnboarding({ userName: userName.trim() });
        navigate("/onboarding/address");
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="flex flex-col">
                <h1 className="mb-2 font-serif text-4xl leading-tight">
                    Welcome to Rebooked{firstName ? `, ${firstName}` : ""}
                </h1>
                <p className="mb-8 leading-relaxed text-foreground/65">
                    Two quick things and you're in. This is what buyers see when they message you.
                </p>

                <div className="mb-7 flex items-center gap-5">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="relative flex size-[92px] flex-none items-center justify-center overflow-hidden rounded-full border border-dashed border-foreground/30 bg-secondary text-center text-xs text-foreground/45"
                        aria-label="Upload a profile picture"
                    >
                        {preview ? (
                            <img src={preview} alt="Your profile" className="size-full object-cover" />
                        ) : (
                            <span>
                                Add
                                <br />
                                photo
                            </span>
                        )}
                        {uploadMutation.isPending && (
                            <span className="absolute inset-0 flex items-center justify-center bg-background/70 text-xs text-foreground/70">
                                Uploading…
                            </span>
                        )}
                    </button>
                    <div>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={uploadMutation.isPending}
                            onClick={() => fileInputRef.current?.click()}
                            className="h-auto rounded-md px-4.5 py-2.5 font-semibold"
                        >
                            {preview ? "Change picture" : "Upload a picture"}
                        </Button>
                        <p className="mt-2 text-sm text-foreground/50">
                            Optional, but profiles with a face get about twice the replies.
                        </p>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="userName">Display name</Label>
                    <Input
                        id="userName"
                        name="userName"
                        placeholder="Thandi M."
                        value={userName}
                        onChange={(event) => {
                            setUserName(event.target.value);
                            if (userNameError) setUserNameError("");
                        }}
                        aria-invalid={!!userNameError}
                        autoFocus
                    />
                    {userNameError ? (
                        <span className="text-sm text-destructive">{userNameError}</span>
                    ) : (
                        <span className="text-sm text-foreground/50">
                            Shown on your shelf and in conversations. You can change it later.
                        </span>
                    )}
                </div>
            </div>

            <div className="mt-9 flex items-center gap-4">
                <Button
                    type="submit"
                    disabled={!userName.trim() || uploadMutation.isPending}
                    className="h-12 rounded-lg bg-primary px-7 text-base font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90"
                >
                    Continue
                </Button>
                <button
                    type="button"
                    onClick={handleSkip}
                    disabled={uploadMutation.isPending}
                    className="text-foreground/55 hover:text-foreground"
                >
                    Skip for now
                </button>
            </div>
        </form>
    );
};

export default OnboardingStepOne;
