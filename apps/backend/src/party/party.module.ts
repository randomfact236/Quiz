import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GuestUsersModule } from '../guest-users/guest-users.module';
import { PartyMatch } from './entities/party-match.entity';
import { PartyController } from './party.controller';
import { PartyService } from './party.service';

/**
 * MP1 party tables (owner decision 2026-09-28) — the ONE multi-seat engine
 * for 3P/4P games: empty seats default to bots, adapters validate every move
 * through pure game cores, 3-second poll sync (no websockets).
 */
@Module({
  imports: [TypeOrmModule.forFeature([PartyMatch]), GuestUsersModule],
  controllers: [PartyController],
  providers: [PartyService],
  exports: [PartyService],
})
export class PartyModule {}
