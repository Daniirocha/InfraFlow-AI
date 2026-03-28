import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateMeDto } from './dto/update-me.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.users.findOne(user.sub);
  }

  @Patch('me')
  @Roles(Role.ADMIN, Role.TECHNICIAN, Role.VIEWER)
  updateMe(@CurrentUser() user: AuthUser, @Body() body: UpdateMeDto) {
    return this.users.updateMe(user.sub, body);
  }

  @Get('assignable')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  assignable() {
    return this.users.findAssignable();
  }

  @Get()
  @Roles(Role.ADMIN)
  list() {
    return this.users.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  get(@Param('id') id: string) {
    return this.users.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateUserDto) {
    return this.users.create(user.sub, dto);
  }
}
