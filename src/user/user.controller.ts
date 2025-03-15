import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiOperation,
} from '@nestjs/swagger';

import { UserService } from './user.service';
import { User } from './user.decorator';
import { AuthProfile } from 'src/lib/common';
import { AllowUnauthorizedRequest } from 'src/allow-unauthorized-request/allow-unauthorized-request.decorator';
import { CreateUserDto, UserPaginationDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('user management')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @AllowUnauthorizedRequest()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User inserted successfully',
    schema: { example: { message: 'user inserted successfully', status: 201 } },
  })
  @ApiResponse({
    status: 409,
    description: 'User with email already exists',
    schema: {
      example: { statusCode: 409, message: 'User with email already exists' },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error inserting user',
    schema: {
      example: {
        statusCode: 500,
        message: 'Error inserting user',
        error: 'Database error message',
      },
    },
  })
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.userService.create(createUserDto);
  }

  @Post('/platform/admin')
  @AllowUnauthorizedRequest()
  @ApiOperation({ summary: 'Create a new platform admin' })
  @ApiResponse({
    status: 201,
    description: 'Admin inserted successfully',
    schema: {
      example: { message: 'Admin inserted successfully', status: 201 },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Admin already exists',
    schema: { example: { statusCode: 409, message: 'Admin already exists' } },
  })
  @ApiResponse({
    status: 409,
    description: 'User with email already exists',
    schema: {
      example: { statusCode: 409, message: 'User with email already exists' },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error inserting admin',
    schema: {
      example: {
        statusCode: 500,
        message: 'Error inserting admin',
        error: 'Database error message',
      },
    },
  })
  async createPlatformAdmin(@Body() createUserDto: CreateUserDto) {
    return await this.userService.createPlatformAdmin(createUserDto);
  }

  @Get('profile')
  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: 'Find a user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User details fetched successfully',
    schema: {
      example: {
        message: 'User details fetched successfully',
        data: {
          id: '123',
          name: 'John Doe',
          email: 'john@example.com',
          password:
            '$2b$10$7gedKyOocUULN6Tp6rZ0g.lh44UwhmfrAh620OVY/UaS6AkqvE9vK',
          platformRole: 'ADMIN',
          createdDate: '2025-03-08 00:00:00',
          updatedDate: '2025-03-08 09:03:01.705257',
        },
        status: 200,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: { example: { statusCode: 404, message: 'User not found' } },
  })
  @ApiResponse({
    status: 500,
    description: 'Error retrieving user',
    schema: {
      example: {
        statusCode: 500,
        message: 'Error retrieving user',
        error: 'Database error message',
      },
    },
  })
  async findUser(@User() user: AuthProfile) {
    const { userId } = user;
    return await this.userService.findUser(userId);
  }

  @Patch('update')
  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: 'Update user details' })
  @ApiResponse({
    status: 203,
    description: 'User details updated successfully',
    schema: {
      example: {
        message: 'User details updated successfully',
        data: [],
        status: 203,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: { example: { statusCode: 404, message: 'User not found' } },
  })
  @ApiResponse({
    status: 500,
    description: 'Error updating user',
    schema: {
      example: {
        statusCode: 500,
        message: 'Error updating user',
        error: 'Database error message',
      },
    },
  })
  async update(
    @Body() updateUserDto: UpdateUserDto,
    @User() user: AuthProfile,
  ) {
    const { userId } = user;

    return await this.userService.update(userId, updateUserDto);
  }

  @Get('all')
  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: 'Find users by email' })
  @ApiResponse({
    status: 200,
    description: 'Users found successfully',
    schema: {
      example: {
        usersList: [
          { id: '123', email: 'user@example.com', name: 'John Doe' },
          { id: '456', email: 'another@example.com', name: 'Jane Doe' },
        ],
        status: 200,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'No users found with this email',
    schema: {
      example: { statusCode: 404, message: 'No users found with this email' },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error retrieving users',
    schema: {
      example: {
        statusCode: 500,
        message: 'Error retrieving users',
        error: 'Database error message',
      },
    },
  })
  async findAllUsersByEmail(
    @User() user: AuthProfile,
    @Query() payload: UserPaginationDto,
  ) {
    const { userId } = user;

    return await this.userService.findAllUsersByEmail(userId, payload);
  }
}
