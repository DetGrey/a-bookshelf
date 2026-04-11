import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('foundation guardrail configuration', () => {
  it('enforces strict compiler flags required by architecture', () => {
    const tsconfigPath = join(process.cwd(), 'tsconfig.json');
    const tsconfigRaw = readFileSync(tsconfigPath, 'utf8');
    const tsconfig = JSON.parse(tsconfigRaw.replace(/\/\*[\s\S]*?\*\//g, '')) as {
      compilerOptions: Record<string, unknown>;
      angularCompilerOptions: Record<string, unknown>;
    };

    expect(tsconfig.compilerOptions['strict']).toBe(true);
    expect(tsconfig.compilerOptions['noUncheckedIndexedAccess']).toBe(true);
    expect(tsconfig.compilerOptions['exactOptionalPropertyTypes']).toBe(true);
    expect(tsconfig.angularCompilerOptions['strictTemplates']).toBe(true);
  });

  it('contains ESLint boundaries import rules configuration', () => {
    const eslintPath = join(process.cwd(), 'eslint.config.js');

    expect(existsSync(eslintPath)).toBe(true);

    const eslintConfig = readFileSync(eslintPath, 'utf8');
    expect(eslintConfig).toContain('eslint-plugin-boundaries');
    expect(eslintConfig).toContain('boundaries/dependencies');
  });
});
