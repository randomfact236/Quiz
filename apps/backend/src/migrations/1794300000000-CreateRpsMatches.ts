import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * plan/games/07: live Rock Paper Scissors matches — simultaneous picks, the
 * server resolves the round only when both are in (no second-mover cheat).
 */
export class CreateRpsMatches1794300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'rpsmatches',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'code', type: 'varchar', length: '6', isUnique: true },
          { name: 'status', type: 'varchar', length: '16', default: "'running'" },
          { name: 'rWins', type: 'int', default: 0 },
          { name: 'yWins', type: 'int', default: 0 },
          { name: 'rPick', type: 'varchar', length: '1', isNullable: true },
          { name: 'yPick', type: 'varchar', length: '1', isNullable: true },
          { name: 'roundNo', type: 'int', default: 1 },
          { name: 'lastRound', type: 'jsonb', isNullable: true },
          { name: 'winner', type: 'int', isNullable: true },
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
    await queryRunner.dropTable('rpsmatches');
  }
}
