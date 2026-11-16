import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import bookService from "~/services/book.service";
import userService from "~/services/user.service";
import type { IPurchaseRating, IRatePayload } from "~/types/rating";
import { getErrorStatus } from "~/utils/https";
import { useBaseStore } from "./store";

/** Who bought it (required to mark as sold) and seller ratings (API_CHANGES #22). */

export const ratingKeys = {
  purchase: (bookId: string) => ["purchase-rating", bookId] as const,
  chatBuyers: (bookId: string) => ["chat-buyers", bookId] as const,
  reviews: (userId: string) => ["seller-reviews", userId] as const,
};

/** The seller and the caller's rating for one sold book. */
export const usePurchaseRating = (bookId: string, enabled = true) => {
  const loggedIn = useBaseStore((state) => !!state.accessToken && !!state.user);
  return useQuery({
    queryKey: ratingKeys.purchase(bookId),
    queryFn: () => bookService.purchaseRating(bookId).then((response) => response.data),
    enabled: loggedIn && enabled && !!bookId,
    retry: (count, error) => getErrorStatus(error) !== 404 && getErrorStatus(error) !== 403 && count < 1,
  });
};

/** The seller's rating summary changed: refresh everywhere it's shown. */
const refreshSeller = (queryClient: ReturnType<typeof useQueryClient>, sellerId?: string) => {
  if (!sellerId) return;
  void queryClient.invalidateQueries({ queryKey: ["seller", sellerId] });
  void queryClient.invalidateQueries({ queryKey: ratingKeys.reviews(sellerId) });
  void queryClient.invalidateQueries({ queryKey: ["book"] });
};

export const useRateSeller = (bookId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: IRatePayload) => bookService.rate(bookId, payload).then((response) => response.data),
    onSuccess: (data) => {
      if (data) queryClient.setQueryData<IPurchaseRating>(ratingKeys.purchase(bookId), data);
      else void queryClient.invalidateQueries({ queryKey: ratingKeys.purchase(bookId) });
      refreshSeller(queryClient, data?.seller.id);
    },
  });
};

/** Seller only: who chatted about this book; one of them must be picked to mark it sold. */
export const useChatBuyers = (bookId: string | undefined, enabled: boolean) =>
  useQuery({
    queryKey: ratingKeys.chatBuyers(bookId ?? ""),
    queryFn: () => bookService.chatBuyers(bookId!).then((response) => response.data ?? []),
    enabled: enabled && !!bookId,
    staleTime: 30_000,
  });

export const useSellerReviews = (userId: string, pageSize = 10) =>
  useInfiniteQuery({
    queryKey: [...ratingKeys.reviews(userId), pageSize],
    queryFn: ({ pageParam }) => userService.ratings(userId, { page: pageParam, pageSize }).then((response) => response.data),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
    enabled: !!userId,
  });
