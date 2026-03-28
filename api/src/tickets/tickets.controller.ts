import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { TicketStatus } from '@prisma/client';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { TicketsService } from './tickets.service';
import type { CreateTicketDto } from './dto/create-ticket.dto';
import type { UpdateTicketDto } from './dto/update-ticket.dto';
import type { Express } from 'express';

@ApiTags('tickets')
@ApiBearerAuth()
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.TECHNICIAN, Role.VIEWER)
  list(@Query('q') q?: string, @Query('status') status?: TicketStatus) {
    return this.tickets.findAll(q, status);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TECHNICIAN, Role.VIEWER)
  get(@Param('id') id: string) {
    return this.tickets.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTicketDto) {
    return this.tickets.create(user.sub, dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.tickets.update(user.sub, id, dto);
  }

  @Post(':id/attachments')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  upload(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.tickets.addAttachment(user.sub, id, file);
  }
}
