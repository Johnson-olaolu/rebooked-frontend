import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "~/components/ui/input-otp";
import AuthCardLayout from "../components/AuthCardLayout";

const RESEND_COOLDOWN_SECONDS = 30;

const VerifyEmailPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = (location.state as { email?: string } | null)?.email;

    const [code, setCode] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState("");
    const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => setCooldown((value) => value - 1), 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    const verifyCode = (value: string) => {
        if (value.length < 6) return;
        setVerifying(true);
        setError("");
        // TODO: replace with real verification request once the auth service is wired up.
        setTimeout(() => {
            setVerifying(false);
            toast.success("Email verified — welcome to Rebooked.");
            navigate("/");
        }, 700);
    };

    const handleResend = () => {
        if (cooldown > 0) return;
        setCooldown(RESEND_COOLDOWN_SECONDS);
        setCode("");
        setError("");
        toast.success("We've sent a new code.");
    };

    return (
        <AuthCardLayout>
            <div className="text-center">
                <div className="relative mx-auto flex h-16 w-[92px] items-center justify-center overflow-hidden rounded border border-border bg-background">
                    <span className="font-serif text-sm text-primary">RB</span>
                </div>

                <h1 className="mt-6 font-serif text-2xl leading-tight md:text-3xl">Verify your email</h1>
                <p className="mt-2 mb-7 leading-relaxed text-foreground/65">
                    Enter the 6-digit code we sent to{" "}
                    {email ? <span className="font-semibold text-foreground">{email}</span> : "your email address"}. Verified
                    accounts get a badge on their listings — buyers trust them more.
                </p>

                <div className="flex justify-center">
                    <InputOTP
                        maxLength={6}
                        value={code}
                        onChange={(value) => {
                            setCode(value);
                            if (error) setError("");
                        }}
                        onComplete={verifyCode}
                    >
                        <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                        </InputOTPGroup>
                    </InputOTP>
                </div>
                {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

                <Button
                    type="button"
                    disabled={code.length < 6 || verifying}
                    onClick={() => verifyCode(code)}
                    className="mt-7 h-12 w-full rounded-lg bg-primary text-base font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90"
                >
                    {verifying ? "Verifying…" : "Verify email"}
                </Button>

                <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0}
                    className="mt-5 w-full text-sm font-semibold text-primary disabled:cursor-not-allowed disabled:text-foreground/40"
                >
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend the code"}
                </button>

                <p className="mt-4 text-sm text-foreground/55">
                    <Link to="/auth/register" className="font-semibold text-primary hover:underline">
                        Change email
                    </Link>{" "}
                    ·{" "}
                    <Link to="/" className="font-semibold text-primary hover:underline">
                        Skip for now
                    </Link>
                </p>
            </div>
        </AuthCardLayout>
    );
};

export default VerifyEmailPage;
