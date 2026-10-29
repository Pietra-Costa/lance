import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateLotDto {
  @IsString()
  catalogItemId!: string;

  /** Categoria do lote, usada nos filtros do catálogo. */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  /** Condições especiais publicadas junto do lote. */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  specialConditions?: string;

  /** Observações do leiloeiro sobre o lote. */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  sellerNotes?: string;

  // ---- Detalhes do item, completáveis quando a fonte externa não fornece ----

  /** Material / técnica (ex.: óleo sobre tela). */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  medium?: string;

  /** Dimensões (ex.: 60 × 80 cm). */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  dimensions?: string;

  /** Autor / atribuição publicada. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  attribution?: string;

  /** Período / ano publicados. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  period?: string;

  /** Condições e direitos da imagem. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageConditions?: string;

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

  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  specialConditions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  sellerNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  medium?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  dimensions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  attribution?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  period?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageConditions?: string;
}

export class CancelLotDto {
  @IsString()
  @MinLength(5)
  reason!: string;
}
