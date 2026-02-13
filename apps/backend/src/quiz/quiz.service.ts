import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { Chapter } from './entities/chapter.entity';
import { Question } from './entities/question.entity';
import { CreateQuestionDto, CreateSubjectDto, PaginationDto } from '../common/dto/base.dto';
import { CacheService } from '../common/cache/cache.service';

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(Subject)
    private subjectRepo: Repository<Subject>,
    @InjectRepository(Chapter)
    private chapterRepo: Repository<Chapter>,
    @InjectRepository(Question)
    private questionRepo: Repository<Question>,
    private cacheService: CacheService,
  ) {}

  // ==================== SUBJECTS ====================

  async findAllSubjects(): Promise<Subject[]> {
    return this.cacheService.getOrSet('subjects:all', async () => {
      return this.subjectRepo.find({ order: { name: 'ASC' } });
    }, 3600);
  }

  async findSubjectBySlug(slug: string): Promise<Subject> {
    const subject = await this.subjectRepo.findOne({
      where: { slug },
      relations: ['chapters'],
    });
    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }

  async createSubject(dto: CreateSubjectDto): Promise<Subject> {
    const subject = this.subjectRepo.create(dto);
    const saved = await this.subjectRepo.save(subject);
    await this.cacheService.del('subjects:all');
    return saved;
  }

  async updateSubject(id: string, dto: Partial<CreateSubjectDto>): Promise<Subject> {
    const subject = await this.subjectRepo.findOne({ where: { id } });
    if (!subject) throw new NotFoundException('Subject not found');
    Object.assign(subject, dto);
    const saved = await this.subjectRepo.save(subject);
    await this.cacheService.del('subjects:all');
    return saved;
  }

  async deleteSubject(id: string): Promise<void> {
    const result = await this.subjectRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Subject not found');
    await this.cacheService.del('subjects:all');
  }

  // ==================== CHAPTERS ====================

  async findChaptersBySubject(subjectId: string): Promise<Chapter[]> {
    return this.chapterRepo.find({
      where: { subject: { id: subjectId } },
      order: { id: 'ASC' },
    });
  }

  async createChapter(name: string, subjectId: string): Promise<Chapter> {
    const subject = await this.subjectRepo.findOne({ where: { id: subjectId } });
    if (!subject) throw new NotFoundException('Subject not found');
    const chapter = this.chapterRepo.create({ name, subject });
    return this.chapterRepo.save(chapter);
  }

  async updateChapter(id: string, name: string): Promise<Chapter> {
    const chapter = await this.chapterRepo.findOne({ where: { id } });
    if (!chapter) throw new NotFoundException('Chapter not found');
    chapter.name = name;
    return this.chapterRepo.save(chapter);
  }

  async deleteChapter(id: string): Promise<void> {
    const result = await this.chapterRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Chapter not found');
  }

  // ==================== QUESTIONS ====================

  async findQuestionsByChapter(
    chapterId: string,
    pagination: PaginationDto,
  ): Promise<{ data: Question[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [data, total] = await this.questionRepo.findAndCount({
      where: { chapter: { id: chapterId } },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async findRandomQuestions(level: string, count: number): Promise<Question[]> {
    return this.questionRepo
      .createQueryBuilder('question')
      .where('question.level = :level', { level })
      .orderBy('RANDOM()')
      .limit(count)
      .getMany();
  }

  async findMixedQuestions(count: number): Promise<Question[]> {
    return this.questionRepo
      .createQueryBuilder('question')
      .orderBy('RANDOM()')
      .limit(count)
      .getMany();
  }

  async createQuestion(dto: CreateQuestionDto): Promise<Question> {
    const chapter = await this.chapterRepo.findOne({ where: { id: dto.chapterId } });
    if (!chapter) throw new NotFoundException('Chapter not found');
    const question = this.questionRepo.create({
      question: dto.question,
      correctAnswer: dto.correctAnswer,
      options: dto.wrongAnswers,
      level: dto.level,
      explanation: dto.explanation,
      chapter,
    });
    return this.questionRepo.save(question);
  }

  async createQuestionsBulk(dto: CreateQuestionDto[]): Promise<number> {
    const questions: Question[] = [];
    for (const q of dto) {
      const chapter = await this.chapterRepo.findOne({ where: { id: q.chapterId } });
      if (chapter) {
        const question = this.questionRepo.create({
          question: q.question,
          correctAnswer: q.correctAnswer,
          options: q.wrongAnswers,
          level: q.level,
          explanation: q.explanation,
          chapter,
        });
        questions.push(question);
      }
    }
    const saved = await this.questionRepo.save(questions);
    return saved.length;
  }

  async updateQuestion(id: string, dto: Partial<CreateQuestionDto>): Promise<Question> {
    const question = await this.questionRepo.findOne({ where: { id } });
    if (!question) throw new NotFoundException('Question not found');
    if (dto.question) question.question = dto.question;
    if (dto.correctAnswer) question.correctAnswer = dto.correctAnswer;
    if (dto.wrongAnswers) question.options = dto.wrongAnswers;
    if (dto.level) question.level = dto.level;
    if (dto.explanation !== undefined) question.explanation = dto.explanation;
    return this.questionRepo.save(question);
  }

  async deleteQuestion(id: string): Promise<void> {
    const result = await this.questionRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Question not found');
  }
}
