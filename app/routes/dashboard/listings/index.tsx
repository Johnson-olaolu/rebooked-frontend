import { Button } from "~/components/ui/button";
import EmptyState from "../components/EmptyState";
import { listBookSoon } from "../components/actions";

const MyListingsPage = () => (
    <>
        <h1 className="mb-6 font-serif text-3xl md:text-4xl">My listings</h1>
        <EmptyState
            title="Your shelf is empty"
            description="List a book in under a minute — add a photo, a price and where you can meet. Buyers message you directly."
            action={
                <Button
                    onClick={listBookSoon}
                    className="h-11 rounded-md bg-primary px-5 text-[15px] font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90"
                >
                    + List your first book
                </Button>
            }
        />
    </>
);

export default MyListingsPage;
