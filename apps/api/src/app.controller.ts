import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './infrastructure/database/prisma.service';

interface HealthResponse {
  status: 'ok' | 'degraded';
  uptimeSeconds: number;
  database: 'up' | 'down';
  timestamp: string;
}

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  /** Raiz da API — identificação simples do serviço. */
  @Get()
  root() {
    return {
      service: 'lance-api',
      message:
        'Lance — Casa de Leilões. Consulte /health para o estado do serviço.',
    };
  }

  /**
   * Healthcheck usado pelo Docker Compose e pelas plataformas de deploy.
   * Verifica conectividade com o PostgreSQL, não apenas se o processo subiu.
   */
  @Get('health')
  async health(): Promise<HealthResponse> {
    let database: 'up' | 'down' = 'down';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'up';
    } catch {
      database = 'down';
    }

    return {
      status: database === 'up' ? 'ok' : 'degraded',
      uptimeSeconds: Math.round(process.uptime()),
      database,
      timestamp: new Date().toISOString(),
    };
  }
}
