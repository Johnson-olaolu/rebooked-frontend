import PrivateRoutes from "@/routes/private.routes";
import React from "react";
import { Navigate, Route, Routes } from "react-router";
import SellerLandingRoutes from "./landing/root";
import PublicRoutes from "@/routes/public.routes";
import SellerNotFound from "./404";

const SellerDashboard = React.lazy(() => import("./dashboard/root"));
const SellerOnboarding = React.lazy(() => import("./onboarding/root"));

const SellerRoutes = () => {
  return (
    <Routes>
      <Route index element={<Navigate to={"/seller/home"} />} />
      <Route element={<PublicRoutes />}>
        <Route path="/*" element={<SellerLandingRoutes />} />
      </Route>
      <Route element={<PrivateRoutes />}>
        <Route path="/dashboard/*" element={<SellerDashboard />} />
        <Route path="/onboarding" element={<SellerOnboarding />} />
      </Route>
      <Route path="/404" element={<SellerNotFound />} />
      <Route path="/*" element={<Navigate to={"/seller/404"} />} />
    </Routes>
  );
};

export default SellerRoutes;
