import { IsString, IsOptional, IsNumber, IsInt, Min, IsEnum } from 'class-validator';

export enum MeasurementType {
  AREA = 'AREA',
  VOLUME = 'VOLUME',
  LENGTH = 'LENGTH',
  PERIMETER = 'PERIMETER',
  WEIGHT = 'WEIGHT',
  CUSTOM = 'CUSTOM',
}

export class CreateEntryDto {
  @IsString()
  roomName: string;

  @IsEnum(MeasurementType)
  measurementType: MeasurementType;

  @IsOptional()
  @IsNumber()
  length?: number;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deduction?: number;

  @IsString()
  unitName: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
