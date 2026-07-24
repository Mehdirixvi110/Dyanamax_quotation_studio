import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RateTiersService } from './rate-tiers.service';
import { CreateRateTierDto } from './dto/create-rate-tier.dto';
import { UpdateRateTierDto } from './dto/update-rate-tier.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('rate-tiers')
@UseGuards(JwtAuthGuard)
export class RateTiersController {
  constructor(private readonly rateTiersService: RateTiersService) {}

  @Post()
  create(@Body() dto: CreateRateTierDto) {
    return this.rateTiersService.create(dto);
  }

  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.rateTiersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rateTiersService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRateTierDto) {
    return this.rateTiersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rateTiersService.remove(id);
  }
}
