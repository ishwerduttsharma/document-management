import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { AllowUnauthorizedRequest } from 'src/allow-unauthorized-request/allow-unauthorized-request.decorator';
import { ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('auth management')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiResponse({
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
  })
  @ApiResponse({
    status: 400,
    description: 'Wrong credentials. Please try again',
    schema: {
      example: {
        statusCode: 400,
        message: 'Wrong credentials. Please try again',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not exists with this email',
    schema: {
      example: {
        statusCode: 404,
        message: 'User not exists with this email',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error retrieving user',
    schema: {
      example: {
        message: 'Error retrieving user',
        error: 'Detailed database error message',
        statusCode: 500,
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @AllowUnauthorizedRequest()
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  @ApiResponse({
    status: 200,
    description: 'User logged out successfully',
    schema: {
      example: {
        message: 'Logged out successfully',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No token provided',
    schema: {
      example: {
        statusCode: 401,
        message: 'No token provided',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid token',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    schema: {
      example: {
        message: 'An unexpected error occurred',
        statusCode: 500,
      },
    },
  })
  @Post('logout')
  @ApiBearerAuth('Authorization')
  async logout(@Req() req) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.authService.logout(token);
  }
}
