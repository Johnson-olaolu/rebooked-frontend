import https from "@/utils/https";
import { IResponse } from "./types";
import { IBook, ICreateBookPayload, IQueryBookParams, IQuerySoldBooksParams, IUpdateBookPayload, IUpdateBookStatusPayload } from "./types";
class BookService {
  private baseurl = "/api/book";

  async createBook(book: ICreateBookPayload): Promise<IResponse<IBook>> {
    return https.post({
      url: this.baseurl,
      body: JSON.stringify(book),
    });
  }

  async getBook(id: string): Promise<IResponse<IBook>> {
    return https.get({
      url: `${this.baseurl}/${id}`,
    });
  }

  async getAllBooks(status?: string): Promise<IResponse<IBook[]>> {
    return https.get({
      url: this.baseurl,
      query: status ? { status } : undefined,
    });
  }

  async queryBooks(params: IQueryBookParams): Promise<IResponse<IBook[]>> {
    return https.get({
      url: `${this.baseurl}/query`,
      query: params,
    });
  }

  async querySoldBooks(params: IQuerySoldBooksParams): Promise<IResponse<IBook[]>> {
    return https.get({
      url: `${this.baseurl}/sold`,
      query: params,
    });
  }

  async updateBook(id: string, book: IUpdateBookPayload): Promise<IResponse<IBook>> {
    return https.patch({
      url: `${this.baseurl}/${id}`,
      body: JSON.stringify(book),
    });
  }

  async updateBookStatus(id: string, statusPayload: IUpdateBookStatusPayload): Promise<IResponse<IBook>> {
    return https.post({
      url: `${this.baseurl}/${id}/status`,
      body: JSON.stringify(statusPayload),
    });
  }

  async deleteBook(id: string): Promise<IResponse<null>> {
    return https.delete({
      url: `${this.baseurl}/${id}`,
    });
  }
}

export default new BookService();
