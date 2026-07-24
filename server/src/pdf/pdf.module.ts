import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';
import { SettingsModule } from '../settings/settings.module';
import { ClientAuthGuard } from '../client-portal/guards/client-auth.guard';

@Module({
  imports: [SettingsModule],
  controllers: [PdfController],
  providers: [PdfService, ClientAuthGuard],
  exports: [PdfService],
})
export class PdfModule {}
