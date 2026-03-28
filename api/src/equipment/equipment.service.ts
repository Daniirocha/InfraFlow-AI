import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';

@Injectable()
export class EquipmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  findAll(q?: string) {
    return this.prisma.equipment.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { patrimonyNumber: { contains: q, mode: 'insensitive' } },
              { sector: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { maintenances: true, tickets: true } } },
    });
  }

  async findOne(id: string) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
      include: {
        maintenances: { orderBy: { performedAt: 'desc' } },
        tickets: { take: 20, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!equipment) throw new NotFoundException();
    return equipment;
  }

  async create(userId: string, dto: CreateEquipmentDto) {
    const created = await this.prisma.equipment.create({
      data: {
        patrimonyNumber: dto.patrimonyNumber,
        name: dto.name,
        type: dto.type,
        status: dto.status,
        sector: dto.sector,
        location: dto.location,
        notes: dto.notes,
      },
    });
    await this.audit.log(userId, 'EQUIPMENT_CREATE', 'Equipment', created.id);
    return created;
  }

  async update(userId: string, id: string, dto: UpdateEquipmentDto) {
    await this.ensureExists(id);
    const updated = await this.prisma.equipment.update({
      where: { id },
      data: dto,
    });
    await this.audit.log(userId, 'EQUIPMENT_UPDATE', 'Equipment', id);
    return updated;
  }

  async remove(userId: string, id: string) {
    await this.ensureExists(id);
    await this.prisma.equipment.delete({ where: { id } });
    await this.audit.log(userId, 'EQUIPMENT_DELETE', 'Equipment', id);
    return { success: true };
  }

  async addMaintenance(
    userId: string,
    equipmentId: string,
    dto: CreateMaintenanceDto,
  ) {
    await this.ensureExists(equipmentId);
    const m = await this.prisma.maintenanceRecord.create({
      data: {
        equipmentId,
        title: dto.title,
        description: dto.description,
        performedBy: dto.performedBy,
      },
    });
    await this.audit.log(
      userId,
      'MAINTENANCE_CREATE',
      'MaintenanceRecord',
      m.id,
    );
    return m;
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.equipment.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException();
  }
}
