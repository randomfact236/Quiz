import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * plan/games/39: live Go 9×9 matches — the server owns the board, the
 * captures, the ko ban, the pass counter and the area score.
 */
export class CreateGoMatches1794800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'gomatches',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'code', type: 'varchar', length: '6', isUnique: true },
          { name: 'status', type: 'varchar', length: '16', default: "'waiting'" },
          { name: 'cells', type: 'jsonb' },
          { name: 'turn', type: 'int', default: 1 },
          { name: 'captures', type: 'jsonb', default: "'[0,0]'" },
          { name: 'passes', type: 'int', default: 0 },
          { name: 'previous', type: 'jsonb', isNullable: true },
          { name: 'lastMove', type: 'jsonb', isNullable: true },
          { name: 'komi', type: 'float', default: 5.5 },
          { name: 'winner', type: 'int', isNullable: true },
          { name: 'draw', type: 'boolean', default: false },
          { name: 'score', type: 'jsonb', isNullable: true },
          { name: 'rGuestId', type: 'varchar', length: '64' },
          { name: 'rName', type: 'varchar', length: '32' },
          { name: 'yGuestId', type: 'varchar', length: '64', isNullable: true },
          { name: 'yName', type: 'varchar', length: '32', isNullable: true },
          { name: 'createdAt', type: 'timestamptz', default: 'now()' },
          { name: 'expiresAt', type: 'timestamptz' },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('gomatches');
  }
}
