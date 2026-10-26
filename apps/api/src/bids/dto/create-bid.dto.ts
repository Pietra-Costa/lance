import { Type } from 'class-transformer';
import { IsInt, IsPositive, Max } from 'class-validator';

export class CreateBidDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(1000000000)
  amountCents!: number;
}
