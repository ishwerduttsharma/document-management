import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function CreateApiMultiResponse() {
  return applyDecorators(
    ApiOperation({ summary: 'Upload a file' }),
    ApiResponse({
      status: 201,
      description: 'File upload scheduled successfully',
      schema: {
        example: {
          fileId: 'abc123',
          name: 'document.pdf',
          mimeType: 'application/pdf',
          message: 'File Upload Scheduled',
          status: 201,
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'File is undefined',
      schema: { example: { statusCode: 404, message: 'File is undefined' } },
    }),
    ApiResponse({
      status: 500,
      description: 'Error inserting docs',
      schema: {
        example: {
          statusCode: 500,
          message: 'Error inserting docs',
          error: 'Database error message',
        },
      },
    }),
  );
}

export function GetApiMultiResponse() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all documents accessible by the user' }),
    ApiResponse({
      status: 200,
      description: 'Documents retrieved successfully',
      schema: {
        example: {
          data: [
            {
              documentId: '123abc',
              title: 'Project Plan',
              role: 'admin',
              extension: 'pdf',
              filePath: 'documents/project-plan.pdf',
              createDate: '2025-03-15',
            },
          ],
          count: 1000,
          status: 200,
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'No Data found',
      schema: { example: { statusCode: 404, message: 'No Data found' } },
    }),
    ApiResponse({
      status: 500,
      description: 'Error fetching docs',
      schema: {
        example: {
          statusCode: 500,
          message: 'Error fetching docs',
          error: 'Database error message',
        },
      },
    }),
  );
}

export function AssignApiMultiResponse() {
  return applyDecorators(
    ApiOperation({ summary: 'Assign a role to a user for a document' }),
    ApiResponse({
      status: 201,
      description: 'Role assigned successfully',
      schema: {
        example: {
          data: [],
          message: 'role assigned successfully',
          status: 201,
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'File not found',
      schema: { example: { statusCode: 404, message: 'File not found' } },
    }),
    ApiResponse({
      status: 409,
      description: 'Only admin can give access for files',
      schema: {
        example: {
          statusCode: 409,
          message: 'Only admin can give access for files',
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Error fetching docs',
      schema: {
        example: {
          statusCode: 500,
          message: 'Error fetching docs',
          error: 'Database error message',
        },
      },
    }),
  );
}

export function DeleteApiMultiResponse() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a document' }),
    ApiResponse({
      status: 204,
      description: 'File deletion scheduled',
      schema: {
        example: {
          message: 'File deletion scheduled',
          status: 204,
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'File not found',
      schema: {
        example: { statusCode: 404, message: 'File not found' },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'Viewer cannot delete file',
      schema: {
        example: {
          statusCode: 409,
          message: 'Viewer can not delete file',
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Error deleting file',
      schema: {
        example: {
          statusCode: 500,
          message: 'Error deleting file',
          error: 'Database error message',
        },
      },
    }),
  );
}

export function RolesApiMultiResponse() {
  return applyDecorators(
    ApiOperation({ summary: 'Get available user document roles' }),
    ApiResponse({
      status: 200,
      description: 'List of available document roles',
      schema: {
        example: {
          data: {
            ADMIN: 'ADMIN',
            EDITOR: 'EDITOR',
            VIEWER: 'VIEWER',
          },
          status: 200,
        },
      },
    }),
  );
}
