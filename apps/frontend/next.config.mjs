/** @type {import('next').NextConfig} */

// Fail fast on missing production config: a prod build without an API URL
// would silently fall back to localhost and ship a broken app.
const isProdBuild = process.env.NODE_ENV === 'production';
if (isProdBuild) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error('NEXT_PUBLIC_API_URL must be set for production builds.');
  }
  if (/localhost|127\.0\.0\.1/.test(apiUrl)) {
    console.warn(
      '⚠️  NEXT_PUBLIC_API_URL points to localhost in a production build — ' +
        'set the real API origin unless this is a local prod-mode check.'
    );
  }
}

// Image hosts the app actually loads from: the API origin serving media-library
// uploads plus any hosts admins paste for riddle images. Extend this list when
// a new image host is introduced instead of allowing every host.
const imageHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS || 'localhost,127.0.0.1')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean);

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // Overridable so a CI/verification build can run beside a live dev server
  // (which locks .next/trace on Windows).
  distDir: process.env['NEXT_DIST_DIR'] || '.next',

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
    // Restrict remote image hosts to the configured allowlist (the API origin
    // for media uploads + any admin-pasted hosts) instead of every host.
    // NEXT_PUBLIC_IMAGE_HOSTS is a comma-separated list, e.g.
    // "api.profitbenefit.com,images.unsplash.com".
    remotePatterns: imageHosts.flatMap((hostname) => [
      { protocol: 'https', hostname },
      { protocol: 'http', hostname },
    ]),
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
