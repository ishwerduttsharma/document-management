export interface UploadJobData {
  fileId: string;
  fileData: string; // Base64-encoded file data
  fileName: string;
  bucket: string;
  mimeType: string;
  userId: string;
}

export interface DeleteJobData {
  fileId: string;
  fileName: string;
  bucket: string;
}

import { Job, PgBossService } from '@wavezync/nestjs-pgboss';
import { JobWithMetadata } from 'pg-boss';
import { promises as fs } from 'fs';
import * as path from 'path';
import { DocumentService } from './document.service';
import { QueueStatus } from 'src/lib/common';
import { Injectable } from '@nestjs/common';
import { IngestionService } from 'src/ingestion/ingestion.service';

@Injectable()
export class UploadWorker {
  type = 'uploadFile';

  constructor(
    private readonly documentService: DocumentService,
    private readonly pgBossService: PgBossService,
    private readonly ingestionService: IngestionService,
  ) {}

  @Job('uploadFile', { batchSize: 300, pollingIntervalSeconds: 1 }) // Increase concurrency
  async handleMyJob(jobs: JobWithMetadata<UploadJobData>[]) {
    if (!jobs?.length) {
      console.error('Received undefined or empty job batch');
      return;
    }
    const fileSuccessUpdates: string[] = [];
    const fileFailureUpdates: string[] = [];
    const ingestionType = 'ingestDoc';

    const isIngestionActive =
      await this.ingestionService.findStatusOfIngestionType(ingestionType);

    let ingestionRoutes: { ingestionRouteManageId: string; route: string }[] =
      [];
    if (isIngestionActive) {
      ingestionRoutes =
        await this.ingestionService.findAllIngestionRouteOfIngestionType(
          ingestionType,
        );
    }

    await Promise.allSettled(
      jobs.map(async (job) => {
        if (!job?.data) return;

        console.log(`Processing file: ${job.data.fileName}`);
        const { fileId, fileData, fileName, bucket } = job.data;

        try {
          // Ensure the directory exists
          await fs.mkdir(bucket, { recursive: true });

          const filePath = path.join(
            bucket,
            `${fileId}.${fileName.split('.').pop()}`,
          );
          const buffer = Buffer.from(fileData, 'base64'); // Convert once

          // Write file asynchronously
          await fs.writeFile(filePath, buffer);

          fileSuccessUpdates.push(fileId);
          console.log(`File ${fileName} uploaded successfully`);

          // Emit ingestion job
          await this.handleIngestion(ingestionRoutes, fileId, filePath);
        } catch (error) {
          console.error(`File ${fileName} upload failed:`, error.message);
          fileFailureUpdates.push(fileId);
        }
      }),
    );
    // Bulk update file statuses in DB
    if (fileSuccessUpdates.length > 0) {
      await this.documentService.bulkUpdateStatus(
        fileSuccessUpdates,
        QueueStatus.COMPLETED,
      );
    }
    if (fileFailureUpdates.length > 0) {
      await this.documentService.bulkUpdateStatus(
        fileFailureUpdates,
        QueueStatus.FAILED,
      );
    }
  }

  private async handleIngestion(
    ingestionRoutes: { ingestionRouteManageId: string; route: string }[],
    fileId: string,
    filePath: string,
  ) {
    await Promise.allSettled(
      ingestionRoutes.map(async (ingestionRoute) => {
        const ingestionId = await this.ingestionService.create(
          fileId,
          ingestionRoute.ingestionRouteManageId,
        );

        this.pgBossService.scheduleJob('ingestDoc', {
          fileId,
          filePath,
          ingestionId,
          route: ingestionRoute.route,
        });
      }),
    );
  }
}

@Injectable()
export class DeleteWorker {
  type = 'deleteFile';

  constructor() {}

  @Job('deleteFile', { batchSize: 300, pollingIntervalSeconds: 1 })
  async handleDeleteJob(jobs: JobWithMetadata<DeleteJobData>[]) {
    for (const job of jobs) {
      if (!job.data) {
        console.error('Received undefined job data');
        return;
      }

      const { fileId, fileName, bucket } = job.data;
      const filePath = path.join(
        bucket,
        `${fileId}.${fileName.split('.').pop()}`,
      );

      try {
        await fs.unlink(filePath);
        console.log(`File ${fileName} deleted successfully`);
      } catch (error) {
        console.error(`Failed to delete file: ${fileName}`, error);
      }
    }
  }
}
