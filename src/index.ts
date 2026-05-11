import { Hono } from "hono";
import { cors } from "hono/cors";
import { endpointCount, endpoints, buildOpenApi } from "./endpoints";
import { ApiError, jsonError, jsonOk, requiredParam, requiredQuery, yes } from "./http";
import { docsPage, landingPage, siteCss } from "./site";
import type { ApiBindings } from "./types";
import {
  aggregateSearch,
  autocomplete,
  discover,
  matchSong,
  mediaArtwork,
  mediaDownload,
  mediaPreview,
  mediaQuality,
  mediaStream,
  resolveUrl
} from "./providers/aggregate";
import {
  appleLookup,
  appleLookupByKey,
  applePreview,
  appleSearch
} from "./providers/apple";
import {
  archiveAdvanced,
  archiveFileUrl,
  archiveFiles,
  archiveMetadata,
  archivePlayable,
  archiveSearch
} from "./providers/archive";
import {
  audiusGet,
  audiusPlaylistTracks,
  audiusSearch,
  audiusTrack,
  audiusTrackStream,
  audiusTrending,
  audiusUserTracks
} from "./providers/audius";
import {
  coverArtFileUrl,
  coverArtImageUrl,
  coverArtJson,
  coverArtLookup
} from "./providers/coverArt";
import {
  mbBrowse,
  mbIsrc,
  mbLookup,
  mbLookupResources,
  mbSearch,
  mbSearchResources
} from "./providers/musicbrainz";

const app = new Hono<ApiBindings>();

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400
  })
);

app.use("*", async (c, next) => {
  c.header("X-SayaMusicAPI", "0.1.0");
  await next();
});

app.onError((error, c) => jsonError(c, error));

app.notFound((c) =>
  jsonError(
    c,
    new ApiError(404, "Endpoint not found", {
      docs: "/docs"
    })
  )
);

const providers = [
  {
    id: "apple",
    name: "Apple/iTunes Search API",
    features: ["search", "lookup", "previews", "artwork", "store links"],
    auth: "none"
  },
  {
    id: "musicbrainz",
    name: "MusicBrainz",
    features: ["recordings", "artists", "releases", "relationships", "ISRC"],
    auth: "none"
  },
  {
    id: "cover-art",
    name: "Cover Art Archive",
    features: ["release artwork", "release group artwork", "thumbnail redirects"],
    auth: "none"
  },
  {
    id: "archive",
    name: "Internet Archive",
    features: ["free/public media search", "metadata", "file links"],
    auth: "none"
  },
  {
    id: "audius",
    name: "Audius",
    features: ["open music search", "trending", "streams"],
    auth: "optional AUDIUS_API_KEY recommended"
  }
];

function welcome(origin: string) {
  return {
    name: "SayaMusicAPI",
    version: "0.1.0",
    endpointCount,
    docs: {
      docs: `${origin}/docs`,
      endpoints: `${origin}/v1/endpoints`,
      openapi: `${origin}/v1/openapi.json`,
      health: `${origin}/health`
    },
    examples: [
      `${origin}/v1/search/tracks?q=alan%20walker`,
      `${origin}/v1/apple/search/songs?q=believer`,
      `${origin}/v1/musicbrainz/search/recordings?q=dua%20lipa`,
      `${origin}/v1/archive/search/music?q=jazz`
    ]
  };
}

