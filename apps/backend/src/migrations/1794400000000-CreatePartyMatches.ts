import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * MP1 (owner decision 2026-09-28): live party matches — 3/4 seats, empty
 * seats default to bots, server-authoritative moves via per-game adapters,
 * 3-second poll sync, ~60 min TTL. One table serves ALL party games.
 */
export class CreatePartyMatches1794400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'party_matches',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'code', type: 'varchar', length: '6', isUnique: true },
          { name: 'gameSlug', type: 'varchar', length: '32' },
          { name: 'seats', type: 'jsonb' },
          { name: 'turn', type: 'int' },
          { name: 'state', type: 'jsonb' },
          { name: 'status', type: 'varchar', length: '16', default: "'waiting'" },
          { name: 'placement', type: 'jsonb', isNullable: true },
          { name: 'createdAt', type: 'timestamptz', default: 'now()' },
          { name: 'expiresAt', type: 'timestamptz' },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('party_matches');
  }
}
