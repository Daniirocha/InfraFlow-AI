import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TicketPriority } from '@prisma/client';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';

const suggestionSchema = z.object({
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  category: z.string(),
  estimatedMinutes: z
    .number()
    .min(5)
    .max(24 * 60),
});

export type TicketAiSuggestion = z.infer<typeof suggestionSchema> & {
  source: 'gemini' | 'mock';
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async analyzeTicketDescription(
    description: string,
  ): Promise<TicketAiSuggestion> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      return this.mockSuggestion(description);
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: this.config.get<string>('GEMINI_MODEL', 'gemini-1.5-flash'),
      });
      const prompt = `Você é analista de service desk industrial. Com base na descrição do chamado, responda APENAS JSON válido com as chaves:
{"priority":"LOW"|"MEDIUM"|"HIGH"|"CRITICAL","category":"string curta em pt-BR","estimatedMinutes":number}
Regras: prioridade CRITICAL para parada de produção ou segurança; HIGH para indisponibilidade de equipamento crítico; MEDIUM para degradação; LOW para dúvidas ou melhorias.
Descrição:
${description}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const raw = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
      const parsed = suggestionSchema.safeParse(raw);
      if (!parsed.success) {
        this.logger.warn(`Resposta Gemini inválida: ${text}`);
        return this.mockSuggestion(description);
      }
      return { ...parsed.data, source: 'gemini' };
    } catch (e) {
      this.logger.error('Falha ao chamar Gemini', e as Error);
      return this.mockSuggestion(description);
    }
  }

  private mockSuggestion(description: string): TicketAiSuggestion {
    const lower = description.toLowerCase();
    let priority: TicketPriority = TicketPriority.MEDIUM;
    if (
      /parada|produção parou|incêndio|segurança|crítico|down|sem acesso total/.test(
        lower,
      )
    ) {
      priority = TicketPriority.CRITICAL;
    } else if (/lento|travando|erro|não imprime|sem rede/.test(lower)) {
      priority = TicketPriority.HIGH;
    } else if (/dúvida|ajuste|melhoria/.test(lower)) {
      priority = TicketPriority.LOW;
    }
    const category = /impress|printer|fila/.test(lower)
      ? 'printer'
      : /servidor|server|vm/.test(lower)
        ? 'server'
        : 'hardware';
    return {
      priority,
      category,
      estimatedMinutes: priority === TicketPriority.CRITICAL ? 30 : 60,
      source: 'mock',
    };
  }

  async recommendations() {
    const since = new Date();
    since.setDate(since.getDate() - 14);

    const tickets = await this.prisma.ticket.findMany({
      where: { createdAt: { gte: since } },
      include: { equipment: true },
    });

    const sectorCounts = new Map<string, number>();
    for (const t of tickets) {
      const sector = t.equipment?.sector ?? 'Sem equipamento vinculado';
      sectorCounts.set(sector, (sectorCounts.get(sector) ?? 0) + 1);
    }

    const sorted = [...sectorCounts.entries()].sort((a, b) => b[1] - a[1]);
    const top = sorted[0];
    const message = top
      ? `Nos últimos 14 dias, o setor "${top[0]}" concentrou ${top[1]} chamado(s). Priorize inspeções e manutenção preventiva nesse setor.`
      : 'Volume de chamados ainda baixo — mantenha o monitoramento preventivo.';

    return {
      generatedAt: new Date().toISOString(),
      windowDays: 14,
      sectors: sorted.map(([sector, count]) => ({ sector, count })),
      recommendation: message,
    };
  }

  async executiveSummary(weekStart: Date) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const tickets = await this.prisma.ticket.findMany({
      where: { createdAt: { gte: weekStart, lt: weekEnd } },
    });

    const overdueTasks = await this.prisma.task.count({
      where: {
        status: { not: 'DONE' },
        dueDate: { lt: new Date() },
      },
    });

    const byCategory = new Map<string, number>();
    for (const t of tickets) {
      const c = t.category ?? 'sem_categoria';
      byCategory.set(c, (byCategory.get(c) ?? 0) + 1);
    }

    const hardware = [...byCategory.entries()]
      .filter(([k]) => /hardware|impress|printer|rede|server/i.test(k))
      .reduce((a, [, n]) => a + n, 0);

    const insights = [
      `Total de chamados na semana: ${tickets.length}.`,
      hardware
        ? `Chamados ligados a hardware/impressão/rede: aproximadamente ${hardware}.`
        : null,
      overdueTasks
        ? `Tarefas em atraso no sistema: ${overdueTasks}.`
        : 'Nenhuma tarefa atrasada.',
    ].filter(Boolean);

    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: this.config.get<string>('GEMINI_MODEL', 'gemini-1.5-flash'),
        });
        const prompt = `Resuma em até 4 frases em português do Brasil, tom executivo, com base nestes dados: ${JSON.stringify(
          {
            tickets: tickets.length,
            byCategory: Object.fromEntries(byCategory),
            overdueTasks,
          },
        )}`;
        const result = await model.generateContent(prompt);
        const narrative = result.response.text().trim();
        return {
          weekStart: weekStart.toISOString(),
          weekEnd: weekEnd.toISOString(),
          metrics: {
            ticketCount: tickets.length,
            overdueTasks,
            byCategory: Object.fromEntries(byCategory),
          },
          insights,
          narrative,
        };
      } catch {
        /* fall through */
      }
    }

    return {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      metrics: {
        ticketCount: tickets.length,
        overdueTasks,
        byCategory: Object.fromEntries(byCategory),
      },
      insights,
      narrative: insights.join(' '),
    };
  }
}
