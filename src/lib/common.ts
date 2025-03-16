import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min, IsOptional } from 'class-validator';

import { Type } from 'class-transformer';

export class Pagination {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number for pagination',
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number) // ✅ Convert string to number
  @IsInt({ message: 'Page number must be an integer' })
  @Min(1, { message: 'Page number must be at least 1' })
  pageNumber?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of items per page',
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number) // ✅ Convert string to number
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  limit?: number;
}

export type AuthProfile = {
  name: string;
  email: string;
  userId: string;
};

export enum Roles {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export enum platformRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum QueueStatus {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export const getStartAndEndOfDay = (
  dateString: string,
): {
  startOfDay: Date;
  endOfDay: Date;
} => {
  const date = new Date(dateString);

  // Start of the day (00:00:00.001)
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 1);

  // End of the day (23:59:59.999)
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
};
