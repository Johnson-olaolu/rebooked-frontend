import React from "react";
import { Route, Routes } from "react-router";
import AuthRoutes from "@/pages/auth/root";
import ShopRoutes from "@/pages/shop/root";
import SellerRoutes from "@/pages/seller/root";
import LandingRoutes from "@/pages/landing/root";

const NotFound = React.lazy(() => import("@/pages/404"));

const IndexRoutes = () => {
  return (
    <React.Suspense fallback={<div>loading</div>}>
      <Routes>
        <Route path="/*" element={<LandingRoutes />} />
        <Route path="auth/*" element={<AuthRoutes />} />
        <Route path="shop/*" element={<ShopRoutes />} />
        <Route path="seller/*" element={<SellerRoutes />} />
        <Route path="/404" element={<NotFound />} />
      </Routes>
    </React.Suspense>
  );
};

export default IndexRoutes;
