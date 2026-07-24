import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('stats')
  getStats() {
    return this.analyticsService.getStats();
  }

  @Get('monthly')
  getMonthlyData() {
    return this.analyticsService.getMonthlyData();
  }

  @Get('status-breakdown')
  getStatusBreakdown() {
    return this.analyticsService.getStatusBreakdown();
  }

  @Get('top-items')
  getTopItems() {
    return this.analyticsService.getTopItems();
  }

  @Get('revenue-by-customer')
  getRevenueByCustomer() {
    return this.analyticsService.getRevenueByCustomer();
  }
}
