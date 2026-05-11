import type { ApiContext } from "../http";
import { defaultCountry, fetchJson, limit, offset, requiredParam, requiredQuery } from "../http";

const APPLE_BASE = "https://itunes.apple.com";

export type AppleSearchOptions = {
  media?: string;
  entity?: string;
  term?: string;
};

export async function appleSearch(
  c: ApiContext,
  options: AppleSearchOptions = {}
) {
  const url = new URL("/search", APPLE_BASE);
  url.searchParams.set("term", options.term || requiredQuery(c));
  url.searchParams.set("country", defaultCountry(c));
  url.searchParams.set("limit", `${limit(c, 200, 200)}`);
  url.searchParams.set("offset", `${offset(c, 0, 5000)}`);

  const media = c.req.query("media") || options.media;
  const entity = c.req.query("entity") || options.entity;
  const explicit = c.req.query("explicit");
  const lang = c.req.query("lang");

  if (media) {
    url.searchParams.set("media", media);
  }
  if (entity) {
    url.searchParams.set("entity", entity);
  }
  if (explicit) {
    url.searchParams.set("explicit", explicit);
  }
  if (lang) {
    url.searchParams.set("lang", lang);
  }

  return fetchJson(c, url);
}

export async function appleLookupById(
  c: ApiContext,
  id: string,
  entity?: string,
  extra: Record<string, string> = {}
) {
  const url = new URL("/lookup", APPLE_BASE);
  url.searchParams.set("id", id);
  url.searchParams.set("country", defaultCountry(c));
  url.searchParams.set("limit", `${limit(c, 200, 200)}`);

  if (entity) {
    url.searchParams.set("entity", entity);
  }
  for (const [key, value] of Object.entries(extra)) {
    url.searchParams.set(key, value);
  }

  return fetchJson(c, url);
}

export async function appleLookup(c: ApiContext, entity?: string) {
  return appleLookupById(c, requiredParam(c, "id"), entity);
}

export async function appleLookupByKey(
  c: ApiContext,
  key: "upc" | "isbn",
  value: string,
  entity?: string
) {
  const url = new URL("/lookup", APPLE_BASE);
  url.searchParams.set(key, value);
  url.searchParams.set("country", defaultCountry(c));
  url.searchParams.set("limit", `${limit(c, 200, 200)}`);
  if (entity) {
    url.searchParams.set("entity", entity);
  }
  return fetchJson(c, url);
}

export async function applePreview(c: ApiContext, id = requiredParam(c, "id")) {
  const data = await appleLookupById(c, id, "song");
  const results = getAppleResults(data);
  const track = results.find((item) => item.previewUrl) || results[0];

  if (!track?.previewUrl) {
    return {
      id,
      previewUrl: null,
      message: "No legal preview URL was returned by Apple/iTunes."
    };
  }

  return {
    id,
    trackName: track.trackName,
    artistName: track.artistName,
    collectionName: track.collectionName,
    previewUrl: track.previewUrl,
    quality: "Apple preview clip, usually AAC/M4A sample quality",
    source: "apple"
  };
}

export function getAppleResults(data: unknown): Array<Record<string, any>> {
  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray((data as { results: unknown }).results)
  ) {
    return (data as { results: Array<Record<string, any>> }).results;
  }
  return [];
}

export function normalizeAppleResults(data: unknown) {
  return getAppleResults(data).map((item) => ({
    source: "apple",
    id: item.trackId || item.collectionId || item.artistId,
    type: item.kind || item.wrapperType,
    title: item.trackName || item.collectionName || item.artistName,
    artist: item.artistName,
    album: item.collectionName,
    previewUrl: item.previewUrl,
    artworkUrl: item.artworkUrl100,
    url: item.trackViewUrl || item.collectionViewUrl || item.artistViewUrl,
    country: item.country,
    explicit: item.trackExplicitness || item.collectionExplicitness
  }));
}
