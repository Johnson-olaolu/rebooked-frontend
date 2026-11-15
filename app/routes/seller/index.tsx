import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BadgeCheck, MessageCircle, Phone } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import BookCard, { BookCardSkeleton } from "~/components/shop/BookCard";
import NotFoundMessage from "~/components/shop/NotFoundMessage";
import Pagination from "~/components/shop/Pagination";
import { Button } from "~/components/ui/button";
import UserAvatar from "~/components/UserAvatar";
import { useCurrentUser } from "~/hooks/useCurrentUser";
import { cn } from "~/lib/utils";
import bookService from "~/services/book.service";
import userService from "~/services/user.service";
import { getErrorStatus } from "~/utils/https";
import { formatNgState } from "~/utils/nigeria";
import { statePath } from "~/utils/slug";

const PAGE_SIZE = 24;
type Tab = "available" | "rehomed";

const primaryButton =
    "h-11 rounded-lg bg-primary px-5 text-[15px] font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90";

const joined = (date?: string | null) => {
    if (!date) return "";
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime())
        ? ""
        : `Joined ${parsed.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`;
};

const Stat = ({ value, label }: { value: ReactNode; label: string }) => (
    <div className="rounded-lg border border-foreground/10 bg-card px-5 py-4">
        <div className="font-serif text-3xl text-primary">{value}</div>
        <div className="mt-0.5 text-sm text-foreground/60">{label}</div>
    </div>
);

