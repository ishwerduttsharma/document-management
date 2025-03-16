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
import {
  LoginApiMultiResponse,
  LogoutApiMultiResponse,
} from './dto/auth.responses';

@ApiTags('auth management')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @LoginApiMultiResponse()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @AllowUnauthorizedRequest()
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  @LogoutApiMultiResponse()
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
  @Post('logout')
  @ApiBearerAuth('Authorization')
  async logout(@Req() req) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.authService.logout(token);
  }
}
