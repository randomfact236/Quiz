/**
 * ============================================================================
 * Public Settings (server-side fetch helper)
 * ============================================================================
 * Single cached read of `GET /settings/public` for server components (root
 * layout metadata, Header brand, Footer socials, homepage banner). Next
 * dedupes concurrent calls within a render pass and caches for 5 minutes.
 * Any failure returns null so every consumer falls back to its built-ins.
 * ============================================================================
 */

import type { SeoSettings, SiteSettings } from '@/types/settings.types';

export interface PublicSettingsPayload {
  seo: Partial<SeoSettings> | null;
  site: Partial<SiteSettings> | null;
}

const API_ROOT = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3012/api';
const API_V1_ROOT = API_ROOT.endsWith('/v1') ? API_ROOT : `${API_ROOT}/v1`;
/** Server origin — `/uploads/...` files are served from the host root, not the API prefix. */
const SERVER_ORIGIN = API_ROOT.replace(/\/api(\/v[0-9]+)?\/?.*$/, '');

/** Resolve a stored media path (/uploads/... or absolute URL) to an absolute URL. */
export function resolveMediaUrl(url: string): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${SERVER_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Normalize a social profile field into a safe href. Accepts full URLs or
 * bare domains ("facebook.com/yourpage" → https://facebook.com/yourpage);
 * anything without an http(s) scheme after normalization is dropped, so
 * javascript:/data: payloads can never reach an href.
 */
export function normalizeExternalUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return /^https:\/\//i.test(withScheme) ? withScheme : '';
}

/** Cached fetch of the public settings payload. */
export async function getPublicSettings(): Promise<PublicSettingsPayload> {
  try {
    const res = await fetch(`${API_V1_ROOT}/settings/public`, { next: { revalidate: 300 } });
    if (!res.ok) return { seo: null, site: null };
    const data = (await res.json()) as {
      seo?: Partial<SeoSettings>;
      site?: Partial<SiteSettings>;
    };
    return { seo: data.seo ?? null, site: data.site ?? null };
  } catch {
    return { seo: null, site: null };
  }
}
