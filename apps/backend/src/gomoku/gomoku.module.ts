import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GuestUsersModule } from '../guest-users/guest-users.module';
import { GomokuMatch } from './entities/gomoku-match.entity';
import { GomokuController } from './gomoku.controller';
import { GomokuService } from './gomoku.service';

/**
 * Live Gomoku (plan/games/02) — the third game on the tictactoe duel
 * pattern: server-authoritative moves, 3-second poll sync.
 */
@Module({
  imports: [TypeOrmModule.forFeature([GomokuMatch]), GuestUsersModule],
  controllers: [GomokuController],
  providers: [GomokuService],
  exports: [GomokuService],
})
export class GomokuModule {}
