import { DynamicModule, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiModule } from '../ai/ai.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AiQueueProcessor } from './ai-queue.processor';
import { NotificationQueueProcessor } from './notification-queue.processor';

@Module({})
export class QueuesModule {
  static register(): DynamicModule {
    return {
      module: QueuesModule,
      imports: [
        AiModule,
        NotificationsModule,
        BullModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (config: ConfigService) => ({
            connection: {
              host: config.get('REDIS_HOST', '127.0.0.1'),
              port: +config.get('REDIS_PORT', 6379),
            },
          }),
          inject: [ConfigService],
        }),
        BullModule.registerQueue({ name: 'ai' }),
        BullModule.registerQueue({ name: 'notifications' }),
      ],
      providers: [AiQueueProcessor, NotificationQueueProcessor],
      exports: [BullModule],
    };
  }
}