/** 2d: a seller's public page and everything on their shelf that buyers can see. */
const SellerPage = () => {
    const { id = "" } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [params, setParams] = useSearchParams();
    const { user, isLoggedIn } = useCurrentUser();
    const tab: Tab = params.get("tab") === "rehomed" ? "rehomed" : "available";
    const page = Math.max(1, Number(params.get("page")) || 1);

    const sellerQuery = useQuery({
        queryKey: ["seller", id],
        queryFn: () => userService.getPublic(id),
        select: (response) => response.data,
        retry: (count, error) => ![400, 404].includes(getErrorStatus(error) ?? 0) && count < 1,
    });
    const seller = sellerQuery.data;

    const availableQuery = useQuery({
        queryKey: ["shop", { userId: id, page: tab === "available" ? page : 1 }],
        queryFn: () => bookService.query({ userId: id, page: tab === "available" ? page - 1 : 0, pageSize: PAGE_SIZE }),
        select: (response) => response.data,
        placeholderData: keepPreviousData,
        enabled: !!seller,
    });
    const soldQuery = useQuery({
        queryKey: ["shop", { userId: id, status: "SOLD", page: tab === "rehomed" ? page : 1 }],
        queryFn: () =>
            bookService.query({ userId: id, status: "SOLD", page: tab === "rehomed" ? page - 1 : 0, pageSize: PAGE_SIZE }),
        select: (response) => response.data,
        placeholderData: keepPreviousData,
        enabled: !!seller,
    });
    // Until the API supports status=SOLD (API_CHANGES #17f) it ignores it and returns available books,
    // so only trust the result if everything in it really is sold.
    const soldSupported = !!soldQuery.data && soldQuery.data.content.every((book) => book.status === "SOLD");
    const sold = soldSupported ? soldQuery.data : undefined;

    const availableCount = seller?.availableCount ?? availableQuery.data?.totalElements;
    const soldCount = seller?.soldCount ?? sold?.totalElements;
    const name = seller?.userName?.trim() || "This seller";
    const firstName = name.split(" ")[0];
    const isOwner = !!user && user.id === id;

    useEffect(() => {
        if (seller) document.title = `${name}'s shelf · Rebooked`;
    }, [seller, name]);

    if (sellerQuery.isLoading) {
        return (
            <div aria-busy className="mx-auto max-w-6xl px-6 py-12 md:px-12">
                <div className="flex items-center gap-5">
                    <div className="size-24 animate-pulse rounded-full bg-secondary" />
                    <div className="flex-1 space-y-3">
                        <div className="h-9 w-1/3 animate-pulse rounded bg-secondary" />
                        <div className="h-4 w-1/2 animate-pulse rounded bg-secondary" />
                    </div>
                </div>
            </div>
        );
    }
    if (!seller) {
        return sellerQuery.isError && ![400, 404].includes(getErrorStatus(sellerQuery.error) ?? 0) ? (
            <NotFoundMessage title="We couldn't load this seller" description="Check your connection and try again." />
        ) : (
            <NotFoundMessage title="This seller isn't on Rebooked" description="The link may be wrong, or the account has been closed." />
        );
    }

    const place = [seller.city?.trim(), seller.state ? formatNgState(seller.state) : ""].filter(Boolean).join(", ");
    const joinedText = joined(seller.joinedAt);

    const messageSeller = () => {
        if (!isLoggedIn) {
            navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
            return;
        }
        toast("Messaging is coming soon — you'll be able to chat with sellers right here.");
    };

    const setTab = (next: Tab) => setParams(next === "available" ? {} : { tab: next }, { preventScrollReset: true });
    const goToPage = (next: number) => {
        setParams({ ...(tab === "rehomed" ? { tab } : {}), ...(next > 1 ? { page: String(next) } : {}) }, { preventScrollReset: true });
        document.getElementById("seller-shelf")?.scrollIntoView({ behavior: "smooth" });
    };

    const current = tab === "available" ? availableQuery : soldQuery;
    const books = tab === "available" ? availableQuery.data : sold;
    const loadingBooks = current.isLoading;

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:px-12 md:py-12">
            {isOwner && (
                <div role="status" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-olive/30 bg-olive/10 px-4 py-3">
                    <span className="font-semibold">This is how buyers see your shelf.</span>
                    <Link to="/dashboard/shelf" className="text-sm font-semibold text-primary hover:underline">
                        Manage my shelf →
                    </Link>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-5">
                    <UserAvatar name={seller.userName} photoUrl={seller.profilePictureUrl} className="size-20 text-2xl md:size-24 md:text-3xl" />
                    <div className="min-w-0">
                        <h1 className="font-serif text-4xl break-words md:text-5xl">{name}</h1>
                        {(place || joinedText) && (
                            <p className="mt-1.5 text-foreground/60">
                                {place && seller.state ? (
                                    <Link to={statePath(seller.state)} className="hover:text-foreground hover:underline">
                                        {place}
                                    </Link>
                                ) : (
                                    place
                                )}
                                {place && joinedText && " · "}
                                {joinedText}
                            </p>
                        )}
                        {seller.bio && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-foreground/80">{seller.bio}</p>}
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground/65">
                            <span className="inline-flex items-center gap-1.5">
                                <BadgeCheck className="size-4 text-olive" aria-hidden /> Email verified
                            </span>
                            {seller.hasPhone && (
                                <span className="inline-flex items-center gap-1.5">
                                    <Phone className="size-4 text-olive" aria-hidden /> Phone number on file
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                {!isOwner && (
                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
                        <Button type="button" onClick={messageSeller} className={primaryButton}>
                            <MessageCircle className="size-5" aria-hidden /> Message {firstName}
                        </Button>
                        <Button asChild variant="outline" className="h-11 rounded-lg px-4 font-semibold">
                            <Link to={`/contact-us?subject=report&seller=${encodeURIComponent(id)}`}>Report this seller</Link>
                        </Button>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-2 gap-3.5 sm:max-w-md">
                <Stat value={availableCount ?? "—"} label="Available now" />
                <Stat value={soldCount ?? "—"} label={soldCount === 1 ? "Book rehomed" : "Books rehomed"} />
            </div>

            {/* Shelf */}
            <section id="seller-shelf" className="mt-12 scroll-mt-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="font-serif text-3xl">On {firstName === "This" ? "this" : `${firstName}'s`} shelf</h2>
                        <p className="mt-1 text-sm text-foreground/60">
                            {[
                                availableCount !== undefined && `${availableCount} available`,
                                soldCount !== undefined && `${soldCount} rehomed`,
                            ]
                                .filter(Boolean)
                                .join(" · ")}
                        </p>
                    </div>
                    <div role="tablist" aria-label="Shelf" className="inline-flex rounded-lg border border-foreground/15 bg-card p-0.5">
                        {(["available", "rehomed"] as Tab[]).map((value) => (
                            <button
                                key={value}
                                type="button"
                                role="tab"
                                aria-selected={tab === value}
                                onClick={() => setTab(value)}
                                className={cn(
                                    "rounded-md px-3.5 py-1.5 text-sm transition-colors",
                                    tab === value ? "bg-foreground font-semibold text-background" : "text-foreground/70 hover:text-foreground",
                                )}
                            >
                                {value === "available" ? "Available" : "Rehomed"}
                                {value === "available" && availableCount !== undefined && ` · ${availableCount}`}
                                {value === "rehomed" && soldCount !== undefined && ` · ${soldCount}`}
                            </button>
                        ))}
                    </div>
                </div>

                <div role="tabpanel" className="mt-6">
                    {current.isError ? (
                        <div className="rounded-xl border border-dashed border-foreground/20 bg-card px-6 py-12 text-center">
                            <p className="text-foreground/60">We couldn't load these books.</p>
                            <Button variant="outline" onClick={() => current.refetch()} className="mt-4 h-11 rounded-md px-5 font-semibold">
                                Try again
                            </Button>
                        </div>
                    ) : loadingBooks ? (
                        <div aria-busy className="grid grid-cols-2 gap-x-4 gap-y-7 md:grid-cols-3 lg:grid-cols-4">
                            {Array.from({ length: 4 }, (_, index) => (
                                <BookCardSkeleton key={index} />
                            ))}
                        </div>
                    ) : !books || books.content.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-foreground/20 bg-card px-6 py-12 text-center">
                            <h3 className="font-serif text-2xl">
                                {tab === "available" ? "Nothing available right now" : "No books rehomed yet"}
                            </h3>
                            <p className="mt-2 text-foreground/60">
                                {tab === "available"
                                    ? `${name} hasn't got any books in the shop at the moment.`
                                    : "Books this seller has sold will show up here."}
                            </p>
                        </div>
                    ) : (
                        <>
                            <ul className="grid grid-cols-2 gap-x-4 gap-y-7 md:grid-cols-3 lg:grid-cols-4">
                                {books.content.map((book) => (
                                    <li key={book.id}>
                                        <BookCard book={book} sold={tab === "rehomed"} />
                                    </li>
                                ))}
                            </ul>
                            <Pagination page={page} totalPages={books.totalPages} onChange={goToPage} />
                        </>
                    )}
                </div>
            </section>
        </div>
    );
};

export default SellerPage;
