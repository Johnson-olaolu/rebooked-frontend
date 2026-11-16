import type { IResponse } from "~/types/api";
import type {
  BookStatus,
  IBook,
  IBookQuery,
  ICreateBookPayload,
  IShelfPage,
  IShelfQuery,
  IShopPage,
  IUpdateBookPayload,
} from "~/types/book";
import type { IChatBuyer, IPurchaseRating, IRatePayload } from "~/types/rating";
import https from "~/utils/https";

class BookService {
  private baseUrl = "/book";

  /** Adds a book to the caller's shelf, published (`ACTIVE`) or as a `DRAFT`. */
  async create(payload: ICreateBookPayload): Promise<IResponse<IBook>> {
    return await https.post({ url: this.baseUrl, body: payload });
  }

  /** The caller's own books (drafts included), newest first, with per-status counts. */
  async getMyShelf({ status, page = 0, pageSize = 20 }: IShelfQuery = {}): Promise<IResponse<IShelfPage>> {
    return await https.get({ url: `${this.baseUrl}/me`, query: { status, page, pageSize } });
  }

  /** The shop: ACTIVE books (or a seller's SOLD ones), filtered and sorted. Lists go comma-separated. */
  async query({ categoryIds, states, conditions, ...rest }: IBookQuery = {}): Promise<IResponse<IShopPage>> {
    const list = (values?: string[]) => (values && values.length ? values.join(",") : undefined);
    return await https.get({
      url: `${this.baseUrl}/query`,
      query: {
        ...rest,
        categoryIds: list(categoryIds),
        states: list(states),
        conditions: list(conditions),
        free: rest.free ? true : undefined,
      },
    });
  }

  /** One book. Public; a draft is only returned to its owner. */
  async get(id: string): Promise<IResponse<IBook>> {
    return await https.get({ url: `${this.baseUrl}/${id}` });
  }

  /** Owner only. Sent fields replace what's there; an ACTIVE book must stay complete. */
  async update(id: string, payload: IUpdateBookPayload): Promise<IResponse<IBook>> {
    return await https.patch({ url: `${this.baseUrl}/${id}`, body: payload });
  }

  /**
   * Owner only. ACTIVE runs the publish checks; a published book can't go back to DRAFT.
   * SOLD must name the buyer, one of `chatBuyers` (API_CHANGES #22a).
   */
  async setStatus(id: string, status: BookStatus, buyerId?: string): Promise<IResponse<IBook>> {
    return await https.post({ url: `${this.baseUrl}/${id}/status`, body: buyerId ? { status, buyerId } : { status } });
  }

  /* Buyers and ratings (API_CHANGES #22) */

  /** Owner only: people with this book open in a chat, most recent first. */
  async chatBuyers(id: string): Promise<IResponse<IChatBuyer[]>> {
    return await https.get({ url: `${this.baseUrl}/${id}/chat-buyers` });
  }

  /** For the rating form: the seller, and the caller's rating if any. `canRate` only for the buyer. */
  async purchaseRating(id: string): Promise<IResponse<IPurchaseRating>> {
    return await https.get({ url: `${this.baseUrl}/${id}/rating` });
  }

  /** Creates or edits the caller's rating of this book's seller. */
  async rate(id: string, payload: IRatePayload): Promise<IResponse<IPurchaseRating>> {
    return await https.put({ url: `${this.baseUrl}/${id}/rating`, body: payload });
  }

  /** Owner only. Permanent. */
  async remove(id: string): Promise<IResponse<null>> {
    return await https.delete({ url: `${this.baseUrl}/${id}` });
  }

  /* Saved books (API_CHANGES #21d) */

  async save(id: string): Promise<IResponse<{ saved: boolean }>> {
    return await https.put({ url: `${this.baseUrl}/${id}/save`, body: {} });
  }

  async unsave(id: string): Promise<IResponse<{ saved: boolean }>> {
    return await https.delete({ url: `${this.baseUrl}/${id}/save` });
  }

  /** Newest saved first. Includes sold and unavailable books. */
  async savedBooks({ page = 0, pageSize = 24 }: { page?: number; pageSize?: number } = {}): Promise<IResponse<IShopPage>> {
    return await https.get({ url: `${this.baseUrl}/saved`, query: { page, pageSize } });
  }

  /** Every saved book id, for the hearts. */
  async savedIds(): Promise<IResponse<string[]>> {
    return await https.get({ url: `${this.baseUrl}/saved/ids` });
  }

  /* Recently viewed (API_CHANGES #21c) */

  /** Up to 20 books, most recent first. */
  async recentlyViewed(): Promise<IResponse<IBook[]>> {
    return await https.get({ url: `${this.baseUrl}/recently-viewed` });
  }

  async clearRecentlyViewed(): Promise<IResponse<unknown>> {
    return await https.delete({ url: `${this.baseUrl}/recently-viewed` });
  }

  /** Counts a view and adds it to recently viewed (the API dedupes counts per viewer per day and ignores non-ACTIVE books). */
  async recordView(id: string): Promise<IResponse<unknown>> {
    return await https.patch({ url: `${this.baseUrl}/${id}/view` });
  }
}

export default new BookService();
