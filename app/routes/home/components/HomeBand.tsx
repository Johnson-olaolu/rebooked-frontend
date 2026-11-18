import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

/** One full-width home page band: top rule, page gutters, centred 7xl column. `tinted` alternates the background. */
const HomeBand = ({ children, tinted, id, className }: { children: ReactNode; tinted?: boolean; id?: string; className?: string }) => (
    <div id={id} className={cn("border-t border-border px-6 py-14 md:px-12", tinted && "bg-secondary/60", className)}>
        <div className="mx-auto max-w-7xl">{children}</div>
    </div>
);

export default HomeBand;
