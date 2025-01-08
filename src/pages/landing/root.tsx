import React from "react";
import { Navigate, Route, Routes } from "react-router";
import DefaultLayout from "../components/layout.tsx";

const HomePage = React.lazy(() => import("./home"));

const LandingRoutes = () => {
  return (
    <DefaultLayout>
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="/*" element={<Navigate to={"/404"} />} />
      </Routes>
    </DefaultLayout>
  );
};

export default LandingRoutes;
