import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { User } from 'src/user/user.decorator';
import { AuthProfile, Roles } from 'src/lib/common';
import { DocumentService } from './document.service';
import {
  AssignRoleDto,
  DocQueryDto,
  FileUploadDto,
} from './dto/assign-document.dto';

@ApiTags('Document management')
@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  @ApiBearerAuth('Authorization')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'upload file',
    type: FileUploadDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @User() user: AuthProfile,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const { userId } = user;

    return this.documentService.create(userId, file);
  }

  @Get()
  @ApiBearerAuth('Authorization')
  async findAll(@User() user: AuthProfile, @Query() payload: DocQueryDto) {
    const { userId } = user;

    return this.documentService.findAll(userId, payload);
  }

  @Post('assign')
  @ApiBearerAuth('Authorization')
  async assignRolToUser(
    @User() user: AuthProfile,
    @Body() payload: AssignRoleDto,
  ) {
    const { userId } = user;

    return this.documentService.assignRolToUser(userId, payload);
  }

  @Delete(':fieldId')
  @ApiBearerAuth('Authorization')
  async delete(@Param('fieldId') fieldId: string, @User() user: AuthProfile) {
    const { userId } = user;

    return this.documentService.delete(userId, fieldId);
  }

  @Get('roles')
  @ApiBearerAuth('Authorization')
  getUserDocumentRoles() {
    return { data: Roles, status: 200 };
  }
}
