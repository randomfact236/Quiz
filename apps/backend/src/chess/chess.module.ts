import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GuestUsersModule } from '../guest-users/guest-users.module';
import { ChessMatch } from './entities/chess-match.entity';
import { ChessController } from './chess.controller';
import { ChessService } from './chess.service';

/**
 * Live Chess 9×9 (plan/games/39) on the tictactoe pattern. The service
 * re-implements the rules server-side so captures, the ko ban, the pass
 * counter and the area score are validated, not trusted.
 */
@Module({
  imports: [TypeOrmModule.forFeature([ChessMatch]), GuestUsersModule],
  controllers: [ChessController],
  providers: [ChessService],
  exports: [ChessService],
})
export class ChessModule {}
