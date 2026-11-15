import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import BookForm, { type BookFormAction } from "~/components/shelf/BookForm";
import bookService from "~/services/book.service";
import type { IUpdateBookPayload } from "~/types/book";

const AddToShelfPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const create = (status: "ACTIVE" | "DRAFT") => async (payload: IUpdateBookPayload) => {
        await bookService.create({ ...payload, status });
        queryClient.invalidateQueries({ queryKey: ["shelf"] });
        toast.success(status === "DRAFT" ? "Saved as draft." : "Added to your shelf.");
        navigate(status === "DRAFT" ? "/dashboard/shelf?status=DRAFT" : "/dashboard/shelf", { replace: true });
    };

    const actions: BookFormAction[] = [
        { key: "draft", label: "Save as draft", busyLabel: "Saving…", rules: "DRAFT", onSave: create("DRAFT") },
        { key: "publish", label: "Add to shelf", busyLabel: "Adding…", rules: "ACTIVE", primary: true, onSave: create("ACTIVE") },
    ];

    return (
        <BookForm
            cancelTo="/dashboard/shelf"
            actions={actions}
            header={
                <div>
                    <Link
                        to="/dashboard/shelf"
                        className="mb-3 inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" aria-hidden />
                        My shelf
                    </Link>
                    <h1 className="font-serif text-3xl md:text-4xl">Add to shelf</h1>
                    <p className="mt-1.5 text-foreground/60">
                        Buyers judge on the photo and the condition. Everything else is quick.
                    </p>
                </div>
            }
        />
    );
};

export default AddToShelfPage;
