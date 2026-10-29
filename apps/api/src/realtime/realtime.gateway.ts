import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Server, Socket } from 'socket.io';
import { PrismaService } from '../infrastructure/database/prisma.service';

interface SocketJwtPayload {
  sub: string;
}

@WebSocketGateway({
  cors: { origin: process.env.WEB_ORIGIN?.split(',') ?? false },
})
export class RealtimeGateway {
  @WebSocketServer() server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(socket: Socket) {
    const token = socket.handshake.auth?.token;

    if (typeof token !== 'string' || !token) {
      socket.disconnect(true);
      return;
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET');

      if (!secret) {
        socket.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync<SocketJwtPayload>(
        token,
        { secret },
      );

      if (!payload.sub) {
        socket.disconnect(true);
        return;
      }

      socket.data.userId = payload.sub;
      await socket.join(`wallet:${payload.sub}`);
    } catch {
      socket.disconnect(true);
    }
  }

  @SubscribeMessage('lot.subscribe')
  async subscribe(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { lotId?: string },
  ) {
    const lotId = body?.lotId;

    if (typeof lotId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(lotId)) {
      return { success: false, message: 'ID de lote inválido' };
    }

    const lot = await this.prisma.lot.findUnique({
      where: { id: lotId },
      select: { id: true },
    });

    if (!lot) {
      return { success: false, message: 'Lote não encontrado' };
    }

    await socket.join(`lot:${lotId}`);

    return { success: true, lotId };
  }

  @SubscribeMessage('lot.unsubscribe')
  async unsubscribe(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { lotId?: string },
  ) {
    const lotId = body?.lotId;

    if (typeof lotId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(lotId)) {
      return { success: false, message: 'ID de lote inválido' };
    }

    await socket.leave(`lot:${lotId}`);

    return { success: true, lotId };
  }

  publishLot(lotId: string, eventType: string, payload: unknown) {
    const eventName = eventType.toLowerCase().replaceAll('_', '.');

    this.server?.emit(eventName, payload);
    this.server?.to(`lot:${lotId}`).emit(eventName, payload);
  }

  publishWalletUpdated(userId: string) {
    this.server?.to(`wallet:${userId}`).emit('wallet.updated');
  }
}
