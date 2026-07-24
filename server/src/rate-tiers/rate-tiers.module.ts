import { Module } from '@nestjs/common';
import { RateTiersService } from './rate-tiers.service';
import { RateTiersController } from './rate-tiers.controller';

@Module({
  controllers: [RateTiersController],
  providers: [RateTiersService],
  exports: [RateTiersService],
})
export class RateTiersModule {}
