import type { ApiContext } from "../http";
import {
  ApiError,
  applyLimit,
  compactObject,
  defaultCountry,
  encodedPath,
  fetchJson,
  requestedLimit,
  requiredParam,
  requiredQuery
} from "../http";

const DEEZER_BASE = "https://api.deezer.com/";
const JIOSAAVN_BASE = "https://www.jiosaavn.com/api.php";
const RADIO_BASE = "https://de1.api.radio-browser.info/json/";
const OPENVERSE_BASE = "https://api.openverse.org/v1/";
const WIKIDATA_BASE = "https://www.wikidata.org/w/api.php";
const LISTENBRAINZ_BASE = "https://api.listenbrainz.org/1/";
const GITHUB_BASE = "https://api.github.com/";
const ODESLI_BASE = "https://api.song.link/v1-alpha.1/links";

function queryOrDefault(c: ApiContext, fallback = "music") {
  return c.req.query("q")?.trim() || fallback;
}

function queryOrRequired(c: ApiContext) {
  return requiredQuery(c);
}

function pathResource(value: string) {
  return value.replace(/-/g, "_");
}

function optionalText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return `${value}`;
    }
  }
  return undefined;
}

function optionalNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function recordValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizedJioSaavnResource(resource: string) {
  const normalized = resource.toLowerCase().replace(/_/g, "-");
  if (normalized === "tracks" || normalized === "track") return "songs";
  if (normalized === "song") return "songs";
  if (normalized === "album") return "albums";
  if (normalized === "artist") return "artists";
  if (normalized === "playlist") return "playlists";
  if (normalized === "show") return "shows";
  if (normalized === "episode") return "episodes";
  return normalized || "all";
}

function jioSaavnCall(resource: string) {
  const normalized = normalizedJioSaavnResource(resource);
  const calls: Record<string, string> = {
    all: "autocomplete.get",
    songs: "search.getResults",
    albums: "search.getAlbumResults",
    artists: "search.getArtistResults",
    playlists: "search.getPlaylistResults"
  };
  return calls[normalized] || calls.all;
}

function jioSaavnSearchUrl(query: string) {
  return `https://www.jiosaavn.com/search/${encodeURIComponent(query)}`;
}

function sanitizeJioSaavnItem(value: unknown, fallbackType: string) {
  const item = recordValue(value);
  const moreInfo = recordValue(item.more_info);
  const type = optionalText(item.type, fallbackType)?.replace(/^track$/, "song");
  const title = optionalText(item.song, item.title, item.name, item.text, item.query);
  const artist = optionalText(
    item.primary_artists,
    moreInfo.primary_artists,
    item.music,
    item.singers,
    moreInfo.singers,
    item.description
  );
  const previewUrl = optionalText(item.media_preview_url, moreInfo.media_preview_url, item.vlink, moreInfo.vlink);

  return compactObject({
    source: "jiosaavn",
    id: optionalText(item.id, item.albumid),
    type,
    title,
    album: optionalText(item.album),
    artist,
    singers: optionalText(item.singers, moreInfo.singers),
    year: optionalText(item.year, moreInfo.year),
    language: optionalText(item.language, moreInfo.language),
    durationSeconds: optionalNumber(item.duration),
    playCount: optionalNumber(item.play_count),
    image: optionalText(item.image),
    officialUrl: optionalText(item.perma_url, item.url),
    albumUrl: optionalText(item.album_url),
    previewUrl,
    copyright: optionalText(item.copyright_text),
    explicit: item.explicit_content === 1 || item.explicit_content === "1",
    hasLyrics: item.has_lyrics === true || item.has_lyrics === "true",
    description: optionalText(item.description, item.subtitle),
    note: previewUrl
      ? "Official preview URL only. Protected/encrypted media fields are intentionally not exposed."
      : "Metadata and official link only. Protected/encrypted media fields are intentionally not exposed."
  });
}

function normalizeJioSaavnPayload(payload: unknown, resource: string) {
  const data = recordValue(payload);
  const normalizedResource = normalizedJioSaavnResource(resource);
  const fallbackType = normalizedResource === "all" ? "item" : normalizedResource.replace(/s$/, "");

  if (Array.isArray(data.results)) {
    const results = data.results.map((item) => sanitizeJioSaavnItem(item, fallbackType));
    return compactObject({
      total: optionalNumber(data.total),
      start: optionalNumber(data.start),
      count: results.length,
      results
    });
  }

  const sections: Record<string, unknown[]> = {};
  const results: unknown[] = [];
  for (const [key, section] of Object.entries(data)) {
    const sectionData = recordValue(section);
    if (!Array.isArray(sectionData.data)) {
      continue;
    }
    const sectionItems = sectionData.data.map((item) => sanitizeJioSaavnItem(item, key.replace(/s$/, "")));
    sections[key] = sectionItems;
    results.push(...sectionItems);
  }

  return {
    count: results.length,
    sections,
    results
  };
}

