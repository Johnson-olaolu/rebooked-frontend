import http from "@/utils/https";
import {
  ChangePasswordPayload,
  ConfirmEmailPayload,
  ILoginResponse,
  IResponse,
  IUser,
  LoginPayload,
  ResetPasswordPayload,
  SignUpPayload,
} from "./types";

class AuthService {
  private baseUrl = "/api/auth"; // Adjust base URL as needed

  async login(payload: LoginPayload): Promise<IResponse<ILoginResponse>> {
    return http.post({
      url: `${this.baseUrl}/login`,
      body: JSON.stringify(payload),
    });
  }

  async googleLogin(payload: { accessToken: string; role?: string }): Promise<IResponse<ILoginResponse>> {
    return http.post({
      url: `${this.baseUrl}/google/login`,
      body: JSON.stringify(payload),
    });
  }

  async facebookLogin(payload: { accessToken: string; role?: string }): Promise<IResponse<ILoginResponse>> {
    return http.post({
      url: `${this.baseUrl}/facebook/login`,
      body: JSON.stringify(payload),
    });
  }

  async signUp(payload: SignUpPayload): Promise<IResponse<ILoginResponse>> {
    return http.post({
      url: `${this.baseUrl}/register`,
      body: JSON.stringify(payload),
    });
  }

  async forgotPassword(email: string): Promise<IResponse<IUser>> {
    return http.get({
      url: `${this.baseUrl}/forgot-password`,
      query: { email },
    });
  }

  async resetPassword(payload: ResetPasswordPayload): Promise<IResponse<IUser>> {
    return http.post({
      url: `${this.baseUrl}/forgot-password`,
      body: JSON.stringify(payload),
    });
  }

  async changePassword(payload: ChangePasswordPayload): Promise<IResponse<IUser>> {
    return http.post({
      url: `${this.baseUrl}/change-password`,
      body: JSON.stringify(payload),
    });
  }

  async confirmEmail(payload: ConfirmEmailPayload): Promise<IResponse<IUser>> {
    return http.post({
      url: `${this.baseUrl}/confirm-email`,
      body: JSON.stringify(payload),
    });
  }

  async sendConfirmEmail(email: string): Promise<IResponse<IUser>> {
    return http.get({
      url: `${this.baseUrl}/confirm-email`,
      query: { email },
    });
  }
}

export default new AuthService();
