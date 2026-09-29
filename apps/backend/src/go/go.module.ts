import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GuestUsersModule } from '../guest-users/guest-users.module';
import { GoMatch } from './entities/go-match.entity';
import { GoController } from './go.controller';
import { GoService } from './go.service';

/**
 * Live Go 9×9 (plan/games/39) on the tictactoe pattern. The service
 * re-implements the rules server-side so captures, the ko ban, the pass
 * counter and the area score are validated, not trusted.
 */
@Module({
  imports: [TypeOrmModule.forFeature([GoMatch]), GuestUsersModule],
  controllers: [GoController],
  providers: [GoService],
  exports: [GoService],
})
export class GoModule {}
