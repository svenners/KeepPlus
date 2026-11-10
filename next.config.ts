import type { NextConfig } from "next";

// Sanitize NEXTAUTH_URL to prevent build-time crashes if placeholders or invalid URLs are provided
function getSafeNextAuthUrl(): string {
  const raw = process.env.NEXTAUTH_URL;
  if (raw) {
    try {
      const parsed = new URL(raw);
      if (parsed.protocol.startsWith('http') && !raw.includes('<') && !raw.includes('>')) {
        return raw;
      }
    } catch {
      // Fall through to auto-detection
    }
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

const safeNextAuthUrl = getSafeNextAuthUrl();
process.env.NEXTAUTH_URL = safeNextAuthUrl;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXTAUTH_URL: safeNextAuthUrl,
  },
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
