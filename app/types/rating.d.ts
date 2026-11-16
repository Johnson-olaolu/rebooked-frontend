/** Mirrors API_CHANGES #22. */

export interface IMyRating {
  stars: number;
  comment?: string | null;
  updatedAt?: string;
}

export interface IPurchaseRating {
  /** True only for the recorded buyer of this sold book. */
  canRate: boolean;
  rating: IMyRating | null;
  seller: { id: string; userName: string; profilePictureUrl?: string | null };
  book: { id: string; title: string; slug?: string | null; coverUrl?: string | null };
  conversationId?: string | null;
}

export interface IRatePayload {
  stars: number;
  comment?: string;
}

export interface IChatBuyer {
  userId: string;
  userName: string;
  profilePictureUrl?: string | null;
  conversationId: string;
  lastMessageAt?: string | null;
}

export interface ISellerReview {
  id: string;
  stars: number;
  comment?: string | null;
  createdAt: string;
  buyer: { userName: string; profilePictureUrl?: string | null };
  book?: { id: string; title: string; slug?: string | null } | null;
}

export interface ISellerReviewPage {
  content: ISellerReview[];
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}
