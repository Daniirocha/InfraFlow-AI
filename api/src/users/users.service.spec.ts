import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('UsersService', () => {
  let service: UsersService;
  const prismaMock = {
    user: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
  const auditMock = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: auditMock },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('findAssignable filtra ADMIN e TECHNICIAN', async () => {
    prismaMock.user.findMany.mockClear();
    await service.findAssignable();
    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: { in: [Role.ADMIN, Role.TECHNICIAN] } },
      }),
    );
  });
});
