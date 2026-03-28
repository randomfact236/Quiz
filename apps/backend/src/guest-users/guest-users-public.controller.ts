import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { _Public } from '../common/decorators/public.decorator';

import { GuestUsersService } from './guest-users.service';

class UpdateGuestDemographicsDto {
  guestId: string;
  country?: string;
  sex?: 'male' | 'female';
  ageGroup?: string;
}

@ApiTags('Guest Users (Public)')
@Controller('guest-users')
export class GuestUsersPublicController {
  constructor(private readonly guestUsersService: GuestUsersService) {}

  @_Public()
  @Post('demographics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update guest user demographics (public)' })
  @ApiResponse({ status: 200, description: 'Demographics updated' })
  async updateDemographics(@Body() dto: UpdateGuestDemographicsDto) {
    const { guestId, ...data } = dto;
    await this.guestUsersService.updateDemographics(guestId, data);
    return { message: 'Demographics updated successfully' };
  }
}