function legalWebSearchUrl(source: string, query: string) {
  const encoded = encodeURIComponent(query);
  const sourceMap: Record<string, string> = {
    gaana: `https://gaana.com/search/${encoded}`,
    spotify: `https://open.spotify.com/search/${encoded}`,
    soundcloud: `https://soundcloud.com/search?q=${encoded}`,
    bandcamp: `https://bandcamp.com/search?q=${encoded}`,
    "youtube-music": `https://music.youtube.com/search?q=${encoded}`,
    youtube: `https://music.youtube.com/search?q=${encoded}`
  };
  return sourceMap[source] || `https://www.google.com/search?q=${encoded}%20music`;
}

function legalWebLinkSearch(c: ApiContext, source: string, resource: string) {
  const query = queryOrRequired(c);
  const url = legalWebSearchUrl(source, query);
  return {
    endpointAlive: true,
    source,
    resource: resource || "tracks",
    query,
    officialSearchUrl: url,
    note:
      "This source is exposed as an official search-link helper. It does not scrape protected catalogs or bypass provider playback rules.",
    results: [
      {
        source,
        type: resource || "tracks",
        title: `Search ${source} for "${query}"`,
        officialUrl: url
      }
    ]
  };
}

export async function deezerSearch(c: ApiContext, resource: string) {
  const resourceMap: Record<string, string> = {
    all: "search",
    tracks: "search/track",
    songs: "search/track",
    albums: "search/album",
    artists: "search/artist",
    playlists: "search/playlist",
    podcasts: "search/podcast",
    radios: "search/radio",
    users: "search/user"
  };
  const endpoint = resourceMap[resource] || `search/${pathResource(resource)}`;
  const url = new URL(endpoint, DEEZER_BASE);
  url.searchParams.set("q", queryOrRequired(c));
  applyLimit(c, url);
  url.searchParams.set("index", c.req.query("offset") || c.req.query("index") || "0");
  const order = c.req.query("order");
  if (order) {
    url.searchParams.set("order", order);
  }
  return fetchJson(c, url);
}

export async function jioSaavnSearch(c: ApiContext, resource = "all") {
  const query = queryOrRequired(c);
  const normalized = normalizedJioSaavnResource(resource);
  const call = jioSaavnCall(normalized);
  const url = new URL(JIOSAAVN_BASE);
  url.searchParams.set("__call", call);
  url.searchParams.set("_format", "json");
  url.searchParams.set("_marker", "0");
  url.searchParams.set("ctx", "web6dot0");

  if (call === "autocomplete.get") {
    url.searchParams.set("query", query);
  } else {
    url.searchParams.set("q", query);
    url.searchParams.set("cc", defaultCountry(c).toLowerCase());
    const pageValue = c.req.query("page") || c.req.query("p");
    if (pageValue) {
      url.searchParams.set("p", pageValue);
    }
    const limitValue = requestedLimit(c);
    if (limitValue) {
      url.searchParams.set("n", limitValue);
    }
  }

  const upstream = await fetchJson<Record<string, unknown>>(c, url, {
    headers: {
      Accept: "application/json, text/plain, */*",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 SayaMusicAPI/0.1.0"
    },
    cf: { cacheTtl: 900, cacheEverything: true }
  });

  if (recordValue(upstream).upstreamOk === false || recordValue(upstream).message) {
    return {
      endpointAlive: true,
      source: "jiosaavn",
      resource: normalized,
      query,
      officialSearchUrl: jioSaavnSearchUrl(query),
      note:
        "JioSaavn route is alive. Upstream availability can vary, so the official search URL is included as a fallback.",
      upstream
    };
  }

  return {
    endpointAlive: true,
    source: "jiosaavn",
    resource: normalized,
    query,
    officialSearchUrl: jioSaavnSearchUrl(query),
    policy:
      "Search metadata and official preview URLs only. SayaMusicAPI does not expose protected/encrypted full-song media URLs.",
    ...normalizeJioSaavnPayload(upstream, normalized)
  };
}

export function gaanaSearch(c: ApiContext, resource = "tracks") {
  return legalWebLinkSearch(c, "gaana", resource);
}

