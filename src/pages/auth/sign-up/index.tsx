import SignUpForm from "./components/SignUpForm";
import { Link } from "react-router-dom";

export default function SignUpPage() {
  return (
    <div className="max-w-md w-full space-y-8">
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Create your account</h2>
        <p className="mt-2 text-sm text-gray-600">
          Or{" "}
          <Link to="/auth/login" className="font-medium text-primary hover:text-primary-dark">
            sign in to your existing account
          </Link>
        </p>
      </div>
      <SignUpForm />
    </div>
  );
}
