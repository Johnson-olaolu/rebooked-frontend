import userService from "@/services/user.service";
import { useUserStore } from "@/store";
import { useQuery } from "@tanstack/react-query";
import React from "react";

const AuthenticatedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setUser } = useUserStore();
  useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await userService.getUserDetails();
      console.log(res.data);
      if (res.data) setUser(res.data);
      return res.data;
    },
  });
  return <>{children}</>;
};

export default AuthenticatedLayout;
