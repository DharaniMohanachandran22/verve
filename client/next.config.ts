import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server output used by the Docker image
  output: "standalone",
};

export default nextConfig;
