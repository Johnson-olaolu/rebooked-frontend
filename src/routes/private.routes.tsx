import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { useAuthStore } from "@/store";
import { isValidToken } from "@/utils/misc";
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const PrivateRoutes = (): JSX.Element => {
  const token = useAuthStore().accessToken;
  const isAuthenticated = isValidToken(token);
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" />;
  }
  return (
    <AuthenticatedLayout>
      <Outlet />
    </AuthenticatedLayout>
  );
};

export default PrivateRoutes;
