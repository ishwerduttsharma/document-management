import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { Pagination } from 'src/lib/common';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    example: 'StrongPassword123',
    description: 'User password',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}

export class UserPaginationDto {
  @ApiPropertyOptional({
    example: 'john@example.com',
    description: 'Filter users by email',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;
}
