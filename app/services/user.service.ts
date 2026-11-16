import type { IResponse } from "~/types/api";
import type { IUpdateProfilePayload } from "~/types/profile";
import type { ISellerProfile, IUser } from "~/types/user";
import type { ISellerReviewPage } from "~/types/rating";
import https from "~/utils/https";

class UserService {
  private baseUrl = "/user";

  getLoggedInUser = async (): Promise<IResponse<IUser>> => {
    return await https.get({ url: `${this.baseUrl}/me` });
  };

  /**
   * A seller's public profile. The API returns the public summary to everyone else and the full
   * user to the person themselves, so both shapes are folded into one.
   */
  async getPublic(id: string): Promise<IResponse<ISellerProfile>> {
    const response: IResponse<ISellerProfile | IUser> = await https.get({ url: `${this.baseUrl}/${id}` });
    const data = response.data;
    if (!("email" in data)) return { ...response, data };
    const profile = data.profile;
    return {
      ...response,
      data: {
        id: data.id,
        userName: profile?.userName || data.fullName,
        profilePictureUrl: profile?.profilePictureUrl,
        city: profile?.address?.city,
        state: profile?.address?.state,
        bio: profile?.bio,
        joinedAt: data.createdAt,
        hasPhone: !!profile?.contactPhone,
      },
    };
  }

  /**
   * Merges the fields sent into the profile. The backend requires userName and
   * address.city (400 with `errors` otherwise) and then marks onboarding complete.
   */
  /** Account fields. Only fullName is sent; changing email needs its own verified flow. */
  /** Public: a seller's ratings, newest first (API_CHANGES #22c). */
  async ratings(userId: string, { page = 0, pageSize = 10 } = {}): Promise<IResponse<ISellerReviewPage>> {
    return await https.get({ url: `${this.baseUrl}/${userId}/ratings`, query: { page, pageSize } });
  }

  async updateUser(userId: string, payload: { fullName: string }): Promise<IResponse<IUser>> {
    return await https.patch({ url: `${this.baseUrl}/${userId}`, body: payload });
  }

  async updateProfile(userId: string, payload: IUpdateProfilePayload): Promise<IResponse<IUser>> {
    return await https.patch({ url: `${this.baseUrl}/${userId}/profile`, body: payload });
  }
}

export default new UserService();
