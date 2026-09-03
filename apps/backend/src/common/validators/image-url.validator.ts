import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

/**
 * Shared imageUrl validator for image riddles (plan/04-image-riddles.md P1 #3).
 *
 * Accepts either:
 *  - a local media-library path: `/uploads/<file>` (served by the backend's
 *    static mount), or
 *  - an absolute http(s) URL.
 * Anything else (javascript:, data:, relative junk) is rejected on both the
 * single create/update DTOs — the same rule the bulk path enforces client-side.
 */
const IMAGE_URL_PATTERN = /^(https?:\/\/[^\s]+|\/uploads\/[^\s]+)$/i;

export function IsImageUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isImageUrl',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string' || value.trim().length === 0) return false;
          return IMAGE_URL_PATTERN.test(value.trim());
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be an http(s) URL or a local /uploads/... path`;
        },
      },
    });
  };
}
