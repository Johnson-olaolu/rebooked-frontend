import type { IResponse } from "~/types/api";
import type { ConversationFilter, IConversation, IConversationPage, IConversationWith, IMessagePage } from "~/types/chat";
import https from "~/utils/https";

/** Chat reads over REST (API_CHANGES #18f). Writes go over the socket (`app/lib/chatSocket.ts`). */
class ChatService {
  private baseUrl = "/conversation";

  async list(params: { filter?: ConversationFilter; search?: string; page?: number; pageSize?: number }): Promise<
    IResponse<IConversationPage>
  > {
    return await https.get({
      url: this.baseUrl,
      query: { filter: params.filter ?? "ALL", search: params.search || undefined, page: params.page ?? 0, pageSize: params.pageSize ?? 20 },
    });
  }

  async get(id: string): Promise<IResponse<IConversation>> {
    return await https.get({ url: `${this.baseUrl}/${id}` });
  }

  /** Newest first; pass the oldest id you have as `before` to page back. */
  async messages(id: string, before?: string, limit = 30): Promise<IResponse<IMessagePage>> {
    return await https.get({ url: `${this.baseUrl}/${id}/messages`, query: { before, limit } });
  }

  /** The caller's conversation with this book's seller, if any (`data: null` when none). */
  async withBook(bookId: string): Promise<IResponse<IConversationWith | null>> {
    return await https.get({ url: `${this.baseUrl}/with`, query: { bookId } });
  }

  /** The caller's conversation with this user, if any (`data: null` when none). */
  async withUser(userId: string): Promise<IResponse<IConversationWith | null>> {
    return await https.get({ url: `${this.baseUrl}/with`, query: { userId } });
  }

  async unreadCount(): Promise<IResponse<{ total: number }>> {
    return await https.get({ url: `${this.baseUrl}/unread-count` });
  }
}

const chatService = new ChatService();
export default chatService;
