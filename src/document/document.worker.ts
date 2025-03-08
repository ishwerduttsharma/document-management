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
import * as fs from 'fs/promises';
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

  @Job('uploadFile')
  async handleMyJob(jobs: JobWithMetadata<UploadJobData>[]) {
    for (const job of jobs) {
      if (!jobs || !job.data) {
        console.error('Received undefined job');
        return;
      }

      console.log(`Processing file: ${job.data.fileName}`);

      const { fileId, fileData, fileName, bucket } = job.data;

      try {
        await fs.mkdir(bucket, { recursive: true });
        const filePath = path.join(
          bucket,
          `${fileId}.${fileName.split('.').pop()}`,
        );
        await fs.writeFile(filePath, Buffer.from(String(fileData), 'base64'));

        await this.documentService.updateStatus(fileId, QueueStatus.COMPLETED);
        console.log(`File ${fileName} uploaded successfully`);

        //emit ingest job

        const ingestionType = 'ingestDoc';
        const isIngestionActive =
          await this.ingestionService.findStatusOfIngestionType(ingestionType);
        if (isIngestionActive) {
          const ingestionRoutes =
            await this.ingestionService.findAllIngestionRouteOfIngestionType(
              ingestionType,
            );
          for (const ingestionRoute of ingestionRoutes) {
            const ingestionId = await this.ingestionService.create(
              fileId,
              ingestionRoute.ingestionRouteManageId,
            );

            await this.pgBossService.scheduleJob('ingestDoc', {
              fileId,
              filePath,
              ingestionId,
            });
          }
        }
      } catch (error) {
        console.log(`File ${fileName} upload failed`);
        console.log(error.message);
        await this.documentService.updateStatus(fileId, QueueStatus.FAILED);
      }
    }
  }
}

@Injectable()
export class DeleteWorker {
  type = 'deleteFile';

  constructor() {}

  @Job('deleteFile')
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
