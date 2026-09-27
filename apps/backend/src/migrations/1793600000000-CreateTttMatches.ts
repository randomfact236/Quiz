import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * plan/18 phase 5: live tic-tac-toe matches — server-authoritative board,
 * 3-second poll sync, one round per match.
 */
export class CreateTttMatches1793600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'ttt_matches',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'code', type: 'varchar', length: '6', isUnique: true },
          { name: 'board', type: 'jsonb' },
          { name: 'turn', type: 'varchar', length: '1' },
          { name: 'status', type: 'varchar', length: '16', default: "'waiting'" },
          { name: 'misere', type: 'boolean', default: false },
          { name: 'xGuestId', type: 'varchar', length: '64' },
          { name: 'xName', type: 'varchar', length: '32' },
          { name: 'oGuestId', type: 'varchar', length: '64', isNullable: true },
          { name: 'oName', type: 'varchar', length: '32', isNullable: true },
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
    await queryRunner.dropTable('ttt_matches');
  }
}
