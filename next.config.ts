import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Three.js transpile
  transpilePackages: ['three'],
  // Required headers for WebXR
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ];
  },
};

export default nextConfig;
