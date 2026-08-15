import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
  // Public routes
  route("/", "./routes/home/components/layout/Layout.tsx", [
    index("./routes/home"), // Home page
  ]),

  //404
  route("/*", "./routes/404"), // 404 page
] satisfies RouteConfig;
