import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ChangePasswordForm from "./components/ChangePasswordForm";

export default function ChangePasswordPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex justify-start">
          <Button variant="outline" size="icon" onClick={() => navigate("/auth/login")} className="rounded-full">
            <svg className="h-6 w-6" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
        </div>

        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Reset Your Password</h2>
          <p className="mt-2 text-sm text-gray-600">Enter your new password below</p>
        </div>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
