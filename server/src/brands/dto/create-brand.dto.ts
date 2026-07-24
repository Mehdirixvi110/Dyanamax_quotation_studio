import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  rateTierId: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
