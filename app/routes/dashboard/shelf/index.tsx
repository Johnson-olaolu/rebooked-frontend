import { Button } from "~/components/ui/button";
import EmptyState from "../components/EmptyState";
import { addToShelfSoon } from "../components/actions";

const ShelfPage = () => (
    <>
        <h1 className="mb-6 font-serif text-3xl md:text-4xl">My shelf</h1>
        <EmptyState
            title="Your shelf is empty"
            description="Add a book in under a minute — add a photo, a price and where you can meet. Buyers message you directly."
            action={
                <Button
                    onClick={addToShelfSoon}
                    className="h-11 rounded-md bg-primary px-5 text-[15px] font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90"
                >
                    + Add your first book
                </Button>
            }
        />
    </>
);

export default ShelfPage;
