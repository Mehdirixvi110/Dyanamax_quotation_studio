import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClientAuthGuard } from '../client-portal/guards/client-auth.guard';
import { PdfService } from './pdf.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class PdfController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('quotations/:id/pdf')
  @UseGuards(JwtAuthGuard)
  async generateAdminPdf(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
      select: { id: true, referenceNumber: true, deletedAt: true },
    });

    if (!quotation || quotation.deletedAt) {
      throw new NotFoundException('Quotation not found');
    }

    const buffer = await this.pdfService.generateQuotationPdf(id);
    const filename = `quotation-${quotation.referenceNumber}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString(),
    });
    res.end(buffer);
  }

  @Get('client/pdf')
  @UseGuards(ClientAuthGuard)
  async generateClientPdf(
    @Request() req: any,
    @Res() res: Response,
  ): Promise<void> {
    const quotationId = req.user?.quotationId;
    if (!quotationId) {
      throw new NotFoundException('Quotation not found');
    }

    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
      select: { id: true, referenceNumber: true, deletedAt: true },
    });

    if (!quotation || quotation.deletedAt) {
      throw new NotFoundException('Quotation not found');
    }

    const buffer = await this.pdfService.generateClientPdf(quotationId);
    const filename = `quotation-${quotation.referenceNumber}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString(),
    });
    res.end(buffer);
  }
}
