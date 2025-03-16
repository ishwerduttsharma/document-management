import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function CreateUserApiMultiResponse() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new user' }),
    ApiResponse({
      status: 201,
      description: 'User inserted successfully',
      schema: {
        example: { message: 'user inserted successfully', status: 201 },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'User with email already exists',
      schema: {
        example: { statusCode: 409, message: 'User with email already exists' },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Error inserting user',
      schema: {
        example: {
          statusCode: 500,
          message: 'Error inserting user',
          error: 'Database error message',
        },
      },
    }),
  );
}

export function CreatePlatformAdminApiMultiResponse() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new platform admin' }),
    ApiResponse({
      status: 201,
      description: 'Admin inserted successfully',
      schema: {
        example: { message: 'Admin inserted successfully', status: 201 },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'Admin already exists',
      schema: { example: { statusCode: 409, message: 'Admin already exists' } },
    }),
    ApiResponse({
      status: 409,
      description: 'User with email already exists',
      schema: {
        example: { statusCode: 409, message: 'User with email already exists' },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Error inserting admin',
      schema: {
        example: {
          statusCode: 500,
          message: 'Error inserting admin',
          error: 'Database error message',
        },
      },
    }),
  );
}

export function ProfileApiMultiResponse() {
  return applyDecorators(
    ApiOperation({ summary: 'Find a user by ID' }),
    ApiResponse({
      status: 200,
      description: 'User details fetched successfully',
      schema: {
        example: {
          message: 'User details fetched successfully',
          data: {
            id: '123',
            name: 'John Doe',
            email: 'john@example.com',
            platformRole: 'ADMIN',
            createdDate: '2025-03-08 00:00:00',
            updatedDate: '2025-03-08 09:03:01.705257',
          },
          status: 200,
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'User not found',
      schema: { example: { statusCode: 404, message: 'User not found' } },
    }),
    ApiResponse({
      status: 500,
      description: 'Error retrieving user',
      schema: {
        example: {
          statusCode: 500,
          message: 'Error retrieving user',
          error: 'Database error message',
        },
      },
    }),
  );
}

export function UpdateApiMultiResponse() {
  return applyDecorators(
    ApiOperation({ summary: 'Update user details' }),
    ApiResponse({
      status: 203,
      description: 'User details updated successfully',
      schema: {
        example: {
          message: 'User details updated successfully',
          data: [],
          status: 203,
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'User not found',
      schema: { example: { statusCode: 404, message: 'User not found' } },
    }),
    ApiResponse({
      status: 500,
      description: 'Error updating user',
      schema: {
        example: {
          statusCode: 500,
          message: 'Error updating user',
          error: 'Database error message',
        },
      },
    }),
  );
}

export function FetchByEmailApiMultiResponse() {
  return applyDecorators(
    ApiOperation({ summary: 'Find users by email' }),
    ApiResponse({
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
    }),
    ApiResponse({
      status: 404,
      description: 'No users found with this email',
      schema: {
        example: { statusCode: 404, message: 'No users found with this email' },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Error retrieving users',
      schema: {
        example: {
          statusCode: 500,
          message: 'Error retrieving users',
          error: 'Database error message',
        },
      },
    }),
  );
}