export async function deezerLookup(c: ApiContext, resource: string) {
  const id = requiredParam(c, "id");
  const connection = c.req.param("connection");
  const normalized = pathResource(resource).replace(/s$/, "");
  const path = connection
    ? `${normalized}/${encodedPath(id)}/${pathResource(connection)}`
    : `${normalized}/${encodedPath(id)}`;
  const url = new URL(path, DEEZER_BASE);
  applyLimit(c, url);
  url.searchParams.set("index", c.req.query("offset") || c.req.query("index") || "0");
  try {
    return await fetchJson(c, url);
  } catch (error) {
    if (connection && error instanceof ApiError && error.status === 404) {
      const fallback = await fetchJson(c, new URL(`${normalized}/${encodedPath(id)}`, DEEZER_BASE));
      return {
        message: `Deezer did not expose the ${connection} connection for this ${resource} item.`,
        resource,
        id,
        connection,
        fallback
      };
    }
    throw error;
  }
}

export async function deezerChart(c: ApiContext) {
  const chartId = c.req.param("id") || "0";
  const connection = c.req.param("connection");
  const path = connection
    ? `chart/${encodedPath(chartId)}/${pathResource(connection)}`
    : `chart/${encodedPath(chartId)}`;
  const url = new URL(path, DEEZER_BASE);
  applyLimit(c, url);
  return fetchJson(c, url);
}

export async function radioBrowserStations(c: ApiContext, selector: string) {
  const q = queryOrDefault(c, "music");
  const requested = requestedLimit(c);
  const selectorMap: Record<string, string> = {
    search: "stations/search",
    "by-name": `stations/byname/${encodedPath(q)}`,
    "by-name-exact": `stations/bynameexact/${encodedPath(q)}`,
    "by-country": `stations/bycountry/${encodedPath(q)}`,
    "by-country-exact": `stations/bycountryexact/${encodedPath(q)}`,
    "by-country-code": `stations/bycountrycodeexact/${encodedPath(q)}`,
    "by-state": `stations/bystate/${encodedPath(q)}`,
    "by-state-exact": `stations/bystateexact/${encodedPath(q)}`,
    "by-language": `stations/bylanguage/${encodedPath(q)}`,
    "by-language-exact": `stations/bylanguageexact/${encodedPath(q)}`,
    "by-tag": `stations/bytag/${encodedPath(q)}`,
    "by-tag-exact": `stations/bytagexact/${encodedPath(q)}`,
    "by-codec": `stations/bycodec/${encodedPath(q)}`,
    "by-codec-exact": `stations/bycodecexact/${encodedPath(q)}`,
    "by-uuid": `stations/byuuid/${encodedPath(q)}`,
    "top-vote": requested ? `stations/topvote/${requested}` : "stations/topvote",
    "top-click": requested ? `stations/topclick/${requested}` : "stations/topclick",
    "last-click": requested ? `stations/lastclick/${requested}` : "stations/lastclick",
    "last-change": requested ? `stations/lastchange/${requested}` : "stations/lastchange"
  };
  const url = new URL(selectorMap[selector] || selectorMap.search, RADIO_BASE);
  if (selector === "search") {
    url.searchParams.set("name", q);
    applyLimit(c, url);
    url.searchParams.set("offset", c.req.query("offset") || "0");
    for (const key of ["country", "countrycode", "language", "tag", "codec", "state"]) {
      const value = c.req.query(key);
      if (value) {
        url.searchParams.set(key, value);
      }
    }
  }
  return fetchJson(c, url);
}

export async function radioBrowserList(c: ApiContext, list: string) {
  const listMap: Record<string, string> = {
    countries: "countries",
    countrycodes: "countrycodes",
    codecs: "codecs",
    states: "states",
    languages: "languages",
    tags: "tags"
  };
  const url = new URL(listMap[list] || list, RADIO_BASE);
  return fetchJson(c, url);
}

export async function radioBrowserClick(c: ApiContext) {
  const uuid = requiredParam(c, "uuid");
  return fetchJson(c, new URL(`url/${encodedPath(uuid)}`, RADIO_BASE));
}

export async function openverseSearch(c: ApiContext, media: string) {
  const normalized = media === "image" || media === "images" ? "images" : "audio";
  const url = new URL(`${normalized}/`, OPENVERSE_BASE);
  url.searchParams.set("q", queryOrRequired(c));
  applyLimit(c, url, "page_size");
  url.searchParams.set("page", c.req.query("page") || "1");
  for (const key of ["source", "license", "license_type", "category", "extension", "length"]) {
    const value = c.req.query(key);
    if (value) {
      url.searchParams.set(key, value);
    }
  }
  return fetchJson(c, url);
}

