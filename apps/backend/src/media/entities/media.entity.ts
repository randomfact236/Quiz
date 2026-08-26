import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Lifecycle of the sharp WebP conversion for an uploaded image. */
export enum MediaConversionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

/**
 * Media library asset. Ported from the affiliate-website project (Prisma
 * `Media` model) and adapted to TypeORM. Stores locally-uploaded images that
 * were re-encoded to WebP at upload time.
 */
@Entity('media')
@Index(['mimeType'])
@Index(['isConverted'])
@Index(['createdAt'])
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Stored filename inside /uploads (already .webp for converted images). */
  @Column({ type: 'varchar', length: 500 })
  filename: string;

  /** Public URL path served by the API, e.g. `/uploads/xxx.webp`. */
  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ type: 'text', nullable: true })
  alt: string | null;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  /** Size of the ORIGINAL upload in bytes (for storage-saved stats). */
  @Column({ type: 'int' })
  fileSize: number;

  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

  @Column({ type: 'boolean', default: false })
  isConverted: boolean;

  @Column({
    type: 'enum',
    enum: MediaConversionStatus,
    default: MediaConversionStatus.PENDING,
  })
  conversionStatus: MediaConversionStatus;

  /** e.g. `{ webp: { url, fileSize } }`. */
  @Column({ type: 'jsonb', nullable: true, default: null })
  variants: Record<string, { url: string; fileSize: number }> | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
