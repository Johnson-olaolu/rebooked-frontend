import React from "react";
import { Navigate, Route, Routes } from "react-router";
const OnboardingPage = React.lazy(() => import("./index"));

const OnboardingRoutes = () => {
  return (
    <Routes>
      <Route index element={<OnboardingPage />} />
      <Route path="/*" element={<Navigate to={"/404"} />} />
    </Routes>
  );
};

export default OnboardingRoutes;
