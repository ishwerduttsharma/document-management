import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Pagination, QueueStatus } from 'src/lib/common';

export class CreateIngestionDto {}

export class FindIngestionDto extends Pagination {
  @ApiPropertyOptional({
    example: QueueStatus.PROCESSING,
    enum: QueueStatus,
    description: 'Filter by queue status',
  })
  @IsOptional()
  @IsEnum(QueueStatus)
  status?: QueueStatus;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Filter by ingestion type ID',
  })
  @IsOptional()
  @IsUUID()
  ingestionTypeId?: string;

  @ApiPropertyOptional({
    example: '660e9400-a29c-41d4-b726-556655440abc',
    description: 'Filter by content ID',
  })
  @IsOptional()
  @IsUUID()
  contentId?: string;

  @ApiPropertyOptional({
    example: '2024-03-08T12:00:00Z',
    description: 'Filter by created date (ISO 8601 format)',
  })
  @IsOptional()
  @IsString()
  createdDate?: string;

  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'Filter by client email',
  })
  @IsOptional()
  @IsEmail()
  clientEmail?: string;
}

export class CreateIngestionManageDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Ingestion type ID',
  })
  @IsUUID()
  ingestionTypeId: string;

  @ApiProperty({
    example: '/process-ingestion',
    description: 'Ingestion route',
  })
  @IsString()
  route: string;

  @ApiProperty({ example: 'client@example.com', description: 'Client email' })
  @IsEmail()
  clientEmail: string;
}

export class FindIngestionRouteDto extends Pagination {
  @ApiPropertyOptional({ example: true, description: 'Filter by route status' })
  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({
    example: '/ingest-data',
    description: 'Filter by ingestion route',
  })
  @IsOptional()
  @IsString()
  route?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Filter by ingestion type ID',
  })
  @IsOptional()
  @IsUUID()
  ingestionTypeId?: string;

  @ApiPropertyOptional({
    example: '2024-03-08T12:00:00Z',
    description: 'Filter by created date (ISO 8601 format)',
  })
  @IsOptional()
  @IsString()
  createdDate?: string;

  @ApiPropertyOptional({
    example: 'client@example.com',
    description: 'Filter by client email',
  })
  @IsOptional()
  @IsEmail()
  clientEmail?: string;
}

export class CreateIngestionTypeDto {
  @ApiProperty({
    example: 'ingestDoc',
    description: 'Name of the ingestion type',
  })
  @IsString()
  ingestionType: string;
}
