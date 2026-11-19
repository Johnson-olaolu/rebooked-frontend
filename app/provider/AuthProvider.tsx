import { useQuery } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router";
import { useBaseStore } from "~/hooks/store";
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
  const loggedOut = !accessToken || isError;
  useRedirectOnce(loggedOut, loggedOutManually ? "/" : `/login?redirect=${encodeURIComponent(location.pathname)}`);
  useRedirectOnce(!loggedOut && wrongPlace, onboarding === "complete" ? "/onboarding/profile" : "/dashboard");

  if (!accessToken || wrongPlace) return null;
  // Use the persisted user while /user/me loads, so the page doesn't flash.
  if (isLoading && !user) {
    return <div className="flex min-h-screen items-center justify-center text-foreground/60">Loading…</div>;
  }
  return <>{children}</>;
};

export default AuthProvider;