export async function openverseLookup(c: ApiContext, media: string) {
  const normalized = media === "image" || media === "images" ? "images" : "audio";
  return fetchJson(c, new URL(`${normalized}/${encodedPath(requiredParam(c, "id"))}/`, OPENVERSE_BASE));
}

export async function openverseMeta(c: ApiContext, media: string, resource: string) {
  const normalized = media === "image" || media === "images" ? "images" : "audio";
  const metaResource = resource === "sources" ? "stats" : pathResource(resource);
  return fetchJson(c, new URL(`${normalized}/${metaResource}/`, OPENVERSE_BASE));
}

export async function wikidataSearch(c: ApiContext, entityType = "item") {
  const url = new URL(WIKIDATA_BASE);
  url.searchParams.set("action", "wbsearchentities");
  url.searchParams.set("format", "json");
  url.searchParams.set("language", c.req.query("language") || "en");
  url.searchParams.set("uselang", c.req.query("uselang") || "en");
  url.searchParams.set("type", entityType === "properties" ? "property" : "item");
  applyLimit(c, url);
  url.searchParams.set("search", queryOrRequired(c));
  url.searchParams.set("origin", "*");
  return fetchJson(c, url, { cf: { cacheTtl: 3600, cacheEverything: true } });
}

export async function wikidataEntities(c: ApiContext) {
  const ids = c.req.param("ids") || c.req.query("ids");
  if (!ids) {
    throw new ApiError(400, "Provide Wikidata ids in the path or ?ids=Q...");
  }
  const url = new URL(WIKIDATA_BASE);
  url.searchParams.set("action", "wbgetentities");
  url.searchParams.set("format", "json");
  url.searchParams.set("languages", c.req.query("languages") || "en");
  url.searchParams.set("ids", ids);
  url.searchParams.set("origin", "*");
  return fetchJson(c, url, { cf: { cacheTtl: 3600, cacheEverything: true } });
}

export async function wikidataClaims(c: ApiContext) {
  const entity = requiredParam(c, "id");
  const url = new URL(WIKIDATA_BASE);
  url.searchParams.set("action", "wbgetclaims");
  url.searchParams.set("format", "json");
  url.searchParams.set("entity", entity);
  const property = c.req.query("property");
  if (property) {
    url.searchParams.set("property", property);
  }
  url.searchParams.set("origin", "*");
  return fetchJson(c, url, { cf: { cacheTtl: 3600, cacheEverything: true } });
}

function wikimediaHost(project: string, language = "en") {
  const projectMap: Record<string, string> = {
    wikipedia: `${language}.wikipedia.org`,
    wikibooks: `${language}.wikibooks.org`,
    wikiquote: `${language}.wikiquote.org`,
    wikinews: `${language}.wikinews.org`,
    wikiversity: `${language}.wikiversity.org`,
    wiktionary: `${language}.wiktionary.org`,
    wikisource: `${language}.wikisource.org`,
    commons: "commons.wikimedia.org"
  };
  return projectMap[project] || projectMap.wikipedia;
}

export async function wikimediaSearch(c: ApiContext, project: string) {
  const host = wikimediaHost(project, c.req.query("language") || "en");
  const url = new URL(`https://${host}/w/api.php`);
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", queryOrRequired(c));
  applyLimit(c, url, "srlimit");
  url.searchParams.set("origin", "*");
  return fetchJson(c, url, { cf: { cacheTtl: 3600, cacheEverything: true } });
}

export async function wikimediaSummary(c: ApiContext, project = "wikipedia") {
  const host = wikimediaHost(project, c.req.query("language") || "en");
  const title = requiredParam(c, "title");
  return fetchJson(c, new URL(`https://${host}/api/rest_v1/page/summary/${encodedPath(title)}`), {
    cf: { cacheTtl: 3600, cacheEverything: true }
  });
}

export async function listenBrainzStats(c: ApiContext, entity: string, range?: string) {
  const entityMap: Record<string, string> = {
    recordings: "recordings",
    artists: "artists",
    releases: "releases",
    "release-groups": "release-groups",
    "listening-activity": "listening-activity"
  };
  const url = new URL(`stats/sitewide/${entityMap[entity] || entity}`, LISTENBRAINZ_BASE);
  const selectedRange = range || c.req.query("range");
  if (selectedRange) {
    url.searchParams.set("range", selectedRange);
  }
  return fetchJson(c, url, { cf: { cacheTtl: 1800, cacheEverything: true } });
}

