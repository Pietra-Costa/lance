import { Type } from 'class-transformer';
import { IsInt, IsPositive, Max } from 'class-validator';

export class CreateDepositDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(100000000)
  amountCents!: number;
}
