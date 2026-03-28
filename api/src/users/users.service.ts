import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Usuários que podem receber chamados/tarefas (para selects na UI). */
  findAssignable() {
    return this.prisma.user.findMany({
      where: { role: { in: [Role.ADMIN, Role.TECHNICIAN] } },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException();
    return user;
  }

  async create(actorId: string, dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name,
        passwordHash,
        role: dto.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    await this.audit.log(actorId, 'USER_CREATE', 'User', user.id, {
      email: user.email,
    });
    return user;
  }

  async updateMe(id: string, data: { name?: string }) {
    return this.prisma.user.update({
      where: { id },
      data: { name: data.name },
      select: { id: true, email: true, name: true, role: true },
    });
  }
}
