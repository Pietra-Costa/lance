import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: process.env.WEB_ORIGIN?.split(',') ?? false },
})
export class RealtimeGateway {
  @WebSocketServer() server!: Server;
  @SubscribeMessage('lot.subscribe')
  subscribe(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { lotId?: string },
  ) {
    if (body?.lotId && /^[a-zA-Z0-9_-]+$/.test(body.lotId))
      socket.join(`lot:${body.lotId}`);
  }
  publishLot(lotId: string, eventType: string, payload: unknown) {
    this.server
      ?.to(`lot:${lotId}`)
      .emit(eventType.toLowerCase().replaceAll('_', '.'), payload);
  }
}
