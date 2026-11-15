import type { StateCreator } from "zustand";
import type { IStore } from "../store";

export interface ITokens {
  accessToken: string;
  refreshToken: string;
  /** Access-token lifetime in ms, as returned by the API (`expiresIn`). */
  expiresIn: number;
}

export interface IAuthSlice {
  accessToken: string;
  refreshToken: string;
  /** Epoch ms when the access token expires (0 = unknown). */
  accessTokenExpiresAt: number;
  setTokens: (tokens: ITokens) => void;
  /** Clears tokens and the logged-in user. */
  logout: () => void;
}

export const createAuthSlice: StateCreator<IStore, [], [], IAuthSlice> = (set) => ({
  accessToken: "",
  refreshToken: "",
  accessTokenExpiresAt: 0,
  setTokens: ({ accessToken, refreshToken, expiresIn }) =>
    set({ accessToken, refreshToken, accessTokenExpiresAt: expiresIn ? Date.now() + expiresIn : 0 }),
  logout: () => set({ accessToken: "", refreshToken: "", accessTokenExpiresAt: 0, user: undefined }),
});
