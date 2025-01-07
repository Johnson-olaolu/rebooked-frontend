import { Button } from "@/components/ui/button";
import React from "react";
import { useNavigate } from "react-router-dom";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex justify-start">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <svg className="h-6 w-6" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
