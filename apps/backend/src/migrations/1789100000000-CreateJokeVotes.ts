import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Per-voter joke votes (plan/05-dad-jokes.md P1 #1).
 *
 * `joke_votes` records one vote per voter per joke (UNIQUE). `voterKey` is
 * `user:<uuid>` for logged-in users or `guest:<guestId>` for the
 * client-issued guest identity. Counters on `dad_jokes` stay denormalized and
 * are maintained transactionally by DadJokesService.voteForJoke. Idempotent.
 */
export class CreateJokeVotes1789100000000 implements MigrationInterface {
  name = 'CreateJokeVotes1789100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "joke_votes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "jokeId" uuid NOT NULL,
        "voterKey" varchar(128) NOT NULL,
        "voteType" varchar(8) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_joke_votes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_joke_votes_joke_voter" UNIQUE ("jokeId", "voterKey"),
        CONSTRAINT "FK_joke_votes_joke" FOREIGN KEY ("jokeId") REFERENCES "dad_jokes"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_joke_votes_voter" ON "joke_votes" ("voterKey")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "joke_votes"`);
  }
}
