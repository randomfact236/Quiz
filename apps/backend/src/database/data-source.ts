import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { DB_PORT } from '../common/constants/app.constants';

dotenv.config();

export const _dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || String(DB_PORT)),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'ai_quiz',
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,
};

const _dataSource = new DataSource(_dataSourceOptions);

export default _dataSource;