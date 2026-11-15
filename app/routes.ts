import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  // Public routes
  route("", "./routes/home/components/layout/Layout.tsx", [
    index("./routes/home/index.tsx"), // Home page
    route("about-us", "./routes/home/about-us/index.tsx"),
    route("privacy-policy", "./routes/home/privacy-policy/index.tsx"),
    route("terms-of-service", "./routes/home/terms-of-service/index.tsx"),
    route("contact-us", "./routes/home/contact-us/index.tsx"),
    route("shop", "./routes/shop/index.tsx"), // public; UI adapts when logged in
  ]),

  // Dashboard (requires a logged-in, onboarded user)
  route("dashboard", "./routes/dashboard/components/DashboardLayout.tsx", [
    index("./routes/dashboard/index.tsx"),
    route("listings", "./routes/dashboard/listings/index.tsx"),
    route("messages", "./routes/dashboard/messages/index.tsx"),
    route("notifications", "./routes/dashboard/notifications/index.tsx"),
    route("settings", "./routes/dashboard/settings/index.tsx"),
  ]),

  layout("./routes/auth/components/AuthEntryLayout.tsx", [
    route("login", "./routes/auth/login/index.tsx"),
    route("register", "./routes/auth/register/index.tsx"),
  ]),

  //   // Auth routes
  route("auth", "./routes/auth/components/AuthLayout.tsx", [
    route("verify-email", "./routes/auth/verify-email/index.tsx"),
    route("forgot-password", "./routes/auth/forgot-password/index.tsx"),
    route("change-password", "./routes/auth/change-password/index.tsx"),
  ]),
  // Onboarding (requires a logged-in user)
  route("onboarding", "./routes/onboarding/components/OnboardingLayout.tsx", [
    index("./routes/onboarding/index.tsx"), // redirects to /onboarding/profile
    route("profile", "./routes/onboarding/profile/index.tsx"),
    route("address", "./routes/onboarding/address/index.tsx"),
  ]),

  //   //404
  route("/*", "./routes/404/index.tsx"), // 404 page
] satisfies RouteConfig;
