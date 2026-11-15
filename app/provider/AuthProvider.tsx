"use client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { useBaseStore } from "~/hooks/store";
import userService from "~/services/user.service";

/**
 * Guards private routes: sends visitors without a token to /login and keeps the
 * stored user in sync with GET /user/me.
 */
const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
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
    if (!accessToken || isError) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`, { replace: true });
    }
  }, [accessToken, isError, location.pathname, navigate]);

  useEffect(() => {
    if (data?.data) setUser(data.data);
  }, [data, setUser]);

  if (!accessToken) return null;
  // Use the persisted user while /user/me loads, so the page doesn't flash.
  if (isLoading && !user) {
    return <div className="flex min-h-screen items-center justify-center text-foreground/60">Loading…</div>;
  }
  return <>{children}</>;
};

export default AuthProvider;
