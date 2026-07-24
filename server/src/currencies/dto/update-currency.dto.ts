import { IsOptional, IsString, IsBoolean, Length } from 'class-validator';

export class UpdateCurrencyDto {
  @IsOptional()
  @IsString()
  @Length(3, 3)
  code?: string;

  @IsOptional()
  @IsString()
  symbol?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
