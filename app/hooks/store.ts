import { useContext } from "react";
import { useStore } from "zustand";
import { StoreContext } from "~/provider/StoreProvider";
import type { IStore } from "~/store/store";

export const useBaseStore = <T>(selector: (store: IStore) => T): T => {
  const storeContext = useContext(StoreContext);

  if (!storeContext) {
    throw new Error(`useBaseStore must be used within StoreProvider`);
  }

  return useStore(storeContext, selector);
};
