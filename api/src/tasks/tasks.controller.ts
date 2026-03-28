import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { TasksService } from './tasks.service';
import type { CreateTaskDto } from './dto/create-task.dto';
import type { UpdateTaskDto } from './dto/update-task.dto';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  @Roles(Role.ADMIN, Role.TECHNICIAN, Role.VIEWER)
  list(@Query('overdue') overdue?: string) {
    return this.tasks.findAll(overdue === 'true');
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TECHNICIAN, Role.VIEWER)
  get(@Param('id') id: string) {
    return this.tasks.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTaskDto) {
    return this.tasks.create(user.sub, dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasks.update(user.sub, id, dto);
  }

  @Post(':id/dependencies')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  addDep(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { dependsOnTaskId: string },
  ) {
    return this.tasks.addDependency(user.sub, id, body.dependsOnTaskId);
  }
}
