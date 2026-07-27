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
            rates: { include: { rateTier: true, brand: true } },
          },
        },
        currency: true,
      },
    });

    if (!quotation || quotation.deletedAt) {
      throw new NotFoundException('Quotation not found');
    }

    const settings = await this.settingsService.getSettings();
    const rateTiers = await this.prisma.rateTier.findMany({ orderBy: { sortOrder: 'asc' } });

    return this.buildPdf(quotation, settings, rateTiers);
  }

  async generateClientPdf(quotationId: string): Promise<Buffer> {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        items: {
          where: { isSelected: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            rates: { include: { rateTier: true, brand: true } },
          },
        },
        currency: true,
      },
    });

    if (!quotation || quotation.deletedAt) {
      throw new NotFoundException('Quotation not found');
    }

    const settings = await this.settingsService.getSettings();
    return this.buildClientPdf(quotation, settings);
  }

  private buildPdf(quotation: any, settings: any, rateTiers: any[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      const pageWidth = 595.28;
      const leftM = 40;
      const rightEdge = pageWidth - 40;
      const contentWidth = rightEdge - leftM;

      let y = 40;

      // ─── HEADER: Company Info (left) + Logo (right) ───────────────────
      // Company name bold
      doc.fontSize(14).font('Helvetica-Bold').text(settings.companyName || 'Company', leftM, y);
      y += 18;

      doc.fontSize(8).font('Helvetica');
      if (settings.companyAddress) {
        doc.text(`Address: ${settings.companyAddress}`, leftM, y);
        y += 11;
      }
      if (settings.companyPhone) {
        doc.text(`Contact:  ${settings.companyPhone}`, leftM, y);
        y += 11;
      }
      if (settings.companyEmail) {
        doc.text(`Email:    ${settings.companyEmail}`, leftM, y);
        y += 11;
      }

      // Logo (top-right)
      if (settings.logoUrl && settings.logoUrl.startsWith('data:image')) {
        try {
          const logoBuffer = Buffer.from(settings.logoUrl.split(',')[1], 'base64');
          doc.image(logoBuffer, rightEdge - 100, 40, { width: 90, height: 50, fit: [90, 50] });
        } catch { /* ignore logo errors */ }
      }

      y += 10;

      // ─── QUOTE BOX (right side) + CUSTOMER BOX (left side) ────────────
      const boxTop = y;
      const boxHeight = 60;
      const leftBoxWidth = contentWidth * 0.55;
      const rightBoxX = leftM + leftBoxWidth + 10;
      const rightBoxWidth = contentWidth - leftBoxWidth - 10;

      // Customer box (left)
      doc.rect(leftM, boxTop, leftBoxWidth, boxHeight).fillAndStroke('#f5f5f5', '#ddd');
      doc.fillColor('#000');
      doc.fontSize(8).font('Helvetica-Bold').text('Customer', leftM + 5, boxTop + 5);
      doc.fontSize(8).font('Helvetica');
      doc.text(`Name : ${quotation.customerName || ''}`, leftM + 5, boxTop + 18);
      if (quotation.customerAddress) {
        doc.text(`Address : ${quotation.customerAddress}`, leftM + 5, boxTop + 30);
      }
      if (quotation.customerPhone) {
        doc.text(`Contact : ${quotation.customerPhone}`, leftM + 5, boxTop + 42);
      }

      // Quote box (right)
      doc.rect(rightBoxX, boxTop, rightBoxWidth, boxHeight).fillAndStroke('#fff', '#ddd');
      doc.fillColor('#000');
      doc.fontSize(9).font('Helvetica-Bold').text('Quote', rightBoxX + 5, boxTop + 3, { width: rightBoxWidth - 10, align: 'center' });
      doc.fontSize(7).font('Helvetica');
      const qDetails = [
        ['Date:', this.formatDate(quotation.createdAt)],
        ['Quote #', quotation.referenceNumber],
        ['Valid Until', quotation.expiresAt ? this.formatDate(quotation.expiresAt) : `${quotation.expiryDays} days`],
      ];
      let qy = boxTop + 16;
      for (const [label, value] of qDetails) {
        doc.font('Helvetica-Bold').text(label, rightBoxX + 5, qy, { continued: false });
        doc.font('Helvetica').text(value, rightBoxX + 60, qy);
        qy += 12;
      }

      y = boxTop + boxHeight + 20;

      // ─── QUOTATION TITLE ──────────────────────────────────────────────
      doc.fontSize(11).font('Helvetica-Bold').text(
        quotation.title || 'Quotation',
        leftM, y, { width: contentWidth, align: 'center' },
      );
      y += 20;

      // ─── TABLE HEADER ─────────────────────────────────────────────────
      // Columns: Sr | Work Item | Description | Unit | Qty | Rates per tier...
      const tierCount = rateTiers.length;
      const rateColWidth = tierCount > 0 ? Math.min(65, (contentWidth * 0.35) / tierCount) : 65;

      const cols = {
        sr: { x: leftM, w: 20 },
        item: { x: leftM + 22, w: 80 },
        desc: { x: leftM + 104, w: contentWidth - 104 - 30 - 35 - (rateColWidth * tierCount) },
        unit: { x: 0, w: 30 },
        qty: { x: 0, w: 35 },
      };
      cols.desc.w = Math.max(cols.desc.w, 100);
      cols.unit.x = cols.desc.x + cols.desc.w;
      cols.qty.x = cols.unit.x + cols.unit.w;

      const rateStartX = cols.qty.x + cols.qty.w;

      // Draw table header
      const headerH = 25;
      doc.rect(leftM, y, contentWidth, headerH).fillAndStroke('#333', '#333');
      doc.fillColor('#fff').fontSize(7).font('Helvetica-Bold');
      doc.text('Sr.', cols.sr.x + 3, y + 8, { width: cols.sr.w });
      doc.text('Work Item', cols.item.x + 2, y + 8, { width: cols.item.w });
      doc.text('Detailed Description', cols.desc.x + 2, y + 8, { width: cols.desc.w });
      doc.text('Unit', cols.unit.x + 2, y + 8, { width: cols.unit.w });
      doc.text('Qty', cols.qty.x + 2, y + 8, { width: cols.qty.w, align: 'center' });

      for (let i = 0; i < rateTiers.length; i++) {
        const rx = rateStartX + i * rateColWidth;
        doc.text(`Rates (${rateTiers[i].name})`, rx + 2, y + 4, { width: rateColWidth - 4, align: 'center' });
      }

      doc.fillColor('#000');
      y += headerH;

      // ─── TABLE ROWS ───────────────────────────────────────────────────
      const items = quotation.items || [];

      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const quantity = Number(item.quantity);

        // Estimate row height
        const descText = item.description || '';
        const descLines = Math.ceil(descText.length / 50) || 1;
        const rowH = Math.max(30, descLines * 10 + 15);

        // Check page break
        if (y + rowH + 30 > 750) {
          doc.addPage();
          y = 40;
        }

        // Alternating row bg
        if (idx % 2 === 0) {
          doc.rect(leftM, y, contentWidth, rowH).fill('#fafafa');
        }

        doc.fillColor('#000').fontSize(7).font('Helvetica');
        doc.text(String(idx + 1), cols.sr.x + 3, y + 5, { width: cols.sr.w });
        doc.font('Helvetica-Bold').text(item.title, cols.item.x + 2, y + 5, { width: cols.item.w - 4 });
        doc.font('Helvetica').text(descText, cols.desc.x + 2, y + 5, { width: cols.desc.w - 4 });
        doc.text(item.unitName || '', cols.unit.x + 2, y + 5, { width: cols.unit.w });
        doc.text(String(quantity), cols.qty.x + 2, y + 5, { width: cols.qty.w, align: 'center' });

        // Rate per tier
        for (let i = 0; i < rateTiers.length; i++) {
          const rx = rateStartX + i * rateColWidth;
          const rate = item.rates?.find((r: any) => r.rateTierId === rateTiers[i].id);
          if (rate) {
            doc.text(this.formatNum(Number(rate.rate)), rx + 2, y + 5, { width: rateColWidth - 4, align: 'right' });
          }
        }

        y += rowH;

        // Item Total row
        doc.rect(leftM, y, contentWidth, 15).fill('#f0f0f0');
        doc.fillColor('#000').fontSize(7).font('Helvetica-Bold');
        doc.text('Item Total', cols.qty.x - 40, y + 3, { width: 75, align: 'right' });

        for (let i = 0; i < rateTiers.length; i++) {
          const rx = rateStartX + i * rateColWidth;
          const rate = item.rates?.find((r: any) => r.rateTierId === rateTiers[i].id);
          if (rate) {
            const total = quantity * Number(rate.rate);
            doc.text(this.formatNum(total), rx + 2, y + 3, { width: rateColWidth - 4, align: 'right' });
          }
        }
        y += 18;

        // Row separator
        doc.moveTo(leftM, y).lineTo(rightEdge, y).lineWidth(0.3).stroke('#ddd');
        y += 5;
      }

      // ─── CATEGORY WISE TOTAL ──────────────────────────────────────────
      y += 10;
      if (y > 700) { doc.addPage(); y = 40; }

      doc.rect(leftM, y, contentWidth, 18).fill('#f5f5f5');
      doc.fillColor('#000').fontSize(8).font('Helvetica-Bold');
      doc.text('TOTAL', cols.qty.x - 40, y + 4, { width: 75, align: 'right' });

      for (let i = 0; i < rateTiers.length; i++) {
        const rx = rateStartX + i * rateColWidth;
        let tierTotal = 0;
        for (const item of items) {
          const rate = item.rates?.find((r: any) => r.rateTierId === rateTiers[i].id);
          if (rate) {
            tierTotal += Number(item.quantity) * Number(rate.rate);
          }
        }
        doc.text(this.formatNum(tierTotal), rx + 2, y + 4, { width: rateColWidth - 4, align: 'right' });
      }
      y += 25;

      // ─── FINANCIAL SUMMARY ────────────────────────────────────────────
      if (y > 700) { doc.addPage(); y = 40; }

      const subtotal = Number(quotation.subtotal);
      const discountAmount = Number(quotation.discountAmount);
      const taxAmount = Number(quotation.taxAmount);
      const grandTotal = Number(quotation.grandTotal);

      if (discountAmount > 0 || taxAmount > 0) {
        const sumX = rightEdge - 180;
        doc.fontSize(8).font('Helvetica');
        doc.text('Subtotal:', sumX, y, { width: 80, align: 'right' });
        doc.text(this.formatNum(subtotal), sumX + 85, y, { width: 80, align: 'right' });
        y += 14;
        if (discountAmount > 0) {
          doc.text('Discount:', sumX, y, { width: 80, align: 'right' });
          doc.text(`-${this.formatNum(discountAmount)}`, sumX + 85, y, { width: 80, align: 'right' });
          y += 14;
        }
        if (taxAmount > 0) {
          doc.text(`Tax (${Number(quotation.taxPercent)}%):`, sumX, y, { width: 80, align: 'right' });
          doc.text(this.formatNum(taxAmount), sumX + 85, y, { width: 80, align: 'right' });
          y += 14;
        }
        doc.moveTo(sumX, y).lineTo(rightEdge, y).lineWidth(0.5).stroke('#333');
        y += 5;
        doc.font('Helvetica-Bold').fontSize(9);
        doc.text('TOTAL AMOUNT', sumX, y, { width: 80, align: 'right' });
        doc.text(this.formatNum(grandTotal), sumX + 85, y, { width: 80, align: 'right' });
        y += 14;
        doc.fontSize(7).font('Helvetica').text('Exclusive of all taxes', sumX + 85, y, { width: 80, align: 'right' });
        y += 20;
      }

      // ─── TERMS & CONDITIONS ───────────────────────────────────────────
      if (y > 720) { doc.addPage(); y = 40; }

      const terms = quotation.termsAndConditions || settings.termsAndConditions;
      if (terms) {
        doc.moveTo(leftM, y).lineTo(rightEdge, y).lineWidth(0.5).stroke('#E8A838');
        y += 5;
        doc.fontSize(8).font('Helvetica-Bold').text('Terms and conditions:', leftM, y);
        y += 12;
        doc.fontSize(7).font('Helvetica');
        terms.split('\n').forEach((line: string) => {
          if (y > 760) { doc.addPage(); y = 40; }
          doc.text(line.trim(), leftM, y, { width: contentWidth });
          y += 10;
        });
        y += 10;
      }

      // ─── SIGNATURE & STAMP ────────────────────────────────────────────
      if (y > 700) { doc.addPage(); y = 40; }

      // Signature
      if (settings.signatureUrl && settings.signatureUrl.startsWith('data:image')) {
        try {
          const sigBuf = Buffer.from(settings.signatureUrl.split(',')[1], 'base64');
          doc.image(sigBuf, leftM, y, { height: 35, fit: [120, 35] });
        } catch { /* ignore */ }
      }

      // Stamp (right side)
      if (settings.stampUrl && settings.stampUrl.startsWith('data:image')) {
        try {
          const stampBuf = Buffer.from(settings.stampUrl.split(',')[1], 'base64');
          doc.image(stampBuf, rightEdge - 90, y, { height: 40, fit: [80, 40] });
        } catch { /* ignore */ }
      }

      y += 50;

      // ─── FOOTER ───────────────────────────────────────────────────────
      doc.fontSize(7).font('Helvetica').fillColor('#666')
        .text(`If you have any query feel free to contact us`, leftM, y, { width: contentWidth, align: 'center' });
      y += 10;
      doc.font('Helvetica-Bold').fillColor('#333')
        .text(`${settings.companyPhone || ''} | ${settings.companyEmail || ''}`, leftM, y, { width: contentWidth, align: 'center' });

      doc.end();
    });
  }

  private buildClientPdf(quotation: any, settings: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      const pageWidth = 595.28;
      const leftM = 40;
      const rightEdge = pageWidth - 40;
      const contentWidth = rightEdge - leftM;

      let y = 40;

      // ─── HEADER ───────────────────────────────────────────────────────
      doc.fontSize(14).font('Helvetica-Bold').text(settings.companyName || 'Company', leftM, y);
      y += 18;
      doc.fontSize(8).font('Helvetica');
      if (settings.companyAddress) { doc.text(`Address: ${settings.companyAddress}`, leftM, y); y += 11; }
      if (settings.companyPhone) { doc.text(`Contact:  ${settings.companyPhone}`, leftM, y); y += 11; }
      if (settings.companyEmail) { doc.text(`Email:    ${settings.companyEmail}`, leftM, y); y += 11; }

      if (settings.logoUrl && settings.logoUrl.startsWith('data:image')) {
        try {
          const logoBuf = Buffer.from(settings.logoUrl.split(',')[1], 'base64');
          doc.image(logoBuf, rightEdge - 100, 40, { width: 90, height: 50, fit: [90, 50] });
        } catch { /* ignore */ }
      }

      y += 10;

      // ─── CUSTOMER + QUOTE BOX ─────────────────────────────────────────
      const boxTop = y;
      doc.rect(leftM, boxTop, contentWidth * 0.5, 50).fillAndStroke('#f5f5f5', '#ddd');
      doc.fillColor('#000').fontSize(8).font('Helvetica-Bold').text('Customer', leftM + 5, boxTop + 5);
      doc.font('Helvetica').text(`Name : ${quotation.customerName || ''}`, leftM + 5, boxTop + 18);
      if (quotation.customerPhone) doc.text(`Contact : ${quotation.customerPhone}`, leftM + 5, boxTop + 30);

      const qBoxX = leftM + contentWidth * 0.55;
      doc.rect(qBoxX, boxTop, contentWidth * 0.45, 50).fillAndStroke('#fff', '#ddd');
      doc.fillColor('#000').fontSize(9).font('Helvetica-Bold').text('Quote', qBoxX + 5, boxTop + 3);
      doc.fontSize(7).font('Helvetica');
      doc.text(`Date: ${this.formatDate(quotation.createdAt)}`, qBoxX + 5, boxTop + 16);
      doc.text(`Ref: ${quotation.referenceNumber}`, qBoxX + 5, boxTop + 28);
      doc.text(`Valid: ${quotation.expiresAt ? this.formatDate(quotation.expiresAt) : quotation.expiryDays + ' days'}`, qBoxX + 5, boxTop + 40);

      y = boxTop + 60;

      // ─── TITLE ────────────────────────────────────────────────────────
      doc.fontSize(11).font('Helvetica-Bold').text(quotation.title || 'Quotation', leftM, y, { width: contentWidth, align: 'center' });
      y += 25;

      // ─── TABLE: Sr | Work Item | Description | Unit | Qty | Rate | Category | Total
      const colSr = { x: leftM, w: 20 };
      const colItem = { x: leftM + 22, w: 85 };
      const colDesc = { x: leftM + 109, w: 175 };
      const colUnit = { x: leftM + 286, w: 35 };
      const colQty = { x: leftM + 323, w: 30 };
      const colRate = { x: leftM + 355, w: 55 };
      const colTotal = { x: leftM + 412, w: contentWidth - 412 };

      // Header
      const hH = 22;
      doc.rect(leftM, y, contentWidth, hH).fillAndStroke('#333', '#333');
      doc.fillColor('#fff').fontSize(7).font('Helvetica-Bold');
      doc.text('Sr.', colSr.x + 2, y + 6, { width: colSr.w });
      doc.text('Work Item', colItem.x + 2, y + 6, { width: colItem.w });
      doc.text('Description', colDesc.x + 2, y + 6, { width: colDesc.w });
      doc.text('Unit', colUnit.x + 2, y + 6, { width: colUnit.w });
      doc.text('Qty', colQty.x + 2, y + 6, { width: colQty.w, align: 'center' });
      doc.text('Rate', colRate.x + 2, y + 6, { width: colRate.w, align: 'right' });
      doc.text('Total', colTotal.x + 2, y + 6, { width: colTotal.w, align: 'right' });
      doc.fillColor('#000');
      y += hH;

      // Rows
      const items = quotation.items || [];
      let grandTotal = 0;

      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const quantity = Number(item.quantity);

        // Find the SELECTED rate (or first)
        const selectedRate = item.rates?.find((r: any) => r.isSelected) || item.rates?.[0];
        const rate = selectedRate ? Number(selectedRate.rate) : 0;
        const lineTotal = quantity * rate;
        const tierName = selectedRate?.rateTier?.name || 'Standard';
        grandTotal += lineTotal;

        const descText = item.description || '';
        const descLines = Math.ceil(descText.length / 45) || 1;
        const rowH = Math.max(28, descLines * 9 + 14);

        if (y + rowH + 20 > 750) { doc.addPage(); y = 40; }

        if (idx % 2 === 0) doc.rect(leftM, y, contentWidth, rowH).fill('#fafafa');

        doc.fillColor('#000').fontSize(7).font('Helvetica');
        doc.text(String(idx + 1), colSr.x + 2, y + 5, { width: colSr.w });
        doc.font('Helvetica-Bold').text(item.title, colItem.x + 2, y + 5, { width: colItem.w - 4 });
        doc.font('Helvetica').text(descText, colDesc.x + 2, y + 5, { width: colDesc.w - 4 });
        doc.text(item.unitName || '', colUnit.x + 2, y + 5, { width: colUnit.w });
        doc.text(String(quantity), colQty.x + 2, y + 5, { width: colQty.w, align: 'center' });
        doc.text(this.formatNum(rate), colRate.x + 2, y + 5, { width: colRate.w, align: 'right' });
        doc.text(this.formatNum(lineTotal), colTotal.x + 2, y + 5, { width: colTotal.w, align: 'right' });

        y += rowH;

        // Item Total with category name
        doc.rect(leftM, y, contentWidth, 14).fill('#f0f0f0');
        doc.fillColor('#000').fontSize(7).font('Helvetica-Bold');
        doc.text(`Item Total (${tierName})`, colRate.x - 80, y + 3, { width: 135, align: 'right' });
        doc.text(this.formatNum(lineTotal), colTotal.x + 2, y + 3, { width: colTotal.w, align: 'right' });
        y += 17;

        doc.moveTo(leftM, y).lineTo(rightEdge, y).lineWidth(0.2).stroke('#ddd');
        y += 4;
      }

      // ─── GRAND TOTAL ──────────────────────────────────────────────────
      y += 8;
      if (y > 720) { doc.addPage(); y = 40; }

      doc.rect(leftM, y, contentWidth, 18).fill('#f5f5f5');
      doc.fillColor('#000').fontSize(9).font('Helvetica-Bold');
      doc.text('GRAND TOTAL', colRate.x - 80, y + 4, { width: 135, align: 'right' });
      doc.text(this.formatNum(grandTotal), colTotal.x + 2, y + 4, { width: colTotal.w, align: 'right' });
      y += 25;

      // Discount / Tax if applicable
      const discountAmount = Number(quotation.discountAmount);
      const taxAmount = Number(quotation.taxAmount);
      if (discountAmount > 0 || taxAmount > 0) {
        const finalTotal = grandTotal - discountAmount + taxAmount;
        doc.fontSize(8).font('Helvetica');
        if (discountAmount > 0) {
          doc.text(`Discount: -${this.formatNum(discountAmount)}`, colTotal.x - 80, y, { width: colTotal.w + 80, align: 'right' });
          y += 12;
        }
        if (taxAmount > 0) {
          doc.text(`Tax (${Number(quotation.taxPercent)}%): ${this.formatNum(taxAmount)}`, colTotal.x - 80, y, { width: colTotal.w + 80, align: 'right' });
          y += 12;
        }
        doc.font('Helvetica-Bold');
        doc.text(`Net Total: ${this.formatNum(finalTotal)}`, colTotal.x - 80, y, { width: colTotal.w + 80, align: 'right' });
        y += 18;
      }

      doc.fontSize(7).font('Helvetica').text('Exclusive of all taxes', colTotal.x - 40, y, { width: colTotal.w + 40, align: 'right' });
      y += 20;

      // ─── TERMS ────────────────────────────────────────────────────────
      if (y > 700) { doc.addPage(); y = 40; }
      const terms = quotation.termsAndConditions || settings.termsAndConditions;
      if (terms) {
        doc.moveTo(leftM, y).lineTo(rightEdge, y).lineWidth(0.5).stroke('#E8A838');
        y += 5;
        doc.fontSize(8).font('Helvetica-Bold').text('Terms and conditions:', leftM, y);
        y += 12;
        doc.fontSize(7).font('Helvetica');
        terms.split('\n').forEach((line: string) => {
          if (y > 760) { doc.addPage(); y = 40; }
          doc.text(line.trim(), leftM, y, { width: contentWidth });
          y += 10;
        });
        y += 15;
      }

      // ─── SIGNATURE + STAMP ────────────────────────────────────────────
      if (y > 700) { doc.addPage(); y = 40; }
      if (settings.signatureUrl && settings.signatureUrl.startsWith('data:image')) {
        try {
          const sigBuf = Buffer.from(settings.signatureUrl.split(',')[1], 'base64');
          doc.image(sigBuf, leftM, y, { height: 35, fit: [120, 35] });
        } catch { /* ignore */ }
      }
      if (settings.stampUrl && settings.stampUrl.startsWith('data:image')) {
        try {
          const stampBuf = Buffer.from(settings.stampUrl.split(',')[1], 'base64');
          doc.image(stampBuf, rightEdge - 90, y, { height: 40, fit: [80, 40] });
        } catch { /* ignore */ }
      }
      y += 50;

      // Footer
      doc.fontSize(7).font('Helvetica').fillColor('#666')
        .text('If you have any query feel free to contact us', leftM, y, { width: contentWidth, align: 'center' });
      y += 10;
      doc.font('Helvetica-Bold').fillColor('#333')
        .text(`${settings.companyPhone || ''} | ${settings.companyEmail || ''}`, leftM, y, { width: contentWidth, align: 'center' });

      doc.end();
    });
  }

  private formatNum(num: number): string {
    return new Intl.NumberFormat('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
  }

  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' });
  }
}
