/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  
  // Output standalone for Docker
  output: 'standalone',
  
  // Disable image optimization in dev
  images: {
    unoptimized: true,
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
    
    // Handle monorepo module resolution for devtools
    config.resolve.modules = [
      ...config.resolve.modules,
      '../../node_modules',
    ];
    
    return config;
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3012/api',
  },
};

export default nextConfig;
