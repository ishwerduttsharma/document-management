import { Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { DeleteWorker, UploadWorker } from 'src/document/document.worker';
import { IngestionModule } from 'src/ingestion/ingestion.module';
import { IngestionService } from 'src/ingestion/ingestion.service';

@Module({
  imports: [IngestionModule], // ✅ Prevent circular dependency
  controllers: [DocumentController],
  providers: [DocumentService, IngestionService, UploadWorker, DeleteWorker],
  exports: [], // ✅ Export it as a string token
})
export class DocumentModule {}
