import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GuestUsersModule } from '../guest-users/guest-users.module';
import { PigDiceMatch } from './entities/pigdice-match.entity';
import { PigDiceController } from './pigdice.controller';
import { PigDiceService } from './pigdice.service';

/**
 * Live Pig Dice (plan/games/05) — the luck entry on the tictactoe duel
 * pattern, with the twist that the SERVER owns the dice (crypto RNG).
 */
@Module({
  imports: [TypeOrmModule.forFeature([PigDiceMatch]), GuestUsersModule],
  controllers: [PigDiceController],
  providers: [PigDiceService],
  exports: [PigDiceService],
})
export class PigDiceModule {}
