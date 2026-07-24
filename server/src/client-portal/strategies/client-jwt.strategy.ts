import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

interface ClientJwtPayload {
  quotationId: string;
  accessCode: string;
  type: 'client';
}

@Injectable()
export class ClientJwtStrategy extends PassportStrategy(Strategy, 'client-jwt') {
  constructor(config: ConfigService) {
    const secret = config.get<string>('CLIENT_JWT_SECRET');
    if (!secret) {
      throw new Error('CLIENT_JWT_SECRET is not defined in environment');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: ClientJwtPayload) {
    return {
      quotationId: payload.quotationId,
      accessCode: payload.accessCode,
      type: payload.type,
    };
  }
}
