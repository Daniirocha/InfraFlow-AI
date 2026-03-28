import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const [
      ticketsByStatus,
      equipmentBySector,
      overdueTasks,
      openTickets,
      equipmentTotal,
    ] = await Promise.all([
      this.prisma.ticket.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.equipment.groupBy({
        by: ['sector'],
        _count: { sector: true },
      }),
      this.prisma.task.count({
        where: { status: { not: 'DONE' }, dueDate: { lt: new Date() } },
      }),
      this.prisma.ticket.count({ where: { status: { not: 'CLOSED' } } }),
      this.prisma.equipment.count(),
    ]);

    return {
      ticketsByStatus: ticketsByStatus.map((t) => ({
        status: t.status,
        count: t._count.status,
      })),
      equipmentBySector: equipmentBySector.map((e) => ({
        sector: e.sector,
        count: e._count.sector,
      })),
      overdueTasks,
      openTickets,
      equipmentTotal,
      updatedAt: new Date().toISOString(),
    };
  }
}
