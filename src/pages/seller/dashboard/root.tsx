import { Navigate, Route, Routes } from "react-router";
import DashboardLayout from "./components/layout";
import React from "react";

const DashboardHome = React.lazy(() => import("./home"));
const ProfilePage = React.lazy(() => import("./profile"));
const ChatPage = React.lazy(() => import("./chat"));
const UploadBookPage = React.lazy(() => import("./book-upload"));
const BookPage = React.lazy(() => import("./book"));

const DashboardRoutes = () => {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Navigate to="/seller/dashboard/home" />} />
        <Route path="/home" element={<DashboardHome />} />
        <Route path="/upload-book" element={<UploadBookPage />} />
        <Route path="/book/:bookId" element={<BookPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/*" element={<Navigate to={"/seller/404"} />} />
      </Route>
    </Routes>
  );
};

export default DashboardRoutes;
