import React from "react";
import { Route, Routes } from "react-router";
import PrivateRoutes from "./private.routes";
import PublicRoutes from "./public.routes";
import LandingRoutes from "@/pages/landing/root";
import AuthRoutes from "@/pages/auth/root";
import OnboardingRoutes from "@/pages/onboarding/root";
import DashboardRoutes from "@/pages/dashboard/root";
import ShopRoutes from "@/pages/shop/root";
const NotFound = React.lazy(() => import("@/pages/404"));

const IndexRoutes = () => {
  return (
    <React.Suspense fallback={<div>loading</div>}>
      <Routes>
        <Route element={<PublicRoutes />}>
          <Route path="/*" element={<LandingRoutes />} />
          <Route path="auth/*" element={<AuthRoutes />} />
          <Route path="shop/*" element={<ShopRoutes />} />
        </Route>
        <Route element={<PrivateRoutes />}>
          <Route path="onboarding/*" element={<OnboardingRoutes />} />
          <Route path="dashboard/*" element={<DashboardRoutes />} />
          <Route
            path="/*"
            element={
              <div className="flex flex-col items-center justify-center h-screen">
                <h1 className="text-4xl font-bold">Private Route</h1>
              </div>
            }
          />
        </Route>
        <Route path="/404" element={<NotFound />} />
      </Routes>
    </React.Suspense>
  );
};

export default IndexRoutes;
