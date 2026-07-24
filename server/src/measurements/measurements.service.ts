import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { CreateEntryDto, MeasurementType } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class MeasurementsService {
  constructor(private readonly prisma: PrismaService) {}

  // ===== Templates =====

  async createTemplate(dto: CreateTemplateDto) {
    return this.prisma.measurementTemplate.create({
      data: {
        name: dto.name,
        description: dto.description,
        projectReference: dto.projectReference,
      },
    });
  }

  async findAllTemplates(query: PaginationDto) {
    const { page = 1, limit = 20, sortBy = 'createdAt', order = 'desc', search } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { projectReference: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.measurementTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
        include: {
          _count: { select: { entries: true } },
          entries: { select: { computedValue: true, measurementType: true } },
        },
      }),
      this.prisma.measurementTemplate.count({ where }),
    ]);

    const templates = data.map((t) => {
      const totalComputed = t.entries.reduce(
        (sum, e) => sum + Number(e.computedValue),
        0,
      );
      return {
        id: t.id,
        name: t.name,
        description: t.description,
        projectReference: t.projectReference,
        entriesCount: t._count.entries,
        totalComputed,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      };
    });

    return {
      data: templates,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneTemplate(id: string) {
    const template = await this.prisma.measurementTemplate.findFirst({
      where: { id, deletedAt: null },
      include: {
        entries: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!template) {
      throw new NotFoundException(`Measurement template with ID ${id} not found`);
    }
    return template;
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto) {
    await this.findOneTemplate(id);
    return this.prisma.measurementTemplate.update({
      where: { id },
      data: dto,
      include: {
        entries: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async removeTemplate(id: string) {
    await this.findOneTemplate(id);
    return this.prisma.measurementTemplate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ===== Entries =====

  async createEntry(templateId: string, dto: CreateEntryDto) {
    await this.findOneTemplate(templateId);
    const computedValue = this.computeValue(dto);

    return this.prisma.measurementEntry.create({
      data: {
        templateId,
        roomName: dto.roomName,
        measurementType: dto.measurementType,
        length: dto.length,
        width: dto.width,
        height: dto.height,
        quantity: dto.quantity ?? 1,
        deduction: dto.deduction ?? 0,
        computedValue,
        unitName: dto.unitName,
        notes: dto.notes,
      },
    });
  }

  async updateEntry(templateId: string, entryId: string, dto: UpdateEntryDto) {
    await this.findOneTemplate(templateId);

    const existing = await this.prisma.measurementEntry.findFirst({
      where: { id: entryId, templateId },
    });
    if (!existing) {
      throw new NotFoundException(`Entry with ID ${entryId} not found`);
    }

    // Merge existing values with dto for recomputation
    const merged: CreateEntryDto = {
      roomName: dto.roomName ?? existing.roomName,
      measurementType: (dto.measurementType ?? existing.measurementType) as MeasurementType,
      length: dto.length ?? (existing.length ? Number(existing.length) : undefined),
      width: dto.width ?? (existing.width ? Number(existing.width) : undefined),
      height: dto.height ?? (existing.height ? Number(existing.height) : undefined),
      quantity: dto.quantity ?? existing.quantity,
      deduction: dto.deduction ?? Number(existing.deduction),
      unitName: dto.unitName ?? existing.unitName,
      notes: dto.notes !== undefined ? dto.notes : (existing.notes ?? undefined),
    };

    const computedValue = this.computeValue(merged);

    return this.prisma.measurementEntry.update({
      where: { id: entryId },
      data: {
        ...dto,
        computedValue,
      },
    });
  }

  async removeEntry(templateId: string, entryId: string) {
    await this.findOneTemplate(templateId);

    const entry = await this.prisma.measurementEntry.findFirst({
      where: { id: entryId, templateId },
    });
    if (!entry) {
      throw new NotFoundException(`Entry with ID ${entryId} not found`);
    }

    return this.prisma.measurementEntry.delete({
      where: { id: entryId },
    });
  }

  // ===== Computation =====

  private computeValue(dto: CreateEntryDto): number {
    const {
      measurementType,
      length = 0,
      width = 0,
      height = 0,
      quantity = 1,
      deduction = 0,
    } = dto;

    let raw = 0;
    switch (measurementType) {
      case MeasurementType.AREA:
        raw = length * width;
        break;
      case MeasurementType.VOLUME:
        raw = length * width * height;
        break;
      case MeasurementType.LENGTH:
        raw = length;
        break;
      case MeasurementType.PERIMETER:
        raw = 2 * (length + width);
        break;
      case MeasurementType.WEIGHT:
        raw = length;
        break;
      case MeasurementType.CUSTOM:
        raw = length;
        break;
    }

    return raw * quantity - deduction;
  }
}
