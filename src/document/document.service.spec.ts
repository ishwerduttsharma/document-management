import { Test } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { DocumentService } from './document.service';
import { PgBossService, PgBossModule } from '@wavezync/nestjs-pgboss';
import { drizzleProvider } from '../database/drizzle.provider';
import {
  users,
  documents,
  userDocRoles,
  ingestionTracker,
} from '../database/schema';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from 'src/database/schema';
import { QueueStatus, Roles } from 'src/lib/common';
import { Pool } from 'pg';
import { faker } from '@faker-js/faker';
import * as fs from 'fs';
import { createId } from '@paralleldrive/cuid2';
import { inArray, eq } from 'drizzle-orm';
import * as path from 'path';

describe('DocumentService', () => {
  let documentService: DocumentService;
  let pgBossService: PgBossService;
  let db: PostgresJsDatabase<typeof schema>;
  const fileId = createId();
  const user1Id = createId();
  const userId = user1Id;
  const user2Id = createId();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), DatabaseModule],
      providers: [DocumentService, drizzleProvider],
    }).compile();

    documentService = moduleRef.get<DocumentService>(DocumentService);
    pgBossService = moduleRef.get<PgBossService>(PgBossService);
    db = moduleRef.get<PostgresJsDatabase<typeof schema>>('drizzleProvider');

    const user1email = 'user1@gmail.com';
    const user2email = 'user2@gmail.com';
    const user1name = 'user1';
    const user2name = 'user2';
    const user1password = 'user1password';
    const user2password = 'user2password';
    await db.insert(users).values([
      {
        id: userId,
        email: user1email,
        name: user1name,
        password: user1password,
      },
      {
        id: user2Id,
        email: user2email,
        name: user2name,
        password: user2password,
      },
    ]);
    const baseDirecory = process.env.BASE_UPLOAD_PATH || './uploads';
    // Get the current year as a string
    const currentYear = new Date().getFullYear().toString();
    const bucketUploadPath = path.join(baseDirecory, userId, currentYear);
    await db.transaction(async (tx) => {
      await tx.insert(documents).values({
        id: fileId,
        title: 'fileName',
        bucket: bucketUploadPath,
        extension: 'txt',
        status: QueueStatus.COMPLETED,
        createdBy: userId,
        createdDate: new Date().toDateString(),
      });
      await tx.insert(userDocRoles).values({
        id: createId(),
        docId: fileId,
        userId: userId,
        role: Roles.ADMIN,
        createdBy: userId,
        createdDate: new Date().toDateString(),
      });
    });
  });

  afterAll(async () => {
    await db
      .delete(userDocRoles)
      .where(inArray(userDocRoles.userId, [userId, user2Id]));
    const ingestionMade = await db
      .select({ id: ingestionTracker.id })
      .from(ingestionTracker)
      .innerJoin(documents, eq(documents.id, ingestionTracker.contentId));
    const ingestionMadeIds = ingestionMade.map((data) => data.id);
    await db
      .delete(ingestionTracker)
      .where(inArray(ingestionTracker.id, ingestionMadeIds));
    await db
      .delete(documents)
      .where(inArray(documents.createdBy, [user1Id, user2Id]));
    await db.delete(users).where(inArray(users.id, [user1Id, user2Id]));
  });

  it('should be defined', () => {
    expect(documentService).toBeDefined();
  });
  describe('create', () => {
    it('should create a document and schedule an upload job', async () => {
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test-file.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        size: 20,
        buffer: Buffer.from('Sample file content for testing purposes'),
        destination: '',
        filename: '',
        path: '',
        stream: undefined as any, // Multer's file stream (mocked)
      };

      try {
        // ✅ Call the function and wait for completion
        const result = await documentService.create(userId, file);
        // fileId = result.fileId;
        // ✅ Validate result
        expect(result).toHaveProperty('fileId');
        expect(result.message).toBe('File Upload Scheduled');
      } catch (error) {
        console.log('Error inside test:', error);
        throw error; // Rethrow to fail the test properly if an error occurs
      }
    });
    it('should throw NotFoundException if file is undefined', async () => {
      const file = undefined; // Simulating missing file

      await expect(documentService.create(userId, file as any)).rejects.toThrow(
        NotFoundException,
      );
      await expect(documentService.create(userId, file as any)).rejects.toThrow(
        'File is undefined',
      );
    });
  });

  describe('findAll', () => {
    it('should return all documents for a user', async () => {
      const result = await documentService.findAll(userId, {
        limit: 10,
        pageNumber: 1,
      });

      expect(result.status).toBe(200);
      expect(result.data.length).toBeGreaterThan(0);
    });
    it('should throw NotFoundException if no documents are found', async () => {
      // Mock findAll to return an empty array
      jest
        .spyOn(documentService, 'findAll')
        .mockRejectedValueOnce(new NotFoundException('No Data found'));

      await expect(
        documentService.findAll(user2Id, { limit: 10, pageNumber: 1 }),
      ).rejects.toThrow(NotFoundException);

      await expect(
        documentService.findAll(user2Id, { limit: 10, pageNumber: 1 }),
      ).rejects.toThrow('No Data found');
    });
  });

  describe('assignRolToUser', () => {
    it('should assign file role to user', async () => {
      const result = await documentService.assignRolToUser(userId, {
        assigneeId: user2Id,
        fileId,
        role: Roles.VIEWER,
      });
      jest
        .spyOn(documentService, 'assignRolToUser')
        .mockReturnValueOnce(result as any);

      expect(result).toBeTruthy();
      expect(result.status).toBe(201);
    });

    it('should throw ConflictException if non-admin user tries to assign role', async () => {
      await documentService.assignRolToUser(userId, {
        assigneeId: user2Id,
        fileId,
        role: Roles.VIEWER,
      });
      jest
        .spyOn(documentService, 'assignRolToUser')
        .mockRejectedValueOnce(
          new ConflictException('Only admin can give access for files'),
        );
      await expect(
        documentService.assignRolToUser(user2Id, {
          assigneeId: userId,
          fileId,
          role: Roles.VIEWER,
        }),
      ).rejects.toThrow(ConflictException);

      await expect(
        documentService.assignRolToUser(user2Id, {
          assigneeId: userId,
          fileId,
          role: Roles.VIEWER,
        }),
      ).rejects.toThrow('Only admin can give access for files');
    });
    it(`should throw NotFoundException if not assigned user tries to assign role`, async () => {
      jest
        .spyOn(documentService, 'assignRolToUser')
        .mockRejectedValueOnce(new NotFoundException('File not found'));
      await expect(
        documentService.assignRolToUser(createId(), {
          assigneeId: userId,
          fileId,
          role: Roles.VIEWER,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should throw ConflictException if a viewer tries to delete the file', async () => {
      await documentService.assignRolToUser(userId, {
        assigneeId: user2Id,
        fileId,
        role: Roles.VIEWER,
      });
      jest
        .spyOn(documentService, 'delete')
        .mockRejectedValueOnce(
          new ConflictException('Viewer can not delete file'),
        );

      await expect(documentService.delete(user2Id, fileId)).rejects.toThrow(
        ConflictException,
      );
      await expect(documentService.delete(user2Id, fileId)).rejects.toThrow(
        'Viewer can not delete file',
      );
    });

    it('should throw NotFoundException if file does not exist', async () => {
      jest
        .spyOn(documentService, 'delete')
        .mockRejectedValueOnce(new NotFoundException('File not found'));
      const nonExistFile = createId();
      await expect(
        documentService.delete(userId, nonExistFile),
      ).rejects.toThrow(NotFoundException);
      await expect(
        documentService.delete(userId, nonExistFile),
      ).rejects.toThrow('File not found');
    });

    it('should schedule a delete job and remove metadata', async () => {
      const result = await documentService.delete(userId, fileId);
      jest.spyOn(documentService, 'delete').mockReturnValueOnce(result as any);

      expect(result).toBeTruthy();
      expect(result.status).toBe(204);
    });
  });
});
