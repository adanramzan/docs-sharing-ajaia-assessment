import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg"],
  experimental: {
    // Vercel caps request bodies at 4.5MB; uploads are limited to 4MB in the app.
    serverActions: { bodySizeLimit: "4.4mb" },
  },
};

export default nextConfig;
