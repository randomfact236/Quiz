import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * plan/games/01: live Connect Four matches — server-authoritative drops,
 * 3-second poll sync, one round per match (the /tictactoe pattern).
 */
export class CreateConnectFourMatches1793800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'connectfour_matches',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'code', type: 'varchar', length: '6', isUnique: true },
          { name: 'board', type: 'jsonb' },
          { name: 'turn', type: 'varchar', length: '1' },
          { name: 'status', type: 'varchar', length: '16', default: "'waiting'" },
          { name: 'rGuestId', type: 'varchar', length: '64' },
          { name: 'rName', type: 'varchar', length: '32' },
          { name: 'yGuestId', type: 'varchar', length: '64', isNullable: true },
          { name: 'yName', type: 'varchar', length: '32', isNullable: true },
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
    await queryRunner.dropTable('connectfour_matches');
  }
}
