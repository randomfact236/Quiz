import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Union type for system setting values
 * Supports primitive types and nested objects
 */
export type SystemSettingValue = string | number | boolean | object | null | unknown[];

@Entity('system_settings')
export class SystemSetting {
    @PrimaryColumn()
    key: string;

    @Column({ type: 'jsonb', default: {} })
    value: SystemSettingValue;

    @Column({ nullable: true })
    description: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
