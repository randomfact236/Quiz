import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * plan/games/04: live Battleship Lite matches — player-placed fleets held
 * server-side, shots resolved by the server, per-player redacted views.
 */
export class CreateBsMatches1794100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'bsmatches',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'code', type: 'varchar', length: '6', isUnique: true },
          { name: 'status', type: 'varchar', length: '16', default: "'placing'" },
          { name: 'turn', type: 'int' },
          { name: 'rFleet', type: 'jsonb', isNullable: true },
          { name: 'bFleet', type: 'jsonb', isNullable: true },
          { name: 'rShots', type: 'jsonb' },
          { name: 'bShots', type: 'jsonb' },
          { name: 'rIncoming', type: 'jsonb' },
          { name: 'bIncoming', type: 'jsonb' },
          { name: 'winner', type: 'int', isNullable: true },
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
    await queryRunner.dropTable('bsmatches');
  }
}
