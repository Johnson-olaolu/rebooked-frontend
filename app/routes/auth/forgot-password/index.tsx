import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import AuthCardLayout from "../components/AuthCardLayout";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        // TODO: replace with real password reset request once the auth service is wired up.
        setTimeout(() => {
            setSubmitting(false);
            setSent(true);
        }, 700);
    };

    if (sent) {
        return (
            <AuthCardLayout>
                <div className="text-center">
                    <h1 className="font-serif text-2xl leading-tight md:text-3xl">Check your inbox</h1>
                    <p className="mt-3 leading-relaxed text-foreground/65">
                        If an account exists for <span className="font-semibold text-foreground">{email}</span>, we've sent a
                        link to reset your password. It expires in an hour.
                    </p>
                    <Button variant="outline" onClick={() => setSent(false)} className="mt-6 h-11 w-full rounded-lg font-semibold">
                        Use a different email
                    </Button>
                    <Link to="/login" className="mt-5 inline-block text-sm font-semibold text-foreground/60 hover:text-primary">
                        ← Back to log in
                    </Link>
                </div>
            </AuthCardLayout>
        );
    }

    return (
        <AuthCardLayout>
            <h1 className="font-serif text-2xl leading-tight md:text-3xl">Forgotten your password?</h1>
            <p className="mt-2 mb-6 leading-relaxed text-foreground/65">
                Give us the email on your account and we'll send a link to set a new one.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </div>
                <Button
                    type="submit"
                    disabled={submitting}
                    className="mt-1 h-12 rounded-lg bg-primary text-base font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90"
                >
                    {submitting ? "Sending…" : "Send reset link"}
                </Button>
            </form>

            <Link
                to="/login"
                className="mt-5 block text-center text-sm text-foreground/60 transition-colors hover:text-primary"
            >
                ← Back to log in
            </Link>
        </AuthCardLayout>
    );
};

export default ForgotPasswordPage;
