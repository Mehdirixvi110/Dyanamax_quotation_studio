import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [totalQuotations, totalItems, totalCustomers] = await Promise.all([
      this.prisma.quotation.count({ where: { deletedAt: null } }),
      this.prisma.item.count({ where: { deletedAt: null } }),
      this.prisma.customer.count({ where: { deletedAt: null } }),
    ]);

    const approvedQuotations = await this.prisma.quotation.findMany({
      where: { status: 'APPROVED', deletedAt: null },
      select: { grandTotal: true },
    });

    const totalRevenue = approvedQuotations.reduce(
      (sum, q) => sum + Number(q.grandTotal),
      0,
    );
    const approvedCount = approvedQuotations.length;

    const rejectedCount = await this.prisma.quotation.count({
      where: { status: 'REJECTED', deletedAt: null },
    });

    const pendingCount = await this.prisma.quotation.count({
      where: {
        status: { in: ['DRAFT', 'PUBLISHED', 'CLIENT_VIEWED', 'CLIENT_SUBMITTED'] },
        deletedAt: null,
      },
    });

    const conversionRate =
      totalQuotations > 0
        ? Math.round((approvedCount / totalQuotations) * 1000) / 10
        : 0;

    return {
      totalQuotations,
      totalItems,
      totalCustomers,
      totalRevenue,
      approvedCount,
      rejectedCount,
      pendingCount,
      conversionRate,
    };
  }

  async getMonthlyData() {
    const months: { month: string; quotations: number; revenue: number }[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );

      const quotationCount = await this.prisma.quotation.count({
        where: {
          createdAt: { gte: date, lte: monthEnd },
          deletedAt: null,
        },
      });

      const approved = await this.prisma.quotation.findMany({
        where: {
          approvedAt: { gte: date, lte: monthEnd },
          status: 'APPROVED',
          deletedAt: null,
        },
        select: { grandTotal: true },
      });

      const revenue = approved.reduce(
        (sum, q) => sum + Number(q.grandTotal),
        0,
      );

      months.push({
        month: date.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        quotations: quotationCount,
        revenue,
      });
    }

    return months;
  }

  async getStatusBreakdown() {
    const statuses = [
      'DRAFT',
      'PUBLISHED',
      'CLIENT_VIEWED',
      'CLIENT_SUBMITTED',
      'APPROVED',
      'REJECTED',
      'EXPIRED',
      'ARCHIVED',
    ] as const;

    const breakdown: { status: string; count: number }[] = [];

    for (const status of statuses) {
      const count = await this.prisma.quotation.count({
        where: { status, deletedAt: null },
      });
      if (count > 0) {
        breakdown.push({ status: status.toLowerCase(), count });
      }
    }

    return breakdown;
  }

  async getTopItems() {
    const items = await this.prisma.quotationItem.groupBy({
      by: ['title'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const result: {
      title: string;
      usageCount: number;
      totalRevenue: number;
    }[] = [];

    for (const item of items) {
      const quotationItems = await this.prisma.quotationItem.findMany({
        where: { title: item.title },
        include: {
          rates: { where: { isSelected: true } },
        },
      });

      let totalRevenue = 0;
      for (const qi of quotationItems) {
        const quantity = Number(qi.quantity);
        const selectedRate = qi.rates.find((r) => r.isSelected);
        if (selectedRate) {
          totalRevenue += quantity * Number(selectedRate.rate);
        }
      }

      result.push({
        title: item.title,
        usageCount: item._count.id,
        totalRevenue: Math.round(totalRevenue),
      });
    }

    return result;
  }

  async getRevenueByCustomer() {
    const customers = await this.prisma.quotation.groupBy({
      by: ['customerName'],
      where: { status: 'APPROVED', deletedAt: null },
      _sum: { grandTotal: true },
      _count: { id: true },
      orderBy: { _sum: { grandTotal: 'desc' } },
      take: 10,
    });

    return customers.map((c) => ({
      customerName: c.customerName,
      quotationCount: c._count.id,
      totalRevenue: Number(c._sum.grandTotal) || 0,
    }));
  }
}
