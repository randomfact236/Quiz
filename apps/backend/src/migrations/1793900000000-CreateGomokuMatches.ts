import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * plan/games/02: live Gomoku matches — server-authoritative stones,
 * 3-second poll sync, one match per round (the /tictactoe pattern).
 */
export class CreateGomokuMatches1793900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'gomoku_matches',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'code', type: 'varchar', length: '6', isUnique: true },
          { name: 'size', type: 'int' },
          { name: 'board', type: 'jsonb' },
          { name: 'turn', type: 'varchar', length: '1' },
          { name: 'status', type: 'varchar', length: '16', default: "'waiting'" },
          { name: 'bGuestId', type: 'varchar', length: '64' },
          { name: 'bName', type: 'varchar', length: '32' },
          { name: 'wGuestId', type: 'varchar', length: '64', isNullable: true },
          { name: 'wName', type: 'varchar', length: '32', isNullable: true },
          { name: 'winner', type: 'varchar', length: '1', isNullable: true },
          { name: 'winningLine', type: 'jsonb', isNullable: true },
          { name: 'draw', type: 'boolean', default: false },
          { name: 'createdAt', type: 'timestamptz', default: 'now()' },
          { name: 'expiresAt', type: 'timestamptz' },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('gomoku_matches');
  }
}
