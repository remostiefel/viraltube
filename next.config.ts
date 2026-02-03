import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // Optional: add experimental flags if we confirm version compatibility
  // experimental: {
  //   reactCompiler: true, 
  // },
};

export default nextConfig;
