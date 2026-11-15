import { Link } from "react-router";
import ShopBrowser from "~/components/shop/ShopBrowser";
import { Button } from "~/components/ui/button";
import { getDisplayName } from "~/components/UserAvatar";
import { useCurrentUser } from "~/hooks/useCurrentUser";

const primaryButton =
    "h-11 rounded-lg bg-primary px-5 text-[15px] font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90";

/** 2a: the shop. */
const ShopPage = () => {
    const { user, isLoggedIn } = useCurrentUser();
    const firstName = getDisplayName(user).split(" ")[0];

    return (
        <ShopBrowser
            title={isLoggedIn && firstName ? `Find your next read, ${firstName}` : "Shop"}
            subtitle={
                <>
                    Second-hand books from people near you. Message the seller, meet up, done.{" "}
                    <Link to="/shop/categories" className="font-semibold text-primary hover:underline">
                        Browse categories
                    </Link>{" "}
                    ·{" "}
                    <Link to="/shop/free" className="font-semibold text-primary hover:underline">
                        Free books
                    </Link>
                </>
            }
            actions={
                isLoggedIn ? (
                    <div className="flex items-center gap-3">
                        <Button asChild variant="outline" className="h-11 rounded-lg px-4 text-[15px] font-semibold">
                            <Link to="/dashboard/shelf">My shelf</Link>
                        </Button>
                        <Button asChild className={primaryButton}>
                            <Link to="/dashboard/shelf/new">+ Add to shelf</Link>
                        </Button>
                    </div>
                ) : (
                    <Button asChild className={primaryButton}>
                        <Link to="/register">Join Rebooked to start your shelf</Link>
                    </Button>
                )
            }
            emptyCatalog={
                <div className="flex flex-col items-center rounded-xl border border-dashed border-foreground/20 bg-card px-6 py-16 text-center">
                    <img src="/brand/rebooked-mark-ink.png" alt="" className="h-14 w-auto object-contain opacity-40" />
                    <h2 className="mt-5 font-serif text-2xl">Nobody's shelved anything yet</h2>
                    <p className="mt-2 max-w-md text-foreground/60">
                        The shop opens as soon as the first books hit the shelves.
                        {isLoggedIn ? " Got some books to pass on? Be the first." : " Join to be the first to fill a shelf."}
                    </p>
                </div>
            }
        />
    );
};

export default ShopPage;
