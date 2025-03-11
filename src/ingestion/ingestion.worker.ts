export interface IngestJobData {
  fileId: string;
  filePath: string;
  ingestionId: string;
  route: string;
}

import { Job } from '@wavezync/nestjs-pgboss';
import { JobWithMetadata } from 'pg-boss';
import * as fs from 'fs/promises';
import * as path from 'path';
import { IngestionService } from './ingestion.service';
import { QueueStatus } from 'src/lib/common';
import { Injectable } from '@nestjs/common';
import { MockIngestionService } from './ingestion.service.mock';

@Injectable()
export class IngestionWorker {
  type = 'ingestDoc';

  constructor(
    private readonly ingestionService: IngestionService,
    private readonly mockservice: MockIngestionService,
  ) {}

  @Job('ingestDoc', { batchSize: 300, pollingIntervalSeconds: 1 })
  async handleMyJob(jobs: JobWithMetadata<IngestJobData>[]) {
    const ingestionSuccessUpdates: string[] = [];
    const ingestionFailureUpdates: string[] = [];
    for (const job of jobs) {
      if (!jobs || !job.data) {
        console.error('Received undefined job');
        return;
      }

      console.log(`Processing file: ${job.data.fileId}`);

      const { fileId, filePath, ingestionId, route } = job.data;

      try {
        const res = await this.mockservice.processDocument(
          filePath,
          fileId,
          route,
        );
        if (!res || res?.status !== 200) {
          ingestionFailureUpdates.push(ingestionId);
          throw new Error(`File id ${fileId} data ingestion failed`);
        }
        ingestionSuccessUpdates.push(ingestionId);

        console.log(`File id ${fileId} data ingested successfully`);
      } catch (error) {
        console.log(`File id ${fileId} data ingestion failed`);
        console.log(error.message);
        ingestionFailureUpdates.push(ingestionId);
      }
    }

    // Bulk update file statuses in DB
    if (ingestionSuccessUpdates.length > 0) {
      await this.ingestionService.bulkUpdateStatus(
        ingestionSuccessUpdates,
        QueueStatus.COMPLETED,
      );
    }
    if (ingestionFailureUpdates.length > 0) {
      await this.ingestionService.bulkUpdateStatus(
        ingestionFailureUpdates,
        QueueStatus.FAILED,
      );
    }
  }
}
