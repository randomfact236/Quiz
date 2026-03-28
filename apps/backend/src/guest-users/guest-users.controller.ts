import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { GuestUsersService } from './guest-users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

class UpdateDemographicsDto {
  country?: string;
  sex?: 'male' | 'female';
  ageGroup?: string;
}

@ApiTags('Guest Users')
@Controller('admin/guest-users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class GuestUsersController {
  constructor(private readonly guestUsersService: GuestUsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all guest users' })
  @ApiResponse({ status: 200, description: 'List of guest users' })
  async getAll() {
    const guests = await this.guestUsersService.getAll();
    const count = await this.guestUsersService.getCount();
    return { data: guests, total: count };
  }

  @Get(':guestId')
  @ApiOperation({ summary: 'Get guest user by ID' })
  async getOne(@Param('guestId') guestId: string) {
    return this.guestUsersService.findByGuestId(guestId);
  }

  @Post()
  @ApiOperation({ summary: 'Update guest user demographics' })
  async updateDemographics(
    @Body() dto: UpdateDemographicsDto & { guestId: string },
  ) {
    const { guestId, ...data } = dto;
    return this.guestUsersService.updateDemographics(guestId, data);
  }
}
