import { appConfig, initializeAuth } from './app.config';
import { AuthService } from './core/auth/auth.service';
import { SUPABASE_CLIENT } from './core/supabase.token';

type ProviderWithProvide = {
  provide: unknown;
  useFactory?: Function;
};

describe('appConfig bootstrap wiring', () => {
  const objectProviders = (appConfig.providers ?? []).filter(
    (provider) =>
      typeof provider === 'object' &&
      provider !== null &&
      !Array.isArray(provider) &&
      'provide' in provider,
  ) as ProviderWithProvide[];

  it('provides SUPABASE_CLIENT via useFactory', () => {
    const provider = objectProviders.find((item) => item.provide === SUPABASE_CLIENT);

    expect(provider).toBeDefined();
    expect(typeof provider?.useFactory).toBe('function');
  });

  it('initializes auth by calling AuthService.init()', async () => {
    const init = jest.fn().mockResolvedValue(undefined);
    const runner = initializeAuth({ init } as unknown as AuthService);

    await runner();

    expect(init).toHaveBeenCalledTimes(1);
  });
});
