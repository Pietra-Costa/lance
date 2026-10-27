import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { WalletModule } from './wallet/wallet.module';
import { BidsModule } from './bids/bids.module';
import { LotsModule } from './lots/lots.module';
import { SellerAgreementsModule } from './seller-agreements/seller-agreements.module';
import { SettlementsModule } from './settlements/settlements.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { RealtimeModule } from './realtime/realtime.module';
import { OutboxModule } from './outbox/outbox.module';
import { AuditModule } from './audit/audit.module';
import { MeModule } from './me/me.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    CatalogModule,
    WalletModule,
    BidsModule,
    LotsModule,
    SellerAgreementsModule,
    SettlementsModule,
    ReceiptsModule,
    RealtimeModule,
    OutboxModule,
    AuditModule,
    MeModule,
  ],
})
export class AppModule {}
