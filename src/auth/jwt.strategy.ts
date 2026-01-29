import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { env } from 'node:process';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    
    super({
      // 1. Onde buscar o token? No cabeçalho "Authorization: Bearer ..."
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 2. Ignorar token expirado? Não (false), se expirou, bloqueia.
      ignoreExpiration: false,
      
      secretOrKey: env.JWT_SECRET || 'default-secret', //
    });
  }

  // Se o token for válido, o Nest roda essa função e coloca o retorno dentro de "request.user"
  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}