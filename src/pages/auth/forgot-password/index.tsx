import ForgotPasswordForm from "./components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="max-w-md w-full space-y-8">
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Forgot Your Password?</h2>
        <p className="mt-2 text-sm text-gray-600">Enter your email address and we'll send you a link to reset your password</p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
