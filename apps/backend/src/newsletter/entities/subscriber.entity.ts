import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Where the subscription came from (footer form, about page, ...). */
export type NewsletterSource = 'footer' | 'about';

@Entity('newsletter_subscribers')
export class NewsletterSubscriber {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Stored lowercase + trimmed; unique (see migration 1789400000000). */
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 16, default: 'footer' })
  source: NewsletterSource;

  /** Unsubscribed addresses stay in the table but are excluded from exports. */
  @Column({ default: false })
  unsubscribed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
