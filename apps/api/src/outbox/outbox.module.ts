import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { OutboxService } from './outbox.service';
@Module({
  imports: [RealtimeModule],
  providers: [OutboxService],
  exports: [OutboxService],
})
export class OutboxModule {}
