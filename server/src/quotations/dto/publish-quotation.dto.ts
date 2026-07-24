import { IsOptional, IsInt, IsBoolean, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ExtendExpiryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  additionalDays: number;
}

export class ClientAccessUpdateDto {
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  resetPassword?: boolean;
}
