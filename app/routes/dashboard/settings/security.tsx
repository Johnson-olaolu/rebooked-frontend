import { useMutation } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import PasswordRules from "~/components/auth/PasswordRules";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { useBaseStore } from "~/hooks/store";
import authService from "~/services/auth.service";
import { isValidPassword } from "~/utils/auth";
import { getErrorMessage, getErrorStatus, getFieldErrors } from "~/utils/https";
import SettingsHeader from "./SettingsHeader";

type FieldKey = "currentPassword" | "newPassword";

const PROVIDER_NAMES = { GOOGLE: "Google", FACEBOOK: "Facebook" } as const;

const Section = ({
    title,
    description,
    soon,
    children,
}: {
    title: string;
    description?: ReactNode;
    /** Not built yet: shown greyed out with a "Coming soon" tag, and nothing in it can be used. */
    soon?: boolean;
    children: ReactNode;
}) => (
    <section
        aria-disabled={soon || undefined}
        className="grid gap-5 rounded-lg border border-foreground/10 bg-card p-6 md:grid-cols-[220px_1fr] md:gap-8"
    >
        <div className={soon ? "opacity-60" : undefined}>
            <h2 className="flex flex-wrap items-center gap-2 font-serif text-xl">
                {title}
                {soon && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 font-sans text-xs font-semibold text-foreground/60">
                        Coming soon
                    </span>
                )}
            </h2>
            {description && <p className="mt-1 text-sm leading-relaxed text-foreground/55">{description}</p>}
        </div>
        {soon ? (
            <fieldset disabled className="flex max-w-md flex-col gap-4 opacity-60">
                {children}
            </fieldset>
        ) : (
            <div className="flex max-w-md flex-col gap-4">{children}</div>
        )}
    </section>
);

/** A switch row inside a "Coming soon" section. */
const SoonToggle = ({ id, label, description }: { id: string; label: string; description: string }) => (
    <div className="flex items-start justify-between gap-4">
        <div>
            <Label htmlFor={id}>{label}</Label>
            <p className="mt-1 text-sm leading-relaxed text-foreground/55">{description}</p>
        </div>
        <Switch id={id} checked={false} disabled />
    </div>
);

/** Planned security features. Disabled until the backend supports them. */
const ComingSoon = () => (
    <>
        <Section
            title="Two-step verification"
            description="Keep your account safe even if someone gets your password."
            soon
        >
            <SoonToggle
                id="twoStepApp"
                label="Authenticator app"
                description="When you log in, enter a code from an app like Google Authenticator or 1Password."
            />
            <SoonToggle
                id="twoStepEmail"
                label="Code by email"
                description="When you log in on a new device, enter a code we email you."
            />
        </Section>
        <Section title="Login alerts" description="Know when your account is used somewhere new." soon>
            <SoonToggle
                id="loginAlerts"
                label="Email me about new logins"
                description="We'll email you when someone logs in from a device or browser you haven't used before."
            />
        </Section>
        <Section title="Where you're logged in" description="Devices and browsers that are logged in to your account." soon>
            <p className="text-sm leading-relaxed text-foreground/70">
                See each device, when it was last used and roughly where, and log out any you don't recognise.
            </p>
            <div>
                <Button type="button" variant="outline" className="h-10 rounded-md px-4 font-semibold">
                    Log out all other devices
                </Button>
            </div>
        </Section>
    </>
);

/** Emails a reset link to the signed-in user, for when they've forgotten their current password. */
const useResetLink = (email?: string) => {
    const [sentTo, setSentTo] = useState<string | null>(null);
    const mutation = useMutation({
        mutationFn: () => authService.forgotPassword(email!),
        onSuccess: () => setSentTo(email!),
        onError: (error) => toast.error(getErrorMessage(error, "We couldn't send the email. Try again.")),
    });
    return { send: () => email && mutation.mutate(), sending: mutation.isPending, sentTo };
};

const SentNote = ({ email }: { email: string }) => (
    <p role="status" className="rounded-lg bg-olive/10 px-4 py-3 text-sm leading-relaxed text-olive">
        We've sent a link to <span className="font-semibold">{email}</span>. It expires in 15 minutes.
    </p>
);

