import {
  Module,
  Global,
  OnModuleDestroy,
  OnModuleInit,
  forwardRef,
} from '@nestjs/common';
import { PgBossModule } from '@wavezync/nestjs-pgboss';
import { drizzleProvider } from './drizzle.provider';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
@Global()
@Module({
  imports: [
    ConfigModule,
    PgBossModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connectionString: configService.get<string>('DATABASE_URL'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [drizzleProvider],
  exports: ['drizzleProvider'],
})
export class DatabaseModule {}
