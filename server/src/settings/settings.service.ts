import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.companySettings.findFirst();
    if (!settings) {
      settings = await this.prisma.companySettings.create({
        data: {
          companyName: 'My Company',
        },
      });
    }
    return settings;
  }

  async updateSettings(dto: UpdateSettingsDto) {
    const existing = await this.getSettings();
    return this.prisma.companySettings.update({
      where: { id: existing.id },
      data: {
        ...(dto.companyName !== undefined && { companyName: dto.companyName }),
        ...(dto.companyEmail !== undefined && { companyEmail: dto.companyEmail }),
        ...(dto.companyPhone !== undefined && { companyPhone: dto.companyPhone }),
        ...(dto.companyAddress !== undefined && { companyAddress: dto.companyAddress }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.stampUrl !== undefined && { stampUrl: dto.stampUrl }),
        ...(dto.signatureUrl !== undefined && { signatureUrl: dto.signatureUrl }),
        ...(dto.defaultCurrency !== undefined && { defaultCurrency: dto.defaultCurrency }),
        ...(dto.defaultTaxPercent !== undefined && { defaultTaxPercent: dto.defaultTaxPercent }),
        ...(dto.defaultExpiryDays !== undefined && { defaultExpiryDays: dto.defaultExpiryDays }),
        ...(dto.termsAndConditions !== undefined && { termsAndConditions: dto.termsAndConditions }),
      },
    });
  }
}