app.get("/", (c) => c.html(landingPage(new URL(c.req.url).origin)));
app.get("/docs", (c) => c.html(docsPage(new URL(c.req.url).origin)));
app.get("/site.css", (c) =>
  c.text(siteCss(), 200, {
    "Content-Type": "text/css; charset=utf-8",
    "Cache-Control": "public, max-age=3600"
  })
);
app.get("/health", (c) =>
  jsonOk(c, {
    status: "ok",
    version: "0.1.0",
    endpointCount
  })
);
app.get("/version", (c) =>
  jsonOk(c, {
    version: "0.1.0",
    runtime: "cloudflare-workers",
    endpointCount
  })
);
app.get("/v1", (c) => jsonOk(c, welcome(new URL(c.req.url).origin)));
app.get("/v1/providers", (c) => jsonOk(c, providers));
app.get("/v1/endpoints", (c) => jsonOk(c, endpoints, { count: endpointCount }));
app.get("/v1/openapi.json", (c) => c.json(buildOpenApi(new URL(c.req.url).origin)));
app.get("/v1/quality", (c) =>
  jsonOk(c, {
    policy:
      "This API resolves legal metadata, previews, artwork, open streams, and public/free downloads. It does not bypass paywalls or DRM.",
    apiSideLimits:
      "No API-side quota, paid tier, or gateway rate limit is added by SayaMusicAPI. Provider result page sizes use each upstream public maximum where required.",
    tiers: [
      {
        source: "apple",
        type: "preview",
        note: "Short preview clips returned by Apple/iTunes."
      },
      {
        source: "audius",
        type: "stream",
        note: "Open music streams where the Audius API grants access."
      },
      {
        source: "archive",
        type: "public files",
        note: "Formats and sizes come from item metadata."
      }
    ]
  })
);
app.get("/v1/legal", (c) =>
  jsonOk(c, {
    message:
      "SayaMusicAPI is built for legal discovery and playback. Use official provider URLs, preview clips, open Audius streams, and Internet Archive files according to each provider license.",
    noPiracy:
      "The API intentionally does not scrape or download copyrighted songs from unauthorized websites."
  })
);
app.get("/v1/sources", (c) =>
  jsonOk(c, {
    apple:
      "Apple/iTunes Search API for search, lookup, previewUrl, and artwork metadata.",
    musicbrainz:
      "MusicBrainz REST API for structured artist, recording, release, and relationship metadata.",
    coverArt:
      "Cover Art Archive for release and release-group artwork.",
    archive:
      "Internet Archive advanced search and metadata APIs for public/free media files.",
    audius:
      "Audius REST API for open music catalog search and stream resolution. AUDIUS_API_KEY is recommended."
  })
);

app.get("/v1/search", (c) => jsonOk(c, aggregateSearch(c, "tracks")));
app.get("/v1/search/tracks", (c) => jsonOk(c, aggregateSearch(c, "tracks")));
app.get("/v1/search/albums", (c) => jsonOk(c, aggregateSearch(c, "albums")));
app.get("/v1/search/artists", (c) => jsonOk(c, aggregateSearch(c, "artists")));
app.get("/v1/search/music-videos", (c) =>
  jsonOk(c, aggregateSearch(c, "music-videos"))
);
app.get("/v1/search/podcasts", (c) => jsonOk(c, aggregateSearch(c, "podcasts")));
app.get("/v1/search/audiobooks", (c) =>
  jsonOk(c, aggregateSearch(c, "audiobooks"))
);
app.get("/v1/discover", (c) => jsonOk(c, discover(c)));
app.get("/v1/autocomplete", (c) => jsonOk(c, autocomplete(c)));
app.get("/v1/match", (c) => jsonOk(c, matchSong(c)));
app.get("/v1/resolve", (c) => jsonOk(c, resolveUrl(c)));
app.get("/v1/media/preview", (c) => jsonOk(c, mediaPreview(c)));
app.get("/v1/media/stream", async (c) => {
  const data = await mediaStream(c);
  if (yes(c, "redirect") && typeof (data as any).streamUrl === "string") {
    return c.redirect((data as any).streamUrl, 302);
  }
  return jsonOk(c, data);
});
app.get("/v1/media/download", async (c) => {
  const data = await mediaDownload(c);
  if (yes(c, "redirect") && typeof (data as any).downloadUrl === "string") {
    return c.redirect((data as any).downloadUrl, 302);
  }
  return jsonOk(c, data);
});
app.get("/v1/media/quality", (c) => jsonOk(c, mediaQuality(c)));
app.get("/v1/media/artwork", (c) => jsonOk(c, mediaArtwork(c)));

