import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { SettlementsService } from './settlements.service';
import { OutboxService } from '../outbox/outbox.service';
@Injectable()
export class AuctionWorkerService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  constructor(
    private readonly settlements: SettlementsService,
    private readonly outbox: OutboxService,
  ) {}
  private async run() {
    await this.settlements.reconcile();
    await this.outbox.publishPending();
  }
  onModuleInit() {
    void this.run();
    this.timer = setInterval(() => void this.run(), 1_000);
    this.timer.unref();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}
