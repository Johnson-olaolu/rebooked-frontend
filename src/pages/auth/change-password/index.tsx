import ChangePasswordForm from "./components/ChangePasswordForm";

export default function ChangePasswordPage() {
  return (
    <div className="max-w-md w-full space-y-8">
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Reset Your Password</h2>
        <p className="mt-2 text-sm text-gray-600">Enter your new password below</p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
