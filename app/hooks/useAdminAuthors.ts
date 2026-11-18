import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import adminAuthorService from "~/services/admin-author.service";
import { getErrorMessage } from "~/utils/https";

/** Everything an author change can make stale: admin lists, the detail page, and public author reads. */
export const useInvalidateAuthors = () => {
    const queryClient = useQueryClient();
    return () =>
        Promise.all(
            ["admin-authors", "admin-review", "admin-author", "admin-author-books", "admin-author-audit", "author", "author-search", "top-authors"].map(
                (key) => queryClient.invalidateQueries({ queryKey: [key] }),
            ),
        );
};

/** Verify, keep separate and delete, shared by the review queue and the author page (API_CHANGES #23f). */
export const useAdminAuthorActions = () => {
    const invalidate = useInvalidateAuthors();

    const verify = useMutation({
        mutationFn: (id: string) => adminAuthorService.verify(id).then((response) => response.data),
        onSuccess: (author) => {
            toast.success(`${author?.name ?? "Author"} is verified`);
            void invalidate();
        },
        onError: (error) => toast.error(getErrorMessage(error, "Couldn't verify that author.")),
    });

    const keepSeparate = useMutation({
        mutationFn: ({ itemId, reason }: { itemId: string; reason?: string }) => adminAuthorService.keepSeparate(itemId, reason),
        onSuccess: () => {
            toast.success("Kept as two different authors. We won't suggest this pair again.");
            void invalidate();
        },
        onError: (error) => toast.error(getErrorMessage(error, "Couldn't update that review item.")),
    });

    const remove = useMutation({
        mutationFn: (id: string) => adminAuthorService.remove(id),
        onSuccess: () => {
            toast.success("Author deleted");
            void invalidate();
        },
        // 409 when books use the author: the API says to merge it instead.
        onError: (error) => toast.error(getErrorMessage(error, "Couldn't delete that author.")),
    });

    return { verify, keepSeparate, remove };
};
