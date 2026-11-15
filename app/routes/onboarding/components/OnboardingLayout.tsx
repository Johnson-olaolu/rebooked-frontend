import { Outlet, useLocation } from "react-router";
import AuthProvider from "~/provider/AuthProvider";
import AuthSplitLayout from "~/routes/auth/components/AuthSplitLayout";

const TOTAL_STEPS = 2;

const PANEL_CONTENT = {
    1: {
        quote: "Every good shelf starts with a familiar face.",
        bullets: ["Your name and photo appear on your listings", "Change them any time from your profile"],
    },
    2: {
        quote: "The best books change hands close to home.",
        bullets: ["Buyers nearby see your books first", "Only your state and city are ever shown"],
    },
} as const;

const OnboardingLayout = () => {
    const { pathname } = useLocation();
    const step = pathname.replace(/\/$/, "").endsWith("/address") ? 2 : 1;
    const panel = PANEL_CONTENT[step];

    return (
        <AuthProvider>
            <AuthSplitLayout variant="ink" quote={panel.quote} bullets={[...panel.bullets]}>
                <div className="mb-10 flex items-center gap-2 text-sm text-foreground/55">
                    {Array.from({ length: TOTAL_STEPS }, (_, index) => (
                        <div
                            key={index}
                            className={`h-1 w-6.5 rounded-full ${index < step ? "bg-primary" : "bg-foreground/15"}`}
                        />
                    ))}
                    <span className="ml-1.5">
                        Step {step} of {TOTAL_STEPS}
                    </span>
                </div>
                <Outlet />
            </AuthSplitLayout>
        </AuthProvider>
    );
};

export default OnboardingLayout;
