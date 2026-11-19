import { type ReactNode, createContext, useEffect, useState } from "react";
import { getBaseStore, type BaseStore } from "~/store/store";

export type StoreApi = BaseStore;

export const StoreContext = createContext<StoreApi | undefined>(undefined);

/**
 * False on the server and during the first client render; true once the persisted
 * store has been read back from localStorage. Anything that renders differently for
 * a signed-in visitor must wait for this, or the markup won't match the SSR'd HTML.
 */
export const StoreHydratedContext = createContext(false);

export interface IStoreProvider {
  children: ReactNode;
}

/**
 * Renders children on the server as well as the client, so crawlers get real markup.
 *
 * The store is created synchronously but starts empty on both sides (persist runs with
 * `skipHydration`), so server HTML and first client render agree. The persisted state is
 * read back in the effect below, which flips `hydrated` and re-renders with the real
 * session. Queries gated on a token stay disabled until then, so nothing fetches
 * unauthenticated first.
 */
export const StoreProvider = ({ children }: IStoreProvider) => {
  const [store] = useState<StoreApi>(getBaseStore);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // rehydrate() is sync for the default localStorage backend, but it is typed as
    // possibly-thenable, so handle both.
    void Promise.resolve(store.persist.rehydrate()).finally(() => setHydrated(true));
  }, [store]);

  return (
    <StoreContext.Provider value={store}>
      <StoreHydratedContext.Provider value={hydrated}>{children}</StoreHydratedContext.Provider>
    </StoreContext.Provider>
  );
};
