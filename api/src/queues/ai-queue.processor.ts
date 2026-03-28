import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AiService } from '../ai/ai.service';

@Processor('ai')
export class AiQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(AiQueueProcessor.name);

  constructor(private readonly ai: AiService) {
    super();
  }

  async process(job: Job<{ description: string }>): Promise<unknown> {
    if (job.name === 'analyze') {
      const result = await this.ai.analyzeTicketDescription(
        job.data.description,
      );
      this.logger.log(`Fila IA: job ${job.id} concluído (${result.source})`);
      return result;
    }
    this.logger.warn(`Job desconhecido na fila ai: ${job.name}`);
    return null;
  }
}
