import { Link } from "react-router";
import { Button } from "~/components/ui/button";

/** "Category not found" and friends, for bad slugs and ids on public pages. */
const NotFoundMessage = ({ title, description, to = "/shop", cta = "Browse the shop" }: { title: string; description: string; to?: string; cta?: string }) => (
    <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-20 text-center">
        <img src="/brand/rebooked-mark-ink.png" alt="" className="h-14 w-auto opacity-40" />
        <h1 className="mt-5 font-serif text-3xl">{title}</h1>
        <p className="mt-2 text-foreground/60">{description}</p>
        <Button
            asChild
            className="mt-6 h-11 rounded-lg bg-primary px-5 text-[15px] font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90"
        >
            <Link to={to}>{cta}</Link>
        </Button>
    </div>
);

export default NotFoundMessage;
