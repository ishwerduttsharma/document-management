import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function GetApiMultiResponse() {
  return applyDecorators(
    ApiOperation({ summary: 'Fetch ingestion records with filters' }),
    ApiResponse({
      status: 200,
      description: 'Successfully fetched ingestion records',
      schema: {
        example: {
          data: [
            {
              ingestionId: '12345',
              contentId: 'abc123',
              ingestionStartedAt: '2024-03-15T12:00:00Z',
              ingestionStatus: 'COMPLETED',
              route: '/path/to/file',
              clientEmail: 'client@example.com',
              ingestionTypeManage: 'Type A',
            },
          ],
          count: 1,
          status: 200,
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Access denied. Admins only.',
      schema: {
        example: {
          statusCode: 403,
          message: 'Access denied. Admins only.',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'No Data found',
      schema: {
        example: {
          message: 'No Data found',
          statusCode: 404,
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Database query failed in fetching ingestion',
      schema: {
        example: {
          message: 'Database query failed in fetching ingestion',
          error: 'Detailed database error message',
          statusCode: 500,
        },
      },
    }),
  );
}

export function CreateIngestionTypeApiMultiResponse() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new ingestion type' }),
    ApiResponse({
      status: 201,
      description: 'New ingestion type added successfully',
      schema: {
        example: {
          message: 'new ingestion type added successfully',
          status: 201,
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Access denied. Admins only.',
      schema: {
        example: {
          statusCode: 403,
          message: 'Access denied. Admins only.',
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'Ingestion type already exists',
      schema: {
        example: {
          message: 'This ingestion type: TypeA already exists',
          statusCode: 409,
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Error inserting ingestion type',
      schema: {
        example: {
          message: 'Error inserting ingestion type',
          error: 'Detailed database error message',
          statusCode: 500,
        },
      },
    }),
  );
}

export function FetchIngestionTypeApiMultiResponse() {
  return applyDecorators(
    ApiOperation({ summary: 'Fetch all ingestion types' }),
    ApiResponse({
      status: 200,
      description: 'List of all ingestion types',
      schema: {
        example: {
          data: [
            {
              id: 'abcd1234',
              status: true,
              ingestionType: 'ingestDoc',
              createdBy: 'user123',
              updatedBy: 'user456',
              createdDate: '2025-03-15T10:00:00.000Z',
              updatedDate: '2025-03-15T12:00:00.000Z',
            },
          ],
          status: 200,
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Access denied. Admins only.',
      schema: {
        example: {
          statusCode: 403,
          message: 'Access denied. Admins only.',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'No Data found',
      schema: {
        example: {
          message: 'No Data found',
          statusCode: 404,
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Error fetching ingestion types',
      schema: {
        example: {
          message: 'Error fetching ingestion types',
          error: 'Detailed database error message',
          statusCode: 500,
        },
      },
    }),
  );
}

export function ChangeIngestionTypeStatusApiMultiResponse() {
  return applyDecorators(
    ApiOperation({ summary: 'Change ingestion type status' }),
    ApiParam({
      name: 'id',
      required: true,
      description: 'ID of the ingestion type to update',
      example: 'abcd1234',
    }),
    ApiParam({
      name: 'status',
      required: true,
      description: 'New status for the ingestion type (true or false)',
      example: true,
    }),
    ApiResponse({
      status: 201,
      description: 'Ingestion type status changed successfully',
      schema: {
        example: {
          message: 'new ingestion type status changed successfully',
          status: 201,
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Access denied. Admins only.',
      schema: {
        example: {
          statusCode: 403,
          message: 'Access denied. Admins only.',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'ingestion type id not exists',
      schema: {
        example: {
          statusCode: 400,
          message: 'This ingestion type id not exist',
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Error changing ingestion type status',
      schema: {
        example: {
          message: 'Error changing ingestion type status',
          error: 'Detailed database error message',
          statusCode: 500,
        },
      },
    }),
  );
}

export function CreateRouteApiMultiResponse() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new ingestion route' }),
    ApiResponse({
      status: 201,
      description: 'New ingestion route added successfully',
      schema: {
        example: {
          message: 'new ingestion route added successfully',
          status: 201,
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Access denied. Admins only.',
      schema: {
        example: {
          statusCode: 403,
          message: 'Access denied. Admins only.',
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'Conflict: Route for this ingestion type already exists',
      schema: {
        example: {
          message:
            'This ingestion route: /exampleRoute for this ingestion type already exists',
          statusCode: 409,
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Error inserting ingestion route',
      schema: {
        example: {
          message: 'Error inserting ingestion route',
          error: 'Detailed database error message',
          statusCode: 500,
        },
      },
    }),
  );
}

export function ChangeRouteStatusApiMultiResponse() {
  return applyDecorators(
    ApiOperation({ summary: 'Change the status of an ingestion route' }),
    ApiResponse({
      status: 201,
      description: 'Ingestion route status changed successfully',
      schema: {
        example: {
          message: 'new ingestion route status changed successfully',
          status: 201,
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Access denied. Admins only.',
      schema: {
        example: {
          statusCode: 403,
          message: 'Access denied. Admins only.',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'ingestion route id not exists',
      schema: {
        example: {
          statusCode: 400,
          message: 'This ingestion route id not exist',
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Error changing ingestion route status',
      schema: {
        example: {
          message: 'Error changing ingestion route status',
          error: 'Detailed database error message',
          statusCode: 500,
        },
      },
    }),
  );
}

export function FetchRouteApiMultiResponse() {
  return applyDecorators(
    ApiOperation({ summary: 'Fetch all ingestion routes based on filters' }),
    ApiResponse({
      status: 200,
      description: 'List of ingestion routes fetched successfully',
      schema: {
        example: {
          data: [
            {
              id: 'route-123',
              clientEmail: 'client@example.com',
              route: '/api/ingest',
              status: true,
              createdDate: '2025-03-15T10:00:00Z',
              updatedDate: '2025-03-15T11:00:00Z',
              ingestionType: 'documentProcessing',
            },
          ],
          count: 1,
          status: 200,
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Access denied. Admins only.',
      schema: {
        example: {
          statusCode: 403,
          message: 'Access denied. Admins only.',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'No Data found',
      schema: {
        example: {
          statusCode: 404,
          message: 'No Data found',
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Error fetching ingestion routes',
      schema: {
        example: {
          message: 'Error fetching ingestion routes',
          error: 'Detailed database error message',
          statusCode: 500,
        },
      },
    }),
  );
}
