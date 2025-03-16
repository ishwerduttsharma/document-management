import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export function LoginApiMultiResponse() {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: 'User successfully logged in',
      schema: {
        example: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR...',
          userId: '123456789',
          email: 'user@example.com',
          name: 'John Doe',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Wrong credentials. Please try again',
      schema: {
        example: {
          statusCode: 400,
          message: 'Wrong credentials. Please try again',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'User not exists with this email',
      schema: {
        example: {
          statusCode: 404,
          message: 'User not exists with this email',
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Error retrieving user',
      schema: {
        example: {
          message: 'Error retrieving user',
          error: 'Detailed database error message',
          statusCode: 500,
        },
      },
    }),
  );
}

export function LogoutApiMultiResponse() {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: 'User logged out successfully',
      schema: {
        example: {
          message: 'Logged out successfully',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Invalid token',
      schema: {
        example: {
          statusCode: 401,
          message: 'Invalid token',
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      schema: {
        example: {
          message: 'An unexpected error occurred',
          statusCode: 500,
        },
      },
    }),
  );
}
