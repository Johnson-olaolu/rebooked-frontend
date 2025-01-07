import VerifyEmailForm from "./components/VerifyEmailForm";

export default function VerifyEmailPage() {
  return (
    <div className="max-w-md w-full space-y-8">
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Confirm Your Email</h2>
        <p className="mt-2 text-sm text-gray-600">Enter the 6-digit code sent to your email</p>
      </div>
      <VerifyEmailForm />
    </div>
  );
}
