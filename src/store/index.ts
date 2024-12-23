import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Language = "en" | "es" | "fr";

interface AppState {
  darkMode: boolean;
  language: Language;
  setDarkMode: (darkMode: boolean) => void;
  setLanguage: (language: Language) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      darkMode: false,
      language: "en",
      setDarkMode: (darkMode) => set({ darkMode }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "app-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        darkMode: state.darkMode,
        language: state.language,
      }),
    }
  )
);

// Re-export other stores for convenience
export { useAuthStore } from "./auth.store";
export { useUserStore } from "./user.store";
