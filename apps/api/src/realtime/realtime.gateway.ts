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
  ) {}

  async handleConnection(socket: Socket) {
    const token = socket.handshake.auth?.token;

    if (typeof token !== 'string' || !token) {
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
  subscribe(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { lotId?: string },
  ) {
    if (body?.lotId && /^[a-zA-Z0-9_-]+$/.test(body.lotId)) {
      void socket.join(`lot:${body.lotId}`);
    }
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
