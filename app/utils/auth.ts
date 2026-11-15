import type { IUser } from "~/types/user";

/** Mirrors the backend password rule (CreateUserDto / ChangePasswordDTO). */
export const PASSWORD_REGEX = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])(?=\S+$).{8,}$/;

export const PASSWORD_RULES: { label: string; test: (password: string) => boolean }[] = [
  { label: "8+ characters", test: (p) => p.length >= 8 },
  { label: "Uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "Number", test: (p) => /\d/.test(p) },
  { label: "Symbol", test: (p) => /[^A-Za-z0-9]/.test(p) },
  { label: "No spaces", test: (p) => !/\s/.test(p) },
];

export const isValidPassword = (password: string) => PASSWORD_REGEX.test(password);

/** Where a user should land after logging in or verifying. */
export const getPostAuthPath = (user: IUser, redirect?: string | null) => {
  if (!user.emailVerified) return "/auth/verify-email";
  if (!user.profile?.onboardingCompleted) return "/onboarding/profile";
  return redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/";
};
