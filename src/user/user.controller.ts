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
import {
  CreateUserApiMultiResponse,
  CreatePlatformAdminApiMultiResponse,
  ProfileApiMultiResponse,
  UpdateApiMultiResponse,
  FetchByEmailApiMultiResponse,
} from './dto/user.responses';

@ApiTags('user management')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @AllowUnauthorizedRequest()
  @CreateUserApiMultiResponse()
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.userService.create(createUserDto);
  }

  @Post('/platform/admin')
  @AllowUnauthorizedRequest()
  @CreatePlatformAdminApiMultiResponse()
  async createPlatformAdmin(@Body() createUserDto: CreateUserDto) {
    return await this.userService.createPlatformAdmin(createUserDto);
  }

  @Get('profile')
  @ApiBearerAuth('Authorization')
  @ProfileApiMultiResponse()
  async findUser(@User() user: AuthProfile) {
    const { userId } = user;
    return await this.userService.findUser(userId);
  }

  @Patch('update')
  @ApiBearerAuth('Authorization')
  @UpdateApiMultiResponse()
  async update(
    @Body() updateUserDto: UpdateUserDto,
    @User() user: AuthProfile,
  ) {
    const { userId } = user;

    return await this.userService.update(userId, updateUserDto);
  }

  @Get('all')
  @ApiBearerAuth('Authorization')
  @FetchByEmailApiMultiResponse()
  async findAllUsersByEmail(
    @User() user: AuthProfile,
    @Query() payload: UserPaginationDto,
  ) {
    const { userId } = user;

    return await this.userService.findAllUsersByEmail(userId, payload);
  }
}
