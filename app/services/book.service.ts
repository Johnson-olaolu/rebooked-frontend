import type { IResponse } from "~/types/api";
import type { IBook, ICreateBookPayload, IShelfPage, IShelfQuery } from "~/types/book";
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
}

export default new BookService();
