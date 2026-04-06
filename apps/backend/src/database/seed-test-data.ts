import { DataSource } from 'typeorm';
import { getSeedDatabaseConfig } from './database-config';

async function seed() {
  const dataSource = new DataSource(getSeedDatabaseConfig());

  try {
    await dataSource.initialize();

    const subjectRepo = dataSource.getRepository('Subject');
    const chapterRepo = dataSource.getRepository('Chapter');

    const science = await subjectRepo.save({
      name: 'Science',
      slug: 'science',
      emoji: '🔬',
      isActive: true,
    });
    const math = await subjectRepo.save({
      name: 'Math',
      slug: 'math',
      emoji: '📐',
      isActive: true,
    });

    const ch1 = await chapterRepo.save({
      name: 'Physics',
      subjectId: science.id,
      chapterNumber: 1,
    });
    const ch2 = await chapterRepo.save({
      name: 'Chemistry',
      subjectId: science.id,
      chapterNumber: 2,
    });
    const ch3 = await chapterRepo.save({
      name: 'Arithmetic',
      subjectId: math.id,
      chapterNumber: 1,
    });
    const ch4 = await chapterRepo.save({ name: 'Algebra', subjectId: math.id, chapterNumber: 2 });

    console.log('Created subjects and chapters:');
    console.log('Science ID:', science.id);
    console.log('Math ID:', math.id);
    console.log('Physics ID:', ch1.id);
    console.log('Chemistry ID:', ch2.id);
    console.log('Arithmetic ID:', ch3.id);
    console.log('Algebra ID:', ch4.id);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await dataSource.destroy();
  }
}

seed();
