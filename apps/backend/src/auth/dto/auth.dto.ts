import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

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
 * DTO for user registration
 */
export class RegisterDto {
    @ApiProperty({ example: 'John Doe', description: 'User display name' })
    @IsString()
    @IsNotEmpty({ message: 'Name is required' })
    name: string;

    @ApiProperty({ example: 'user@example.com', description: 'Email address' })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;

    @ApiProperty({ example: 'MySecurePass123!', description: 'Account password' })
    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters' })
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
