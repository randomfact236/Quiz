import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Score-integrity hardening (post-phase audit): each participant tracks the
 * distinct questions they answered so the grading endpoint can reject
 * replays — otherwise one known-correct answer could be farmed to a perfect
 * score (completedCount increments alongside, so the counts never show it).
 */
export class AddDuelParticipantAnswered1793700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'duel_participants',
      new TableColumn({
        name: 'answered',
        type: 'jsonb',
        default: "'[]'",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('duel_participants', 'answered');
  }
}
