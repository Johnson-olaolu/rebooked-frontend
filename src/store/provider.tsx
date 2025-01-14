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
    const unsubHydrate = useAppStore.persist.onHydrate(() => setIsHydrated(false));

    const unsubFinishHydration = useAppStore.persist.onFinishHydration(() => setIsHydrated(true));

    setIsHydrated(useAppStore.persist.hasHydrated());

    return () => {
      unsubHydrate();
      unsubFinishHydration();
    };
  }, []);

  if (!isHydrated) {
    return loadingComponent || null;
  }

  return children;
}
