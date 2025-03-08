import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ConfigService } from '@nestjs/config';

export const drizzleProvider = {
  provide: 'drizzleProvider',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const connectionString = configService.get<string>('DATABASE_URL');
    const pool = new Pool({
      connectionString,
    });
    return drizzle(pool, { schema }) as NodePgDatabase<typeof schema>;
  },
};
