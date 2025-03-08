import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGaurd } from './auth.guard';
import { UserService } from 'src/user/user.service';
import { RoleGuard } from './role.guard';

@Module({
  imports: [UserModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserService,
    { provide: APP_GUARD, useClass: AuthGaurd },
    RoleGuard,
  ],
  exports: [AuthService],
})
export class AuthModule {}
