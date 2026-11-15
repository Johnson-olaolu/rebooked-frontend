import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { useBaseStore } from "~/hooks/store";
import authService from "~/services/auth.service";
import type { ILoginPayload } from "~/types/auth";
import { getPostAuthPath } from "~/utils/auth";
import { getErrorMessage, getErrorStatus } from "~/utils/https";

const LoginPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [keepSignedIn, setKeepSignedIn] = useState(false);
    const [error, setError] = useState("");
    const setTokens = useBaseStore((state) => state.setTokens);
    const setUser = useBaseStore((state) => state.setUser);

    const loginMutation = useMutation({
        mutationFn: (payload: ILoginPayload) => authService.login(payload),
        onSuccess: ({ data }) => {
            setTokens({ accessToken: data.token, refreshToken: data.refreshToken, expiresIn: data.expiresIn });
            setUser(data.user);

            if (!data.user.emailVerified) {
                // Send a fresh code; a 429 just means one was sent moments ago.
                authService.resendConfirmEmail(data.user.email).catch(() => undefined);
                toast("Please verify your email to continue.");
                navigate("/auth/verify-email", { state: { email: data.user.email } });
                return;
            }

            toast.success("Welcome back!");
            navigate(getPostAuthPath(data.user, searchParams.get("redirect")), { replace: true });
        },
        onError: (err) => {
            const status = getErrorStatus(err);
            setError(
                status === 401 || status === 403
                    ? "That password doesn't match this email. Try again or reset it."
                    : getErrorMessage(err, "We couldn't log you in. Please try again."),
            );
        },
    });

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        loginMutation.mutate({ email: email.trim(), password });
    };

    const submitting = loginMutation.isPending;

    return (
        <>
            <h1 className="mb-7 font-serif text-3xl md:text-4xl">Welcome back</h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="thandi.m@gmail.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link to="/auth/forgot-password" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
                            Forgot password?
                        </Link>
                    </div>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(event) => {
                            setPassword(event.target.value);
                            if (error) setError("");
                        }}
                        aria-invalid={!!error}
                        required
                    />
                    {error && <span className="text-sm text-destructive">{error}</span>}
                </div>

                <div className="flex items-center gap-2.5">
                    <Checkbox id="keepSignedIn" checked={keepSignedIn} onCheckedChange={(checked) => setKeepSignedIn(checked === true)} />
                    <Label htmlFor="keepSignedIn" className="font-normal text-foreground/70">
                        Keep me signed in
                    </Label>
                </div>

                <Button
                    type="submit"
                    disabled={submitting}
                    className="h-12 rounded-lg bg-primary text-base font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90"
                >
                    {submitting ? "Logging in…" : "Log in"}
                </Button>
            </form>

            <p className="mt-7 text-center text-sm text-foreground/60">
                New here?{" "}
                <Link to="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
                    Create an account
                </Link>
            </p>
        </>
    );
};

export default LoginPage;
