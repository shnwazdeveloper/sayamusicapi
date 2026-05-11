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
  ["GET", "/docs", "core", "Human-readable documentation"],
  ["GET", "/site.css", "core", "Website stylesheet"],
  ["GET", "/health", "core", "Health check"],
  ["GET", "/alive", "core", "Alive check"],
  ["GET", "/ping", "core", "Ping check"],
  ["GET", "/status", "core", "Status check"],
  ["GET", "/version", "core", "Version and build metadata"],
  ["GET", "/v1", "core", "Versioned API welcome"],
  ["GET", "/v1/alive", "core", "Versioned alive check"],
  ["GET", "/v1/ping", "core", "Versioned ping check"],
  ["GET", "/v1/status", "core", "Versioned status check"],
  ["GET", "/v1/providers", "core", "Available providers"],
  ["GET", "/v1/endpoints", "core", "Endpoint registry"],
  ["GET", "/v1/openapi.json", "core", "OpenAPI document"],
  ["GET", "/v1/diagnostics", "core", "Runtime diagnostics"],
  ["GET", "/v1/diagnostics/routes", "core", "Route registry diagnostics"],
  ["GET", "/v1/diagnostics/sources", "core", "Provider source diagnostics"],
  ["GET", "/v1/diagnostics/live", "core", "Live upstream smoke-test guide"],
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
  query: ["q", "country"]
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
  query: ["q", "country", "offset"]
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
  query: ["q", "offset"]
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
  query: ["inc", "offset"]
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
  query: ["q", "page", "file", "redirect"]
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
  query: ["q", "genre", "time", "redirect"]
})) as EndpointDoc[];

function endpoint(
  provider: ProviderName,
  path: string,
  summary: string,
  query: string[] = ["q"]
): EndpointDoc {
  return {
    method: "GET",
    path,
    provider,
    summary,
    query
  };
}

const deezerResources = [
  "all",
  "tracks",
  "songs",
  "albums",
  "artists",
  "playlists",
  "podcasts",
  "radios",
  "users"
];
const deezerModes = [
  "by-title",
  "by-artist",
  "by-album",
  "by-isrc",
  "by-upc",
  "by-genre",
  "by-label",
  "by-year",
  "by-duration",
  "by-keyword"
];
const deezerSearchEndpoints = deezerResources.flatMap((resource) => [
  endpoint("deezer", `/v1/deezer/search/${resource}`, `Deezer ${resource} search`),
  ...deezerModes.map((mode) =>
    endpoint("deezer", `/v1/deezer/search/${resource}/${mode}`, `Deezer ${resource} search ${mode}`)
  )
]);
const deezerLookups = [
  "tracks",
  "albums",
  "artists",
  "playlists",
  "genres",
  "radios",
  "podcasts",
  "editorials",
  "users"
].flatMap((resource) => [
  endpoint("deezer", `/v1/deezer/${resource}/:id`, `Deezer ${resource} lookup`, ["id"]),
  endpoint("deezer", `/v1/deezer/${resource}/:id/tracks`, `Deezer ${resource} tracks`, ["id"]),
  endpoint("deezer", `/v1/deezer/${resource}/:id/albums`, `Deezer ${resource} albums`, ["id"]),
  endpoint("deezer", `/v1/deezer/${resource}/:id/artists`, `Deezer ${resource} artists`, ["id"])
]);
const deezer = [
  ...deezerSearchEndpoints,
  ...deezerLookups,
  endpoint("deezer", "/v1/deezer/chart", "Deezer global chart", []),
  endpoint("deezer", "/v1/deezer/chart/:id", "Deezer chart by country/genre ID", ["id"]),
  ...["tracks", "albums", "artists", "playlists", "podcasts"].map((connection) =>
    endpoint("deezer", `/v1/deezer/chart/:id/${connection}`, `Deezer chart ${connection}`, ["id"])
  )
];

const radioSelectors = [
  "search",
  "by-name",
  "by-name-exact",
  "by-country",
  "by-country-exact",
  "by-country-code",
  "by-state",
  "by-state-exact",
  "by-language",
  "by-language-exact",
  "by-tag",
  "by-tag-exact",
  "by-codec",
  "by-codec-exact",
  "by-uuid",
  "top-vote",
  "top-click",
  "last-click",
  "last-change"
];
const radioBrowser = [
  ...radioSelectors.map((selector) =>
    endpoint("radio-browser", `/v1/radio-browser/stations/${selector}`, `Radio Browser stations ${selector}`)
  ),
  ...["countries", "countrycodes", "codecs", "states", "languages", "tags"].map((list) =>
    endpoint("radio-browser", `/v1/radio-browser/lists/${list}`, `Radio Browser ${list} list`, [])
  ),
  endpoint("radio-browser", "/v1/radio-browser/url/:uuid", "Radio Browser stream click URL", ["uuid"])
];

const openverseMedia = ["audio", "images"];
const openverseModes = [
  "by-title",
  "by-creator",
  "by-tag",
  "by-source",
  "by-license",
  "by-category",
  "by-extension",
  "by-length",
  "safe",
  "public-domain",
  "commercial",
  "remixable"
];
const openverse = [
  ...openverseMedia.flatMap((media) => [
    endpoint("openverse", `/v1/openverse/search/${media}`, `Openverse ${media} search`),
    ...openverseModes.map((mode) =>
      endpoint("openverse", `/v1/openverse/search/${media}/${mode}`, `Openverse ${media} search ${mode}`)
    ),
    endpoint("openverse", `/v1/openverse/${media}/:id`, `Openverse ${media} lookup`, ["id"]),
    endpoint("openverse", `/v1/openverse/${media}/sources`, `Openverse ${media} sources`, []),
    endpoint("openverse", `/v1/openverse/${media}/stats`, `Openverse ${media} stats`, [])
  ])
];

