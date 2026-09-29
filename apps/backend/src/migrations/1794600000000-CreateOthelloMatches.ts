import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * plan/games/12: live Othello matches — the server owns the board, recomputes
 * every flip, and resolves the pass rule.
 */
export class CreateOthelloMatches1794600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'othellomatches',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'code', type: 'varchar', length: '6', isUnique: true },
          { name: 'status', type: 'varchar', length: '16', default: "'waiting'" },
          { name: 'size', type: 'int', default: 8 },
          { name: 'cells', type: 'jsonb' },
          { name: 'turn', type: 'int', default: 1 },
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
    await queryRunner.dropTable('othellomatches');
  }
}
