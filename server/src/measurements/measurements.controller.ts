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
import { MeasurementsService } from './measurements.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('measurements')
@UseGuards(JwtAuthGuard)
export class MeasurementsController {
  constructor(private readonly measurementsService: MeasurementsService) {}

  @Post()
  createTemplate(@Body() dto: CreateTemplateDto) {
    return this.measurementsService.createTemplate(dto);
  }

  @Get()
  findAllTemplates(@Query() query: PaginationDto) {
    return this.measurementsService.findAllTemplates(query);
  }

  @Get(':id')
  findOneTemplate(@Param('id') id: string) {
    return this.measurementsService.findOneTemplate(id);
  }

  @Put(':id')
  updateTemplate(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.measurementsService.updateTemplate(id, dto);
  }

  @Delete(':id')
  removeTemplate(@Param('id') id: string) {
    return this.measurementsService.removeTemplate(id);
  }

  @Post(':id/entries')
  createEntry(@Param('id') id: string, @Body() dto: CreateEntryDto) {
    return this.measurementsService.createEntry(id, dto);
  }

  @Put(':id/entries/:entryId')
  updateEntry(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @Body() dto: UpdateEntryDto,
  ) {
    return this.measurementsService.updateEntry(id, entryId, dto);
  }

  @Delete(':id/entries/:entryId')
  removeEntry(@Param('id') id: string, @Param('entryId') entryId: string) {
    return this.measurementsService.removeEntry(id, entryId);
  }
}
