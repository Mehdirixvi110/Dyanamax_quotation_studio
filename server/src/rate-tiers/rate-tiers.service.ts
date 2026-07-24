import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRateTierDto } from './dto/create-rate-tier.dto';
import { UpdateRateTierDto } from './dto/update-rate-tier.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class RateTiersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRateTierDto) {
    return this.prisma.rateTier.create({
      data: {
        name: dto.name,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(query: PaginationDto) {
    const { page = 1, limit = 20, sortBy = 'sortOrder', order = 'asc', search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.rateTier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
        include: { brands: { where: { deletedAt: null } } },
      }),
      this.prisma.rateTier.count({ where }),
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
    const tier = await this.prisma.rateTier.findUnique({
      where: { id },
      include: { brands: { where: { deletedAt: null } } },
    });
    if (!tier) {
      throw new NotFoundException(`Rate tier with ID ${id} not found`);
    }
    return tier;
  }

  async update(id: string, dto: UpdateRateTierDto) {
    await this.findOne(id);
    return this.prisma.rateTier.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.rateTier.delete({
      where: { id },
    });
  }
}
