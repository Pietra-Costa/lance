import { IsString, MaxLength, MinLength } from 'class-validator';
export class RefreshDto {
  @IsString() @MinLength(20) @MaxLength(1000) refreshToken!: string;
}
