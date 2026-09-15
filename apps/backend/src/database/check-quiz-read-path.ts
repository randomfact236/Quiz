/**
 * One-off read-path check: calls the public service methods that the site's
 * quiz pages use, to confirm the imported subjects are served.
 * Usage: npx ts-node src/database/check-quiz-read-path.ts
 */
import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';
import { QuizMcqService } from '../quiz-mcq/quiz-mcq.service';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const quiz = app.get(QuizMcqService);

  const subjects = await quiz.findAllSubjects(undefined, true, false);
  console.log(`subjects (hasContent=true): total=${subjects.total}`);
  for (const s of subjects.data) {
    console.log(`  - ${s.name} (slug=${(s as any).slug})`);
  }

  const counts = await quiz.getPublicQuestionCounts();
  const str = JSON.stringify(counts);
  console.log(`public question-counts payload: ${str.slice(0, 600)}`);

  await app.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
