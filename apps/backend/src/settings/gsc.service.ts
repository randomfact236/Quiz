/**
 * ============================================================================
 * GscService — Google Search Console integration (plan/15 P3)
 * ============================================================================
 * Reads the site's Search Console performance data (top queries, top pages,
 * totals) for the admin SEO dashboard.
 *
 * Setup (owner-side, one time):
 *   1. Google Cloud Console → create a service account, download the JSON key.
 *   2. Backend env: GOOGLE_SERVICE_ACCOUNT_JSON = <the full JSON key>
 *      (raw JSON or base64 both accepted) — restart the backend.
 *   3. Search Console → Settings → Users and permissions → add the service
 *      account's client_email as an Owner (or Full user) on the property.
 *   4. Optional env GSC_PROPERTY_URL to override the property; the default
 *      'sc-domain:pigzap.com' targets the verified Domain property.
 *
 * Data freshness: Search Console metrics lag ~2 days by nature; results are
 * cached 6h per (range) on top of that.
 * ============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { JWT } from 'google-auth-library';

import { CacheService } from '../common/cache/cache.service';

const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];
const SEARCH_CONSOLE_API = 'https://searchconsole.googleapis.com/webmasters/v3/sites';

const CACHE_PREFIX = 'gsc:overview';
const CACHE_TTL_S = 6 * 60 * 60; // 6h — Search Console itself lags ~2 days

export interface GscMetricRow {
  key: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscOverview {
  connected: boolean;
  reason?: string;
  property?: string;
  clientEmail?: string;
  startDate?: string;
  endDate?: string;
  totals?: { clicks: number; impressions: number; ctr: number; position: number };
  queries?: GscMetricRow[];
  pages?: GscMetricRow[];
}

function isoDaysAgo(days: number): string {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

function todayIso(): string {
  // GSC's latest complete day is yesterday — asking for today yields partial
  // rows that swing the averages.
  const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class GscService {
  private readonly logger = new Logger(GscService.name);
  private jwtClient: JWT | null = null;
  private property: string;

  constructor(private readonly cacheService: CacheService) {
    this.property = process.env['GSC_PROPERTY_URL']?.trim() || 'sc-domain:pigzap.com';
  }

  /** Decode + validate the service-account key from the environment. */
  private getClient(): JWT | null {
    if (this.jwtClient) return this.jwtClient;
    const raw =
      process.env['GOOGLE_SERVICE_ACCOUNT_JSON']?.trim() ||
      process.env['GOOGLE_SERVICE_ACCOUNT_JSON_BASE64']?.trim() ||
      '';
    if (!raw) return null;
    try {
      const json = JSON.parse(
        raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8')
      );
      if (!json.client_email || !json.private_key) {
        this.logger.warn('GOOGLE_SERVICE_ACCOUNT_JSON is set but missing client_email/private_key');
        return null;
      }
      this.jwtClient = new JWT({
        email: json.client_email,
        key: json.private_key,
        scopes: SCOPES,
      });
      return this.jwtClient;
    } catch (error) {
      this.logger.warn(
        `GOOGLE_SERVICE_ACCOUNT_JSON could not be parsed: ${(error as Error).message}`
      );
      return null;
    }
  }

  isConnected(): boolean {
    return this.getClient() !== null;
  }

  /** Run one searchanalytics query against the property. */
  private async query(
    client: JWT,
    startDate: string,
    endDate: string,
    dimensions: string[],
    rowLimit: number
  ): Promise<GscMetricRow[]> {
    interface ApiRow {
      keys?: string[];
      clicks?: number;
      impressions?: number;
      ctr?: number;
      position?: number;
    }
    const response = await client.request<{ rows?: ApiRow[] }>({
      url: `${SEARCH_CONSOLE_API}/${encodeURIComponent(this.property)}/searchAnalytics/query`,
      method: 'POST',
      data: {
        startDate,
        endDate,
        dimensions,
        rowLimit,
        dataState: 'all',
      },
    });
    const rows = response.data.rows ?? [];
    return rows.map((row) => ({
      key: String(row.keys?.[0] ?? ''),
      clicks: Number(row.clicks ?? 0),
      impressions: Number(row.impressions ?? 0),
      ctr: Number(row.ctr ?? 0),
      position: Number(row.position ?? 0),
    }));
  }

  async getOverview(days = 28): Promise<GscOverview> {
    const client = this.getClient();
    if (!client) {
      return {
        connected: false,
        reason:
          'No Google service account is configured on the backend (GOOGLE_SERVICE_ACCOUNT_JSON).',
      };
    }

    const endDate = todayIso();
    const startDate = isoDaysAgo(days);
    const cacheKey = `${CACHE_PREFIX}:${this.property}:${startDate}:${endDate}`;

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          const [totalsRows, queryRows, pageRows] = await Promise.all([
            this.query(client, startDate, endDate, [], 1),
            this.query(client, startDate, endDate, ['query'], 25),
            this.query(client, startDate, endDate, ['page'], 15),
          ]);

          const totals = totalsRows[0] ?? {
            key: '',
            clicks: 0,
            impressions: 0,
            ctr: 0,
            position: 0,
          };

          return {
            connected: true,
            property: this.property,
            clientEmail: (client as unknown as { email?: string }).email ?? '',
            startDate,
            endDate,
            totals: {
              clicks: totals.clicks,
              impressions: totals.impressions,
              ctr: totals.ctr,
              position: totals.position,
            },
            queries: queryRows,
            pages: pageRows,
          } satisfies GscOverview;
        } catch (error) {
          const message = (error as Error).message || 'Search Console API error';
          this.logger.warn(`GSC overview failed: ${message}`);
          // 403 typically means the service account was not added to the
          // property — surface that as a not-connected state with guidance.
          const forbidden = message.includes('403') || message.toLowerCase().includes('forbidden');
          return {
            connected: false,
            reason: forbidden
              ? `The service account (${(client as unknown as { email?: string }).email ?? '?'}) has no access to ${this.property}. Add it in Search Console → Settings → Users and permissions.`
              : `Search Console API error: ${message}`,
          } satisfies GscOverview;
        }
      },
      CACHE_TTL_S
    );
  }
}
