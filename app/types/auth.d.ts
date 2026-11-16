import type { IUser } from "./user";

export interface IRegisterPayload {
  email: string;
  fullName: string;
  password: string;
}

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface ILoginResponse {
  token: string;
  /** Access-token lifetime in milliseconds. */
  expiresIn: number;
  refreshToken: string;
  user: IUser;
}

export interface IConfirmEmailPayload {
  email: string;
  /** The 6-digit code sent by email. */
  token: string;
}

export interface IResetPasswordPayload {
  email: string;
  /** The 6-character code from the reset link. */
  token: string;
  password: string;
}

export interface IChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
