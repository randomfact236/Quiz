import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * plan/games/05: live Pig Dice matches — the server owns the dice (crypto RNG);
 * clients only roll/hold.
 */
export class CreatePigMatches1794200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'pigmatches',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'code', type: 'varchar', length: '6', isUnique: true },
          { name: 'status', type: 'varchar', length: '16', default: "'running'" },
          { name: 'turn', type: 'int' },
          { name: 'rScore', type: 'int', default: 0 },
          { name: 'yScore', type: 'int', default: 0 },
          { name: 'pot', type: 'int', default: 0 },
          { name: 'target', type: 'int', default: 100 },
          { name: 'lastRoll', type: 'int', isNullable: true },
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
    await queryRunner.dropTable('pigmatches');
  }
}
