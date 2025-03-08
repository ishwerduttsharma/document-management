import {
  Injectable,
  Inject,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { AllowUnauthorizedRequest } from 'src/allow-unauthorized-request/allow-unauthorized-request.decorator';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class AuthService {
  constructor(
    @Inject('drizzleProvider') private db: PostgresJsDatabase<typeof schema>,
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  @AllowUnauthorizedRequest()
  async signIn(email: string, password: string) {
    const user = await this.userService.findUserByEmail(email);
    const isPasswordMatching = await bcrypt.compare(password, user.password);
    if (!isPasswordMatching)
      throw new BadRequestException('Wrong credentials. Please try again');
    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      platformRole: user.platformRole,
    };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      userId: user.id,
      email: user.email,
      name: user.name,
    };
  }

  async logout(token: string) {
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    const decoded = this.jwtService.decode(token) as { exp: number };
    if (!decoded) {
      throw new UnauthorizedException('Invalid token');
    }

    const expiresAt = new Date(decoded.exp * 1000);
    await this.userService.logout(token, expiresAt);

    return { message: 'Logged out successfully' };
  }
}
