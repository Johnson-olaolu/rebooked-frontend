import categoryService from "@/services/category.service";
import userService from "@/services/user.service";
import { useUserStore } from "@/store";
import { useCategoryStore } from "@/store/category.store";
import { useQuery } from "@tanstack/react-query";
import React from "react";

const AuthenticatedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setUser } = useUserStore();
  const { setCategories } = useCategoryStore();
  useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await userService.getUserDetails();
      if (res.data) setUser(res.data);
      return res.data;
    },
  });

  useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await categoryService.getCategories();
      if (res.data) setCategories(res.data);
      return res.data;
    },
  });
  return <>{children}</>;
};

export default AuthenticatedLayout;
