import React from "react";
import { Navigate, Route, Routes } from "react-router";
const ShopPage = React.lazy(() => import("./index"));

const ShopRoutes = () => {
  return (
    <Routes>
      <Route index element={<ShopPage />} />
      <Route path="/*" element={<Navigate to={"/404"} />} />
    </Routes>
  );
};

export default ShopRoutes;
