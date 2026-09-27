import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GuestUsersModule } from '../guest-users/guest-users.module';
import { ConnectFourMatch } from './entities/connectfour-match.entity';
import { ConnectFourController } from './connectfour.controller';
import { ConnectFourService } from './connectfour.service';

/**
 * Live Connect Four (plan/games/01) — the second game on the tictactoe
 * duel pattern: server-authoritative moves, 3-second poll sync.
 */
@Module({
  imports: [TypeOrmModule.forFeature([ConnectFourMatch]), GuestUsersModule],
  controllers: [ConnectFourController],
  providers: [ConnectFourService],
  exports: [ConnectFourService],
})
export class ConnectFourModule {}
