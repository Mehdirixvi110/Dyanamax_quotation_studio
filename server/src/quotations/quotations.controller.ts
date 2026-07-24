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
  Request,
} from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import {
  AddQuotationItemDto,
  UpdateQuotationItemDto,
  ReorderItemsDto,
  AddItemRateDto,
} from './dto/add-quotation-item.dto';
import { ExtendExpiryDto, ClientAccessUpdateDto } from './dto/publish-quotation.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('quotations')
@UseGuards(JwtAuthGuard)
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  @Post()
  create(@Body() dto: CreateQuotationDto) {
    return this.quotationsService.create(dto);
  }

  @Get()
  findAll(
    @Query() query: PaginationDto,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.quotationsService.findAll({
      ...query,
      status,
      customerId,
      dateFrom,
      dateTo,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotationsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateQuotationDto) {
    return this.quotationsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.quotationsService.remove(id);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string) {
    return this.quotationsService.duplicate(id);
  }

  // ─── Items ─────────────────────────────────────────────────────────────────

  @Post(':id/items')
  addItem(@Param('id') id: string, @Body() dto: AddQuotationItemDto) {
    return this.quotationsService.addItem(id, dto);
  }

  @Put(':id/items/reorder')
  reorderItems(@Param('id') id: string, @Body() dto: ReorderItemsDto) {
    return this.quotationsService.reorderItems(id, dto);
  }

  @Put(':id/items/:itemId')
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateQuotationItemDto,
  ) {
    return this.quotationsService.updateItem(id, itemId, dto);
  }

  @Delete(':id/items/:itemId')
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.quotationsService.removeItem(id, itemId);
  }

  @Post(':id/items/:itemId/rates')
  addItemRate(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: AddItemRateDto,
  ) {
    return this.quotationsService.addItemRate(id, itemId, dto);
  }

  @Delete(':id/items/:itemId/rates/:rateId')
  removeItemRate(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Param('rateId') rateId: string,
  ) {
    return this.quotationsService.removeItemRate(id, itemId, rateId);
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

  @Post(':id/publish')
  publish(@Param('id') id: string, @Request() req: any) {
    return this.quotationsService.publish(id, req.user.sub);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.quotationsService.approve(id);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string) {
    return this.quotationsService.reject(id);
  }

  @Post(':id/archive')
  archive(@Param('id') id: string) {
    return this.quotationsService.archive(id);
  }

  @Post(':id/revert/:versionId')
  revertToVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.quotationsService.revertToVersion(id, versionId);
  }

  @Put(':id/extend-expiry')
  extendExpiry(@Param('id') id: string, @Body() dto: ExtendExpiryDto) {
    return this.quotationsService.extendExpiry(id, dto);
  }

  @Put(':id/client-access')
  updateClientAccess(
    @Param('id') id: string,
    @Body() dto: ClientAccessUpdateDto,
  ) {
    return this.quotationsService.updateClientAccess(id, dto);
  }

  // ─── Versions ──────────────────────────────────────────────────────────────

  @Get(':id/versions')
  getVersions(@Param('id') id: string) {
    return this.quotationsService.getVersions(id);
  }

  @Get(':id/versions/:versionId')
  getVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.quotationsService.getVersion(id, versionId);
  }
}
