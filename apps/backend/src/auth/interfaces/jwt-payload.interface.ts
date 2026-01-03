export interface JwtPayload {
  sub: number;
  email: string;
  role?: {
    id: number;
    name: string;
  };
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: number;
  sessionId: string;
  iat?: number;
  exp?: number;
}
