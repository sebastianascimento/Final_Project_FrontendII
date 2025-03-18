import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "images.pexels.com" },
      { hostname: "lh3.googleusercontent.com" },  
      { hostname: "avatars.githubusercontent.com" }
    ],
  },
};

export default nextConfig;