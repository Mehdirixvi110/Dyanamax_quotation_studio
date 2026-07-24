import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SelectionItemDto {
  @IsString()
  quotationItemId: string;

  @IsBoolean()
  isSelected: boolean;

  @IsOptional()
  @IsString()
  selectedRateId?: string;
}

export class ClientSelectionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectionItemDto)
  selections: SelectionItemDto[];
}
