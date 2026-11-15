import type { ReactNode } from "react";

interface EmptyStateProps {
    title: string;
    description: ReactNode;
    action?: ReactNode;
}

const EmptyState = ({ title, description, action }: EmptyStateProps) => (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-foreground/20 bg-card px-6 py-16 text-center">
        <img src="/brand/rebooked-mark-ink.png" alt="" className="h-14 w-auto object-contain opacity-40" />
        <h2 className="mt-5 font-serif text-2xl">{title}</h2>
        <p className="mt-2 max-w-md leading-relaxed text-foreground/60">{description}</p>
        {action && <div className="mt-6">{action}</div>}
    </div>
);

export default EmptyState;
