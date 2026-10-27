import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MinLength,
} from 'class-validator';

export class CreateLotDto {
  @IsString()
  catalogItemId!: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(1_000_000_000)
  startingPriceCents!: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(1_000_000_000)
  minIncrementCents!: number;

  @Type(() => Date)
  @IsDate()
  startsAt!: Date;

  @Type(() => Date)
  @IsDate()
  endsAt!: Date;
}

export class UpdateLotDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(1_000_000_000)
  startingPriceCents?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(1_000_000_000)
  minIncrementCents?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startsAt?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endsAt?: Date;
}

export class CancelLotDto {
  @IsString()
  @MinLength(5)
  reason!: string;
}
