import { Injectable, NotFoundException } from '@nestjs/common';
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
}
