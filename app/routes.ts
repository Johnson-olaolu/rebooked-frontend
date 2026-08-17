import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  // Public routes
  route("", "./routes/home/components/layout/Layout.tsx", [
    index("./routes/home/index.tsx"), // Home page
    route("about-us", "./routes/home/about-us/index.tsx"),
    route("privacy-policy", "./routes/home/privacy-policy/index.tsx"),
    route("terms-of-service", "./routes/home/terms-of-service/index.tsx"),
    route("contact-us", "./routes/home/contact-us/index.tsx"),
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
  //   //404
  route("/*", "./routes/404/index.tsx"), // 404 page
] satisfies RouteConfig;
