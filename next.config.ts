import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  // Next.js 16.4 logs Server Function arguments by default in development.
  // Login arguments contain passwords: never forward them to terminal logs.
  logging: false,
  images: {
    remotePatterns: process.env.NEXT_PUBLIC_SUPABASE_URL ? [{protocol:"https",hostname:new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,pathname:"/storage/v1/object/public/site-media/**"}] : [],
    formats:["image/avif","image/webp"],
  },
};
export default nextConfig;
