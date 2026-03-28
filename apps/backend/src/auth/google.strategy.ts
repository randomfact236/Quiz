import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    const clientID = configService.get('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get('GOOGLE_CALLBACK_URL');

    if (!clientID || !clientSecret) {
      throw new Error('Missing Google OAuth credentials in .env!');
    }

    super({
      clientID,
      clientSecret,
      callbackURL: callbackURL || 'http://localhost:3012/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: Profile) {
    const { id, displayName, emails, photos } = profile;
    const email = emails?.[0]?.value;
    const avatar = photos?.[0]?.value;

    return {
      googleId: id,
      email,
      name: displayName,
      avatar,
    };
  }
}
