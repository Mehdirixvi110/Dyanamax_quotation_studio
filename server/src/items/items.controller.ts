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
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ItemsService } from './items.service';
import { ItemsCsvService } from './items-csv.service';
import { CreateItemDto, CreateItemRateDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsOptional, IsUUID } from 'class-validator';

class ItemsQueryDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

@Controller('items')
@UseGuards(JwtAuthGuard)
export class ItemsController {
  constructor(
    private readonly itemsService: ItemsService,
    private readonly itemsCsvService: ItemsCsvService,
  ) {}

  @Post()
  create(@Body() dto: CreateItemDto) {
    return this.itemsService.create(dto);
  }

  // CSV endpoints — must come BEFORE :id routes
  @Get('template/csv')
  async downloadTemplate(@Res() res: Response) {
    const csv = await this.itemsCsvService.getTemplate();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="items-template.csv"');
    res.send(csv);
  }

  @Get('export/csv')
  async exportCsv(@Res() res: Response) {
    const csv = await this.itemsCsvService.exportItems();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="items-export.csv"');
    res.send(csv);
  }

  @Post('import/csv')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.itemsCsvService.importItems(file.buffer);
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.itemsService.search(q);
  }

  @Get()
  findAll(@Query() query: ItemsQueryDto) {
    return this.itemsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateItemDto) {
    return this.itemsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.itemsService.remove(id);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string) {
    return this.itemsService.duplicate(id);
  }

  // Item Rates sub-resource
  @Get(':id/rates')
  getRates(@Param('id') id: string) {
    return this.itemsService.getRates(id);
  }

  @Post(':id/rates')
  addRate(@Param('id') id: string, @Body() dto: CreateItemRateDto) {
    return this.itemsService.addRate(id, dto);
  }

  @Put(':id/rates/:rateId')
  updateRate(
    @Param('id') id: string,
    @Param('rateId') rateId: string,
    @Body() dto: Partial<CreateItemRateDto>,
  ) {
    return this.itemsService.updateRate(id, rateId, dto);
  }

  @Delete(':id/rates/:rateId')
  removeRate(@Param('id') id: string, @Param('rateId') rateId: string) {
    return this.itemsService.removeRate(id, rateId);
  }
}
