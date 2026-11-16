import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import bookService from "~/services/book.service";
import type { IBook } from "~/types/book";
import { getErrorMessage } from "~/utils/https";
import { useBaseStore } from "./store";

/** Recently viewed (API_CHANGES #21c). Served from Redis, so it's up to date as soon as a book is opened. */

export const recentlyViewedKey = ["recently-viewed"] as const;

export const useRecentlyViewed = () => {
  const loggedIn = useBaseStore((state) => !!state.accessToken && !!state.user);
  return useQuery({
    queryKey: recentlyViewedKey,
    queryFn: () => bookService.recentlyViewed().then((response) => response.data ?? []),
    enabled: loggedIn,
  });
};

export const useClearRecentlyViewed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => bookService.clearRecentlyViewed(),
    onSuccess: () => queryClient.setQueryData<IBook[]>(recentlyViewedKey, []),
    onError: (error) => toast.error(getErrorMessage(error, "We couldn't clear your recently viewed books.")),
  });
};
