import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SellerAgreementsController } from './seller-agreements.controller';
@Module({ imports: [AuthModule], controllers: [SellerAgreementsController] })
export class SellerAgreementsModule {}
