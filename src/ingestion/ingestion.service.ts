import {
  ConflictException,
  InternalServerErrorException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from 'src/database/schema';
import * as bcrypt from 'bcryptjs';
import {
  eq,
  ilike,
  ne,
  and,
  gt,
  lt,
  sql,
  SQL,
  count,
  desc,
  between,
  inArray,
} from 'drizzle-orm';
import {
  users,
  documents,
  ingestionTracker,
  ingestionRouteManage,
  ingestionTypeManage,
} from '../database/schema';
import {
  FindIngestionDto,
  CreateIngestionManageDto,
  FindIngestionRouteDto,
  CreateIngestionTypeDto,
} from './dto/create-ingestion.dto';
import { getStartAndEndOfDay, QueueStatus } from 'src/lib/common';
import { createId } from '@paralleldrive/cuid2';

@Injectable()
export class IngestionService {
  constructor(
    @Inject('drizzleProvider')
    private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  //ingestion
  //internal
  async create(fileId: string, ingestionRouteManageId: string) {
    const ingestionId = createId();
    await this.db.insert(ingestionTracker).values({
      id: ingestionId,
      contentId: fileId,
      ingestionRouteManageId: ingestionRouteManageId,
      status: QueueStatus.PROCESSING,
      createdDate: new Date().toDateString(),
    });
    return ingestionId;
  }

  async findAll(payload: FindIngestionDto) {
    let data;
    let records;
    try {
      let limit = payload?.limit ? payload?.limit : 20;
      if (limit > 100) limit = 100;
      const skip = payload?.pageNumber ? (payload?.pageNumber - 1) * limit : 0;
      const conditions: SQL[] = [];
      if (payload?.status)
        conditions.push(eq(ingestionTracker.status, payload.status));
      if (payload?.contentId)
        conditions.push(eq(ingestionTracker.contentId, payload.contentId));
      if (payload?.ingestionTypeId)
        conditions.push(
          eq(ingestionRouteManage.ingestionTypeId, payload.ingestionTypeId),
        );
      if (payload?.clientEmail)
        conditions.push(
          eq(ingestionRouteManage.clientEmail, payload.clientEmail),
        );
      if (payload?.createdDate) {
        const { startOfDay, endOfDay } = getStartAndEndOfDay(
          payload?.createdDate,
        );
        conditions.push(
          between(
            ingestionTracker.createdDate,
            startOfDay.toISOString(),
            endOfDay.toISOString(),
          ),
        );
      }
      [data, [records]] = await Promise.all([
        await this.db
          .select({
            ingestionId: ingestionTracker.id,
            contentId: ingestionTracker.contentId,
            ingestionStartedAt: ingestionTracker.createdDate,
            ingestionStatus: ingestionTracker.status,
            route: ingestionRouteManage.route,
            clientEmail: ingestionRouteManage.clientEmail,
            ingestionTypeManage: ingestionTypeManage.ingestionType,
          })
          .from(ingestionTracker)
          .innerJoin(
            ingestionRouteManage,
            eq(
              ingestionRouteManage.id,
              ingestionTracker.ingestionRouteManageId,
            ),
          )
          .innerJoin(
            ingestionTypeManage,
            eq(ingestionTypeManage.id, ingestionRouteManage.ingestionTypeId),
          )
          .where(conditions.length ? and(...conditions) : undefined)
          .orderBy(desc(ingestionTracker.createdDate))
          .offset(skip)
          .limit(limit),

        await this.db
          .select({
            total: count(),
          })
          .from(ingestionTracker)
          .innerJoin(
            ingestionRouteManage,
            eq(
              ingestionRouteManage.id,
              ingestionTracker.ingestionRouteManageId,
            ),
          )
          .innerJoin(
            ingestionTypeManage,
            eq(ingestionTypeManage.id, ingestionRouteManage.ingestionTypeId),
          )
          .where(conditions.length ? and(...conditions) : undefined),
      ]);
    } catch (dbError) {
      throw new InternalServerErrorException({
        message: 'Database query failed in fetching ingestion',
        error: dbError,
      });
    }

    if (!Array.isArray(data) || data.length === 0) {
      throw new NotFoundException('No Data found');
    }

    return { data, count: +records.total, status: 200 };
  }

  async findOne(id: string) {
    let data;
    try {
      [data] = await this.db
        .select()
        .from(ingestionTracker)
        .where(eq(ingestionTracker.id, id));
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error fetching ingestion',
        error: error.message,
      });
    }
    if (!data) {
      throw new NotFoundException('id not found');
    }
    return { data, status: 200 };
  }

  //internal
  async update(id: string, status: QueueStatus) {
    await this.db
      .update(ingestionTracker)
      .set({ status: status, updatedDate: new Date().toDateString() })
      .where(eq(ingestionTracker.id, id));
  }

  //internal
  async bulkUpdateStatus(ids: string[], status: QueueStatus) {
    return await this.db
      .update(ingestionTracker)
      .set({ status: status, updatedDate: new Date().toDateString() })
      .where(inArray(ingestionTracker.id, ids));
  }

  //ingestion type management
  async createIngestionType(userId: string, payload: CreateIngestionTypeDto) {
    const checkDuplicate = await this.db
      .select()
      .from(ingestionTypeManage)
      .where(eq(ingestionTypeManage.ingestionType, payload.ingestionType));
    if (checkDuplicate && checkDuplicate.length > 0) {
      throw new ConflictException(
        `This ingestion type: ${payload.ingestionType} already exists`,
      );
    }
    try {
      await this.db.insert(ingestionTypeManage).values({
        id: createId(),
        ingestionType: payload.ingestionType,
        status: true,
        createdBy: userId,
        createdDate: new Date().toDateString(),
      });
      return { message: 'new ingestion type added successfully', status: 201 };
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error inserting ingestion type',
        error: error.message,
      });
    }
  }

  async changeIngestionTypeManageStatus(
    userId: string,
    id: string,
    status: boolean,
  ) {
    try {
      await this.db
        .update(ingestionTypeManage)
        .set({
          status: status,
          updatedBy: userId,
          updatedDate: new Date().toDateString(),
        })
        .where(eq(ingestionTypeManage.id, id));
      return {
        message: 'new ingestion type status changed successfully',
        status: 201,
      };
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error changing ingestion type status',
        error: error.message,
      });
    }
  }

  async findAllIngestionType() {
    let data;
    try {
      data = await this.db.select().from(ingestionTypeManage);
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error fetching ingestions type',
        error: error.message,
      });
    }
    if (!data) {
      throw new NotFoundException('No Data found');
    }
    return { data, status: 200 };
  }

  //internal
  async findStatusOfIngestionType(ingestionType: string) {
    try {
      const [data] = await this.db
        .select()
        .from(ingestionTypeManage)
        .where(
          and(
            eq(ingestionTypeManage.ingestionType, ingestionType),
            eq(ingestionTypeManage.status, true),
          ),
        );

      return data ? true : false;
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error fetching ingestions type for status',
        error: error.message,
      });
    }
  }

  //ingestion route management
  async createNewRouteForIngestion(
    userId: string,
    payload: CreateIngestionManageDto,
  ) {
    const checkDuplicate = await this.db
      .select()
      .from(ingestionRouteManage)
      .where(
        and(
          eq(ingestionRouteManage.ingestionTypeId, payload.ingestionTypeId),
          eq(ingestionRouteManage.route, payload.route),
        ),
      );
    if (checkDuplicate && checkDuplicate.length > 0) {
      throw new ConflictException(
        `This ingestion route: ${payload.route} for this ingestion type already exists`,
      );
    }
    try {
      await this.db.insert(ingestionRouteManage).values({
        id: createId(),
        ingestionTypeId: payload.ingestionTypeId,
        route: payload.route,
        clientEmail: payload.clientEmail,
        status: true,
        createdBy: userId,
        createdDate: new Date().toDateString(),
      });
      return { message: 'new ingestion route added successfully', status: 201 };
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error inserting ingestion route',
        error: error.message,
      });
    }
  }

  async changeIngestionManageRouteStatus(
    userId: string,
    id: string,
    status: boolean,
  ) {
    try {
      await this.db
        .update(ingestionRouteManage)
        .set({
          status: status,
          updatedBy: userId,
          updatedDate: new Date().toDateString(),
        })
        .where(eq(ingestionRouteManage.id, id));
      return {
        message: 'new ingestion route status changed successfully',
        status: 201,
      };
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error changing ingestion route status',
        error: error.message,
      });
    }
  }

  async findAllIngestionRoute(payload: FindIngestionRouteDto) {
    let data;
    let records;
    try {
      let limit = payload?.limit ? payload?.limit : 20;
      if (limit > 100) limit = 100;
      const skip = payload?.pageNumber ? (payload?.pageNumber - 1) * limit : 0;
      const conditions: SQL[] = [];
      if (payload?.status || payload?.status === false)
        conditions.push(eq(ingestionRouteManage.status, payload.status));
      if (payload?.route)
        conditions.push(eq(ingestionRouteManage.route, payload.route));
      if (payload?.ingestionTypeId)
        conditions.push(
          eq(ingestionRouteManage.ingestionTypeId, payload.ingestionTypeId),
        );
      if (payload?.createdDate) {
        const { startOfDay, endOfDay } = getStartAndEndOfDay(
          payload?.createdDate,
        );
        conditions.push(
          between(
            ingestionRouteManage.createdDate,
            startOfDay.toISOString(),
            endOfDay.toISOString(),
          ),
        );
      }
      [data, [records]] = await Promise.all([
        await this.db
          .select({
            id: ingestionRouteManage.id,
            clientEmail: ingestionRouteManage.clientEmail,
            route: ingestionRouteManage.route,
            status: ingestionRouteManage.status,
            createdDate: ingestionRouteManage.createdDate,
            updatedDate: ingestionRouteManage.updatedDate,
            ingestionType: ingestionTypeManage.ingestionType,
          })
          .from(ingestionRouteManage)
          .innerJoin(
            ingestionTypeManage,
            eq(ingestionTypeManage.id, ingestionRouteManage.ingestionTypeId),
          )
          .where(conditions.length ? and(...conditions) : undefined)
          .orderBy(desc(ingestionTypeManage.createdDate))
          .offset(skip)
          .limit(limit),

        await this.db
          .select({
            total: count(),
          })
          .from(ingestionRouteManage)
          .innerJoin(
            ingestionTypeManage,
            eq(ingestionTypeManage.id, ingestionRouteManage.ingestionTypeId),
          )
          .where(conditions.length ? and(...conditions) : undefined),
      ]);
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error fetching ingestions routes',
        error: error.message,
      });
    }
    if (!Array.isArray(data) || data.length === 0) {
      throw new NotFoundException('No Data found');
    }
    return { data, count: +records.total, status: 200 };
  }
  //internal
  async findAllIngestionRouteOfIngestionType(ingestionType: string) {
    try {
      const data = await this.db
        .select({
          ingestionRouteManageId: ingestionRouteManage.id,
          route: ingestionRouteManage.route,
        })
        .from(ingestionRouteManage)
        .innerJoin(
          ingestionTypeManage,
          eq(ingestionTypeManage.id, ingestionRouteManage.ingestionTypeId),
        )
        .where(
          and(
            eq(ingestionTypeManage.ingestionType, ingestionType),
            eq(ingestionRouteManage.status, true),
          ),
        );

      return data;
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error fetching ingestions routes',
        error: error.message,
      });
    }
  }
}
