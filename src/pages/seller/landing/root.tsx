import React from "react";
import { Navigate, Route, Routes } from "react-router";
const Homepage = React.lazy(() => import("./home"));

const SellerLandingRoutes = () => {
  return (
    <Routes>
      <Route path="/home" element={<Homepage />} />
      <Route path="/*" element={<Navigate to={"/404"} />} />
    </Routes>
  );
};

export default SellerLandingRoutes;
