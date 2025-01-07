import React from "react";
import { Navigate, Route, Routes } from "react-router";
import AuthLayout from "./components/layout.tsx";

const LoginPage = React.lazy(() => import("./login"));
const SignUpPage = React.lazy(() => import("./sign-up"));
const VerifyEmailPage = React.lazy(() => import("./verify-email"));
const ForgotPasswordPage = React.lazy(() => import("./forgot-password"));
const ChangePasswordPage = React.lazy(() => import("./change-password"));

const AuthRoutes = () => {
  return (
    <AuthLayout>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/*" element={<Navigate to={"/404"} />} />
      </Routes>
    </AuthLayout>
  );
};

export default AuthRoutes;