const wikidataTypes = ["items", "properties", "songs", "albums", "artists", "genres", "labels", "works"];
const wikidataModes = [
  "music",
  "recording",
  "release",
  "artist",
  "album",
  "composer",
  "label",
  "genre",
  "instrument",
  "event"
];
const wikidata = [
  ...wikidataTypes.flatMap((type) => [
    endpoint("wikidata", `/v1/wikidata/search/${type}`, `Wikidata ${type} search`),
    ...wikidataModes.map((mode) =>
      endpoint("wikidata", `/v1/wikidata/search/${type}/${mode}`, `Wikidata ${type} search ${mode}`)
    )
  ]),
  endpoint("wikidata", "/v1/wikidata/entities/:ids", "Wikidata entity lookup", ["ids"]),
  endpoint("wikidata", "/v1/wikidata/claims/:id", "Wikidata claims lookup", ["id", "property"])
];

const wikimediaProjects = [
  "wikipedia",
  "commons",
  "wikibooks",
  "wikiquote",
  "wikinews",
  "wikiversity",
  "wiktionary",
  "wikisource"
];
const wikimediaModes = ["music", "artist", "album", "song", "genre", "label"];
const wikimedia = [
  ...wikimediaProjects.flatMap((project) => [
    endpoint("wikimedia", `/v1/wikimedia/search/${project}`, `Wikimedia ${project} search`),
    ...wikimediaModes.map((mode) =>
      endpoint("wikimedia", `/v1/wikimedia/search/${project}/${mode}`, `Wikimedia ${project} search ${mode}`)
    ),
    endpoint("wikimedia", `/v1/wikimedia/${project}/summary/:title`, `Wikimedia ${project} page summary`, ["title"])
  ])
];

const listenBrainzEntities = ["recordings", "artists", "releases", "release-groups", "listening-activity"];
const listenBrainzRanges = ["week", "month", "quarter", "year", "all_time"];
const listenbrainz = [
  ...listenBrainzEntities.flatMap((entityName) => [
    endpoint("listenbrainz", `/v1/listenbrainz/stats/sitewide/${entityName}`, `ListenBrainz sitewide ${entityName}`, ["range"]),
    ...listenBrainzRanges.map((range) =>
      endpoint(
        "listenbrainz",
        `/v1/listenbrainz/stats/sitewide/${entityName}/${range}`,
        `ListenBrainz sitewide ${entityName} ${range}`,
        []
      )
    )
  ]),
  endpoint("listenbrainz", "/v1/listenbrainz/metadata/lookup", "ListenBrainz metadata lookup", [
    "artist_name",
    "recording_name",
    "release_name"
  ]),
  endpoint("listenbrainz", "/v1/listenbrainz/popularity/:mbid/recordings", "ListenBrainz top recordings for artist", [
    "mbid"
  ]),
  endpoint(
    "listenbrainz",
    "/v1/listenbrainz/popularity/:mbid/release-groups",
    "ListenBrainz top release groups for artist",
    ["mbid"]
  )
];

const githubResources = ["repositories", "repos", "topics", "users", "issues", "commits"];
const githubModes = ["music", "api", "worker", "javascript", "typescript", "cloudflare", "metadata", "audio"];
const github = [
  ...githubResources.flatMap((resource) => [
    endpoint("github", `/v1/github/search/${resource}`, `GitHub ${resource} search`, ["q", "sort"]),
    ...githubModes.map((mode) =>
      endpoint("github", `/v1/github/search/${resource}/${mode}`, `GitHub ${resource} search ${mode}`, [
        "q",
        "sort"
      ])
    )
  ]),
  ...["languages", "releases", "tags", "contributors", "contents", "topics"].map((connection) =>
    endpoint("github", `/v1/github/repos/:owner/:repo/${connection}`, `GitHub repo ${connection}`, [
      "owner",
      "repo"
    ])
  ),
  endpoint("github", "/v1/github/repos/:owner/:repo", "GitHub repo lookup", ["owner", "repo"])
];

const odesli = [
  endpoint("odesli", "/v1/odesli/links", "Odesli smart-link resolver", ["url", "userCountry"]),
  endpoint("odesli", "/v1/odesli/song", "Odesli song-link resolver", ["url", "userCountry"]),
  endpoint("odesli", "/v1/odesli/album", "Odesli album-link resolver", ["url", "userCountry"]),
  endpoint("odesli", "/v1/odesli/podcast", "Odesli podcast-link resolver", ["url", "userCountry"])
];

const webSources = ["deezer", "openverse", "wikidata", "wikimedia", "wikipedia", "commons", "github", "radio-browser"];
const webResources = ["tracks", "albums", "artists", "playlists", "audio", "images", "repositories", "stations"];
const webModes = ["quick", "deep", "metadata", "artwork", "preview"];
const web = webSources.flatMap((source) =>
  webResources.flatMap((resource) => [
    endpoint("web", `/v1/web/${source}/search/${resource}`, `Unified web search via ${source} for ${resource}`),
    ...webModes.map((mode) =>
      endpoint("web", `/v1/web/${source}/search/${resource}/${mode}`, `Unified web search ${mode} via ${source}`)
    )
  ])
);

export const endpoints: EndpointDoc[] = [
  ...core,
  ...aggregate,
  ...apple,
  ...musicbrainzSearch,
  ...musicbrainzLookup,
  ...coverArt,
  ...archive,
  ...audius,
  ...deezer,
  ...radioBrowser,
  ...openverse,
  ...wikidata,
  ...wikimedia,
  ...listenbrainz,
  ...github,
  ...odesli,
  ...web
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
