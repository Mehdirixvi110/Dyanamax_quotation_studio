import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

enum TaxApplication {
  ON_TOTAL = 'ON_TOTAL',
  ON_LINE_ITEMS = 'ON_LINE_ITEMS',
  NONE = 'NONE',
}

export class CreateQuotationDto {
  @IsString()
  title: string;

  @IsString()
  customerName: string;

  @IsString()
  currencyId: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  customerAddress?: string;

  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  taxPercent?: number;

  @IsOptional()
  @IsEnum(TaxApplication)
  taxApplication?: TaxApplication;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expiryDays?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  termsAndConditions?: string;
}
