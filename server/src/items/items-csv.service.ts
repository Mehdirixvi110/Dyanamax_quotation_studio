import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

@Injectable()
export class ItemsCsvService {
  constructor(private readonly prisma: PrismaService) {}

  async getTemplate(): Promise<string> {
    const rateTiers = await this.prisma.rateTier.findMany({ orderBy: { sortOrder: 'asc' } });
    const rateHeaders = rateTiers.map((t) => `${t.name.toLowerCase()}_rate`);

    const headers = ['title', 'description', 'category', 'unit', ...rateHeaders];
    const exampleRow = ['Floor Tiles Installation', 'Supply and fix floor tiles', 'Flooring', 'sq.ft', ...rateTiers.map((_, i) => String((i + 1) * 50))];

    return stringify([headers, exampleRow]);
  }

  async exportItems(): Promise<string> {
    const rateTiers = await this.prisma.rateTier.findMany({ orderBy: { sortOrder: 'asc' } });
    const rateHeaders = rateTiers.map((t) => `${t.name.toLowerCase()}_rate`);
    const headers = ['title', 'description', 'category', 'unit', ...rateHeaders];

    const items = await this.prisma.item.findMany({
      where: { deletedAt: null },
      include: {
        category: true,
        unit: true,
        rates: { include: { rateTier: true } },
      },
      orderBy: { title: 'asc' },
    });

    const rows = items.map((item) => {
      const row: string[] = [
        item.title,
        item.description || '',
        item.category.name,
        item.unit.name,
      ];
      for (const tier of rateTiers) {
        const rate = item.rates.find((r) => r.rateTierId === tier.id);
        row.push(rate ? String(Number(rate.rate)) : '');
      }
      return row;
    });

    return stringify([headers, ...rows]);
  }

  async importItems(csvBuffer: Buffer): Promise<{ created: number; updated: number; errors: string[] }> {
    const content = csvBuffer.toString('utf-8');
    let records: string[][];

    try {
      records = parse(content, { skip_empty_lines: true, trim: true });
    } catch {
      return { created: 0, updated: 0, errors: ['Failed to parse CSV file'] };
    }

    if (records.length < 2) {
      return { created: 0, updated: 0, errors: ['CSV must have a header row and at least one data row'] };
    }

    const headers = records[0].map((h) => h.toLowerCase().trim());
    const dataRows = records.slice(1);

    const titleIdx = headers.indexOf('title');
    const descIdx = headers.indexOf('description');
    const catIdx = headers.indexOf('category');
    const unitIdx = headers.indexOf('unit');

    if (titleIdx === -1 || catIdx === -1 || unitIdx === -1) {
      return { created: 0, updated: 0, errors: ['CSV must have title, category, and unit columns'] };
    }

    // Find rate tier columns
    const rateTiers = await this.prisma.rateTier.findMany({ orderBy: { sortOrder: 'asc' } });
    const rateColumnMap: { tierIdx: number; tierId: string }[] = [];
    for (const tier of rateTiers) {
      const colName = `${tier.name.toLowerCase()}_rate`;
      const idx = headers.indexOf(colName);
      if (idx !== -1) {
        rateColumnMap.push({ tierIdx: idx, tierId: tier.id });
      }
    }

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 2;

      const title = row[titleIdx]?.trim();
      if (!title) {
        errors.push(`Row ${rowNum}: Missing title`);
        continue;
      }

      const description = descIdx >= 0 ? row[descIdx]?.trim() || null : null;
      const categoryName = row[catIdx]?.trim();
      const unitName = row[unitIdx]?.trim();

      if (!categoryName || !unitName) {
        errors.push(`Row ${rowNum}: Missing category or unit`);
        continue;
      }

      try {
        // Find or create category
        let category = await this.prisma.category.findFirst({
          where: { name: { equals: categoryName, mode: 'insensitive' }, deletedAt: null },
        });
        if (!category) {
          category = await this.prisma.category.create({ data: { name: categoryName } });
        }

        // Find or create unit
        let unit = await this.prisma.unit.findFirst({
          where: { name: { equals: unitName, mode: 'insensitive' } },
        });
        if (!unit) {
          unit = await this.prisma.unit.create({ data: { name: unitName } });
        }

        // Build rates
        const rates: { rateTierId: string; rate: number }[] = [];
        for (const rc of rateColumnMap) {
          const val = row[rc.tierIdx]?.trim();
          if (val && !isNaN(Number(val)) && Number(val) > 0) {
            rates.push({ rateTierId: rc.tierId, rate: Number(val) });
          }
        }

        // Check if item exists
        const existing = await this.prisma.item.findFirst({
          where: { title: { equals: title, mode: 'insensitive' }, deletedAt: null },
        });

        if (existing) {
          // Update
          await this.prisma.item.update({
            where: { id: existing.id },
            data: { description, categoryId: category.id, unitId: unit.id },
          });
          // Replace rates
          await this.prisma.itemRate.deleteMany({ where: { itemId: existing.id } });
          if (rates.length > 0) {
            await this.prisma.itemRate.createMany({
              data: rates.map((r) => ({ itemId: existing.id, ...r })),
            });
          }
          updated++;
        } else {
          // Create
          await this.prisma.item.create({
            data: {
              title,
              description,
              categoryId: category.id,
              unitId: unit.id,
              rates: rates.length > 0 ? { create: rates } : undefined,
            },
          });
          created++;
        }
      } catch (err: any) {
        errors.push(`Row ${rowNum}: ${err.message || 'Unknown error'}`);
      }
    }

    return { created, updated, errors };
  }
}
