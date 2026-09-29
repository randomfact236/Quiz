import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * plan/games/40: live Chess matches — the server owns the board, the
 * castling rights, the en-passant target, the halfmove clock and the result.
 */
export class CreateChessMatches1794900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'chessmatches',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'code', type: 'varchar', length: '6', isUnique: true },
          { name: 'status', type: 'varchar', length: '16', default: "'waiting'" },
          { name: 'board', type: 'jsonb' },
          { name: 'turn', type: 'int', default: 1 },
          { name: 'castling', type: 'int', default: 15 },
          { name: 'enPassant', type: 'int', default: -1 },
          { name: 'halfmoves', type: 'int', default: 0 },
          { name: 'fullmove', type: 'int', default: 1 },
          { name: 'lastMove', type: 'jsonb', isNullable: true },
          { name: 'winner', type: 'int', isNullable: true },
          { name: 'draw', type: 'boolean', default: false },
          { name: 'result', type: 'varchar', length: '16', isNullable: true },
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
    await queryRunner.dropTable('chessmatches');
  }
}
