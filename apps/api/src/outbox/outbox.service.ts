import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
@Injectable()
export class OutboxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}
  async publishPending() {
    const events = await this.prisma.outboxEvent.findMany({
      where: { publishedAt: null },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
    for (const event of events) {
      try {
        this.realtime.publishLot(
          event.aggregateId,
          event.eventType,
          event.payload,
        );
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            publishedAt: new Date(),
            attempts: { increment: 1 },
            lastError: null,
          },
        });
      } catch (error) {
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            attempts: { increment: 1 },
            lastError:
              error instanceof Error
                ? error.message.slice(0, 1000)
                : 'Erro desconhecido',
          },
        });
      }
    }
  }
}
