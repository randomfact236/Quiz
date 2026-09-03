/**
 * MediaService unit tests (plan/08-media.md P2 #3): upload pipeline —
 * MIME rejection, invalid-image rejection, re-encode to WebP, and the
 * delete-time reference-safety check (P1 #1).
 */

import { BadRequestException, ConflictException } from '@nestjs/common';

import { MediaService } from './media.service';
import { Media } from './entities/media.entity';

const sharpState = { fail: false };

jest.mock('sharp', () => {
  const sharpMock = () => {
    if (sharpState.fail) {
      return {
        metadata: async () => {
          throw new Error('boom');
        },
      };
    }
    return {
      metadata: async () => ({ width: 100, height: 80 }),
      webp: () => ({ toBuffer: async () => Buffer.from('webp-bytes') }),
    };
  };
  return { __esModule: true, default: sharpMock };
});

import sharp from 'sharp';

describe('MediaService — upload pipeline', () => {
  const makeFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File =>
    ({
      originalname: 'cat.png',
      mimetype: 'image/png',
      buffer: Buffer.from('png-bytes'),
      size: 9,
      ...overrides,
    }) as Express.Multer.File;

  const setup = () => {
    const mediaRepo = {
      create: jest.fn((data: Partial<Media>) => data),
      save: jest.fn(async (data: Partial<Media>) => ({ id: 'm1', ...data }) as Media),
      delete: jest.fn(async () => undefined),
      findOne: jest.fn(async () => null),
      count: jest.fn(async () => 0),
      createQueryBuilder: jest.fn(),
    } as never as any;
    const imageRiddleRepo = {
      createQueryBuilder: jest.fn(() => ({
        where: () => ({ getCount: async () => 0 }),
      })),
    } as never as any;
    const storageService = { uploadFile: jest.fn(() => '/uploads/x.webp'), deleteFile: jest.fn() };
    const service = new MediaService(mediaRepo, imageRiddleRepo, storageService as never);
    return { service, mediaRepo, imageRiddleRepo, storageService };
  };

  it('rejects unsupported MIME types', async () => {
    const { service } = setup();
    await expect(service.createFromFile(makeFile({ mimetype: 'application/pdf' }))).rejects.toThrow(
      BadRequestException
    );
  });

  it('rejects files sharp cannot decode', async () => {
    sharpState.fail = true;
    const { service } = setup();
    await expect(service.createFromFile(makeFile())).rejects.toThrow('Invalid image file');
    sharpState.fail = false;
  });

  it('re-encodes to WebP and stores width/height + conversion status', async () => {
    const { service, mediaRepo, storageService } = setup();
    const saved = (await service.createFromFile(makeFile(), 'A cat')) as Media;
    expect(storageService.uploadFile).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.stringMatching(/\.webp$/)
    );
    expect(saved.alt).toBe('A cat');
    expect(saved.isConverted).toBe(true);
    expect(saved.width).toBe(100);
    expect(saved.height).toBe(80);
    expect(mediaRepo.save).toHaveBeenCalled();
  });
});

describe('MediaService — reference safety on delete', () => {
  const build = (usageCount: number) => {
    const mediaRepo = {
      findOne: jest.fn(async () => ({ id: 'm1', filename: 'x.webp', url: '/uploads/x.webp' })),
      delete: jest.fn(async () => undefined),
      createQueryBuilder: jest.fn(),
    } as never as any;
    const imageRiddleRepo = {
      createQueryBuilder: jest.fn(() => ({
        where: () => ({ getCount: async () => usageCount }),
      })),
    } as never as any;
    const storageService = { deleteFile: jest.fn() };
    const service = new MediaService(mediaRepo, imageRiddleRepo, storageService as never);
    return { service, mediaRepo, storageService };
  };

  it('blocks delete when an image riddle references the asset', async () => {
    const { service, mediaRepo, storageService } = build(2);
    await expect(service.remove('m1')).rejects.toThrow(ConflictException);
    expect(mediaRepo.delete).not.toHaveBeenCalled();
    expect(storageService.deleteFile).not.toHaveBeenCalled();
  });

  it('deletes record + file when unreferenced', async () => {
    const { service, mediaRepo, storageService } = build(0);
    await service.remove('m1');
    expect(mediaRepo.delete).toHaveBeenCalledWith('m1');
    expect(storageService.deleteFile).toHaveBeenCalledWith('/uploads/x.webp');
  });
});
