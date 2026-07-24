import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings() {
    const data = await this.settingsService.getSettings();
    return { success: true, data };
  }

  @Put()
  async updateSettings(@Body() dto: UpdateSettingsDto) {
    const data = await this.settingsService.updateSettings(dto);
    return { success: true, data };
  }
}
