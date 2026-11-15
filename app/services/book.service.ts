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

  /** Owner only. ACTIVE runs the publish checks; a published book can't go back to DRAFT. */
  async setStatus(id: string, status: BookStatus): Promise<IResponse<IBook>> {
    return await https.post({ url: `${this.baseUrl}/${id}/status`, body: { status } });
  }

  /** Owner only. Permanent. */
  async remove(id: string): Promise<IResponse<null>> {
    return await https.delete({ url: `${this.baseUrl}/${id}` });
  }

  /** Counts a view (the API dedupes per viewer per day and ignores non-ACTIVE books). */
  async recordView(id: string): Promise<IResponse<IBook>> {
    return await https.patch({ url: `${this.baseUrl}/${id}/view` });
  }
}

export default new BookService();
