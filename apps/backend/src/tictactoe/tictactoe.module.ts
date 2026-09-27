import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GuestUsersModule } from '../guest-users/guest-users.module';
import { TttMatch } from './entities/ttt-match.entity';
import { TictactoeController } from './tictactoe.controller';
import { TictactoeService } from './tictactoe.service';

/**
 * Live tic-tac-toe (plan/18 phase 5) — the first realtime 2P game, synced
 * with the same 3-second polling the duels use (no websockets).
 */
@Module({
  imports: [TypeOrmModule.forFeature([TttMatch]), GuestUsersModule],
  controllers: [TictactoeController],
  providers: [TictactoeService],
  exports: [TictactoeService],
})
export class TictactoeModule {}