app.get("/v1/apple/search", (c) => jsonOk(c, appleSearch(c)));
app.get("/v1/apple/search/songs", (c) =>
  jsonOk(c, appleSearch(c, { media: "music", entity: "song" }))
);
app.get("/v1/apple/search/albums", (c) =>
  jsonOk(c, appleSearch(c, { media: "music", entity: "album" }))
);
app.get("/v1/apple/search/artists", (c) =>
  jsonOk(c, appleSearch(c, { media: "music", entity: "musicArtist" }))
);
app.get("/v1/apple/search/music-videos", (c) =>
  jsonOk(c, appleSearch(c, { entity: "musicVideo" }))
);
app.get("/v1/apple/search/podcasts", (c) =>
  jsonOk(c, appleSearch(c, { media: "podcast", entity: "podcast" }))
);
app.get("/v1/apple/search/audiobooks", (c) =>
  jsonOk(c, appleSearch(c, { media: "audiobook", entity: "audiobook" }))
);
app.get("/v1/apple/lookup/:id", (c) => jsonOk(c, appleLookup(c)));
app.get("/v1/apple/tracks/:id", (c) => jsonOk(c, appleLookup(c, "song")));
app.get("/v1/apple/albums/:id", (c) => jsonOk(c, appleLookup(c, "album")));
app.get("/v1/apple/artists/:id", (c) => jsonOk(c, appleLookup(c, "musicArtist")));
app.get("/v1/apple/albums/:id/tracks", (c) => jsonOk(c, appleLookup(c, "song")));
app.get("/v1/apple/artists/:id/albums", (c) => jsonOk(c, appleLookup(c, "album")));
app.get("/v1/apple/artists/:id/songs", (c) =>
  jsonOk(c, appleLookup(c, "song"))
);
app.get("/v1/apple/upc/:upc", (c) =>
  jsonOk(c, appleLookupByKey(c, "upc", requiredParam(c, "upc"), "song"))
);
app.get("/v1/apple/isbn/:isbn", (c) =>
  jsonOk(c, appleLookupByKey(c, "isbn", requiredParam(c, "isbn")))
);
app.get("/v1/apple/preview/:id", (c) => jsonOk(c, applePreview(c)));

for (const resource of Object.keys(mbSearchResources)) {
  app.get(`/v1/musicbrainz/search/${resource}`, (c) => jsonOk(c, mbSearch(c, resource)));
}

app.get("/v1/musicbrainz/artists/:id/releases", (c) =>
  jsonOk(c, mbBrowse(c, "release", "artist", requiredParam(c, "id")))
);
app.get("/v1/musicbrainz/artists/:id/recordings", (c) =>
  jsonOk(c, mbBrowse(c, "recording", "artist", requiredParam(c, "id")))
);
app.get("/v1/musicbrainz/artists/:id/release-groups", (c) =>
  jsonOk(c, mbBrowse(c, "release-group", "artist", requiredParam(c, "id")))
);
app.get("/v1/musicbrainz/releases/:id/recordings", (c) =>
  jsonOk(c, mbLookup(c, "releases", requiredParam(c, "id"), "recordings+media+artists"))
);
app.get("/v1/musicbrainz/recordings/:id/relations", (c) =>
  jsonOk(
    c,
    mbLookup(
      c,
      "recordings",
      requiredParam(c, "id"),
      "artist-rels+work-rels+url-rels+release-rels"
    )
  )
);
app.get("/v1/musicbrainz/isrc/:isrc", (c) => jsonOk(c, mbIsrc(c)));

for (const resource of Object.keys(mbLookupResources)) {
  app.get(`/v1/musicbrainz/${resource}/:id`, (c) =>
    jsonOk(c, mbLookup(c, resource))
  );
}

