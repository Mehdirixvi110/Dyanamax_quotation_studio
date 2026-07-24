import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import PDFDocument = require('pdfkit');

@Injectable()
export class PdfService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  async generateQuotationPdf(quotationId: string): Promise<Buffer> {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            rates: true,
          },
        },
        currency: true,
      },
    });

    if (!quotation || quotation.deletedAt) {
      throw new NotFoundException('Quotation not found');
    }

    const settings = await this.settingsService.getSettings();

    return this.buildPdf(quotation, settings);
  }

  private buildPdf(quotation: any, settings: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      const pageWidth = 595.28; // A4 width in points
      const contentWidth = pageWidth - 100; // margins
      const leftMargin = 50;
      const rightEdge = pageWidth - 50;

      // ─── Company Header ───────────────────────────────────────────────
      let y = 50;

      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(settings.companyName || 'Company Name', leftMargin, y, {
          width: contentWidth,
          align: 'center',
        });
      y += 25;

      const contactParts: string[] = [];
      if (settings.companyAddress) contactParts.push(settings.companyAddress);
      if (settings.companyPhone) contactParts.push(settings.companyPhone);
      if (settings.companyEmail) contactParts.push(settings.companyEmail);

      if (contactParts.length > 0) {
        doc
          .fontSize(9)
          .font('Helvetica')
          .text(contactParts.join('  |  '), leftMargin, y, {
            width: contentWidth,
            align: 'center',
          });
        y += 15;
      }

      // Divider line
      y += 10;
      doc.moveTo(leftMargin, y).lineTo(rightEdge, y).lineWidth(1).stroke('#333333');
      y += 20;

      // ─── Quotation Title ──────────────────────────────────────────────
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('QUOTATION', leftMargin, y, {
          width: contentWidth,
          align: 'center',
        });
      y += 30;

      // ─── Reference / Date / Status ────────────────────────────────────
      const refDateY = y;
      doc.fontSize(10).font('Helvetica');

      doc.font('Helvetica-Bold').text('Reference:', leftMargin, refDateY);
      doc
        .font('Helvetica')
        .text(quotation.referenceNumber, leftMargin + 70, refDateY);

      doc.font('Helvetica-Bold').text('Date:', leftMargin + 250, refDateY);
      doc
        .font('Helvetica')
        .text(this.formatDate(quotation.createdAt), leftMargin + 285, refDateY);

      y += 18;

      doc.font('Helvetica-Bold').text('Status:', leftMargin, y);
      doc
        .font('Helvetica')
        .text(this.formatStatus(quotation.status), leftMargin + 70, y);

      doc.font('Helvetica-Bold').text('Expiry:', leftMargin + 250, y);
      doc
        .font('Helvetica')
        .text(
          quotation.expiresAt
            ? this.formatDate(quotation.expiresAt)
            : `${quotation.expiryDays} days`,
          leftMargin + 285,
          y,
        );

      y += 18;

      if (quotation.title) {
        doc.font('Helvetica-Bold').text('Title:', leftMargin, y);
        doc.font('Helvetica').text(quotation.title, leftMargin + 70, y);
        y += 18;
      }

      // Divider
      y += 10;
      doc.moveTo(leftMargin, y).lineTo(rightEdge, y).lineWidth(0.5).stroke('#999999');
      y += 15;

      // ─── Customer Information ─────────────────────────────────────────
      doc.fontSize(11).font('Helvetica-Bold').text('CUSTOMER', leftMargin, y);
      y += 18;
      doc.fontSize(10).font('Helvetica');

      if (quotation.customerName) {
        doc.font('Helvetica-Bold').text('Name:', leftMargin, y);
        doc.font('Helvetica').text(quotation.customerName, leftMargin + 70, y);
        y += 15;
      }
      if (quotation.customerEmail) {
        doc.font('Helvetica-Bold').text('Email:', leftMargin, y);
        doc.font('Helvetica').text(quotation.customerEmail, leftMargin + 70, y);
        y += 15;
      }
      if (quotation.customerPhone) {
        doc.font('Helvetica-Bold').text('Phone:', leftMargin, y);
        doc.font('Helvetica').text(quotation.customerPhone, leftMargin + 70, y);
        y += 15;
      }
      if (quotation.customerAddress) {
        doc.font('Helvetica-Bold').text('Address:', leftMargin, y);
        doc.font('Helvetica').text(quotation.customerAddress, leftMargin + 70, y);
        y += 15;
      }

      // Divider
      y += 10;
      doc.moveTo(leftMargin, y).lineTo(rightEdge, y).lineWidth(0.5).stroke('#999999');
      y += 15;

      // ─── Items Table ──────────────────────────────────────────────────
      const colX = {
        num: leftMargin,
        item: leftMargin + 30,
        unit: leftMargin + 230,
        qty: leftMargin + 280,
        rate: leftMargin + 330,
        total: leftMargin + 410,
      };
      const tableRight = rightEdge;

      // Table header
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('#', colX.num, y, { width: 25 });
      doc.text('Item', colX.item, y, { width: 195 });
      doc.text('Unit', colX.unit, y, { width: 45 });
      doc.text('Qty', colX.qty, y, { width: 45, align: 'right' });
      doc.text('Rate', colX.rate, y, { width: 75, align: 'right' });
      doc.text('Total', colX.total, y, { width: 85, align: 'right' });

      y += 15;
      doc.moveTo(leftMargin, y).lineTo(tableRight, y).lineWidth(0.5).stroke('#333333');
      y += 8;

      // Table rows
      doc.font('Helvetica').fontSize(9);
      const items = quotation.items || [];

      if (items.length === 0) {
        doc.text('No items in this quotation', leftMargin, y, {
          width: contentWidth,
          align: 'center',
        });
        y += 20;
      } else {
        items.forEach((item: any, idx: number) => {
          // Check if we need a new page
          if (y > 700) {
            doc.addPage();
            y = 50;
          }

          const selectedRate = this.getSelectedRate(item);
          const quantity = Number(item.quantity);
          const rate = selectedRate ? Number(selectedRate.rate) : 0;
          const lineTotal = quantity * rate;

          doc.text(String(idx + 1), colX.num, y, { width: 25 });
          doc.text(item.title || '', colX.item, y, { width: 195 });
          doc.text(item.unitName || '', colX.unit, y, { width: 45 });
          doc.text(this.formatNumber(quantity), colX.qty, y, {
            width: 45,
            align: 'right',
          });
          doc.text(this.formatCurrency(rate), colX.rate, y, {
            width: 75,
            align: 'right',
          });
          doc.text(this.formatCurrency(lineTotal), colX.total, y, {
            width: 85,
            align: 'right',
          });

          y += 16;

          // Light row separator
          doc
            .moveTo(leftMargin, y - 3)
            .lineTo(tableRight, y - 3)
            .lineWidth(0.3)
            .stroke('#CCCCCC');
        });
      }

      // Table bottom line
      y += 5;
      doc.moveTo(leftMargin, y).lineTo(tableRight, y).lineWidth(0.5).stroke('#333333');
      y += 15;

      // ─── Financial Summary ────────────────────────────────────────────
      if (y > 680) {
        doc.addPage();
        y = 50;
      }

      const summaryLabelX = leftMargin + 300;
      const summaryValueX = leftMargin + 410;
      const summaryValueWidth = 85;

      const subtotal = Number(quotation.subtotal);
      const discountAmount = Number(quotation.discountAmount);
      const taxAmount = Number(quotation.taxAmount);
      const grandTotal = Number(quotation.grandTotal);

      doc.fontSize(10).font('Helvetica');
      doc.text('Subtotal:', summaryLabelX, y, { width: 100, align: 'right' });
      doc.text(this.formatCurrency(subtotal), summaryValueX, y, {
        width: summaryValueWidth,
        align: 'right',
      });
      y += 18;

      if (discountAmount > 0) {
        doc.text('Discount:', summaryLabelX, y, { width: 100, align: 'right' });
        doc
          .fillColor('#CC0000')
          .text(`-${this.formatCurrency(discountAmount)}`, summaryValueX, y, {
            width: summaryValueWidth,
            align: 'right',
          });
        doc.fillColor('#000000');
        y += 18;
      }

      if (taxAmount > 0) {
        const taxLabel = `Tax (${Number(quotation.taxPercent)}%):`;
        doc.text(taxLabel, summaryLabelX, y, { width: 100, align: 'right' });
        doc.text(this.formatCurrency(taxAmount), summaryValueX, y, {
          width: summaryValueWidth,
          align: 'right',
        });
        y += 18;
      }

      // Grand total separator
      doc
        .moveTo(summaryLabelX, y)
        .lineTo(rightEdge, y)
        .lineWidth(1)
        .stroke('#333333');
      y += 10;

      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('GRAND TOTAL:', summaryLabelX, y, { width: 100, align: 'right' });
      doc.text(this.formatCurrency(grandTotal), summaryValueX, y, {
        width: summaryValueWidth,
        align: 'right',
      });
      y += 30;

      // Currency note
      const currencyCode = quotation.currency?.code || 'PKR';
      doc
        .fontSize(8)
        .font('Helvetica')
        .text(`All amounts in ${currencyCode}`, summaryLabelX, y, {
          width: summaryValueWidth + 100,
          align: 'right',
        });
      y += 25;

      // ─── Terms & Conditions ───────────────────────────────────────────
      if (y > 650) {
        doc.addPage();
        y = 50;
      }

      const terms = quotation.termsAndConditions || settings.termsAndConditions;
      if (terms) {
        doc
          .moveTo(leftMargin, y)
          .lineTo(rightEdge, y)
          .lineWidth(0.5)
          .stroke('#999999');
        y += 15;

        doc.fontSize(11).font('Helvetica-Bold').text('Terms & Conditions', leftMargin, y);
        y += 18;

        doc.fontSize(9).font('Helvetica');
        const termsLines = terms.split('\n');
        termsLines.forEach((line: string) => {
          if (y > 740) {
            doc.addPage();
            y = 50;
          }
          doc.text(line.trim(), leftMargin, y, { width: contentWidth });
          y += 13;
        });
        y += 10;
      }

      // ─── Signature Area ───────────────────────────────────────────────
      if (y > 680) {
        doc.addPage();
        y = 50;
      }

      y += 20;
      doc
        .moveTo(leftMargin, y)
        .lineTo(rightEdge, y)
        .lineWidth(0.5)
        .stroke('#999999');
      y += 25;

      doc.fontSize(10).font('Helvetica-Bold').text('Authorized Signature', leftMargin, y);
      y += 30;

      doc
        .moveTo(leftMargin, y)
        .lineTo(leftMargin + 200, y)
        .lineWidth(0.5)
        .stroke('#333333');
      y += 5;

      doc.fontSize(8).font('Helvetica').text('Signature', leftMargin, y);

      // Date line
      doc
        .moveTo(leftMargin + 280, y - 5)
        .lineTo(leftMargin + 420, y - 5)
        .lineWidth(0.5)
        .stroke('#333333');
      doc.text('Date', leftMargin + 280, y);

      y += 25;

      // Stamp placeholder
      doc.fontSize(8).font('Helvetica').text('[Company Stamp]', leftMargin, y);

      // ─── Footer ───────────────────────────────────────────────────────
      const bottomY = 780;
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#666666')
        .text(
          `Generated on ${this.formatDate(new Date())} | ${settings.companyName}`,
          leftMargin,
          bottomY,
          { width: contentWidth, align: 'center' },
        );

      doc.end();
    });
  }

  private getSelectedRate(item: any): any {
    if (!item.rates || item.rates.length === 0) return null;
    const selected = item.rates.find((r: any) => r.isSelected);
    return selected || item.rates[0];
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  private formatNumber(num: number): string {
    if (Number.isInteger(num)) return String(num);
    return num.toFixed(2);
  }

  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private formatStatus(status: string): string {
    return status
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
