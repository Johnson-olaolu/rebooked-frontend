import { type ReactNode, createContext, useEffect, useState } from "react";
import { getBaseStore, type BaseStore } from "~/store/store";

export type StoreApi = BaseStore;

export const StoreContext = createContext<StoreApi | undefined>(undefined);

export interface IStoreProvider {
  children: ReactNode;
}

/**
 * Renders children only on the client, once the persisted store is available,
 * so components never read tokens/user from an empty server-side store.
 */
export const StoreProvider = ({ children }: IStoreProvider) => {
  const [store, setStore] = useState<StoreApi>();

  useEffect(() => {
    setStore(getBaseStore());
  }, []);

  if (!store) return null;

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
};
