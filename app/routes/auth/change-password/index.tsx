import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import PasswordRules from "~/components/auth/PasswordRules";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useBaseStore } from "~/hooks/store";
import authService from "~/services/auth.service";
import { isValidPassword } from "~/utils/auth";
import { getErrorMessage, getFieldErrors } from "~/utils/https";
import AuthCardLayout from "../components/AuthCardLayout";

/** /auth/change-password?email=…&token=…, the link in the reset email. */
const ChangePasswordPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    const loggedIn = useBaseStore((state) => !!state.accessToken && !!state.user);

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [expired, setExpired] = useState(false);

    const passwordsMatch = confirmPassword.length === 0 || confirmPassword === password;
    const canSubmit = isValidPassword(password) && confirmPassword === password && !submitting;

    if (!token || !email || expired) {
        return (
            <AuthCardLayout>
                <div className="text-center">
                    <h1 className="font-serif text-2xl leading-tight md:text-3xl">This link isn't valid</h1>
                    <p className="mt-3 leading-relaxed text-foreground/65">
                        Reset links expire after 15 minutes and can only be used once. Request a new one to continue.
                    </p>
                    <Button asChild className="mt-6 h-11 w-full rounded-lg bg-primary font-semibold text-primary-foreground hover:bg-primary/90">
                        <Link to={loggedIn ? "/dashboard/settings/security" : "/auth/forgot-password"}>Request a new link</Link>
                    </Button>
                </div>
            </AuthCardLayout>
        );
    }

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // The button is disabled until this passes; this only guards against odd submits.
        if (!canSubmit) return;
        setSubmitting(true);
        authService
            .resetPassword({ email, token, password })
            .then(() => {
                if (loggedIn) {
                    toast.success("Password saved.");
                    navigate("/dashboard/settings/security");
                } else {
                    toast.success("Password saved. Log in with your new password.");
                    navigate("/login");
                }
            })
            .catch((error) => {
                const fields = getFieldErrors(error);
                if (fields.password) setPasswordError(fields.password);
                else if (fields.token || /invalid or expired/i.test(getErrorMessage(error, ""))) setExpired(true);
                else toast.error(getErrorMessage(error, "We couldn't save your password."));
            })
            .finally(() => setSubmitting(false));
    };

    return (
        <AuthCardLayout>
            <h1 className="font-serif text-2xl leading-tight md:text-3xl">Set a new password</h1>
            <p className="mt-2 mb-6 leading-relaxed text-foreground/65">
                For <span className="font-semibold text-foreground">{email}</span>. This link expires 15 minutes after it was sent.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input type="email" name="email" autoComplete="username" value={email} readOnly hidden />
                <div className="flex flex-col gap-2">
                    <Label htmlFor="password">New password</Label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(event) => {
                            setPassword(event.target.value);
                            setPasswordError("");
                        }}
                        aria-invalid={!!passwordError}
                        required
                    />
                    {passwordError && <span className="text-xs text-destructive">{passwordError}</span>}
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="confirmPassword">Confirm new password</Label>
                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••••••"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        aria-invalid={!passwordsMatch}
                        required
                    />
                    {!passwordsMatch && <span className="text-xs text-destructive">Passwords don't match</span>}
                </div>

                <PasswordRules password={password} className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg bg-secondary/70 p-4 text-sm" />

                <Button
                    type="submit"
                    disabled={!canSubmit}
                    className="mt-1 h-12 rounded-lg bg-primary text-base font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90"
                >
                    {submitting ? "Saving…" : "Save new password"}
                </Button>
            </form>
        </AuthCardLayout>
    );
};

export default ChangePasswordPage;
