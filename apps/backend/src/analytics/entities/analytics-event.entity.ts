import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Single analytics event row (analytics plan §8 schema).
 *
 * One wide table approach: every `track()` call from the client and every
 * server-side hook lands here with a shared envelope plus a free-form
 * `properties` jsonb payload. Dashboards aggregate over it; raw rows are
 * the retention-capped tier (plan §9).
 */
@Entity('analytics_events')
@Index(['eventName'])
@Index(['module'])
@Index(['userId'])
@Index(['guestId'])
@Index(['serverTs'])
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64 })
  eventName: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  module: string | null;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  guestId: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  sessionId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  page: string | null;

  @Column({ type: 'jsonb', nullable: true })
  properties: Record<string, unknown> | null;

  /**
   * Request context, enriched server-side at ingest from the HTTP request
   * (geo via IP lookup, device/browser/OS via UA parse). Raw IPs are never
   * stored — `ipAnon` keeps a /24 (v4) or /48 (v6) truncated copy so geo
   * counts can dedupe visitors without storing identifying addresses.
   */
  @Column({ type: 'varchar', length: 64, nullable: true })
  country: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  region: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  deviceType: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  browser: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  os: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  referrerDomain: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ipAnon: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  clientTs: Date | null;

  @CreateDateColumn()
  serverTs: Date;
}
