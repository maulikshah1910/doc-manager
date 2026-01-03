import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { JwtPayload, RefreshTokenPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

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

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    // Extract permissions from user's role
    const permissions = user.role?.permissions
      ?.filter((p) => p.isActive)
      .map((p) => p.name) || [];

    // Generate access token
    const accessToken = this.generateAccessToken(user, permissions);

    // Generate refresh token
    const refreshToken = this.generateRefreshToken(user);

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
      throw new UnauthorizedException('Invalid refresh token');
    }
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
}
