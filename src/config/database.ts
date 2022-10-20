import { MyLogger } from './../shared/services/logger.service';
import * as path from 'path';

export default {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [path.resolve(__dirname, '../', '**/**.entity{.ts,.js}')],
  synchronize: true,
  ssl: process.env.SSL === 'true',
  logger: new MyLogger(),
  cache: {
    duration: 60000,
  },
};
