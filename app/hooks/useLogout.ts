import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import authService from "~/services/auth.service";
import { useBaseStore } from "./store";

/** Revokes the refresh token (best effort), clears the session and goes home. */
export const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const refreshToken = useBaseStore((state) => state.refreshToken);
  const logout = useBaseStore((state) => state.logout);

  return useCallback(async () => {
    if (refreshToken) await authService.logout(refreshToken).catch(() => undefined);
    // "manual" tells route guards to send us home rather than to /login.
    logout({ manual: true });
    queryClient.clear();
    navigate("/", { replace: true });
    toast.success("You've logged out.");
  }, [refreshToken, logout, queryClient, navigate]);
};
