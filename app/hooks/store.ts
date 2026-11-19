import { useContext } from "react";
import { useStore } from "zustand";
import { StoreContext, StoreHydratedContext } from "~/provider/StoreProvider";
import type { IStore } from "~/store/store";

export const useBaseStore = <T>(selector: (store: IStore) => T): T => {
  const storeContext = useContext(StoreContext);

  if (!storeContext) {
    throw new Error(`useBaseStore must be used within StoreProvider`);
  }

  return useStore(storeContext, selector);
};

/**
 * True once the persisted store has been read back in the browser. Guard anything
 * that renders (or redirects) differently for a signed-in visitor on this, so the
 * first client render still matches the server-rendered HTML.
 */
export const useStoreHydrated = (): boolean => useContext(StoreHydratedContext);
