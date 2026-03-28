import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { EquipmentService } from './equipment.service';
import type { CreateEquipmentDto } from './dto/create-equipment.dto';
import type { UpdateEquipmentDto } from './dto/update-equipment.dto';
import type { CreateMaintenanceDto } from './dto/create-maintenance.dto';

@ApiTags('equipment')
@ApiBearerAuth()
@Controller('equipment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EquipmentController {
  constructor(private readonly equipment: EquipmentService) {}

  @Get()
  @Roles(Role.ADMIN, Role.TECHNICIAN, Role.VIEWER)
  list(@Query('q') q?: string) {
    return this.equipment.findAll(q);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TECHNICIAN, Role.VIEWER)
  get(@Param('id') id: string) {
    return this.equipment.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateEquipmentDto) {
    return this.equipment.create(user.sub, dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateEquipmentDto,
  ) {
    return this.equipment.update(user.sub, id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.equipment.remove(user.sub, id);
  }

  @Post(':id/maintenances')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  addMaintenance(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateMaintenanceDto,
  ) {
    return this.equipment.addMaintenance(user.sub, id, dto);
  }
}
