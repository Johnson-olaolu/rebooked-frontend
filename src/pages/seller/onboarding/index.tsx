import { Button } from "@/components/ui/button";
import OnboardingForm from "./components/OnboardingForm";
import { useNavigate } from "react-router-dom";

export default function OnboardingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex justify-start">
          <Button variant="outline" size="icon" onClick={() => navigate("/auth/login")} className="rounded-full">
            <svg className="h-6 w-6" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Complete Your Profile</h1>
          <p className="mt-4 text-lg text-gray-600">Tell us a bit about yourself to get started with Rebooked.</p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}
