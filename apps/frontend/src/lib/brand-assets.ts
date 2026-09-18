/**
 * ============================================================================
 * brand-assets.ts — built-in PigZap mark paths (shared, server-safe)
 * ============================================================================
 * Lives OUTSIDE any 'use client' module: server components must import plain
 * constants from a server-safe file — importing non-component exports from a
 * client module silently yields undefined in the server graph.
 * ============================================================================
 */

export const BUILT_IN_BRAND_ASSETS = {
  logo: '/brand/pigzap-logo-horizontal.svg',
  logoDark: '/brand/pigzap-logo-horizontal-dark.svg',
  favicon: '/brand/pigzap-icon.svg',
};

/** Domain shown beside the mobile icon (owner directive 2026-09-19). */
export const SITE_DOMAIN = 'pigzap.com';
