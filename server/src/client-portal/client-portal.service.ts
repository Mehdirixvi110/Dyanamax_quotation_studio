import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ClientLoginDto } from './dto/client-login.dto';
import { ClientSelectionsDto } from './dto/client-selections.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ClientPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Login ─────────────────────────────────────────────────────────────────

  async login(dto: ClientLoginDto) {
    // Find client access by access code
    const clientAccess = await this.prisma.clientAccess.findUnique({
      where: { accessCode: dto.accessCode },
      include: {
        quotation: {
          select: {
            id: true,
            title: true,
            referenceNumber: true,
            status: true,
            expiresAt: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!clientAccess) {
      throw new UnauthorizedException('Invalid access code or password');
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      clientAccess.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid access code or password');
    }

    // Check enabled
    if (!clientAccess.isEnabled) {
      throw new UnauthorizedException('Access has been disabled by admin');
    }

    // Check locked
    if (clientAccess.isLocked) {
      throw new UnauthorizedException(
        'Access has been locked. The quotation has already been submitted.',
      );
    }

    // Check quotation not deleted
    if (clientAccess.quotation.deletedAt) {
      throw new UnauthorizedException('This quotation is no longer available');
    }

    // Check expiry
    if (
      clientAccess.quotation.expiresAt &&
      new Date() > clientAccess.quotation.expiresAt
    ) {
      // Update status to expired
      await this.prisma.quotation.update({
        where: { id: clientAccess.quotation.id },
        data: { status: 'EXPIRED' },
      });
      throw new UnauthorizedException('This quotation has expired');
    }

    // Update access tracking
    const updateData: any = {
      lastAccessedAt: new Date(),
      accessCount: { increment: 1 },
    };

    if (!clientAccess.firstAccessedAt) {
      updateData.firstAccessedAt = new Date();
    }

    await this.prisma.clientAccess.update({
      where: { id: clientAccess.id },
      data: updateData,
    });

    // Update quotation status to CLIENT_VIEWED if still PUBLISHED
    if (clientAccess.quotation.status === 'PUBLISHED') {
      await this.prisma.quotation.update({
        where: { id: clientAccess.quotation.id },
        data: { status: 'CLIENT_VIEWED' },
      });
    }

    // Generate client JWT
    const payload = {
      quotationId: clientAccess.quotation.id,
      accessCode: clientAccess.accessCode,
      type: 'client' as const,
    };

    const secret = this.configService.get<string>('CLIENT_JWT_SECRET');
    const expiresIn = this.configService.get<string>('CLIENT_JWT_EXPIRES_IN') || '24h';

    const token = this.jwtService.sign(payload, {
      secret,
      expiresIn: expiresIn as any,
    });

    return {
      token,
      quotation: {
        id: clientAccess.quotation.id,
        title: clientAccess.quotation.title,
        referenceNumber: clientAccess.quotation.referenceNumber,
      },
    };
  }

  // ─── Get Quotation ─────────────────────────────────────────────────────────

  async getQuotation(quotationId: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        currency: true,
        items: {
          where: { isSelected: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            rates: {
              include: {
                rateTier: true,
                brand: true,
              },
            },
          },
        },
        clientAccess: {
          select: {
            firstAccessedAt: true,
            lastAccessedAt: true,
            accessCount: true,
          },
        },
      },
    });

    if (!quotation) {
      throw new BadRequestException('Quotation not found');
    }

    // Get company settings for header
    const companySettings = await this.prisma.companySettings.findFirst();

    return {
      quotation,
      companySettings,
    };
  }

  // ─── Save Selections ───────────────────────────────────────────────────────

  async saveSelections(quotationId: string, dto: ClientSelectionsDto) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { items: { include: { rates: true } } },
    });

    if (!quotation) {
      throw new BadRequestException('Quotation not found');
    }

    if (quotation.status === 'CLIENT_SUBMITTED') {
      throw new ForbiddenException('Quotation has already been submitted');
    }

    // Update selections on quotation items
    for (const selection of dto.selections) {
      // Update the item's isSelected state
      await this.prisma.quotationItem.updateMany({
        where: { id: selection.quotationItemId, quotationId },
        data: { isSelected: selection.isSelected },
      });

      // If a rate is selected, update the rate selection
      if (selection.selectedRateId) {
        // Deselect all rates for this item first
        await this.prisma.quotationItemRate.updateMany({
          where: { quotationItemId: selection.quotationItemId },
          data: { isSelected: false },
        });

        // Select the chosen rate
        await this.prisma.quotationItemRate.updateMany({
          where: {
            id: selection.selectedRateId,
            quotationItemId: selection.quotationItemId,
          },
          data: { isSelected: true },
        });
      }
    }

    // Recalculate totals
    await this.recalculateTotals(quotationId);

    // Return updated quotation with totals
    const updated = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
      select: {
        subtotal: true,
        discountAmount: true,
        taxAmount: true,
        grandTotal: true,
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            rates: { include: { rateTier: true, brand: true } },
          },
        },
      },
    });

    return updated;
  }

  // ─── Submit Quotation ──────────────────────────────────────────────────────

  async submit(quotationId: string, accessCode: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { items: { include: { rates: true } } },
    });

    if (!quotation) {
      throw new BadRequestException('Quotation not found');
    }

    // Client can re-submit until admin approves/rejects
    if (quotation.status === 'APPROVED' || quotation.status === 'REJECTED') {
      throw new ForbiddenException('Quotation has already been finalized by admin');
    }

    // Save final selections to client_selections table
    const selectedItems = quotation.items.filter((item) => item.isSelected);

    // Clear existing client selections
    await this.prisma.clientSelection.deleteMany({
      where: { quotationId },
    });

    // Create new client selections
    for (const item of selectedItems) {
      const selectedRate = item.rates.find((r) => r.isSelected);

      await this.prisma.clientSelection.create({
        data: {
          quotationId,
          quotationItemId: item.id,
          quotationItemRateId: selectedRate?.id || null,
          isItemSelected: true,
        },
      });
    }

    // Update quotation status
    await this.prisma.quotation.update({
      where: { id: quotationId },
      data: {
        status: 'CLIENT_SUBMITTED',
        submittedAt: new Date(),
      },
    });

    // Do NOT lock client access — client can re-submit until admin finalizes

    return {
      message: 'Quotation submitted successfully',
      submittedAt: new Date(),
    };
  }

  // ─── Recalculate Totals ────────────────────────────────────────────────────

  private async recalculateTotals(quotationId: string): Promise<void> {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        items: { include: { rates: true } },
      },
    });

    if (!quotation) return;

    let subtotal = 0;

    for (const item of quotation.items) {
      if (!item.isSelected) continue;

      const selectedRate = item.rates.find((r) => r.isSelected);
      const rateToUse = selectedRate || item.rates[0];

      if (rateToUse) {
        const lineTotal = Number(rateToUse.rate) * Number(item.quantity);
        subtotal += lineTotal;
      }
    }

    let discountAmount = 0;
    if (quotation.discountType === 'PERCENTAGE') {
      discountAmount = subtotal * Number(quotation.discountValue) / 100;
    } else if (quotation.discountType === 'FIXED') {
      discountAmount = Number(quotation.discountValue);
    }

    const afterDiscount = subtotal - discountAmount;

    let taxAmount = 0;
    if (quotation.taxApplication === 'ON_TOTAL') {
      taxAmount = afterDiscount * Number(quotation.taxPercent) / 100;
    } else if (quotation.taxApplication === 'ON_LINE_ITEMS') {
      taxAmount = subtotal * Number(quotation.taxPercent) / 100;
    }

    const grandTotal = afterDiscount + taxAmount;

    await this.prisma.quotation.update({
      where: { id: quotationId },
      data: {
        subtotal,
        discountAmount,
        taxAmount,
        grandTotal,
      },
    });
  }
}
