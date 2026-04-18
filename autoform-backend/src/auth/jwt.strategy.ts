import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'une_cle_secrete_tres_complexe_pour_le_pfe_2026',
    });
  }

  async validate(payload: any) {
    if (!payload.id) {
      throw new UnauthorizedException('Token invalide');
    }
    // Ce qui est renvoyé ici sera injecté dans la requête sous `req.user`
    return {
      userId: payload.id,
      email: payload.email,
      role: payload.role,
    };
  }
}
