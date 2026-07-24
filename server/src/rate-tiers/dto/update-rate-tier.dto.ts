import { PartialType } from '@nestjs/mapped-types';
import { CreateRateTierDto } from './create-rate-tier.dto';

export class UpdateRateTierDto extends PartialType(CreateRateTierDto) {}