/** /dashboard/settings/security: change your password (or get a reset link), plus security features still to come. */
const SecuritySettingsPage = () => {
    const user = useBaseStore((state) => state.user);
    const setTokens = useBaseStore((state) => state.setTokens);
    const setUser = useBaseStore((state) => state.setUser);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
    const resetLink = useResetLink(user?.email);

    useEffect(() => {
        document.title = "Security · Rebooked";
    }, []);

    const changeMutation = useMutation({
        mutationFn: () => authService.changePassword({ currentPassword, newPassword }),
        onSuccess: ({ data }) => {
            // Every other session was signed out, this one included; carry on with the new tokens.
            if (data?.token) setTokens({ accessToken: data.token, refreshToken: data.refreshToken, expiresIn: data.expiresIn });
            if (data?.user) setUser(data.user);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setErrors({});
            toast.success("Password changed. You've been logged out on your other devices.");
        },
        onError: (error) => {
            const fields = getFieldErrors(error);
            const mine: Partial<Record<FieldKey, string>> = {};
            if (fields.currentPassword) mine.currentPassword = fields.currentPassword;
            if (fields.newPassword) mine.newPassword = fields.newPassword;
            setErrors(mine);
            if (Object.keys(mine).length === 0) {
                toast.error(
                    getErrorStatus(error) === 404
                        ? "Changing your password isn't available yet. Use “Forgot your current password?” for now."
                        : getErrorMessage(error, "We couldn't change your password."),
                );
            }
        },
    });

    if (!user) return null;

    // Google/Facebook accounts can't log in with a password, so there's nothing to change here.
    const provider = user.registrationType !== "EMAIL" ? PROVIDER_NAMES[user.registrationType] : null;
    const hasPassword = !provider;

    const saving = changeMutation.isPending;
    const matches = confirmPassword === newPassword;
    const sameAsCurrent = !!newPassword && newPassword === currentPassword;
    const canSave = !!currentPassword && isValidPassword(newPassword) && matches && !sameAsCurrent && !saving;

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (canSave) changeMutation.mutate();
    };

    return (
        <div className="flex flex-col gap-6">
            <SettingsHeader description="Keep your account secure." />

            {hasPassword ? (
                <form onSubmit={handleSubmit}>
                    <Section
                        title="Change password"
                        description="You'll stay logged in here. Anywhere else you're logged in will need the new password."
                    >
                        {/* Lets password managers match the change to this account. */}
                        <input type="email" name="email" autoComplete="username" value={user.email} readOnly hidden />
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="currentPassword">Current password</Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                autoComplete="current-password"
                                value={currentPassword}
                                onChange={(event) => {
                                    setCurrentPassword(event.target.value);
                                    setErrors(({ currentPassword: _removed, ...rest }) => rest);
                                }}
                                aria-invalid={!!errors.currentPassword}
                            />
                            {errors.currentPassword && <span className="text-sm text-destructive">{errors.currentPassword}</span>}
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="newPassword">New password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                autoComplete="new-password"
                                value={newPassword}
                                onChange={(event) => {
                                    setNewPassword(event.target.value);
                                    setErrors(({ newPassword: _removed, ...rest }) => rest);
                                }}
                                aria-invalid={!!errors.newPassword || sameAsCurrent}
                            />
                            {newPassword && <PasswordRules password={newPassword} />}
                            {sameAsCurrent && <span className="text-sm text-destructive">Choose a password you're not using now</span>}
                            {errors.newPassword && <span className="text-sm text-destructive">{errors.newPassword}</span>}
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="confirmPassword">Confirm new password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                aria-invalid={!!confirmPassword && !matches}
                            />
                            {!!confirmPassword && !matches && <span className="text-sm text-destructive">Passwords don't match</span>}
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                            <button
                                type="button"
                                onClick={resetLink.send}
                                disabled={resetLink.sending}
                                className="text-sm font-semibold text-primary hover:underline disabled:text-foreground/50 disabled:no-underline"
                            >
                                {resetLink.sending ? "Sending…" : "Forgot your current password?"}
                            </button>
                            <Button
                                type="submit"
                                disabled={!canSave}
                                className="h-11 rounded-md bg-primary px-6 text-[15px] font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90"
                            >
                                {saving ? "Changing…" : "Change password"}
                            </Button>
                        </div>
                        {resetLink.sentTo && <SentNote email={resetLink.sentTo} />}
                    </Section>
                </form>
            ) : (
                <Section title="Password" description={`You log in with ${provider}.`}>
                    <p className="leading-relaxed text-foreground/70">
                        Your account doesn't have a Rebooked password. You log in with your {provider} account, so its password is
                        the one that keeps you secure. Change it in your {provider} settings.
                    </p>
                </Section>
            )}

            <ComingSoon />
        </div>
    );
};

export default SecuritySettingsPage;
