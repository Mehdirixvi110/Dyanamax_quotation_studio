import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

interface LogParams {
  userId?: string;
  actorType: 'ADMIN' | 'CLIENT' | 'SYSTEM';
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
  metadata?: any;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: LogParams): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: params.userId,
        actorType: params.actorType,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldValue: params.oldValue ?? undefined,
        newValue: params.newValue ?? undefined,
        metadata: params.metadata ?? undefined,
      },
    });
  }

  async findAll(query: AuditLogQueryDto) {
    const { page = 1, limit = 20, entityType, action, dateFrom, dateTo } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (entityType) {
      where.entityType = entityType;
    }
    if (action) {
      where.action = action;
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
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

  async findByEntity(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
