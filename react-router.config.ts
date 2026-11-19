import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";

export default {
  // Server-render every route so crawlers get real HTML.
  ssr: true,
  presets: [vercelPreset()],
} satisfies Config;
