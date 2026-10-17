import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  // Next.js 16.4 logs Server Function arguments by default in development.
  // Login arguments contain passwords: never forward them to terminal logs.
  logging: false,
};
export default nextConfig;
