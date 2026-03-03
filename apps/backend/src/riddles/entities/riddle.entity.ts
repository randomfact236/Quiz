import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { RiddleCategory } from './riddle-category.entity';
import { ContentStatus } from '../../common/enums/content-status.enum';
import { RiddleDifficulty } from '../../common/enums/riddle-difficulty.enum';

// Re-export for modules that import the enum alongside the entity
export { RiddleDifficulty } from '../../common/enums/riddle-difficulty.enum';

@Entity('riddles')
export class Riddle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'text' })
  answer: string;

  /**
   * Difficulty level — stored as a DB enum, typed as string to remain
   * compatible with DTO inputs. See RiddleDifficulty for valid values.
   */
  @Column({ type: 'enum', enum: RiddleDifficulty, default: RiddleDifficulty.MEDIUM })
  difficulty: string;

  @ManyToOne(() => RiddleCategory, (category) => category.riddles)
  @JoinColumn({ name: 'categoryId' })
  category: RiddleCategory;

  @Column({
    type: 'enum',
    enum: ContentStatus,
    default: ContentStatus.DRAFT,
  })
  status: ContentStatus;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
