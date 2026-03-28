import { Controller, Get, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { UsersService } from '../../users/users.service';
import { AdminGuard } from '../../common/guards/admin.guard';

@ApiTags('Admin - Users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getAllUsers() {
    const users = await this.usersService.getAll();
    return {
      data: users,
      total: users.length,
    };
  }

  @Get('demographics')
  @ApiOperation({ summary: 'Get all users with demographics data' })
  @ApiResponse({ status: 200, description: 'Users with demographics retrieved successfully' })
  async getAllUsersWithDemographics() {
    const users = await this.usersService.getAllWithDemographics();
    return {
      data: users,
      total: users.length,
    };
  }

  @Put(':id/demographics')
  @ApiOperation({ summary: 'Update user demographics' })
  @ApiResponse({ status: 200, description: 'User demographics updated successfully' })
  async updateUserDemographics(
    @Param('id') id: string,
    @Body() data: { country?: string; sex?: 'male' | 'female'; ageGroup?: string },
  ) {
    return this.usersService.updateDemographics(id, data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async updateUser(
    @Param('id') id: string,
    @Body() data: { name?: string; role?: string; avatar?: string },
  ) {
    if (data.role) {
      await this.usersService.updateRole(id, data.role);
    }
    return this.usersService.updateProfile(id, { name: data.name, avatar: data.avatar });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id') id: string) {
    await this.usersService.delete(id);
    return { message: 'User deleted successfully' };
  }
}
