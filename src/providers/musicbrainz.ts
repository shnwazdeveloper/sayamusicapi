import type { ApiContext } from "../http";
import { fetchJson, limit, offset, requiredParam, requiredQuery } from "../http";

const MB_BASE = "https://musicbrainz.org/ws/2/";

export const mbSearchResources: Record<string, string> = {
  recordings: "recording",
  artists: "artist",
  releases: "release",
  "release-groups": "release-group",
  works: "work",
  labels: "label",
  areas: "area",
  places: "place",
  events: "event",
  instruments: "instrument",
  series: "series",
  urls: "url",
  tags: "tag",
  annotations: "annotation"
};

export const mbLookupResources: Record<string, string> = {
  recordings: "recording",
  artists: "artist",
  releases: "release",
  "release-groups": "release-group",
  works: "work",
  labels: "label",
  areas: "area",
  places: "place",
  events: "event",
  instruments: "instrument",
  series: "series",
  urls: "url"
};

const defaultInc: Record<string, string> = {
  recording: "artists+releases+isrcs+url-rels",
  artist: "aliases+genres+ratings+tags+url-rels",
  release: "artists+labels+recordings+release-groups+media+genres+url-rels",
  "release-group": "artists+genres+ratings+tags+url-rels",
  work: "artists+genres+url-rels",
  label: "aliases+genres+ratings+tags+url-rels",
  area: "aliases",
  place: "aliases+url-rels",
  event: "aliases+ratings+tags+url-rels",
  instrument: "aliases+genres+url-rels",
  series: "aliases+url-rels",
  url: "artist-rels+recording-rels+release-rels+release-group-rels+work-rels"
};

export async function mbSearch(c: ApiContext, resourceKey: string, query?: string) {
  const resource = mbSearchResources[resourceKey];
  if (!resource) {
    throw new Error(`Unsupported MusicBrainz search resource: ${resourceKey}`);
  }

  const url = new URL(resource, MB_BASE);
  url.searchParams.set("query", query || requiredQuery(c));
  url.searchParams.set("limit", `${limit(c, 100, 100)}`);
  url.searchParams.set("offset", `${offset(c, 0, 5000)}`);
  url.searchParams.set("fmt", "json");

  return fetchJson(c, url, { cf: { cacheTtl: 3600, cacheEverything: true } });
}

export async function mbLookup(
  c: ApiContext,
  resourceKey: string,
  id = requiredParam(c, "id"),
  inc?: string
) {
  const resource = mbLookupResources[resourceKey];
  if (!resource) {
    throw new Error(`Unsupported MusicBrainz lookup resource: ${resourceKey}`);
  }

  const url = new URL(`${resource}/${id}`, MB_BASE);
  url.searchParams.set("fmt", "json");
  url.searchParams.set("inc", c.req.query("inc") || inc || defaultInc[resource] || "");

  return fetchJson(c, url, { cf: { cacheTtl: 3600, cacheEverything: true } });
}

export async function mbBrowse(c: ApiContext, resource: string, by: string, id: string) {
  const url = new URL(resource, MB_BASE);
  url.searchParams.set(by, id);
  url.searchParams.set("limit", `${limit(c, 100, 100)}`);
  url.searchParams.set("offset", `${offset(c, 0, 5000)}`);
  url.searchParams.set("fmt", "json");
  const inc = c.req.query("inc");
  if (inc) {
    url.searchParams.set("inc", inc);
  }
  return fetchJson(c, url, { cf: { cacheTtl: 3600, cacheEverything: true } });
}

export async function mbIsrc(c: ApiContext) {
  const isrc = requiredParam(c, "isrc");
  const url = new URL(`isrc/${isrc}`, MB_BASE);
  url.searchParams.set("fmt", "json");
  url.searchParams.set("inc", c.req.query("inc") || "artists+releases+isrcs");
  return fetchJson(c, url, { cf: { cacheTtl: 3600, cacheEverything: true } });
}

export function normalizeMbRecordings(data: unknown) {
  const recordings =
    data &&
    typeof data === "object" &&
    "recordings" in data &&
    Array.isArray((data as { recordings: unknown }).recordings)
      ? (data as { recordings: Array<Record<string, any>> }).recordings
      : [];

  return recordings.map((item) => ({
    source: "musicbrainz",
    id: item.id,
    type: "recording",
    title: item.title,
    artist: item["artist-credit"]?.map((credit: any) => credit.name).join(""),
    firstReleaseDate: item["first-release-date"],
    score: item.score
  }));
}
