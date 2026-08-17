import { Link } from "react-router";
import type { ReactNode } from "react";

interface AuthCardLayoutProps {
    width?: "sm" | "md";
    children: ReactNode;
}

const AuthCardLayout = ({ width = "sm", children }: AuthCardLayoutProps) => {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-6 py-12">
            <Link to="/">
                <img src="/brand/rebooked-logo-ink.png" alt="Rebooked" className="h-9 w-auto object-contain" />
            </Link>
            <div
                className={`w-full rounded-xl border border-border bg-card p-9 shadow-[0_14px_34px_rgba(74,45,24,0.1)] ${width === "md" ? "max-w-md" : "max-w-sm"
                    }`}
            >
                {children}
            </div>
        </div>
    );
};

export default AuthCardLayout;
