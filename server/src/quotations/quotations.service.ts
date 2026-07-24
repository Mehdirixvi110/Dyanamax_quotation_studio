import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
import * as bcrypt from 'bcrypt';

@Injectable()
export class QuotationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Reference Number Generation ───────────────────────────────────────────

  private async generateReferenceNumber(): Promise<string> {
    const today = new Date();
    const dateStr =
      today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');

    const prefix = `QS-${dateStr}-`;

    const lastQuotation = await this.prisma.quotation.findFirst({
      where: { referenceNumber: { startsWith: prefix } },
      orderBy: { referenceNumber: 'desc' },
    });

    let counter = 1;
    if (lastQuotation) {
      const lastCounter = parseInt(
        lastQuotation.referenceNumber.replace(prefix, ''),
        10,
      );
      if (!isNaN(lastCounter)) {
        counter = lastCounter + 1;
      }
    }

    return `${prefix}${counter.toString().padStart(3, '0')}`;
  }

  // ─── Totals Recalculation ──────────────────────────────────────────────────

  private async recalculateTotals(quotationId: string): Promise<void> {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        items: {
          include: { rates: true },
        },
      },
    });

    if (!quotation) return;

    let subtotal = 0;

    for (const item of quotation.items) {
      if (!item.isSelected) continue;

      const selectedRate = item.rates.find((r) => r.isSelected);
      const rateToUse = selectedRate || item.rates[0];

      if (rateToUse) {
        const lineTotal = Number(rateToUse.rate) * Number(item.quantity);
        subtotal += lineTotal;
      }
    }

    let discountAmount = 0;
    if (quotation.discountType === 'PERCENTAGE') {
      discountAmount = subtotal * Number(quotation.discountValue) / 100;
    } else if (quotation.discountType === 'FIXED') {
      discountAmount = Number(quotation.discountValue);
    }

    const afterDiscount = subtotal - discountAmount;

    let taxAmount = 0;
    if (quotation.taxApplication === 'ON_TOTAL') {
      taxAmount = afterDiscount * Number(quotation.taxPercent) / 100;
    } else if (quotation.taxApplication === 'ON_LINE_ITEMS') {
      // Tax applied on subtotal before discount
      taxAmount = subtotal * Number(quotation.taxPercent) / 100;
    }
    // NONE: taxAmount stays 0

    const grandTotal = afterDiscount + taxAmount;

    await this.prisma.quotation.update({
      where: { id: quotationId },
      data: {
        subtotal,
        discountAmount,
        taxAmount,
        grandTotal,
      },
    });
  }

  // ─── CRUD Operations ──────────────────────────────────────────────────────

  async create(dto: CreateQuotationDto) {
    const referenceNumber = await this.generateReferenceNumber();

    const quotation = await this.prisma.quotation.create({
      data: {
        referenceNumber,
        title: dto.title,
        customerName: dto.customerName,
        currencyId: dto.currencyId,
        customerId: dto.customerId || null,
        customerEmail: dto.customerEmail || null,
        customerPhone: dto.customerPhone || null,
        customerAddress: dto.customerAddress || null,
        discountType: (dto.discountType as any) || null,
        discountValue: dto.discountValue ?? 0,
        taxPercent: dto.taxPercent ?? 0,
        taxApplication: (dto.taxApplication as any) || 'ON_TOTAL',
        expiryDays: dto.expiryDays ?? 15,
        notes: dto.notes || null,
        termsAndConditions: dto.termsAndConditions || null,
        status: 'DRAFT',
      },
      include: {
        customer: true,
        currency: true,
        items: { include: { rates: true } },
      },
    });

    return quotation;
  }

  async findAll(
    query: PaginationDto & {
      status?: string;
      customerId?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc',
      search,
      status,
      customerId,
      dateFrom,
      dateTo,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (status) {
      where.status = status;
    }
    if (customerId) {
      where.customerId = customerId;
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.quotation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
        include: {
          customer: true,
          currency: true,
          clientAccess: {
            select: {
              accessCode: true,
              isEnabled: true,
              isLocked: true,
              accessCount: true,
              lastAccessedAt: true,
            },
          },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.quotation.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const quotation = await this.prisma.quotation.findFirst({
      where: { id, deletedAt: null },
      include: {
        customer: true,
        currency: true,
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            item: true,
            rates: {
              include: {
                rateTier: true,
                brand: true,
              },
            },
          },
        },
        clientAccess: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 5,
        },
      },
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }

    return quotation;
  }

  async update(id: string, dto: UpdateQuotationDto) {
    await this.findOne(id);

    const quotation = await this.prisma.quotation.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.customerName !== undefined && { customerName: dto.customerName }),
        ...(dto.currencyId !== undefined && { currencyId: dto.currencyId }),
        ...(dto.customerId !== undefined && { customerId: dto.customerId || null }),
        ...(dto.customerEmail !== undefined && { customerEmail: dto.customerEmail || null }),
        ...(dto.customerPhone !== undefined && { customerPhone: dto.customerPhone || null }),
        ...(dto.customerAddress !== undefined && { customerAddress: dto.customerAddress || null }),
        ...(dto.discountType !== undefined && { discountType: dto.discountType as any }),
        ...(dto.discountValue !== undefined && { discountValue: dto.discountValue }),
        ...(dto.taxPercent !== undefined && { taxPercent: dto.taxPercent }),
        ...(dto.taxApplication !== undefined && { taxApplication: dto.taxApplication as any }),
        ...(dto.expiryDays !== undefined && { expiryDays: dto.expiryDays }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.termsAndConditions !== undefined && { termsAndConditions: dto.termsAndConditions }),
      },
      include: {
        customer: true,
        currency: true,
        items: { include: { rates: true } },
      },
    });

    await this.recalculateTotals(id);

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.quotation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async duplicate(id: string) {
    const original = await this.findOne(id);
    const referenceNumber = await this.generateReferenceNumber();

    const duplicated = await this.prisma.quotation.create({
      data: {
        referenceNumber,
        title: `${original.title} (Copy)`,
        customerName: original.customerName,
        currencyId: original.currencyId,
        customerId: original.customerId,
        customerEmail: original.customerEmail,
        customerPhone: original.customerPhone,
        customerAddress: original.customerAddress,
        discountType: original.discountType,
        discountValue: original.discountValue,
        taxPercent: original.taxPercent,
        taxApplication: original.taxApplication,
        expiryDays: original.expiryDays,
        notes: original.notes,
        termsAndConditions: original.termsAndConditions,
        status: 'DRAFT',
        items: {
          create: original.items.map((item) => ({
            itemId: item.itemId,
            title: item.title,
            description: item.description,
            unitName: item.unitName,
            quantity: item.quantity,
            sortOrder: item.sortOrder,
            isSelected: item.isSelected,
            rates: {
              create: item.rates.map((r) => ({
                rateTierId: r.rateTierId,
                brandId: r.brandId,
                brandName: r.brandName,
                rate: r.rate,
                isSelected: r.isSelected,
              })),
            },
          })),
        },
      },
      include: {
        customer: true,
        currency: true,
        items: { include: { rates: true } },
      },
    });

    await this.recalculateTotals(duplicated.id);

    return this.findOne(duplicated.id);
  }

  // ─── Quotation Items ──────────────────────────────────────────────────────

  async addItem(quotationId: string, dto: AddQuotationItemDto) {
    const quotation = await this.findOne(quotationId);

    let title = dto.title || '';
    let description = dto.description || null;
    let unitName = dto.unitName || '';
    let quantity = dto.quantity ?? 1;
    let rates = dto.rates || [];

    // If itemId provided, load from library
    if (dto.itemId) {
      const libraryItem = await this.prisma.item.findFirst({
        where: { id: dto.itemId, deletedAt: null },
        include: {
          unit: true,
          rates: { include: { rateTier: true, brand: true } },
        },
      });

      if (!libraryItem) {
        throw new NotFoundException(`Library item with ID ${dto.itemId} not found`);
      }

      title = dto.title || libraryItem.title;
      description = dto.description ?? libraryItem.description;
      unitName = dto.unitName || libraryItem.unit.name;
      quantity = dto.quantity ?? 1;

      if (!dto.rates || dto.rates.length === 0) {
        rates = libraryItem.rates.map((r) => ({
          rateTierId: r.rateTierId,
          brandId: r.brandId || undefined,
          brandName: r.brand?.name || undefined,
          rate: Number(r.rate),
          isSelected: false,
        }));
        // Select the first rate by default
        if (rates.length > 0) {
          rates[0].isSelected = true;
        }
      }
    }

    if (!title) {
      throw new BadRequestException(
        'Title is required when not importing from library',
      );
    }

    const maxSortOrder = await this.prisma.quotationItem.aggregate({
      where: { quotationId },
      _max: { sortOrder: true },
    });

    const newSortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;

    const quotationItem = await this.prisma.quotationItem.create({
      data: {
        quotationId,
        itemId: dto.itemId || null,
        title,
        description,
        unitName: unitName || 'unit',
        quantity,
        sortOrder: newSortOrder,
        isSelected: true,
        measurementEntryId: dto.measurementEntryId || null,
        rates: {
          create: rates.map((r, index) => ({
            rateTierId: r.rateTierId,
            brandId: r.brandId || null,
            brandName: r.brandName || null,
            rate: r.rate,
            isSelected: r.isSelected ?? index === 0,
          })),
        },
      },
      include: {
        rates: { include: { rateTier: true, brand: true } },
      },
    });

    await this.recalculateTotals(quotationId);

    return quotationItem;
  }

  async updateItem(
    quotationId: string,
    itemId: string,
    dto: UpdateQuotationItemDto,
  ) {
    await this.findOne(quotationId);

    const existingItem = await this.prisma.quotationItem.findFirst({
      where: { id: itemId, quotationId },
    });

    if (!existingItem) {
      throw new NotFoundException(
        `Quotation item with ID ${itemId} not found`,
      );
    }

    const updated = await this.prisma.quotationItem.update({
      where: { id: itemId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.unitName !== undefined && { unitName: dto.unitName }),
        ...(dto.quantity !== undefined && { quantity: dto.quantity }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isSelected !== undefined && { isSelected: dto.isSelected }),
        ...(dto.measurementEntryId !== undefined && {
          measurementEntryId: dto.measurementEntryId || null,
        }),
      },
      include: {
        rates: { include: { rateTier: true, brand: true } },
      },
    });

    await this.recalculateTotals(quotationId);

    return updated;
  }

  async removeItem(quotationId: string, itemId: string) {
    await this.findOne(quotationId);

    const existingItem = await this.prisma.quotationItem.findFirst({
      where: { id: itemId, quotationId },
    });

    if (!existingItem) {
      throw new NotFoundException(
        `Quotation item with ID ${itemId} not found`,
      );
    }

    await this.prisma.quotationItem.delete({ where: { id: itemId } });

    await this.recalculateTotals(quotationId);

    return { deleted: true };
  }

  async reorderItems(quotationId: string, dto: ReorderItemsDto) {
    await this.findOne(quotationId);

    await Promise.all(
      dto.items.map((item) =>
        this.prisma.quotationItem.updateMany({
          where: { id: item.id, quotationId },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );

    return this.findOne(quotationId);
  }

  async addItemRate(
    quotationId: string,
    itemId: string,
    dto: AddItemRateDto,
  ) {
    await this.findOne(quotationId);

    const existingItem = await this.prisma.quotationItem.findFirst({
      where: { id: itemId, quotationId },
    });

    if (!existingItem) {
      throw new NotFoundException(
        `Quotation item with ID ${itemId} not found`,
      );
    }

    const rate = await this.prisma.quotationItemRate.create({
      data: {
        quotationItemId: itemId,
        rateTierId: dto.rateTierId,
        brandId: dto.brandId || null,
        brandName: dto.brandName || null,
        rate: dto.rate,
        isSelected: dto.isSelected ?? false,
      },
      include: { rateTier: true, brand: true },
    });

    await this.recalculateTotals(quotationId);

    return rate;
  }

  async removeItemRate(
    quotationId: string,
    itemId: string,
    rateId: string,
  ) {
    await this.findOne(quotationId);

    const rate = await this.prisma.quotationItemRate.findFirst({
      where: { id: rateId, quotationItemId: itemId },
    });

    if (!rate) {
      throw new NotFoundException(
        `Rate with ID ${rateId} not found for item ${itemId}`,
      );
    }

    await this.prisma.quotationItemRate.delete({ where: { id: rateId } });

    await this.recalculateTotals(quotationId);

    return { deleted: true };
  }

  // ─── Quotation Actions ─────────────────────────────────────────────────────

  async publish(quotationId: string, userId: string) {
    const quotation = await this.findOne(quotationId);

    // Generate access code and password
    const accessCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const password = Math.random().toString(36).substring(2, 8);
    const passwordHash = await bcrypt.hash(password, 10);

    // Increment version
    const newVersion = quotation.currentVersion + 1;

    // Create snapshot
    const snapshotData = JSON.parse(JSON.stringify(quotation));

    // Upsert client access
    await this.prisma.clientAccess.upsert({
      where: { quotationId },
      create: {
        quotationId,
        accessCode,
        passwordHash,
        isEnabled: true,
        isLocked: false,
      },
      update: {
        accessCode,
        passwordHash,
        isLocked: false,
        isEnabled: true,
      },
    });

    // Create version snapshot
    await this.prisma.quotationVersion.create({
      data: {
        quotationId,
        versionNumber: newVersion,
        snapshotData,
        publishedBy: userId,
        publishedAt: new Date(),
      },
    });

    // Update quotation status
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + quotation.expiryDays);

    await this.prisma.quotation.update({
      where: { id: quotationId },
      data: {
        status: 'PUBLISHED',
        currentVersion: newVersion,
        publishedAt: now,
        expiresAt,
      },
    });

    return { accessCode, password };
  }

  async approve(quotationId: string) {
    await this.findOne(quotationId);

    return this.prisma.quotation.update({
      where: { id: quotationId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
      },
      include: { customer: true, currency: true },
    });
  }

  async reject(quotationId: string) {
    await this.findOne(quotationId);

    return this.prisma.quotation.update({
      where: { id: quotationId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
      },
      include: { customer: true, currency: true },
    });
  }

  async archive(quotationId: string) {
    await this.findOne(quotationId);

    return this.prisma.quotation.update({
      where: { id: quotationId },
      data: { status: 'ARCHIVED' },
      include: { customer: true, currency: true },
    });
  }

  async revertToVersion(quotationId: string, versionId: string) {
    await this.findOne(quotationId);

    const version = await this.prisma.quotationVersion.findFirst({
      where: { id: versionId, quotationId },
    });

    if (!version) {
      throw new NotFoundException(
        `Version with ID ${versionId} not found for quotation ${quotationId}`,
      );
    }

    const snapshot = version.snapshotData as any;

    // Delete existing items
    await this.prisma.quotationItem.deleteMany({ where: { quotationId } });

    // Recreate items from snapshot
    if (snapshot.items && Array.isArray(snapshot.items)) {
      for (const item of snapshot.items) {
        await this.prisma.quotationItem.create({
          data: {
            quotationId,
            itemId: item.itemId || null,
            title: item.title,
            description: item.description || null,
            unitName: item.unitName,
            quantity: item.quantity,
            sortOrder: item.sortOrder,
            isSelected: item.isSelected,
            rates: {
              create: (item.rates || []).map((r: any) => ({
                rateTierId: r.rateTierId,
                brandId: r.brandId || null,
                brandName: r.brandName || null,
                rate: r.rate,
                isSelected: r.isSelected,
              })),
            },
          },
        });
      }
    }

    // Update quotation to DRAFT with snapshot data
    await this.prisma.quotation.update({
      where: { id: quotationId },
      data: {
        status: 'DRAFT',
        title: snapshot.title,
        customerName: snapshot.customerName,
        discountType: snapshot.discountType,
        discountValue: snapshot.discountValue,
        taxPercent: snapshot.taxPercent,
        taxApplication: snapshot.taxApplication,
        notes: snapshot.notes,
        termsAndConditions: snapshot.termsAndConditions,
        publishedAt: null,
        expiresAt: null,
        submittedAt: null,
        approvedAt: null,
        rejectedAt: null,
      },
    });

    await this.recalculateTotals(quotationId);

    return this.findOne(quotationId);
  }

  async extendExpiry(quotationId: string, dto: ExtendExpiryDto) {
    const quotation = await this.findOne(quotationId);

    if (!quotation.expiresAt) {
      throw new BadRequestException(
        'Quotation has no expiry date to extend',
      );
    }

    const newExpiresAt = new Date(quotation.expiresAt);
    newExpiresAt.setDate(newExpiresAt.getDate() + dto.additionalDays);

    return this.prisma.quotation.update({
      where: { id: quotationId },
      data: { expiresAt: newExpiresAt },
      include: { customer: true, currency: true },
    });
  }

  async updateClientAccess(quotationId: string, dto: ClientAccessUpdateDto) {
    await this.findOne(quotationId);

    const clientAccess = await this.prisma.clientAccess.findUnique({
      where: { quotationId },
    });

    if (!clientAccess) {
      throw new NotFoundException(
        'No client access exists for this quotation. Publish first.',
      );
    }

    const updateData: any = {};

    if (dto.isEnabled !== undefined) {
      updateData.isEnabled = dto.isEnabled;
    }

    if (dto.resetPassword) {
      const newPassword = Math.random().toString(36).substring(2, 8);
      const passwordHash = await bcrypt.hash(newPassword, 10);
      updateData.passwordHash = passwordHash;
      updateData.isLocked = false;

      const updated = await this.prisma.clientAccess.update({
        where: { quotationId },
        data: updateData,
      });

      return {
        ...updated,
        newPassword,
      };
    }

    return this.prisma.clientAccess.update({
      where: { quotationId },
      data: updateData,
    });
  }

  // ─── Versions ──────────────────────────────────────────────────────────────

  async getVersions(quotationId: string) {
    await this.findOne(quotationId);

    return this.prisma.quotationVersion.findMany({
      where: { quotationId },
      orderBy: { versionNumber: 'desc' },
      include: {
        publisher: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  async getVersion(quotationId: string, versionId: string) {
    await this.findOne(quotationId);

    const version = await this.prisma.quotationVersion.findFirst({
      where: { id: versionId, quotationId },
      include: {
        publisher: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!version) {
      throw new NotFoundException(
        `Version with ID ${versionId} not found`,
      );
    }

    return version;
  }
}
