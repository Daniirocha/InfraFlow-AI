import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async weekly(weekStart?: string) {
    const start = weekStart ? new Date(weekStart) : new Date();
    if (!weekStart) {
      const day = start.getDay();
      const diff = (day + 6) % 7;
      start.setDate(start.getDate() - diff);
      start.setHours(0, 0, 0, 0);
    }
    return this.ai.executiveSummary(start);
  }

  async exportSnapshot() {
    const [users, equipment, tickets, tasks, audit] = await Promise.all([
      this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      }),
      this.prisma.equipment.findMany(),
      this.prisma.ticket.findMany({
        include: {
          equipment: true,
          assignee: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.task.findMany({
        include: {
          ticket: { select: { id: true, title: true } },
          equipment: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
        },
      }),
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      users,
      equipment,
      tickets,
      tasks,
      audit,
    };
  }

  toCsv(
    snapshot: Awaited<ReturnType<ReportsService['exportSnapshot']>>,
  ): string {
    const lines: string[] = [];
    lines.push('section,key,value');
    lines.push(`meta,exportedAt,${snapshot.exportedAt}`);
    snapshot.tickets.forEach((t, i) => {
      lines.push(
        `ticket,${i},${[t.id, t.title, t.status, t.priority, t.category ?? '', t.createdAt.toISOString()].join(';')}`,
      );
    });
    snapshot.equipment.forEach((e, i) => {
      lines.push(
        `equipment,${i},${[e.id, e.patrimonyNumber, e.name, e.sector, e.status].join(';')}`,
      );
    });
    return lines.join('\n');
  }
}
