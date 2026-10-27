import { Module } from '@nestjs/common';
import { AuctionWorkerService } from './auction-worker.service';
import { SettlementsService } from './settlements.service';
import { OutboxModule } from '../outbox/outbox.module';
@Module({
  imports: [OutboxModule],
  providers: [SettlementsService, AuctionWorkerService],
  exports: [SettlementsService],
})
export class SettlementsModule {}
