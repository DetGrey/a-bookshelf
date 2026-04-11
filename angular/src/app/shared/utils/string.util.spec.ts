import { escapeRegex } from './string.util';

describe('escapeRegex', () => {
  it('escapes special regex characters', () => {
    expect(escapeRegex('hello.world*')).toBe('hello\\.world\\*');
    expect(escapeRegex('[test](123)')).toBe('\\[test\\]\\(123\\)');
  });
});