import type { IResponse } from "~/types/api";
import type { INotificationPage, INotificationPreference, IPreferenceChange, NotificationFilter } from "~/types/notification";
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

  async preferences(): Promise<IResponse<INotificationPreference[]>> {
    return await https.get({ url: `${this.baseUrl}/preferences` });
  }

  /** Turns one channel of one type on or off; returns the full list. */
  async updatePreference(change: IPreferenceChange): Promise<IResponse<INotificationPreference[]>> {
    return await https.patch({ url: `${this.baseUrl}/preferences`, body: change });
  }

  /** Public: the token from an email's unsubscribe link turns that type's email off. */
  async unsubscribe(token: string): Promise<IResponse<{ type: string; channel: string }>> {
    return await https.post({ url: `${this.baseUrl}/unsubscribe`, body: { token } });
  }
}

const notificationService = new NotificationService();
export default notificationService;
