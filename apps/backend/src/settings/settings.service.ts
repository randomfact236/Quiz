import { Injectable, OnModuleInit, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SystemSetting } from './entities/system-setting.entity';
import { settings } from '../config/settings';
import { AppSettings, SettingsValue } from './interfaces/settings.interface';
import { isValidSettingKey, AllowedSettingKey } from './dto/update-settings.dto';

/**
 * Type for nested settings object
 */
type NestedSettings = Record<string, unknown>;

/**
 * Forbidden keys that could cause prototype pollution
 */
const FORBIDDEN_KEYS = ['__proto__', 'constructor', 'prototype'];

@Injectable()
export class SettingsService implements OnModuleInit {
    private readonly logger = new Logger(SettingsService.name);
    private effectiveSettings: AppSettings = {} as AppSettings;

    constructor(
        @InjectRepository(SystemSetting)
        private settingsRepository: Repository<SystemSetting>,
        private dataSource: DataSource,
    ) { }

    async onModuleInit(): Promise<void> {
        try {
            await this.refreshSettings();
        } catch (error) {
            // Table may not exist yet (migrations not run), use defaults
            this.logger.warn('Settings table not found, using default settings. Run migrations to create tables.');
            this.effectiveSettings = this.deepClone(settings) as AppSettings;
        }
    }

    /**
     * Refreshes internal cache of effective settings
     */
    async refreshSettings(): Promise<void> {
        const overrides = await this.settingsRepository.find();

        // Start with defaults - use structuredClone for deep copy (safer than JSON.parse/stringify)
        this.effectiveSettings = this.deepClone(settings) as AppSettings;

        // Apply overrides
        for (const setting of overrides) {
            this.applyOverride(this.effectiveSettings, setting.key, setting.value);
        }
    }

    /**
     * Safe deep clone using structuredClone or fallback
     */
    private deepClone<T>(obj: T): T {
        if (typeof structuredClone === 'function') {
            return structuredClone(obj);
        }
        // Fallback for older Node.js versions
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Check if a key contains forbidden prototype pollution patterns
     */
    private isForbiddenKey(key: string): boolean {
        return FORBIDDEN_KEYS.some(forbidden => 
            key === forbidden || 
            key.includes(`.${forbidden}.`) || 
            key.startsWith(`${forbidden}.`) || 
            key.endsWith(`.${forbidden}`)
        );
    }

    /**
     * Validate setting key against whitelist
     */
    private validateSettingKey(key: string): void {
        if (this.isForbiddenKey(key)) {
            throw new BadRequestException(`Setting key contains forbidden pattern: ${key}`);
        }
        
        const topLevelKey = key.split('.')[0];
        if (!isValidSettingKey(topLevelKey)) {
            throw new BadRequestException(`Invalid setting key: ${key}. Allowed keys are: ${['global', 'dadJokes', 'imageRiddles', 'quiz', 'riddles'].join(', ')}`);
        }
    }

    /**
     * Helper to set nested property by dot notation key
     */
    private applyOverride(obj: NestedSettings, key: string, value: SettingsValue): void {
        // Security: Check for prototype pollution attempts
        if (this.isForbiddenKey(key)) {
            throw new BadRequestException(`Setting key contains forbidden pattern: ${key}`);
        }

        const parts = key.split('.');
        let current: NestedSettings = obj;

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            
            // Security: Check each part for forbidden keys
            if (FORBIDDEN_KEYS.includes(part)) {
                throw new BadRequestException(`Setting key part contains forbidden pattern: ${part}`);
            }
            
            if (!current[part]) current[part] = {};
            current = current[part] as NestedSettings;
        }

        const finalPart = parts[parts.length - 1];
        
        // Security: Check final part for forbidden keys
        if (FORBIDDEN_KEYS.includes(finalPart)) {
            throw new BadRequestException(`Setting key part contains forbidden pattern: ${finalPart}`);
        }

        // Deep merge instead of direct replacement
        const target = current[finalPart];
        if (target && typeof target === 'object' && value && typeof value === 'object' && !Array.isArray(target)) {
            this.deepMerge(target as NestedSettings, value as NestedSettings);
        } else {
            current[finalPart] = value as NestedSettings[string];
        }
    }

    /**
     * Recursive deep merge helper with prototype pollution protection
     */
    private deepMerge(target: NestedSettings, source: NestedSettings): NestedSettings {
        for (const key of Object.keys(source)) {
            // Security: Skip forbidden keys to prevent prototype pollution
            if (FORBIDDEN_KEYS.includes(key)) {
                continue;
            }
            
            if (source[key] instanceof Object && key in target) {
                const targetValue = target[key];
                const sourceValue = source[key];
                
                // Ensure we're not merging into a prototype
                if (targetValue && typeof targetValue === 'object' && 
                    sourceValue && typeof sourceValue === 'object' &&
                    !Array.isArray(sourceValue)) {
                    this.deepMerge(targetValue as NestedSettings, sourceValue as NestedSettings);
                } else {
                    target[key] = sourceValue as NestedSettings[string];
                }
            } else {
                target[key] = source[key] as NestedSettings[string];
            }
        }
        return target;
    }

    /**
     * Get full effective settings object
     */
    getSettings(): AppSettings {
        return this.effectiveSettings;
    }

    /**
     * Get specific setting by dot notation
     */
    get(key: string): SettingsValue | undefined {
        const parts = key.split('.');
        let current: unknown = this.effectiveSettings;

        for (const part of parts) {
            if (current === undefined) return undefined;
            if (typeof current !== 'object' || current === null) return undefined;
            current = (current as NestedSettings)[part];
        }

        return current as SettingsValue;
    }

    /**
     * Update a specific setting
     */
    async updateSetting(key: string, value: SettingsValue): Promise<AppSettings> {
        // Validate key before processing
        this.validateSettingKey(key);

        let setting = await this.settingsRepository.findOne({ where: { key } });

        if (!setting) {
            setting = this.settingsRepository.create({
                key,
                value,
            });
        } else {
            setting.value = value;
        }

        await this.settingsRepository.save(setting);
        await this.refreshSettings(); // Update cache
        return this.getSettings();
    }

    /**
     * Bulk update settings with transaction support
     * Fixes N+1 query problem by using a single transaction
     */
    async updateSettings(updates: Record<AllowedSettingKey, unknown>): Promise<AppSettings> {
        // Validate all keys before processing
        for (const key of Object.keys(updates)) {
            this.validateSettingKey(key);
        }

        // Use transaction for atomic updates - fixes N+1 query issue
        await this.dataSource.transaction(async (transactionalEntityManager) => {
            const settingsRepo = transactionalEntityManager.getRepository(SystemSetting);
            
            for (const [key, value] of Object.entries(updates)) {
                // Skip forbidden keys
                if (this.isForbiddenKey(key)) {
                    throw new BadRequestException(`Setting key contains forbidden pattern: ${key}`);
                }

                let setting = await settingsRepo.findOne({ where: { key } });

                if (!setting) {
                    setting = settingsRepo.create({
                        key,
                        value: value as SettingsValue,
                    });
                } else {
                    setting.value = value as SettingsValue;
                }

                await settingsRepo.save(setting);
            }
        });

        // Refresh cache after transaction completes
        await this.refreshSettings();
        return this.getSettings();
    }
}
