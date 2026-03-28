import { PrismaClient, Role, EquipmentStatus, TicketStatus, TicketPriority } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@infraflow.local' },
    update: {},
    create: {
      email: 'admin@infraflow.local',
      name: 'Administradora',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const tech = await prisma.user.upsert({
    where: { email: 'tecnico@infraflow.local' },
    update: {},
    create: {
      email: 'tecnico@infraflow.local',
      name: 'Técnica Suporte',
      passwordHash: await bcrypt.hash('Tecnico@123', 10),
      role: Role.TECHNICIAN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'visualizador@infraflow.local' },
    update: {},
    create: {
      email: 'visualizador@infraflow.local',
      name: 'Visualizador',
      passwordHash: await bcrypt.hash('Viewer@123', 10),
      role: Role.VIEWER,
    },
  });

  const eq1 = await prisma.equipment.upsert({
    where: { patrimonyNumber: 'PAT-1001' },
    update: {},
    create: {
      patrimonyNumber: 'PAT-1001',
      name: 'PC Produção Linha 3',
      type: 'computer',
      status: EquipmentStatus.ACTIVE,
      sector: 'Produção',
      location: 'Galpão B',
    },
  });

  await prisma.equipment.upsert({
    where: { patrimonyNumber: 'PAT-2002' },
    update: {},
    create: {
      patrimonyNumber: 'PAT-2002',
      name: 'Impressora RH',
      type: 'printer',
      status: EquipmentStatus.ACTIVE,
      sector: 'RH',
      location: 'Administração',
    },
  });

  const maintCount = await prisma.maintenanceRecord.count({ where: { equipmentId: eq1.id } });
  if (maintCount === 0) {
    await prisma.maintenanceRecord.create({
      data: {
        equipmentId: eq1.id,
        title: 'Limpeza e troca de pasta térmica',
        description: 'Manutenção preventiva trimestral',
        performedBy: tech.name,
      },
    });
  }

  const ticketCount = await prisma.ticket.count();
  if (ticketCount === 0) {
    await prisma.ticket.createMany({
      data: [
        {
          title: 'Computador lento na Produção',
          description: 'Máquina PAT-1001 travando ao abrir ERP.',
          status: TicketStatus.OPEN,
          priority: TicketPriority.HIGH,
          category: 'hardware',
          estimatedMinutes: 45,
          equipmentId: eq1.id,
          assigneeId: tech.id,
          createdById: admin.id,
        },
        {
          title: 'Fila de impressão travada',
          description: 'Impressora RH não libera jobs.',
          status: TicketStatus.IN_PROGRESS,
          priority: TicketPriority.MEDIUM,
          category: 'printer',
          estimatedMinutes: 30,
          createdById: admin.id,
        },
      ],
    });
  }

  console.log('Seed concluído: usuários demo e dados iniciais criados.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
