import { ConfigService } from '@nestjs/config';
import { accessTokenExpiresIn } from './jwt-expires';

describe('accessTokenExpiresIn', () => {
  it('usa valor do env quando definido', () => {
    const config = {
      get: (key: string) => (key === 'JWT_ACCESS_EXPIRES' ? '1h' : undefined),
    } as unknown as ConfigService;
    expect(accessTokenExpiresIn(config)).toBe('1h');
  });

  it('usa 15m quando env não existe', () => {
    const config = {
      get: () => undefined,
    } as unknown as ConfigService;
    expect(accessTokenExpiresIn(config)).toBe('15m');
  });
});
