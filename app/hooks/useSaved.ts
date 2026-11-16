import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import bookService from "~/services/book.service";
import { getErrorMessage } from "~/utils/https";
import { useBaseStore } from "./store";

/** Saved books (API_CHANGES #21d). Hearts read one cached list of ids; the lists refetch after a change. */

export const savedKeys = {
  ids: ["saved-ids"] as const,
  books: ["saved-books"] as const,
};

const EMPTY = new Set<string>();

const useLoggedIn = () => useBaseStore((state) => !!state.accessToken && !!state.user);

/** Ids of every book the user has saved (empty when logged out). */
export const useSavedIds = () => {
  const loggedIn = useLoggedIn();
  const { data } = useQuery({
    queryKey: savedKeys.ids,
    queryFn: () => bookService.savedIds().then((response) => response.data ?? []),
    enabled: loggedIn,
    staleTime: 5 * 60_000,
  });
  return useMemo(() => (loggedIn && data ? new Set(data) : EMPTY), [loggedIn, data]);
};

const setSaved = (ids: string[] | undefined, id: string, saved: boolean) => {
  const rest = (ids ?? []).filter((item) => item !== id);
  return saved ? [id, ...rest] : rest;
};

/** Saves or unsaves a book: the heart flips straight away and flips back if the server says no. */
export const useToggleSave = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) => (saved ? bookService.save(id) : bookService.unsave(id)),
    onMutate: async ({ id, saved }) => {
      await queryClient.cancelQueries({ queryKey: savedKeys.ids });
      queryClient.setQueryData<string[]>(savedKeys.ids, (ids) => setSaved(ids, id, saved));
    },
    onError: (error, { id, saved }) => {
      queryClient.setQueryData<string[]>(savedKeys.ids, (ids) => setSaved(ids, id, !saved));
      toast.error(getErrorMessage(error, saved ? "We couldn't save that book." : "We couldn't remove that book."));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: savedKeys.books }),
  });
  const { mutate } = mutation;

  return useCallback(
    (id: string, saved: boolean) => {
      mutate(
        { id, saved },
        {
          // Removing is one tap, so make it easy to take back (once it has actually gone through).
          onSuccess: () => {
            if (!saved) toast("Removed from saved", { action: { label: "Undo", onClick: () => mutate({ id, saved: true }) } });
          },
        },
      );
    },
    [mutate],
  );
};

export const useSavedBooks = (pageSize = 24) => {
  const loggedIn = useLoggedIn();
  return useInfiniteQuery({
    queryKey: [...savedKeys.books, pageSize],
    queryFn: ({ pageParam }) => bookService.savedBooks({ page: pageParam, pageSize }).then((response) => response.data),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
    enabled: loggedIn,
  });
};
