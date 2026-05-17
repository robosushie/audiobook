import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, "");

  if (!env.VITE_API_BASE_URL) {
    throw new Error("VITE_API_BASE_URL is required in apps/admin/.env");
  }
  if (!env.VITE_CLERK_PUBLISHABLE_KEY) {
    throw new Error("VITE_CLERK_PUBLISHABLE_KEY is required in apps/admin/.env");
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
      },
      dedupe: ["react", "react-dom", "@clerk/react", "@clerk/shared"],
    },
    server: {
      port: 3001,
      strictPort: true,
    },
    preview: {
      port: 3001,
      strictPort: true,
    },
  };
});
