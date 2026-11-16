import type { IResponse } from "~/types/api";
import type { INotificationPage, NotificationFilter } from "~/types/notification";
import https from "~/utils/https";

/** Notification reads over REST (API_CHANGES #19d). Marking read goes over the socket. */
class NotificationService {
  private baseUrl = "/notification";

  async list(params: { filter?: NotificationFilter; page?: number; pageSize?: number }): Promise<IResponse<INotificationPage>> {
    return await https.get({
      url: this.baseUrl,
      query: { filter: params.filter ?? "ALL", page: params.page ?? 0, pageSize: params.pageSize ?? 30 },
    });
  }

  async unreadCount(): Promise<IResponse<{ total: number }>> {
    return await https.get({ url: `${this.baseUrl}/unread-count` });
  }
}

const notificationService = new NotificationService();
export default notificationService;
