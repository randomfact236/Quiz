import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GuestUsersModule } from '../guest-users/guest-users.module';
import { DotsAndBoxesMatch } from './entities/dotsandboxes-match.entity';
import { DotsAndBoxesController } from './dotsandboxes.controller';
import { DotsAndBoxesService } from './dotsandboxes.service';

/**
 * Live Dots and Boxes (plan/games/03) — the chain-strategy game on the
 * tictactoe duel pattern: server-authoritative moves (box claims + the extra
 * turn), 3-second poll sync.
 */
@Module({
  imports: [TypeOrmModule.forFeature([DotsAndBoxesMatch]), GuestUsersModule],
  controllers: [DotsAndBoxesController],
  providers: [DotsAndBoxesService],
  exports: [DotsAndBoxesService],
})
export class DotsAndBoxesModule {}
