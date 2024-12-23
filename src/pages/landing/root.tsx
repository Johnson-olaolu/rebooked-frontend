import React from "react";
import { Navigate, Route, Routes } from "react-router";
const Homepage = React.lazy(() => import("./home"));

const LandingRoutes = () => {
  return (
    <Routes>
      <Route index element={<Homepage />} />
      <Route path="/*" element={<Navigate to={"/404"} />} />
    </Routes>
  );
};

export default LandingRoutes;
