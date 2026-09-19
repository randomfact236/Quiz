import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Comment } from '../comments/entities/comment.entity';
import { QuestionLike } from '../question-likes/entities/question-like.entity';

import { GuestUser } from './entities/guest-user.entity';
import { GuestUsersService } from './guest-users.service';
import { GuestUsersController } from './guest-users.controller';
import { GuestUsersPublicController } from './guest-users-public.controller';

@Module({
  // QuestionLike + Comment are registered solely for the login merge, which
  // stamps the guest's likes/comments with the signed-in account id.
  imports: [TypeOrmModule.forFeature([GuestUser, QuestionLike, Comment])],
  controllers: [GuestUsersController, GuestUsersPublicController],
  providers: [GuestUsersService],
  exports: [GuestUsersService],
})
export class GuestUsersModule {}
