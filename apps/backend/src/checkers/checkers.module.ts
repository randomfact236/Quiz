import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GuestUsersModule } from '../guest-users/guest-users.module';
import { CheckersMatch } from './entities/checkers-match.entity';
import { CheckersController } from './checkers.controller';
import { CheckersService } from './checkers.service';

/**
 * Live Checkers (plan/games/06) — the 8×8 two-player duel on the tictactoe
 * pattern. The service re-implements the rules server-side so multi-jump
 * chains and forced captures are validated, not trusted.
 */
@Module({
  imports: [TypeOrmModule.forFeature([CheckersMatch]), GuestUsersModule],
  controllers: [CheckersController],
  providers: [CheckersService],
  exports: [CheckersService],
})
export class CheckersModule {}
