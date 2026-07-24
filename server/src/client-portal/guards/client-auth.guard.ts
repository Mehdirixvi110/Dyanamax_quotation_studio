import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClientAuthGuard extends AuthGuard('client-jwt') {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First, validate the JWT token
    const isValid = await (super.canActivate(context) as Promise<boolean>);
    if (!isValid) {
      return false;
    }

    // Get the user from the request (set by passport)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.type !== 'client') {
      throw new UnauthorizedException('Invalid client token');
    }

    // Check that the quotation still exists and access is not locked
    const clientAccess = await this.prisma.clientAccess.findFirst({
      where: {
        quotationId: user.quotationId,
        accessCode: user.accessCode,
      },
      include: {
        quotation: { select: { id: true, deletedAt: true } },
      },
    });

    if (!clientAccess) {
      throw new UnauthorizedException('Quotation access not found');
    }

    if (clientAccess.quotation.deletedAt) {
      throw new UnauthorizedException('Quotation no longer exists');
    }

    if (clientAccess.isLocked) {
      throw new UnauthorizedException('Access has been locked');
    }

    if (!clientAccess.isEnabled) {
      throw new UnauthorizedException('Access has been disabled');
    }

    return true;
  }
}
