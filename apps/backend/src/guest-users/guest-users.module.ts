import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GuestUser } from './entities/guest-user.entity';
import { GuestUsersService } from './guest-users.service';
import { GuestUsersController } from './guest-users.controller';
import { GuestUsersPublicController } from './guest-users-public.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GuestUser])],
  controllers: [GuestUsersController, GuestUsersPublicController],
  providers: [GuestUsersService],
  exports: [GuestUsersService],
})
export class GuestUsersModule {}
