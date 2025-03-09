export interface IngestJobData {
  fileId: string;
  filePath: string;
  ingestionId: string;
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

  @Job('ingestDoc')
  async handleMyJob(jobs: JobWithMetadata<IngestJobData>[]) {
    for (const job of jobs) {
      if (!jobs || !job.data) {
        console.error('Received undefined job');
        return;
      }

      console.log(`Processing file: ${job.data.fileId}`);

      const { fileId, filePath, ingestionId } = job.data;

      try {
        const res = await this.mockservice.processDocument(filePath, fileId);
        if (!res || res?.status !== 200) {
          await this.ingestionService.update(ingestionId, QueueStatus.FAILED);
          throw new Error(`File id ${fileId} data ingestion failed`);
        }
        await this.ingestionService.update(ingestionId, QueueStatus.COMPLETED);

        console.log(`File id ${fileId} data ingested successfully`);
      } catch (error) {
        console.log(`File id ${fileId} data ingestion failed`);
        console.log(error.message);
        await this.ingestionService.update(ingestionId, QueueStatus.FAILED);
      }
    }
  }
}
