import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark a route as public (no authentication required)
 * @example
 * @Public()
 * @Get('public-data')
 * getPublicData() {}
 */
export const _Public = () => SetMetadata(IS_PUBLIC_KEY, true);