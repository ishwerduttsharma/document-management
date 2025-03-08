import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Loads .env globally
    DatabaseModule,
    JwtModule.register({
      global: true,
      secret: 'doc33',
      signOptions: { expiresIn: '4h' },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
