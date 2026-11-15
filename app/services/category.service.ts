import type { IResponse } from "~/types/api";
import type { ICategory } from "~/types/book";
import https from "~/utils/https";

class CategoryService {
  private baseUrl = "/category";

  /** All categories (public). They rarely change, so callers cache them for a long time. */
  async getAll(): Promise<IResponse<ICategory[]>> {
    return await https.get({ url: this.baseUrl });
  }
}

export default new CategoryService();
