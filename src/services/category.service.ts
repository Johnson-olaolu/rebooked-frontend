import https from "@/utils/https";
import { ICategory, ICreateCategoryPayload, IResponse } from "./types";

class CategoryService {
  private baseurl = "/api/category";

  async getCategories(): Promise<IResponse<ICategory[]>> {
    return https.get({
      url: `${this.baseurl}`,
    });
  }

  async getCategoryById(id: string): Promise<IResponse<ICategory>> {
    return https.get({
      url: `${this.baseurl}/${id}`,
    });
  }

  async getCategoryByName(name: string): Promise<IResponse<ICategory>> {
    return https.get({
      url: `${this.baseurl}/name`,
      query: { name },
    });
  }

  async createCategory(category: ICreateCategoryPayload): Promise<IResponse<ICategory>> {
    return https.post({
      url: `${this.baseurl}`,
      body: JSON.stringify(category),
    });
  }

  async updateCategory(id: string, category: ICreateCategoryPayload): Promise<IResponse<ICategory>> {
    return https.put({
      url: `${this.baseurl}/${id}`,
      body: JSON.stringify(category),
    });
  }

  async deleteCategory(id: string): Promise<IResponse<null>> {
    return https.delete({
      url: `${this.baseurl}/${id}`,
    });
  }
}

export default new CategoryService();
