import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from './entities/system-setting.entity';
import { settings } from '../config/settings';
import { AppSettings, SettingsValue } from './interfaces/settings.interface';

/**
 * Type for nested settings object
 */
type NestedSettings = Record<string, unknown>;

@Injectable()
export class SettingsService implements OnModuleInit {
    private effectiveSettings: AppSettings = {} as AppSettings;

    constructor(
        @InjectRepository(SystemSetting)
        private settingsRepository: Repository<SystemSetting>,
    ) { }

    async onModuleInit(): Promise<void> {
        await this.refreshSettings();
    }

    /**
     * Refreshes internal cache of effective settings
     */
    async refreshSettings(): Promise<void> {
        const overrides = await this.settingsRepository.find();

        // Start with defaults
        this.effectiveSettings = JSON.parse(JSON.stringify(settings)) as AppSettings;

        // Apply overrides
        for (const setting of overrides) {
            this.applyOverride(this.effectiveSettings, setting.key, setting.value);
        }
    }

    /**
     * Helper to set nested property by dot notation key
     */
    private applyOverride(obj: NestedSettings, key: string, value: SettingsValue): void {
        const parts = key.split('.');
        let current: NestedSettings = obj;

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part]) current[part] = {};
            current = current[part] as NestedSettings;
        }

        // Deep merge instead of direct replacement
        const target = current[parts[parts.length - 1]];
        if (target && typeof target === 'object' && value && typeof value === 'object' && !Array.isArray(target)) {
            this.deepMerge(target as NestedSettings, value as NestedSettings);
        } else {
            current[parts[parts.length - 1]] = value as NestedSettings[string];
        }
    }

    /**
     * Recursive deep merge helper
     */
    private deepMerge(target: NestedSettings, source: NestedSettings): NestedSettings {
        for (const key of Object.keys(source)) {
            if (source[key] instanceof Object && key in target) {
                Object.assign(source[key] as object, this.deepMerge(target[key] as NestedSettings, source[key] as NestedSettings));
            }
        }
        Object.assign(target || {}, source);
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
     * Bulk update settings
     */
    async updateSettings(updates: Record<string, SettingsValue>): Promise<AppSettings> {
        // Process potentially complex object updates by flattening them or saving as section keys
        // For simplicity, we'll save top-level keys as sections if passed

        for (const [key, value] of Object.entries(updates)) {
            await this.updateSetting(key, value);
        }

        return this.getSettings();
    }
}
