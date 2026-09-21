/**
 * Canonical site origin for anything that leaves the device (share texts,
 * og URLs). Never derive share links from location.origin — a link copied
 * while testing locally would carry a dead localhost URL.
 */
export const SITE_URL = (process.env['NEXT_PUBLIC_SITE_URL'] || 'https://pigzap.com').replace(
  /\/+$/,
  ''
);
