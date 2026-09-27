import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * plan/18 phase 4: async game challenges — a run + payload behind a
 * shareable token (see entities/game-challenge.entity.ts).
 */
export class CreateGameChallenges1793500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'game_challenges',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'token', type: 'varchar', length: '24', isUnique: true },
          { name: 'gameSlug', type: 'varchar', length: '48' },
          { name: 'payload', type: 'jsonb' },
          { name: 'challengerName', type: 'varchar', length: '32' },
          { name: 'challengerGuestId', type: 'varchar', length: '64' },
          { name: 'challengeRun', type: 'jsonb' },
          { name: 'runs', type: 'jsonb', default: "'[]'" },
          { name: 'createdAt', type: 'timestamptz', default: 'now()' },
          { name: 'expiresAt', type: 'timestamptz' },
        ],
        indices: [{ name: 'IDX_game_challenges_gameSlug', columnNames: ['gameSlug'] }],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('game_challenges');
  }
}
