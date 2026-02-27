import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { Session } from '../entities/session.entity';
import { LoginDto } from './dto/login.dto';
import { JwtPayload, RefreshTokenPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Hash a token using SHA-256 for secure storage.
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['role', 'role.permissions'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }

  async login(loginDto: LoginDto, userAgent?: string, ipAddress?: string) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    // Extract permissions from user's role
    const permissions = user.role?.permissions
      ?.filter((p) => p.isActive)
      .map((p) => p.name) || [];

    // Generate access token
    const accessToken = this.generateAccessToken(user, permissions);

    // Generate refresh token
    const refreshToken = this.generateRefreshToken(user);

    // Store hashed refresh token in sessions table
    const refreshExpiryStr = this.configService.get('JWT_REFRESH_TOKEN_EXPIRY', '7d');
    const expiresAt = this.calculateExpiry(refreshExpiryStr);

    const session = this.sessionRepository.create({
      userId: user.id,
      tokenHash: this.hashToken(refreshToken),
      expiresAt,
      userAgent: userAgent?.substring(0, 500),
      ipAddress: ipAddress?.substring(0, 45),
    });
    await this.sessionRepository.save(session);

    return {
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage,
          role: user.role ? {
            id: user.role.id,
            name: user.role.name,
            displayName: user.role.displayName,
          } : null,
          permissions,
        },
      },
    };
  }

  generateAccessToken(user: User, permissions: string[]): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role ? {
        id: user.role.id,
        name: user.role.name,
      } : undefined,
      permissions,
    };

    return this.jwtService.sign(payload);
  }

  generateRefreshToken(user: User): string {
    const payload: RefreshTokenPayload = {
      sub: user.id,
      sessionId: `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
    };

    const expiresIn = this.configService.get('JWT_REFRESH_TOKEN_EXPIRY', '7d');
    return this.jwtService.sign(payload, {
      expiresIn,
    });
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken);

      // Validate the session in the database
      const tokenHash = this.hashToken(refreshToken);
      const session = await this.sessionRepository.findOne({
        where: {
          tokenHash,
          revokedAt: IsNull(),
        },
      });

      if (!session) {
        throw new UnauthorizedException('Session not found or has been revoked');
      }

      if (session.expiresAt < new Date()) {
        throw new UnauthorizedException('Session has expired');
      }

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: ['role', 'role.permissions'],
      });

      if (!user || user.status !== 'active') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const permissions = user.role?.permissions
        ?.filter((p) => p.isActive)
        .map((p) => p.name) || [];

      const accessToken = this.generateAccessToken(user, permissions);

      return {
        data: {
          accessToken,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Revoke a specific refresh token session.
   */
  async revokeSession(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.sessionRepository.update(
      { tokenHash, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  /**
   * Revoke all active sessions for a user (logout everywhere).
   */
  async revokeAllSessions(userId: number): Promise<void> {
    await this.sessionRepository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async getUserById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'role.permissions'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Calculate expiry date from a duration string like '7d', '24h', '30m'.
   */
  private calculateExpiry(duration: string): Date {
    const now = new Date();
    const match = duration.match(/^(\d+)([dhms])$/);
    if (!match) {
      // Default to 7 days if format is unrecognized
      now.setDate(now.getDate() + 7);
      return now;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'd': now.setDate(now.getDate() + value); break;
      case 'h': now.setHours(now.getHours() + value); break;
      case 'm': now.setMinutes(now.getMinutes() + value); break;
      case 's': now.setSeconds(now.getSeconds() + value); break;
    }

    return now;
  }
}
