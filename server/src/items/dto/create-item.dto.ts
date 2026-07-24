import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateItemRateDto {
  @IsUUID()
  rateTierId: string;

  @IsOptional()
  @IsUUID()
  brandId?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  rate: number;
}

export class CreateItemDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  categoryId: string;

  @IsUUID()
  unitId: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateItemRateDto)
  rates?: CreateItemRateDto[];
}
