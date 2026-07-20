export const normalizeLanguageName = (value: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const key = trimmed.toLowerCase().replace(/[_-]/g, '');

  const map: Record<string, string> = {
    en: 'English', enus: 'English', eng: 'English',
    es: 'Spanish', esp: 'Spanish', spa: 'Spanish',
    ja: 'Japanese', jp: 'Japanese', jpn: 'Japanese',
    ko: 'Korean', kr: 'Korean', kor: 'Korean',
    zh: 'Chinese', chi: 'Chinese', cn: 'Chinese', zhtw: 'Chinese', zhcn: 'Chinese',
    fr: 'French', fra: 'French', fre: 'French',
    de: 'German', deu: 'German', ger: 'German',
    it: 'Italian', ita: 'Italian',
    pt: 'Portuguese', prt: 'Portuguese', ptbr: 'Portuguese',
    ru: 'Russian', rus: 'Russian',
    vi: 'Vietnamese', vie: 'Vietnamese',
    id: 'Indonesian', ind: 'Indonesian',
    th: 'Thai', tha: 'Thai',
  };

  if (map[key]) return map[key];
  if (/^[a-z]{2,3}$/i.test(key)) return null;
  return trimmed;
};
