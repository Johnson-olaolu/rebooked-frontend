import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, MessageCircle } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import StartChatDialog from "~/components/chat/StartChatDialog";
import SellerRating, { ratingText } from "~/components/ratings/SellerRating";
import SaveButton from "~/components/shop/SaveButton";
import { Button } from "~/components/ui/button";
import UserAvatar from "~/components/UserAvatar";
import { useConversationWith } from "~/hooks/useChat";
import { useCurrentUser } from "~/hooks/useCurrentUser";
import { recentlyViewedKey } from "~/hooks/useRecentlyViewed";
import { cn } from "~/lib/utils";
import bookService from "~/services/book.service";
import type { IBook } from "~/types/book";
import type { IFile } from "~/types/file";
import { conditionLabel, editPath } from "~/utils/book";
import { threadPath } from "~/utils/chat";
import { categoryPath, statePath } from "~/utils/slug";
import { getErrorStatus } from "~/utils/https";
import { formatNaira } from "~/utils/money";
import { formatNgState } from "~/utils/nigeria";
import { timeAgo } from "~/utils/time";
import { displayName, displayPlace } from "~/utils/text";

const primaryButton =
    "h-12 rounded-lg bg-primary px-6 text-base font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90";

const PAYMENTS_NOTE =
    "Rebooked doesn't process payments. Agree the price and the handover with the seller in your conversation.";

/** Cover first, then the rest in the order the seller added them. */
const orderedPhotos = (book: IBook): IFile[] => {
    const images = book.images ?? [];
    const cover = book.coverImage ?? images[0];
    if (!cover) return [];
    return [cover, ...images.filter((image) => image.id !== cover.id)];
};

const sellerLocation = (book: IBook) =>
    [displayPlace(book.seller?.city), formatNgState(book.seller?.state)].filter(Boolean).join(", ");

const Placeholder = ({ className }: { className?: string }) => (
    <div className={cn("flex size-full items-center justify-center bg-secondary", className)}>
        <img src="/brand/rebooked-mark-ink.png" alt="" className="h-14 w-auto opacity-25" />
    </div>
);

