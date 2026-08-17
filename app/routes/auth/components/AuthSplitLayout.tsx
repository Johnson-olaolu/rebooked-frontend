import { Link } from "react-router";
import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

interface AuthSplitLayoutProps {
    quote: ReactNode;
    bullets?: string[];
    footer?: ReactNode;
    variant?: "brown" | "ink";
    children: ReactNode;
}

const AuthSplitLayout = ({ quote, bullets, footer, variant = "brown", children }: AuthSplitLayoutProps) => {
    return (
        <div className="grid min-h-screen bg-background md:grid-cols-[0.82fr_1.18fr]">
            <aside
                className={cn(
                    "relative flex flex-col justify-between overflow-hidden p-9 text-[#f6efe1]",
                    variant === "ink" ? "bg-[#4a2d18]" : "bg-primary"
                )}
            >
                <Link to="/">
                    <img src="/brand/rebooked-logo-cream.png" alt="Rebooked" className="h-9 w-auto object-contain" />
                </Link>

                <div className="relative z-10 py-10">
                    <p className="font-serif text-2xl leading-snug text-pretty md:text-3xl">{quote}</p>
                </div>

                {bullets && bullets.length > 0 && (
                    <div className="flex flex-col gap-3 text-sm text-[#f6efe1]/80">
                        {bullets.map((bullet) => (
                            <div key={bullet} className="flex gap-2.5">
                                <span className="text-[#c9a678]">✓</span>
                                {bullet}
                            </div>
                        ))}
                    </div>
                )}

                {footer && <div className="text-sm text-[#f6efe1]/75">{footer}</div>}

                <img
                    src="/brand/rebooked-mark-cream.png"
                    alt=""
                    className="pointer-events-none absolute right-[-70px] bottom-[-30px] h-48 w-72 object-contain opacity-10"
                />
            </aside>

            <div className="flex flex-col justify-center px-6 py-12 sm:px-12 md:px-16">
                <div className="mx-auto w-full max-w-md">{children}</div>
            </div>
        </div>
    );
};

export default AuthSplitLayout;
