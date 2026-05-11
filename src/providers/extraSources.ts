import type { ApiContext } from "../http";
import { ApiError, applyLimit, encodedPath, fetchJson, requestedLimit, requiredParam, requiredQuery } from "../http";

const DEEZER_BASE = "https://api.deezer.com/";
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
  if (source === "deezer") {
    return deezerSearch(c, resource);
  }
  if (source === "openverse") {
    return openverseSearch(c, resource === "images" ? "images" : "audio");
  }
  if (source === "wikidata") {
    return wikidataSearch(c, resource === "properties" ? "properties" : "items");
  }
  if (source === "wikimedia" || source === "wikipedia" || source === "commons") {
    return wikimediaSearch(c, source === "commons" ? "commons" : "wikipedia");
  }
  if (source === "github") {
    return githubSearch(c, resource || "repositories");
  }
  if (source === "radio" || source === "radio-browser") {
    return radioBrowserStations(c, "search");
  }
  throw new ApiError(400, "Supported web sources: deezer, openverse, wikidata, wikimedia, github, radio-browser.");
}
