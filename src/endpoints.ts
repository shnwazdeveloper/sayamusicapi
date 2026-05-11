import type { ProviderName } from "./types";

export type EndpointDoc = {
  method: "GET";
  path: string;
  provider: ProviderName;
  summary: string;
  query?: string[];
};

const core: EndpointDoc[] = [
  ["GET", "/", "core", "API welcome and quick links"],
  ["GET", "/health", "core", "Health check"],
  ["GET", "/version", "core", "Version and build metadata"],
  ["GET", "/v1", "core", "Versioned API welcome"],
  ["GET", "/v1/providers", "core", "Available providers"],
  ["GET", "/v1/endpoints", "core", "Endpoint registry"],
  ["GET", "/v1/openapi.json", "core", "OpenAPI document"],
  ["GET", "/v1/quality", "core", "Quality tiers and legal media policy"],
  ["GET", "/v1/legal", "core", "Legal usage notes"],
  ["GET", "/v1/sources", "core", "Upstream provider source notes"]
].map(([method, path, provider, summary]) => ({
  method,
  path,
  provider,
  summary
})) as EndpointDoc[];

const aggregate: EndpointDoc[] = [
  ["/v1/search", "Aggregate search across legal providers"],
  ["/v1/search/tracks", "Aggregate track search"],
  ["/v1/search/albums", "Aggregate album search"],
  ["/v1/search/artists", "Aggregate artist search"],
  ["/v1/search/music-videos", "Aggregate music video search"],
  ["/v1/search/podcasts", "Aggregate podcast search"],
  ["/v1/search/audiobooks", "Aggregate audiobook search"],
  ["/v1/discover", "Discover music by provider and type"],
  ["/v1/autocomplete", "Fast search suggestions"],
  ["/v1/match", "Match a song by artist and title"],
  ["/v1/resolve", "Resolve a provider URL where supported"],
  ["/v1/media/preview", "Find a legal short preview URL"],
  ["/v1/media/stream", "Resolve a legal open stream"],
  ["/v1/media/download", "Resolve a legal public download"],
  ["/v1/media/quality", "Describe available quality for a media item"],
  ["/v1/media/artwork", "Resolve artwork from Apple or Cover Art Archive"]
].map(([path, summary]) => ({
  method: "GET",
  path,
  provider: "aggregate",
  summary,
  query: ["q", "limit", "country"]
})) as EndpointDoc[];

const apple: EndpointDoc[] = [
  ["/v1/apple/search", "Apple/iTunes search"],
  ["/v1/apple/search/songs", "Apple/iTunes song search"],
  ["/v1/apple/search/albums", "Apple/iTunes album search"],
  ["/v1/apple/search/artists", "Apple/iTunes artist search"],
  ["/v1/apple/search/music-videos", "Apple/iTunes music video search"],
  ["/v1/apple/search/podcasts", "Apple/iTunes podcast search"],
  ["/v1/apple/search/audiobooks", "Apple/iTunes audiobook search"],
  ["/v1/apple/lookup/:id", "Apple/iTunes lookup by ID"],
  ["/v1/apple/tracks/:id", "Apple/iTunes track lookup"],
  ["/v1/apple/albums/:id", "Apple/iTunes album lookup"],
  ["/v1/apple/artists/:id", "Apple/iTunes artist lookup"],
  ["/v1/apple/albums/:id/tracks", "Apple/iTunes album tracks"],
  ["/v1/apple/artists/:id/albums", "Apple/iTunes artist albums"],
  ["/v1/apple/artists/:id/songs", "Apple/iTunes artist songs"],
  ["/v1/apple/upc/:upc", "Apple/iTunes UPC lookup"],
  ["/v1/apple/isbn/:isbn", "Apple/iTunes ISBN lookup"],
  ["/v1/apple/preview/:id", "Apple/iTunes legal preview URL"]
].map(([path, summary]) => ({
  method: "GET",
  path,
  provider: "apple",
  summary,
  query: ["q", "limit", "country", "offset"]
})) as EndpointDoc[];

const musicbrainzSearch = [
  "recordings",
  "artists",
  "releases",
  "release-groups",
  "works",
  "labels",
  "areas",
  "places",
  "events",
  "instruments",
  "series",
  "urls",
  "tags",
  "annotations"
].map((resource) => ({
  method: "GET",
  path: `/v1/musicbrainz/search/${resource}`,
  provider: "musicbrainz",
  summary: `MusicBrainz ${resource} search`,
  query: ["q", "limit", "offset"]
})) as EndpointDoc[];

