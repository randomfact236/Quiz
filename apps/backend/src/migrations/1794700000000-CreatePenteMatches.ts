import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * plan/games/23: live Pente matches — the server owns the board, resolves
 * every capture, and decides both win conditions (five in a row, or the
 * capture target).
 */
export class CreatePenteMatches1794700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'pentematches',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'code', type: 'varchar', length: '6', isUnique: true },
          { name: 'status', type: 'varchar', length: '16', default: "'waiting'" },
          { name: 'size', type: 'int', default: 19 },
          { name: 'target', type: 'int', default: 5 },
          { name: 'cells', type: 'jsonb' },
          { name: 'turn', type: 'int', default: 1 },
          { name: 'captures', type: 'jsonb', default: "'[0,0]'" },
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
    await queryRunner.dropTable('pentematches');
  }
}
