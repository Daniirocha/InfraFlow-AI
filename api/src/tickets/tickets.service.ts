import { Injectable, NotFoundException } from '@nestjs/common';
import { TicketPriority, TicketStatus } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AiService } from '../ai/ai.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly ai: AiService,
    private readonly notifications: NotificationsService,
  ) {}

  findAll(q?: string, status?: TicketStatus) {
    return this.prisma.ticket.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        equipment: true,
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { attachments: true, tasks: true } },
      },
    });
  }

  async findOne(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        equipment: true,
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        attachments: true,
        tasks: true,
      },
    });
    if (!ticket) throw new NotFoundException();
    return ticket;
  }

  async create(userId: string, dto: CreateTicketDto) {
    let priority = dto.priority ?? TicketPriority.MEDIUM;
    let category = dto.category;
    let estimatedMinutes = dto.estimatedMinutes;
    let aiMeta: Record<string, unknown> | undefined;

    if (dto.applyAi) {
      const suggestion = await this.ai.analyzeTicketDescription(
        dto.description,
      );
      priority = suggestion.priority as TicketPriority;
      category = category ?? suggestion.category;
      estimatedMinutes = estimatedMinutes ?? suggestion.estimatedMinutes;
      aiMeta = { suggestion };
    }

    const ticket = await this.prisma.ticket.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status ?? TicketStatus.OPEN,
        priority,
        category,
        estimatedMinutes,
        equipmentId: dto.equipmentId ?? undefined,
        assigneeId: dto.assigneeId ?? undefined,
        createdById: userId,
      },
      include: {
        equipment: true,
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    await this.audit.log(userId, 'TICKET_CREATE', 'Ticket', ticket.id, aiMeta);

    if (ticket.assigneeId) {
      await this.notifications.notify(
        ticket.assigneeId,
        'Novo chamado atribuído',
        ticket.title,
        'ticket_assigned',
      );
    }

    return ticket;
  }

  async update(userId: string, id: string, dto: UpdateTicketDto) {
    await this.ensureExists(id);
    const before = await this.prisma.ticket.findUnique({ where: { id } });
    const ticket = await this.prisma.ticket.update({
      where: { id },
      data: dto,
      include: {
        equipment: true,
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    await this.audit.log(userId, 'TICKET_UPDATE', 'Ticket', id);

    if (
      dto.assigneeId &&
      dto.assigneeId !== before?.assigneeId &&
      dto.assigneeId
    ) {
      await this.notifications.notify(
        dto.assigneeId,
        'Chamado atribuído a você',
        ticket.title,
        'ticket_assigned',
      );
    }

    return ticket;
  }

  async addAttachment(
    userId: string,
    ticketId: string,
    file: Express.Multer.File,
  ) {
    await this.ensureExists(ticketId);
    const uploadDir = path.join(process.cwd(), 'uploads', 'tickets');
    await fs.mkdir(uploadDir, { recursive: true });
    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(uploadDir, safeName);
    await fs.writeFile(filePath, file.buffer);

    const att = await this.prisma.ticketAttachment.create({
      data: {
        ticketId,
        fileName: file.originalname,
        filePath,
        mimeType: file.mimetype,
      },
    });
    await this.audit.log(userId, 'TICKET_ATTACHMENT', 'Ticket', ticketId, {
      attachmentId: att.id,
    });
    return att;
  }

  private async ensureExists(id: string) {
    const t = await this.prisma.ticket.findUnique({ where: { id } });
    if (!t) throw new NotFoundException();
  }
}
