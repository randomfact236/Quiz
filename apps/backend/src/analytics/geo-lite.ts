/**
 * Lazily-loaded geo + UA lookups.
 *
 * geoip-lite pulls its MaxMind dataset into memory on require (~tens of MB),
 * and either dependency may be absent in slim installs — so both are loaded
 * once, on first use, inside try/catch. Any failure degrades to a null
 * lookup instead of breaking ingest or app boot.
 */

import { Logger } from '@nestjs/common';

const logger = new Logger('AnalyticsGeoLite');

export interface GeoLookupResult {
  country?: string;
  region?: string;
  city?: string;
}

export interface UaParseResult {
  browser?: { name?: string; version?: string };
  os?: { name?: string; version?: string };
  device?: { type?: string; vendor?: string; model?: string };
}

type GeoLookupFn = (ip: string) => GeoLookupResult | null;
type UaParseFn = (ua: string) => UaParseResult;

let geoLookup: GeoLookupFn | null = null;
let uaParser: UaParseFn | null = null;
let loadAttempted = false;

function ensureLoaded(): void {
  if (loadAttempted) return;
  loadAttempted = true;
  try {
    const geoip = require('geoip-lite') as { lookup?: GeoLookupFn };
    geoLookup = geoip.lookup ?? null;
  } catch {
    logger.warn('geoip-lite unavailable — country/city fields will stay null');
  }
  try {
    const { UAParser } = require('ua-parser-js') as {
      UAParser: new (ua: string) => { getResult: () => UaParseResult };
    };
    uaParser = (ua: string) => new UAParser(ua).getResult();
  } catch {
    logger.warn('ua-parser-js unavailable — device/browser/os fields will stay null');
  }
}

export function geoipLookup(ip: string): GeoLookupResult | null {
  ensureLoaded();
  try {
    return geoLookup?.(ip) ?? null;
  } catch {
    return null;
  }
}

export function uaParse(ua: string): UaParseResult {
  ensureLoaded();
  try {
    return uaParser?.(ua) ?? {};
  } catch {
    return {};
  }
}
