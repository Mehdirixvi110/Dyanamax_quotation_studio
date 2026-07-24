import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateItemDto, CreateItemRateDto } from './create-item.dto';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateItemDto extends PartialType(OmitType(CreateItemDto, ['rates'] as const)) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateItemRateDto)
  rates?: CreateItemRateDto[];
}
