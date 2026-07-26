import { Injectable, NotFoundException } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateItemDto) {
    const { rates, ...itemData } = dto;

    const item = await this.prisma.item.create({
      data: {
        title: itemData.title,
        description: itemData.description,
        categoryId: itemData.categoryId,
        unitId: itemData.unitId,
        isActive: itemData.isActive ?? true,
        rates: rates?.length
          ? {
              create: rates.map((r) => ({
                rateTierId: r.rateTierId,
                brandId: r.brandId || null,
                rate: r.rate,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        unit: true,
        rates: {
          include: {
            rateTier: true,
            brand: true,
          },
        },
      },
    });

    return item;
  }

  async findAll(query: PaginationDto & { categoryId?: string }) {
    const { page = 1, limit = 20, sortBy = 'createdAt', order = 'desc', search, categoryId } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.item.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
        include: {
          category: true,
          unit: true,
          rates: {
            include: {
              rateTier: true,
              brand: true,
            },
          },
        },
      }),
      this.prisma.item.count({ where }),
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
    const item = await this.prisma.item.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        unit: true,
        rates: {
          include: {
            rateTier: true,
            brand: true,
          },
        },
      },
    });
    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    return item;
  }

  async update(id: string, dto: UpdateItemDto) {
    await this.findOne(id);

    const { rates, ...itemData } = dto;

    // If rates are provided, replace all existing rates
    if (rates !== undefined) {
      await this.prisma.itemRate.deleteMany({ where: { itemId: id } });
      if (rates.length > 0) {
        await this.prisma.itemRate.createMany({
          data: rates.map((r) => ({
            itemId: id,
            rateTierId: r.rateTierId,
            brandId: r.brandId || null,
            rate: r.rate,
          })),
        });
      }
    }

    const item = await this.prisma.item.update({
      where: { id },
      data: itemData,
      include: {
        category: true,
        unit: true,
        rates: {
          include: {
            rateTier: true,
            brand: true,
          },
        },
      },
    });

    return item;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.item.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async duplicate(id: string) {
    const original = await this.findOne(id);

    const duplicated = await this.prisma.item.create({
      data: {
        title: `${original.title} (Copy)`,
        description: original.description,
        categoryId: original.categoryId,
        unitId: original.unitId,
        isActive: original.isActive,
        rates: {
          create: original.rates.map((r) => ({
            rateTierId: r.rateTierId,
            brandId: r.brandId,
            rate: r.rate,
          })),
        },
      },
      include: {
        category: true,
        unit: true,
        rates: {
          include: {
            rateTier: true,
            brand: true,
          },
        },
      },
    });

    return duplicated;
  }

  async search(q: string) {
    if (!q || q.trim().length === 0) {
      return [];
    }

    const items = await this.prisma.item.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { category: { name: { contains: q, mode: 'insensitive' } } },
        ],
      },
      take: 20,
      orderBy: { title: 'asc' },
      include: {
        category: true,
        unit: true,
        rates: {
          include: {
            rateTier: true,
            brand: true,
          },
        },
      },
    });

    return items;
  }

  // Item Rates sub-resource endpoints
  async getRates(itemId: string) {
    await this.findOne(itemId);
    return this.prisma.itemRate.findMany({
      where: { itemId },
      include: { rateTier: true, brand: true },
    });
  }

  async addRate(itemId: string, data: { rateTierId: string; brandId?: string; rate: number }) {
    await this.findOne(itemId);
    return this.prisma.itemRate.create({
      data: {
        itemId,
        rateTierId: data.rateTierId,
        brandId: data.brandId || null,
        rate: data.rate,
      },
      include: { rateTier: true, brand: true },
    });
  }

  async updateRate(itemId: string, rateId: string, data: { rateTierId?: string; brandId?: string; rate?: number }) {
    await this.findOne(itemId);
    const rate = await this.prisma.itemRate.findFirst({ where: { id: rateId, itemId } });
    if (!rate) {
      throw new NotFoundException(`Rate with ID ${rateId} not found for item ${itemId}`);
    }
    return this.prisma.itemRate.update({
      where: { id: rateId },
      data,
      include: { rateTier: true, brand: true },
    });
  }

  async removeRate(itemId: string, rateId: string) {
    await this.findOne(itemId);
    const rate = await this.prisma.itemRate.findFirst({ where: { id: rateId, itemId } });
    if (!rate) {
      throw new NotFoundException(`Rate with ID ${rateId} not found for item ${itemId}`);
    }
    return this.prisma.itemRate.delete({ where: { id: rateId } });
  }

  // ===== CSV Import/Export =====

  async generateTemplate(): Promise<string> {
    const rateTiers = await this.prisma.rateTier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    const headers = ['title', 'description', 'category', 'unit', ...rateTiers.map((t) => t.name.toLowerCase())];

    const exampleRow = [
      'Floor Tiles Installation',
      'Supply and fix floor tiles',
      'Flooring',
      'sq.ft',
      ...rateTiers.map((_, i) => (i === 0 ? '45' : i === 1 ? '75' : i === 2 ? '120' : '200')),
    ];

    return stringify([headers, exampleRow]);
  }

  async exportCsv(): Promise<string> {
    const rateTiers = await this.prisma.rateTier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    const items = await this.prisma.item.findMany({
      where: { deletedAt: null },
      include: {
        category: true,
        unit: true,
        rates: {
          include: { rateTier: true },
        },
      },
      orderBy: { title: 'asc' },
    });

    const headers = ['title', 'description', 'category', 'unit', ...rateTiers.map((t) => t.name.toLowerCase())];

    const rows = items.map((item) => {
      const rateValues = rateTiers.map((tier) => {
        const itemRate = item.rates.find((r) => r.rateTierId === tier.id);
        return itemRate ? String(itemRate.rate) : '';
      });
      return [
        item.title,
        item.description || '',
        item.category?.name || '',
        item.unit?.name || '',
        ...rateValues,
      ];
    });

    return stringify([headers, ...rows]);
  }

  async importCsv(buffer: Buffer): Promise<{ created: number; updated: number; errors: string[] }> {
    const content = buffer.toString('utf-8');
    let records: string[][];
    try {
      records = parse(content, { skip_empty_lines: true, relax_column_count: true });
    } catch {
      return { created: 0, updated: 0, errors: ['Failed to parse CSV file'] };
    }

    if (records.length < 2) {
      return { created: 0, updated: 0, errors: ['CSV file must have a header row and at least one data row'] };
    }

    const headers = records[0].map((h) => h.trim().toLowerCase());
    const dataRows = records.slice(1);

    // Find required column indices
    const titleIdx = headers.indexOf('title');
    const descIdx = headers.indexOf('description');
    const categoryIdx = headers.indexOf('category');
    const unitIdx = headers.indexOf('unit');

    if (titleIdx === -1 || categoryIdx === -1 || unitIdx === -1) {
      return { created: 0, updated: 0, errors: ['CSV must have title, category, and unit columns'] };
    }

    // Rate tier columns = everything that isn't title/description/category/unit
    const fixedColumns = new Set(['title', 'description', 'category', 'unit']);
    const rateTierColumns: { headerIndex: number; headerName: string }[] = [];
    headers.forEach((h, i) => {
      if (!fixedColumns.has(h) && h.trim() !== '') {
        rateTierColumns.push({ headerIndex: i, headerName: h });
      }
    });

    // Pre-load rate tiers
    const allRateTiers = await this.prisma.rateTier.findMany({ where: { isActive: true } });
    const rateTierMap = new Map(allRateTiers.map((t) => [t.name.toLowerCase(), t]));

    // Cache for categories and units to avoid repeated queries
    const categoryCache = new Map<string, { id: string }>();
    const unitCache = new Map<string, { id: string }>();

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 2; // +2 because of header and 0-index

      const title = row[titleIdx]?.trim();
      if (!title) {
        errors.push(`Row ${rowNum}: missing title`);
        continue;
      }

      const description = descIdx !== -1 ? (row[descIdx]?.trim() || null) : null;
      const categoryName = row[categoryIdx]?.trim();
      const unitName = row[unitIdx]?.trim();

      if (!categoryName) {
        errors.push(`Row ${rowNum}: missing category`);
        continue;
      }
      if (!unitName) {
        errors.push(`Row ${rowNum}: missing unit`);
        continue;
      }

      // Find or create category
      let category = categoryCache.get(categoryName.toLowerCase());
      if (!category) {
        const existing = await this.prisma.category.findFirst({
          where: { name: { equals: categoryName, mode: 'insensitive' }, deletedAt: null },
        });
        if (existing) {
          category = { id: existing.id };
        } else {
          const newCat = await this.prisma.category.create({ data: { name: categoryName } });
          category = { id: newCat.id };
        }
        categoryCache.set(categoryName.toLowerCase(), category);
      }

      // Find or create unit
      let unit = unitCache.get(unitName.toLowerCase());
      if (!unit) {
        const existing = await this.prisma.unit.findFirst({
          where: { name: { equals: unitName, mode: 'insensitive' } },
        });
        if (existing) {
          unit = { id: existing.id };
        } else {
          const newUnit = await this.prisma.unit.create({ data: { name: unitName } });
          unit = { id: newUnit.id };
        }
        unitCache.set(unitName.toLowerCase(), unit);
      }

      // Parse rates
      const rates: { rateTierId: string; rate: number }[] = [];
      for (const col of rateTierColumns) {
        const cellValue = row[col.headerIndex]?.trim();
        if (!cellValue) continue;

        const rateNum = parseFloat(cellValue);
        if (isNaN(rateNum)) {
          errors.push(`Row ${rowNum}: invalid rate value "${cellValue}" for tier "${col.headerName}"`);
          continue;
        }

        const tier = rateTierMap.get(col.headerName.toLowerCase());
        if (!tier) {
          errors.push(`Row ${rowNum}: rate tier "${col.headerName}" not found`);
          continue;
        }

        rates.push({ rateTierId: tier.id, rate: rateNum });
      }

      // Check if item with same title exists
      const existingItem = await this.prisma.item.findFirst({
        where: { title: { equals: title, mode: 'insensitive' }, deletedAt: null },
      });

      try {
        if (existingItem) {
          // Update existing item
          await this.prisma.item.update({
            where: { id: existingItem.id },
            data: {
              description,
              categoryId: category.id,
              unitId: unit.id,
            },
          });

          // Replace rates
          await this.prisma.itemRate.deleteMany({ where: { itemId: existingItem.id } });
          if (rates.length > 0) {
            await this.prisma.itemRate.createMany({
              data: rates.map((r) => ({
                itemId: existingItem.id,
                rateTierId: r.rateTierId,
                rate: r.rate,
              })),
            });
          }
          updated++;
        } else {
          // Create new item
          await this.prisma.item.create({
            data: {
              title,
              description,
              categoryId: category.id,
              unitId: unit.id,
              rates: rates.length > 0
                ? {
                    create: rates.map((r) => ({
                      rateTierId: r.rateTierId,
                      rate: r.rate,
                    })),
                  }
                : undefined,
            },
          });
          created++;
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Row ${rowNum}: ${message}`);
      }
    }

    return { created, updated, errors };
  }
}