/** Desktop: main photo + thumbnails (2c). Mobile: swipeable, with "1 of 3" (2g). */
const Gallery = ({ photos, title }: { photos: IFile[]; title: string }) => {
    const [active, setActive] = useState(0);
    const scroller = useRef<HTMLDivElement>(null);
    const current = photos[active];

    return (
        <div>
            {/* Mobile */}
            <div className="relative -mx-6 md:hidden">
                <div
                    ref={scroller}
                    onScroll={(event) => {
                        const el = event.currentTarget;
                        setActive(Math.round(el.scrollLeft / el.clientWidth));
                    }}
                    className="flex aspect-[4/5] snap-x snap-mandatory overflow-x-auto bg-secondary [scrollbar-width:none]"
                >
                    {photos.length === 0 ? (
                        <Placeholder />
                    ) : (
                        photos.map((photo, index) => (
                            <img
                                key={photo.id}
                                src={photo.url}
                                alt={index === 0 ? `Cover of ${title}` : `${title}, photo ${index + 1}`}
                                className="size-full shrink-0 snap-center object-cover"
                            />
                        ))
                    )}
                </div>
                {photos.length > 1 && (
                    <span className="absolute right-3 bottom-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold">
                        {active + 1} of {photos.length}
                    </span>
                )}
            </div>

            {/* Desktop */}
            <div className="hidden md:block">
                <div className="aspect-[4/5] overflow-hidden rounded-xl border border-foreground/10 bg-secondary">
                    {current ? (
                        <img
                            src={current.url}
                            alt={active === 0 ? `Cover of ${title}` : `${title}, photo ${active + 1}`}
                            className="size-full object-cover"
                        />
                    ) : (
                        <Placeholder />
                    )}
                </div>
                {photos.length > 1 && (
                    <div className="mt-3 flex gap-2.5" role="group" aria-label="Photos">
                        {photos.map((photo, index) => (
                            <button
                                key={photo.id}
                                type="button"
                                onClick={() => setActive(index)}
                                aria-label={`Show photo ${index + 1}`}
                                aria-pressed={index === active}
                                className={cn(
                                    "h-24 w-19 overflow-hidden rounded-md border-2 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                                    index === active ? "border-primary" : "border-transparent opacity-75 hover:opacity-100",
                                )}
                            >
                                <img src={photo.url} alt="" className="size-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const Banner = ({ tone = "muted", title, children }: { tone?: "muted" | "olive"; title: string; children?: ReactNode }) => (
    <div
        role="status"
        className={cn(
            "rounded-lg border px-4 py-3",
            tone === "olive" ? "border-olive/30 bg-olive/10" : "border-foreground/10 bg-secondary",
        )}
    >
        <div className="font-semibold">{title}</div>
        {children && <div className="mt-0.5 text-sm text-foreground/70">{children}</div>}
    </div>
);

const Detail = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex justify-between gap-6 border-b border-foreground/10 py-2.5 text-[15px] last:border-0">
        <dt className="text-foreground/60">{label}</dt>
        <dd className="text-right font-medium">{children}</dd>
    </div>
);

const BookStatusMessage = ({ title, description }: { title: string; description: string }) => (
    <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-20 text-center">
        <img src="/brand/rebooked-mark-ink.png" alt="" className="h-14 w-auto opacity-40" />
        <h1 className="mt-5 font-serif text-3xl">{title}</h1>
        <p className="mt-2 text-foreground/60">{description}</p>
        <Button asChild className={cn(primaryButton, "mt-6 h-11 text-[15px]")}>
            <Link to="/shop">Browse the shop</Link>
        </Button>
    </div>
);

/** 2c / 2g: the public page for one book. */
const BookPage = () => {
    const { id = "" } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isLoggedIn } = useCurrentUser();

    const bookQuery = useQuery({
        queryKey: ["book", id],
        queryFn: () => bookService.get(id),
        select: (response) => response.data,
        retry: (count, error) => getErrorStatus(error) !== 404 && count < 1,
    });
    const book = bookQuery.data;
    const queryClient = useQueryClient();
    const isOwner = !!user && !!book?.seller?.id && book.seller.id === user.id;
    const [chatOpen, setChatOpen] = useState(false);
    // Already talking to this seller about this book? Then the button goes straight back to that chat.
    const existingChat = useConversationWith(id, isLoggedIn && !!book && !isOwner).data;
    const continueChat = existingChat?.hasBook ? existingChat.conversationId : undefined;

    useEffect(() => {
        if (book?.title) document.title = `${book.title} · Rebooked`;
    }, [book?.title]);

    // Count a view once per visit; the API dedupes per day and ignores books that aren't available.
    const viewed = useRef<string | undefined>(undefined);
    useEffect(() => {
        if (!book || book.status !== "ACTIVE" || isOwner || viewed.current === book.id) return;
        viewed.current = book.id;
        bookService
            .recordView(book.id)
            .then(() => queryClient.invalidateQueries({ queryKey: recentlyViewedKey }))
            .catch(() => undefined);
    }, [book, isOwner, queryClient]);

    if (bookQuery.isLoading) {
        return (
            <div aria-busy className="mx-auto grid max-w-6xl gap-10 px-6 py-10 md:grid-cols-[minmax(0,420px)_1fr] md:px-12">
                <div className="aspect-[4/5] animate-pulse rounded-xl bg-secondary" />
                <div className="space-y-4">
                    <div className="h-5 w-24 animate-pulse rounded bg-secondary" />
                    <div className="h-10 w-3/4 animate-pulse rounded bg-secondary" />
                    <div className="h-5 w-1/2 animate-pulse rounded bg-secondary" />
                    <div className="h-12 w-40 animate-pulse rounded bg-secondary" />
                </div>
            </div>
        );
    }

    if (!book) {
        return getErrorStatus(bookQuery.error) === 404 || !bookQuery.isError ? (
            <BookStatusMessage
                title="This book isn't on any shelf"
                description="It may have been removed, or the link is wrong. There's plenty more in the shop."
            />
        ) : (
            <BookStatusMessage title="We couldn't load this book" description="Check your connection and try again." />
        );
    }

    const photos = orderedPhotos(book);
    const sellerName = displayName(book.seller?.userName) || "the seller";
    const location_ = sellerLocation(book);
    const price = formatNaira(book.price, book.isFree);
    const available = book.status === "ACTIVE";
    const category = book.categories?.[0];
    const sellerState = book.location?.state ?? book.seller?.state;

    const messageSeller = () => {
        if (!isLoggedIn) {
            navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
            return;
        }
        if (continueChat) navigate(threadPath(continueChat, book.id));
        else setChatOpen(true);
    };

    const banner =
        book.status === "SOLD" ? (
            <Banner title="This book has been sold">
                {sellerName === "the seller" ? "This copy" : `${sellerName} sold this copy`}
                {book.soldDate ? ` ${timeAgo(book.soldDate)}` : ""}. It's no longer in the shop.
            </Banner>
        ) : book.status === "INACTIVE" ? (
            <Banner title="This book isn't available right now">The seller has taken it out of the shop for now.</Banner>
        ) : book.status === "DRAFT" ? (
            <Banner title="Draft — only you can see this">Add it to your shelf to put it in the shop.</Banner>
        ) : null;

    const cta = isOwner ? (
        <div className="flex flex-col gap-2">
            {book.status !== "SOLD" && (
                <Button asChild className={primaryButton}>
                    <Link to={editPath(book)}>Edit this book</Link>
                </Button>
            )}
            <p className="text-sm text-foreground/55">This is your book — it's how buyers see it.</p>
        </div>
    ) : available ? (
        <div className="hidden flex-col gap-3 md:flex">
            <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={messageSeller} className={cn(primaryButton, "w-fit")}>
                    <MessageCircle className="size-5" aria-hidden />
                    {continueChat ? "Continue chat" : "Message seller"}
                </Button>
                <SaveButton book={book} variant="inline" />
            </div>
            <p className="max-w-md text-sm text-foreground/55">{PAYMENTS_NOTE}</p>
        </div>
    ) : null;

    return (
        <div className={cn("mx-auto max-w-6xl px-6 py-6 md:px-12 md:py-10", available && !isOwner && "pb-36 md:pb-10")}>
            {/* Breadcrumb (desktop) / back link (mobile) */}
            <nav aria-label="Breadcrumb" className="mb-5 text-sm text-foreground/55">
                <Link to="/shop" className="inline-flex items-center gap-1.5 hover:text-foreground md:hidden">
                    <ArrowLeft className="size-4" aria-hidden /> Shop
                </Link>
                <ol className="hidden items-center gap-1.5 md:flex">
                    <li>
                        <Link to="/shop" className="hover:text-foreground">
                            Shop
                        </Link>
                    </li>
                    {category && (
                        <>
                            <ChevronRight className="size-3.5" aria-hidden />
                            <li>
                                <Link to={categoryPath(category)} className="hover:text-foreground">
                                    {category.name}
                                </Link>
                            </li>
                        </>
                    )}
                    <ChevronRight className="size-3.5" aria-hidden />
                    <li aria-current="page" className="truncate font-medium text-foreground">
                        {book.title}
                    </li>
                </ol>
            </nav>

            <div className="grid gap-8 md:grid-cols-[minmax(0,420px)_1fr] md:gap-12">
                <Gallery photos={photos} title={book.title} />

                <div className="flex min-w-0 flex-col gap-6">
                    {banner}

                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            {book.condition && (
                                <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase">
                                    {conditionLabel(book.condition)}
                                </span>
                            )}
                            <h1 className="mt-3 font-serif text-4xl break-words md:text-5xl">{book.title}</h1>
                            {book.author && <p className="mt-2 text-lg text-foreground/70">{book.author}</p>}
                        </div>
                        {/* Phones (and books you can't buy any more but saved): a heart by the title. Desktop
                            puts "Save" next to "Message seller" instead. */}
                        {!isOwner && book.status !== "DRAFT" && (
                            <SaveButton
                                book={book}
                                onlyIfSaved={!available}
                                className={cn("mt-1 size-11 shrink-0 border border-foreground/10", available && "md:hidden")}
                            />
                        )}
                    </div>

                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                        {price && (
                            <span className={cn("font-serif text-4xl text-primary", !available && "text-foreground/45 line-through")}>
                                {price}
                            </span>
                        )}
                        <span className="text-sm text-foreground/55">
                            Added {timeAgo(book.createdAt)}
                            {book.status !== "DRAFT" && ` · ${book.viewCount ?? 0} ${book.viewCount === 1 ? "view" : "views"}`}
                        </span>
                    </div>

                    {cta}

                    <dl className="rounded-lg border border-foreground/10 bg-card px-4">
                        {book.condition && <Detail label="Condition">{conditionLabel(book.condition)}</Detail>}
                        {!!book.categories?.length && (
                            <Detail label={book.categories.length === 1 ? "Category" : "Categories"}>
                                {book.categories.map((item, index) => (
                                    <span key={item.id}>
                                        {index > 0 && ", "}
                                        <Link to={categoryPath(item)} className="hover:underline">
                                            {item.name}
                                        </Link>
                                    </span>
                                ))}
                            </Detail>
                        )}
                        {book.isbn && <Detail label="ISBN">{book.isbn}</Detail>}
                        {location_ && (
                            <Detail label="Location">
                                {sellerState ? (
                                    <Link to={statePath(sellerState)} title={`More books in ${formatNgState(sellerState)}`} className="hover:underline">
                                        {location_}
                                    </Link>
                                ) : (
                                    location_
                                )}
                            </Detail>
                        )}
                    </dl>

                    {book.description && (
                        <section>
                            <h2 className="font-serif text-2xl">Seller's notes</h2>
                            <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-line text-foreground/80">
                                {book.description}
                            </p>
                        </section>
                    )}

                    {book.seller && (
                        <Link
                            to={`/seller/${book.seller.id}`}
                            aria-label={`Seller: ${displayName(book.seller.userName) || "Rebooked seller"}. ${ratingText(book.seller.rating)}. View their shelf`}
                            className="flex items-center gap-3.5 rounded-lg border border-foreground/10 bg-card p-4 transition-colors hover:border-primary/40"
                        >
                            <UserAvatar
                                name={book.seller.userName}
                                photoUrl={book.seller.profilePictureUrl}
                                className="size-12 text-base"
                            />
                            <div className="min-w-0">
                                <div className="truncate font-semibold">{displayName(book.seller.userName) || "Rebooked seller"}</div>
                                <SellerRating rating={book.seller.rating} className="mt-0.5" />
                                {location_ && <div className="truncate text-sm text-foreground/55">{location_}</div>}
                            </div>
                            <span className="ml-auto shrink-0 text-sm font-semibold text-primary">View shelf →</span>
                        </Link>
                    )}
                </div>
            </div>

            {/* 2g: sticky message bar on mobile */}
            {available && !isOwner && (
                <div className="fixed inset-x-0 bottom-0 z-20 border-t border-foreground/10 bg-card/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
                    <Button type="button" onClick={messageSeller} className={cn(primaryButton, "w-full")}>
                        <MessageCircle className="size-5" aria-hidden />
                        <span className="truncate">
                            {continueChat
                                ? `Continue chat with ${sellerName}`
                                : sellerName === "the seller"
                                  ? "Message the seller"
                                  : `Message ${sellerName} about this book`}
                        </span>
                    </Button>
                    <p className="mt-1.5 text-center text-xs text-foreground/55">
                        Rebooked doesn't process payments — you'll arrange that in the chat.
                    </p>
                </div>
            )}

            {available && !isOwner && isLoggedIn && <StartChatDialog book={book} open={chatOpen} onOpenChange={setChatOpen} />}
        </div>
    );
};

export default BookPage;
