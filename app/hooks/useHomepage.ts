import { useQuery } from "@tanstack/react-query";
import homepageService from "~/services/homepage.service";
import type { IHomepage } from "~/types/homepage";
import { useBaseStore } from "./store";

export const homepageKey = ["homepage"] as const;

/**
 * GET /homepage (API_CHANGES #24b). One request for the whole page: each section passes a
 * `select` for its slice, and TanStack Query shares the fetch between them.
 */
export const useHomepage = <T = IHomepage>(select?: (homepage: IHomepage) => T) =>
  useQuery({
    queryKey: homepageKey,
    queryFn: () => homepageService.get().then((response) => response.data),
    select,
    // The server rebuilds snapshots every 5 min to 1 h; refetching sooner gains nothing.
    staleTime: 5 * 60 * 1000,
  });

/** GET /homepage/for-you (#24f): only when signed in. */
export const useForYou = () => {
  const loggedIn = useBaseStore((state) => !!state.accessToken && !!state.user);
  return useQuery({
    queryKey: ["homepage", "for-you"],
    queryFn: () => homepageService.forYou().then((response) => response.data),
    enabled: loggedIn,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
};
