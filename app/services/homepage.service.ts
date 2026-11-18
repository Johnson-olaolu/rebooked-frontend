import type { IResponse } from "~/types/api";
import type { IForYou, IHomepage, IHomepageStats } from "~/types/homepage";
import https from "~/utils/https";

/** The home page bundle (API_CHANGES #24). */
class HomepageService {
  private baseUrl = "/homepage";

  /** Public. Every non-personalised section, served from Redis snapshots. */
  async get(): Promise<IResponse<IHomepage>> {
    return await https.get({ url: this.baseUrl });
  }

  /** Public. Just the stats, for pages other than home. */
  async stats(): Promise<IResponse<IHomepageStats>> {
    return await https.get({ url: `${this.baseUrl}/stats` });
  }

  /** Signed in. Personalised AI picks, or the global ones with `personalised: false`. */
  async forYou(): Promise<IResponse<IForYou>> {
    return await https.get({ url: `${this.baseUrl}/for-you` });
  }
}

const homepageService = new HomepageService();
export default homepageService;
