import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  findAll(overdue?: boolean) {
    const now = new Date();
    return this.prisma.task.findMany({
      where: overdue
        ? { status: { not: 'DONE' }, dueDate: { lt: now } }
        : undefined,
      orderBy: { dueDate: 'asc' },
      include: {
        ticket: { select: { id: true, title: true } },
        equipment: { select: { id: true, name: true, patrimonyNumber: true } },
        assignee: { select: { id: true, name: true, email: true } },
        outgoingDeps: {
          include: {
            dependsOn: { select: { id: true, title: true, status: true } },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        ticket: true,
        equipment: true,
        assignee: { select: { id: true, name: true, email: true } },
        outgoingDeps: { include: { dependsOn: true } },
        incomingDeps: { include: { task: true } },
      },
    });
    if (!task) throw new NotFoundException();
    return task;
  }

  async create(userId: string, dto: CreateTaskDto) {
    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        status: dto.status,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        ticketId: dto.ticketId ?? undefined,
        equipmentId: dto.equipmentId ?? undefined,
        assigneeId: dto.assigneeId ?? undefined,
      },
      include: { assignee: { select: { id: true, name: true, email: true } } },
    });
    await this.audit.log(userId, 'TASK_CREATE', 'Task', task.id);
    if (task.assigneeId) {
      await this.notifications.notify(
        task.assigneeId,
        'Nova tarefa atribuída',
        task.title,
        'task_assigned',
      );
    }
    return task;
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    const before = await this.prisma.task.findUnique({ where: { id } });
    if (!before) throw new NotFoundException();

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        ...dto,
        dueDate:
          dto.dueDate === null
            ? null
            : dto.dueDate
              ? new Date(dto.dueDate)
              : undefined,
      },
      include: { assignee: { select: { id: true, name: true, email: true } } },
    });
    await this.audit.log(userId, 'TASK_UPDATE', 'Task', id);

    if (
      dto.assigneeId &&
      dto.assigneeId !== before.assigneeId &&
      dto.assigneeId
    ) {
      await this.notifications.notify(
        dto.assigneeId,
        'Tarefa atribuída a você',
        task.title,
        'task_assigned',
      );
    }

    if (
      task.dueDate &&
      task.dueDate < new Date() &&
      task.status !== 'DONE' &&
      task.assigneeId &&
      (!before.dueDate ||
        before.dueDate >= new Date() ||
        before.status === 'DONE')
    ) {
      await this.notifications.notify(
        task.assigneeId,
        'Tarefa em atraso',
        task.title,
        'task_overdue',
      );
    }

    return task;
  }

  async addDependency(userId: string, taskId: string, dependsOnTaskId: string) {
    if (taskId === dependsOnTaskId) {
      throw new BadRequestException('Uma tarefa não pode depender dela mesma');
    }
    const [a, b] = await Promise.all([
      this.prisma.task.findUnique({ where: { id: taskId } }),
      this.prisma.task.findUnique({ where: { id: dependsOnTaskId } }),
    ]);
    if (!a || !b) throw new NotFoundException();

    const dep = await this.prisma.taskDependency.create({
      data: { taskId, dependsOnTaskId },
    });
    await this.audit.log(userId, 'TASK_DEPENDENCY_ADD', 'Task', taskId, {
      dependsOnTaskId,
    });
    return dep;
  }
}
