import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Pagination, Roles } from 'src/lib/common';

export class AssignRoleDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the assignee',
  })
  @IsUUID()
  assigneeId: string;

  @ApiProperty({
    example: Roles.ADMIN,
    enum: Roles,
    description: 'Role to be assigned',
  })
  @IsEnum(Roles)
  role: Roles;

  @ApiProperty({
    example: '660e9400-a29c-41d4-b726-556655440abc',
    description: 'ID of the file',
  })
  @IsUUID()
  fileId: string;
}

export class DocQueryDto extends Pagination {
  @ApiPropertyOptional({
    example: 'Docs Report',
    description: 'Filter documents by title',
  })
  @IsOptional()
  @IsString()
  title?: string;
}

export class FileUploadDto {
  @ApiProperty({
    description: 'The File to be uploaded',
    type: 'string',
    format: 'binary',
  })
  file?: any;
}