app.get("/v1/cover-art/release/:id", (c) => jsonOk(c, coverArtJson(c, "release")));
app.get("/v1/cover-art/release/:id/front", (c) =>
  c.redirect(coverArtImageUrl("release", requiredParam(c, "id"), "front").toString(), 302)
);
app.get("/v1/cover-art/release/:id/back", (c) =>
  c.redirect(coverArtImageUrl("release", requiredParam(c, "id"), "back").toString(), 302)
);
app.get("/v1/cover-art/release/:id/file/:file", (c) =>
  c.redirect(
    coverArtFileUrl(requiredParam(c, "id"), requiredParam(c, "file")).toString(),
    302
  )
);
app.get("/v1/cover-art/release-group/:id", (c) =>
  jsonOk(c, coverArtJson(c, "release-group"))
);
app.get("/v1/cover-art/release-group/:id/front", (c) =>
  c.redirect(
    coverArtImageUrl("release-group", requiredParam(c, "id"), "front").toString(),
    302
  )
);
app.get("/v1/cover-art/release-group/:id/front/:size", (c) =>
  c.redirect(
    coverArtImageUrl(
      "release-group",
      requiredParam(c, "id"),
      "front",
      requiredParam(c, "size")
    ).toString(),
    302
  )
);
app.get("/v1/cover-art/lookup", (c) => jsonOk(c, coverArtLookup(c)));

app.get("/v1/archive/search/audio", (c) => jsonOk(c, archiveSearch(c, "audio")));
app.get("/v1/archive/search/music", (c) => jsonOk(c, archiveSearch(c, "music")));
app.get("/v1/archive/search/live", (c) => jsonOk(c, archiveSearch(c, "live")));
app.get("/v1/archive/advanced", (c) => jsonOk(c, archiveAdvanced(c)));
app.get("/v1/archive/metadata/:identifier", (c) => jsonOk(c, archiveMetadata(c)));
app.get("/v1/archive/items/:identifier/files", (c) => jsonOk(c, archiveFiles(c)));
app.get("/v1/archive/items/:identifier/stream", async (c) => {
  const data = await archivePlayable(c);
  if (yes(c, "redirect") && typeof (data as any).streamUrl === "string") {
    return c.redirect((data as any).streamUrl, 302);
  }
  return jsonOk(c, data);
});
app.get("/v1/archive/items/:identifier/download", async (c) => {
  const data = await archivePlayable(c);
  if (yes(c, "redirect") && typeof (data as any).downloadUrl === "string") {
    return c.redirect((data as any).downloadUrl, 302);
  }
  return jsonOk(c, data);
});
app.get("/v1/archive/items/:identifier/file/:file", (c) =>
  c.redirect(
    archiveFileUrl(requiredParam(c, "identifier"), requiredParam(c, "file")).toString(),
    302
  )
);
app.get("/v1/archive/items/:identifier", (c) => jsonOk(c, archiveMetadata(c)));

app.get("/v1/audius/search/tracks", (c) => jsonOk(c, audiusSearch(c, "tracks")));
app.get("/v1/audius/search/users", (c) => jsonOk(c, audiusSearch(c, "users")));
app.get("/v1/audius/search/playlists", (c) =>
  jsonOk(c, audiusSearch(c, "playlists"))
);
app.get("/v1/audius/tracks/:id", (c) => jsonOk(c, audiusTrack(c)));
app.get("/v1/audius/tracks/:id/stream", async (c) => {
  const data = await audiusTrackStream(c);
  if (yes(c, "redirect") && typeof (data as any).streamUrl === "string") {
    return c.redirect((data as any).streamUrl, 302);
  }
  return jsonOk(c, data);
});
app.get("/v1/audius/tracks/:id/stems", (c) =>
  jsonOk(c, audiusGet(c, `/tracks/${requiredParam(c, "id")}/stems`))
);
app.get("/v1/audius/users/:id", (c) =>
  jsonOk(c, audiusGet(c, `/users/${requiredParam(c, "id")}`))
);
app.get("/v1/audius/users/:id/tracks", (c) => jsonOk(c, audiusUserTracks(c)));
app.get("/v1/audius/playlists/:id", (c) =>
  jsonOk(c, audiusGet(c, `/playlists/${requiredParam(c, "id")}`))
);
app.get("/v1/audius/playlists/:id/tracks", (c) =>
  jsonOk(c, audiusPlaylistTracks(c))
);
app.get("/v1/audius/trending/tracks", (c) =>
  jsonOk(c, audiusTrending(c, "tracks"))
);
app.get("/v1/audius/trending/playlists", (c) =>
  jsonOk(c, audiusTrending(c, "playlists"))
);

export default app;
