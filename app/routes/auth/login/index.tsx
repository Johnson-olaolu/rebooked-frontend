import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [keepSignedIn, setKeepSignedIn] = useState(false);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setSubmitting(true);

        // TODO: replace with real login request once the auth service is wired up.
        setTimeout(() => {
            setSubmitting(false);
            setError("That password doesn't match this email. Try again or reset it.");
        }, 700);
    };

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
