import React from "react";
import { Navigate, Route, Routes } from "react-router";

const HomePage = React.lazy(() => import("./home"));

const LandingRoutes = () => {
  return (
    <Routes>
      <Route index element={<HomePage />} />
      <Route path="/*" element={<Navigate to={"/404"} />} />
    </Routes>
  );
};

export default LandingRoutes;
