import https from "@/utils/https";
import { IResponse, IUpdateProfilePayload, IUser } from "./types";

class UserService {
  private readonly baseUrl = "/api/user"; // Adjust base URL as needed

  async getUserDetails(): Promise<IResponse<IUser>> {
    return await https.get({ url: `${this.baseUrl}/me` });
  }

  async updateUserprofile(userId: string, payload: IUpdateProfilePayload): Promise<IResponse<IUser>> {
    return await https.patch({
      url: `${this.baseUrl}/${userId}/profile`,
      body: JSON.stringify(payload),
    });
  }
}

export default new UserService();
