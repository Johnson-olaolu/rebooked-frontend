import { cn } from "~/lib/utils";

/** Red count bubble (mockups 3a, 4e). Renders nothing at 0. */
const UnreadBadge = ({ count, className }: { count: number; className?: string }) =>
    count > 0 ? (
        <span
            aria-label={`${count} unread`}
            className={cn(
                "flex h-5 min-w-5 items-center justify-center rounded-full bg-[#9c3a2c] px-1.5 text-[11px] leading-none font-bold text-white",
                className,
            )}
        >
            {count > 99 ? "99+" : count}
        </span>
    ) : null;

export default UnreadBadge;
