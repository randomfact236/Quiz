/**
 * ============================================================================
 * Auto Seed Service
 * ============================================================================
 * Automatically seeds database tables on application startup if they're empty.
 * This ensures the app always has data to work with.
 * ============================================================================
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { ContentStatus } from '../common/enums/content-status.enum';
import { QuizRiddle } from '../riddles/entities/quiz-riddle.entity';
import { RiddleCategory } from '../riddles/entities/riddle-category.entity';
import { RiddleChapter } from '../riddles/entities/riddle-chapter.entity';
import { RiddleSubject } from '../riddles/entities/riddle-subject.entity';
import { Riddle } from '../riddles/entities/riddle.entity';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AutoSeedService implements OnModuleInit {
  private readonly logger = new Logger(AutoSeedService.name);

  constructor(
    @InjectRepository(RiddleSubject)
    private subjectRepo: Repository<RiddleSubject>,
    @InjectRepository(RiddleChapter)
    private chapterRepo: Repository<RiddleChapter>,
    @InjectRepository(QuizRiddle)
    private quizRiddleRepo: Repository<QuizRiddle>,
    @InjectRepository(RiddleCategory)
    private categoryRepo: Repository<RiddleCategory>,
    @InjectRepository(Riddle)
    private riddleRepo: Repository<Riddle>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private dataSource: DataSource,
  ) { }

  async onModuleInit(): Promise<void> {
    this.logger.log('🔍 Checking if database needs seeding...');

    try {
      // Check if subjects exist
      const subjectCount = await this.subjectRepo.count();

      if (subjectCount === 0) {
        this.logger.log('🌱 Database is empty. Starting auto-seed...');
        await this.seedAll();
        this.logger.log('✅ Auto-seed completed successfully!');
      } else {
        this.logger.log(`✅ Database already has ${subjectCount} subjects. Ensuring admin user exists...`);
        await this.seedUsers();
      }
    } catch (error) {
      this.logger.error('❌ Auto-seed failed:', error.message);
      // Don't throw - let the app start anyway
    }
  }

  private async seedAll(): Promise<void> {
    await this.seedRiddleCategories();
    await this.seedRiddleSubjects();
    await this.seedClassicRiddles();
    await this.seedUsers();
  }

  private async seedRiddleCategories(): Promise<void> {
    const categories = [
      { name: 'Logic', emoji: '🧠' },
      { name: 'Word Play', emoji: '📝' },
      { name: 'Math', emoji: '🔢' },
    ];

    for (const cat of categories) {
      const entity = this.categoryRepo.create(cat);
      await this.categoryRepo.save(entity);
    }

    this.logger.log(`✅ Seeded ${categories.length} riddle categories`);
  }

  private async seedRiddleSubjects(): Promise<void> {
    const subjects = [
      { slug: 'brain-teasers', name: 'Brain Teasers', emoji: '🧩', description: 'Mind-bending riddles and puzzles', order: 1 },
      { slug: 'logic-puzzles', name: 'Logic Puzzles', emoji: '🎯', description: 'Test your logical reasoning', order: 2 },
      { slug: 'word-riddles', name: 'Word Riddles', emoji: '💬', description: 'Wordplay and language riddles', order: 3 },
      { slug: 'math-riddles', name: 'Math Riddles', emoji: '🔢', description: 'Mathematical puzzles', order: 4 },
      { slug: 'mystery-riddles', name: 'Mystery Riddles', emoji: '🔍', description: 'Solve the mysteries', order: 5 },
    ];

    for (const subj of subjects) {
      const entity = this.subjectRepo.create({ ...subj, isActive: true });
      const saved = await this.subjectRepo.save(entity);

      // Create chapters for each subject
      await this.seedChaptersForSubject(saved);
    }

    this.logger.log(`✅ Seeded ${subjects.length} subjects with chapters and riddles`);
  }

  private async seedChaptersForSubject(subject: RiddleSubject): Promise<void> {
    const chapterNames: Record<string, string[]> = {
      'brain-teasers': ['Trick Questions', 'Visual Puzzles', 'Lateral Thinking', 'Brain Warm-ups'],
      'logic-puzzles': ['Deduction', 'Pattern Recognition', 'Sequencing', 'Logical Fallacies'],
      'word-riddles': ['Anagrams', 'Homophones', 'Rhyming Riddles', 'Word Associations'],
      'math-riddles': ['Number Patterns', 'Geometry', 'Probability', 'Algebraic Thinking'],
      'mystery-riddles': ['Who Done It', 'Missing Items', 'Strange Events', 'Hidden Clues'],
    };

    const chapters = chapterNames[subject.slug] || [];

    for (let i = 0; i < chapters.length; i++) {
      const chapter = this.chapterRepo.create({
        name: chapters[i],
        chapterNumber: i + 1,
        subject,
      });

      const savedChapter = await this.chapterRepo.save(chapter);

      // Add sample riddles to each chapter
      await this.seedRiddlesForChapter(savedChapter);
    }
  }

  private async seedRiddlesForChapter(chapter: RiddleChapter): Promise<void> {
    const templates = this.getRiddleTemplates(chapter.name);
    const levels = ['easy', 'medium', 'hard', 'expert'] as const;

    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];
      const riddle = this.quizRiddleRepo.create({
        question: template.question,
        options: template.options,
        correctAnswer: template.answer,
        level: levels[i % levels.length],
        chapter,
        explanation: template.explanation,
        hint: template.hint,
      });

      await this.quizRiddleRepo.save(riddle);
    }
  }

  private async seedClassicRiddles(): Promise<void> {
    const categories = await this.categoryRepo.find();
    if (categories.length === 0) { return; }

    const riddles = [
      { question: 'What has keys but no locks?', answer: 'A piano', difficulty: 'easy', categoryIndex: 1 },
      { question: 'What has a head and a tail but no body?', answer: 'A coin', difficulty: 'easy', categoryIndex: 1 },
      { question: 'The more you take, the more you leave behind. What am I?', answer: 'Footsteps', difficulty: 'medium', categoryIndex: 0 },
      { question: 'What gets wetter the more it dries?', answer: 'A towel', difficulty: 'easy', categoryIndex: 1 },
      { question: 'I speak without a mouth and hear without ears. What am I?', answer: 'An echo', difficulty: 'medium', categoryIndex: 0 },
    ];

    for (const r of riddles) {
      const category = categories[r.categoryIndex % categories.length];
      const entity = this.riddleRepo.create({
        ...r,
        category,
        status: ContentStatus.PUBLISHED,
      });
      await this.riddleRepo.save(entity);
    }

    this.logger.log(`✅ Seeded ${riddles.length} classic riddles`);
  }

  private getRiddleTemplates(chapterName: string): Array<{
    question: string;
    options: string[];
    answer: string;
    explanation: string;
    hint: string;
  }> {
    const templates: Record<string, Array<{
      question: string;
      options: string[];
      answer: string;
      explanation: string;
      hint: string;
    }>> = {
      'Trick Questions': [
        { question: 'What has keys but no locks?', options: ['A piano', 'A keyboard', 'A map', 'A car'], answer: 'A piano', explanation: 'A piano has musical keys', hint: 'Think about music' },
        { question: 'What gets wetter the more it dries?', options: ['A towel', 'A sponge', 'Water', 'Rain'], answer: 'A towel', explanation: 'A towel absorbs water', hint: 'Used after showering' },
        { question: 'The more you take, the more you leave behind. What am I?', options: ['Footsteps', 'Memories', 'Time', 'Money'], answer: 'Footsteps', explanation: 'Walking leaves footsteps', hint: 'You make them when walking' },
        { question: 'What has a head and a tail but no body?', options: ['A coin', 'A snake', 'A rope', 'A bookmark'], answer: 'A coin', explanation: 'A coin has a head side and tail side', hint: 'Used for purchases' },
      ],
      'Visual Puzzles': [
        { question: 'How many sides does a circle have?', options: ['Two', 'None', 'One', 'Infinite'], answer: 'Two', explanation: 'Inside and outside', hint: 'Think inside and outside' },
        { question: 'What can travel around the world while staying in a corner?', options: ['A stamp', 'A postcard', 'A letter', 'An email'], answer: 'A stamp', explanation: 'Stamps stay on corners of envelopes', hint: 'Found on envelopes' },
      ],
      'Deduction': [
        { question: 'A farmer has 17 sheep and all but 9 die. How many are left?', options: ['9', '8', '17', '0'], answer: '9', explanation: 'All BUT 9 died', hint: 'Read carefully' },
        { question: 'If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops Lazzies?', options: ['Yes', 'No', 'Maybe', 'Not enough info'], answer: 'Yes', explanation: 'Transitive property', hint: 'Logical deduction' },
      ],
      'Pattern Recognition': [
        { question: 'What is next: 2, 4, 8, 16, ?', options: ['32', '24', '20', '36'], answer: '32', explanation: 'Powers of 2', hint: 'Multiply by 2' },
        { question: 'What is next: 1, 1, 2, 3, 5, ?', options: ['8', '7', '9', '6'], answer: '8', explanation: 'Fibonacci sequence', hint: 'Add previous two numbers' },
      ],
      'Anagrams': [
        { question: 'Rearrange "LISTEN" to form another word', options: ['Silent', 'Inlets', 'Enlist', 'Tinsel'], answer: 'Silent', explanation: 'LISTEN and SILENT are anagrams', hint: 'Opposite of loud' },
        { question: 'Rearrange "DORMITORY" to form two words', options: ['Dirty room', 'Room dirty', 'Dorm try', 'Try dorm'], answer: 'Dirty room', explanation: 'Anagram of DORMITORY', hint: 'Needs cleaning' },
      ],
    };

    return templates[chapterName] || [
      { question: 'What goes up but never comes down?', options: ['Your age', 'A balloon', 'A rocket', 'A bird'], answer: 'Your age', explanation: 'Age only increases', hint: 'It increases every year' },
      { question: 'What has hands but cannot clap?', options: ['A clock', 'A robot', 'A doll', 'A statue'], answer: 'A clock', explanation: 'Clocks have hands', hint: 'Tells time' },
    ];
  }

  private async seedUsers(): Promise<void> {
    const adminEmail = 'admin@example.com';
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const existingAdmin = await this.userRepo.findOne({ where: { email: adminEmail } });

    if (!existingAdmin) {
      this.logger.log(`👥 Seeding default admin user (${adminEmail})...`);
      const admin = this.userRepo.create({
        email: adminEmail,
        password: hashedPassword,
        name: 'Admin User',
        role: 'admin',
      });
      await this.userRepo.save(admin);
      this.logger.log('✅ Default admin user created: admin@example.com / admin123');
    } else {
      await this.userRepo.update(existingAdmin.id, { password: hashedPassword });
      this.logger.log(`✅ Admin user (${adminEmail}) already exists. Password synchronized to 'admin123'.`);
    }
  }
}
