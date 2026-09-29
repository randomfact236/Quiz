import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GuestUsersModule } from '../guest-users/guest-users.module';
import { OthelloMatch } from './entities/othello-match.entity';
import { OthelloController } from './othello.controller';
import { OthelloService } from './othello.service';

/**
 * Live Othello (plan/games/12) — the flip duel on the tictactoe pattern. The
 * service re-implements the rules server-side so flips and the pass rule are
 * validated, not trusted.
 */
@Module({
  imports: [TypeOrmModule.forFeature([OthelloMatch]), GuestUsersModule],
  controllers: [OthelloController],
  providers: [OthelloService],
  exports: [OthelloService],
})
export class OthelloModule {}
