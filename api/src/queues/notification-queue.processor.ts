import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NotificationsService } from '../notifications/notifications.service';

@Processor('notifications')
export class NotificationQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationQueueProcessor.name);

  constructor(private readonly notifications: NotificationsService) {
    super();
  }

  async process(
    job: Job<{ userId: string; title: string; body?: string; type: string }>,
  ): Promise<unknown> {
    const row = await this.notifications.notify(
      job.data.userId,
      job.data.title,
      job.data.body,
      job.data.type,
    );
    this.logger.log(`Notificação persistida via fila: ${row.id}`);
    return row;
  }
}