const musicbrainzLookup = [
  ["recordings", "recording lookup"],
  ["artists", "artist lookup"],
  ["releases", "release lookup"],
  ["release-groups", "release group lookup"],
  ["works", "work lookup"],
  ["labels", "label lookup"],
  ["areas", "area lookup"],
  ["places", "place lookup"],
  ["events", "event lookup"],
  ["instruments", "instrument lookup"],
  ["series", "series lookup"],
  ["urls", "URL lookup"],
  ["artists/:id/releases", "browse releases by artist"],
  ["artists/:id/recordings", "browse recordings by artist"],
  ["artists/:id/release-groups", "browse release groups by artist"],
  ["releases/:id/recordings", "release recordings"],
  ["recordings/:id/relations", "recording relationships"],
  ["isrc/:isrc", "ISRC lookup"]
].map(([path, summary]) => ({
  method: "GET",
  path: path.includes(":id") || path.includes(":isrc")
    ? `/v1/musicbrainz/${path}`
    : `/v1/musicbrainz/${path}/:id`,
  provider: "musicbrainz",
  summary: `MusicBrainz ${summary}`,
  query: ["inc", "limit", "offset"]
})) as EndpointDoc[];

const coverArt: EndpointDoc[] = [
  ["/v1/cover-art/release/:id", "Release cover art JSON"],
  ["/v1/cover-art/release/:id/front", "Release front cover redirect"],
  ["/v1/cover-art/release/:id/back", "Release back cover redirect"],
  ["/v1/cover-art/release/:id/file/:file", "Release cover file redirect"],
  ["/v1/cover-art/release-group/:id", "Release group cover art JSON"],
  ["/v1/cover-art/release-group/:id/front", "Release group front cover redirect"],
  ["/v1/cover-art/release-group/:id/front/:size", "Release group front thumbnail redirect"],
  ["/v1/cover-art/lookup", "Cover art lookup by release or release group"]
].map(([path, summary]) => ({
  method: "GET",
  path,
  provider: "cover-art",
  summary
})) as EndpointDoc[];

const archive: EndpointDoc[] = [
  ["/v1/archive/search/audio", "Internet Archive audio search"],
  ["/v1/archive/search/music", "Internet Archive music search"],
  ["/v1/archive/search/live", "Internet Archive live music search"],
  ["/v1/archive/advanced", "Internet Archive advanced search"],
  ["/v1/archive/metadata/:identifier", "Internet Archive metadata"],
  ["/v1/archive/items/:identifier", "Internet Archive item metadata"],
  ["/v1/archive/items/:identifier/files", "Internet Archive item files"],
  ["/v1/archive/items/:identifier/stream", "Internet Archive playable stream redirect or info"],
  ["/v1/archive/items/:identifier/download", "Internet Archive file download redirect or info"],
  ["/v1/archive/items/:identifier/file/:file", "Internet Archive specific file redirect"]
].map(([path, summary]) => ({
  method: "GET",
  path,
  provider: "archive",
  summary,
  query: ["q", "limit", "page", "file", "redirect"]
})) as EndpointDoc[];

const audius: EndpointDoc[] = [
  ["/v1/audius/search/tracks", "Audius track search"],
  ["/v1/audius/search/users", "Audius user search"],
  ["/v1/audius/search/playlists", "Audius playlist search"],
  ["/v1/audius/tracks/:id", "Audius track lookup"],
  ["/v1/audius/tracks/:id/stream", "Audius stream URL"],
  ["/v1/audius/tracks/:id/stems", "Audius track stems"],
  ["/v1/audius/users/:id", "Audius user lookup"],
  ["/v1/audius/users/:id/tracks", "Audius user tracks"],
  ["/v1/audius/playlists/:id", "Audius playlist lookup"],
  ["/v1/audius/playlists/:id/tracks", "Audius playlist tracks"],
  ["/v1/audius/trending/tracks", "Audius trending tracks"],
  ["/v1/audius/trending/playlists", "Audius trending playlists"]
].map(([path, summary]) => ({
  method: "GET",
  path,
  provider: "audius",
  summary,
  query: ["q", "limit", "genre", "time", "redirect"]
})) as EndpointDoc[];

export const endpoints: EndpointDoc[] = [
  ...core,
  ...aggregate,
  ...apple,
  ...musicbrainzSearch,
  ...musicbrainzLookup,
  ...coverArt,
  ...archive,
  ...audius
];

export const endpointCount = endpoints.length;

export function buildOpenApi(origin: string) {
  const paths = Object.fromEntries(
    endpoints.map((endpoint) => [
      endpoint.path.replace(/:([A-Za-z0-9_-]+)/g, "{$1}"),
      {
        get: {
          summary: endpoint.summary,
          tags: [endpoint.provider],
          responses: {
            "200": {
              description: "Successful response"
            },
            "400": {
              description: "Invalid request"
            },
            "502": {
              description: "Upstream provider error"
            }
          }
        }
      }
    ])
  );

  return {
    openapi: "3.1.0",
    info: {
      title: "SayaMusicAPI",
      version: "0.1.0",
      description:
        "Legal music search, metadata, artwork, previews, and open/free stream resolver for Cloudflare Workers."
    },
    servers: [{ url: origin }],
    paths
  };
}

