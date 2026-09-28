import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GuestUsersModule } from '../guest-users/guest-users.module';
import { RpsMatch } from './entities/rockpaperscissors-match.entity';
import { RpsController } from './rockpaperscissors.controller';
import { RpsService } from './rockpaperscissors.service';

/**
 * Live Rock Paper Scissors (plan/games/07) — the 60-second quickfire duel on
 * the tictactoe pattern, with simultaneous picks and a server-side reveal.
 */
@Module({
  imports: [TypeOrmModule.forFeature([RpsMatch]), GuestUsersModule],
  controllers: [RpsController],
  providers: [RpsService],
  exports: [RpsService],
})
export class RpsModule {}
