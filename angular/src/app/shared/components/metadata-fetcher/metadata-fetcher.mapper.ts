export interface MetadataPayload {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  genres?: string[] | null;
  language?: string | null;
  latest_chapter?: string | null;
  chapter_count?: number | null;
}

export interface MetadataPatchTarget {
  title: string;
  description: string;
  coverUrl: string;
  genres: string;
  language: string;
  latestChapter: string;
  chapterCount: number | null;
}

export type MetadataFormPatch = Partial<MetadataPatchTarget>;

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').trim();
}

export function buildMetadataPatch(metadata: MetadataPayload, current: MetadataPatchTarget): MetadataFormPatch {
  const patch: MetadataFormPatch = {};

  const title = normalizeText(metadata.title);
  if (!current.title.trim() && title) {
    patch.title = title;
  }

  const description = normalizeText(metadata.description);
  if (!current.description.trim() && description) {
    patch.description = description;
  }

  const image = normalizeText(metadata.image);
  if (!current.coverUrl.trim() && image) {
    patch.coverUrl = image;
  }

  const genres = (metadata.genres ?? []).map((genre) => genre.trim()).filter(Boolean);
  if (!current.genres.trim() && genres.length > 0) {
    patch.genres = genres.join(', ');
  }

  const language = normalizeText(metadata.language);
  if (!current.language.trim() && language) {
    patch.language = language;
  }

  const latestChapter = normalizeText(metadata.latest_chapter);
  if (!current.latestChapter.trim() && latestChapter) {
    patch.latestChapter = latestChapter;
  }

  if (current.chapterCount === null && typeof metadata.chapter_count === 'number' && Number.isFinite(metadata.chapter_count)) {
    patch.chapterCount = metadata.chapter_count;
  }

  return patch;
}
