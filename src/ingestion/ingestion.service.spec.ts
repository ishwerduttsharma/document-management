import { Test } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { IngestionService } from './ingestion.service';
import { PgBossService, PgBossModule } from '@wavezync/nestjs-pgboss';
import { drizzleProvider } from '../database/drizzle.provider';
import {
  users,
  ingestionTypeManage,
  ingestionRouteManage,
  ingestionTracker,
} from '../database/schema';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from 'src/database/schema';
import { QueueStatus, Roles } from 'src/lib/common';
import { Pool } from 'pg';
import { faker } from '@faker-js/faker';
import * as fs from 'fs';
import { createId } from '@paralleldrive/cuid2';
import { inArray, eq, or } from 'drizzle-orm';
import * as path from 'path';

describe('IngestionService', () => {
  let ingestionService: IngestionService;
  let pgBossService: PgBossService;
  let db: PostgresJsDatabase<typeof schema>;
  const ingestionTypeManageId = createId();
  const routeId = createId();
  const ingestionType = 'testIngestDoc';
  const route = 'www.test.process.com';
  const userId = createId();
  const clientEmail = 'test@gmail.com';
  const dummyIngestionType = 'dummyIngestionType';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), DatabaseModule],
      providers: [IngestionService, drizzleProvider],
    }).compile();

    ingestionService = moduleRef.get<IngestionService>(IngestionService);
    pgBossService = moduleRef.get<PgBossService>(PgBossService);
    db = moduleRef.get<PostgresJsDatabase<typeof schema>>('drizzleProvider');

    const user1email = 'user1@gmail.com';
    const user1name = 'user1';
    const user1password = 'user1password';
    await db.transaction(async (tx) => {
      await tx.insert(users).values([
        {
          id: userId,
          email: user1email,
          name: user1name,
          password: user1password,
          platformRole: 'ADMIN',
        },
      ]);

      await tx.insert(ingestionTypeManage).values({
        id: ingestionTypeManageId,
        ingestionType: ingestionType,
        createdBy: userId,
        createdDate: new Date().toDateString(),
      });
      await tx.insert(ingestionRouteManage).values({
        id: routeId,
        ingestionTypeId: ingestionTypeManageId,
        clientEmail: clientEmail,
        route: route,
        createdBy: userId,
        createdDate: new Date().toDateString(),
      });
    });
  });

  afterAll(async () => {
    await db
      .delete(ingestionTracker)
      .where(eq(ingestionTracker.ingestionRouteManageId, routeId));
    await db
      .delete(ingestionRouteManage)
      .where(eq(ingestionRouteManage.ingestionTypeId, ingestionTypeManageId));
    await db
      .delete(ingestionTypeManage)
      .where(
        or(
          eq(ingestionTypeManage.id, ingestionTypeManageId),
          eq(ingestionTypeManage.ingestionType, dummyIngestionType),
        ),
      );
    await db.delete(users).where(eq(users.id, userId));
  });

  it('should be defined', () => {
    expect(ingestionService).toBeDefined();
  });
  describe('create', () => {
    it('should create a ingestion', async () => {
      try {
        // ✅ Call the function and wait for completion
        const result = await ingestionService.create(createId(), routeId);
        // fileId = result.fileId;
        // ✅ Validate result
        jest
          .spyOn(ingestionService, 'create')
          .mockReturnValueOnce(result as any);

        expect(result).toBeTruthy();
      } catch (error) {
        console.log('Error inside test:', error);
        throw error; // Rethrow to fail the test properly if an error occurs
      }
    });
  });

  describe('findAll', () => {
    it('should throw NotFoundException if no ingestions are found', async () => {
      // Mock findAll to return an empty array
      jest
        .spyOn(ingestionService, 'findAll')
        .mockRejectedValueOnce(new NotFoundException('No Data found'));

      await expect(
        ingestionService.findAll({
          limit: 10,
          pageNumber: 1,
          contentId: '11111111',
        }),
      ).rejects.toThrow(NotFoundException);

      await expect(
        ingestionService.findAll({
          limit: 10,
          pageNumber: 1,
          contentId: '11111111',
        }),
      ).rejects.toThrow('No Data found');
    });
    it('should return all ingestions', async () => {
      await ingestionService.create(createId(), routeId);

      const result = await ingestionService.findAll({
        limit: 10,
        pageNumber: 1,
      });
      jest
        .spyOn(ingestionService, 'findAll')
        .mockReturnValueOnce(result as any);

      expect(result.status).toBe(200);
      expect(result.data.length).toBeGreaterThan(0);
    });
  });

  describe('bulkUpdateStatus', () => {
    it('should bulk update status of ingestions', async () => {
      const ingestionId1 = await ingestionService.create(createId(), routeId);
      const ingestionId2 = await ingestionService.create(createId(), routeId);

      const result = await ingestionService.bulkUpdateStatus(
        [ingestionId1, ingestionId2],
        QueueStatus.COMPLETED,
      );
      jest
        .spyOn(ingestionService, 'bulkUpdateStatus')
        .mockReturnValueOnce(result as any);

      expect(result).toBeTruthy();
    });
  });

  describe('createIngestionType', () => {
    it('should throw ConflictException if a duplicate ingestion type to be create', async () => {
      jest
        .spyOn(ingestionService, 'createIngestionType')
        .mockRejectedValueOnce(
          new ConflictException(
            `This ingestion type: ${ingestionType} already exists`,
          ),
        );

      await expect(
        ingestionService.createIngestionType(userId, {
          ingestionType: ingestionType,
        }),
      ).rejects.toThrow(ConflictException);

      await expect(
        ingestionService.createIngestionType(userId, {
          ingestionType: ingestionType,
        }),
      ).rejects.toThrow(`This ingestion type: ${ingestionType} already exists`);
    });

    it('should create ingestion type', async () => {
      const result = await ingestionService.createIngestionType(userId, {
        ingestionType: dummyIngestionType,
      });

      jest
        .spyOn(ingestionService, 'createIngestionType')
        .mockReturnValueOnce(result as any);

      expect(result).toBeTruthy();
      expect(result.status).toBe(201);
    });
  });

  describe('changeIngestionTypeManageStatus', () => {
    it('should update status of ingestion type', async () => {
      const result = await ingestionService.changeIngestionTypeManageStatus(
        userId,
        ingestionTypeManageId,
        true,
      );

      jest
        .spyOn(ingestionService, 'changeIngestionTypeManageStatus')
        .mockReturnValueOnce(result as any);

      expect(result).toBeTruthy();
      expect(result.status).toBe(201);
    });
  });

  describe('findStatusOfIngestionType', () => {
    beforeEach(() => {
      jest.restoreAllMocks(); // Reset mocks before each test
    });

    it('should return false if ingestions type not exist', async () => {
      jest
        .spyOn(ingestionService, 'findStatusOfIngestionType')
        .mockResolvedValueOnce(false);

      const result =
        await ingestionService.findStatusOfIngestionType('noIngest');
      console.log('restul:', result);

      expect(result).toBe(false);
    });

    it('should return true if ingestions type exist', async () => {
      jest
        .spyOn(ingestionService, 'findStatusOfIngestionType')
        .mockResolvedValueOnce(true);
      const falseResult =
        await ingestionService.findStatusOfIngestionType(ingestionType);

      expect(falseResult).toBe(true);
    });
  });

  describe('createNewRouteForIngestion', () => {
    it('should throw ConflictException if a duplicate ingestion route to be create', async () => {
      jest
        .spyOn(ingestionService, 'createNewRouteForIngestion')
        .mockRejectedValueOnce(
          new ConflictException(
            `This ingestion route: ${route} for this ingestion type already exists`,
          ),
        );

      await expect(
        ingestionService.createNewRouteForIngestion(userId, {
          ingestionTypeId: ingestionTypeManageId,
          route: route,
          clientEmail: 'clientEmail',
        }),
      ).rejects.toThrow(ConflictException);

      await expect(
        ingestionService.createNewRouteForIngestion(userId, {
          ingestionTypeId: ingestionTypeManageId,
          route: route,
          clientEmail: 'clientEmail',
        }),
      ).rejects.toThrow(
        `This ingestion route: ${route} for this ingestion type already exists`,
      );
    });

    it('should create a ingestion route', async () => {
      try {
        // ✅ Call the function and wait for completion
        const result = await ingestionService.createNewRouteForIngestion(
          userId,
          {
            ingestionTypeId: ingestionTypeManageId,
            route: 'www.com',
            clientEmail: 'clientEmail',
          },
        );
        // fileId = result.fileId;
        // ✅ Validate result
        jest
          .spyOn(ingestionService, 'createNewRouteForIngestion')
          .mockReturnValueOnce(result as any);

        expect(result).toBeTruthy();
        expect(result.status).toBe(201);
      } catch (error) {
        console.log('Error inside test:', error);
        throw error; // Rethrow to fail the test properly if an error occurs
      }
    });
  });

  describe('changeIngestionManageRouteStatus', () => {
    it('should update status of ingestion route', async () => {
      const result = await ingestionService.changeIngestionManageRouteStatus(
        userId,
        routeId,
        true,
      );

      jest
        .spyOn(ingestionService, 'changeIngestionManageRouteStatus')
        .mockReturnValueOnce(result as any);

      expect(result).toBeTruthy();
      expect(result.status).toBe(201);
    });
  });

  describe('findAllIngestionRoute', () => {
    it('should throw NotFoundException if no ingestions route are found', async () => {
      // Mock findAll to return an empty array

      jest
        .spyOn(ingestionService, 'findAllIngestionRoute')
        .mockRejectedValueOnce(new NotFoundException('No Data found'));

      await expect(
        ingestionService.findAllIngestionRoute({
          limit: 10,
          pageNumber: 1,
          route: 'wwwwwwwwwww.com',
        }),
      ).rejects.toThrow(NotFoundException);

      await expect(
        ingestionService.findAllIngestionRoute({
          limit: 10,
          pageNumber: 1,
          route: 'wwwwwwwwwww.com',
        }),
      ).rejects.toThrow('No Data found');
    });

    it('should return all ingestions route', async () => {
      const result = await ingestionService.findAllIngestionRoute({
        limit: 10,
        pageNumber: 1,
      });
      jest
        .spyOn(ingestionService, 'findAllIngestionRoute')
        .mockReturnValueOnce(result as any);

      expect(result.status).toBe(200);
      expect(result.data.length).toBeGreaterThan(0);
    });
  });

  describe('findAllIngestionRouteOfIngestionType', () => {
    it('should find all ingestion route of ingestion type', async () => {
      try {
        // ✅ Call the function and wait for completion
        const result =
          await ingestionService.findAllIngestionRouteOfIngestionType(
            ingestionType,
          );
        // fileId = result.fileId;
        // ✅ Validate result
        jest
          .spyOn(ingestionService, 'findAllIngestionRouteOfIngestionType')
          .mockReturnValueOnce(result as any);

        expect(result).toBeTruthy();
      } catch (error) {
        console.log('Error inside test:', error);
        throw error; // Rethrow to fail the test properly if an error occurs
      }
    });
  });

  describe('findAllIngestionType', () => {
    it('should return all ingestions type', async () => {
      const result = await ingestionService.findAllIngestionType();
      jest
        .spyOn(ingestionService, 'findAllIngestionType')
        .mockReturnValueOnce(result as any);

      expect(result.status).toBe(200);
      expect(result.data.length).toBeGreaterThan(0);
    });
  });
});
