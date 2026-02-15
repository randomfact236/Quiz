import { Controller, Get, Put, Body, Param, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';

/**
 * Interface for authenticated user in request
 */
interface RequestUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Interface for Express request with user
 */
interface AuthenticatedRequest extends Request {
  user?: RequestUser;
}

/**
 * Interface for profile update data
 */
interface ProfileUpdateData {
  name?: string;
  avatar?: string;
}

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  async getAll(): Promise<unknown[]> {
    return this.usersService.getAll();
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: AuthenticatedRequest): Promise<unknown> {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.usersService.findById(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async getById(@Param('id') id: string): Promise<unknown> {
    return this.usersService.findById(id);
  }

  @Put('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() data: ProfileUpdateData,
  ): Promise<unknown> {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.usersService.updateProfile(req.user.id, data);
  }
}
