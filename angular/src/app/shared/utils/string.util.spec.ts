import { escapeRegex, truncateText } from './string.util';

describe('escapeRegex', () => {
  it('escapes special regex characters', () => {
    expect(escapeRegex('hello.world*')).toBe('hello\\.world\\*');
    expect(escapeRegex('[test](123)')).toBe('\\[test\\]\\(123\\)');
  });
});

describe('truncateText', () => {
  it('returns original text when it is within max words', () => {
    expect(truncateText('One two three', 5)).toBe('One two three');
  });

  it('truncates and appends ellipsis when text exceeds max words', () => {
    expect(truncateText('One two three four five six', 4)).toBe('One two three four…');
  });
});