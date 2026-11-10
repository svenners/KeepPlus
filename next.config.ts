import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/.git/**',
          '**/.npm/**',
          '**/.cache/**',
          '**/.config/**',
          '**/.local/**',
          '**/.gemini/**',
          '**/upload/**',
          '**/*.log',
          '**/node_modules/**',
          '**/.next/**',
        ],
      };
    }
    return config;
  },
};

export default nextConfig;
