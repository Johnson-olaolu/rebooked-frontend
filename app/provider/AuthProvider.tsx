import { useQuery } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router";
import { useBaseStore, useStoreHydrated } from "~/hooks/store";
import { useRedirectOnce } from "~/hooks/useRedirectOnce";
import userService from "~/services/user.service";

interface AuthProviderProps {
  children: ReactNode;
  /**
   * "complete": the page needs a finished profile (e.g. dashboard) — otherwise go to onboarding.
   * "incomplete": the page is onboarding itself — finished users go to the dashboard.
   */
  onboarding?: "complete" | "incomplete";
}

/**
 * Guards private routes: sends visitors without a token to /login and keeps the
 * stored user in sync with GET /user/me.
 */
const AuthProvider = ({ children, onboarding }: AuthProviderProps) => {
  const location = useLocation();
  // Until the persisted store is read back, nobody looks signed in — so every check
  // below has to wait, or a signed-in visitor gets bounced to /login on first paint.
  const hydrated = useStoreHydrated();
  const accessToken = useBaseStore((state) => state.accessToken);
  const setUser = useBaseStore((state) => state.setUser);
  const user = useBaseStore((state) => state.user);

  const { data, isError, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: userService.getLoggedInUser,
    enabled: !!accessToken,
  });

  useEffect(() => {
    if (data?.data) setUser(data.data);
  }, [data, setUser]);

  const onboarded = !!user?.profile?.onboardingCompleted;
  const wrongPlace = !!user && ((onboarding === "complete" && !onboarded) || (onboarding === "incomplete" && onboarded));

  const loggedOutManually = useBaseStore((state) => state.loggedOutManually);
  const loggedOut = hydrated && (!accessToken || isError);
  useRedirectOnce(loggedOut, loggedOutManually ? "/" : `/login?redirect=${encodeURIComponent(location.pathname)}`);
  useRedirectOnce(hydrated && !loggedOut && wrongPlace, onboarding === "complete" ? "/onboarding/profile" : "/dashboard");

  // Private pages are never server-rendered with content: there's no session on the
  // server, and they have nothing to offer a crawler anyway.
  if (!hydrated) {
    return <div className="flex min-h-screen items-center justify-center text-foreground/60">Loading…</div>;
  }
  if (!accessToken || wrongPlace) return null;
  // Use the persisted user while /user/me loads, so the page doesn't flash.
  if (isLoading && !user) {
    return <div className="flex min-h-screen items-center justify-center text-foreground/60">Loading…</div>;
  }
  return <>{children}</>;
};

export default AuthProvider;
