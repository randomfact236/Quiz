import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * plan/18 §4 / §10 step 5: content family + optional subject filter on duel
 * matches. `mode` / `payload` / `invite_token` are deliberately NOT added
 * here — they land with the phase-4 (game challenges) migration.
 */
export class AddDuelMatchContentColumns1793400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('duel_matches', [
      new TableColumn({
        name: 'contentType',
        type: 'varchar',
        length: '16',
        default: "'quiz'",
      }),
      new TableColumn({
        name: 'subjectId',
        type: 'uuid',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('duel_matches', ['contentType', 'subjectId']);
  }
}
