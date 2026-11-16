import type { IResponse } from "~/types/api";
import type {
  IChangePasswordPayload,
  IConfirmEmailPayload,
  ILoginPayload,
  ILoginResponse,
  IRegisterPayload,
  IResetPasswordPayload,
} from "~/types/auth";
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

  /** Emails a reset link. 429 inside the cooldown. */
  async forgotPassword(email: string): Promise<IResponse<unknown>> {
    return await https.get({ url: `${this.baseUrl}/forgot-password`, query: { email } });
  }

  /** Sets a new password with the code from the reset link. */
  async resetPassword(payload: IResetPasswordPayload): Promise<IResponse<IUser>> {
    return await https.post({ url: `${this.baseUrl}/forgot-password`, body: payload });
  }

  /** Logged in: changes the password and returns fresh tokens; other devices are signed out (API_CHANGES #20). */
  async changePassword(payload: IChangePasswordPayload): Promise<IResponse<ILoginResponse>> {
    return await https.post({ url: `${this.baseUrl}/change-password`, body: payload });
  }

  async refreshToken(refreshToken: string): Promise<IResponse<ILoginResponse>> {
    return await https.post({ url: `${this.baseUrl}/refresh-token`, body: { refreshToken } });
  }

  async logout(refreshToken: string): Promise<IResponse<unknown>> {
    return await https.post({ url: `${this.baseUrl}/logout`, body: { refreshToken } });
  }
}

export default new AuthService();
