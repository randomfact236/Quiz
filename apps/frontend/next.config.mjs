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

  // The static games under /public/games are directories (…/index.html), which
  // Next serves by exact file path only — a bare /games/<slug> would 404
  // (BUG-015). Redirect the clean URL to the index.html path rather than
  // rewriting: the games load their assets with relative URLs ("style.css"),
  // so the document URL must sit inside /games/<slug>/ for them to resolve.
  async redirects() {
    return [
      {
        source: '/riddles',
        destination: '/riddle-mcq',
        permanent: true,
      },
      {
        source: '/games/:slug',
        destination: '/games/:slug/index.html',
        permanent: false,
      },
    ];
  },

  // The static games under /public/games are plain files with no fingerprint in
  // their names, so a long-lived cache would serve stale HTML/CSS/JS to players
  // after a deploy. Force revalidation on every load (conditional requests stay
  // cheap); asset URLs keep their clean names. Browser-hardening headers apply
  // to every page (HSTS is intentionally absent — Cloudflare terminates TLS for
  // production and already injects it there; over plain-HTTP local dev it would
  // be ignored anyway).
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/games/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
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
