import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BidsController } from './bids.controller';
import { BidsService } from './bids.service';

@Module({
  imports: [AuthModule],
  controllers: [BidsController],
  providers: [BidsService],
})
export class BidsModule {}
