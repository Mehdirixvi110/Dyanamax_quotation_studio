import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBrandDto) {
    return this.prisma.brand.create({
      data: {
        name: dto.name,
        description: dto.description,
        rateTierId: dto.rateTierId,
        isActive: dto.isActive ?? true,
      },
      include: { rateTier: true },
    });
  }

  async findAll(query: PaginationDto & { rateTierId?: string }) {
    const { page = 1, limit = 20, sortBy = 'createdAt', order = 'desc', search, rateTierId } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (rateTierId) {
      where.rateTierId = rateTierId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
        include: { rateTier: true },
      }),
      this.prisma.brand.count({ where }),
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
    const brand = await this.prisma.brand.findFirst({
      where: { id, deletedAt: null },
      include: { rateTier: true },
    });
    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }
    return brand;
  }

  async update(id: string, dto: UpdateBrandDto) {
    await this.findOne(id);
    return this.prisma.brand.update({
      where: { id },
      data: dto,
      include: { rateTier: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.brand.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
