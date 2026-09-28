import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GuestUsersModule } from '../guest-users/guest-users.module';
import { BattleshipMatch } from './entities/battleship-match.entity';
import { BattleshipController } from './battleship.controller';
import { BattleshipService } from './battleship.service';

/**
 * Live Battleship Lite (plan/games/04) — the hidden-information duel on the
 * tictactoe pattern: player-placed fleets, server-resolved shots, per-player
 * redacted views, 3-second poll sync.
 */
@Module({
  imports: [TypeOrmModule.forFeature([BattleshipMatch]), GuestUsersModule],
  controllers: [BattleshipController],
  providers: [BattleshipService],
  exports: [BattleshipService],
})
export class BattleshipModule {}
