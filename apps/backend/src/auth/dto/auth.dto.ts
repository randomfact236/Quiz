import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
const PASSWORD_MESSAGE = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)';

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
