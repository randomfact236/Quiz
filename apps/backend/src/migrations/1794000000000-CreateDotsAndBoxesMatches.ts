import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * plan/games/03: live Dots and Boxes matches — server-authoritative edges,
 * box claims and the extra turn, 3-second poll sync.
 */
export class CreateDotsAndBoxesMatches1794000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'dotsandboxes_matches',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'code', type: 'varchar', length: '6', isUnique: true },
          { name: 'size', type: 'int' },
          { name: 'edges', type: 'jsonb' },
          { name: 'owners', type: 'jsonb' },
          { name: 'turn', type: 'int' },
          { name: 'status', type: 'varchar', length: '16', default: "'waiting'" },
          { name: 'rScore', type: 'int', default: 0 },
          { name: 'bScore', type: 'int', default: 0 },
          { name: 'winner', type: 'int', isNullable: true },
          { name: 'draw', type: 'boolean', default: false },
          { name: 'rGuestId', type: 'varchar', length: '64' },
          { name: 'rName', type: 'varchar', length: '32' },
          { name: 'bGuestId', type: 'varchar', length: '64', isNullable: true },
          { name: 'bName', type: 'varchar', length: '32', isNullable: true },
          { name: 'createdAt', type: 'timestamptz', default: 'now()' },
          { name: 'expiresAt', type: 'timestamptz' },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('dotsandboxes_matches');
  }
}
