import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { createId } from '@paralleldrive/cuid2';
import { documents, userDocRoles } from 'src/database/schema';
import { and, desc, eq, ilike, inArray, sql, count } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from 'src/database/schema';
import { QueueStatus, Roles } from 'src/lib/common';
import { PgBossService } from '@wavezync/nestjs-pgboss';
import { AssignRoleDto, DocQueryDto } from './dto/assign-document.dto';

@Injectable()
export class DocumentService {
  constructor(
    @Inject('drizzleProvider')
    private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly pgBossService: PgBossService,
  ) {}

  async create(userId: string, file: Express.Multer.File) {
    console.log('Received file');
    if (!file) {
      throw new NotFoundException('File is undefined');
    }
    // const { file } = createDocumentDto;
    const { bucket } = this.getBucket({ userId });
    // Generate metadata
    const fileId = createId();
    const extension = file.originalname.split('.').pop();

    try {
      //emit upload file job
      await this.pgBossService.scheduleJob('uploadFile', {
        fileId,
        fileData: file.buffer.toString('base64'),
        fileName: file.originalname,
        bucket,
        mimeType: file.mimetype,
        userId,
      });

      // Insert metadata into Drizzle
      await this.db.transaction(async (tx) => {
        await tx.insert(documents).values({
          id: fileId,
          title: file.originalname,
          extension,
          bucket,
          mimeType: file.mimetype,
          createdBy: userId,
          status: QueueStatus.PROCESSING,
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

      return {
        fileId,
        name: file.originalname,
        mimeType: file.mimetype,
        message: 'File Upload Scheduled',
        status: 201,
      };
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error inserting docs',
        error: error.message,
      });
    }
  }

  async findAll(userId: string, payload: DocQueryDto) {
    let data;
    let records;
    try {
      let limit = Number(payload?.limit) || 20;
      if (limit > 20) limit = 20;

      const skip = Number(payload?.pageNumber)
        ? (Number(payload.pageNumber) - 1) * limit
        : 0;
      [data, [records]] = await Promise.all([
        await this.db
          .select({
            documentId: documents.id,
            title: documents.title,
            role: userDocRoles.role,
            extension: documents.extension,
            filePath: sql`CONCAT(${documents.bucket},'\\',${documents.id},'.',${documents.extension})`,
            createDate: documents.createdDate,
          })
          .from(userDocRoles)
          .innerJoin(documents, eq(documents.id, userDocRoles.docId))
          .where(
            and(
              eq(userDocRoles.userId, userId),
              eq(documents.status, QueueStatus.COMPLETED),
              payload?.title
                ? ilike(documents.title, `%${payload?.title}%`)
                : undefined,
            ),
          )
          .orderBy(desc(documents.createdDate))
          .offset(skip)
          .limit(limit),

        await this.db
          .select({
            total: count(),
          })
          .from(userDocRoles)
          .innerJoin(documents, eq(documents.id, userDocRoles.docId))
          .where(
            and(
              eq(userDocRoles.userId, userId),
              eq(documents.status, QueueStatus.COMPLETED),
              payload?.title
                ? ilike(documents.title, `%${payload?.title}%`)
                : undefined,
            ),
          ),
      ]);

      //use below function to access correct file path
      // const normalizedPath = path.normalize(val.filePath as string);
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error fetching docs',
        error: error.message,
      });
    }
    if (!Array.isArray(data) || data.length === 0) {
      throw new NotFoundException('No Data found');
    }
    return { data: data, count: +records.total, status: 200 };
  }

  async assignRolToUser(userId: string, payload: AssignRoleDto) {
    const { assigneeId, fileId, role } = payload;
    const [file] = await this.db
      .select({
        role: userDocRoles.role,
        title: documents.title,
        bucket: documents.bucket,
      })
      .from(documents)
      .innerJoin(userDocRoles, eq(userDocRoles.docId, documents.id))
      .where(and(eq(documents.id, fileId), eq(userDocRoles.userId, userId)));

    if (!file) {
      throw new NotFoundException('File not found');
    }

    //authorization
    if (file.role !== Roles.ADMIN) {
      throw new ConflictException('Only admin can give access for files');
    }
    try {
      await this.db.transaction(async (tx) => {
        await tx
          .delete(userDocRoles)
          .where(
            and(
              eq(userDocRoles.userId, assigneeId),
              eq(userDocRoles.docId, fileId),
            ),
          );
        await tx.insert(userDocRoles).values({
          id: createId(),
          docId: fileId,
          userId: assigneeId,
          role: role,
          createdBy: userId,
          createdDate: new Date().toDateString(),
        });
      });

      return { data: [], message: 'role assigned successfully', status: 201 };
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error fetching docs',
        error: error.message,
      });
    }
  }

  async delete(userId: string, fileId: string) {
    // Fetch document details from the database
    const [file] = await this.db
      .select({
        role: userDocRoles.role,
        title: documents.title,
        bucket: documents.bucket,
      })
      .from(documents)
      .innerJoin(userDocRoles, eq(userDocRoles.userId, userId))
      .where(eq(documents.id, fileId));

    if (!file) {
      throw new NotFoundException('File not found');
    }

    //authorization
    if (file.role === Roles.VIEWER) {
      throw new ConflictException('Viewer can not delete file');
    }
    try {
      // Schedule the delete job
      await this.pgBossService.scheduleJob('deleteFile', {
        fileId,
        fileName: file.title,
        bucket: file.bucket,
      });

      // Delete metadata from Drizzle
      await this.db.transaction(async (tx) => {
        await tx.delete(userDocRoles).where(eq(userDocRoles.docId, fileId));
        await tx.delete(documents).where(eq(documents.id, fileId));
      });

      return { message: 'File deletion scheduled', status: 204 };
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error deleting file',
        error: error.message,
      });
    }
  }
  async updateStatus(fileId: string, status: QueueStatus) {
    return await this.db
      .update(documents)
      .set({ status: status, updatedDate: new Date().toDateString() })
      .where(eq(documents.id, fileId));
  }

  async bulkUpdateStatus(fileIds: string[], status: QueueStatus) {
    return await this.db
      .update(documents)
      .set({ status: status, updatedDate: new Date().toDateString() })
      .where(inArray(documents.id, fileIds));
  }

  createBucket({ userId }: { userId: string }) {
    const baseDirecory = process.env.BASE_UPLOAD_PATH || './uploads';
    if (!existsSync(baseDirecory)) {
      mkdirSync(baseDirecory);
    }

    // Get the current year as a string
    const currentYear = new Date().getFullYear().toString();
    const bucketUploadPath = path.join(baseDirecory, userId, currentYear);
    if (!existsSync(bucketUploadPath)) {
      mkdirSync(bucketUploadPath);
    }

    return { bucket: bucketUploadPath };
  }
  getBucket({ userId }: { userId: string }) {
    const baseDirecory = process.env.BASE_UPLOAD_PATH || './uploads';
    // Get the current year as a string
    const currentYear = new Date().getFullYear().toString();
    const bucketUploadPath = path.join(baseDirecory, userId, currentYear);
    console.log(bucketUploadPath);
    return { bucket: bucketUploadPath };
  }
}
