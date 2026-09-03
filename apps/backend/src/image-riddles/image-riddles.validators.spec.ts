/**
 * Image-riddle engagement DTO + imageUrl validator tests
 * (plan/04-image-riddles.md P1 #1 / P1 #3) — pure validation, no DB.
 */

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { EngagementDto } from '../image-riddles/dto/engagement.dto';
import { IsImageUrl } from '../common/validators/image-url.validator';

class Holder {
  constructor(url: string) {
    this.imageUrl = url;
  }
  @IsImageUrl()
  imageUrl: string;
}

describe('IsImageUrl validator', () => {
  it.each([
    ['https://example.com/image.jpg', 0],
    ['http://localhost:3012/uploads/foo.webp', 0],
    ['/uploads/abc.webp', 0],
    ['javascript:alert(1)', 1],
    ['data:image/png;base64,AAAA', 1],
    ['not a url', 1],
    ['', 1],
  ])('validates %s', async (url, expectedErrors) => {
    const errors = await validate(new Holder(url));
    expect(errors.filter((e) => e.property === 'imageUrl')).toHaveLength(expectedErrors);
  });
});

describe('EngagementDto', () => {
  it.each([
    ['view', 0],
    ['attempt', 0],
    ['solve', 0],
    ['like', 1],
    ['garbage', 1],
  ])('type=%s -> %i errors', async (type, expectedErrors) => {
    const dto = plainToInstance(EngagementDto, { type });
    const errors = await validate(dto);
    expect(errors).toHaveLength(expectedErrors);
  });
});
