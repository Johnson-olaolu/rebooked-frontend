import type { IResponse } from "~/types/api";
import type { IUpdateProfilePayload } from "~/types/profile";
import type { IUser } from "~/types/user";
import https from "~/utils/https";

class UserService {
  private baseUrl = "/user";

  getLoggedInUser = async (): Promise<IResponse<IUser>> => {
    return await https.get({ url: `${this.baseUrl}/me` });
  };

  /**
   * Merges the fields sent into the profile. The backend requires userName and
   * address.city (400 with `errors` otherwise) and then marks onboarding complete.
   */
  async updateProfile(userId: string, payload: IUpdateProfilePayload): Promise<IResponse<IUser>> {
    return await https.patch({ url: `${this.baseUrl}/${userId}/profile`, body: payload });
  }
}

export default new UserService();
