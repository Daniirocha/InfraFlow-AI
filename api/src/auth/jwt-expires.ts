import type { ConfigService } from '@nestjs/config';
import type { SignOptions } from 'jsonwebtoken';

/** Env JWT_ACCESS_EXPIRES (ex.: 15m, 1h) tipado para SignOptions.expiresIn. */
export function accessTokenExpiresIn(
  config: ConfigService,
): SignOptions['expiresIn'] {
  return (config.get<string>('JWT_ACCESS_EXPIRES') ??
    '15m') as SignOptions['expiresIn'];
}
