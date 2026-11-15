import { createStore, type StateCreator } from "zustand/vanilla";
import { persist } from "zustand/middleware";
import { createAuthSlice, type IAuthSlice } from "./features/authSlice";
import { createUserSlice, type IUserSlice } from "./features/userSlice";
import { createOnboardingSlice, type IOnboardingSlice } from "./features/onboardingSlice";
import type { Language } from "~/utils/constants";

export interface IAppSlice {
  darkMode: boolean;
  language: Language;
  setDarkMode: (darkMode: boolean) => void;
  setLanguage: (language: Language) => void;
  /** Dashboard sidebar collapsed to icons (desktop). Persisted per browser. */
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const createAppSlice: StateCreator<IStore, [], [], IAppSlice> = (set) => {
  let darkMode = false;
  if (typeof window !== "undefined") {
    darkMode = !!window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return {
    darkMode,
    language: "en",
    setDarkMode: (darkMode) => set({ darkMode }),
    setLanguage: (language) => set({ language }),
    sidebarCollapsed: false,
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  };
};

export type IStore = IAppSlice & IAuthSlice & IUserSlice & IOnboardingSlice;

export const createBaseStore = () => {
  return createStore<IStore>()(
    persist(
      (...a) => ({
        ...createAppSlice(...a),
        ...createAuthSlice(...a),
        ...createUserSlice(...a),
        ...createOnboardingSlice(...a),
      }),
      {
        name: "rebooked-store",
        partialize: (state) => ({
          darkMode: state.darkMode,
          language: state.language,
          sidebarCollapsed: state.sidebarCollapsed,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          accessTokenExpiresAt: state.accessTokenExpiresAt,
          user: state.user,
        }),
      },
    ),
  );
};

export type BaseStore = ReturnType<typeof createBaseStore>;

let browserStore: BaseStore | undefined;

/**
 * One store per browser tab, shared by React (via StoreProvider) and
 * non-React code such as the HTTP client. On the server a fresh store is
 * created per call so state never leaks between requests.
 */
export const getBaseStore = (): BaseStore => {
  if (typeof window === "undefined") return createBaseStore();
  if (!browserStore) browserStore = createBaseStore();
  return browserStore;
};
