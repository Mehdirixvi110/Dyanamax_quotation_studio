import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { RateTiersModule } from './rate-tiers/rate-tiers.module';
import { BrandsModule } from './brands/brands.module';
import { UnitsModule } from './units/units.module';
import { ItemsModule } from './items/items.module';
import { CustomersModule } from './customers/customers.module';
import { QuotationsModule } from './quotations/quotations.module';
import { ClientPortalModule } from './client-portal/client-portal.module';
import { SettingsModule } from './settings/settings.module';
import { CurrenciesModule } from './currencies/currencies.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MeasurementsModule } from './measurements/measurements.module';
import { PdfModule } from './pdf/pdf.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AuditLogModule,
    NotificationsModule,
    CategoriesModule,
    RateTiersModule,
    BrandsModule,
    UnitsModule,
    ItemsModule,
    CustomersModule,
    QuotationsModule,
    ClientPortalModule,
    SettingsModule,
    CurrenciesModule,
    MeasurementsModule,
    PdfModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
