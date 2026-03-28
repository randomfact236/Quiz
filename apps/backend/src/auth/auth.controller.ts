import { Controller, Get, Post, Body, HttpCode, HttpStatus, UseGuards, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshDto } from './dto/auth.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateDemographicsDto } from './dto/update-demographics.dto';
import { _Public } from '../common/decorators/public.decorator';
import { _CurrentUser } from '../common/decorators/current-user.decorator';

interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  token: string;
  refreshToken: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @_Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto.email, dto.password);
  }

  @_Public()
  @Post('register')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 200, description: 'Registration successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto.email, dto.password, dto.name);
  }

  @_Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({ status: 200, description: 'Password reset email sent if account exists' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    return this.authService.forgotPassword(dto.email);
  }

  @_Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Post('demographics')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user demographics' })
  @ApiResponse({ status: 200, description: 'Demographics updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateDemographics(
    @Body() dto: UpdateDemographicsDto,
    @_CurrentUser('id') userId: string,
  ): Promise<{ message: string }> {
    await this.authService.updateDemographics(userId, dto);
    return { message: 'Demographics updated successfully' };
  }

  @_Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() dto: RefreshDto): Promise<AuthResponse> {
    return this.authService.refresh(dto.refreshToken);
  }

  @_Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 200, description: 'Redirects to Google OAuth' })
  googleAuth() {}

  @_Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiExcludeEndpoint()
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    const googleData = req.user;
    const result = await this.authService.googleLogin(googleData);
    
    const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:3010';
    const redirectUrl = `${frontendUrl}/login?token=${result.token}&refreshToken=${result.refreshToken}&user=${encodeURIComponent(JSON.stringify(result.user))}`;
    
    return res.redirect(redirectUrl);
  }
}
