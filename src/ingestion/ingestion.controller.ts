import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { User } from 'src/user/user.decorator';
import { AuthProfile } from 'src/lib/common';
import { IngestionService } from './ingestion.service';
import {
  CreateIngestionManageDto,
  CreateIngestionTypeDto,
  FindIngestionDto,
  FindIngestionRouteDto,
} from './dto/create-ingestion.dto';
import { RoleGuard } from 'src/auth/role.guard';
import {
  GetApiMultiResponse,
  CreateIngestionTypeApiMultiResponse,
  FetchIngestionTypeApiMultiResponse,
  ChangeIngestionTypeStatusApiMultiResponse,
  CreateRouteApiMultiResponse,
  ChangeRouteStatusApiMultiResponse,
  FetchRouteApiMultiResponse,
} from './dto/ingestion.responses';

@ApiTags('Ingestion management')
@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  //ingestion manage
  @Get()
  @ApiBearerAuth('Authorization')
  @UseGuards(RoleGuard)
  @GetApiMultiResponse()
  findAll(@Query() payload: FindIngestionDto) {
    return this.ingestionService.findAll(payload);
  }

  // @Get(':id')
  // @ApiBearerAuth('Authorization')
  // @UseGuards(RoleGuard)
  // findOne(@Param('id') id: string) {
  //   return this.ingestionService.findOne(id);
  // }

  //ingestion type manage

  @Post('type/manage')
  @ApiBearerAuth('Authorization')
  @UseGuards(RoleGuard)
  @CreateIngestionTypeApiMultiResponse()
  createIngestionType(
    @User() user: AuthProfile,
    @Body() payload: CreateIngestionTypeDto,
  ) {
    return this.ingestionService.createIngestionType(user.userId, payload);
  }

  @Get('type/manage')
  @ApiBearerAuth('Authorization')
  @UseGuards(RoleGuard)
  @FetchIngestionTypeApiMultiResponse()
  async ingestionManageType() {
    return await this.ingestionService.findAllIngestionType();
  }

  @Patch('tye/manage/:id/:status')
  @ApiBearerAuth('Authorization')
  @UseGuards(RoleGuard)
  @ChangeIngestionTypeStatusApiMultiResponse()
  async changeIngestionTypeManageStatus(
    @User() user: AuthProfile,
    @Param('id') id: string,
    @Param('status') status: boolean,
  ) {
    return await this.ingestionService.changeIngestionTypeManageStatus(
      user.userId,
      id,
      status,
    );
  }

  //ingestion route manage
  @Post('manage')
  @ApiBearerAuth('Authorization')
  @UseGuards(RoleGuard)
  @CreateRouteApiMultiResponse()
  createNewRouteForIngestion(
    @User() user: AuthProfile,
    @Body() payload: CreateIngestionManageDto,
  ) {
    return this.ingestionService.createNewRouteForIngestion(
      user.userId,
      payload,
    );
  }

  @Patch('manage/:id/:status')
  @ApiBearerAuth('Authorization')
  @UseGuards(RoleGuard)
  @ChangeRouteStatusApiMultiResponse()
  async changeIngestionManageRouteStatus(
    @User() user: AuthProfile,
    @Param('id') id: string,
    @Param('status') status: boolean,
  ) {
    return await this.ingestionService.changeIngestionManageRouteStatus(
      user.userId,
      id,
      status,
    );
  }

  //api to fetch toutes
  @Post('fetch/manage/routes')
  @ApiBearerAuth('Authorization')
  @UseGuards(RoleGuard)
  @FetchRouteApiMultiResponse()
  async findAllIngestionRoute(@Body() payload: FindIngestionRouteDto) {
    return await this.ingestionService.findAllIngestionRoute(payload);
  }

  //mock api to run failed ingestion of particular route
  // @Post('failed/run')
  // @ApiBearerAuth('Authorization')
  // @UseGuards(RoleGuard)
  // async runFailedIngestion(@Body() payload: {ingestionTypeId: string, routeId:string, dateFrom:string, dateTo:string}) {
  //   return await this.ingestionService.runFailedIngestion(payload);
  // }
}
