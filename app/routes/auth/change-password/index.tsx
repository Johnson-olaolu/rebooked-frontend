import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import AuthCardLayout from "../components/AuthCardLayout";

const ChangePasswordPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const checks = useMemo(
        () => ({
            length: password.length >= 8,
            complexity: /\d/.test(password) || /[^A-Za-z0-9]/.test(password),
        }),
        [password]
    );

    if (!token) {
        return (
            <AuthCardLayout>
                <div className="text-center">
                    <h1 className="font-serif text-2xl leading-tight md:text-3xl">This link isn't valid</h1>
                    <p className="mt-3 leading-relaxed text-foreground/65">
                        Reset links expire after an hour, or may have already been used. Request a new one to continue.
                    </p>
                    <Button asChild className="mt-6 h-11 w-full rounded-lg bg-primary font-semibold text-primary-foreground hover:bg-primary/90">
                        <Link to="/auth/forgot-password">Request a new link</Link>
                    </Button>
                </div>
            </AuthCardLayout>
        );
    }

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords don't match.");
            return;
        }
        if (!checks.length || !checks.complexity) {
            toast.error("Please meet the password requirements below.");
            return;
        }

        setSubmitting(true);
        // TODO: replace with real reset request (token + new password) once the auth service is wired up.
        setTimeout(() => {
            setSubmitting(false);
            toast.success("Password updated — you're logged in.");
            navigate("/login");
        }, 700);
    };

    return (
        <AuthCardLayout>
            <h1 className="font-serif text-2xl leading-tight md:text-3xl">Set a new password</h1>
            <p className="mt-2 mb-6 leading-relaxed text-foreground/65">
                {email ? (
                    <>
                        For <span className="font-semibold text-foreground">{email}</span>. This link expires in an hour.
                    </>
                ) : (
                    "This link expires in an hour."
                )}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="password">New password</Label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="confirmPassword">Confirm new password</Label>
                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••••••"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        required
                    />
                </div>

                <div className="flex flex-col gap-2.5 rounded-lg bg-secondary/70 p-4 text-sm">
                    <div className={`flex gap-2 ${checks.length ? "text-olive" : "text-foreground/45"}`}>
                        <span>{checks.length ? "✓" : "○"}</span>At least 8 characters
                    </div>
                    <div className={`flex gap-2 ${checks.complexity ? "text-olive" : "text-foreground/45"}`}>
                        <span>{checks.complexity ? "✓" : "○"}</span>One number or symbol
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={submitting}
                    className="mt-1 h-12 rounded-lg bg-primary text-base font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90"
                >
                    {submitting ? "Saving…" : "Save and log in"}
                </Button>
            </form>
        </AuthCardLayout>
    );
};

export default ChangePasswordPage;
