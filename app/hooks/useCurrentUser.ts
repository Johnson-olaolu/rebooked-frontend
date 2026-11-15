import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import userService from "~/services/user.service";
import { useBaseStore } from "./store";

/**
 * For public pages: returns the stored user and refreshes it from /user/me when
 * a token exists. Unlike AuthProvider it never redirects.
 */
export const useCurrentUser = () => {
  const accessToken = useBaseStore((state) => state.accessToken);
  const user = useBaseStore((state) => state.user);
  const setUser = useBaseStore((state) => state.setUser);

  const { data } = useQuery({
    queryKey: ["user"],
    queryFn: userService.getLoggedInUser,
    enabled: !!accessToken,
  });

  useEffect(() => {
    if (data?.data) setUser(data.data);
  }, [data, setUser]);

  return { user: accessToken ? user : undefined, isLoggedIn: !!accessToken && !!user };
};
