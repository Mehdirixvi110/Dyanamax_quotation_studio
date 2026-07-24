import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';

@Injectable()
export class CurrenciesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.currency.findMany({
      orderBy: { code: 'asc' },
    });
  }

  async create(dto: CreateCurrencyDto) {
    return this.prisma.currency.create({
      data: {
        code: dto.code.toUpperCase(),
        symbol: dto.symbol,
        name: dto.name,
      },
    });
  }

  async update(id: string, dto: UpdateCurrencyDto) {
    const currency = await this.prisma.currency.findUnique({ where: { id } });
    if (!currency) {
      throw new NotFoundException(`Currency with ID ${id} not found`);
    }
    return this.prisma.currency.update({
      where: { id },
      data: {
        ...(dto.code !== undefined && { code: dto.code.toUpperCase() }),
        ...(dto.symbol !== undefined && { symbol: dto.symbol }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(id: string) {
    const currency = await this.prisma.currency.findUnique({ where: { id } });
    if (!currency) {
      throw new NotFoundException(`Currency with ID ${id} not found`);
    }

    const quotationCount = await this.prisma.quotation.count({
      where: { currencyId: id },
    });

    if (quotationCount > 0) {
      throw new BadRequestException('Cannot delete: currency is in use');
    }

    return this.prisma.currency.delete({ where: { id } });
  }
}
