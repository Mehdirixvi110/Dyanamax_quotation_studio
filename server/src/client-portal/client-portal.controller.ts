import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ClientPortalService } from './client-portal.service';
import { ClientLoginDto } from './dto/client-login.dto';
import { ClientSelectionsDto } from './dto/client-selections.dto';
import { ClientAuthGuard } from './guards/client-auth.guard';

@Controller('client')
export class ClientPortalController {
  constructor(private readonly clientPortalService: ClientPortalService) {}

  @Post('login')
  login(@Body() dto: ClientLoginDto) {
    return this.clientPortalService.login(dto);
  }

  @Get('quotation')
  @UseGuards(ClientAuthGuard)
  getQuotation(@Request() req: any) {
    return this.clientPortalService.getQuotation(req.user.quotationId);
  }

  @Put('selections')
  @UseGuards(ClientAuthGuard)
  saveSelections(@Request() req: any, @Body() dto: ClientSelectionsDto) {
    return this.clientPortalService.saveSelections(
      req.user.quotationId,
      dto,
    );
  }

  @Post('submit')
  @UseGuards(ClientAuthGuard)
  submit(@Request() req: any) {
    return this.clientPortalService.submit(
      req.user.quotationId,
      req.user.accessCode,
    );
  }
}
