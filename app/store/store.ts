import { createStore, type StateCreator } from "zustand/vanilla";
import { persist } from "zustand/middleware";
import { createAuthSlice, type IAuthSlice } from "./features/authSlice";
import { createUserSlice, type IUserSlice } from "./features/userSlice";
import type { Language } from "~/utils/constants";

export interface IAppSlice {
  darkMode: boolean;
  language: Language;
  setDarkMode: (darkMode: boolean) => void;
  setLanguage: (language: Language) => void;
}

export const createAppSlice: StateCreator<IAppSlice, [], [], IAppSlice> = (set, get) => {
  let darkMode = false;
  if (typeof window !== "undefined") {
    const isDarkMode = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    console.log({ darkMode });
    darkMode = isDarkMode;
  }
  return {
    darkMode,
    language: "en",
    setDarkMode: (darkMode) => set({ darkMode }),
    setLanguage: (language) => set({ language }),
  };
};

export type IStore = IAppSlice & IAuthSlice & IUserSlice;

export const createBaseStore = () => {
  return createStore<IStore>()(
    persist(
      (...a) => ({
        ...createAppSlice(...a),
        ...createAuthSlice(...a),
        ...createUserSlice(...a),
      }),
      { name: "rebooked-store", storage: typeof window !== "undefined" ? localStorage : undefined },
    ),
  );
};
