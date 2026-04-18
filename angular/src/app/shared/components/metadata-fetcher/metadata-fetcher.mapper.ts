export interface MetadataPayload {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  genres?: string[] | null;
  language?: string | null;
  original_language?: string | null;
  latest_chapter?: string | null;
  last_uploaded_at?: string | null;
  chapter_count?: number | null;
}

export interface MetadataPatchTarget {
  title: string;
  description: string;
  coverUrl: string;
  genres: string;
  language: string;
  originalLanguage: string;
  latestChapter: string;
  lastUploadedAt: string;
  chapterCount: number | null;
}

export type MetadataFormPatch = Partial<MetadataPatchTarget>;

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').trim();
}

function toDatetimeLocalString(value: string | null | undefined): string {
  const normalized = normalizeText(value);
  if (!normalized) {
    return '';
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString().slice(0, 19);
}

export function buildMetadataPatch(metadata: MetadataPayload): MetadataFormPatch {
  const patch: MetadataFormPatch = {};

  const title = normalizeText(metadata.title);
  if (metadata.title !== undefined && metadata.title !== null) {
    patch.title = title;
  }

  const description = normalizeText(metadata.description);
  if (metadata.description !== undefined && metadata.description !== null) {
    patch.description = description;
  }

  const image = normalizeText(metadata.image);
  if (metadata.image !== undefined && metadata.image !== null) {
    patch.coverUrl = image;
  }

  const genres = (metadata.genres ?? []).map((genre) => genre.trim()).filter(Boolean);
  if (metadata.genres !== undefined && metadata.genres !== null) {
    patch.genres = genres.join(', ');
  }

  const language = normalizeText(metadata.language);
  if (metadata.language !== undefined && metadata.language !== null) {
    patch.language = language;
  }

  const originalLanguage = normalizeText(metadata.original_language);
  if (metadata.original_language !== undefined && metadata.original_language !== null) {
    patch.originalLanguage = originalLanguage;
  }

  const latestChapter = normalizeText(metadata.latest_chapter);
  if (metadata.latest_chapter !== undefined && metadata.latest_chapter !== null) {
    patch.latestChapter = latestChapter;
  }

  if (metadata.last_uploaded_at !== undefined && metadata.last_uploaded_at !== null) {
    patch.lastUploadedAt = toDatetimeLocalString(metadata.last_uploaded_at);
  }

  if (typeof metadata.chapter_count === 'number' && Number.isFinite(metadata.chapter_count)) {
    patch.chapterCount = metadata.chapter_count;
  }

  return patch;
}
