import { ReactNode, useEffect, useState } from "react";
import { useAuthStore, useUserStore, useAppStore } from ".";

interface StoreProviderProps {
  children: ReactNode;
  loadingComponent?: ReactNode; // Optional loading component
}

export function StoreProvider({ children, loadingComponent }: StoreProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize stores
  useAuthStore();
  useUserStore();
  useAppStore();

  useEffect(() => {
    const hydrateStores = async () => {
      await Promise.resolve();
      setIsHydrated(true);
    };

    hydrateStores();
  }, []);

  if (!isHydrated) {
    return loadingComponent || null;
  }

  return children;
}
