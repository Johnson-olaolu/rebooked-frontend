import type { IResponse } from "~/types/api";
import type { IConfirmEmailPayload, ILoginPayload, ILoginResponse, IRegisterPayload } from "~/types/auth";
import type { IUser } from "~/types/user";
import https from "~/utils/https";

class AuthService {
  private baseUrl = "/auth";

  async register(payload: IRegisterPayload): Promise<IResponse<ILoginResponse>> {
    return await https.post({ url: `${this.baseUrl}/register`, body: payload });
  }

  async login(payload: ILoginPayload): Promise<IResponse<ILoginResponse>> {
    return await https.post({ url: `${this.baseUrl}/login`, body: payload });
  }

  async confirmEmail(payload: IConfirmEmailPayload): Promise<IResponse<IUser>> {
    return await https.post({ url: `${this.baseUrl}/confirm-email`, body: payload });
  }

  /** Sends a new verification code. Returns 429 inside the 30s cooldown. */
  async resendConfirmEmail(email: string): Promise<IResponse<unknown>> {
    return await https.get({ url: `${this.baseUrl}/confirm-email`, query: { email } });
  }

  async refreshToken(refreshToken: string): Promise<IResponse<ILoginResponse>> {
    return await https.post({ url: `${this.baseUrl}/refresh-token`, body: { refreshToken } });
  }

  async logout(refreshToken: string): Promise<IResponse<unknown>> {
    return await https.post({ url: `${this.baseUrl}/logout`, body: { refreshToken } });
  }
}

export default new AuthService();
