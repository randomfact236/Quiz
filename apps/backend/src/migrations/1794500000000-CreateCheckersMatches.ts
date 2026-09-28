import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * plan/games/06: live Checkers matches — the server owns the board, the
 * forced-capture rule, the multi-jump chain (chainSquare) and the quiet-move
 * draw clock.
 */
export class CreateCheckersMatches1794500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'checkersmatches',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'code', type: 'varchar', length: '6', isUnique: true },
          { name: 'status', type: 'varchar', length: '16', default: "'waiting'" },
          { name: 'board', type: 'jsonb' },
          { name: 'turn', type: 'int', default: 1 },
          { name: 'chainSquare', type: 'int', isNullable: true },
          { name: 'quietPlies', type: 'int', default: 0 },
          { name: 'lastMove', type: 'jsonb', isNullable: true },
          { name: 'winner', type: 'int', isNullable: true },
          { name: 'draw', type: 'boolean', default: false },
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
    await queryRunner.dropTable('checkersmatches');
  }
}
