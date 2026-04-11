import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ErrorCode } from './models/result.model';

describe('foundation contracts', () => {
  it('defines Result/AppError error code contract', () => {
    expect(ErrorCode.Unknown).toBe('unknown');
    expect(ErrorCode.Validation).toBe('validation');
    expect(ErrorCode.Unauthorized).toBe('unauthorized');
    expect(ErrorCode.Forbidden).toBe('forbidden');
    expect(ErrorCode.NotFound).toBe('not_found');
    expect(ErrorCode.Conflict).toBe('conflict');
    expect(ErrorCode.Network).toBe('network');
  });

  it('uses import-only global styles setup with token files', () => {
    const stylesPath = join(process.cwd(), 'src', 'styles.scss');
    const stylesContent = readFileSync(stylesPath, 'utf8');

    expect(stylesContent).toContain("@use './styles/tokens';");
    expect(stylesContent).toContain("@use './styles/layout';");
    expect(stylesContent).not.toContain('{');
    expect(stylesContent).not.toContain('}');
  });
});
