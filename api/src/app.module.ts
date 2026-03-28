import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from './ai/ai.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EquipmentModule } from './equipment/equipment.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { QueuesModule } from './queues/queues.module';
import { ReportsModule } from './reports/reports.module';
import { TasksModule } from './tasks/tasks.module';
import { TicketsModule } from './tickets/tickets.module';
import { UsersModule } from './users/users.module';
import { AppController } from './app.controller';

const queueImports =
  process.env.REDIS_ENABLED === 'true' ? [QueuesModule.register()] : [];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ...queueImports,
    AuditModule,
    AuthModule,
    UsersModule,
    EquipmentModule,
    TicketsModule,
    TasksModule,
    AiModule,
    DashboardModule,
    ReportsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
