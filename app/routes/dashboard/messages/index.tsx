import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import EmptyState from "../components/EmptyState";

const MessagesPage = () => (
    <>
        <h1 className="mb-6 font-serif text-3xl md:text-4xl">Messages</h1>
        <EmptyState
            title="No messages yet"
            description="When a buyer asks about one of your books, or you message a seller, the conversation shows up here."
            action={
                <Button asChild variant="outline" className="h-11 rounded-md px-5 text-[15px] font-semibold">
                    <Link to="/shop">Browse the shop</Link>
                </Button>
            }
        />
    </>
);

export default MessagesPage;
