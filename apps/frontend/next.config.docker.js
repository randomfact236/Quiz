/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // Output standalone for Docker
  output: 'standalone',

  // Legacy /riddles path moved to /riddle-mcq — keep old links working
  async redirects() {
    return [
      {
        source: '/riddles',
        destination: '/riddle-mcq',
        permanent: true,
      },
    ];
  },

  // Disable image optimization in dev
  images: {
    unoptimized: true,
    // Riddle images may point anywhere: media-library uploads are served from
    // the API origin, offline samples use Unsplash, and admins can paste any
    // external URL. Optimization is disabled above, so these patterns are
    // belt-and-suspenders for when unoptimized is ever flipped off.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },

  // Webpack configuration for Docker
  webpack: (config, { dev, isServer }) => {
    // Fix for chunk loading issues in Docker
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3012/api',
  },
};

module.exports = nextConfig;
