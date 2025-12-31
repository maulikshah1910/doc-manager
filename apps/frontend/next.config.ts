import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,

  // Environment variables for frontend
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },

  // Disable powered by header for security
  poweredByHeader: false,

  // Compression
  compress: true,
};

export default nextConfig;
