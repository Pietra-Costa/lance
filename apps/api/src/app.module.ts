import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
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
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Rate limit global (padrão: 120 requisições por minuto por IP).
    // Rotas sensíveis sobrescrevem com @Throttle.
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 120,
      },
    ]),
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
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
