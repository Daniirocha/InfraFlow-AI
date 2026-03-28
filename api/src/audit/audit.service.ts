import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    userId: string | null,
    action: string,
    entity: string,
    entityId?: string | null,
    metadata?: Record<string, unknown>,
  ) {
    return this.prisma.auditLog.create({
      data: {
        userId: userId ?? undefined,
        action,
        entity,
        entityId: entityId ?? undefined,
        metadata:
          metadata === undefined
            ? undefined
            : (metadata as Prisma.InputJsonValue),
      },
    });
  }

  async findAll(skip = 0, take = 50) {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }
}
