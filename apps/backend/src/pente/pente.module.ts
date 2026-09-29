import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GuestUsersModule } from '../guest-users/guest-users.module';
import { PenteMatch } from './entities/pente-match.entity';
import { PenteController } from './pente.controller';
import { PenteService } from './pente.service';

/**
 * Live Pente (plan/games/23) — five-in-a-row with pair captures on the
 * tictactoe pattern. The service re-implements the rules server-side so
 * captures and both win conditions are validated, not trusted.
 */
@Module({
  imports: [TypeOrmModule.forFeature([PenteMatch]), GuestUsersModule],
  controllers: [PenteController],
  providers: [PenteService],
  exports: [PenteService],
})
export class PenteModule {}
