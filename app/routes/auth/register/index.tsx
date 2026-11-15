import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { useBaseStore } from "~/hooks/store";
import authService from "~/services/auth.service";
import type { IRegisterPayload } from "~/types/auth";
import { isValidEmail, isValidPassword, PASSWORD_RULES } from "~/utils/auth";
import { getErrorMessage, getFieldErrors } from "~/utils/https";

function getPasswordStrength(password: string) {
    if (!password) return { label: "", percent: 0, tone: "bg-border" };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { label: "Weak", percent: 30, tone: "bg-destructive" };
    if (score <= 3) return { label: "Okay", percent: 60, tone: "bg-[#c9a678]" };
    return { label: "Strong", percent: 90, tone: "bg-olive" };
}

const RegisterPage = () => {
    const navigate = useNavigate();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const setTokens = useBaseStore((state) => state.setTokens);
    const setUser = useBaseStore((state) => state.setUser);

    const strength = useMemo(() => getPasswordStrength(password), [password]);
    const passwordsMatch = confirmPassword.length === 0 || confirmPassword === password;

    const registerMutation = useMutation({
        mutationFn: (payload: IRegisterPayload) => authService.register(payload),
        onSuccess: ({ data }) => {
            setTokens({ accessToken: data.token, refreshToken: data.refreshToken, expiresIn: data.expiresIn });
            setUser(data.user);
            toast.success("Account created — let's verify your email.");
            navigate("/auth/verify-email", { state: { email: data.user.email } });
        },
        onError: (error) => {
            setFieldErrors(getFieldErrors(error));
            toast.error(getErrorMessage(error, "We couldn't create your account."));
        },
    });

    const clearFieldError = (field: string) => {
        if (fieldErrors[field]) setFieldErrors(({ [field]: _removed, ...rest }) => rest);
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // The button is disabled until this passes; this only guards against odd submits.
        if (!canSubmit) return;

        setFieldErrors({});
        registerMutation.mutate({ fullName: fullName.trim(), email: email.trim(), password });
    };

    const submitting = registerMutation.isPending;
    const canSubmit =
        fullName.trim().length > 0 &&
        isValidEmail(email) &&
        isValidPassword(password) &&
        confirmPassword === password &&
        agreeTerms &&
        !submitting;

    return (
        <>
            <h1 className="font-serif text-3xl md:text-4xl">Create your account</h1>
            <p className="mt-2.5 mb-7 text-foreground/60">
                Already have one?{" "}
                <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                    Log in
                </Link>
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input
                        id="fullName"
                        name="fullName"
                        placeholder="Thandi Mokoena"
                        value={fullName}
                        onChange={(event) => {
                            setFullName(event.target.value);
                            clearFieldError("fullName");
                        }}
                        aria-invalid={!!fieldErrors.fullName}
                        required
                    />
                    {fieldErrors.fullName && <span className="text-xs text-destructive">{fieldErrors.fullName}</span>}
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="thandi.m@gmail.com"
                        value={email}
                        onChange={(event) => {
                            setEmail(event.target.value);
                            clearFieldError("email");
                        }}
                        aria-invalid={!!fieldErrors.email}
                        required
                    />
                    {fieldErrors.email && <span className="text-xs text-destructive">{fieldErrors.email}</span>}
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••••"
                            value={password}
                            onChange={(event) => {
                                setPassword(event.target.value);
                                clearFieldError("password");
                            }}
                            aria-invalid={!!fieldErrors.password}
                            minLength={8}
                            required
                        />
                        {password && (
                            <div className="mt-0.5 flex items-center gap-2">
                                <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
                                    <div className={`h-full ${strength.tone}`} style={{ width: `${strength.percent}%` }} />
                                </div>
                                <span className="text-xs text-foreground/60">{strength.label}</span>
                            </div>
                        )}
                        {password && (
                            <ul className="flex flex-col gap-1 text-xs">
                                {PASSWORD_RULES.map((rule) => {
                                    const met = rule.test(password);
                                    return (
                                        <li
                                            key={rule.label}
                                            aria-label={`${rule.label}: ${met ? "met" : "not met"}`}
                                            className={met ? "text-olive" : "text-foreground/45"}
                                        >
                                            {met ? "✓" : "○"} {rule.label}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                        {fieldErrors.password && <span className="text-xs text-destructive">{fieldErrors.password}</span>}
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="confirmPassword">Confirm password</Label>
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            placeholder="••••••••••"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            aria-invalid={!passwordsMatch}
                            required
                        />
                        {!passwordsMatch && <span className="text-xs text-destructive">Passwords don't match</span>}
                    </div>
                </div>


                <div className="mt-1 flex items-start gap-2.5">
                    <Checkbox
                        id="agreeTerms"
                        checked={agreeTerms}
                        onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                    />
                    <Label htmlFor="agreeTerms" className="font-normal text-foreground/70 block">
                        I agree to the{" "}
                        <Link to="/terms-of-service" className="font-semibold text-primary underline-offset-4 hover:underline inline">
                            Terms
                        </Link>{" "}
                        and understand Rebooked doesn't process payments or guarantee sales.
                    </Label>
                </div>

                <Button
                    type="submit"
                    disabled={!canSubmit}
                    className="mt-1.5 h-12 rounded-lg bg-primary text-base font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90"
                >
                    {submitting ? "Creating account…" : "Create account"}
                </Button>

                <div className="my-1 flex items-center gap-3.5">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-foreground/45">or</span>
                    <div className="h-px flex-1 bg-border" />
                </div>

                <Button
                    type="button"
                    variant="outline"
                    onClick={() => toast("Google sign-in isn't available yet.")}
                    className="h-12 rounded-lg text-base font-semibold"
                >
                    Continue with Google
                </Button>
            </form>
        </>
    );
};

export default RegisterPage;
