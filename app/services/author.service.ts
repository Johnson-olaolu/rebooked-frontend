import type { IResponse } from "~/types/api";
import type { IAuthorDetail, IAuthorSummary, IProposeAuthorResult } from "~/types/author";
import https from "~/utils/https";

/** The author catalogue (API_CHANGES #23c). Reads are public. */
class AuthorService {
  private baseUrl = "/author";

  /** Autocomplete: names and aliases, exact matches first. `q` needs 2+ letters. */
  async search(q: string, limit = 10): Promise<IResponse<IAuthorSummary[]>> {
    return await https.get({ url: `${this.baseUrl}/search`, query: { q, limit } });
  }

  /** A merged author comes back as the one it was merged into (compare `slug`). */
  async getBySlug(slug: string): Promise<IResponse<IAuthorDetail>> {
    return await https.get({ url: `${this.baseUrl}/slug/${encodeURIComponent(slug)}` });
  }

  /**
   * Adds a missing author. When close matches exist (and `force` is false) nothing is created and
   * they come back as `candidates`; call again with `force` once the seller says it's someone else.
   */
  async propose(name: string, force = false): Promise<IResponse<IProposeAuthorResult>> {
    return await https.post({ url: `${this.baseUrl}/proposals`, body: { name, force } });
  }

  /** Authors with the most books on Rebooked right now (the home page). */
  async top(limit = 8): Promise<IResponse<IAuthorSummary[]>> {
    return await https.get({ url: `${this.baseUrl}/top`, query: { limit } });
  }
}

export default new AuthorService();
