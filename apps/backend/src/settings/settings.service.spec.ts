/**
 * SettingsService unit tests (plan/11-site-settings.md P2 #3): deep-merge of
 * partial section updates, prototype-pollution key rejection, and the
 * top-level key whitelist. DB interaction is mocked.
 */

import { BadRequestException } from '@nestjs/common';

import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  const setup = () => {
    const rows: Array<{ key: string; value: unknown }> = [];
    const settingsRepo = {
      find: jest.fn(async () => rows),
      findOne: jest.fn(async () => null),
      create: jest.fn((data: unknown) => data),
      save: jest.fn(async (data: unknown) => data),
    };
    const txRepo = {
      findOne: jest.fn(async () => null),
      create: jest.fn((data: unknown) => data),
      save: jest.fn(async (data: unknown) => {
        rows.push(data as { key: string; value: unknown });
        return data;
      }),
    };
    const dataSource = {
      transaction: jest.fn(async (cb: (em: unknown) => Promise<void>) =>
        cb({ getRepository: () => txRepo })
      ),
    };
    const service = new SettingsService(settingsRepo as never, dataSource as never);
    return { service, settingsRepo, txRepo };
  };

  it('ships gameplay levelTimers in the defaults', async () => {
    const { service } = setup();
    await service.onModuleInit();
    const settings = service.getSettings();
    expect(settings.quiz.defaults.levelTimers).toMatchObject({
      easy: 30,
      medium: 45,
      hard: 60,
      expert: 90,
      extreme: 120,
    });
    expect(settings.riddles.defaults.levelTimers).toMatchObject({
      easy: 30,
      medium: 60,
      hard: 90,
      expert: 120,
    });
  });

  it('updateSettings deep-merges a partial section (other keys survive)', async () => {
    const { service } = setup();
    await service.onModuleInit();
    await service.updateSettings({
      quiz: { defaults: { levelTimers: { easy: 42 } } },
    } as never);
    const timers = service.getSettings().quiz.defaults.levelTimers;
    expect(timers.easy).toBe(42);
    expect(timers.medium).toBe(45); // untouched sibling survives the merge
  });

  it('rejects prototype-pollution keys', async () => {
    const { service } = setup();
    await expect(
      service.updateSetting('__proto__.polluted' as never, 'x' as never)
    ).rejects.toThrow(BadRequestException);
    await expect(service.updateSetting('quiz.constructor' as never, 'x' as never)).rejects.toThrow(
      BadRequestException
    );
  });

  it('rejects unknown top-level keys (whitelist)', async () => {
    const { service } = setup();
    await expect(service.updateSetting('notASection.key' as never, 'x' as never)).rejects.toThrow(
      /Invalid setting key/
    );
  });
});
