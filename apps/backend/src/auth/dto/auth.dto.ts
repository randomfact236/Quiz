import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

/**
 * DTO for user registration
 * Validates email format, password strength, and name presence
 */
export class RegisterDto {
    @ApiProperty({ example: 'user@example.com', description: 'Valid email address' })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;

    @ApiProperty({ example: 'MySecurePass123!', description: 'Password (min 8 characters)' })
    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @MaxLength(128, { message: 'Password must not exceed 128 characters' })
    password: string;

    @ApiProperty({ example: 'John Doe', description: 'Display name' })
    @IsString()
    @IsNotEmpty({ message: 'Name is required' })
    @MaxLength(100, { message: 'Name must not exceed 100 characters' })
    name: string;
}

/**
 * DTO for user login
 * Validates email format and password presence
 */
export class LoginDto {
    @ApiProperty({ example: 'user@example.com', description: 'Registered email address' })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;

    @ApiProperty({ example: 'MySecurePass123!', description: 'Account password' })
    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    password: string;
}

/**
 * DTO for refreshing an access token
 */
export class RefreshDto {
    @ApiProperty({ example: 'eyJhbGciOi...', description: 'Valid refresh token' })
    @IsString()
    @IsNotEmpty({ message: 'Refresh token is required' })
    refreshToken: string;
}