export async function listenBrainzLookup(c: ApiContext) {
  const url = new URL("metadata/lookup/", LISTENBRAINZ_BASE);
  for (const key of ["artist_name", "recording_name", "release_name", "metadata"]) {
    const value = c.req.query(key);
    if (value) {
      url.searchParams.set(key, value);
    }
  }
  if (!url.searchParams.size) {
    url.searchParams.set("recording_name", queryOrRequired(c));
  }
  return fetchJson(c, url, { cf: { cacheTtl: 1800, cacheEverything: true } });
}

export async function listenBrainzPopularity(c: ApiContext, resource: string) {
  const mbid = requiredParam(c, "mbid");
  const resourceMap: Record<string, string> = {
    recordings: `popularity/top-recordings-for-artist/${encodedPath(mbid)}`,
    "release-groups": `popularity/top-release-groups-for-artist/${encodedPath(mbid)}`
  };
  return fetchJson(c, new URL(resourceMap[resource] || resourceMap.recordings, LISTENBRAINZ_BASE), {
    cf: { cacheTtl: 1800, cacheEverything: true }
  });
}

export async function githubSearch(c: ApiContext, resource: string) {
  const resourceMap: Record<string, string> = {
    repositories: "search/repositories",
    repos: "search/repositories",
    topics: "search/topics",
    users: "search/users",
    issues: "search/issues",
    commits: "search/commits"
  };
  const url = new URL(resourceMap[resource] || "search/repositories", GITHUB_BASE);
  url.searchParams.set("q", queryOrDefault(c, "music api"));
  applyLimit(c, url, "per_page");
  const sort = c.req.query("sort");
  if (sort) {
    url.searchParams.set("sort", sort);
  }
  return fetchJson(c, url, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    cf: { cacheTtl: 900, cacheEverything: true }
  });
}

export async function githubRepo(c: ApiContext) {
  const owner = requiredParam(c, "owner");
  const repo = requiredParam(c, "repo");
  const connection = c.req.param("connection");
  const path = connection
    ? `repos/${encodedPath(owner)}/${encodedPath(repo)}/${pathResource(connection)}`
    : `repos/${encodedPath(owner)}/${encodedPath(repo)}`;
  return fetchJson(c, new URL(path, GITHUB_BASE), {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    cf: { cacheTtl: 900, cacheEverything: true }
  });
}

export async function odesliLinks(c: ApiContext) {
  const url = c.req.query("url");
  if (!url) {
    throw new ApiError(400, "Provide ?url=<song-or-album-url>.");
  }
  const endpoint = new URL(ODESLI_BASE);
  endpoint.searchParams.set("url", url);
  const userCountry = c.req.query("userCountry");
  if (userCountry) {
    endpoint.searchParams.set("userCountry", userCountry);
  }
  return fetchJson(c, endpoint, { cf: { cacheTtl: 3600, cacheEverything: true } });
}

export async function webSourceSearch(c: ApiContext, source: string, resource: string) {
  const normalizedSource = source.toLowerCase().replace(/_/g, "-");
  if (["jiosaavn", "jio-saavn", "jiosavan", "jio-savan"].includes(normalizedSource)) {
    return jioSaavnSearch(c, resource || "all");
  }
  if (normalizedSource === "gaana") {
    return gaanaSearch(c, resource || "tracks");
  }
  if (["spotify", "soundcloud", "bandcamp", "youtube-music", "youtube"].includes(normalizedSource)) {
    return legalWebLinkSearch(c, normalizedSource, resource || "tracks");
  }
  if (normalizedSource === "deezer") {
    return deezerSearch(c, resource);
  }
  if (normalizedSource === "openverse") {
    return openverseSearch(c, resource === "images" ? "images" : "audio");
  }
  if (normalizedSource === "wikidata") {
    return wikidataSearch(c, resource === "properties" ? "properties" : "items");
  }
  if (normalizedSource === "wikimedia" || normalizedSource === "wikipedia" || normalizedSource === "commons") {
    return wikimediaSearch(c, normalizedSource === "commons" ? "commons" : "wikipedia");
  }
  if (normalizedSource === "github") {
    return githubSearch(c, resource || "repositories");
  }
  if (normalizedSource === "radio" || normalizedSource === "radio-browser") {
    return radioBrowserStations(c, "search");
  }
  throw new ApiError(
    400,
    "Supported web sources: jiosaavn, gaana, spotify, soundcloud, bandcamp, youtube-music, deezer, openverse, wikidata, wikimedia, github, radio-browser."
  );
}
