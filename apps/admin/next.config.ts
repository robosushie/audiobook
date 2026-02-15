import type { NextConfig } from "next";
import path from "path";
import { config } from "dotenv";

// Load root monorepo .env so admin uses the same env as mobile
config({ path: path.resolve(__dirname, "../../.env") });

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
