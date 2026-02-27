import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    // Optionally verify user still exists and is active
    const user = await this.authService.getUserById(payload.sub);

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('User account is not active');
    }

    // Build permissions from DB (fresh on every request), not from JWT
    const permissions = user.role?.permissions
      ?.filter((p) => p.isActive)
      .map((p) => p.name) || [];

    // Return user object with fresh permissions from DB
    return {
      id: payload.sub,
      email: payload.email,
      role: user.role ? { id: user.role.id, name: user.role.name } : undefined,
      permissions,
    };
  }
}
