import { Navigate, Route, Routes } from "react-router";
import DashboardLayout from "./components/layout";
import React from "react";

const DashboardHome = React.lazy(() => import("./home"));

const DashboardRoutes = () => {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Navigate to="/dashboard/home" />} />
        <Route path="/home" element={<DashboardHome />} />
        <Route path="/*" element={<Navigate to={"/404"} />} />
      </Route>
    </Routes>
  );
};

export default DashboardRoutes;
