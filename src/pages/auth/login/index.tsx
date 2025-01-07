import LoginForm from "./components/LoginForm";

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
        <p className="mt-2 text-sm text-gray-600">
          Or{" "}
          <a href="/auth/signup" className="font-medium text-primary hover:text-primary-dark">
            create a new account
          </a>
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
