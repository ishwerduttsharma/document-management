import { Test } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from 'src/user/user.module';
import { JwtService, JwtModule } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { DatabaseModule } from '../database/database.module';
import { AuthService } from './auth.service';
import { drizzleProvider } from '../database/drizzle.provider';
import { blackListToken, users } from '../database/schema';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from 'src/database/schema';
import { Pool } from 'pg';
import * as fs from 'fs';
import { createId } from '@paralleldrive/cuid2';
import { inArray, eq, or } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let jwtService: JwtService;
  let db: PostgresJsDatabase<typeof schema>;
  const user1Id = createId();
  const user1email = 'user1email@gmail.com';
  const user1name = 'user1name';
  const user1password = 'user1password';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        DatabaseModule,
        UserModule,
        JwtModule.register({
          secret: 'doc33', // Ensure secret is provided
          signOptions: { expiresIn: '4h' },
        }),
      ],
      providers: [AuthService, drizzleProvider],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
    userService = moduleRef.get<UserService>(UserService);
    jwtService = moduleRef.get<JwtService>(JwtService);
    db = moduleRef.get<PostgresJsDatabase<typeof schema>>('drizzleProvider');

    const saltOrRound = 10;
    const password = await bcrypt.hash(user1password, saltOrRound);

    await db.insert(users).values({
      id: user1Id,
      email: user1email,
      name: user1name,
      password: password,
    });
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.id, user1Id));
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('signIn', () => {
    beforeEach(() => {
      jest.restoreAllMocks(); // Reset mocks before each test
    });
    it('should sign in successfully with valid credentials', async () => {
      try {
        //  Call the function and wait for completion
        const result = await authService.signIn(user1email, user1password);
        //  Validate result
        console.log('result:', result);
        jest.spyOn(authService, 'signIn').mockReturnValueOnce(result as any);

        expect(result).toBeTruthy();
        expect(result.userId).toBe(user1Id);
      } catch (error) {
        console.log('Error inside test:', error);
        throw error; // Rethrow to fail the test properly if an error occurs
      }
    });
    it('should throw NotFoundException if user is not found', async () => {
      // Mock findAll to return an empty array
      jest
        .spyOn(authService, 'signIn')
        .mockRejectedValueOnce(
          new NotFoundException('User not exists with this email'),
        );

      await expect(
        authService.signIn('nonemail@gmail.com', 'anypassword'),
      ).rejects.toThrow(NotFoundException);

      await expect(
        authService.signIn('nonemail@gmail.com', 'anypassword'),
      ).rejects.toThrow('User not exists with this email');
    });
    it('should throw BadRequestException for invalid password', async () => {
      // Mock findAll to return an empty array
      jest
        .spyOn(authService, 'signIn')
        .mockRejectedValueOnce(
          new BadRequestException('Wrong credentials. Please try again'),
        );

      await expect(
        authService.signIn(user1email, 'anypassword'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        authService.signIn(user1email, 'anypassword'),
      ).rejects.toThrow('Wrong credentials. Please try again');
    });
  });

  describe('logout', () => {
    it('should throw UnauthorizedException if no token is provided', async () => {
      jest
        .spyOn(authService, 'logout')
        .mockRejectedValueOnce(new UnauthorizedException('No token provided'));

      await expect(authService.logout('')).rejects.toThrow(
        UnauthorizedException,
      );

      await expect(authService.logout('')).rejects.toThrow('No token provided');
    });
    it('should throw UnauthorizedException if Invalid token token is provided', async () => {
      jest
        .spyOn(authService, 'logout')
        .mockRejectedValueOnce(new UnauthorizedException('Invalid token'));

      await expect(authService.logout('dummy token')).rejects.toThrow(
        UnauthorizedException,
      );

      await expect(authService.logout('dummy token')).rejects.toThrow(
        'Invalid token',
      );
    });
    it('should successfully log out', async () => {
      try {
        //  Call the function and wait for completion
        const data = await authService.signIn(user1email, user1password);
        //  Validate result
        const token = data.accessToken;
        const result = authService.logout(token);
        jest.spyOn(authService, 'logout').mockReturnValueOnce(result as any);

        expect(result).toBeTruthy();
        expect((await result).message).toBe('Logged out successfully');
      } catch (error) {
        console.log('Error inside test:', error);
        throw error; // Rethrow to fail the test properly if an error occurs
      }
    });
  });
});
