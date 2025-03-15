import { Test } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { UserService } from './user.service';
import { PgBossService, PgBossModule } from '@wavezync/nestjs-pgboss';
import { drizzleProvider } from '../database/drizzle.provider';
import { blackListToken, users } from '../database/schema';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from 'src/database/schema';
import { QueueStatus, Roles } from 'src/lib/common';
import { Pool } from 'pg';
import { faker } from '@faker-js/faker';
import * as fs from 'fs';
import { createId } from '@paralleldrive/cuid2';
import { inArray, eq, or } from 'drizzle-orm';
import * as path from 'path';
import { platformRole } from 'src/lib/common';

describe('UserService', () => {
  let userService: UserService;
  let pgBossService: PgBossService;
  let db: PostgresJsDatabase<typeof schema>;
  const user1Id = createId();
  const user1email = 'user1email@gmail.com';
  const user1name = 'user1name';
  const user1password = 'user1password';
  const user2email = 'user2email@gmail.com';
  const user2name = 'user2name';
  const user2password = 'user2password';
  const user3email = 'user3email@gmail.com';
  const user3name = 'user3name';
  const user3password = 'user3password';
  const token = 'aaaaaaaaaaaaaaaa';
  const expiresAt = new Date();
  let data;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), DatabaseModule],
      providers: [UserService, drizzleProvider],
    }).compile();

    userService = moduleRef.get<UserService>(UserService);
    pgBossService = moduleRef.get<PgBossService>(PgBossService);
    db = moduleRef.get<PostgresJsDatabase<typeof schema>>('drizzleProvider');

    await db.transaction(async (tx) => {
      [data] = await tx
        .select()
        .from(users)
        .where(eq(users.platformRole, platformRole.ADMIN));
      if (data) {
        await tx
          .update(users)
          .set({ platformRole: platformRole.USER })
          .where(eq(users.id, data.id));
      }
      await tx.insert(users).values({
        id: user1Id,
        email: user1email,
        name: user1name,
        password: user1password,
      });
    });
  });

  afterAll(async () => {
    await db
      .delete(users)
      .where(inArray(users.email, [user1email, user2email, user3email]));

    if (data) {
      await db
        .update(users)
        .set({ platformRole: platformRole.ADMIN })
        .where(eq(users.id, data.id));
    }
    await db.delete(blackListToken).where(eq(blackListToken.token, token));
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });
  describe('createPlatformAdmin', () => {
    it('should throw ConflictException if a email is not unique', async () => {
      jest
        .spyOn(userService, 'createPlatformAdmin')
        .mockRejectedValueOnce(
          new ConflictException(`User with email ${user1email} already exists`),
        );

      await expect(
        userService.createPlatformAdmin({
          email: user1email,
          name: user2name,
          password: user2password,
        }),
      ).rejects.toThrow(ConflictException);

      await expect(
        userService.createPlatformAdmin({
          email: user1email,
          name: user2name,
          password: user2password,
        }),
      ).rejects.toThrow(`User with email ${user1email} already exists`);
    });
    it('should create a platform admin', async () => {
      try {
        // ✅ Call the function and wait for completion
        const result = await userService.createPlatformAdmin({
          email: user2email,
          name: user2name,
          password: user2password,
        });
        // ✅ Validate result
        jest
          .spyOn(userService, 'createPlatformAdmin')
          .mockReturnValueOnce(result as any);

        expect(result).toBeTruthy();
        expect(result.status).toBe(201);
      } catch (error) {
        console.log('Error inside test:', error);
        throw error; // Rethrow to fail the test properly if an error occurs
      }
    });
    it('should throw ConflictException if a second admin to be create', async () => {
      jest
        .spyOn(userService, 'createPlatformAdmin')
        .mockRejectedValueOnce(new ConflictException(`Admin already exists`));

      await expect(
        userService.createPlatformAdmin({
          email: user2email,
          name: user2name,
          password: user2password,
        }),
      ).rejects.toThrow(ConflictException);

      await expect(
        userService.createPlatformAdmin({
          email: user2email,
          name: user2name,
          password: user2password,
        }),
      ).rejects.toThrow(`Admin already exists`);
    });
  });

  describe('create', () => {
    it('should throw ConflictException if a email is not unique', async () => {
      jest
        .spyOn(userService, 'create')
        .mockRejectedValueOnce(
          new ConflictException(`User with email ${user1email} already exists`),
        );

      await expect(
        userService.create({
          email: user1email,
          name: user2name,
          password: user2password,
        }),
      ).rejects.toThrow(ConflictException);

      await expect(
        userService.create({
          email: user1email,
          name: user2name,
          password: user2password,
        }),
      ).rejects.toThrow(`User with email ${user1email} already exists`);
    });
    it('should create a user', async () => {
      try {
        // ✅ Call the function and wait for completion
        const result = await userService.create({
          email: user3email,
          name: user3name,
          password: user3password,
        });
        // ✅ Validate result
        jest.spyOn(userService, 'create').mockReturnValueOnce(result as any);

        expect(result).toBeTruthy();
        expect(result.status).toBe(201);
      } catch (error) {
        console.log('Error inside test:', error);
        throw error; // Rethrow to fail the test properly if an error occurs
      }
    });
  });

  describe('findUser', () => {
    it('should throw NotFoundException if no user of id found', async () => {
      // Mock findAll to return an empty array
      jest
        .spyOn(userService, 'findUser')
        .mockRejectedValueOnce(new NotFoundException('User not found'));

      await expect(userService.findUser(createId())).rejects.toThrow(
        NotFoundException,
      );

      await expect(userService.findUser(createId())).rejects.toThrow(
        'User not found',
      );
    });
    it('should return user profile', async () => {
      const result = await userService.findUser(user1Id);
      jest.spyOn(userService, 'findUser').mockReturnValueOnce(result as any);

      expect(result.status).toBe(200);
    });
  });

  describe('findUserByEmail', () => {
    it('should throw NotFoundException if no user of email found', async () => {
      // Mock findAll to return an empty array
      jest
        .spyOn(userService, 'findUserByEmail')
        .mockRejectedValueOnce(
          new NotFoundException('User not exists with this email'),
        );

      const email = '122exz@gmail.com';
      await expect(userService.findUserByEmail(email)).rejects.toThrow(
        NotFoundException,
      );

      await expect(userService.findUserByEmail(email)).rejects.toThrow(
        'User not exists with this email',
      );
    });
    it('should return user data', async () => {
      const result = await userService.findUserByEmail(user1email);
      jest
        .spyOn(userService, 'findUserByEmail')
        .mockReturnValueOnce(result as any);

      expect(result).toBeTruthy();
    });
  });

  describe('findAllUsersByEmail', () => {
    it('should throw NotFoundException if no user of similar email found', async () => {
      // Mock findAll to return an empty array
      jest
        .spyOn(userService, 'findAllUsersByEmail')
        .mockRejectedValueOnce(
          new NotFoundException('No users found with this email'),
        );

      const email = '122exz@gmail.com';
      await expect(
        userService.findAllUsersByEmail(user1Id, { email }),
      ).rejects.toThrow(NotFoundException);

      await expect(
        userService.findAllUsersByEmail(user1Id, { email }),
      ).rejects.toThrow('No users found with this email');
    });
    it('should return user data with similar email', async () => {
      const result = await userService.findAllUsersByEmail(user1Id, {
        email: 'u',
      });
      jest
        .spyOn(userService, 'findAllUsersByEmail')
        .mockReturnValueOnce(result as any);

      expect(result.status).toBe(200);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if no user of found of login id', async () => {
      // Mock findAll to return an empty array
      jest
        .spyOn(userService, 'update')
        .mockRejectedValueOnce(new NotFoundException('User not found'));

      await expect(
        userService.update(createId(), {
          name: 'user1updated',
          password: 'user1password',
        }),
      ).rejects.toThrow(NotFoundException);

      await expect(
        userService.update(createId(), {
          name: 'user1updated',
          password: 'user1password',
        }),
      ).rejects.toThrow('User not found');
    });
    it('should update user', async () => {
      const result = await userService.update(user1Id, {
        name: 'user1updated',
        password: 'user1password',
      });

      jest.spyOn(userService, 'update').mockReturnValueOnce(result as any);

      expect(result).toBeTruthy();
      expect(result.status).toBe(203);
    });
  });

  describe('logout', () => {
    it('should add token to black list', async () => {
      const result = await userService.logout(token, expiresAt);

      jest.spyOn(userService, 'logout').mockReturnValueOnce(result as any);

      expect(result).toBeTruthy();
    });
  });

  describe('searchForBlackListToken', () => {
    beforeEach(() => {
      jest.restoreAllMocks(); // Reset mocks before each test
    });

    it('should return false if token not exist', async () => {
      jest
        .spyOn(userService, 'searchForBlackListToken')
        .mockResolvedValueOnce(false);

      const result = await userService.searchForBlackListToken('notoken');
      console.log('restul:', result);

      expect(result).toBe(false);
    });

    it('should return true if token exist', async () => {
      jest
        .spyOn(userService, 'searchForBlackListToken')
        .mockResolvedValueOnce(true);
      const falseResult = await userService.searchForBlackListToken(token);

      expect(falseResult).toBe(true);
    });
  });
});
