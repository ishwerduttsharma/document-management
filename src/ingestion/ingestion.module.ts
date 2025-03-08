import { Module } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { IngestionController } from './ingestion.controller';
import { IngestionWorker } from './ingestion.worker';
import { MockIngestionService } from './ingestion.service.mock';
@Module({
  controllers: [IngestionController],
  providers: [IngestionService, IngestionWorker, MockIngestionService],
})
export class IngestionModule {}
