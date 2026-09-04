/**
 * ============================================================================
 * Request context enrichment for analytics ingest
 * ============================================================================
 * Derives the geo/device envelope attached to every ingested event from the
 * HTTP request: IP → country/region/city via geoip-lite, User-Agent →
 * device/browser/OS via ua-parser-js, Referer → domain only.
 *
 * Privacy posture (plan §9 data minimization): raw IPs are never persisted.
 * `ipAnon` zeroes the host bits (/24 for IPv4, /48 for IPv6) so geo
 * breakdowns can dedupe visitors without storing identifying addresses.
 * Every lookup is wrapped — analytics must never break ingest.
 * ============================================================================
 */

import { geoipLookup, uaParse } from './geo-lite';

export interface RequestContext {
  country: string | null;
  region: string | null;
  city: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  referrerDomain: string | null;
  ipAnon: string | null;
}

/** Extract the client IP, trusting the reverse-proxy headers first. */
function extractIp(req: {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  connection?: { remoteAddress?: string };
}): string | null {
  const xff = req.headers?.['x-forwarded-for'];
  const first = Array.isArray(xff) ? xff[0] : xff;
  const fromProxy = first?.split(',')[0]?.trim();
  const ip =
    fromProxy ||
    (typeof req.headers?.['x-real-ip'] === 'string'
      ? (req.headers['x-real-ip'] as string)
      : undefined) ||
    req.ip ||
    req.connection?.remoteAddress ||
    null;
  // Strip the IPv6-mapped prefix so geo lookups see a plain address.
  return ip ? ip.replace(/^::ffff:/, '') : null;
}

/** Zero the host bits: keep /24 for IPv4, /48 for IPv6. */
export function anonymizeIp(ip: string): string {
  if (ip.includes(':')) {
    const groups = ip.split(':');
    return `${groups.slice(0, 3).join(':')}::`;
  }
  const octets = ip.split('.');
  if (octets.length !== 4) return 'unknown';
  return `${octets[0]}.${octets[1]}.${octets[2]}.0`;
}

/** Best-effort referrer domain (host only, no path/query). */
function referrerDomainOf(req: {
  headers: Record<string, string | string[] | undefined>;
}): string | null {
  const ref = req.headers?.['referer'] ?? req.headers?.['referrer'];
  const raw = Array.isArray(ref) ? ref[0] : ref;
  if (!raw) return null;
  try {
    return new URL(raw).hostname.slice(0, 128) || null;
  } catch {
    return null;
  }
}

/**
 * Build the enrichment envelope for a request. Never throws: any lookup
 * failure degrades that field to null and ingest continues.
 */
export function buildRequestContext(req: {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  connection?: { remoteAddress?: string };
}): RequestContext {
  const ctx: RequestContext = {
    country: null,
    region: null,
    city: null,
    deviceType: null,
    browser: null,
    os: null,
    referrerDomain: referrerDomainOf(req),
    ipAnon: null,
  };

  try {
    const ip = extractIp(req);
    if (ip) {
      ctx.ipAnon = anonymizeIp(ip);
      const geo = geoipLookup(ip);
      if (geo) {
        ctx.country = geo.country ?? null;
        ctx.region = geo.region || null;
        ctx.city = geo.city || null;
      }
    }
  } catch {
    // geo lookup failed — fields stay null
  }

  try {
    const uaRaw = req.headers?.['user-agent'];
    const ua = Array.isArray(uaRaw) ? uaRaw[0] : uaRaw;
    if (ua) {
      const parsed = uaParse(ua);
      // ua-parser-js leaves desktop-type undefined — that IS desktop.
      ctx.deviceType = parsed.device?.type ?? 'desktop';
      ctx.browser = parsed.browser?.name ?? null;
      ctx.os = parsed.os?.name ?? null;
    }
  } catch {
    // UA parse failed — fields stay null
  }

  return ctx;
}
