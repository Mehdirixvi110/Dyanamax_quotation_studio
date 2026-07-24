import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ClientPortalService } from './client-portal.service';
import { ClientPortalController } from './client-portal.controller';
import { ClientJwtStrategy } from './strategies/client-jwt.strategy';
import { ClientAuthGuard } from './guards/client-auth.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('CLIENT_JWT_SECRET') || 'client-fallback-secret',
        signOptions: { expiresIn: (config.get<string>('CLIENT_JWT_EXPIRES_IN') || '24h') as any },
      }),
    }),
  ],
  controllers: [ClientPortalController],
  providers: [ClientPortalService, ClientJwtStrategy, ClientAuthGuard],
  exports: [ClientPortalService],
})
export class ClientPortalModule {}
