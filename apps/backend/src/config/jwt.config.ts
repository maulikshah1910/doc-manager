import { JwtModuleOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export const getJwtConfig = (
  configService: ConfigService,
): JwtModuleOptions => {
  const expiresIn = configService.get('JWT_ACCESS_TOKEN_EXPIRY', '15m');
  return {
    secret: configService.get<string>('JWT_SECRET'),
    signOptions: {
      expiresIn,
    },
  };
};
